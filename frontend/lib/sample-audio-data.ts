// Sample audio analysis data based on provided JSON structure

export const sampleAudioData = [
  {
    "task": "captioning",
    "transcript": "सूचना मिलते ही दमकल की गाड़ी घटना स्थल पर पहुँच गई।",
    "input": "what is the caption for this audio?",
    "output": "As soon as the information was received, the fire engine reached the spot.",
    "role": "close ended",
    "audiopath": "844424930324567-536-m.m4a"
  },
  {
    "task": "classification",
    "transcript": "सूचना मिलते ही दमकल की गाड़ी घटना स्थल पर पहुँच गई।",
    "input": "classify this audio",
    "output": "News",
    "role": "close ended",
    "audiopath": "844424930324567-536-m.m4a"
  },
  {
    "task": "temporal analysis",
    "transcript": "सूचना मिलते ही दमकल की गाड़ी घटना स्थल पर पहुँच गई। इसके अतिरिक्त आक की एक और जाति पाई जाती है।",
    "input": "diarize this audio with timestamps",
    "output": {
      "segments": [
        {
          "start_time": "0.00",
          "end_time": "4.50",
          "speaker": "Speaker 1",
          "text": "सूचना मिलते ही दमकल की गाड़ी घटना स्थल पर पहुँच गई।"
        },
        {
          "start_time": "4.50",
          "end_time": "6.80",
          "speaker": "Speaker 1",
          "text": "इसके अतिरिक्त आक की एक और जाति पाई जाती है"
        }
      ],
      "analysis_type": "temporal analysis"
    },
    "role": "close ended",
    "audiopath": "844424930324567-536-m.m4a"
  },
  {
    "task": "acoustic features",
    "transcript": "सूचना मिलते ही दमकल की गाड़ी घटना स्थल पर पहुँच गई। इसके अतिरिक्त आक की एक और जाति पाई जाती है।",
    "input": "acoustic features",
    "role": "close ended",
    "audiopath": "844424930324567-536-m.m4a",
    "features": [
      {
        "feature_name": "Pitch",
        "analysis": "Moderate and stable Fundamental Frequency, characteristic of declarative and narrative speech."
      },
      {
        "feature_name": "Intensity",
        "analysis": "Consistent, moderate loudness (intensity), indicating a clear recording with no background noise or volume fluctuation."
      },
      {
        "feature_name": "Timbre & Rate",
        "analysis": "Clear adult voice quality, delivered at a deliberate and well-articulated pace, typical for an informational read or report."
      }
    ]
  }
]

export const sampleQAData = {
  "audio_path": "data/audio/utt123.wav",
  "questions": [
    {
      "qid": "utt123_q1",
      "question": "What did the speaker say after mentioning the train?",
      "answer": "He said he will arrive late.",
      "answer_type": "span",
      "is_answerable": true
    }
  ]
}

export const sampleAlignmentData = {
  "transcript": "The train is delayed. I will arrive late.",
  "alignment": [
    {"word": "The", "start": 0.02, "end": 0.15},
    {"word": "train", "start": 0.15, "end": 0.40},
    {"word": "is", "start": 0.40, "end": 0.55},
    {"word": "delayed", "start": 0.55, "end": 0.95},
    {"word": "I", "start": 1.00, "end": 1.10},
    {"word": "will", "start": 1.10, "end": 1.30},
    {"word": "arrive", "start": 1.30, "end": 1.65},
    {"word": "late", "start": 1.65, "end": 2.00}
  ]
}


