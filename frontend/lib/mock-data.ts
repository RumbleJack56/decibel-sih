// Mock ML analysis data based on the provided JSON schema
export const mockAnalysisData = {
  metadata: {
    audio_file: "uploaded_audio.wav",
    sample_rate: 16000,
    total_duration: 425.678,
    total_speech_duration: 380.234,
    num_segments: 15,
    num_speakers: 3,
    language: "auto-detected",
    model_versions: {
      vad: "silero-vad",
      diarization: "nemo_titanet_large",
      asr: "large-v3",
      scene_event: "ast-finetuned-audioset-10-10-0.4593",
      audio_captioning: "MU-NLPC/whisper-large-v2-audio-captioning",
      nmt: "facebook/seamless-m4t-v2-large",
      emotion: "superb/wav2vec2-base-superb-er",
      deepfake: "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification"
    }
  },

  scene_analysis: {
    prefilter_windows_total: 850,
    prefilter_windows_flagged: 12,
    prefilter_time_ms: 145.32,
    ast_inference_time_ms: 4230.18,
    total_time_ms: 4375.5
  },

  events: [
    {
      label: "Speech, human voice",
      confidence: 0.95,
      start_time: 0.0,
      end_time: 425.5,
      is_threat: false,
      threat_priority: "NONE"
    },
    {
      label: "Keyboard typing",
      confidence: 0.82,
      start_time: 15.2,
      end_time: 18.4,
      is_threat: false,
      threat_priority: "NONE"
    },
    {
      label: "Door slam",
      confidence: 0.78,
      start_time: 45.3,
      end_time: 46.1,
      is_threat: false,
      threat_priority: "LOW"
    },
    {
      label: "Vehicle horn",
      confidence: 0.88,
      start_time: 120.5,
      end_time: 122.3,
      is_threat: false,
      threat_priority: "NONE"
    },
    {
      label: "Phone ringing",
      confidence: 0.91,
      start_time: 180.0,
      end_time: 185.5,
      is_threat: false,
      threat_priority: "NONE"
    }
  ],

  threat_timeline: [],

  environment_context: {
    primary_environment: "Indoor - Office",
    environment_confidence: 0.87,
    threat_detected: false,
    threat_count: 0
  },

  audio_captions: {
    total_clips: 42,
    total_duration_s: 425.678,
    inference_time_ms: 12450.75,
    captions: [
      {
        start_time: 0.0,
        end_time: 10.0,
        duration_s: 10.0,
        caption: "A person is speaking clearly in a quiet indoor environment with light background noise."
      },
      {
        start_time: 10.0,
        end_time: 20.0,
        duration_s: 10.0,
        caption: "Two people are having a conversation with occasional keyboard typing sounds."
      },
      {
        start_time: 45.0,
        end_time: 55.0,
        duration_s: 10.0,
        caption: "A door closes followed by footsteps and continued conversation."
      },
      {
        start_time: 120.0,
        end_time: 130.0,
        duration_s: 10.0,
        caption: "Background traffic noise with a car horn, speakers continue discussion."
      },
      {
        start_time: 180.0,
        end_time: 190.0,
        duration_s: 10.0,
        caption: "A phone rings briefly before being answered, conversation continues."
      }
    ]
  },

  nmt_translation: {
    model: "facebook/seamless-m4t-v2-large",
    source_language: "auto",
    target_language: "eng",
    chunk_sec: 10,
    overlap_sec: 3,
    num_chunks: 9,
    chunks: [
      {
        chunk_index: 0,
        start_time: 0.0,
        end_time: 10.0,
        raw_translation: "Hello everyone, let's begin today's meeting.",
        cleaned_translation: "Hello everyone, let's begin today's meeting."
      },
      {
        chunk_index: 1,
        start_time: 10.0,
        end_time: 20.0,
        raw_translation: "Today we'll discuss the quarterly results and future plans.",
        cleaned_translation: "Today we'll discuss the quarterly results and future plans."
      }
    ],
    full_translation: "Hello everyone, let's begin today's meeting. Today we'll discuss the quarterly results and future plans. The team has made significant progress on the main project. We need to address the timeline concerns raised by stakeholders. Overall, the sentiment is positive about our direction."
  },

  emotion_analysis: {
    model: "superb/wav2vec2-base-superb-er",
    sample_rate: 16000,
    window_sec: 3.0,
    step_sec: 1.5,
    labels: ["angry", "happy", "sad", "neutral"],
    timeline: [
      {
        start_time: 0.0,
        end_time: 3.0,
        raw_emotion: "neutral",
        smoothed_emotion: "neutral",
        confidence: 0.88,
        is_silence: false
      },
      {
        start_time: 3.0,
        end_time: 6.0,
        raw_emotion: "happy",
        smoothed_emotion: "happy",
        confidence: 0.75,
        is_silence: false
      },
      {
        start_time: 45.0,
        end_time: 48.0,
        raw_emotion: "neutral",
        smoothed_emotion: "neutral",
        confidence: 0.82,
        is_silence: false
      }
    ],
    probability_curves: {
      times: [1.5, 3.0, 4.5, 6.0],
      emotions: ["angry", "happy", "sad", "neutral"],
      smoothed_probabilities: [
        [0.05, 0.15, 0.05, 0.75],
        [0.05, 0.25, 0.05, 0.65],
        [0.05, 0.35, 0.05, 0.55],
        [0.10, 0.20, 0.10, 0.60]
      ]
    }
  },

  deepfake_analysis: {
    model: "Gustking/wav2vec2-large-xlsr-deepfake-audio-classification",
    sample_rate: 16000,
    prediction: {
      label: "real",
      score: 0.94
    },
    top_k: [
      { label: "real", score: 0.94 },
      { label: "fake", score: 0.06 }
    ],
    raw_logits: null
  },

  speakers: {
    SPEAKER_00: {
      speaker_id: "SPEAKER_00",
      color: "#ff4da6",
      total_duration: 180.456,
      segments: [
        {
          segment_id: 0,
          start_time: 0.0,
          end_time: 35.2,
          duration: 35.2,
          text: "Hello everyone, welcome to today's meeting. I'm excited to share our quarterly progress with you all. Let's start with the overview.",
          lemmatized: "hello everyone welcome today meeting excited share quarterly progress start overview",
          stemmed: "hello everyon welcom today meet excit share quarterli progress start overview"
        },
        {
          segment_id: 3,
          start_time: 80.0,
          end_time: 120.0,
          duration: 40.0,
          text: "As you can see from the charts, our revenue has increased by 25% this quarter. This is largely due to the new product launch and improved customer retention.",
          lemmatized: "chart revenue increased quarter largely due new product launch improved customer retention",
          stemmed: "chart revenu increas quarter larg due new product launch improv custom retent"
        },
        {
          segment_id: 6,
          start_time: 200.0,
          end_time: 250.0,
          duration: 50.0,
          text: "For the next quarter, we're planning to expand into three new markets. The team has been working hard on the localization efforts.",
          lemmatized: "next quarter planning expand three new markets team working hard localization efforts",
          stemmed: "next quarter plan expand three new market team work hard local effort"
        }
      ]
    },
    SPEAKER_01: {
      speaker_id: "SPEAKER_01",
      color: "#6ef78b",
      total_duration: 120.778,
      segments: [
        {
          segment_id: 1,
          start_time: 35.2,
          end_time: 55.0,
          duration: 19.8,
          text: "Thank you for the introduction. I'd like to add some context about our development progress. We've completed 85% of our roadmap items.",
          lemmatized: "thank introduction like add context development progress completed roadmap items",
          stemmed: "thank introduct like add context develop progress complet roadmap item"
        },
        {
          segment_id: 4,
          start_time: 120.0,
          end_time: 160.0,
          duration: 40.0,
          text: "The customer feedback has been overwhelmingly positive. Our NPS score improved from 42 to 67 this quarter, which is a significant achievement.",
          lemmatized: "customer feedback overwhelmingly positive nps score improved quarter significant achievement",
          stemmed: "custom feedback overwhelmingli posit nps score improv quarter signific achiev"
        }
      ]
    },
    SPEAKER_02: {
      speaker_id: "SPEAKER_02",
      color: "#4da6ff",
      total_duration: 79.0,
      segments: [
        {
          segment_id: 2,
          start_time: 55.0,
          end_time: 80.0,
          duration: 25.0,
          text: "I have a question about the budget allocation. Are we planning to increase the marketing spend for the new markets?",
          lemmatized: "question budget allocation planning increase marketing spend new markets",
          stemmed: "question budget alloc plan increas market spend new market"
        },
        {
          segment_id: 5,
          start_time: 160.0,
          end_time: 200.0,
          duration: 40.0,
          text: "That's great to hear. I think we should also focus on the enterprise segment. The conversion rates there have been promising.",
          lemmatized: "great hear think focus enterprise segment conversion rates promising",
          stemmed: "great hear think focus enterpris segment convers rate promis"
        }
      ]
    }
  },

  transcript: [
    {
      segment_id: 0,
      speaker: "SPEAKER_00",
      start_time: 0.0,
      end_time: 35.2,
      text: "Hello everyone, welcome to today's meeting. I'm excited to share our quarterly progress with you all. Let's start with the overview.",
      translation: "Hola a todos, bienvenidos a la reunión de hoy. Estoy emocionado de compartir nuestro progreso trimestral con todos ustedes. Comencemos con la descripción general.",
      lemmatized: "hello everyone welcome today meeting excited share quarterly progress start overview",
      stemmed: "hello everyon welcom today meet excit share quarterli progress start overview",
      words: [
        { word: "Hello", start: 0.3, end: 0.6, probability: 0.97 },
        { word: "everyone", start: 0.7, end: 1.2, probability: 0.95 },
        { word: "welcome", start: 1.3, end: 1.8, probability: 0.94 }
      ]
    },
    {
      segment_id: 1,
      speaker: "SPEAKER_01",
      start_time: 35.2,
      end_time: 55.0,
      text: "Thank you for the introduction. I'd like to add some context about our development progress. We've completed 85% of our roadmap items.",
      translation: "Gracias por la introducción. Me gustaría agregar algo de contexto sobre nuestro progreso de desarrollo. Hemos completado el 85% de los elementos de nuestra hoja de ruta.",
      lemmatized: "thank introduction like add context development progress completed roadmap items",
      stemmed: "thank introduct like add context develop progress complet roadmap item",
      words: [
        { word: "Thank", start: 35.3, end: 35.6, probability: 0.98 },
        { word: "you", start: 35.7, end: 35.9, probability: 0.97 }
      ]
    },
    {
      segment_id: 2,
      speaker: "SPEAKER_02",
      start_time: 55.0,
      end_time: 80.0,
      text: "I have a question about the budget allocation. Are we planning to increase the marketing spend for the new markets?",
      translation: "Tengo una pregunta sobre la asignación del presupuesto. ¿Estamos planeando aumentar el gasto en marketing para los nuevos mercados?",
      lemmatized: "question budget allocation planning increase marketing spend new markets",
      stemmed: "question budget alloc plan increas market spend new market",
      words: []
    },
    {
      segment_id: 3,
      speaker: "SPEAKER_00",
      start_time: 80.0,
      end_time: 120.0,
      text: "As you can see from the charts, our revenue has increased by 25% this quarter. This is largely due to the new product launch and improved customer retention.",
      translation: "Como pueden ver en los gráficos, nuestros ingresos han aumentado un 25% este trimestre. Esto se debe en gran parte al lanzamiento del nuevo producto y a la mejora en la retención de clientes.",
      lemmatized: "chart revenue increased quarter largely due new product launch improved customer retention",
      stemmed: "chart revenu increas quarter larg due new product launch improv custom retent",
      words: []
    },
    {
      segment_id: 4,
      speaker: "SPEAKER_01",
      start_time: 120.0,
      end_time: 160.0,
      text: "The customer feedback has been overwhelmingly positive. Our NPS score improved from 42 to 67 this quarter, which is a significant achievement.",
      translation: "Los comentarios de los clientes han sido abrumadoramente positivos. Nuestra puntuación NPS mejoró de 42 a 67 este trimestre, lo cual es un logro significativo.",
      lemmatized: "customer feedback overwhelmingly positive nps score improved quarter significant achievement",
      stemmed: "custom feedback overwhelmingli posit nps score improv quarter signific achiev",
      words: []
    },
    {
      segment_id: 5,
      speaker: "SPEAKER_02",
      start_time: 160.0,
      end_time: 200.0,
      text: "That's great to hear. I think we should also focus on the enterprise segment. The conversion rates there have been promising.",
      translation: "Es genial escuchar eso. Creo que también deberíamos centrarnos en el segmento empresarial. Las tasas de conversión allí han sido prometedoras.",
      lemmatized: "great hear think focus enterprise segment conversion rates promising",
      stemmed: "great hear think focus enterpris segment convers rate promis",
      words: []
    },
    {
      segment_id: 6,
      speaker: "SPEAKER_00",
      start_time: 200.0,
      end_time: 250.0,
      text: "For the next quarter, we're planning to expand into three new markets. The team has been working hard on the localization efforts.",
      translation: "Para el próximo trimestre, planeamos expandirnos a tres nuevos mercados. El equipo ha estado trabajando duro en los esfuerzos de localización.",
      lemmatized: "next quarter planning expand three new markets team working hard localization efforts",
      stemmed: "next quarter plan expand three new market team work hard local effort",
      words: []
    }
  ],

  bg_environment: {
    scene: "Office Environment",
    tags: ["keyboard", "traffic", "hvac", "footsteps", "phone"],
    scores: {
      keyboard: 0.82,
      traffic: 0.65,
      hvac: 0.78,
      footsteps: 0.45,
      phone: 0.91
    }
  },

  dominance: {
    SPEAKER_00: 0.47,
    SPEAKER_01: 0.32,
    SPEAKER_02: 0.21
  }
}

export function generateMockAnalysis(fileName: string, duration: number) {
  // Generate mock data scaled to the actual duration
  const scale = duration / 425.678
  
  return {
    ...mockAnalysisData,
    metadata: {
      ...mockAnalysisData.metadata,
      audio_file: fileName,
      total_duration: duration,
      total_speech_duration: duration * 0.89
    }
  }
}



