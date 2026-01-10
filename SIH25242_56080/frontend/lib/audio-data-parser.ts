// Parser for audio analysis data based on provided JSON structure

export interface CaptionData {
  task: "captioning"
  transcript: string
  input: string
  output: string
  role: "close ended" | "open ended"
  audiopath: string
}

export interface ClassificationData {
  task: "classification"
  transcript: string
  input: string
  output: string
  role: "close ended" | "open ended"
  audiopath: string
}

export interface TemporalAnalysisData {
  task: "temporal analysis"
  transcript: string
  input: string
  output: {
    segments: Array<{
      start_time: string
      end_time: string
      speaker: string
      text: string
    }>
    analysis_type: string
  }
  role: "close ended" | "open ended"
  audiopath: string
}

export interface AcousticFeaturesData {
  task: "acoustic features"
  transcript: string
  input: string
  role: "close ended" | "open ended"
  audiopath: string
  features: Array<{
    feature_name: string
    analysis: string
  }>
}

export interface QAData {
  audio_path: string
  questions: Array<{
    qid: string
    question: string
    answer: string
    answer_type: string
    is_answerable: boolean
  }>
}

export interface TranscriptAlignment {
  transcript: string
  alignment: Array<{
    word: string
    start: number
    end: number
  }>
}

export type AudioAnalysisData = 
  | CaptionData 
  | ClassificationData 
  | TemporalAnalysisData 
  | AcousticFeaturesData

export function parseAudioData(data: any[]): {
  caption?: CaptionData
  classification?: ClassificationData
  temporalAnalysis?: TemporalAnalysisData
  acousticFeatures?: AcousticFeaturesData
  qa?: QAData
  alignment?: TranscriptAlignment
} {
  const result: any = {}
  
  data.forEach((item: any) => {
    switch (item.task) {
      case "captioning":
        result.caption = item as CaptionData
        break
      case "classification":
        result.classification = item as ClassificationData
        break
      case "temporal analysis":
        result.temporalAnalysis = item as TemporalAnalysisData
        break
      case "acoustic features":
        result.acousticFeatures = item as AcousticFeaturesData
        break
    }
    
    if (item.audio_path && item.questions) {
      result.qa = item as QAData
    }
    
    if (item.transcript && item.alignment) {
      result.alignment = item as TranscriptAlignment
    }
  })
  
  return result
}

export function getTranscript(data: AudioAnalysisData[]): string {
  const caption = data.find(d => d.task === "captioning") as CaptionData | undefined
  return caption?.transcript || ""
}

export function getCaption(data: AudioAnalysisData[]): string {
  const caption = data.find(d => d.task === "captioning") as CaptionData | undefined
  return caption?.output || ""
}

export function getClassification(data: AudioAnalysisData[]): string {
  const classification = data.find(d => d.task === "classification") as ClassificationData | undefined
  return classification?.output || ""
}

export function getDiarizationSegments(data: AudioAnalysisData[]): Array<{
  start_time: string
  end_time: string
  speaker: string
  text: string
}> {
  const temporal = data.find(d => d.task === "temporal analysis") as TemporalAnalysisData | undefined
  return temporal?.output?.segments || []
}

export function getAcousticFeatures(data: AudioAnalysisData[]): Array<{
  feature_name: string
  analysis: string
}> {
  const acoustic = data.find(d => d.task === "acoustic features") as AcousticFeaturesData | undefined
  return acoustic?.features || []
}


