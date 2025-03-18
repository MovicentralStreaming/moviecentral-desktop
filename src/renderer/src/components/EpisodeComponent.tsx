import { Link } from 'react-router-dom'
import { Episode, Season } from '@shared/types'

export function EpisodeComponent({
  id,
  selectedSeason,
  episode,
  progress = 0
}: {
  id: string
  selectedSeason: Season
  episode: Episode
  progress?: number
}) {
  return (
    <Link
      prefetch={'intent'}
      to={`/watch/tv/${id}/${selectedSeason.season}/${episode.episode}`}
      key={episode.episode}
      className="flex flex-col p-0 rounded-md overflow-hidden transition-all will-change-transform active:scale-[0.98] duration-200 cursor-pointer outline-0 border-3 border-transparent focus:border-white"
    >
      <div className="w-full relative overflow-hidden bg-zinc-600 rounded-md">
        <img
          draggable={false}
          src={episode.still}
          alt={`${episode.title} still`}
          loading="lazy"
          className="w-full h-auto object-cover aspect-video shadow-md rounded-md"
        />
        <div
          className={`bg-zinc-600 absolute bottom-1 left-1 right-1 h-1 rounded-md ${progress > 0.01 ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className={`h-1 bg-red-600 rounded-sm`} style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <div className="flex-1 flex flex-col pt-3">
        <div className="flex justify-between items-center">
          <h4 className="font-medium group-hover:text-white transition-colors duration-200">
            {episode.episode}. {episode.title}
          </h4>
        </div>
        <p className="text-sm text-zinc-400 mt-1 line-clamp-2 sm:line-clamp-3">
          {episode.overview || 'No description available.'}
        </p>
      </div>
    </Link>
  )
}
