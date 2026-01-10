# main.py
import os
# app/meta.py
"""
MetaModel: a small routing model that ingests simple numeric features
and outputs a softmax over provided expert names. Uses PyTorch if available,
otherwise falls back to a deterministic heuristic.
"""

from typing import List, Dict
import numpy as np

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
"""
Lightweight expert class stubs. Replace process(...) methods with your real model inference.
Also includes a ForensicAudioAnalyzer skeleton used by /forensics_pdf.
"""

from typing import List, Dict, Tuple, Optional
import numpy as np

# === Expert stubs ===
class BaseExpert:
    def __init__(self):
        pass

    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        raise NotImplementedError

class EmotionExpert(BaseExpert):
    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        # Placeholder: return dummy emotion
        return {"prediction": {"emotion": "neutral", "confidence": 0.9}}

class SceneEventExpert(BaseExpert):
    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        # Placeholder: background/environment detection
        return {
            "model": "scene-v1",
            "events": [],
            "threats": [],
            "environment": {"primary": "indoor", "confidence": 0.8},
            "scene_analysis": {},
        }

class DeepfakeExpert(BaseExpert):
    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        # Placeholder deepfake score
        return {"prediction": {"is_deepfake": False, "score": 0.02}}

class VADExpert(BaseExpert):
    def process(self, waveform: np.ndarray, sr: int) -> List[Dict]:
        # Very simple energy-based VAD stub: return one segment covering entire signal if non-empty
        n = len(waveform)
        if n == 0:
            return []
        return [{"start_sample": 0, "end_sample": n, "start_time": 0.0, "end_time": n/sr}]

class DiarizationExpert(BaseExpert):
    def process(self, speech_segments: List[Dict], sr: int, waveform: np.ndarray) -> List[Dict]:
        # Return a single diarized segment mapping speech to speaker 1
        diarized = []
        for seg in speech_segments:
            diarized.append({
                "speaker": "spk_1",
                "start_time": seg.get("start_time"),
                "end_time": seg.get("end_time"),
                "start_sample": seg.get("start_sample"),
                "end_sample": seg.get("end_sample"),
            })
        return diarized

class ASRExpert(BaseExpert):
    def process(self, diarized_segments: List[Dict], sr: int, waveform: np.ndarray) -> Tuple[List[Dict], str]:
        # Return dummy transcription and detected language
        segments = []
        for seg in diarized_segments:
            segments.append({
                "speaker": seg.get("speaker"),
                "start_time": seg.get("start_time"),
                "end_time": seg.get("end_time"),
                "transcript": "dummy transcription",
            })
        return segments, "en"

class LinguisticExpert(BaseExpert):
    def process(self, transcribed_segments: List[Dict]) -> List[Dict]:
        # simple pass-through or minor enrichment
        return transcribed_segments

class UnificationExpert(BaseExpert):
    def process(self, linguistic_segments: List[Dict], metadata: Dict) -> Dict:
        # Combine transcripts into final structure
        transcript_text = " ".join([s.get("transcript", "") for s in linguistic_segments])
        speakers = [{"id": "spk_1", "role": "unknown"}]
        return {
            "transcript": transcript_text,
            "speakers": speakers,
            "metadata": metadata,
        }
# audio_utils.py
import librosa
import soundfile as sf
import numpy as np

def load_audio(path: str, target_sr: int = 16000):
    audio, sr = librosa.load(path, sr=None, mono=True)
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)
        sr = target_sr
    return audio, sr

def normalize(audio: np.ndarray):
    peak = np.max(np.abs(audio))
    if peak > 0:
        return audio / peak
    return audio

def trim_silence(audio: np.ndarray, top_db: int = 30):
    trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
    return trimmed

def save_wav(path: str, audio: np.ndarray, sr: int = 16000):
    sf.write(path, audio, sr)

def process_audio_pipeline(path: str):
    audio, sr = load_audio(path)
    audio = trim_silence(audio)
    audio = normalize(audio)
    save_wav(path, audio, sr)
    return path

class QnaExpert(BaseExpert):
    def route(self, question: str):
        """
        Decide which experts are necessary for the question.
        Very simple heuristics: keywords -> experts
        """
        q = question.lower()
        tools = set()
        if any(k in q for k in ["who", "speaker", "who said", "speaker name"]):
            tools.add("asr_diarization")
        if any(k in q for k in ["background", "noise", "environment", "where"]):
            tools.add("background")
        if any(k in q for k in ["emotion", "feeling", "mood"]):
            tools.add("emotion")
        if any(k in q for k in ["deepfake", "fake", "manipulated", "synthetic"]):
            tools.add("deepfake")
        if not tools:
            tools.add("full")
        return list(tools)

    def answer(self, question: str, context_str: str) -> str:
        # Placeholder: naive echo + context summary
        return f"Q: {question}\n\nContext: {context_str[:100]}..."

# === Forensic analyzer skeleton ===
class ForensicAudioAnalyzer:
    def __init__(self, data: Dict, audio_path: Optional[str] = None):
        self.data = data
        self.audio_path = audio_path
        self.llm = None
        self.tokenizer = None

    @classmethod
    def from_dict(cls, data: Dict, audio_path: Optional[str] = None):
        return cls(data, audio_path=audio_path)

    def process_audio_metadata(self):
        # populate internal metadata
        return

    def process_asr_transcript(self):
        return

    def process_speaker_diarization(self):
        return

    def process_emotion_forensics(self):
        return

    def process_environment_forensics(self):
        return

    def process_threat_event_forensics(self):
        return

    def process_translation_forensics(self):
        return

    def process_authenticity_forensics(self):
        return

    def build_executive_summary(self):
        # create a summary blob inside self.data
        self.data.setdefault("executive_summary", "No summary available")
        return

    def build_final_conclusion(self):
        self.data.setdefault("final_conclusion", "No conclusion available")
        return

    def _init_llm(self):
        # Optionally initialize an LLM (Gemma-2-2B etc.) - optional in your environment
        try:
            import transformers  # or your LLM of choice
            # initialize only if available and desired
            self.llm = None
            self.tokenizer = None
        except Exception:
            self.llm = None
            self.tokenizer = None

    def enhance_report_text_if_available(self):
        # If LLM is available, call to enhance; otherwise it's no-op
        if self.llm is None:
            return
        # else perform enhancement (implementation specific)
        return

    def generate_all_plots(self, save_dir: str):
        # Save placeholder plots or real ones if implemented
        ensure_dir = None
        try:
            from app.utils import ensure_dir
            ensure_dir(save_dir)
        except Exception:
            pass
        return

    def build_pdf_report(self, output_path: str):
        # Create a minimal PDF so endpoint can return something if nothing else.
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            c = canvas.Canvas(output_path, pagesize=letter)
            c.drawString(72, 720, "Forensic Audio Report")
            c.drawString(72, 700, f"Summary: {self.data.get('executive_summary', '')}")
            c.save()
        except Exception:
            # Fallback: write simple text into .pdf file (still may not be valid PDF)
            with open(output_path, "wb") as f:
                f.write(b"%PDF-1.4\n% Dummy fallback\n")
        return

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import base64
import json
import uuid
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel

from app.config import TARGET_SAMPLE_RATE  # keep if exists; else set constant
from app.utils import (
    AUDIO_STORE,
    load_audio,
    ensure_dir,
    load_log,
    save_log,
    resolve_audio,
    log_gpu,
    clear_gpu_cache,
)
from app.experts import (
    EmotionExpert,
    SceneEventExpert,
    DeepfakeExpert,
    VADExpert,
    DiarizationExpert,
    ASRExpert,
    LinguisticExpert,
    UnificationExpert,
    QnaExpert,
    ForensicAudioAnalyzer,
)
from app.meta import MetaModel

app = FastAPI(title="Audio Multi-Expert API (split modules)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize experts and meta model once
emotion_expert = EmotionExpert()
scene_expert = SceneEventExpert()
deepfake_expert = DeepfakeExpert()
vad_expert = VADExpert()
diarization_expert = DiarizationExpert()
asr_expert = ASRExpert()
linguistic_expert = LinguisticExpert()
unification_expert = UnificationExpert()
qna_expert = QnaExpert()

# meta model will take lightweight features and recommend experts
meta_model = MetaModel(expert_names=[
    "emotion",
    "background",
    "deepfake",
    "asr_diarization",
    "full",
])

class UploadBytesRequest(BaseModel):
    audio_id: Optional[str] = None
    data: str
    ext: str = "wav"

class QnaRequest(BaseModel):
    audio_id: str
    question: str

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

    log_gpu("before SceneEventExpert")
    cache = load_log(resolved_id, "background")
    if cache is not None:
        clear_gpu_cache("end /background (cache)")
        return JSONResponse(cache)

    result = scene_expert.process(waveform, sr)
    log_gpu("after SceneEventExpert")

    packed = {
        "model": result["model"],
        "events": result["events"],
        "threats": result["threats"],
        "environment": result["environment"],
        "metadata": {
            "audio_file": name,
            "audio_id": resolved_id,
            "path": path,
            "sample_rate": sr,
            "total_duration": len(waveform) / sr,
        },
    }
    save_log(resolved_id, "background", packed)
    clear_gpu_cache("end /background")
    return JSONResponse(packed)

import numpy as np
@app.post("/foreground_background_waveforms")
async def foreground_background_waveforms(
    audio_id: Optional[str] = Form(default=None),
    file: Optional[UploadFile] = File(default=None),
):
    try:
        waveform, sr, path, name, resolved_id = resolve_audio(audio_id, file)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

    if not isinstance(waveform, np.ndarray):
        waveform = np.array(waveform, dtype=np.float32)
    else:
        waveform = waveform.astype(np.float32)

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
            "model": scene_res["model"],
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

    full_cache = load_log(resolved_id, "full")

    if full_cache is not None:
        full_data = full_cache
    else:
        asr_cache = load_log(resolved_id, "asr_diarization")
        bg_cache = load_log(resolved_id, "background")
        emo_cache = load_log(resolved_id, "emotion")
        df_cache = load_log(resolved_id, "deepfake")

        if bg_cache is None:
            speech_segments = vad_expert.process(waveform, sr)
            fg_mask = np.zeros(len(waveform), dtype=bool)
            for seg in speech_segments:
                s = max(0, int(seg["start_sample"]))
                e = min(len(waveform), int(seg["end_sample"]))
                fg_mask[s:e] = True
            background_waveform = waveform[~fg_mask]

            scene_res = scene_expert.process(waveform, sr)
            bg_cache = {
                "model": scene_res["model"],
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

        if emo_cache is None:
            emo_cache = emotion_expert.process(waveform, sr)
            emo_cache["metadata"] = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            }
            save_log(resolved_id, "emotion", emo_cache)

        if df_cache is None:
            df_cache = deepfake_expert.process(waveform, sr)
            df_cache["metadata"] = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
            }
            save_log(resolved_id, "deepfake", df_cache)

        if asr_cache is None:
            speech_segments = vad_expert.process(waveform, sr)
            if not speech_segments:
                clear_gpu_cache("end /forensics_pdf (no speech)")
                return JSONResponse({"error": "no speech detected"})
            diarized_segments = diarization_expert.process(speech_segments, sr, waveform)
            transcribed_segments, det_lang = asr_expert.process(
                diarized_segments, sr, waveform
            )
            linguistic_segments = linguistic_expert.process(transcribed_segments)
            metadata = {
                "audio_file": name,
                "audio_id": resolved_id,
                "path": path,
                "sample_rate": sr,
                "total_duration": total_duration,
                "language": det_lang,
            }
            asr_cache = unification_expert.process(linguistic_segments, metadata)
            save_log(resolved_id, "asr_diarization", asr_cache)

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

    # Forensic analyzer
    try:
        analyzer = ForensicAudioAnalyzer.from_dict(full_data, audio_path=path)
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

        # optionally init LLM inside analyzer if implemented
        analyzer.enhance_report_text_if_available()

        plot_dir = "./forensic_plots"
        ensure_dir(plot_dir)
        analyzer.generate_all_plots(save_dir=plot_dir)

        output_pdf_dir = "./forensic_reports"
        ensure_dir(output_pdf_dir)
        output_pdf = os.path.join(output_pdf_dir, f"{resolved_id}_forensic_report.pdf")
        analyzer.build_pdf_report(output_path=output_pdf)

        save_log(resolved_id, "forensics_pdf", {"pdf_path": output_pdf})
        clear_gpu_cache("end /forensics_pdf")
        return FileResponse(
            output_pdf,
            media_type="application/pdf",
            filename=f"{resolved_id}_forensic_report.pdf",
        )
    except Exception as e:
        clear_gpu_cache("error /forensics_pdf")
        import traceback
        return JSONResponse({"error": str(e), "traceback": traceback.format_exc()}, status_code=500)

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

    # Query meta model to recommend experts (optional)
    features = {
        "duration_sec": len(waveform) / sr,
        "has_audio": 1,
    }
    recommended = meta_model.recommend(features, topk=3)

    tools = qna_expert.route(question)
    results = {}

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

    if "background" in tools or "full" in tools:
        cached = load_log(audio_id, "background")
        if cached is None:
            log_gpu("before SceneEventExpert(/qna)")
            scene_res = scene_expert.process(waveform, sr)
            log_gpu("after SceneEventExpert(/qna)")
            cached = {
                "model": scene_res["model"],
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
        "emotion": results.get("emotion", {}).get("prediction")
        if isinstance(results.get("emotion"), dict)
        and "prediction" in results["emotion"]
        else results.get("emotion"),
        "deepfake": results.get("deepfake", {}).get("prediction"),
    }
    context_str = json.dumps(context, ensure_ascii=False, indent=2)

    log_gpu("before QnaExpert.answer")
    answer = qna_expert.answer(question, context_str)
    log_gpu("after QnaExpert.answer")

    clear_gpu_cache("end /qna")
    return JSONResponse(
        {
            "audio_id": audio_id,
            "question": question,
            "selected_experts": tools,
            "recommended_experts": recommended,
            "answer": answer,
            "context_used": context,
        }
    )

def load_audio(path: str, target_sr: int):
    """
    Minimal loader using soundfile or fallback to numpy.
    Replace with your preferred loader (librosa/soundfile).
    """
    try:
        import soundfile as sf
        data, sr = sf.read(path, always_2d=False)
        if data.ndim > 1:
            data = np.mean(data, axis=1)
        if sr != target_sr:
            try:
                import resampy
                data = resampy.resample(data, sr, target_sr)
            except Exception:
                # fallback: naive down/up-sample by slicing/padding
                pass
            sr = target_sr
        return np.asarray(data, dtype=np.float32), sr
    except Exception:
        # as a last resort, read raw bytes and treat as float32 (not ideal)
        with open(path, "rb") as f:
            raw = f.read()
        arr = np.frombuffer(raw, dtype=np.float32)
        return arr, target_sr


def save_log(audio_id: str, key: str, obj):
    ensure_dir(LOG_DIR)
    path = os.path.join(LOG_DIR, f"{audio_id}.{key}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2)


def load_log(audio_id: str, key: str):
    path = os.path.join(LOG_DIR, f"{audio_id}.{key}.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None


def resolve_audio(audio_id: Optional[str], file) -> Tuple:
    """
    If audio_id provided load from uploaded_audio or AUDIO_STORE.
    If file provided, save it to uploaded_audio and return it.
    """
    ensure_dir(UPLOADED_DIR)
    if audio_id:
        folder = UPLOADED_DIR
        candidates = [
            os.path.join(folder, f)
            for f in os.listdir(folder)
            if f.startswith(audio_id + ".") or f == audio_id
        ]
        if not candidates:
            # check AUDIO_STORE
            if audio_id in AUDIO_STORE and os.path.exists(AUDIO_STORE[audio_id]):
                path = AUDIO_STORE[audio_id]
                waveform, sr = load_audio(path, 16000)
                return waveform, sr, path, os.path.basename(path), audio_id
            raise FileNotFoundError(f"audio_id {audio_id} not found")
        path = candidates[0]
        waveform, sr = load_audio(path, 16000)
        return waveform, sr, path, os.path.basename(path), audio_id

    if file is not None:
        ext = os.path.splitext(file.filename)[-1] or ".wav"
        new_id = str(uuid.uuid4())
        ensure_dir(UPLOADED_DIR)
        path = os.path.join(UPLOADED_DIR, f"{new_id}{ext}")
        with open(path, "wb") as f:
            f.write(file.file.read())
        AUDIO_STORE[new_id] = path
        waveform, sr = load_audio(path, 16000)
        return waveform, sr, path, file.filename, new_id

    raise ValueError("Either audio_id or file must be provided")


# Lightweight GPU logging helpers preserved as no-op hooks for instrumentation parity.
def log_gpu(msg: str):
    # Implement metrics/logging integration if desired (or leave no-op)
    return


def clear_gpu_cache(msg: str):
    # Hook: clear GPU or free caches if required
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
    return