# app/forensics.py
"""
ForensicAudioAnalyzer (stat-driven)
Consumes 'full_data' dict assembled by main.py and produces:
 - structured forensic sections (self.report)
 - optional LLM-enhanced text (using provided tokenizer + llm)
 - plots saved to disk
 - a PDF report (reportlab preferred, PdfPages fallback)
"""

import os
import json
import math
import io
from typing import Any, Dict, Optional, List
from dataclasses import dataclass, field

import numpy as np

# plotting
try:
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_pdf import PdfPages
    MATPLOTLIB_AVAILABLE = True
except Exception:
    MATPLOTLIB_AVAILABLE = False

# PDF via reportlab (preferred)
try:
    from reportlab.lib.pagesizes import A4, letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import cm
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

# typing for LLM
try:
    import torch
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False


@dataclass
class ForensicAudioAnalyzer:
    full_data: Dict[str, Any]
    audio_path: Optional[str] = None
    tokenizer: Optional[Any] = None
    llm: Optional[Any] = None

    report: Dict[str, Any] = field(default_factory=dict)
    executive_summary: str = ""
    final_conclusion: str = ""
    enhanced_text: Dict[str, str] = field(default_factory=dict)
    plots: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, full_data: Dict[str, Any], audio_path: Optional[str] = None,
                  tokenizer: Optional[Any] = None, llm: Optional[Any] = None):
        """
        Construct the analyzer from the `full_data` dict produced by main.py.
        """
        return cls(full_data=full_data or {}, audio_path=audio_path, tokenizer=tokenizer, llm=llm)

    # -------------------------
    # Processing pipeline steps
    # -------------------------
    def process_audio_metadata(self):
        md = self.full_data.get("metadata") or {}
        # Use fields main.py includes: audio_file, sample_rate, total_duration, language
        audio_file = md.get("audio_file") or md.get("audio_file_name") or md.get("file") or None
        sample_rate = md.get("sample_rate") or md.get("sample_rate_hz") or None
        total_duration = md.get("total_duration") or md.get("duration_sec") or None

        # speech duration can be present in full_data under other keys; try common ones
        speech_duration = md.get("total_speech_duration") or md.get("speech_duration_s") or None

        num_speakers = None
        speakers = self.full_data.get("speakers")
        if isinstance(speakers, (list, dict)):
            num_speakers = len(speakers) if isinstance(speakers, list) else len(speakers.keys())

        env = self.full_data.get("environment_context") or {}
        detected_language = md.get("language") or md.get("lang") or md.get("detected_language")

        speech_density = None
        if total_duration and speech_duration:
            try:
                speech_density = float(speech_duration) / float(total_duration)
            except Exception:
                speech_density = None

        formatted = lambda s: f"{int(s//60)}m {s%60:.2f}s" if isinstance(s, (int, float)) and s > 0 else "Unknown"

        audio_md = {
            "audio_file": audio_file,
            "audio_path": self.audio_path,
            "sample_rate": sample_rate,
            "total_duration": float(total_duration) if total_duration else None,
            "total_duration_pretty": formatted(total_duration) if total_duration else "Unknown",
            "speech_duration_s": float(speech_duration) if speech_duration else None,
            "speech_duration_pretty": formatted(speech_duration) if speech_duration else "Unknown",
            "speech_density_ratio": round(speech_density, 3) if speech_density is not None else None,
            "speech_density_percent": round((speech_density * 100), 2) if speech_density is not None else None,
            "num_speakers": num_speakers,
            "language": detected_language,
            "environment_context": env,
        }

        self.report["audio_metadata"] = audio_md
        return audio_md

    def process_asr_transcript(self):
        """
        Normalizes ASR transcript present in full_data under 'transcript' or asr structure.
        Computes simple stats: word counts, segments, wpm.
        """
        transcript = self.full_data.get("transcript") or []
        # unify format: list of segments with 'text', 'start_time', 'end_time'
        segments = []
        total_words = 0
        confidences = []

        for seg in transcript:
            text = seg.get("text") if isinstance(seg, dict) else str(seg)
            start = seg.get("start_time") if isinstance(seg, dict) else None
            end = seg.get("end_time") if isinstance(seg, dict) else None
            segments.append({"text": text, "start_time": start, "end_time": end})
            # word count
            wc = len(text.split())
            total_words += wc
            # gather word-level confidences if present
            if isinstance(seg, dict):
                words = seg.get("words") or []
                for w in words:
                    if isinstance(w, dict) and w.get("probability") is not None:
                        try:
                            confidences.append(float(w.get("probability")))
                        except Exception:
                            pass

        metadata = self.report.get("audio_metadata", {}) or {}
        total_speech = metadata.get("speech_duration_s") or metadata.get("total_duration") or None

        wpm = None
        if total_speech and total_speech > 0:
            wpm = round((total_words / total_speech) * 60, 2)

        clarity = None
        if confidences:
            clarity = round(float(sum(confidences)) / len(confidences), 3)

        asr_block = {
            "num_segments": len(segments),
            "num_words": total_words,
            "words_per_minute": wpm,
            "speech_clarity_score": clarity,
            "segments": segments,
            "transcript_text": "\n".join([s["text"] for s in segments]),
        }

        self.report["asr"] = asr_block
        return asr_block

    def process_speaker_diarization(self):
        """
        Builds speaker stats from full_data['speakers'] if available.
        Expects either list of speaker dicts or dict keyed by speaker id.
        """
        speakers = self.full_data.get("speakers") or []
        # Normalize speakers -> dict: name -> {segments, total_duration}
        spk_dict = {}
        if isinstance(speakers, list):
            # each item expected to be dict with 'speaker'/'id' and 'segments'
            for s in speakers:
                sid = s.get("speaker") or s.get("id") or s.get("name") or f"spk{len(spk_dict)}"
                segs = s.get("segments") or []
                total = sum((seg.get("end_time", 0) - seg.get("start_time", 0)) for seg in segs)
                spk_dict[sid] = {"segments": segs, "total_duration": total}
        elif isinstance(speakers, dict):
            spk_dict = speakers
        else:
            spk_dict = {}

        total_speaking = sum(info.get("total_duration", 0.0) for info in spk_dict.values())
        dominance = {}
        for spk, info in spk_dict.items():
            dur = info.get("total_duration", 0.0)
            dominance[spk] = round((dur / total_speaking) if total_speaking > 0 else 0.0, 3)

        dominant_speaker = None
        if dominance:
            dominant_speaker = max(dominance, key=dominance.get)

        # detect overlaps naive O(n^2)
        segments_all = []
        for spk, info in spk_dict.items():
            for seg in info.get("segments", []):
                segments_all.append((spk, seg.get("start_time", 0), seg.get("end_time", 0)))

        overlaps = []
        for i in range(len(segments_all)):
            a_spk, a_s, a_e = segments_all[i]
            for j in range(i + 1, len(segments_all)):
                b_spk, b_s, b_e = segments_all[j]
                if a_spk == b_spk:
                    continue
                if not (a_e < b_s or b_e < a_s):
                    overlaps.append({
                        "speaker_1": a_spk, "speaker_2": b_spk,
                        "overlap_start": max(a_s, b_s), "overlap_end": min(a_e, b_e)
                    })

        diar_block = {
            "num_speakers": len(spk_dict),
            "speaker_stats": spk_dict,
            "dominance": dominance,
            "dominant_speaker": dominant_speaker,
            "overlaps": overlaps,
        }
        self.report["diarization"] = diar_block
        return diar_block

    def process_emotion_forensics(self):
        """
        Normalize emotion output found in full_data['emotion_analysis']
        and derive distribution, dominant emotion, volatility, and high-stress windows.
        """
        emo = self.full_data.get("emotion_analysis") or {}
        # Support both legacy keys and modern frames
        timeline = emo.get("timeline") or emo.get("frame_level") or emo.get("frame_results") or emo.get("frame_annotations") or emo.get("frames") or []
        # Also accept simple prediction structure
        prediction = emo.get("prediction") or emo.get("label") or emo.get("prediction")

        # Build distribution
        counts = {}
        windows = []
        for w in timeline:
            lbl = w.get("label") or w.get("emotion") or w.get("smoothed_emotion") or None
            if lbl:
                counts[lbl] = counts.get(lbl, 0) + 1
                windows.append(w)

        distribution = {k: round(v / (len(windows) or 1), 3) for k, v in counts.items()}
        dominant = None
        if distribution:
            dominant = max(distribution, key=distribution.get)

        # volatility simple metric: fraction of windows where label changes
        volatility = 0.0
        if windows:
            prev = None
            changes = 0
            non_sil = 0
            for w in windows:
                if w.get("is_silence"):
                    continue
                non_sil += 1
                cur = w.get("label") or w.get("emotion") or w.get("smoothed_emotion")
                if prev is not None and cur != prev:
                    changes += 1
                prev = cur
            volatility = round((changes / non_sil) if non_sil > 0 else 0.0, 3)

        high_stress_labels = {"angry", "fear", "panic", "anxious"}
        high_stress_windows = []
        total_stress = 0.0
        for w in windows:
            lbl = (w.get("label") or w.get("emotion") or w.get("smoothed_emotion") or "").lower()
            if lbl in high_stress_labels and not w.get("is_silence", False):
                st = w.get("start_time", 0)
                en = w.get("end_time", st)
                d = max(0.0, en - st)
                total_stress += d
                high_stress_windows.append({"start_time": st, "end_time": en, "duration_s": d, "label": lbl, "confidence": w.get("confidence")})

        emo_block = {
            "timeline": timeline,
            "distribution": distribution,
            "dominant_emotion": dominant,
            "volatility_score": volatility,
            "high_stress_windows": high_stress_windows,
            "high_stress_total_duration_s": round(total_stress, 3),
            "raw": emo,
        }
        self.report["emotion"] = emo_block
        return emo_block

    def process_environment_forensics(self):
        env = self.full_data.get("environment_context") or self.full_data.get("background") or {}
        # Normalize to primary, confidence, threat flags
        primary = env.get("primary_environment") or (env.get("environment", {}).get("primary") if isinstance(env.get("environment"), dict) else None) or env.get("primary") or "Unknown"
        confidence = env.get("environment_confidence") or (env.get("environment", {}).get("confidence") if isinstance(env.get("environment"), dict) else None) or env.get("confidence")
        threat_detected = env.get("threat_detected") or env.get("threats") and len(env.get("threats")) > 0 or False
        threat_count = env.get("threat_count") or (len(env.get("threats")) if isinstance(env.get("threats"), list) else 0)

        env_block = {
            "primary_environment": primary,
            "confidence": confidence,
            "threat_detected": bool(threat_detected),
            "threat_count": int(threat_count or 0),
            "raw": env,
        }
        self.report["environment"] = env_block
        return env_block

    def process_threat_event_forensics(self):
        # Accept either 'threat_timeline' or 'threats' or 'events'
        events = self.full_data.get("threat_timeline") or self.full_data.get("threats") or self.full_data.get("events") or []
        results = {
            "total_events": len(events),
            "threat_events": [],
            "non_threat_events": [],
            "event_types_count": {},
            "first_threat_time": None,
            "highest_severity": "NONE",
            "event_details": events,
        }

        if not events:
            self.report["threats"] = results
            return results

        severity_priority = {"CRITICAL": 3, "HIGH": 2, "MEDIUM": 1, "LOW": 1, "NONE": 0}
        highest_score = -1
        first_time = None
        type_counter = {}

        for ev in events:
            label = ev.get("label", "Unknown")
            is_threat = bool(ev.get("is_threat") or ev.get("threat") or (ev.get("threat_priority") and ev.get("threat_priority") != "NONE"))
            pr = ev.get("threat_priority") or ev.get("priority") or ("CRITICAL" if "gun" in label.lower() or "explosion" in label.lower() else ("HIGH" if "siren" in label.lower() else "NONE"))
            score = severity_priority.get(pr, 0)
            type_counter[label] = type_counter.get(label, 0) + 1

            if is_threat:
                results["threat_events"].append(ev)
                start = ev.get("start_time")
                if first_time is None and start is not None:
                    first_time = start
            else:
                results["non_threat_events"].append(ev)

            if score > highest_score:
                highest_score = score
                results["highest_severity"] = pr

        results["event_types_count"] = type_counter
        results["first_threat_time"] = first_time
        self.report["threats"] = results
        return results

    def process_translation_forensics(self):
        nmt = self.full_data.get("nmt_translation") or {}
        if not nmt:
            self.report["translation"] = {"available": False}
            return self.report["translation"]

        full_trans = nmt.get("full_translation") or nmt.get("translation_text") or ""
        chunks = nmt.get("chunks") or []
        # detect sensitive keywords (same set as original)
        SENSITIVE = ["weapon", "gun", "shot", "kill", "police", "emergency", "danger", "threat", "attack", "bomb", "explode", "help"]
        found = [k for k in SENSITIVE if k in full_trans.lower()]
        consistency = 0.0
        if chunks:
            lens = [len(c.get("cleaned_translation", "")) for c in chunks]
            avg = sum(lens) / len(lens) if lens else 0
            dev = sum(abs(l - avg) for l in lens) / (len(lens) * (avg + 1e-6))
            consistency = max(0.0, 1.0 - dev)
        trans_block = {
            "available": True,
            "source_language": nmt.get("source_language"),
            "target_language": nmt.get("target_language"),
            "num_chunks": len(chunks),
            "translation_integrity_score": round(consistency, 3),
            "sensitive_terms_detected": found,
            "full_translation": full_trans,
            "chunks": chunks,
        }
        self.report["translation"] = trans_block
        return trans_block

    def process_authenticity_forensics(self):
        df = self.full_data.get("deepfake_analysis") or {}
        pred = df.get("prediction") or df.get("label") or {}
        label = None
        score = None
        if isinstance(pred, dict):
            label = pred.get("label") or pred.get("result") or pred.get("verdict")
            score = pred.get("confidence") or pred.get("score") or pred.get("probability")
        elif isinstance(pred, str):
            label = pred
        else:
            label = df.get("label") or df.get("verdict")

        label = (label or "unknown")
        try:
            score = float(score) if score is not None else None
        except Exception:
            score = None

        # simple verdict text mapping
        verdict = "Insufficient evidence"
        if label and label.lower() in ("real", "authentic", "genuine"):
            if score is None:
                verdict = "Model indicates authentic speech."
            elif score >= 0.9:
                verdict = "Very strong evidence of authentic human speech."
            elif score >= 0.7:
                verdict = "Likely authentic."
            elif score >= 0.5:
                verdict = "Possibly authentic, weak confidence."
            else:
                verdict = "Low confidence — authenticity unclear."
        elif label and label.lower() in ("fake", "synthesized", "manipulated", "spoof"):
            if score is None:
                verdict = "Model indicates possible manipulation."
            elif score >= 0.9:
                verdict = "Strong evidence of manipulation or synthesis."
            elif score >= 0.7:
                verdict = "Likely synthetic or edited."
            elif score >= 0.5:
                verdict = "Some signs of manipulation, unclear."
            else:
                verdict = "Low-confidence detection of manipulation."
        else:
            verdict = "No clear authenticity verdict."

        # continuity checks (reuse ASR + metadata)
        continuity = {}
        metadata = self.report.get("audio_metadata", {})
        transcript_count = self.report.get("asr", {}).get("num_words", 0) or 0
        total_speech = metadata.get("speech_duration_s") or metadata.get("total_duration") or None
        if total_speech and total_speech > 0:
            wpm = round((transcript_count / total_speech) * 60, 2)
            continuity["words_per_minute"] = wpm
            continuity["transcript_alignment"] = "Consistent" if 60 <= wpm <= 200 else "Possible inconsistency (WPM abnormal)"
        else:
            continuity["transcript_alignment"] = "Not enough speech"

        # event timestamp checks
        total_duration = metadata.get("total_duration")
        events = self.full_data.get("events") or []
        ok = True
        for ev in events:
            st = ev.get("start_time")
            if st is not None and total_duration is not None and st > total_duration + 1e-3:
                ok = False
                break
        continuity["event_timing_consistency"] = "Consistent" if ok else "Event timestamps beyond audio duration"

        auth_block = {
            "deepfake_label": label,
            "deepfake_score": score,
            "authenticity_verdict": verdict,
            "continuity_checks": continuity,
            "raw": df,
        }
        self.report["authenticity"] = auth_block
        return auth_block

    # -------------------------
    # Summaries
    # -------------------------
    def build_executive_summary(self):
        md = self.report.get("audio_metadata", {})
        thr = self.report.get("threats", {})
        emo = self.report.get("emotion", {})
        auth = self.report.get("authenticity", {})
        env = self.report.get("environment", {})

        parts = []
        parts.append(f"File: {md.get('audio_file') or 'unknown'}, duration: {md.get('total_duration') or 'unknown'}s.")
        if thr and thr.get("total_events") is not None:
            parts.append(f"{thr.get('total_events')} events detected; highest severity: {thr.get('highest_severity')}.")
        if auth:
            parts.append(f"Authenticity: {auth.get('authenticity_verdict')}.")
        if emo and emo.get("dominant_emotion"):
            parts.append(f"Dominant emotion: {emo.get('dominant_emotion')} (stress {emo.get('high_stress_total_duration_s')}s).")
        if env:
            parts.append(f"Environment: {env.get('primary_environment')} (conf {env.get('confidence')}).")

        summary = " ".join(parts)
        self.executive_summary = summary
        self.report["executive_summary"] = {"executive_overview": summary}
        return summary

    def build_final_conclusion(self):
        thr = self.report.get("threats", {})
        emo = self.report.get("emotion", {})
        auth = self.report.get("authenticity", {})
        trans = self.report.get("translation", {})

        conclusions = []
        sev = thr.get("highest_severity", "NONE")
        if sev == "CRITICAL":
            conclusions.append("Critical threats detected; urgent review recommended.")
        elif sev == "HIGH":
            conclusions.append("High-severity indicators detected; context review recommended.")
        else:
            conclusions.append("No immediate critical threats detected by automated analysis.")

        if emo.get("high_stress_total_duration_s", 0) > 10:
            conclusions.append("Prolonged stress signals observed.")
        if auth and auth.get("deepfake_label"):
            conclusions.append(f"Authenticity check: {auth.get('authenticity_verdict')}")

        if trans.get("sensitive_terms_detected"):
            conclusions.append(f"Sensitive terms in translation: {trans.get('sensitive_terms_detected')}")

        final = " ".join(conclusions)
        self.final_conclusion = final
        self.report["final_conclusion"] = {"final_conclusion_text": final}
        return final

    # -------------------------
    # LLM text enhancement
    # -------------------------
    def enhance_report_text(self, max_tokens: int = 256):
        """
        Use provided tokenizer+llm to refine executive summary and final conclusion.
        If tokenizer/llm not present, set enhanced_text to drafts.
        Returns dict of enhanced text.
        """
        base_summary = self.executive_summary or self.report.get("executive_summary", {}).get("executive_overview", "")
        base_conclusion = self.final_conclusion or self.report.get("final_conclusion", {}).get("final_conclusion_text", "")

        if not self.tokenizer or not self.llm or not TORCH_AVAILABLE:
            self.enhanced_text["executive_summary"] = base_summary
            self.enhanced_text["final_conclusion"] = base_conclusion
            return self.enhanced_text

        # Build compact prompt emphasizing using JSON fields
        prompt = (
            "Polish and condense the following forensic executive summary and conclusion. "
            "Base the rewrite only on the provided facts and JSON fields. "
            "Produce a short executive summary (3-5 sentences) and a short conclusion (2-4 sentences). "
            "Label headings 'Executive summary:' and 'Conclusion:' and nothing else.\n\n"
            f"Executive summary draft:\n{base_summary}\n\n"
            f"Conclusion draft:\n{base_conclusion}\n\n"
            "Return the polished text now."
        )

        # Tokenize and run model
        try:
            device = next(self.llm.parameters()).device
            inputs = self.tokenizer(prompt, return_tensors="pt", truncation=True).to(device)
            with torch.no_grad():
                outputs = self.llm.generate(**inputs, max_new_tokens=max_tokens, do_sample=False)
            decoded = self.tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
            # Attempt to split by labels
            exec_text, concl_text = decoded, decoded
            lower = decoded.lower()
            if "executive summary:" in lower and "conclusion:" in lower:
                i = lower.find("executive summary:")
                j = lower.find("conclusion:")
                exec_text = decoded[i:j].strip()
                concl_text = decoded[j:].strip()
            # sanitize minimal echo
            exec_text = self._sanitize_text(exec_text)
            concl_text = self._sanitize_text(concl_text)
            self.enhanced_text["executive_summary"] = exec_text
            self.enhanced_text["final_conclusion"] = concl_text
            # store back into report for PDF/consumption
            self.report.setdefault("executive_summary", {})["enhanced"] = exec_text
            self.report.setdefault("final_conclusion", {})["enhanced"] = concl_text
            return self.enhanced_text
        except Exception as e:
            # fallback to base drafts
            self.enhanced_text["executive_summary"] = base_summary
            self.enhanced_text["final_conclusion"] = base_conclusion
            self.enhanced_text["enhance_error"] = str(e)
            return self.enhanced_text

    def _sanitize_text(self, text: str) -> str:
        if not text:
            return ""
        t = str(text)
        # remove excessive whitespace and prompt echoes
        t = t.replace("Executive summary:", "").replace("Conclusion:", "")
        t = " ".join(t.split())
        return t.strip()

    # -------------------------
    # Plots
    # -------------------------
    def generate_all_plots(self, save_dir: str = "./forensic_plots"):
        os.makedirs(save_dir, exist_ok=True)
        self.plots = []
        # speaker timeline
        try:
            p1 = self._plot_speaker_timeline(save_dir)
            if p1:
                self.plots.append(p1)
        except Exception:
            pass
        # emotion heatmap
        try:
            p2 = self._plot_emotion_heatmap(save_dir)
            if p2:
                self.plots.append(p2)
        except Exception:
            pass
        # threat timeline
        try:
            p3 = self._plot_threat_timeline(save_dir)
            if p3:
                self.plots.append(p3)
        except Exception:
            pass
        return self.plots

    def _plot_speaker_timeline(self, save_dir):
        speakers = self.full_data.get("speakers") or {}
        segs = []
        if isinstance(speakers, dict):
            keys = list(speakers.keys())
            for spk, info in speakers.items():
                for seg in info.get("segments", []):
                    segs.append((spk, seg.get("start_time", 0), seg.get("end_time", 0)))
            order = sorted(keys)
        elif isinstance(speakers, list):
            order = [s.get("speaker") or s.get("id") or f"spk{i}" for i, s in enumerate(speakers)]
            for s in speakers:
                spk = s.get("speaker") or s.get("id") or None
                for seg in s.get("segments", []):
                    segs.append((spk, seg.get("start_time", 0), seg.get("end_time", 0)))
        else:
            return None

        if not MATPLOTLIB_AVAILABLE:
            return None

        if not segs:
            # create a small placeholder image
            fig, ax = plt.subplots(figsize=(8, 2))
            ax.text(0.5, 0.5, "No speaker segments available", ha="center")
            path = os.path.join(save_dir, "plot_speaker_timeline.png")
            fig.savefig(path, dpi=150)
            plt.close(fig)
            return path

        ymap = {s: i for i, s in enumerate(sorted(set([s for s, _, _ in segs if s is not None])))}
        fig, ax = plt.subplots(figsize=(12, 2 + len(ymap) * 0.3))
        for spk, s, e in segs:
            if spk is None:
                continue
            ax.barh(ymap[spk], e - s, left=s, height=0.4)
        ax.set_yticks(list(ymap.values()))
        ax.set_yticklabels(list(ymap.keys()))
        ax.set_xlabel("Time (s)")
        ax.set_title("Speaker timeline")
        fig.tight_layout()
        path = os.path.join(save_dir, "plot_speaker_timeline.png")
        fig.savefig(path, dpi=150)
        plt.close(fig)
        return path

    def _plot_emotion_heatmap(self, save_dir):
        emo = self.full_data.get("emotion_analysis") or {}
        probs = emo.get("probability_curves") or emo.get("smoothed_probabilities") or emo.get("frame_probabilities") or {}
        # expected structure: { "emotions": [...], "times": [...], "matrix": [[...]] } or direct matrix
        emotions = probs.get("emotions") or emo.get("labels") or []
        times = probs.get("times") or emo.get("times") or []
        matrix = np.array(probs.get("matrix") or probs.get("smoothed_probabilities") or probs.get("probabilities") or [])
        if matrix.size == 0:
            return None
        if not MATPLOTLIB_AVAILABLE:
            return None
        fig, ax = plt.subplots(figsize=(12, 4))
        im = ax.imshow(matrix.T, aspect="auto", origin="lower")
        ax.set_yticks(range(len(emotions)) if emotions else [])
        ax.set_yticklabels(emotions if emotions else [])
        ax.set_xlabel("Frame")
        ax.set_title("Emotion probability heatmap")
        fig.colorbar(im, ax=ax)
        fig.tight_layout()
        path = os.path.join(save_dir, "plot_emotion_heatmap.png")
        fig.savefig(path, dpi=150)
        plt.close(fig)
        return path

    def _plot_threat_timeline(self, save_dir):
        events = self.full_data.get("events") or self.full_data.get("threat_timeline") or []
        if not events:
            return None
        times = [ev.get("start_time", 0) for ev in events]
        priority_map = {"NONE": 0, "LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
        levels = [priority_map.get(ev.get("threat_priority", "NONE"), 0) for ev in events]
        if not MATPLOTLIB_AVAILABLE:
            return None
        fig, ax = plt.subplots(figsize=(12, 2))
        ax.step(times, levels, where="post")
        ax.set_yticks(list(priority_map.values()))
        ax.set_yticklabels(list(priority_map.keys()))
        ax.set_xlabel("Time (s)")
        ax.set_title("Threat timeline")
        fig.tight_layout()
        path = os.path.join(save_dir, "plot_threat_timeline.png")
        fig.savefig(path, dpi=150)
        plt.close(fig)
        return path

    # -------------------------
    # PDF assembly
    # -------------------------
    def build_pdf_report(self, output_path: str):
        """
        Build a PDF combining the report text and plots.
        Prefer reportlab, fallback to PdfPages (matplotlib).
        Returns the path to the created file (PDF or JSON fallback).
        """
        # ensure report sections exist
        if not self.report:
            # run pipeline steps if not already done
            self.process_audio_metadata()
            self.process_asr_transcript()
            self.process_speaker_diarization()
            self.process_emotion_forensics()
            self.process_environment_forensics()
            self.process_threat_event_forensics()
            self.process_translation_forensics()
            self.process_authenticity_forensics()
            self.build_executive_summary()
            self.build_final_conclusion()

        # Default directories
        out_dir = os.path.dirname(output_path) or "./"
        os.makedirs(out_dir, exist_ok=True)

        # Use reportlab if available
        if REPORTLAB_AVAILABLE:
            try:
                doc = SimpleDocTemplate(output_path, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=1.7*cm, bottomMargin=1.7*cm)
                styles = getSampleStyleSheet()
                styles.add(ParagraphStyle(name="TitleBig", fontSize=18, leading=22, alignment=1, spaceAfter=12))
                styles.add(ParagraphStyle(name="SectionHeading", fontSize=13, leading=16, textColor=colors.HexColor("#1A3D7C"), spaceBefore=12, spaceAfter=6))
                styles.add(ParagraphStyle(name="Body", fontSize=10, leading=13))

                story = []
                md = self.report.get("audio_metadata", {})
                story.append(Paragraph("Forensic Audio Analysis Report", styles["TitleBig"]))
                story.append(Paragraph(f"File: {md.get('audio_file') or 'Unknown'}", styles["Body"]))
                story.append(Paragraph(f"Duration: {md.get('total_duration_pretty') or 'Unknown'}", styles["Body"]))
                story.append(Spacer(1, 12))

                # Executive summary
                story.append(Paragraph("Executive summary", styles["SectionHeading"]))
                exec_text = self.report.get("executive_summary", {}).get("enhanced") or self.report.get("executive_summary", {}).get("executive_overview", "")
                story.append(Paragraph(exec_text, styles["Body"]))
                story.append(Spacer(1, 10))

                # Short tables for metadata and key stats
                meta_table = [
                    ["Sampling rate (Hz)", md.get("sample_rate")],
                    ["Speech duration", md.get("speech_duration_pretty")],
                    ["Speech density (%)", md.get("speech_density_percent")],
                    ["Speakers", md.get("num_speakers")],
                    ["Language", md.get("language")],
                ]
                t = Table(meta_table, colWidths=[6*cm, 8*cm])
                t.setStyle(TableStyle([("GRID", (0,0), (-1,-1), 0.3, colors.grey), ("BACKGROUND", (0,0), (0,-1), colors.HexColor("#F0F0F0"))]))
                story.append(t)
                story.append(Spacer(1, 12))

                # Threat summary block
                story.append(Paragraph("Threat summary", styles["SectionHeading"]))
                threat = self.report.get("threats", {})
                threat_text = f"Detected events: {threat.get('total_events',0)}, highest severity: {threat.get('highest_severity','NONE')}."
                story.append(Paragraph(threat_text, styles["Body"]))
                story.append(Spacer(1, 8))

                # Add plots if exist
                plot_dir = os.path.dirname(self.plots[0]) if self.plots else None
                for plot in self.plots:
                    if plot and os.path.exists(plot):
                        try:
                            story.append(Image(plot, width=460, height=160))
                            story.append(Spacer(1, 8))
                        except Exception:
                            # skip if image cannot be embedded
                            pass

                # Final conclusion
                story.append(PageBreak())
                story.append(Paragraph("Final conclusion", styles["SectionHeading"]))
                final = self.report.get("final_conclusion", {}).get("enhanced") or self.report.get("final_conclusion", {}).get("final_conclusion_text", "")
                story.append(Paragraph(final, styles["Body"]))

                doc.build(story)
                return output_path
            except Exception:
                # fall through to matplotlib fallback
                pass

        # reportlab not available or failed, try matplotlib PdfPages fallback
        if MATPLOTLIB_AVAILABLE:
            try:
                with PdfPages(output_path) as pp:
                    # page 1: text summary using matplotlib text
                    fig, ax = plt.subplots(figsize=(8.27, 11.69))  # A4 in inches
                    ax.axis("off")
                    md = self.report.get("audio_metadata", {})
                    y = 0.95
                    lines = [
                        "Forensic Audio Analysis Report",
                        f"File: {md.get('audio_file', 'Unknown')}",
                        f"Duration: {md.get('total_duration_pretty', 'Unknown')}",
                        "",
                        "Executive summary:",
                        self.report.get("executive_summary", {}).get("enhanced") or self.report.get("executive_summary", {}).get("executive_overview",""),
                        "",
                        "Threat summary:",
                        f"Events: {self.report.get('threats',{}).get('total_events',0)}, Highest severity: {self.report.get('threats',{}).get('highest_severity','NONE')}",
                        "",
                        "Final conclusion:",
                        self.report.get("final_conclusion", {}).get("enhanced") or self.report.get("final_conclusion", {}).get("final_conclusion_text",""),
                    ]
                    text = "\n\n".join([l for l in lines if l is not None])
                    ax.text(0.02, 0.98, text, va="top", ha="left", wrap=True, fontsize=9)
                    pp.savefig(fig)
                    plt.close(fig)
                    # subsequent pages: plots
                    for plot in self.plots:
                        if os.path.exists(plot):
                            img = plt.imread(plot)
                            fig, ax = plt.subplots(figsize=(8.27, 11.69))
                            ax.imshow(img)
                            ax.axis("off")
                            pp.savefig(fig)
                            plt.close(fig)
                return output_path
            except Exception:
                pass

        # As a final fallback, write JSON summary next to requested path
        fallback = output_path + ".json"
        try:
            with open(fallback, "w", encoding="utf8") as fh:
                json.dump(self.report, fh, ensure_ascii=False, indent=2)
            return fallback
        except Exception:
            # worst-case, return None
            return None
