import { useState } from 'react'

const speeds = [0.5, 0.75, 1, 1.25, 1.5]

export function SpeedSelector({
  visible,
  onChange,
  onMouseLeave
}: {
  visible: boolean
  onChange: (speed: number) => void
  onMouseLeave: () => void
}) {
  const [selectedSpeed, setSelectedSpeed] = useState<number>(1)

  const handleSpeedChange = (speed: number) => {
    setSelectedSpeed(speed)
    onChange(speed)
  }

  return (
    <div
      className={`absolute -bottom-20 right-0 bg-zinc-900 p-5 px-6 rounded shadow-md text-white pointer-events-auto flex-col gap-4 w-full max-w-lg ${visible ? 'flex' : 'hidden'}`}
      onMouseLeave={onMouseLeave}
    >
      <span className="mb-2 opacity-75 font-semibold text-xl">Playback Speed</span>
      <div className="relative flex flex-col items-center w-full">
        <div className="absolute top-[5px] left-3 right-3 h-0.5 bg-zinc-400" />

        <div className="relative flex items-center justify-between w-full">
          {speeds.map((speed) => (
            <button
              onClick={() => handleSpeedChange(speed)}
              key={speed}
              className="flex flex-col items-center cursor-pointer"
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-full transition-colors duration-200 bg-zinc-200
                  ${speed === selectedSpeed ? 'ring-2 ring-offset-4 ring-offset-zinc-900 ring-white border-transparent outline-transparent' : ''}`}
                ></div>
              </div>
              <span className={`mt-2 ${speed === selectedSpeed ? 'text-white' : 'text-zinc-400'}`}>
                {speed}x
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
