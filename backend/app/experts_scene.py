from typing import Dict, List, Optional
import numpy as np
import torch
import math
import librosa

from transformers import ASTFeatureExtractor, ASTForAudioClassification
from app.utils import device
from app.config import TARGET_SAMPLE_RATE


class SceneEventExpert:
    """
    Improved Scene/Event expert based on AST audio classification model.

    Key behavior:
      - processes long audio by sliding-window inference with overlap
      - converts per-window class probabilities into timed events
      - merges adjacent windows with the same label into continuous events
      - classifies a coarse environment (indoor/outdoor/unknown) from top labels
      - configurable thresholds and windowing parameters
    """

    # Map of labels that are strong indicators of "outdoor" vs "indoor"
    _OUTDOOR_INDICATORS = {
        "car", "traffic", "vehicle", "engine", "horn", "wind", "rain", "bird", "dogs",
        "motorcycle", "siren", "construction", "helicopter", "airplane", "train"
    }
    _INDOOR_INDICATORS = {
        "keyboard", "typing", "door", "drawer", "applause", "music", "speech", "television",
        "clatter", "dishes", "fan", "vacuum", "cough", "laughter"
    }

    def __init__(
        self,
        model_name: str = "MIT/ast-finetuned-audioset-10-10-0.4593",
        device_name: Optional[str] = None,
        window_sec: float = 1.0,
        hop_sec: float = 0.5,
        score_threshold: float = 0.3,
        top_k_per_window: int = 5,
    ):
        self.model_name = model_name
        self.device = device_name or device()
        self.window_sec = float(window_sec)
        self.hop_sec = float(hop_sec)
        self.score_threshold = float(score_threshold)
        self.top_k_per_window = int(top_k_per_window)

        # Load HF feature extractor and model
        self.fe = ASTFeatureExtractor.from_pretrained(model_name)
        self.model = ASTForAudioClassification.from_pretrained(model_name).to(self.device)
        self.model.eval()
        self.id2label = self.model.config.id2label

    def _chunk_indices(self, n_samples: int, sr: int):
        """Yield (start_sample, end_sample) indices for sliding windows."""
        win_len = int(round(self.window_sec * sr))
        hop = int(round(self.hop_sec * sr))
        if win_len <= 0:
            raise ValueError("window_sec too small for sample rate")
        if hop <= 0:
            hop = win_len
        start = 0
        while start < n_samples:
            end = min(n_samples, start + win_len)
            yield start, end
            if end == n_samples:
                break
            start += hop

    def _merge_adjacent_events(self, raw_events: List[Dict], gap_tol_sec: float = 0.2):
        """
        Merge adjacent events of the same label when gaps between windows are small.
        gap_tol_sec indicates the largest allowed gap to merge (defaults to 0.2s).
        """
        if not raw_events:
            return []

        # Sort by label then start time, then merge
        merged: List[Dict] = []
        raw_events = sorted(raw_events, key=lambda e: (e["label"], e["start_time"], -e["confidence"]))
        for ev in raw_events:
            if not merged:
                merged.append(ev.copy())
                continue
            last = merged[-1]
            if ev["label"] == last["label"] and ev["start_time"] <= last["end_time"] + gap_tol_sec:
                # extend end_time and update confidence as max
                last["end_time"] = max(last["end_time"], ev["end_time"])
                last["confidence"] = max(last["confidence"], ev["confidence"])
            else:
                merged.append(ev.copy())
        return merged

    def _aggregate_environment(self, detected_labels: List[str]):
        """
        Simple heuristic environment detection that counts indicator labels.
        Returns {'primary': 'indoor'|'outdoor'|'unknown', 'confidence': float}
        """
        if not detected_labels:
            return {"primary": "Unknown", "confidence": 0.0}

        out_count = sum(1 for L in detected_labels if any(ind in L.lower() for ind in self._OUTDOOR_INDICATORS))
        in_count = sum(1 for L in detected_labels if any(ind in L.lower() for ind in self._INDOOR_INDICATORS))

        if out_count == in_count == 0:
            return {"primary": "Unknown", "confidence": 0.0}

        if out_count > in_count:
            conf = out_count / (out_count + in_count)
            return {"primary": "outdoor", "confidence": float(conf)}
        else:
            conf = in_count / (out_count + in_count)
            return {"primary": "indoor", "confidence": float(conf)}

    def process(self, waveform: np.ndarray, sr: int) -> Dict:
        """
        Main entry:
          waveform: 1-D numpy array (float32/float64)
          sr: sample rate (int)
        Returns dict:
          {
            "model": model_name,
            "events": [ {label, confidence, start_time, end_time, is_threat, threat_priority}, ... ],
            "threats": [ subset of events ],
            "environment": {"primary": str, "confidence": float}
          }
        """
        # Resample if needed
        if sr != TARGET_SAMPLE_RATE:
            waveform = librosa.resample(waveform.astype(np.float32), orig_sr=sr, target_sr=TARGET_SAMPLE_RATE)
            sr = TARGET_SAMPLE_RATE

        if waveform.ndim > 1:
            # Mix to mono
            waveform = np.mean(waveform, axis=0)

        n_samples = len(waveform)
        if n_samples == 0:
            return {"model": self.model_name, "events": [], "threats": [], "environment": {"primary": "Unknown", "confidence": 0.0}}

        raw_events: List[Dict] = []
        all_detected_labels: List[str] = []

        # Sliding window inference
        for (s_idx, e_idx) in self._chunk_indices(n_samples, sr):
            window = waveform[s_idx:e_idx]
            # feature extractor expects float32 arrays
            inputs = self.fe(window, sampling_rate=sr, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                logits = self.model(**inputs).logits  # shape: (1, num_labels)
                probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

            # top-k thresholding per window
            top_idxs = np.argsort(probs)[::-1][: self.top_k_per_window]
            for idx in top_idxs:
                score = float(probs[idx])
                if score < self.score_threshold:
                    continue
                label = self.id2label.get(idx, f"label_{idx}")
                start_time = float(s_idx / sr)
                end_time = float(e_idx / sr)
                raw_events.append({
                    "label": label,
                    "confidence": score,
                    "start_time": start_time,
                    "end_time": end_time,
                })
                all_detected_labels.append(label)

        # Merge adjacent windows with same labels
        events = self._merge_adjacent_events(raw_events)

        # Mark threats and assign a priority
        threats = []
        for ev in events:
            lab_low = ev["label"].lower()
            is_threat = any(k in lab_low for k in ["gun", "explosion", "siren", "shot", "bomb", "grenade"])
            # map to priority scheme
            if "gun" in lab_low or "explosion" in lab_low:
                priority = "CRITICAL"
            elif "siren" in lab_low or "alarm" in lab_low:
                priority = "HIGH"
            elif is_threat:
                priority = "MEDIUM"
            else:
                priority = "NONE"
            ev["is_threat"] = bool(is_threat)
            ev["threat_priority"] = priority
            if ev["is_threat"]:
                threats.append(ev)

        environment = self._aggregate_environment(all_detected_labels)

        return {
            "model": self.model_name,
            "events": events,
            "threats": threats,
            "environment": environment,
        }
