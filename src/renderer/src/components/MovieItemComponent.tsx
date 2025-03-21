import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import noPoster from '../assets/no-poster.png'
import { MovieItem } from '@shared/types'
import { ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Play } from './player/icons/Play'

export function MovieItemComponent({ item }: { item: MovieItem }) {
  const navigate = useNavigate()
  const [posterSrc, setPosterSrc] = useState(item.poster || noPoster)
  const [loading, setLoading] = useState(true)

  const watchHref =
    item.media_type === 'tv'
      ? `/watch/tv/${item.id}/${item.season || 1}/${item.episode || 1}${item.watch_time ? `?time=${item.watch_time}` : ''}`
      : `/watch/movie/${item.id}${item.watch_time ? `?time=${item.watch_time}` : ''}`
  const detailsHref = `/details/${item.media_type}/${item.id}`

  const watchProgress =
    item.watch_time && item.duration
      ? Math.min(Math.round((item.watch_time / item.duration) * 100), 100)
      : 0

  const handleCardClick = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('a')) {
      navigate(watchHref)
    }
  }

  /* const handleRemoveFromHistory = () => {} */

  return (
    <div
      className="relative group select-none overflow-hidden rounded-md transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div
        className={`relative overflow-hidden aspect-[2/3] bg-zinc-900 rounded-md ${
          loading && 'animate-pulse'
        }`}
      >
        <img
          draggable={false}
          loading="lazy"
          className={`aspect-[2/3] min-w-[100%] object-cover min-h-[192px] sm:min-h-[264px] transition-all duration-500 group-hover:scale-105 will-change-transform ${
            loading ? 'opacity-0' : 'opacity-100'
          }`}
          src={posterSrc}
          alt={item.title}
          onLoad={() => setLoading(false)}
          onError={() => setPosterSrc(noPoster)}
        />

        <div className="absolute inset-0 bg-black/50 flex flex-col justify-between transition-opacity duration-300 opacity-0 group-hover:opacity-100">
          <div className="p-2 flex flex-row items-center " onClick={(e) => e.stopPropagation()}>
            {item.season && item.episode && (
              <div className="bg-red-600 text-white rounded-sm px-2 py-1 w-fit text-xs font-semibold">
                {`S${item.season}E${item.episode}`}
              </div>
            )}
            {item.duration && item.watch_time && (
              <button
                className=" text-white w-fit cursor-pointer ml-auto"
                onClick={() => console.log(item)}
                title="Remove from History"
              >
                <XMarkIcon className="w-6 h-6" strokeWidth={2}></XMarkIcon>
              </button>
            )}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className={`p-2 w-full ${item.watch_time && item.duration ? 'pb-3' : ''}`}
          >
            <p className="text-white text-sm line-clamp-2 mb-1">{item.title}</p>
            <div className="flex gap-1 items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  to={watchHref}
                  className="flex items-center justify-center w-fit rounded-full p-2 border-2 border-white bg-white hover:bg-zinc-200 transition-all duration-200 ease-in-out transform active:scale-95"
                  title="Play"
                >
                  <Play className="w-4 h-4 text-zinc-800 transition-transform duration-200 ease-in-out group-hover:scale-110" />
                </Link>
                <button
                  className="cursor-pointer flex items-center justify-center w-fit rounded-full p-2 border-2 border-zinc-400 hover:border-zinc-300 bg-zinc-800/50 hover:bg-zinc-800/60 transition-all duration-200 ease-in-out transform active:scale-95"
                  title="Add to My List"
                  onClick={() => console.log(item)}
                >
                  <PlusIcon
                    strokeWidth={2}
                    className="w-4 h-4 text-white transition-transform duration-200 ease-in-out group-hover:scale-110"
                  />
                </button>
              </div>
              <Link
                to={detailsHref}
                className="flex items-center justify-center w-fit rounded-full p-2 border-2 border-zinc-400 hover:border-zinc-300 bg-zinc-800/50 hover:bg-zinc-800/60 transition-all duration-200 ease-in-out transform active:scale-95"
                title="More info"
              >
                <ChevronDownIcon
                  strokeWidth={2}
                  className="w-4 h-4 text-white transition-transform duration-200 ease-in-out group-hover:scale-110"
                />
              </Link>
            </div>
          </div>
        </div>

        {item.watch_time && item.duration && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-400">
            <div
              className="h-full bg-red-600"
              style={{ width: `${watchProgress}%` }}
              aria-label={`${watchProgress}% watched`}
            />
          </div>
        )}
      </div>
    </div>
  )
}
