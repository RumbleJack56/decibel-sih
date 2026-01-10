import math
import uuid
from dataclasses import dataclass
from typing import List, Dict, Tuple

import librosa
import numpy as np
import webrtcvad


def _pcm16(audio: np.ndarray) -> bytes:
    audio_int16 = np.clip(audio * 32768.0, -32768, 32767).astype(np.int16)
    return audio_int16.tobytes()


def _frame_bytes(pcm_bytes: bytes, frame_size: int) -> List[bytes]:
    return [pcm_bytes[i : i + frame_size] for i in range(0, len(pcm_bytes), frame_size) if len(pcm_bytes[i : i + frame_size]) == frame_size]


@dataclass
class AudioChunk:
    chunk_id: str
    audio_path: str
    start_time: float
    end_time: float
    mel: np.ndarray
    duration: float


class AudioPreprocessor:
    """
    Minimal audio chunking + mel pipeline for model ingestion.
    Keeps mapping and frame bounds for 10–20s speech-only chunks.
    """

    def __init__(
        self,
        target_sr: int = 16000,
        min_chunk_s: float = 10.0,
        max_chunk_s: float = 20.0,
        vad_aggressiveness: int = 2,
        merge_gap_s: float = 0.15,
        drop_short_s: float = 0.25,
        pad_s: float = 0.2,
        overlap_frac: float = 0.1,
        mel_n_mels: int = 80,
        mel_win_ms: float = 25.0,
        mel_hop_ms: float = 10.0,
        max_mel_frames: int = 1000,
    ):
        self.sr = target_sr
        self.min_chunk_s = min_chunk_s
        self.max_chunk_s = max_chunk_s
        self.merge_gap_s = merge_gap_s
        self.drop_short_s = drop_short_s
        self.pad_s = pad_s
        self.overlap_frac = overlap_frac
        self.max_mel_frames = max_mel_frames
        self.hop_length = int(self.sr * mel_hop_ms / 1000)
        self.win_length = int(self.sr * mel_win_ms / 1000)
        self.n_mels = mel_n_mels
        self.vad = webrtcvad.Vad(vad_aggressiveness)

    def _detect_vad(self, audio: np.ndarray) -> List[Tuple[float, float]]:
        frame_duration_ms = 20  # WebRTC VAD supports 10/20/30ms
        frame_size = int(self.sr * frame_duration_ms / 1000)
        pcm = _pcm16(audio)
        frames = _frame_bytes(pcm, frame_size * 2)  # 2 bytes per sample
        intervals: List[Tuple[float, float]] = []
        start = None
        for idx, frame in enumerate(frames):
            ts = idx * frame_duration_ms / 1000.0
            has_speech = self.vad.is_speech(frame, self.sr)
            if has_speech and start is None:
                start = ts
            if not has_speech and start is not None:
                intervals.append((start, ts))
                start = None
        if start is not None:
            intervals.append((start, len(frames) * frame_duration_ms / 1000.0))
        merged: List[Tuple[float, float]] = []
        for s, e in intervals:
            if e - s < self.drop_short_s:
                continue
            if merged and s - merged[-1][1] <= self.merge_gap_s:
                merged[-1] = (merged[-1][0], e)
            else:
                merged.append((s, e))
        return merged

    def _segment_chunks(self, intervals: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
        chunks: List[Tuple[float, float]] = []
        if not intervals:
            return chunks
        cur_start, cur_end = intervals[0]
        for s, e in intervals[1:]:
            if (e - cur_start) <= self.max_chunk_s:
                cur_end = e
            else:
                chunks.append((cur_start, cur_end))
                cur_start, cur_end = s, e
        chunks.append((cur_start, cur_end))
        # enforce min duration by merging small trailing pieces
        normalized: List[Tuple[float, float]] = []
        for seg in chunks:
            if normalized and (seg[1] - seg[0]) < self.min_chunk_s:
                prev_s, prev_e = normalized.pop()
                normalized.append((prev_s, seg[1]))
            else:
                normalized.append(seg)
        return normalized

    def _pad_and_overlap(self, chunks: List[Tuple[float, float]], audio_len_s: float) -> List[Tuple[float, float]]:
        padded: List[Tuple[float, float]] = []
        for i, (s, e) in enumerate(chunks):
            pad = self.pad_s
            s = max(0.0, s - pad)
            e = min(audio_len_s, e + pad)
            padded.append((s, e))
            if i < len(chunks) - 1:
                overlap = (e - s) * self.overlap_frac
                padded[-1] = (s, min(audio_len_s, e + overlap))
        return padded

    def _mel(self, audio: np.ndarray) -> np.ndarray:
        mel = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sr,
            n_fft=self.win_length,
            hop_length=self.hop_length,
            win_length=self.win_length,
            n_mels=self.n_mels,
            power=2.0,
            center=True,
        )
        mel = librosa.power_to_db(mel).T
        return mel

    def _enforce_frame_limit(self, mel: np.ndarray) -> List[np.ndarray]:
        if mel.shape[0] <= self.max_mel_frames:
            return [mel]
        n_splits = math.ceil(mel.shape[0] / self.max_mel_frames)
        return np.array_split(mel, n_splits)

    def process(self, audio_path: str) -> List[AudioChunk]:
        audio, _ = librosa.load(audio_path, sr=self.sr, mono=True)
        audio = np.clip(audio / (np.max(np.abs(audio)) + 1e-9), -1.0, 1.0)
        vad_segments = self._detect_vad(audio)
        speech_chunks = self._segment_chunks(vad_segments)
        padded_chunks = self._pad_and_overlap(speech_chunks, len(audio) / self.sr)

        results: List[AudioChunk] = []
        for seg_start, seg_end in padded_chunks:
            start_idx = int(seg_start * self.sr)
            end_idx = int(seg_end * self.sr)
            clip = audio[start_idx:end_idx]
            mel = self._mel(clip)
            sub_mels = self._enforce_frame_limit(mel)
            frame_dt = self.hop_length / self.sr
            for part_idx, sub in enumerate(sub_mels):
                offset_frames = part_idx * self.max_mel_frames
                sub_start = seg_start + offset_frames * frame_dt
                sub_end = sub_start + sub.shape[0] * frame_dt
                results.append(
                    AudioChunk(
                        chunk_id=str(uuid.uuid4()),
                        audio_path=audio_path,
                        start_time=sub_start,
                        end_time=sub_end,
                        mel=sub,
                        duration=sub.shape[0] * frame_dt,
                    )
                )
        return results


if __name__ == "__main__":
    ap = AudioPreprocessor()
    chunks = ap.process("/mnt/devdrive/AIMS/SIH25/code/dataset/ps6_01_214.wav")
    print(chunks[0].mel.shape, chunks[0].start_time, chunks[0].end_time)
    for chunk in chunks:
        print(f"Chunk ID: {chunk.chunk_id}, Start: {chunk.start_time:.2f}s, End: {chunk.end_time:.2f}s, Duration: {chunk.duration:.2f}s, Mel shape: {chunk.mel.shape}")