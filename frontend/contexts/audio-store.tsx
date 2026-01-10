"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { FullAnalysisResponse } from '@/lib/api/types'

interface AudioFile {
  id: number | string // Can be number (from DB) or string (audio_id from backend)
  name: string
  blob: Blob
  url: string
  duration: number
}

interface AnalysisData {
  audioId: string
  audioName: string
  analysis: FullAnalysisResponse | null
  status: 'uploading' | 'processing' | 'completed' | 'failed'
  error?: string
  hasTranscript: boolean
  hasEmotion: boolean
  hasDeepfake: boolean
  hasEvents: boolean
  createdAt: Date
}

interface AudioStoreContextType {
  // Audio file management
  audioFiles: Map<number | string, AudioFile>
  currentFileId: number | string | null
  addAudioFile: (id: number | string, name: string, blob: Blob, duration: number) => void
  removeAudioFile: (id: number | string) => void
  getAudioFile: (id: number | string) => AudioFile | undefined
  setCurrentFile: (id: number | string | null) => void
  getCurrentFile: () => AudioFile | undefined
  
  // Analysis data management
  analysisStore: Map<string, AnalysisData>
  addAnalysis: (audioId: string, data: Partial<AnalysisData>) => void
  updateAnalysis: (audioId: string, data: Partial<AnalysisData>) => void
  getAnalysis: (audioId: string) => AnalysisData | undefined
  removeAnalysis: (audioId: string) => void
  getAllAnalyses: () => AnalysisData[]
}

const AudioStoreContext = createContext<AudioStoreContextType | null>(null)

export function AudioStoreProvider({ children }: { children: ReactNode }) {
  const [audioFiles, setAudioFiles] = useState<Map<number | string, AudioFile>>(new Map())
  const [currentFileId, setCurrentFileId] = useState<number | string | null>(null)
  const [analysisStore, setAnalysisStore] = useState<Map<string, AnalysisData>>(new Map())

  // Audio file management
  const addAudioFile = useCallback((id: number | string, name: string, blob: Blob, duration: number) => {
    const url = URL.createObjectURL(blob)
    setAudioFiles(prev => {
      const newMap = new Map(prev)
      newMap.set(id, { id, name, blob, url, duration })
      return newMap
    })
  }, [])

  const removeAudioFile = useCallback((id: number | string) => {
    setAudioFiles(prev => {
      const newMap = new Map(prev)
      const file = newMap.get(id)
      if (file) {
        URL.revokeObjectURL(file.url)
        newMap.delete(id)
      }
      return newMap
    })
  }, [])

  const getAudioFile = useCallback((id: number | string) => {
    return audioFiles.get(id)
  }, [audioFiles])

  const setCurrentFile = useCallback((id: number | string | null) => {
    setCurrentFileId(id)
  }, [])

  const getCurrentFile = useCallback(() => {
    if (currentFileId === null) return undefined
    return audioFiles.get(currentFileId)
  }, [audioFiles, currentFileId])

  // Analysis data management
  const addAnalysis = useCallback((audioId: string, data: Partial<AnalysisData>) => {
    setAnalysisStore(prev => {
      const newMap = new Map(prev)
      newMap.set(audioId, {
        audioId,
        audioName: data.audioName || 'Unknown',
        analysis: data.analysis || null,
        status: data.status || 'uploading',
        error: data.error,
        hasTranscript: data.hasTranscript ?? false,
        hasEmotion: data.hasEmotion ?? false,
        hasDeepfake: data.hasDeepfake ?? false,
        hasEvents: data.hasEvents ?? false,
        createdAt: data.createdAt || new Date(),
      })
      return newMap
    })
  }, [])

  const updateAnalysis = useCallback((audioId: string, data: Partial<AnalysisData>) => {
    setAnalysisStore(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(audioId)
      if (existing) {
        newMap.set(audioId, { ...existing, ...data })
      }
      return newMap
    })
  }, [])

  const getAnalysis = useCallback((audioId: string) => {
    return analysisStore.get(audioId)
  }, [analysisStore])

  const removeAnalysis = useCallback((audioId: string) => {
    setAnalysisStore(prev => {
      const newMap = new Map(prev)
      newMap.delete(audioId)
      return newMap
    })
  }, [])

  const getAllAnalyses = useCallback(() => {
    return Array.from(analysisStore.values())
  }, [analysisStore])

  return (
    <AudioStoreContext.Provider
      value={{
        audioFiles,
        currentFileId,
        addAudioFile,
        removeAudioFile,
        getAudioFile,
        setCurrentFile,
        getCurrentFile,
        analysisStore,
        addAnalysis,
        updateAnalysis,
        getAnalysis,
        removeAnalysis,
        getAllAnalyses,
      }}
    >
      {children}
    </AudioStoreContext.Provider>
  )
}

export function useAudioStore() {
  const context = useContext(AudioStoreContext)
  if (!context) {
    throw new Error('useAudioStore must be used within an AudioStoreProvider')
  }
  return context
}

// Export types for use in other files
export type { AudioFile, AnalysisData }

