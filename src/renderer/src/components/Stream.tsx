import { ReactNode, useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'
import { Play } from './player/icons/Play'
import { Pause } from './player/icons/Pause'
import { BackTen } from './player/icons/BackTen'
import { ForwardTen } from './player/icons/ForwardTen'
import { IconButton } from './player/components/IconButton'
import { VolumeFull } from './player/icons/VolumeFull'
import { VolumeMuted } from './player/icons/VolumeMuted'
import { EnterFullscreen } from './player/icons/EnterFullscreen'
import { ExitFullscreen } from './player/icons/ExitFullscreen'
import { Progress } from './player/components/Progress'
import { Loader } from './Loader'
import { Speed } from './player/icons/Speed'
import { Menu } from './player/icons/Menu'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { SpeedSelector } from './player/components/SpeedSelector'
import { Track } from '@shared/types'
import { CaptionsSelector } from './player/components/CaptionsSelector'
import VttCaptions from './player/components/VTTCaptions'

export function Stream({
  src,
  referer,
  title,
  tracks,
  onTimeUpdate,
  onDurationUpdate,
  startAt,
  nextEpisodePrompt,
  backLink
}: {
  src: string
  referer: string
  title?: string
  tracks?: Track[]
  onTimeUpdate: (newTime: number) => void
  onDurationUpdate: (newDuration: number) => void
  startAt: number
  nextEpisodePrompt?: ReactNode
  backLink: string
}) {
  const navigate = useNavigate()

  const videoParentRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  //player states
  const [paused, setPaused] = useState<boolean>(false)
  const [muted, setMuted] = useState<boolean>(false)
  const [fullscreen, setFullscreen] = useState<boolean>(false)
  const [time, setTime] = useState<number>(0.0)
  const [duration, setDuration] = useState<number>(0.0)
  const [volume, setVolume] = useState<number>(1)
  const [buffered, setBuffered] = useState<number>(0.0)
  const [buffering, setBuffering] = useState<boolean>(false)
  const [showControls, setShowControls] = useState<boolean>(true)
  const [currentCaptionFile, setCurrentCaptionFile] = useState<string>('')

  const [mouseOverSpeed, setMouseOverSpeed] = useState(false)
  const [mouseOverCaptions, setMouseOverCaptions] = useState(false)

  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const resetControlsTimeout = () => {
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
    if (!paused) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  useEffect(() => {
    if (!videoRef.current) return

    const handleMouseMove = () => {
      if (paused) return
      setShowControls(true)
      resetControlsTimeout()
    }

    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [paused])

  useEffect(() => {
    if (!videoRef.current) return

    if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = src
    } else if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: function (xhr, url) {
          const proxyUrl = `http://localhost:5555/api/proxy/${btoa(url)}/${btoa(referer + '/')}/segment`
          xhr.open('GET', proxyUrl, true)
        }
      })
      hls.loadSource(src)
      hls.attachMedia(videoRef.current)
      videoRef.current.currentTime = startAt

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('HLS.js error:', data)
      })

      return () => {
        hls.destroy()
      }
    } else {
      console.error('HLS not supported in this browser.')
    }
    return
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    //listeners for states
    const updatePaused = () => setPaused(video.paused)
    const updateMuted = () => setMuted(video.muted)
    const updateTime = () => {
      setTime(video.currentTime)
      onTimeUpdate(video.currentTime)
    }
    const updateDuration = () => {
      setDuration(video.duration)
      onDurationUpdate(video.duration)
    }
    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handleWaiting = () => setBuffering(true)
    const handlePlaying = () => setBuffering(false)
    const updateFullscreen = () =>
      setFullscreen(document.fullscreenElement === videoParentRef.current)

    video.addEventListener('play', updatePaused)
    video.addEventListener('pause', updatePaused)
    video.addEventListener('volumechange', updateMuted)
    video.addEventListener('timeupdate', updateTime)
    video.addEventListener('loadedmetadata', updateDuration)
    video.addEventListener('progress', updateBuffered)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('playing', handlePlaying)
    document.addEventListener('fullscreenchange', updateFullscreen)

    return () => {
      video.removeEventListener('play', updatePaused)
      video.removeEventListener('pause', updatePaused)
      video.removeEventListener('volumechange', updateMuted)
      video.removeEventListener('timeupdate', updateTime)
      video.removeEventListener('loadedmetadata', updateDuration)
      video.removeEventListener('progress', updateBuffered)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('playing', handlePlaying)
      document.removeEventListener('fullscreenchange', updateFullscreen)
    }
  }, [])

  const togglePaused = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play()
    } else {
      videoRef.current?.pause()
    }
  }

  const toggleMuted = () => {
    if (videoRef.current) {
      if (videoRef.current?.muted) {
        videoRef.current.muted = false
      } else {
        videoRef.current.muted = true
      }
    }
  }

  const toggleFullscreen = () => {
    if (document.fullscreenElement === videoParentRef.current) {
      document.exitFullscreen()
    } else {
      videoParentRef.current?.requestFullscreen()
    }
  }

  const skipTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += time
    }
  }

  const handleProgressChange = (currentProgress: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentProgress
    }
  }

  useEffect(() => {
    const savedVolume = localStorage.getItem('player_volume')
    if (savedVolume) {
      setVolume(parseFloat(savedVolume))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('player_volume', volume.toString())
    if (videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [volume])

  const handleSetVolume = (newVolume: number) => {
    setVolume(newVolume)
  }

  return (
    <div ref={videoParentRef}>
      <video
        preload="auto"
        playsInline
        onClick={togglePaused}
        className="w-full h-screen aspect-video outline-0 border-0"
        ref={videoRef}
        controls={false}
        autoPlay={true}
      ></video>
      {videoRef.current && (
        <VttCaptions
          showControls={showControls}
          vttUrl={currentCaptionFile}
          videoRef={videoRef}
        ></VttCaptions>
      )}
      {buffering && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <Loader></Loader>
        </div>
      )}
      <div
        className={`fixed inset-0 select-none pointer-events-none flex flex-col transition-opacity ${showControls || nextEpisodePrompt ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div
          id="top"
          className="flex flex-none p-8 pointer-events-auto bg-gradient-to-b from-black to-transparent"
        >
          <div className="items-center justify-between">
            <IconButton onClick={() => navigate(backLink)}>
              <ArrowLeftIcon className="w-12 h-12" />
            </IconButton>
          </div>
        </div>
        <div id="middle" className="flex-grow relative z-99">
          <SpeedSelector
            visible={mouseOverSpeed}
            onMouseEnter={() => {
              setMouseOverSpeed(true)
            }}
            onMouseLeave={() => {
              setMouseOverSpeed(false)
            }}
            onChange={(speed: number) => {
              if (videoRef.current) {
                videoRef.current.playbackRate = speed
              }
            }}
          />
          {tracks && (
            <CaptionsSelector
              tracks={tracks}
              visible={mouseOverCaptions}
              onMouseEnter={() => {
                setMouseOverCaptions(true)
              }}
              onMouseLeave={() => {
                setMouseOverCaptions(false)
              }}
              onChange={(caption: Track | null) => {
                if (caption) {
                  setCurrentCaptionFile(caption.file)
                } else {
                  setCurrentCaptionFile('')
                }
              }}
            ></CaptionsSelector>
          )}
          {nextEpisodePrompt}
        </div>
        <div
          id="bottom"
          className="flex-none gap-6 p-8 pointer-events-auto bg-gradient-to-t from-black to-transparent"
        >
          <Progress
            onSeek={handleProgressChange}
            currentTime={time}
            duration={duration}
            loaded={buffered}
          ></Progress>
          <div className="flex items-center justify-between gap-8 mt-6">
            <div className="flex flex-row gap-8">
              <IconButton onClick={togglePaused}>
                {paused || buffering ? (
                  <Play className="w-10 h-10"></Play>
                ) : (
                  <Pause className="w-10 h-10"></Pause>
                )}
              </IconButton>
              <IconButton onClick={() => skipTime(-10)}>
                <BackTen className="w-10 h-10"></BackTen>
              </IconButton>
              <IconButton onClick={() => skipTime(10)}>
                <ForwardTen className="w-10 h-10"></ForwardTen>
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
                    className=" h-2 bg-zinc-700 rounded appearance-none cursor-pointer text-red-600"
                  ></input>
                </div>
                <IconButton onClick={toggleMuted}>
                  {muted ? (
                    <VolumeMuted className="w-10 h-10"></VolumeMuted>
                  ) : (
                    <VolumeFull className="w-10 h-10"></VolumeFull>
                  )}
                </IconButton>
              </div>
            </div>
            {title && (
              <span className="[text-shadow:_0px_0px_4px_#000000] select-none">{title}</span>
            )}
            <div className="flex flex-row gap-8 relative">
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
