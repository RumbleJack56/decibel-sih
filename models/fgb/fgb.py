"""
preprocessing_foreground_only.py

Preprocessor that ALWAYS extracts the foreground (speech-focused) audio and returns
resampled 16 kHz and 32 kHz waveforms suitable for ASR/PaSST and diarization.

Behaviour:
 - If Demucs is installed and available, uses Demucs (high quality) to separate stems
   and picks the vocal/foreground stem.
 - Otherwise requires noisereduce to be installed; uses spectral gating to produce
   a foreground. If noisereduce is missing, the module raises a RuntimeError instructing
   the user to install either `demucs` or `noisereduce`.
 - Foreground is peak-normalized, resampled to 16 kHz and 32 kHz, and returned.
 - VAD is run on the foreground 16 kHz waveform and speech spans are returned.

Usage:
    from preprocessing_foreground_only import Preprocessor, PreprocessorConfig
    cfg = PreprocessorConfig(verbose=True)
    p = Preprocessor(cfg)
    out = p.process_file_must_foreground("input.mp3")
    # out: dict with keys: wav16, sr16, wav32, sr32, foreground_raw, speech_spans, orig_sr, duration

    
"""


from __future__ import annotations
import os
import tempfile
import warnings
from dataclasses import dataclass
import numpy as np
import soundfile as sf
# Demucs (preferred)
_HAS_DEMUCS = False
try:
    # demucs CLI / API can vary; try import
    from demucs.separate import separate as demucs_separate  # attempt API hook
    _HAS_DEMUCS = True
except Exception:
    _HAS_DEMUCS = False

# noisereduce fallback (must be present if demucs not installed)
try:
    import noisereduce as nr
except Exception:
    nr = None

# typing
from typing import Tuple, List, Dict

@dataclass
class PreprocessorConfig:
    target_sr_asr: int = 16000
    target_sr_passt: int = 32000
    normalize_peak: float = 0.99
    vad_frame_ms: int = 30
    vad_padding_ms: int = 200
    vad_aggressiveness: int = 3
    min_speech_duration: float = 0.15
    use_resampy: bool = True
    verbose: bool = False
    demucs_model: str = "htdemucs"  # demucs model name to pass to CLI when using demucs

class Preprocessor:
    def __init__(self, cfg: PreprocessorConfig | None = None):
        self.cfg = cfg or PreprocessorConfig()
        if self.cfg.use_resampy and resampy is None and librosa is None:
            raise RuntimeError("resampy/librosa not found. Install resampy or librosa for resampling.")
        if not _HAS_DEMUCS and nr is None:
            # explicit fail early: we require at least one separation backend
            raise RuntimeError(
                "No separation backend found. Install demucs (preferred) or noisereduce. "
                "Demucs: pip install demucs, Noisereduce: pip install noisereduce"
            )
        if webrtcvad is None:
            raise RuntimeError("webrtcvad not installed. Install it: pip install webrtcvad")

    # ---------------- IO ----------------
    def load_audio(self, path: str) -> Tuple[np.ndarray, int]:
        if not os.path.exists(path):
            raise FileNotFoundError(path)
        wav, sr = sf.read(path, dtype="float32")
        if wav.ndim > 1:
            wav = np.mean(wav, axis=1)
        wav = np.asarray(wav, dtype=np.float32)
        if self.cfg.verbose:
            print(f"[load_audio] {path} sr={sr} len={len(wav)}")
        return wav, int(sr)

    def save_wav(self, path: str, wav: np.ndarray, sr: int):
        sf.write(path, wav.astype(np.float32), sr)
        if self.cfg.verbose:
            print(f"[save_wav] wrote {path} sr={sr} len={len(wav)}")

    # --------------- resampling ---------------
    def _resample(self, wav: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
        if orig_sr == target_sr:
            return wav
        if self.cfg.use_resampy and resampy is not None:
            try:
                return resampy.resample(wav, orig_sr, target_sr)
            except Exception:
                pass
        if librosa is not None:
            try:
                try:
                    return librosa.core.resample(wav, orig_sr=orig_sr, target_sr=target_sr)
                except Exception:
                    return librosa.resample(wav, orig_sr, target_sr)
            except Exception:
                pass
        # fallback interpolation
        duration = len(wav) / float(orig_sr) if orig_sr > 0 else 0.0
        new_len = int(round(duration * target_sr))
        if new_len <= 0:
            return np.zeros(0, dtype=np.float32)
        old_times = np.linspace(0.0, duration, num=len(wav), endpoint=False)
        new_times = np.linspace(0.0, duration, num=new_len, endpoint=False)
        res = np.interp(new_times, old_times, wav).astype(np.float32)
        return res

    def _resample_targets(self, wav: np.ndarray, orig_sr: int) -> Dict[str, object]:
        wav16 = self._resample(wav, orig_sr, self.cfg.target_sr_asr)
        wav32 = self._resample(wav, orig_sr, self.cfg.target_sr_passt)
        return {"wav16": wav16, "sr16": self.cfg.target_sr_asr, "wav32": wav32, "sr32": self.cfg.target_sr_passt}

    # --------------- normalization ---------------
    def _normalize(self, wav: np.ndarray) -> np.ndarray:
        if wav.size == 0:
            return wav
        peak = float(np.max(np.abs(wav))) + 1e-12
        if peak <= 0:
            return wav
        scale = float(self.cfg.normalize_peak) / peak
        return (wav * scale).astype(np.float32)

    # --------------- VAD utilities ---------------
    def _frame_generator(self, wav: np.ndarray, sample_rate: int, frame_ms: int):
        frame_len = int(sample_rate * (frame_ms / 1000.0))
        num_frames = (len(wav) + frame_len - 1) // frame_len
        for i in range(num_frames):
            start = i * frame_len
            end = min(len(wav), start + frame_len)
            frame = wav[start:end]
            if len(frame) < frame_len:
                pad = np.zeros(frame_len - len(frame), dtype=wav.dtype)
                frame = np.concatenate([frame, pad])
            yield frame, start / sample_rate, end / sample_rate

    @staticmethod
    def _float_frame_to_pcm16_bytes(frame: np.ndarray) -> bytes:
        frame_clipped = np.clip(frame, -1.0, 1.0)
        ints = (frame_clipped * 32767.0).astype(np.int16)
        return ints.tobytes()

    def _vad_collector(self, wav: np.ndarray, sample_rate: int, aggressiveness: int, frame_ms: int, padding_ms: int) -> List[Tuple[float,float]]:
        vad = webrtcvad.Vad(int(aggressiveness))
        frames = list(self._frame_generator(wav, sample_rate, frame_ms))
        speech_flags = []
        for (frame, start, end) in frames:
            fb = self._float_frame_to_pcm16_bytes(frame)
            try:
                is_speech = vad.is_speech(fb, sample_rate)
            except Exception:
                is_speech = False
            speech_flags.append((start, end, is_speech))
        spans = []
        cur_start = None
        cur_end = None
        for start, end, is_speech in speech_flags:
            if is_speech:
                if cur_start is None:
                    cur_start, cur_end = start, end
                else:
                    cur_end = end
            else:
                if cur_start is not None:
                    spans.append((cur_start, cur_end))
                    cur_start, cur_end = None, None
        if cur_start is not None:
            spans.append((cur_start, cur_end))
        # merge close spans
        merged = []
        pad = padding_ms / 1000.0
        for s,e in spans:
            if not merged:
                merged.append([s,e])
            else:
                prev = merged[-1]
                if s - prev[1] <= pad:
                    prev[1] = e
                else:
                    merged.append([s,e])
        filtered = [(float(s), float(e)) for s,e in merged if (e - s) >= self.cfg.min_speech_duration]
        return filtered

    # --------------- separation (MANDATORY) ---------------
    def _separate_with_demucs(self, input_path: str, out_dir: str) -> str:
        """
        Use demucs CLI via subprocess to separate and write stems to out_dir.
        Return path to chosen foreground (vocal) file.
        We use demucs CLI to avoid fragile Python API differences between versions.
        """
        import subprocess, glob, shutil
        model = self.cfg.demucs_model or "htdemucs"
        cmd = [
            "demucs", "-n", model, "-o", out_dir, input_path
        ]
        # run demucs CLI; it writes to out_dir/<model>/<filename>/
        subprocess.run(cmd, check=True)
        # find vocals or mix for foreground
        # demucs output dir structure: out_dir/<model>/<basename>/<stems.wav or stems/*.wav>
        base = os.path.splitext(os.path.basename(input_path))[0]
        search_root = os.path.join(out_dir, model, base)
        if not os.path.exists(search_root):
            # fallback: try without model dir
            search_root = os.path.join(out_dir, base)
        if not os.path.exists(search_root):
            raise RuntimeError("Demucs output not found after running CLI; check demucs version/CLI availability.")
        # preferred vocal stem names
        candidates = []
        for root, _, files in os.walk(search_root):
            for f in files:
                lf = f.lower()
                if lf.endswith(".wav") and ("voc" in lf or "vocal" in lf or "lead" in lf or "singer" in lf):
                    candidates.append(os.path.join(root, f))
                elif lf.endswith(".wav") and ("mix" in lf or "foreground" in lf):
                    candidates.append(os.path.join(root, f))
        # if none found, pick the first wav
        if not candidates:
            wavs = [os.path.join(root, f) for root, _, files in os.walk(search_root) for f in files if f.lower().endswith(".wav")]
            if not wavs:
                raise RuntimeError("No wav stems found in demucs output")
            candidates = wavs
        # choose first candidate
        return candidates[0]

    def _separate_with_noisereduce(self, wav: np.ndarray, sr: int) -> np.ndarray:
        """
        Use noisereduce reduce_noise to create a foreground estimate and return it.
        """
        if nr is None:
            raise RuntimeError("noisereduce not installed; install it: pip install noisereduce")
        # estimate noise from first 0.5s or available
        noise_len = min(int(0.5 * sr), len(wav))
        noise_clip = wav[:noise_len] if noise_len > 0 else wav[:1]
        fg = nr.reduce_noise(y=wav, sr=sr, y_noise=noise_clip, stationary=False)
        return fg.astype(np.float32)

    # --------------- public processing (MANDATORY foreground) ---------------
    def process_file_must_foreground(self, input_path: str) -> Dict[str, object]:
        """
        Loads input audio, runs mandatory foreground separation (demucs preferred),
        normalizes foreground, resamples to targets, runs VAD on foreground 16k and
        returns structured dict.

        Returns:
            {
                "orig_sr": int,
                "duration": float,
                "foreground_raw": np.ndarray (original sr, mono, float32),
                "wav16": np.ndarray (float32),
                "sr16": int,
                "wav32": np.ndarray (float32),
                "sr32": int,
                "speech_spans": list of (start,end) on wav16 (floats)
            }
        Raises:
            RuntimeError if separation cannot be performed or Demucs CLI fails.
        """
        # 1) load original
        orig_wav, orig_sr = self.load_audio(input_path)
        duration = len(orig_wav) / float(orig_sr) if orig_sr > 0 else 0.0

        # 2) mandatory separation
        if _HAS_DEMUCS:
            # use demucs CLI to produce separated stems into temp dir
            tmpd = tempfile.mkdtemp(prefix="demucs_out_")
            try:
                fg_path = self._separate_with_demucs(input_path, tmpd)
                fg_wav, fg_sr = sf.read(fg_path, dtype="float32")
                if fg_wav.ndim > 1:
                    fg_wav = np.mean(fg_wav, axis=1)
                fg_wav = np.asarray(fg_wav, dtype=np.float32)
                # If demucs stem sample rate differs, resample to orig_sr for consistency
                if fg_sr != orig_sr:
                    fg_wav = self._resample(fg_wav, fg_sr, orig_sr)
                    fg_sr = orig_sr
            except Exception as e:
                raise RuntimeError(f"Demucs separation failed: {e}")
            foreground_raw = fg_wav
            used_sr = fg_sr
        else:
            # demucs not available; use noisereduce (must be installed per __init__)
            fg = self._separate_with_noisereduce(orig_wav, orig_sr)
            foreground_raw = fg
            used_sr = orig_sr

        if self.cfg.verbose:
            print(f"[separation] foreground length={len(foreground_raw)} sr={used_sr}")

        # 3) normalize foreground
        foreground_raw = self._normalize(foreground_raw)

        # 4) resample foreground to targets (these will be used going forward)
        res = self._resample_targets(foreground_raw, used_sr)
        wav16 = res["wav16"]
        wav32 = res["wav32"]
        sr16 = res["sr16"]
        sr32 = res["sr32"]

        # 5) run VAD on foreground 16k
        speech_spans = self._vad_collector(wav16, sr16,
                                          aggressiveness=self.cfg.vad_aggressiveness,
                                          frame_ms=self.cfg.vad_frame_ms,
                                          padding_ms=self.cfg.vad_padding_ms)

        result = {
            "orig_sr": orig_sr,
            "duration": duration,
            "foreground_raw": foreground_raw.astype(np.float32),
            "wav16": wav16.astype(np.float32),
            "sr16": sr16,
            "wav32": wav32.astype(np.float32),
            "sr32": sr32,
            "speech_spans": speech_spans
        }
        return result

if __name__ == "__main__":
    import argparse, json
    parser = argparse.ArgumentParser(prog="preprocessing_foreground_only.py")
    parser.add_argument("input", help="input audio (wav/mp3)")
    parser.add_argument("--out-dir", "-o", default=".", help="output dir")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()
    cfg = PreprocessorConfig(verbose=args.verbose)
    p = Preprocessor(cfg)
    res = p.process_file_must_foreground(args.input)
    base = os.path.splitext(os.path.basename(args.input))[0]
    os.makedirs(args.out_dir, exist_ok=True)
    out16 = os.path.join(args.out_dir, f"{base}_foreground_16k.wav")
    out32 = os.path.join(args.out_dir, f"{base}_foreground_32k.wav")
    p.save_wav(out16, res["wav16"], res["sr16"])
    p.save_wav(out32, res["wav32"], res["sr32"])
    with open(os.path.join(args.out_dir, f"{base}_speech_spans.json"), "w", encoding="utf-8") as fh:
        json.dump(res["speech_spans"], fh, indent=2)
    if cfg.verbose:
        print("Wrote:", out16, out32)
