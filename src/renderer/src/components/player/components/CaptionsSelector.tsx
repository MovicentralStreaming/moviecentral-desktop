import { CheckIcon } from '@heroicons/react/24/outline'
import { Track } from '@renderer/types/types'
import { useState } from 'react'

export function CaptionsSelector({
  tracks,
  visible,
  onChange,
  onMouseLeave,
  onMouseEnter
}: {
  tracks: Track[]
  visible: boolean
  onChange: (caption: Track | null) => void
  onMouseLeave: () => void
  onMouseEnter: () => void
}) {
  const [selectedCaption, setSelectedCaption] = useState<Track | null>(null)

  const handleCaptionChange = (caption: Track | null) => {
    setSelectedCaption(caption)
    onChange(caption)
  }

  return (
    <div
      className={`absolute -bottom-20 pb-5 right-0 bg-zinc-900 rounded shadow-md text-white pointer-events-auto flex-col gap-4 w-full max-w-lg ${visible ? 'flex' : 'hidden'} max-h-[320px] overflow-hidden`}
      onMouseLeave={onMouseLeave}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-center px-4 gap-1 pb-0 pt-6">
        <CheckIcon strokeWidth={3} className={`w-5 h-5 opacity-0`}></CheckIcon>
        <span className={`flex flex-col pl-1.5 font-semibold text-2xl`}>Captions</span>
      </div>
      <div className="relative flex flex-col w-full overflow-auto">
        <>
          <div className="flex items-center px-4 gap-1.5">
            <CheckIcon
              strokeWidth={3}
              className={`w-5 h-5 ${selectedCaption === null ? 'opacity-100' : 'opacity-0'}`}
            ></CheckIcon>
            <button
              onClick={() => handleCaptionChange(null)}
              className={`flex flex-col cursor-pointer p-2 ${selectedCaption === null ? 'text-white' : 'text-zinc-400'}`}
            >
              None
            </button>
          </div>
          {tracks.map((caption) => (
            <div className="flex items-center px-4 gap-1.5">
              <CheckIcon
                strokeWidth={3}
                className={`w-5 h-5 ${selectedCaption?.label === caption.label ? 'opacity-100' : 'opacity-0'}`}
              ></CheckIcon>
              <button
                onClick={() =>
                  handleCaptionChange({
                    ...caption,
                    file: `http://localhost:5555/api/proxy-vtt/${btoa(caption.file)}`
                  })
                }
                key={caption.label}
                className={`flex flex-col cursor-pointer p-2 ${selectedCaption?.label === caption.label ? 'text-white' : 'text-zinc-400'}`}
              >
                {caption.label}
              </button>
            </div>
          ))}
        </>
      </div>
    </div>
  )
}
