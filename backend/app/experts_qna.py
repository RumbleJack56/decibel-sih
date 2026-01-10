from typing import List, Optional
import torch
import logging

logger = logging.getLogger(__name__)


class QnAExpert:
    """
    QnAExpert: tight routing and concise, context-driven answering.
    """

    _ALLOWED_TOOLS = {"asr_diarization", "background", "emotion", "deepfake", "full"}

    def __init__(
        self,
        tokenizer: Optional[object] = None,
        llm: Optional[object] = None,
        device: Optional[str] = None,
        max_input_tokens: int = 2048,
        max_generation_tokens: int = 64,
        max_answer_words: int = 20,
    ):
        self.tokenizer = tokenizer
        self.llm = llm
        self.max_input_tokens = int(max_input_tokens)
        self.max_generation_tokens = int(max_generation_tokens)
        self.max_answer_words = int(max_answer_words)

        if device:
            self.device = torch.device(device)
        elif self.llm is not None:
            try:
                self.device = next(self.llm.parameters()).device
            except Exception:
                self.device = torch.device("cpu")
        else:
            self.device = torch.device("cpu")

    def route(self, question: str) -> List[str]:
        if self.tokenizer is None or self.llm is None:
            return ["asr_diarization"]

        prompt = (
            "You are a systems assistant that selects the minimal set of analysis tools\n"
            "required to answer a user's forensic question about an audio recording.\n\n"
            "Available tools (choose from these exact names):\n"
            "- asr_diarization\n"
            "- background\n"
            "- emotion\n"
            "- deepfake\n"
            "- full\n\n"
            "Rules:\n"
            "1) Output only tool names. One tool name per line. No explanation.\n"
            "2) Choose the minimal set required.\n\n"
            "User question:\n"
            f"{question.strip()}\n\n"
            "Return tool names now:"
        )

        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_input_tokens,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.llm.generate(
                    **inputs,
                    max_new_tokens=32,
                    do_sample=False,
                    eos_token_id=self.tokenizer.eos_token_id,
                )

            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            decoded = decoded[len(prompt):].strip()

            tools = []
            seen = set()
            for line in decoded.splitlines():
                t = line.strip().strip("[](),. ")
                if t in self._ALLOWED_TOOLS and t not in seen:
                    seen.add(t)
                    tools.append(t)

            if not tools:
                ql = question.lower()
                if any(k in ql for k in ["fake", "deepfake", "authentic", "spoof"]):
                    return ["deepfake"]
                if any(k in ql for k in ["background", "noise", "environment"]):
                    return ["background"]
                if any(k in ql for k in ["emotion", "tone", "mood"]):
                    return ["emotion"]
                return ["asr_diarization"]

            return tools

        except Exception:
            return ["asr_diarization"]

    def answer(
        self,
        question: str,
        context: Optional[str] = None,
        extra_instructions: Optional[str] = None,
    ) -> str:
        if self.tokenizer is None or self.llm is None:
            return "Please try again."

        ctx_preview = context.strip() if isinstance(context, str) and context.strip() else "{}"

        instr = (
            "You are a concise forensic assistant. Use ONLY the factual JSON context provided. "
            "Do not invent facts. If the context lacks needed information, say so briefly. "
            f"Limit the answer to at most {self.max_answer_words} words.\n\n"
        )

        if extra_instructions:
            instr += extra_instructions.strip() + "\n\n"

        prompt = (
            instr
            + "Context:\n"
            + ctx_preview
            + "\n\nUser question:\n"
            + question.strip()
            + "\n\nAnswer:\n"
        )

        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_input_tokens,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.llm.generate(
                    **inputs,
                    max_new_tokens=self.max_generation_tokens,
                    do_sample=False,
                    eos_token_id=self.tokenizer.eos_token_id,
                )

            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True)

            if decoded.startswith(prompt):
                decoded = decoded[len(prompt):].strip()

            for line in decoded.splitlines():
                line = line.strip()
                if line:
                    answer = line
                    break
            else:
                return "Not enough evidence."

            # ONLY CHANGE: cut after the first sentence
            if "." in answer:
                answer = answer.split(".", 1)[0].strip() + "."

            words = answer.split()
            if len(words) > self.max_answer_words:
                answer = " ".join(words[: self.max_answer_words]).rstrip() + "."

            return answer

        except Exception:
            return "Please try again."
