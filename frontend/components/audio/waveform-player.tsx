"use client"

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WaveformPlayerProps {
  audioUrl?: string
  audioBlob?: Blob
  metadata?: any
  onTimeUpdate?: (time: number) => void
  onRegionClick?: (region: any) => void
  className?: string
}

export function WaveformPlayer({
  audioUrl,
  audioBlob,
  metadata,
  onTimeUpdate,
  onRegionClick,
  className,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const regionsRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [zoom, setZoom] = useState(50)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return

    const initWaveSurfer = async () => {
      const WaveSurfer = (await import('wavesurfer.js')).default
      const RegionsPlugin = (await import('wavesurfer.js/dist/plugins/regions.js')).default

      const regions = RegionsPlugin.create()
      regionsRef.current = regions

      const ws = WaveSurfer.create({
        container: containerRef.current!,
        height: 120,
        waveColor: 'rgba(255, 255, 255, 0.3)',
        progressColor: 'rgba(102, 126, 234, 0.8)',
        cursorColor: '#fff',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        minPxPerSec: zoom,
        plugins: [regions],
      })

      wavesurferRef.current = ws

      ws.on('ready', () => {
        setIsReady(true)
        setDuration(ws.getDuration())
        
        // Add speaker regions if metadata is available
        if (metadata?.transcript) {
          const speakerColors: Record<string, string> = {
            SPEAKER_00: 'rgba(255, 77, 166, 0.3)',
            SPEAKER_01: 'rgba(110, 247, 139, 0.3)',
            SPEAKER_02: 'rgba(77, 166, 255, 0.3)',
            SPEAKER_03: 'rgba(255, 215, 0, 0.3)',
          }

          metadata.transcript.forEach((segment: any) => {
            regions.addRegion({
              id: `segment-${segment.segment_id}`,
              start: segment.start_time,
              end: segment.end_time,
              color: speakerColors[segment.speaker] || 'rgba(255, 255, 255, 0.2)',
              content: segment.speaker,
              drag: false,
              resize: false,
            })
          })

          // Add event regions
          if (metadata?.events) {
            metadata.events.forEach((event: any, idx: number) => {
              if (event.label !== 'Speech, human voice') {
                regions.addRegion({
                  id: `event-${idx}`,
                  start: event.start_time,
                  end: event.end_time,
                  color: event.is_threat ? 'rgba(239, 68, 68, 0.5)' : 'rgba(251, 191, 36, 0.3)',
                  content: event.label,
                  drag: false,
                  resize: false,
                })
              }
            })
          }
        }
      })

      ws.on('play', () => setIsPlaying(true))
      ws.on('pause', () => setIsPlaying(false))
      ws.on('timeupdate', (time) => {
        setCurrentTime(time)
        onTimeUpdate?.(time)
      })
      ws.on('finish', () => setIsPlaying(false))

      regions.on('region-clicked', (region: any, e: Event) => {
        e.stopPropagation()
        onRegionClick?.(region)
        ws.seekTo(region.start / ws.getDuration())
      })

      // Load audio
      if (audioUrl) {
        ws.load(audioUrl)
      } else if (audioBlob) {
        ws.loadBlob(audioBlob)
      }
    }

    initWaveSurfer()

    return () => {
      wavesurferRef.current?.destroy()
    }
  }, [audioUrl, audioBlob])

  // Update regions when metadata changes
  useEffect(() => {
    if (!regionsRef.current || !isReady || !metadata) return

    regionsRef.current.clearRegions()

    const speakerColors: Record<string, string> = {
      SPEAKER_00: 'rgba(255, 77, 166, 0.3)',
      SPEAKER_01: 'rgba(110, 247, 139, 0.3)',
      SPEAKER_02: 'rgba(77, 166, 255, 0.3)',
      SPEAKER_03: 'rgba(255, 215, 0, 0.3)',
    }

    if (metadata.transcript) {
      metadata.transcript.forEach((segment: any) => {
        regionsRef.current.addRegion({
          id: `segment-${segment.segment_id}`,
          start: segment.start_time,
          end: segment.end_time,
          color: speakerColors[segment.speaker] || 'rgba(255, 255, 255, 0.2)',
          content: segment.speaker,
          drag: false,
          resize: false,
        })
      })
    }
  }, [metadata, isReady])

  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  const skip = useCallback((seconds: number) => {
    if (wavesurferRef.current) {
      const newTime = currentTime + seconds
      const progress = newTime / duration
      wavesurferRef.current.seekTo(Math.max(0, Math.min(1, progress)))
    }
  }, [currentTime, duration])

  const handleZoom = useCallback((delta: number) => {
    const newZoom = Math.max(10, Math.min(200, zoom + delta))
    setZoom(newZoom)
    wavesurferRef.current?.zoom(newZoom)
  }, [zoom])

  const toggleMute = useCallback(() => {
    if (wavesurferRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      wavesurferRef.current.setVolume(newMuted ? 0 : volume)
    }
  }, [isMuted, volume])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
    wavesurferRef.current?.setVolume(newVolume)
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const seekToTime = useCallback((time: number) => {
    if (wavesurferRef.current && duration > 0) {
      wavesurferRef.current.seekTo(time / duration)
    }
  }, [duration])

  // Expose seekToTime function
  useEffect(() => {
    if (containerRef.current) {
      (containerRef.current as any).seekToTime = seekToTime
    }
  }, [seekToTime])

  return (
    <div className={cn('bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/10', className)}>
      {/* Waveform Container */}
      <div 
        ref={containerRef} 
        className="w-full rounded-lg overflow-hidden mb-4 cursor-pointer"
        style={{ minHeight: 120 }}
      />

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        {/* Time Display */}
        <div className="text-white/70 font-mono text-sm min-w-[100px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => skip(-10)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Skip back 10s"
          >
            <SkipBack className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            disabled={!isReady}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={() => skip(10)}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Skip forward 10s"
          >
            <SkipForward className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Zoom & Volume Controls */}
        <div className="flex items-center gap-4">
          {/* Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleZoom(-20)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-white/70" />
            </button>
            <span className="text-white/50 text-xs w-8 text-center">{zoom}%</span>
            <button
              onClick={() => handleZoom(20)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-white/70" />
              ) : (
                <Volume2 className="w-4 h-4 text-white/70" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-white/70"
            />
          </div>
        </div>
      </div>
    </div>
  )
}



