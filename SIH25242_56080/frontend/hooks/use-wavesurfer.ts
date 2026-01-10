"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'

interface UseWavesurferOptions {
  container: HTMLElement | null
  audioUrl?: string
  audioBlob?: Blob
  height?: number
  waveColor?: string
  progressColor?: string
  cursorColor?: string
  barWidth?: number
  barGap?: number
  barRadius?: number
  responsive?: boolean
  normalize?: boolean
  minPxPerSec?: number
}

interface Region {
  id: string
  start: number
  end: number
  color: string
  content?: string
  drag?: boolean
  resize?: boolean
}

export function useWavesurfer(options: UseWavesurferOptions) {
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsPluginRef = useRef<RegionsPlugin | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [zoom, setZoom] = useState(1)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!options.container) return

    const regionsPlugin = RegionsPlugin.create()
    regionsPluginRef.current = regionsPlugin

    const ws = WaveSurfer.create({
      container: options.container,
      height: options.height || 128,
      waveColor: options.waveColor || '#4a5568',
      progressColor: options.progressColor || '#667eea',
      cursorColor: options.cursorColor || '#fff',
      barWidth: options.barWidth || 2,
      barGap: options.barGap || 1,
      barRadius: options.barRadius || 2,
      normalize: options.normalize ?? true,
      minPxPerSec: options.minPxPerSec || 50,
      plugins: [regionsPlugin],
    })

    wavesurferRef.current = ws

    // Event handlers
    ws.on('ready', () => {
      setIsReady(true)
      setDuration(ws.getDuration())
    })

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('timeupdate', (time) => setCurrentTime(time))
    ws.on('finish', () => setIsPlaying(false))

    // Load audio
    if (options.audioUrl) {
      ws.load(options.audioUrl)
    } else if (options.audioBlob) {
      ws.loadBlob(options.audioBlob)
    }

    return () => {
      ws.destroy()
    }
  }, [options.container])

  // Handle audio source changes
  useEffect(() => {
    if (!wavesurferRef.current || !isReady) return

    if (options.audioUrl) {
      wavesurferRef.current.load(options.audioUrl)
    } else if (options.audioBlob) {
      wavesurferRef.current.loadBlob(options.audioBlob)
    }
  }, [options.audioUrl, options.audioBlob])

  // Playback controls
  const play = useCallback(() => {
    wavesurferRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    wavesurferRef.current?.pause()
  }, [])

  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  const seekTo = useCallback((time: number) => {
    if (wavesurferRef.current) {
      const progress = time / wavesurferRef.current.getDuration()
      wavesurferRef.current.seekTo(Math.max(0, Math.min(1, progress)))
    }
  }, [])

  const setPlaybackRate = useCallback((rate: number) => {
    wavesurferRef.current?.setPlaybackRate(rate)
  }, [])

  // Zoom control
  const setZoomLevel = useCallback((level: number) => {
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(level)
      setZoom(level)
    }
  }, [])

  // Region management
  const addRegion = useCallback((region: Region) => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.addRegion({
        id: region.id,
        start: region.start,
        end: region.end,
        color: region.color,
        content: region.content,
        drag: region.drag ?? false,
        resize: region.resize ?? false,
      })
    }
  }, [])

  const clearRegions = useCallback(() => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.clearRegions()
    }
  }, [])

  const highlightRegion = useCallback((regionId: string) => {
    if (regionsPluginRef.current) {
      const regions = regionsPluginRef.current.getRegions()
      regions.forEach((region) => {
        if (region.id === regionId) {
          region.setOptions({ color: 'rgba(255, 255, 255, 0.3)' })
        }
      })
    }
  }, [])

  const onRegionClick = useCallback((callback: (region: any) => void) => {
    if (regionsPluginRef.current) {
      regionsPluginRef.current.on('region-clicked', (region, e) => {
        e.stopPropagation()
        callback(region)
      })
    }
  }, [])

  return {
    wavesurfer: wavesurferRef.current,
    regionsPlugin: regionsPluginRef.current,
    isReady,
    isPlaying,
    currentTime,
    duration,
    zoom,
    play,
    pause,
    togglePlayPause,
    seekTo,
    setPlaybackRate,
    setZoomLevel,
    addRegion,
    clearRegions,
    highlightRegion,
    onRegionClick,
  }
}



