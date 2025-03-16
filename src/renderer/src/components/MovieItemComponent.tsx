import { useState } from 'react'
import { Link } from 'react-router-dom'
import noPoster from '../assets/no-poster.png'
import { MovieItem } from '@shared/types'

export function MovieItemComponent({ item }: { item: MovieItem }) {
  const [posterSrc, setPosterSrc] = useState(item.poster || noPoster)
  const [loading, setLoading] = useState(true)

  return (
    <Link
      prefetch={'intent'}
      to={`/details/${item.media_type}/${item.id}`}
      title={item.title}
      className="relative select-none flex flex-col gap-2 outline-0 border-3 rounded-sm border-transparent focus:border-white group"
    >
      <div
        className={`relative overflow-hidden aspect-[2/3] bg-zinc-800 rounded-md ${loading && 'animate-pulse'}`}
      >
        <img
          draggable={false}
          loading="lazy"
          className={`aspect-[2/3] min-w-[100%] object-cover shadow-md rounded-md-sm min-h-[192px] sm:min-h-[264px] will-change-transform duration-500 ease-in-out transform group-hover:scale-[1.1] group-hover:filter-[brightness(0.2)] transition-all group-hover:brightness-50 ${loading ? 'opacity-0' : 'opacity-100'}`}
          src={posterSrc}
          alt={item.title}
          onLoad={() => setLoading(false)}
          onError={() => setPosterSrc(noPoster)}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="currentColor"
            viewBox="0 0 16 16"
          >
            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393" />
          </svg>
        </div>
      </div>
      <span className="text-sm line-clamp-1 text-center pb-1">{item.title}</span>
    </Link>
  )
}
