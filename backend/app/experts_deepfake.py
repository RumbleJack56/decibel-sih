from typing import Dict, List
import numpy as np
import torch
import librosa
from transformers import AutoFeatureExtractor, AutoModelForAudioClassification

from app.config import TARGET_SAMPLE_RATE
from app.utils import device


class DeepfakeExpert:
    def __init__(
        self,
        model_name: str = "MelodyMachine/Deepfake-audio-detection-V2",
    ):
        print("[DeepfakeExpert] init:")
        self.model_name = model_name
        self.device = device()  # "cuda" or "cpu"

        self.fe = AutoFeatureExtractor.from_pretrained(model_name)
        self.model = AutoModelForAudioClassification.from_pretrained(
            model_name
        ).to(self.device)
        self.model.eval()
        self.id2label = self.model.config.id2label
        print("[DeepfakeExpert] model loaded on", self.device)

    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        print(f"[DeepfakeExpert] process: sr={sr}, samples={len(waveform)}")

        # resample
        if sr != TARGET_SAMPLE_RATE:
            print(f"[DeepfakeExpert] resampling {sr} -> {TARGET_SAMPLE_RATE}")
            waveform = librosa.resample(
                waveform, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE
            )
            sr = TARGET_SAMPLE_RATE
            print(f"[DeepfakeExpert] after resample: samples={len(waveform)}")

        # ensure mono float32
        if not isinstance(waveform, np.ndarray):
            waveform = np.array(waveform)
        if waveform.ndim > 1:
            waveform = np.mean(waveform, axis=0)
        waveform = waveform.astype(np.float32)

        inputs = self.fe(
            waveform,
            sampling_rate=sr,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        with torch.no_grad():
            logits = self.model(**inputs).logits  # [1, num_labels]
            probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

        top_indices = probs.argsort()[::-1]
        top_k: List[Dict] = []
        for idx in top_indices[:2]:
            label = self.id2label.get(int(idx), str(idx))
            score = float(probs[idx])
            top_k.append({"label": label, "score": score})

        prediction = top_k[0] if top_k else {"label": "unknown", "score": 0.0}

        print(
            f"[DeepfakeExpert] prediction: {prediction['label']} "
            f"({prediction['score']:.4f})"
        )

        return {
            "model": self.model_name,
            "sample_rate": sr,
            "prediction": prediction,
            "top_k": top_k,
            "raw_logits": logits.cpu().numpy().tolist(),
        }
