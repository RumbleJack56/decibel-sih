#main.py
import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import base64
import json
import uuid
from typing import Optional
from typing import List, Dict
import numpy as np
import torch

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from transformers import AutoTokenizer, AutoModelForCausalLM

from app.config import TARGET_SAMPLE_RATE
from app.utils import AUDIO_STORE, load_audio, ensure_dir, load_log, save_log
from app.utils import log_gpu, clear_gpu_cache
from app.experts_emotion import EmotionExpert
from app.experts_scene import SceneEventExpert
from app.experts_deepfake import DeepfakeExpert
from app.experts_vad_diarization import (
    VADExpert,
    DiarizationExpert,
    ASRExpert,
    LinguisticExpert,
    UnificationExpert,
)
from app.experts_qna import QnAExpert
from app.forensics import ForensicAudioAnalyzer

# Global device
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Disable gradients globally for inference
torch.set_grad_enabled(False)

app = FastAPI(title="Audio Multi-Expert API (ROCm, logging, QnA)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[main] Initializing")

from transformers import AutoTokenizer, AutoModelForCausalLM

# Model id (instruction-tuned)
QWEN_MODEL = "Qwen/Qwen2.5-0.5B-Instruct"

# If you have multiple GPUs and want HF to dispatch automatically, use device_map="auto".
# If you want explicit single-device placement, use map_location or .to(DEVICE).
# Use torch_dtype="auto" to let HF pick float16 on GPU when supported.
try:
    tokenizer = AutoTokenizer.from_pretrained(QWEN_MODEL, trust_remote_code=True)
    llm = AutoModelForCausalLM.from_pretrained(
        QWEN_MODEL,
        torch_dtype="auto",
        device_map="auto",      # or use {"": DEVICE} for explicit mapping if you prefer
        trust_remote_code=True,
    )
    # Models loaded with device_map="auto" are already placed on devices by HF.
    llm.eval()
except Exception as e:
    print(f"[main] Failed to load Qwen model {QWEN_MODEL}: {e}")
    raise
class MetaModel:
    def __init__(self, expert_names: List[str], use_torch: bool = True):
        self.expert_names = expert_names
        self.n_experts = len(expert_names)
        self.use_torch = use_torch
        self.model = None
        if self.use_torch:
            try:
                import torch
                import torch.nn as nn
                class SmallNet(nn.Module):
                    def __init__(self, in_dim, out_dim):
                        super().__init__()
                        self.net = nn.Sequential(
                            nn.Linear(in_dim, max(8, in_dim*2)),
                            nn.ReLU(),
                            nn.Linear(max(8, in_dim*2), out_dim),
                        )
                    def forward(self, x):
                        return self.net(x)
                # default in_dim=2 for duration + has_audio; you can re-init later
                self.model = SmallNet(2, self.n_experts)
                self._torch = torch
                self._nn = nn
            except Exception:
                # fallback
                self.use_torch = False
                self.model = None

    def recommend(self, features: Dict[str, float], topk: int = 2) -> List[str]:
        """
        features: {'duration_sec': float, 'has_audio': 1.0, ...}
        returns top-k expert names (strings)
        """
        # canonicalize input vector (duration, has_audio)
        dur = float(features.get("duration_sec", 0.0))
        has = float(features.get("has_audio", 1.0))
        x = np.array([dur, has], dtype=np.float32).reshape(1, -1)

        if self.use_torch and self.model is not None:
            torch = self._torch
            model = self.model
            model.eval()
            with torch.no_grad():
                xt = torch.from_numpy(x)
                logits = model(xt).numpy().reshape(-1)
                probs = self._softmax(logits)
        else:
            # simple heuristic fallback:
            # - if duration < 1s => recommend VAD/background only
            # - if duration between 1-5s => emotion + background
            # - else => full pipeline
            if dur < 1.0:
                probs = np.zeros(self.n_experts, dtype=float)
                for i, name in enumerate(self.expert_names):
                    if "background" in name:
                        probs[i] = 0.9
                    else:
                        probs[i] = 0.1 / max(1, self.n_experts-1)
            elif dur < 5.0:
                probs = np.zeros(self.n_experts, dtype=float)
                for i, name in enumerate(self.expert_names):
                    if name in ("emotion", "background"):
                        probs[i] = 0.45
                    else:
                        probs[i] = 0.1 / max(1, self.n_experts-2)
            else:
                probs = np.zeros(self.n_experts, dtype=float)
                for i, name in enumerate(self.expert_names):
                    if name in ("full", "asr_diarization"):
                        probs[i] = 0.45
                    else:
                        probs[i] = 0.1 / max(1, self.n_experts-2)

        idx = np.argsort(-probs)[:topk]
        return [self.expert_names[i] for i in idx.tolist()]

    @staticmethod
    def _softmax(x):
        e = np.exp(x - np.max(x))
        return e / e.sum()
# app/experts.py



print("[main] Initializing experts...")
emotion_expert = EmotionExpert()
scene_expert = SceneEventExpert()
deepfake_expert = DeepfakeExpert()
vad_expert = VADExpert()
diarization_expert = DiarizationExpert()
asr_expert = ASRExpert()
linguistic_expert = LinguisticExpert()
unification_expert = UnificationExpert()
qna_expert = QnAExpert()

print("[main] Experts initialized")


class UploadBytesRequest(BaseModel):
    audio_id: Optional[str] = None
    data: str
    ext: str = "wav"

class QnaRequest(BaseModel):
    audio_id: str
    question: str

def resolve_audio(audio_id: Optional[str], file: Optional[UploadFile]):
    if audio_id:
        folder = "./uploaded_audio"
        if not os.path.isdir(folder):
            raise FileNotFoundError(f"audio_id {audio_id} not found (no uploaded_audio folder)")
        candidates = [
            os.path.join(folder, f)
            for f in os.listdir(folder)
            if f.startswith(audio_id + ".") or f == audio_id
        ]
        if not candidates:
            raise FileNotFoundError(f"audio_id {audio_id} not found")
        path = candidates[0]
        waveform, sr = load_audio(path, TARGET_SAMPLE_RATE)
        return waveform, sr, path, os.path.basename(path), audio_id

    if file is not None:
        ext = os.path.splitext(file.filename)[-1] or ".wav"
        new_id = str(uuid.uuid4())
        ensure_dir("./uploaded_audio")
        path = os.path.join("./uploaded_audio", f"{new_id}{ext}")
        with open(path, "wb") as f:
            f.write(file.file.read())
        AUDIO_STORE[new_id] = path
        waveform, sr = load_audio(path, TARGET_SAMPLE_RATE)
        return waveform, sr, path, file.filename, new_id

    raise ValueError("Either audio_id or file must be provided")

@app.post("/upload_bytes")
async def upload_bytes(req: UploadBytesRequest):
    audio_id = req.audio_id or str(uuid.uuid4())
    raw = base64.b64decode(req.data)
    ensure_dir("./uploaded_audio")
    path = os.path.join("./uploaded_audio", f"{audio_id}.{req.ext}")
    with open(path, "wb") as f:
        f.write(raw)
    AUDIO_STORE[audio_id] = path
    return {"audio_id": audio_id, "path": path}

@app.post("/emotion")
async def emotion_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    log_gpu("before EmotionExpert")
    cache = load_log(resolved_id, "emotion")
    if cache is not None:
        print("[/emotion] using cache")
        clear_gpu_cache("end /emotion (cache)")
        return JSONResponse(cache)

    result = emotion_expert.process(waveform, sr)
    log_gpu("after EmotionExpert")

    result["metadata"] = {
        "audio_file": name,
        "audio_id": resolved_id,
        "path": path,
        "sample_rate": sr,
        "total_duration": len(waveform) / sr,
    }
    save_log(resolved_id, "emotion", result)
    clear_gpu_cache("end /emotion")
    return JSONResponse(result)

@app.post("/deepfake")
async def deepfake_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    log_gpu("before DeepfakeExpert")
    cache = load_log(resolved_id, "deepfake")
    if cache is not None:
        print("[/deepfake] using cache")
        clear_gpu_cache("end /deepfake (cache)")
        return JSONResponse(cache)

    result = deepfake_expert.process(waveform, sr)
    log_gpu("after DeepfakeExpert")

    result["metadata"] = {
        "audio_file": name,
        "audio_id": resolved_id,
        "path": path,
        "sample_rate": sr,
        "total_duration": len(waveform) / sr,
    }
    save_log(resolved_id, "deepfake", result)
    clear_gpu_cache("end /deepfake")
    return JSONResponse(result)

@app.post("/background")
async def background_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    total_duration = len(waveform) / sr

    log_gpu("before load background")
    bg_cache = load_log(resolved_id, "background")
    log_gpu("after load background")

    if bg_cache is None:
        log_gpu("before SceneEventExpert")
        scene_res = scene_expert.process(waveform, sr)
        log_gpu("after SceneEventExpert")

        bg_cache = {
            "events": scene_res["events"],
            "threats": scene_res["threats"],
            "environment": scene_res["environment"],
            "metadata": {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            },
        }
        save_log(resolved_id, "background", bg_cache)

    clear_gpu_cache("end /background")
    return JSONResponse(bg_cache)

@app.post("/foreground_background_waveforms")
async def foreground_background_waveforms(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    waveform = np.asarray(waveform, dtype=np.float32)
    n = len(waveform)

    log_gpu("before VAD(/foreground_background_waveforms)")
    speech_segments = vad_expert.process(waveform, sr)
    log_gpu("after VAD(/foreground_background_waveforms)")

    fg_mask = np.zeros(n, dtype=bool)
    for seg in speech_segments:
        s = max(0, int(seg["start_sample"]))
        e = min(n, int(seg["end_sample"]))
        fg_mask[s:e] = True

    fg_wave = waveform[fg_mask]
    bg_wave = waveform[~fg_mask]

    def to_b64(arr: np.ndarray) -> str:
        if arr.size == 0:
            return ""
        arr = arr.astype(np.float32)
        return base64.b64encode(arr.tobytes()).decode("utf-8")

    fg_b64 = to_b64(fg_wave)
    bg_b64 = to_b64(bg_wave)

    result = {
        "audio_id": resolved_id,
        "file": name,
        "sample_rate": sr,
        "num_samples": int(n),
        "duration_sec": float(n / sr),
        "foreground_num_samples": int(fg_wave.size),
        "background_num_samples": int(bg_wave.size),
        "foreground_b64": fg_b64,
        "background_b64": bg_b64,
        "dtype": "float32",
    }

    clear_gpu_cache("end /foreground_background_waveforms")
    return JSONResponse(result)

@app.post("/asr_diarization")
async def asr_diarization_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    log_gpu("before VAD")
    speech_segments = vad_expert.process(waveform, sr)
    log_gpu("after VAD")

    if not speech_segments:
        clear_gpu_cache("end /asr_diarization (no speech)")
        return JSONResponse({"error": "no speech detected"})

    log_gpu("before Diarization")
    diarized_segments = diarization_expert.process(speech_segments, sr, waveform)
    log_gpu("after Diarization")

    log_gpu("before ASR")
    transcribed_segments, detected_language = asr_expert.process(
        diarized_segments, sr, waveform
    )
    log_gpu("after ASR")

    log_gpu("before LinguisticExpert")
    linguistic_segments = linguistic_expert.process(transcribed_segments)
    log_gpu("after LinguisticExpert")

    metadata = {
        "audio_file": name,
        "audio_id": resolved_id,
        "path": path,
        "sample_rate": sr,
        "total_duration": len(waveform) / sr,
        "language": detected_language,
    }

    log_gpu("before UnificationExpert")
    output = unification_expert.process(linguistic_segments, metadata)
    log_gpu("after UnificationExpert")

    save_log(resolved_id, "asr_diarization", output)
    clear_gpu_cache("end /asr_diarization")
    return JSONResponse(output)

@app.post("/full")
async def full_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    total_duration = len(waveform) / sr

    full_cache = load_log(resolved_id, "full")
    if full_cache is not None:
        print("[/full] using cache")
        clear_gpu_cache("end /full (cache)")
        return JSONResponse(full_cache)

    asr_cache = load_log(resolved_id, "asr_diarization")
    bg_cache = load_log(resolved_id, "background")
    emo_cache = load_log(resolved_id, "emotion")
    df_cache = load_log(resolved_id, "deepfake")

    if bg_cache is None:
        log_gpu("before SceneEventExpert(/full)")
        scene_res = scene_expert.process(waveform, sr)
        log_gpu("after SceneEventExpert(/full)")
        bg_cache = {
            "events": scene_res["events"],
            "threats": scene_res["threats"],
            "environment": scene_res["environment"],
            "metadata": {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            },
        }
        save_log(resolved_id, "background", bg_cache)

    if emo_cache is None:
        log_gpu("before EmotionExpert(/full)")
        emo_cache = emotion_expert.process(waveform, sr)
        log_gpu("after EmotionExpert(/full)")
        emo_cache["metadata"] = {
            "audio_file": name,
            "audio_id": resolved_id,
            "path": path,
            "sample_rate": sr,
            "total_duration": total_duration,
        }
        save_log(resolved_id, "emotion", emo_cache)

    if df_cache is None:
        log_gpu("before DeepfakeExpert(/full)")
        df_cache = deepfake_expert.process(waveform, sr)
        log_gpu("after DeepfakeExpert(/full)")
        df_cache["metadata"] = {
            "audio_file": name,
            "audio_id": resolved_id,
            "path": path,
            "sample_rate": sr,
            "total_duration": total_duration,
        }
        save_log(resolved_id, "deepfake", df_cache)

    if asr_cache is None:
        log_gpu("before VAD(/full)")
        speech_segments = vad_expert.process(waveform, sr)
        log_gpu("after VAD(/full)")
        if not speech_segments:
            clear_gpu_cache("end /full (no speech)")
            return JSONResponse({"error": "no speech detected"})
        log_gpu("before Diarization(/full)")
        diarized_segments = diarization_expert.process(speech_segments, sr, waveform)
        log_gpu("after Diarization(/full)")
        log_gpu("before ASR(/full)")
        transcribed_segments, det_lang = asr_expert.process(
            diarized_segments, sr, waveform
        )
        log_gpu("after ASR(/full)")
        log_gpu("before LinguisticExpert(/full)")
        linguistic_segments = linguistic_expert.process(transcribed_segments)
        log_gpu("after LinguisticExpert(/full)")
        metadata = {
            "audio_file": name,
            "audio_id": resolved_id,
            "path": path,
            "sample_rate": sr,
            "total_duration": total_duration,
            "language": det_lang,
        }
        log_gpu("before UnificationExpert(/full)")
        asr_cache = unification_expert.process(linguistic_segments, metadata)
        log_gpu("after UnificationExpert(/full)")
        save_log(resolved_id, "asr_diarization", asr_cache)

    output = dict(asr_cache)
    output["events"] = bg_cache["events"]
    output["threat_timeline"] = bg_cache["threats"]
    output["environment_context"] = {
        "primary_environment": bg_cache["environment"]["primary"],
        "environment_confidence": bg_cache["environment"]["confidence"],
        "threat_detected": len(bg_cache["threats"]) > 0,
        "threat_count": len(bg_cache["threats"]),
    }
    output["emotion_analysis"] = emo_cache
    output["deepfake_analysis"] = df_cache

    save_log(resolved_id, "full", output)
    clear_gpu_cache("end /full")
    return JSONResponse(output)

@app.post("/forensics_pdf")
async def forensics_pdf_route(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    total_duration = len(waveform) / sr

    log_gpu("before load full(/forensics_pdf)")
    full_cache = load_log(resolved_id, "full")
    log_gpu("after load full(/forensics_pdf)")

    if full_cache is not None:
        print("[/forensics_pdf] using cached full analysis")
        full_data = full_cache
    else:
        print("[/forensics_pdf] building full analysis from expert caches...")

        asr_cache = load_log(resolved_id, "asr_diarization")
        bg_cache = load_log(resolved_id, "background")
        emo_cache = load_log(resolved_id, "emotion")
        df_cache = load_log(resolved_id, "deepfake")

        # Scene/background
        if bg_cache is None:
            log_gpu("before SceneEventExpert(/forensics_pdf)")
            speech_segments = vad_expert.process(waveform, sr)

            fg_mask = np.zeros(len(waveform), dtype=bool)
            for seg in speech_segments:
                s = max(0, int(seg["start_sample"]))
                e = min(len(waveform), int(seg["end_sample"]))
                fg_mask[s:e] = True

            scene_res = scene_expert.process(waveform, sr)
            log_gpu("after SceneEventExpert(/forensics_pdf)")

            bg_cache = {
                "events": scene_res["events"],
                "threats": scene_res["threats"],
                "environment": scene_res["environment"],
                "scene_analysis": scene_res.get("scene_analysis", {}),
                "metadata": {
                    "audio_file": name,
                    "audio_id": resolved_id,
                    "path": path,
                    "sample_rate": sr,
                    "total_duration": total_duration,
                },
            }
            save_log(resolved_id, "background", bg_cache)

        # Emotion
        if emo_cache is None:
            log_gpu("before EmotionExpert(/forensics_pdf)")
            emo_cache = emotion_expert.process(waveform, sr)
            log_gpu("after EmotionExpert(/forensics_pdf)")

            emo_cache["metadata"] = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            }
            save_log(resolved_id, "emotion", emo_cache)

        # Deepfake
        if df_cache is None:
            log_gpu("before DeepfakeExpert(/forensics_pdf)")
            df_cache = deepfake_expert.process(waveform, sr)
            log_gpu("after DeepfakeExpert(/forensics_pdf)")

            df_cache["metadata"] = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            }
            save_log(resolved_id, "deepfake", df_cache)

        # ASR / Diarization
        if asr_cache is None:
            log_gpu("before VAD(/forensics_pdf)")
            speech_segments = vad_expert.process(waveform, sr)
            log_gpu("after VAD(/forensics_pdf)")

            if not speech_segments:
                clear_gpu_cache("end /forensics_pdf (no speech)")
                return JSONResponse({"error": "no speech detected"})

            log_gpu("before Diarization(/forensics_pdf)")
            diarized_segments = diarization_expert.process(speech_segments, sr, waveform)
            log_gpu("after Diarization(/forensics_pdf)")

            log_gpu("before ASR(/forensics_pdf)")
            transcribed_segments, det_lang = asr_expert.process(
                diarized_segments, sr, waveform
            )
            log_gpu("after ASR(/forensics_pdf)")

            log_gpu("before LinguisticExpert(/forensics_pdf)")
            linguistic_segments = linguistic_expert.process(transcribed_segments)
            log_gpu("after LinguisticExpert(/forensics_pdf)")

            metadata = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
                "language": det_lang,
            }

            log_gpu("before UnificationExpert(/forensics_pdf)")
            asr_cache = unification_expert.process(linguistic_segments, metadata)
            log_gpu("after UnificationExpert(/forensics_pdf)")

            save_log(resolved_id, "asr_diarization", asr_cache)

        # Assemble full_data
        full_data = dict(asr_cache)
        full_data["events"] = bg_cache["events"]
        full_data["threat_timeline"] = bg_cache["threats"]
        full_data["environment_context"] = {
            "primary_environment": bg_cache["environment"]["primary"],
            "environment_confidence": bg_cache["environment"]["confidence"],
            "threat_detected": len(bg_cache["threats"]) > 0,
            "threat_count": len(bg_cache["threats"]),
        }
        full_data["scene_analysis"] = bg_cache.get("scene_analysis", {})
        full_data["emotion_analysis"] = emo_cache
        full_data["deepfake_analysis"] = df_cache

        save_log(resolved_id, "full", full_data)

    # ForensicAudioAnalyzer + Gemma enhancement + plots + PDF
    print("[/forensics_pdf] Creating ForensicAudioAnalyzer...")

    try:
        analyzer = ForensicAudioAnalyzer.from_dict(
            full_data,
            audio_path=path,
            tokenizer=tokenizer,
            llm=llm,
        )

        analyzer.process_audio_metadata()
        analyzer.process_asr_transcript()
        analyzer.process_speaker_diarization()
        analyzer.process_emotion_forensics()
        analyzer.process_environment_forensics()
        analyzer.process_threat_event_forensics()
        analyzer.process_translation_forensics()
        analyzer.process_authenticity_forensics()

        analyzer.build_executive_summary()
        analyzer.build_final_conclusion()

        # LLM enhancement
        print("[/forensics_pdf] Enhancing report text...")
        log_gpu("before text enhancement")
        # ensure no grads
        with torch.no_grad():
            analyzer.enhance_report_text()
        log_gpu("after text enhancement")

        # Plots
        plot_dir = "./forensic_plots"
        os.makedirs(plot_dir, exist_ok=True)
        print("[/forensics_pdf] Generating plots...")
        analyzer.generate_all_plots(save_dir=plot_dir)

        # PDF
        output_pdf_dir = "./forensic_reports"
        os.makedirs(output_pdf_dir, exist_ok=True)
        output_pdf = os.path.join(
            output_pdf_dir, "forensic_report.pdf"
        )
        print("[/forensics_pdf] Building PDF...")
        out_pdf = analyzer.build_pdf_report(output_path=output_pdf)

        save_log(resolved_id, "forensics_pdf", {"pdf_path": out_pdf})

        clear_gpu_cache("end /forensics_pdf")

        print(f"[/forensics_pdf] PDF generated: {out_pdf}")
        # If fallback produced a JSON rather than a PDF, serve that.
        if out_pdf.endswith(".json"):
            return JSONResponse({"json_report": out_pdf})
        return FileResponse(
            out_pdf,
            media_type="application/pdf",
            filename=f"{resolved_id}_forensic_report.pdf",
        )

    except Exception as e:
        clear_gpu_cache("error /forensics_pdf")
        import traceback
        tb = traceback.format_exc()
        print(f"[/forensics_pdf] Error: {e}\n{tb}")
        return JSONResponse({"error": str(e), "traceback": tb}, status_code=500)

@app.post("/qna")
async def qna_route(req: QnaRequest):
    audio_id = req.audio_id
    question = req.question

    if not audio_id:
        return JSONResponse({"error": "audio_id required"}, status_code=400)

    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, None)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    tools = qna_expert.route(question)
    results: dict = {}

    # ---------- ASR + Diarization ----------
    if "asr_diarization" in tools or "full" in tools:
        cached = load_log(audio_id, "asr_diarization")
        if cached is None:
            log_gpu("before VAD(/qna)")
            speech_segments = vad_expert.process(waveform, sr)
            log_gpu("after VAD(/qna)")

            if speech_segments:
                log_gpu("before Diarization(/qna)")
                diarized_segments = diarization_expert.process(
                    speech_segments, sr, waveform
                )
                log_gpu("after Diarization(/qna)")

                log_gpu("before ASR(/qna)")
                transcribed_segments, det_lang = asr_expert.process(
                    diarized_segments, sr, waveform
                )
                log_gpu("after ASR(/qna)")

                log_gpu("before LinguisticExpert(/qna)")
                linguistic_segments = linguistic_expert.process(transcribed_segments)
                log_gpu("after LinguisticExpert(/qna)")

                metadata = {
                    "audio_file": name,
                    "audio_id": audio_id,
                    "path": path,
                    "sample_rate": sr,
                    "total_duration": len(waveform) / sr,
                    "language": det_lang,
                }

                log_gpu("before UnificationExpert(/qna)")
                cached = unification_expert.process(linguistic_segments, metadata)
                log_gpu("after UnificationExpert(/qna)")

                save_log(audio_id, "asr_diarization", cached)
        results["asr_diarization"] = cached

    # ---------- Background / Events ----------
    if "background" in tools or "full" in tools:
        cached = load_log(audio_id, "background")
        if cached is None:
            log_gpu("before SceneEventExpert(/qna)")
            scene_res = scene_expert.process(waveform, sr)
            log_gpu("after SceneEventExpert(/qna)")

            cached = {
                "events": scene_res["events"],
                "threats": scene_res["threats"],
                "environment": scene_res["environment"],
                "metadata": {
                    "audio_file": name,
                    "audio_id": audio_id,
                    "path": path,
                    "sample_rate": sr,
                    "total_duration": len(waveform) / sr,
                },
            }
            save_log(audio_id, "background", cached)
        results["background"] = cached

    # ---------- Emotion ----------
    if "emotion" in tools or "full" in tools:
        cached = load_log(audio_id, "emotion")
        if cached is None:
            log_gpu("before EmotionExpert(/qna)")
            emo_res = emotion_expert.process(waveform, sr)
            log_gpu("after EmotionExpert(/qna)")

            emo_res["metadata"] = {
                "audio_file": name,
                "audio_id": audio_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": len(waveform) / sr,
            }
            cached = emo_res
            save_log(audio_id, "emotion", cached)
        results["emotion"] = cached

    # ---------- Deepfake ----------
    if "deepfake" in tools or "full" in tools:
        cached = load_log(audio_id, "deepfake")
        if cached is None:
            log_gpu("before DeepfakeExpert(/qna)")
            df_res = deepfake_expert.process(waveform, sr)
            log_gpu("after DeepfakeExpert(/qna)")

            df_res["metadata"] = {
                "audio_file": name,
                "audio_id": audio_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": len(waveform) / sr,
            }
            cached = df_res
            save_log(audio_id, "deepfake", cached)
        results["deepfake"] = cached

    context = {
        "metadata": {"audio_id": audio_id, "file": name},
        "transcript": results.get("asr_diarization", {}).get("transcript"),
        "speakers": results.get("asr_diarization", {}).get("speakers"),
        "events": results.get("background", {}).get("events"),
        "threats": results.get("background", {}).get("threats"),
        "emotion": (
            results.get("emotion", {}).get("prediction")
            if isinstance(results.get("emotion"), dict)
            and "prediction" in results["emotion"]
            else results.get("emotion")
        ),
        "deepfake": results.get("deepfake", {}).get("prediction"),
    }

    context_str = json.dumps(context, ensure_ascii=False)

    log_gpu("before QnaExpert.answer")
    with torch.no_grad():
        answer = qna_expert.answer(
            question=question,
            context=context_str,
        )
    log_gpu("after QnaExpert.answer")

    clear_gpu_cache("end /qna")

    return JSONResponse(
        {
            "audio_id": audio_id,
            "question": question,
            "selected_experts": tools,
            "answer": answer,
            "context_used": context,
        }
    )
