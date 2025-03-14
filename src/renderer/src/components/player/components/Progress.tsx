import React, { useState, useRef, useEffect } from 'react'

function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
  } else if (minutes > 0) {
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  } else {
    return `0:${String(remainingSeconds).padStart(2, '0')}`
  }
}

export function Progress({
  currentTime,
  duration,
  loaded,
  onSeek
}: {
  currentTime: number
  duration: number
  loaded: number
  onSeek: (currentProgress: number) => void
}) {
  const buffered = duration > 0 ? (loaded / duration) * 100 : 0
  const remainingTime = clamp(duration - currentTime, 0, duration)
  const formattedRemainingTime = formatTime(remainingTime)

  const [currentProgress, setCurrentProgress] = useState(0)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const [popoverPosition, setPopoverPosition] = useState(0)

  const progressBarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const percentage = (currentTime / duration) * 100
    setCurrentProgress(clamp(percentage, 0, 100))
  }, [currentTime, duration])

  const handleMouseDown = (event: React.MouseEvent) => {
    if (!progressBarRef.current) return

    const { left, width } = progressBarRef.current.getBoundingClientRect()
    const percentage = clamp(((event.clientX - left) / width) * 100, 0, 100)
    setCurrentProgress(percentage)

    if (onSeek) {
      const newTime = (percentage / 100) * duration
      onSeek(newTime)
    }
  }

  const handleHover = (event: React.MouseEvent) => {
    if (!progressBarRef.current) return

    const { left, width } = progressBarRef.current.getBoundingClientRect()
    const percentage = clamp(((event.clientX - left) / width) * 100, 0, 100)
    const newTime = (percentage / 100) * duration

    setHoverTime(newTime)
    setPopoverPosition(event.clientX - left)
  }

  return (
    <div className="flex flex-row gap-4 items-center relative">
      <div
        ref={progressBarRef}
        onMouseMove={handleHover}
        onMouseDown={handleMouseDown}
        onMouseLeave={() => setHoverTime(null)}
        className="relative bg-zinc-400 w-full min-h-1 cursor-pointer hover:scale-y-150 transition-transform"
      >
        <div
          className="absolute top-0 left-0 h-1 bg-gray-200"
          style={{ width: `${buffered}%` }}
        ></div>

        <div
          className="absolute top-0 left-0 h-1 bg-red-600"
          style={{ width: `${currentProgress}%` }}
        ></div>
      </div>

      {hoverTime !== null && (
        <div
          className="absolute -top-8 transform -translate-x-1/2 bg-zinc-900 rounded px-2 py-1 text-sm"
          style={{
            left: `${popoverPosition}px`,
            color: 'white'
          }}
        >
          {formatTime(hoverTime)}
        </div>
      )}

      <span className="[text-shadow:_0px_0px_4px_#000000]">{formattedRemainingTime}</span>
    </div>
  )
}
