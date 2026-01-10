from typing import List, Optional, Dict
import torch
import json
import logging

logger = logging.getLogger(__name__)

class QnAExpert:
    """
    QnAExpert: tight routing and concise, context-driven answering.

    Behavior changes:
      - Route: tight instruction prompt producing one tool name per line.
      - Answer: strongly prefers facts from the JSON context, produces short answers,
        returns 'Please try again.' on internal errors (no network/CORS text).
    """

    _ALLOWED_TOOLS = {"asr_diarization", "background", "emotion", "deepfake", "full"}

    def __init__(
        self,
        tokenizer: Optional[object] = None,
        llm: Optional[object] = None,
        device: Optional[str] = None,
        max_input_tokens: int = 2048,
        max_generation_tokens: int = 128,
        max_answer_words: int = 80,
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

    # Routing method unchanged in high level, keeps tight output requirements
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
            "1) Output only tool names. One tool name per line. No commas, no bullets, no explanation.\n"
            "2) Choose the minimal set required. Use 'full' only if the entire pipeline is necessary.\n\n"
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
                    max_new_tokens=64,
                    do_sample=False,
                    eos_token_id=self.tokenizer.eos_token_id if hasattr(self.tokenizer, "eos_token_id") else None,
                )

            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

            candidates = []
            for line in decoded.splitlines():
                line_clean = line.strip().strip("[](),. ")
                if not line_clean:
                    continue
                if line_clean in self._ALLOWED_TOOLS:
                    candidates.append(line_clean)

            # deduplicate preserving order
            seen = set()
            tools = []
            for t in candidates:
                if t not in seen:
                    seen.add(t)
                    tools.append(t)

            # fallback heuristics
            if not tools:
                ql = question.lower()
                if any(k in ql for k in ["fake", "deepfake", "authentic", "spoof"]):
                    return ["deepfake"]
                if any(k in ql for k in ["background", "noise", "environment", "wind", "traffic"]):
                    return ["background"]
                if any(k in ql for k in ["emotion", "angry", "sad", "happy", "tone", "mood"]):
                    return ["emotion"]
                return ["asr_diarization"]

            return tools

        except Exception:
            # swallow internal exceptions and return conservative default
            return ["asr_diarization"]

    # Answering: shorter, evidence-first, minimal user-facing errors
    def answer(self, question: str, context: Optional[str] = None, extra_instructions: Optional[str] = None) -> str:
        # If model/tokenizer not present, return a short retry message
        if self.tokenizer is None or self.llm is None:
            return "Please try again."

        # Build a tight prompt that forces evidence-first, short answers
        ctx_preview = (context.strip() if isinstance(context, str) and context.strip() else "{}")
        # Explicit instruction to draw from JSON and to be brief
        instr = (
            "You are a concise forensic assistant. Use ONLY the factual JSON context provided to answer the user's question. "
            "Prefer exact values from the JSON. Do not invent facts. If the context lacks needed information, say: 'Not enough evidence.' "
            f"Limit the answer to at most {self.max_answer_words} words and keep it a single short paragraph.\n\n"
        )
        if extra_instructions:
            instr += extra_instructions.strip() + "\n\n"

        prompt = (
            instr
            + "Context (JSON or structured):\n"
            + ctx_preview
            + "\n\nUser question:\n"
            + question.strip()
            + "\n\nProvide a short, factual answer now:"
        )

        try:
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_input_tokens,
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            # Generate deterministically and with conservative sampling parameters
            with torch.no_grad():
                outputs = self.llm.generate(
                    **inputs,
                    max_new_tokens=self.max_generation_tokens,
                    do_sample=False,
                    temperature=0.0,
                    top_p=0.9,
                    eos_token_id=self.tokenizer.eos_token_id if hasattr(self.tokenizer, "eos_token_id") else None,
                )

            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

            # If model echoes the prompt, attempt to strip prompt prefix (heuristic)
            answer_text = decoded
            if decoded.startswith(prompt):
                answer_text = decoded[len(prompt):].strip()

            # Trim to first paragraph
            answer_paragraph = answer_text.split("\n\n")[0].strip()

            # Enforce word limit strictly: return first N words
            words = answer_paragraph.split()
            if len(words) > self.max_answer_words:
                answer_paragraph = " ".join(words[: self.max_answer_words]).rstrip()
                # append ellipsis to indicate truncation
                answer_paragraph = answer_paragraph + "."

            # If answer is empty or too generic, return explicit 'not enough' message
            if not answer_paragraph or len(answer_paragraph) < 3:
                return "Not enough evidence."

            return answer_paragraph

        except Exception:
            # Minimal user-facing message; no CORS/network detail
            return "Please try again."
