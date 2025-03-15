import React, { MutableRefObject, useEffect, useState } from 'react'
import pkg from 'webvtt-parser'
const { WebVTTParser } = pkg

const parseVTT = (vttString: string) => {
  const parser = new WebVTTParser()
  const tree = parser.parse(vttString)
  const cues = tree.cues.map((cue: any) => ({
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text
  }))
  return cues
}

interface Cue {
  startTime: number
  endTime: number
  text: string
}

const VttCaptions = ({
  vttUrl,
  videoRef,
  showControls
}: {
  vttUrl: string
  videoRef: MutableRefObject<HTMLVideoElement | null>
  showControls: boolean
}) => {
  const [cues, setCues] = useState<Cue[]>([])
  const [currentCue, setCurrentCue] = useState<Cue | null>(null)

  useEffect(() => {
    const fetchVttFile = async () => {
      const response = await fetch(vttUrl)
      const vttText = await response.text()
      const parsedCues: Cue[] = parseVTT(vttText)
      setCues(parsedCues)
    }

    fetchVttFile()
  }, [vttUrl])

  useEffect(() => {
    const updateCaption = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime
        const cue = cues.find((cue) => cue.startTime <= currentTime && cue.endTime >= currentTime)
        setCurrentCue(cue || null)
      }
    }

    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.addEventListener('timeupdate', updateCaption)

      return () => {
        videoElement.removeEventListener('timeupdate', updateCaption)
      }
    }
  }, [cues, videoRef])

  return (
    <div
      data-menu={showControls}
      className={`captions absolute ${
        showControls ? 'bottom-20 md:bottom-44' : 'bottom-6 md:bottom-20'
      } left-0 right-0 w-full max-w-[400px] text-center drop-shadow-[0_2px_2px_rgba(0,0,0,1)] text text-lg md:text-3xl ml-auto mr-auto select-none pointer-events-none `}
    >
      {currentCue && <p dangerouslySetInnerHTML={{ __html: currentCue.text }}></p>}
    </div>
  )
}

export default VttCaptions
