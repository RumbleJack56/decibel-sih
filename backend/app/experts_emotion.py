from typing import Dict
import numpy as np
import torch
from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
from app.utils import device
from app.config import TARGET_SAMPLE_RATE


class EmotionExpert:
    def __init__(self, model_name: str = "superb/wav2vec2-base-superb-er"):
        self.model_name = model_name
        self.device = device()
        print(f"[EmotionExpert] init")
        self.fe = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
        self.model = Wav2Vec2ForSequenceClassification.from_pretrained(
            model_name
        ).to(self.device)
        self.model.eval()
        self.labels = list(self.model.config.id2label.values())
        print(f"[EmotionExpert] init: loaded, labels={self.labels}")

    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        print(f"[EmotionExpert] process: sr={sr}, samples={len(waveform)}")
        if sr != TARGET_SAMPLE_RATE:
            import librosa
            print(
                f"[EmotionExpert] resampling {sr} -> {TARGET_SAMPLE_RATE} "
                f"(len={len(waveform)})"
            )
            waveform = librosa.resample(
                waveform, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE
            )
            sr = TARGET_SAMPLE_RATE
            print(f"[EmotionExpert] after resample: samples={len(waveform)}")

        inputs = self.fe(
            waveform, sampling_rate=sr, return_tensors="pt", padding=True
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = self.model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        top_idx = int(probs.argmax())
        prediction = {"label": self.labels[top_idx], "score": float(probs[top_idx])}
        print(
            f"[EmotionExpert] prediction: {prediction['label']} "
            f"({prediction['score']:.4f})"
        )

        return {
            "model": self.model_name,
            "sample_rate": sr,
            "prediction": prediction,
            "probabilities": [
                {"label": self.labels[i], "score": float(probs[i])}
                for i in range(len(self.labels))
            ],
        }
