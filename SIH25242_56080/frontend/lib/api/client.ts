import {
  UploadBytesRequest,
  UploadBytesResponse,
  FullAnalysisResponse,
  EmotionAnalysisResponse,
  DeepfakeAnalysisResponse,
  BackgroundAnalysisResponse,
  ASRDiarizationResponse,
  QnaRequest,
  QnaResponse,
  ForegroundBackgroundWaveformsResponse,
  DecodedWaveforms,
  APIError,
} from './types'

// ============================================
// Configuration
// ============================================

// Base URL - DECIBEL Backend via ngrok
const API_BASE_URL = "http://localhost:8000"

// Timeouts (in milliseconds) - Increased for edge device inference
const UPLOAD_TIMEOUT = 120000 // 2 minutes (edge devices may be slower)
const FULL_ANALYSIS_TIMEOUT = 600000 // 10 minutes (analysis can take time on edge)
const DEFAULT_TIMEOUT = 300000 // 5 minutes (increased for edge device inference)
const QNA_TIMEOUT = 180000 // 3 minutes (edge device inference)
const EMOTION_TIMEOUT = 300000 // 5 minutes (emotion analysis on edge)
const DEEPFAKE_TIMEOUT = 300000 // 5 minutes (deepfake analysis on edge)
const DIARIZATION_TIMEOUT = 420000 // 7 minutes (diarization can be slow)
const FORENSICS_PDF_TIMEOUT = 600000 // 10 minutes (full report generation)
const WAVEFORM_SEPARATION_TIMEOUT = 420000 // 7 minutes (audio separation on edge)

// Retry configuration
const MAX_RETRIES = 2
const RETRY_DELAY = 1000 // 1 second

// ============================================
// Helper Functions
// ============================================

class APIClientError extends Error {
  status: number
  isRetryable: boolean

  constructor(message: string, status: number, isRetryable: boolean = false) {
    super(message)
    this.name = 'APIClientError'
    this.status = status
    this.isRetryable = isRetryable
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    console.log(`[API] Fetching: ${url} with timeout: ${timeout}ms`)
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      mode: 'cors', // Explicitly set CORS mode
    })
    console.log(`[API] Response received: ${response.status} ${response.statusText}`)
    return response
  } catch (error) {
    console.error(`[API] Fetch error for ${url}:`, error)
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      // Ignore JSON parse errors
    }

    const isNetworkError = response.status >= 500 || response.status === 0
    throw new APIClientError(errorMessage, response.status, isNetworkError)
  }

  return response.json()
}

async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  timeout: number,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[API] Attempt ${attempt + 1}/${maxRetries + 1} for ${url}`)
      const response = await fetchWithTimeout(url, options, timeout)
      return await handleResponse<T>(response)
    } catch (error) {
      lastError = error as Error
      console.error(`[API] Attempt ${attempt + 1} failed:`, error)

      // Check if error is retryable
      if (error instanceof APIClientError) {
        if (!error.isRetryable || attempt >= maxRetries) {
          throw error
        }
      } else if (error instanceof Error) {
        // Network errors (timeout, connection refused, etc.)
        if (error.name === 'AbortError') {
          throw new APIClientError('Request timed out', 408, false)
        }
        // CORS or network failure - show more details
        const errorMsg = `Network error: ${error.message}. This might be a CORS issue or the server is unreachable.`
        console.error(`[API] ${errorMsg}`)
        if (attempt >= maxRetries) {
          throw new APIClientError(errorMsg, 0, false)
        }
      }

      // Wait before retrying
      if (attempt < maxRetries) {
        console.log(`[API] Retrying in ${RETRY_DELAY * (attempt + 1)}ms...`)
        await sleep(RETRY_DELAY * (attempt + 1))
      }
    }
  }

  throw lastError || new Error('Unknown error')
}

// ============================================
// File Utilities
// ============================================

export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Remove the data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'wav'
}

// ============================================
// API Client Functions
// ============================================

/**
 * Upload audio bytes to the server
 * @param file - The audio file to upload
 * @param audioId - Optional existing audio ID
 * @returns Upload response with audio_id and path
 */
export async function uploadAudioBytes(
  file: File | Blob,
  audioId?: string | null
): Promise<UploadBytesResponse> {
  const base64Data = await fileToBase64(file)
  const ext = file instanceof File ? getFileExtension(file.name) : 'wav'

  const requestBody: UploadBytesRequest = {
    audio_id: audioId || null,
    data: base64Data,
    ext,
  }

  return fetchWithRetry<UploadBytesResponse>(
    `${API_BASE_URL}/upload_bytes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
    },
    UPLOAD_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run full analysis on uploaded audio
 * @param audioId - The audio ID from upload
 * @param file - Optional file to send directly
 * @returns Full analysis response
 */
export async function runFullAnalysis(
  audioId?: string,
  file?: File | Blob
): Promise<FullAnalysisResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  return fetchWithRetry<FullAnalysisResponse>(
    `${API_BASE_URL}/full`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    FULL_ANALYSIS_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run emotion analysis only
 */
export async function runEmotionAnalysis(
  audioId?: string,
  file?: File | Blob
): Promise<EmotionAnalysisResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  return fetchWithRetry<EmotionAnalysisResponse>(
    `${API_BASE_URL}/emotion`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    EMOTION_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run deepfake analysis only
 */
export async function runDeepfakeAnalysis(
  audioId?: string,
  file?: File | Blob
): Promise<DeepfakeAnalysisResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  return fetchWithRetry<DeepfakeAnalysisResponse>(
    `${API_BASE_URL}/deepfake`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    DEEPFAKE_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run background/scene analysis only
 */
export async function runBackgroundAnalysis(
  audioId?: string,
  file?: File | Blob
): Promise<BackgroundAnalysisResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  const endpoint = `${API_BASE_URL}/background`
  console.log('Background analysis - Calling endpoint:', endpoint)

  return fetchWithRetry<BackgroundAnalysisResponse>(
    endpoint,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    DEFAULT_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run ASR (speech recognition) only - without diarization
 */
export async function runASR(
  audioId?: string,
  file?: File | Blob
): Promise<ASRDiarizationResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  return fetchWithRetry<ASRDiarizationResponse>(
    `${API_BASE_URL}/asr`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    FULL_ANALYSIS_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Run ASR with speaker diarization
 * @param audioId - The audio ID from upload
 * @returns ASR diarization response with speakers and segments
 */
export async function runASRDiarization(
  audioId?: string,
  file?: File | Blob
): Promise<ASRDiarizationResponse> {
  const formData = new FormData()

  if (audioId) {
    formData.append('audio_id', audioId)
  }

  if (file) {
    const fileName = file instanceof File ? file.name : 'audio.wav'
    formData.append('file', file, fileName)
  }

  return fetchWithRetry<ASRDiarizationResponse>(
    `${API_BASE_URL}/asr_diarization`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    DIARIZATION_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Ask a question about the audio (QnA)
 * @param audioId - The audio ID to query
 * @param question - The question to ask
 * @returns QnA response with answer
 */
export async function askQuestion(
  audioId: string,
  question: string
): Promise<QnaResponse> {
  const requestBody: QnaRequest = {
    audio_id: audioId,
    question,
  }

  return fetchWithRetry<QnaResponse>(
    `${API_BASE_URL}/qna`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify(requestBody),
    },
    QNA_TIMEOUT,
    MAX_RETRIES
  )
}


/**
 * Decode a base64-encoded Float32Array
 * @param base64String - The base64-encoded string
 * @returns Float32Array of audio samples
 */
export function decodeBase64ToFloat32Array(base64String: string): Float32Array {
  if (!base64String || base64String.length === 0) {
    return new Float32Array(0)
  }
  
  // Decode base64 to binary string
  const binaryString = atob(base64String)
  
  // Create a Uint8Array from the binary string
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Create Float32Array from the byte buffer
  // Note: The backend encodes float32 values, so each sample is 4 bytes
  return new Float32Array(bytes.buffer)
}

/**
 * Convert Float32Array to an AudioBuffer for playback
 * @param samples - Float32Array of audio samples
 * @param sampleRate - Sample rate of the audio
 * @returns AudioBuffer ready for playback
 */
export function float32ArrayToAudioBuffer(
  samples: Float32Array,
  sampleRate: number
): AudioBuffer {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const audioBuffer = audioContext.createBuffer(1, samples.length, sampleRate)
  audioBuffer.getChannelData(0).set(samples)
  return audioBuffer
}

/**
 * Convert Float32Array to a Blob URL for use with audio elements or WaveSurfer
 * @param samples - Float32Array of audio samples
 * @param sampleRate - Sample rate of the audio
 * @returns Blob URL string
 */
export function float32ArrayToWavBlobUrl(
  samples: Float32Array,
  sampleRate: number
): string {
  // Create WAV file header and data
  const numChannels = 1
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const blockAlign = numChannels * bytesPerSample
  const byteRate = sampleRate * blockAlign
  const dataSize = samples.length * bytesPerSample
  const bufferSize = 44 + dataSize // 44 bytes for WAV header
  
  const buffer = new ArrayBuffer(bufferSize)
  const view = new DataView(buffer)
  
  // Write WAV header
  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true) // file size - 8
  writeString(view, 8, 'WAVE')
  
  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true) // sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true) // audio format (1 = PCM)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  
  // "data" sub-chunk
  writeString(view, 36, 'data')
  view.setUint32(40, dataSize, true)
  
  // Write audio data (convert float32 to int16)
  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    // Clamp to [-1, 1] and convert to int16
    const sample = Math.max(-1, Math.min(1, samples[i]))
    const int16Sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
    view.setInt16(offset, int16Sample, true)
    offset += 2
  }
  
  const blob = new Blob([buffer], { type: 'audio/wav' })
  return URL.createObjectURL(blob)
}

// Helper function to write string to DataView
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}

/**
 * Get foreground and background separated waveforms from audio
 * @param audioId - The audio ID to process
 * @returns Response with base64-encoded foreground and background waveforms
 */
export async function getForegroundBackgroundWaveforms(
  audioId: string
): Promise<ForegroundBackgroundWaveformsResponse> {
  const formData = new FormData()
  formData.append('audio_id', audioId)

  return fetchWithRetry<ForegroundBackgroundWaveformsResponse>(
    `${API_BASE_URL}/foreground_background_waveforms`,
    {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
    },
    WAVEFORM_SEPARATION_TIMEOUT,
    MAX_RETRIES
  )
}

/**
 * Get foreground and background waveforms with decoded Float32Arrays
 * This is a convenience function that fetches and decodes in one call
 * @param audioId - The audio ID to process
 * @returns Decoded waveforms ready for use in audio visualization
 */
export async function getDecodedForegroundBackgroundWaveforms(
  audioId: string
): Promise<DecodedWaveforms> {
  const response = await getForegroundBackgroundWaveforms(audioId)
  
  return {
    audioId: response.audio_id,
    fileName: response.file,
    sampleRate: response.sample_rate,
    totalSamples: response.num_samples,
    durationSec: response.duration_sec,
    foreground: decodeBase64ToFloat32Array(response.foreground_b64),
    background: decodeBase64ToFloat32Array(response.background_b64),
  }
}

/**
 * Create playable audio URLs from foreground/background separation
 * @param audioId - The audio ID to process
 * @returns Object with blob URLs for foreground and background audio
 */
export async function getForegroundBackgroundAudioUrls(
  audioId: string
): Promise<{
  foregroundUrl: string
  backgroundUrl: string
  sampleRate: number
  durationSec: number
}> {
  const decoded = await getDecodedForegroundBackgroundWaveforms(audioId)
  
  console.log('Decoded FG/BG waveforms:', {
    fgLength: decoded.foreground?.length || 0,
    bgLength: decoded.background?.length || 0,
    sampleRate: decoded.sampleRate,
    durationSec: decoded.durationSec
  })
  
  // Validate sample rate
  if (!decoded.sampleRate || decoded.sampleRate <= 0) {
    throw new APIClientError('Invalid sample rate in response', 400)
  }
  
  // Handle empty foreground - create silence or use the audio we have
  let foreground = decoded.foreground
  let background = decoded.background
  
  // If foreground is empty but background has data, swap them
  // (The backend might have labeled them incorrectly)
  if ((!foreground || foreground.length === 0) && background && background.length > 0) {
    console.warn('Foreground is empty but background has data - using background as primary audio')
    foreground = background
    background = new Float32Array(foreground.length) // Create silent background
  }
  
  // If both are empty, throw error
  if ((!foreground || foreground.length === 0) && (!background || background.length === 0)) {
    throw new APIClientError('No audio data received from separation endpoint', 400)
  }
  
  // If foreground has data but background is empty, create silent background
  if (foreground && foreground.length > 0 && (!background || background.length === 0)) {
    background = new Float32Array(foreground.length)
  }
  
  // If background has data but foreground is empty, create silent foreground
  if (background && background.length > 0 && (!foreground || foreground.length === 0)) {
    foreground = new Float32Array(background.length)
  }
  
  return {
    foregroundUrl: float32ArrayToWavBlobUrl(foreground, decoded.sampleRate),
    backgroundUrl: float32ArrayToWavBlobUrl(background, decoded.sampleRate),
    sampleRate: decoded.sampleRate,
    durationSec: decoded.durationSec || (foreground.length / decoded.sampleRate),
  }
}

/**
 * Download forensics PDF report
 * @param file - The audio file to analyze
 * @returns Blob of the PDF file
 */
export async function downloadForensicsPDF(file: File | Blob): Promise<Blob> {
  const formData = new FormData()
  const fileName = file instanceof File ? file.name : 'audio.wav'
  formData.append('file', file, fileName)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FORENSICS_PDF_TIMEOUT)

  try {
    const response = await fetch(`${API_BASE_URL}/forensics_pdf`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      body: formData,
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch {
        // Response might be PDF even on error, or text
        const text = await response.text()
        if (text) errorMessage = text
      }
      throw new APIClientError(errorMessage, response.status, response.status >= 500)
    }

    // Return the PDF blob
    return await response.blob()
  } finally {
    clearTimeout(timeoutId)
  }
}

// ============================================
// Export Error Class
// ============================================

export { APIClientError }
