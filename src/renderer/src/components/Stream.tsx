import { ReactNode, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import {
  Play,
  Pause,
  BackTen,
  ForwardTen,
  VolumeFull,
  VolumeMuted,
  EnterFullscreen,
  ExitFullscreen,
  Speed,
  Menu
} from './player/icons/Icons'
import { IconButton } from './player/components/IconButton'
import { Progress } from './player/components/Progress'
import { Loader } from './Loader'
import { SpeedSelector } from './player/components/SpeedSelector'
import { CaptionsSelector } from './player/components/CaptionsSelector'
import VttCaptions from './player/components/VTTCaptions'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { StreamInfo } from '@shared/types'

export function Stream({
  streamInfo,
  onTimeUpdate,
  onDurationUpdate,
  startAt,
  nextEpisodePrompt,
  onExit
}: {
  streamInfo: StreamInfo
  onTimeUpdate: (newTime: number) => void
  onDurationUpdate: (newDuration: number) => void
  startAt: number
  nextEpisodePrompt?: ReactNode
  onExit: () => void
}) {
  const videoParentRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [buffered, setBuffered] = useState(0)
  const [buffering, setBuffering] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [currentCaptionFile, setCurrentCaptionFile] = useState('')

  const [mouseOverSpeed, setMouseOverSpeed] = useState(false)
  const [mouseOverCaptions, setMouseOverCaptions] = useState(false)

  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetControlsTimeout = () => {
    if (hideControlsTimeoutRef.current) clearTimeout(hideControlsTimeoutRef.current)
    if (!paused) {
      hideControlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleVideoEvents = () => {
      setPaused(video.paused)
      setMuted(video.muted)
      setTime(video.currentTime)
      onTimeUpdate(video.currentTime)
      setDuration(video.duration || 0)
      onDurationUpdate(video.duration || 0)
      setBuffered(video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0)
      setBuffering(video.readyState < 3)
    }

    video.addEventListener('play', handleVideoEvents)
    video.addEventListener('pause', handleVideoEvents)
    video.addEventListener('volumechange', handleVideoEvents)
    video.addEventListener('timeupdate', handleVideoEvents)
    video.addEventListener('progress', handleVideoEvents)
    video.addEventListener('waiting', () => setBuffering(true))
    video.addEventListener('playing', () => setBuffering(false))
    document.addEventListener('fullscreenchange', () =>
      setFullscreen(document.fullscreenElement === videoParentRef.current)
    )

    return () => {
      video.removeEventListener('play', handleVideoEvents)
      video.removeEventListener('pause', handleVideoEvents)
      video.removeEventListener('volumechange', handleVideoEvents)
      video.removeEventListener('timeupdate', handleVideoEvents)
      video.removeEventListener('progress', handleVideoEvents)
      video.removeEventListener('waiting', () => setBuffering(true))
      video.removeEventListener('playing', () => setBuffering(false))
      document.removeEventListener('fullscreenchange', () =>
        setFullscreen(document.fullscreenElement === videoParentRef.current)
      )
    }
  }, [])

  useEffect(() => {
    if (!videoRef.current) return

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr, url) {
          let proxyUrl: string

          const currentLevel = hls.levels[hls.currentLevel]
          const qualityHeight = currentLevel ? currentLevel.height : 1080

          if (url.startsWith('http://localhost:5555/api/proxy/')) {
            const baseUrl = streamInfo.source.stream
            const modifiedUrl = `${baseUrl.substring(0, baseUrl.lastIndexOf('/'))}`
            const lastPart = url.substring(url.lastIndexOf('/'))
            const finalUrl = `${modifiedUrl}/${qualityHeight}${lastPart}`

            proxyUrl = `http://localhost:5555/api/proxy/${encodeURIComponent(finalUrl)}/${encodeURIComponent(streamInfo.source.referer)}/segment`
          } else {
            proxyUrl = `http://localhost:5555/api/proxy/${encodeURIComponent(url)}/${encodeURIComponent(streamInfo.source.referer + '/')}/segment`
          }

          xhr.open('GET', proxyUrl, true)
        }
      })
      hls.loadSource(streamInfo.source.stream)
      hls.attachMedia(videoRef.current)
      videoRef.current.currentTime = startAt
      hls.on(Hls.Events.ERROR, (_, data) => console.error('HLS.js error:', data))
      return () => hls.destroy()
    } else {
      videoRef.current.src = streamInfo.source.stream
      videoRef.current.currentTime = startAt
      return
    }
  }, [streamInfo, startAt])

  useEffect(() => {
    const savedVolume = localStorage.getItem('player_volume')
    if (savedVolume) {
      const volume = parseFloat(savedVolume)
      setVolume(volume)
      if (videoRef.current) videoRef.current.volume = volume
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('player_volume', volume.toString())
    if (videoRef.current) videoRef.current.volume = volume
  }, [volume])

  useEffect(() => {
    if (paused) {
      setShowControls(true)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
        hideControlsTimeoutRef.current = null
      }
    } else {
      resetControlsTimeout()
    }
  }, [paused])

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      resetControlsTimeout()
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [paused])

  const togglePaused = () => {
    videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()
  }

  const toggleMuted = () =>
    videoRef.current ? (videoRef.current.muted = !videoRef.current.muted) : null

  const toggleFullscreen = () =>
    document.fullscreenElement === videoParentRef.current
      ? document.exitFullscreen()
      : videoParentRef.current?.requestFullscreen()

  const skipTime = (time: number) => {
    if (videoRef.current) videoRef.current.currentTime += time
  }

  const handleProgressChange = (currentProgress: number) => {
    if (videoRef.current) videoRef.current.currentTime = currentProgress
  }

  const handleSetVolume = (newVolume: number) => setVolume(newVolume)

  const handleVideoClick = (e: React.MouseEvent) => {
    if (e.target === videoRef.current) {
      togglePaused()
    }
  }

  return (
    <div ref={videoParentRef} className="relative w-full h-screen">
      <video
        ref={videoRef}
        preload="auto"
        playsInline
        autoPlay
        className="w-full h-screen aspect-video outline-0 border-0"
        controls={false}
        onClick={handleVideoClick}
      />
      {videoRef.current && (
        <VttCaptions showControls={showControls} vttUrl={currentCaptionFile} videoRef={videoRef} />
      )}
      {buffering && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <Loader />
        </div>
      )}

      <div
        className={`fixed inset-0 select-none pointer-events-none flex flex-col transition-opacity ${showControls || nextEpisodePrompt ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-none p-8 bg-gradient-to-b from-black to-transparent">
          <div className="pointer-events-auto">
            <IconButton onClick={onExit}>
              <ArrowLeftIcon className="w-12 h-12" />
            </IconButton>
          </div>
        </div>

        <div id="middle" className="flex-grow relative z-10">
          <SpeedSelector
            visible={mouseOverSpeed}
            onChange={(speed) => videoRef.current && (videoRef.current.playbackRate = speed)}
            onMouseEnter={() => setMouseOverSpeed(true)}
            onMouseLeave={() => setMouseOverSpeed(false)}
          />
          <CaptionsSelector
            tracks={streamInfo.source.tracks}
            visible={mouseOverCaptions}
            onChange={(caption) => setCurrentCaptionFile(caption?.file || '')}
            onMouseEnter={() => setMouseOverCaptions(true)}
            onMouseLeave={() => setMouseOverCaptions(false)}
          />
          {nextEpisodePrompt}
        </div>

        <div className="flex-none gap-6 p-8 bg-gradient-to-t from-black to-transparent pointer-events-auto">
          <div className="pointer-events-auto">
            <Progress
              currentTime={time}
              duration={duration}
              loaded={buffered}
              onSeek={handleProgressChange}
            />
          </div>

          <div className="flex items-center justify-between gap-8 mt-6">
            <div className="flex gap-8 pointer-events-auto">
              <IconButton onClick={togglePaused}>
                {paused ? <Play className="w-10 h-10" /> : <Pause className="w-10 h-10" />}
              </IconButton>
              <IconButton onClick={() => skipTime(-10)}>
                <BackTen className="w-10 h-10" />
              </IconButton>
              <IconButton onClick={() => skipTime(10)}>
                <ForwardTen className="w-10 h-10" />
              </IconButton>
              <div className="group relative">
                <div className="-rotate-90 -translate-y-[200%] items-center absolute z-50 bottom-[100%] left-1/2 transform -translate-x-1/2 bg-zinc-900 p-3 rounded-sm shadow-lg w-fit flex opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                  <input
                    onChange={(e: any) => {
                      handleSetVolume(e.target.value / 100)
                    }}
                    type="range"
                    min={0}
                    max={100}
                    value={volume * 100}
                    className="h-2 bg-zinc-700 rounded appearance-none cursor-pointer text-red-600"
                  ></input>
                </div>
                <IconButton onClick={toggleMuted}>
                  {muted ? (
                    <VolumeMuted className="w-10 h-10" />
                  ) : (
                    <VolumeFull className="w-10 h-10" />
                  )}
                </IconButton>
              </div>
            </div>
            <span className="[text-shadow:_0px_0px_4px_#000000]">{streamInfo.title}</span>
            <div id="right" className="flex gap-8 pointer-events-auto">
              <IconButton
                onMouseEnter={() => {
                  setMouseOverCaptions(true)
                }}
                onMouseLeave={() => {
                  setMouseOverCaptions(false)
                }}
              >
                <Menu className="w-10 h-10"></Menu>
              </IconButton>
              <IconButton
                onMouseEnter={() => {
                  setMouseOverSpeed(true)
                }}
                onMouseLeave={() => {
                  setMouseOverSpeed(false)
                }}
              >
                <Speed className="w-10 h-10"></Speed>
              </IconButton>
              <IconButton onClick={toggleFullscreen}>
                {fullscreen ? (
                  <ExitFullscreen className="w-10 h-10"></ExitFullscreen>
                ) : (
                  <EnterFullscreen className="w-10 h-10"></EnterFullscreen>
                )}
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
