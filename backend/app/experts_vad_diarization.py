from typing import List, Dict, Tuple

import numpy as np
import torch
import librosa
from spectralcluster import SpectralClusterer
from sklearn.metrics import silhouette_score
from nemo.collections.asr.models import EncDecSpeakerLabelModel

from transformers import AutoProcessor, WhisperForConditionalGeneration

from app.config import (
    TARGET_SAMPLE_RATE,
    MIN_SPEECH_DURATION_MS,
    MIN_SILENCE_DURATION_MS,
    MIN_SPEAKERS,
    MAX_SPEAKERS,
    WHISPER_MODEL,
    WHISPER_DEVICE,
    INCLUDE_WORD_TIMESTAMPS,
)
from app.utils import device

# ---------------- VAD (Silero) ----------------

class VADExpert:
    def __init__(self):
        print("[VADExpert] init: loading Silero VAD")
        self.model, self.utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            force_reload=False,
            onnx=False,
        )
        (
            self.get_speech_timestamps,
            self.save_audio,
            self.read_audio,
            self.VADIterator,
            self.collect_chunks,
        ) = self.utils
        self.sample_rate = TARGET_SAMPLE_RATE
        print("[VADExpert] init: done, sample_rate =", self.sample_rate)

    def process(self, waveform: np.ndarray, sr: int) -> List[Dict]:
        print(f"[VADExpert] process: sr={sr}, samples={len(waveform)}")
        if sr != self.sample_rate:
            print(f"[VADExpert] resampling {sr} -> {self.sample_rate}")
            waveform = librosa.resample(
                waveform, orig_sr=sr, target_sr=self.sample_rate
            )
            sr = self.sample_rate

        if not isinstance(waveform, np.ndarray):
            waveform = np.array(waveform)

        wav_t = torch.from_numpy(waveform).float()

        timestamps = self.get_speech_timestamps(
            wav_t,
            self.model,
            sampling_rate=sr,
        )
        print(f"[VADExpert] found {len(timestamps)} speech segments")

        segments: List[Dict] = []
        for i, t in enumerate(timestamps):
            start_s = t["start"] / sr
            end_s = t["end"] / sr
            segments.append(
                {
                    "segment_id": i + 1,
                    "start_time": float(start_s),
                    "end_time": float(end_s),
                    "duration": float(end_s - start_s),
                    "start_sample": int(t["start"]),
                    "end_sample": int(t["end"]),
                }
            )

        return segments

class DiarizationExpert:
    def __init__(self):
        print("[DiarizationExpert] init")
        self.min_speakers = MIN_SPEAKERS
        self.max_speakers = MAX_SPEAKERS
        self.device = "cpu"
        print("[DiarizationExpert] device =", self.device)

        self.model = EncDecSpeakerLabelModel.from_pretrained(
            "nvidia/speakerverification_en_titanet_large"
        ).to(self.device)
        self.model.eval()

    def _extract_embedding(self, seg_wave: np.ndarray, sr: int) -> np.ndarray:
        if sr != TARGET_SAMPLE_RATE:
            seg_wave = librosa.resample(
                seg_wave, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE
            )
            sr = TARGET_SAMPLE_RATE

        audio_tensor = torch.from_numpy(seg_wave).float().to(self.device)
        if audio_tensor.dim() == 1:
            audio_tensor = audio_tensor.unsqueeze(0)

        with torch.no_grad():
            out = self.model.forward(
                input_signal=audio_tensor,
                input_signal_length=torch.tensor(
                    [audio_tensor.shape[1]], device=self.device
                ),
            )
            emb = out[0] if isinstance(out, (tuple, list)) else out

        return emb.cpu().numpy().squeeze(0)

    def process(self, segments: List[Dict], sr: int, waveform: np.ndarray) -> List[Dict]:
        print(f"[DiarizationExpert] process: {len(segments)} segments, sr={sr}")
        valid_segments = [s for s in segments if s["duration"] >= 0.5]
        print(f"[DiarizationExpert] valid_segments >=0.5s: {len(valid_segments)}")
        if not valid_segments:
            print("[DiarizationExpert] no valid segments, assigning SPEAKER_00")
            for s in segments:
                s["speaker"] = "SPEAKER_00"
            return segments

        embs = []
        for s in valid_segments:
            seg_wave = waveform[s["start_sample"] : s["end_sample"]]
            embs.append(self._extract_embedding(seg_wave, sr))
        embeddings = np.stack(embs, axis=0)
        print(f"[DiarizationExpert] embeddings shape: {embeddings.shape}")

        best_k, best_score, best_labels = None, -1.0, None
        for k in range(
            self.min_speakers, min(self.max_speakers, len(embeddings)) + 1
        ):
            if k == 1:
                continue
            print(f"[DiarizationExpert] trying k={k}")
            clustering = SpectralClusterer(min_clusters=k, max_clusters=k)
            labels = clustering.predict(embeddings)

            if len(np.unique(labels)) < 2:
                print(f"[DiarizationExpert] k={k} produced <2 clusters, skip")
                continue

            try:
                score = silhouette_score(embeddings, labels)
                print(f"[DiarizationExpert] k={k} silhouette={score:.4f}")
            except Exception as e:
                print(f"[DiarizationExpert] silhouette error for k={k}: {e}")
                continue

            if score > best_score:
                best_score, best_k, best_labels = score, k, labels

        if best_labels is None:
            print("[DiarizationExpert] no good clustering, assigning SPEAKER_00")
            for s in segments:
                s["speaker"] = "SPEAKER_00"
            return segments

        print(f"[DiarizationExpert] best_k={best_k}, best_score={best_score:.4f}")
        for seg, label in zip(valid_segments, best_labels):
            seg["speaker"] = f"SPEAKER_{int(label):02d}"

        last_speaker = "SPEAKER_00"
        for seg in segments:
            if "speaker" in seg:
                last_speaker = seg["speaker"]
            else:
                seg["speaker"] = last_speaker

        return segments
class ASRExpert:
    def __init__(self):
        print("[ASRExpert] init")
        self.device = torch.device(WHISPER_DEVICE)
        self.processor = AutoProcessor.from_pretrained(WHISPER_MODEL)
        self.model = WhisperForConditionalGeneration.from_pretrained(
            WHISPER_MODEL
        ).to(self.device)
        # optional, if ROCm supports half
        # self.model.half()
        self.model.eval()

    def _run_whisper(
        self,
        audio_chunk: np.ndarray,
        task: str,
        language: str = None,
        max_new_tokens: int = 256,
    ) -> Tuple[str, List[Dict]]:
        inputs = self.processor(
            audio_chunk,
            sampling_rate=TARGET_SAMPLE_RATE,
            return_tensors="pt",
        )
        input_features = inputs.input_features.to(self.device)
        if next(self.model.parameters()).dtype == torch.float16:
            input_features = input_features.half()

        gen_kwargs = {"task": task}
        if language is not None:
            gen_kwargs["language"] = language

        with torch.no_grad():
            predicted_ids = self.model.generate(
                input_features,
                max_new_tokens=max_new_tokens,
                **gen_kwargs,
            )

        text = self.processor.batch_decode(
            predicted_ids, skip_special_tokens=True
        )[0].strip()

        words: List[Dict] = []
        return text, words

    def process(
        self, segments: List[Dict], sr: int, waveform: np.ndarray
    ) -> Tuple[List[Dict], str]:
        print(f"[ASRExpert] process: {len(segments)} segments, sr={sr}")
        results: List[Dict] = []
        detected_language = "auto"

        for seg in segments:
            print(
                f"[ASRExpert] segment {seg['segment_id']} "
                f"{seg['start_time']:.2f}-{seg['end_time']:.2f}s"
            )
            audio_chunk = waveform[seg["start_sample"] : seg["end_sample"]]

            if sr != TARGET_SAMPLE_RATE:
                print(
                    f"[ASRExpert] resampling segment {seg['segment_id']} "
                    f"{sr} -> {TARGET_SAMPLE_RATE}"
                )
                audio_chunk = librosa.resample(
                    audio_chunk, orig_sr=sr, target_sr=TARGET_SAMPLE_RATE
                )
            audio_chunk = audio_chunk.astype(np.float32)

            text, words = self._run_whisper(
                audio_chunk,
                task="transcribe",
                language=None,
                max_new_tokens=256,
            )
            print(f"[ASRExpert] segment {seg['segment_id']} text: {text[:80]}")

            translation_en, _ = self._run_whisper(
                audio_chunk,
                task="translate",
                language="en",
                max_new_tokens=256,
            )
            print(
                f"[ASRExpert] segment {seg['segment_id']} translation_en: "
                f"{translation_en[:80]}"
            )

            seg_out = seg.copy()
            seg_out["text"] = text
            seg_out["words"] = words
            seg_out["translation_en"] = translation_en

            results.append(seg_out)

        print(f"[ASRExpert] done, detected_language={detected_language}")
        return results, detected_language

class LinguisticExpert:
    def __init__(self, apply_lemmatization: bool = False, apply_stemming: bool = False):
        self.apply_lemmatization = False
        self.apply_stemming = False
        print("[LinguisticExpert] init: no-op (no NLTK)")

    def process(self, segments: List[Dict]) -> List[Dict]:
        print(f"[LinguisticExpert] process: {len(segments)} segments (no-op)")
        return segments

# ---------------- Unification ----------------

class UnificationExpert:
    def __init__(self):
        print("[UnificationExpert] init")

    def process(self, segments: List[Dict], metadata: Dict) -> Dict:
        print(f"[UnificationExpert] process: {len(segments)} segments")

        # ensure global chronological order
        segments = sorted(segments, key=lambda s: s["start_time"])

        speakers: Dict[str, Dict] = {}
        full_transcript: List[Dict] = []

        for seg in segments:
            speaker = seg.get("speaker", "UNKNOWN")
            text = seg.get("text", "")

            if speaker not in speakers:
                speakers[speaker] = {
                    "speaker_id": speaker,
                    "total_duration": 0.0,
                    "segments": [],
                }

            speakers[speaker]["total_duration"] += seg["duration"]
            speakers[speaker]["segments"].append(
                {
                    "segment_id": seg["segment_id"],
                    "start_time": round(seg["start_time"], 3),
                    "end_time": round(seg["end_time"], 3),
                    "duration": round(seg["duration"], 3),
                    "text": text,
                    "translation_en": seg.get("translation_en", ""),
                }
            )

            full_transcript.append(
                {
                    "segment_id": seg["segment_id"],
                    "speaker": speaker,
                    "start_time": round(seg["start_time"], 3),
                    "end_time": round(seg["end_time"], 3),
                    "text": text,
                    "translation_en": seg.get("translation_en", ""),
                    "words": seg.get("words", []),
                }
            )

        total_speech_duration = sum(seg["duration"] for seg in segments)

        output = {
            "metadata": {
                "audio_file": metadata.get("audio_file", "unknown"),
                "audio_id": metadata.get("audio_id"),
                "path": metadata.get("path"),
                "sample_rate": metadata.get("sample_rate", TARGET_SAMPLE_RATE),
                "total_duration": round(metadata.get("total_duration", 0.0), 3),
                "total_speech_duration": round(total_speech_duration, 3),
                "num_segments": len(segments),
                "num_speakers": len(speakers),
                "language": metadata.get("language", "auto-detected"),
            },
            "speakers": speakers,
            "transcript": full_transcript,
        }

        print("[UnificationExpert] done")
        return output
