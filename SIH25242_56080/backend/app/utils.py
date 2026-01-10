import os, gc, json
from typing import Dict, Optional
import torch
import librosa

AUDIO_STORE: Dict[str, str] = {}  # audio_id -> path

def device():
    return "cuda" if torch.cuda.is_available() else "cpu"

def clear_cache():
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def load_audio(path: str, target_sr: int = 16000):
    waveform, sr = librosa.load(path, sr=target_sr)
    return waveform, sr

def ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

def log_path(audio_id: str, model_key: str) -> str:
    ensure_dir("logdata")
    safe_key = model_key.replace("/", "_")
    return os.path.join("logdata", f"{audio_id}_{safe_key}.json")

def load_log(audio_id: str, model_key: str) -> Optional[dict]:
    path = log_path(audio_id, model_key)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def save_log(audio_id: str, model_key: str, data: dict):
    path = log_path(audio_id, model_key)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
import torch

def log_gpu(prefix: str = ""):
    if not torch.cuda.is_available():
        print(f"[GPU] {prefix} cuda not available")
        return
    dev = torch.cuda.current_device()
    mem_alloc = torch.cuda.memory_allocated(dev) / (1024**3)
    mem_reserved = torch.cuda.memory_reserved(dev) / (1024**3)
    print(
        f"[GPU] {prefix} allocated={mem_alloc:.2f} GB, "
        f"reserved={mem_reserved:.2f} GB"
    )

def clear_gpu_cache(prefix: str = ""):
    if not torch.cuda.is_available():
        return
    torch.cuda.empty_cache()
    print(f"[GPU] {prefix} torch.cuda.empty_cache() called")
    log_gpu(prefix + " after empty_cache")
