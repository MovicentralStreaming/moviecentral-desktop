import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Episode, Season } from '@shared/types'
import { Play } from './player/icons/Play'

export function EpisodeComponent({
  id,
  selectedSeason,
  episode,
  watchTime = 0,
  duration = 0
}: {
  id: string
  selectedSeason: Season
  episode: Episode
  watchTime?: number
  duration?: number
}) {
  const [imageError, setImageError] = useState(false)
  const progress = (watchTime / duration) * 100
  const hasBeenWatched = progress > 95

  return (
    <Link
      prefetch={'intent'}
      to={`/watch/tv/${id}/${selectedSeason.season}/${episode.episode}${watchTime && !hasBeenWatched ? `?time=${Math.floor(watchTime)}` : ''}`}
      key={episode.episode}
      className="group flex flex-col p-0 rounded-lg overflow-hidden transition-all will-change-transform  active:scale-[0.98] duration-200 cursor-pointer outline-0 border-2 border-transparent focus-visible:border-white focus:outline-none"
    >
      <div className="w-full relative overflow-hidden bg-zinc-800 rounded-lg aspect-video">
        {!imageError && episode.still ? (
          <img
            draggable={false}
            src={episode.still}
            alt={`${episode.title} thumbnail`}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <span className="text-zinc-400">Episode {episode.episode}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black/35 group-hover:bg-opacity-40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="w-12 h-12 flex items-center justify-center">
            <Play className="w-8 h-8"></Play>
          </div>
        </div>

        <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs font-medium">
          EP {episode.episode}
        </div>

        {hasBeenWatched && (
          <div className="absolute bottom-2 right-2 bg-green-600 bg-opacity-90 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1"
            >
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white" />
            </svg>
            Watched
          </div>
        )}

        {progress > 0 && (
          <div className="bg-zinc-400 absolute bottom-0 left-0 right-0 h-1">
            <div
              className={`h-1 ${hasBeenWatched ? 'bg-green-600' : 'bg-red-600'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col pt-3 px-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium text-white group-hover:text-white transition-colors duration-200 line-clamp-1">
            {episode.title}
          </h4>
        </div>

        <p className="text-sm text-zinc-400 mt-1 line-clamp-2 md:line-clamp-3">
          {episode.overview || 'No description available.'}
        </p>
      </div>
    </Link>
  )
}
