import { Track } from '@renderer/types/types'
import { useState } from 'react'

export function CaptionsSelector({
  tracks,
  visible,
  onChange,
  onMouseLeave
}: {
  tracks: Track[]
  visible: boolean
  onChange: (caption: Track | null) => void
  onMouseLeave: () => void
}) {
  const [selectedCaption, setSelectedCaption] = useState<Track | null>(null)

  const handleCaptionChange = (caption: Track | null) => {
    setSelectedCaption(caption)
    onChange(caption)
  }

  return (
    <div
      className={`absolute -bottom-20 right-0 bg-zinc-900 p-5 px-6 rounded shadow-md text-white pointer-events-auto flex-col gap-4 w-full max-w-lg ${visible ? 'flex' : 'hidden'} max-h-[500px] overflow-hidden`}
      onMouseLeave={onMouseLeave}
    >
      <span className="mb-2 opacity-75 font-semibold text-xl">Captions</span>
      <div className="relative flex flex-col w-full  overflow-auto">
        <>
          <button
            onClick={() => handleCaptionChange(null)}
            className={`flex flex-col cursor-pointer p-2 ${selectedCaption === null ? 'text-white' : 'text-zinc-400'}`}
          >
            None
          </button>
          {tracks.map((caption) => (
            <button
              onClick={() => handleCaptionChange(caption)}
              key={caption.label}
              className={`flex flex-col cursor-pointer p-2 ${selectedCaption === caption ? 'text-white' : 'text-zinc-400'}`}
            >
              {caption.label}
            </button>
          ))}
        </>
      </div>
    </div>
  )
}
