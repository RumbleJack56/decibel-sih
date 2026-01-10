import torch

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"  # CUDA or ROCm
TARGET_SAMPLE_RATE = 16000

VAD_THRESHOLD = 0.5
MIN_SPEECH_DURATION_MS = 1000
MIN_SILENCE_DURATION_MS = 200


MIN_SPEAKERS = 1
MAX_SPEAKERS = 10

WHISPER_MODEL: str = "openai/whisper-medium"

WHISPER_DEVICE: str = "cuda"  

INCLUDE_WORD_TIMESTAMPS: bool = True
QNA_MODEL_NAME = "google/flan-t5-small"  