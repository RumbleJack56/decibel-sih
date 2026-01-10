// API Response Types for DECIBEL Backend

// ============================================
// Upload Response
// ============================================
export interface UploadBytesRequest {
  audio_id?: string | null
  data: string // base64-encoded audio bytes
  ext: string // file extension, e.g. "wav", "mp3"
}

export interface UploadBytesResponse {
  audio_id: string
  path: string
}

// ============================================
// Emotion Analysis
// ============================================
export interface EmotionTimelineItem {
  start_time: number
  end_time: number
  raw_emotion: string
  smoothed_emotion: string
  confidence: number
  is_silence: boolean
}

export interface EmotionProbabilityCurves {
  times: number[]
  emotions: string[]
  smoothed_probabilities: number[][] // shape: N windows × num_emotions
}

export interface EmotionAnalysisResponse {
  model: string
  sample_rate: number // 16000
  window_sec: number
  step_sec: number
  labels: string[] // e.g. ["neu","hap","ang","sad"]
  timeline: EmotionTimelineItem[]
  probability_curves: EmotionProbabilityCurves
  metadata: AudioMetadata
}

// ============================================
// Deepfake Analysis
// ============================================
export interface DeepfakePrediction {
  label: string // "real", "fake", etc.
  score: number
}

export interface DeepfakeAnalysisResponse {
  model: string
  sample_rate: number // 16000
  prediction: DeepfakePrediction
  top_k: DeepfakePrediction[]
  raw_logits: null | number[]
  metadata: AudioMetadata
}

// ============================================
// Background/Scene Analysis
// ============================================
export interface BackgroundEvent {
  label: string // e.g. "Speech", "Siren"
  confidence: number
  start_time: number
  end_time: number
  is_threat: boolean
  threat_priority: "CRITICAL" | "HIGH" | "MEDIUM" | "NONE"
}

export interface EnvironmentInfo {
  primary: string // e.g. dominant non-speech scene
  confidence: number
}

export interface SceneAnalysisInfo {
  prefilter_windows_total: number
  prefilter_windows_flagged: number
  prefilter_time_ms: number
  ast_inference_time_ms: number
  total_time_ms: number
}

export interface BackgroundAnalysisResponse {
  model: string
  events: BackgroundEvent[]
  threats: BackgroundEvent[] // subset of events with is_threat = true
  environment: EnvironmentInfo
  scene_analysis: SceneAnalysisInfo
  metadata: AudioMetadata
}

// ============================================
// ASR & Diarization
// ============================================
export interface WordInfo {
  word: string
  start: number
  end: number
  probability: number
  lemmatized: string
  stemmed: string
}

export interface TranscriptSegment {
  segment_id: number
  speaker: string
  start_time: number
  end_time: number
  text: string
  lemmatized: string
  stemmed: string
  words: WordInfo[]
}

export interface SpeakerSegment {
  segment_id: number
  start_time: number
  end_time: number
  duration: number
  text: string
  translation_en?: string // English translation of the text
  lemmatized?: string
  stemmed?: string
}

export interface SpeakerInfo {
  speaker_id: string // e.g. "SPEAKER_00"
  total_duration: number
  segments: SpeakerSegment[]
}

export interface ModelVersions {
  vad: string
  diarization: string
  asr: string
  scene_event?: string
  emotion?: string
  deepfake?: string
}

export interface ASRDiarizationMetadata {
  audio_file: string
  audio_id: string
  path: string
  sample_rate: number // 16000
  total_duration: number
  total_speech_duration: number
  num_segments: number
  num_speakers: number
  language: string // Whisper language code, e.g. "hi"
  model_versions: ModelVersions
}

export interface ASRDiarizationResponse {
  metadata: ASRDiarizationMetadata
  speakers: Record<string, SpeakerInfo> // speaker_id → SpeakerInfo
  transcript: TranscriptSegment[]
}

// ============================================
// Common Audio Metadata
// ============================================
export interface AudioMetadata {
  audio_file: string
  audio_id: string
  path: string
  sample_rate: number
  total_duration: number
}

// ============================================
// Full Analysis Response (combines all)
// ============================================
export interface EnvironmentContext {
  primary_environment: string
  environment_confidence: number
  threat_detected: boolean
  threat_count: number
}

export interface FullAnalysisResponse {
  metadata: ASRDiarizationMetadata
  speakers: Record<string, SpeakerInfo>
  transcript: TranscriptSegment[]
  scene_analysis: SceneAnalysisInfo
  events: BackgroundEvent[]
  threat_timeline: BackgroundEvent[] // events with is_threat = true
  environment_context: EnvironmentContext
  emotion_analysis: Omit<EmotionAnalysisResponse, 'metadata'>
  deepfake_analysis: Omit<DeepfakeAnalysisResponse, 'metadata'>
}

// ============================================
// Chat History (for SQLite storage)
// ============================================
export interface ChatHistoryEntry {
  id?: number
  user_id: string
  audio_id: string
  question: string
  response: string
  created_at?: Date
}

// ============================================
// QnA Request/Response
// ============================================
export interface QnaRequest {
  audio_id: string
  question: string
}

export interface QnaContextUsed {
  metadata: {
    audio_id: string
    file: string
  }
  transcript?: TranscriptSegment[] | null
  speakers?: Record<string, SpeakerInfo> | null
  events?: BackgroundEvent[] | null
  threats?: BackgroundEvent[] | null
  emotion?: EmotionAnalysisResponse | null
  deepfake?: DeepfakePrediction | null
}

export interface QnaResponse {
  audio_id: string
  question: string
  selected_experts: string[]
  answer: string
  context_used: QnaContextUsed
}

// ============================================
// Analysis Store Types (for frontend state)
// ============================================
export interface StoredAnalysis {
  audio_id: string
  audio_name: string
  analysis: FullAnalysisResponse
  uploaded_at: Date
  status: 'processing' | 'completed' | 'failed'
  error?: string
  // Partial failure flags
  has_transcript: boolean
  has_emotion: boolean
  has_deepfake: boolean
  has_events: boolean
}

// ============================================
// API Error Response
// ============================================
export interface APIError {
  error: string
  message: string
  status: number
}

// ============================================
// Foreground/Background Waveform Separation
// ============================================
export interface ForegroundBackgroundWaveformsResponse {
  audio_id: string
  file: string
  sample_rate: number
  num_samples: number
  duration_sec: number
  foreground_num_samples: number
  background_num_samples: number
  foreground_b64: string // base64-encoded float32 array
  background_b64: string // base64-encoded float32 array
  dtype: 'float32'
}

// Decoded waveform data for use in frontend
export interface DecodedWaveforms {
  audioId: string
  fileName: string
  sampleRate: number
  totalSamples: number
  durationSec: number
  foreground: Float32Array
  background: Float32Array
}
