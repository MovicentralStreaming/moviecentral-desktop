import { useEffect, useState } from 'react'
import { Episode, MediaType, MovieDetails, Season } from '../types/types'
import { Link, useParams } from 'react-router-dom'
import { getDetails, getEpisodes } from '../helper/tmdb'
import { EpisodeComponent } from '../components/EpisodeComponent'
import { Loader } from '../components/Loader'

export default function Details() {
  const [details, setDetails] = useState<MovieDetails | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [currentEpisodes, setCurrentEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [episodesLoading, setEpisodesLoading] = useState<boolean>(false)

  const { media_type, id } = useParams()

  useEffect(() => {
    if (media_type && id) {
      setLoading(true)
      getDetails(media_type as MediaType, id)
        .then((data) => {
          if (data) {
            setDetails(data)
            if (data.seasons && data.seasons.length > 0) {
              setSelectedSeason(data.seasons[0])
            }
            document.title = `${data.title}`
          }
        })
        .finally(() => setLoading(false))
    }
  }, [media_type, id])

  useEffect(() => {
    if (selectedSeason && id) {
      setEpisodesLoading(true)
      if (selectedSeason.episodeGroupId) {
        getEpisodes(
          id,
          selectedSeason?.season,
          selectedSeason.episodeGroupId,
          selectedSeason.seasonId
        )
          .then((data) => {
            if (data) {
              setCurrentEpisodes(data)
            }
          })
          .finally(() => setEpisodesLoading(false))
      } else {
        getEpisodes(id, selectedSeason?.season)
          .then((data) => {
            if (data) {
              setCurrentEpisodes(data)
            }
          })
          .finally(() => setEpisodesLoading(false))
      }
    }
  }, [selectedSeason, id])

  if (loading) {
    return <Loader></Loader>
  }

  if (!details) return <div className="text-white p-4">Could not load details.</div>

  return (
    <>
      <div className="text-white min-h-screen -m-4 relative">
        <div
          className="relative bg-cover bg-center h-[420px] lg:h-[500px]"
          style={{ backgroundImage: `url(${details.backdrop})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent"></div>
          <div className="lg:container mx-auto px-4 h-full flex items-end pb-4 sm:pb-8 relative z-10">
            {/* Details */}
            <div className="flex flex-row gap-4 md:gap-6 w-full">
              <div className="hidden sm:flex w-32 sm:w-40 md:w-48 h-auto rounded-lg overflow-hidden shadow-lg flex-shrink-0 -mb-12 md:mb-0 aspect-[2/3]">
                <img
                  src={details.poster}
                  alt={`${details.title} poster`}
                  className="w-full h-auto object-cover aspect-[2/3] shadow-md"
                />
              </div>
              <div className="flex flex-col justify-end gap-2 md:max-w-3xl lg:max-w-4xl">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold line-clamp-2">
                  {details.title}
                </h1>
                <p className="text-gray-300 text-sm sm:text-base leading-relaxed line-clamp-3 md:line-clamp-4 md:max-w-2xl lg:max-w-lg">
                  {details.overview || 'No overview available'}
                </p>
                <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                  <span className="uppercase hidden sm:flex">{media_type}</span>
                  {details.releaseYear && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:flex">{details.releaseYear}</span>
                    </>
                  )}
                  {details.genres && details.genres.length > 0 && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {details.genres.slice(0, 3).map((genre, index) => (
                          <span key={index} className="border px-2 py-0.5 text-xs rounded-md">
                            {genre}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 items-center mt-1 sm:mt-2">
                  <Link
                    prefetch={'intent'}
                    to={media_type === 'movie' ? `/watch/movie/${id}` : `/watch/tv/${id}/1/1`}
                    className="rounded-md will-change-transform transition-all duration-300 cursor-pointer active:scale-[0.98] border-white border hover:bg-white hover:text-black sm:text-lg w-fit px-6 sm:px-8 py-2"
                  >
                    Play {media_type === 'movie' ? 'Movie' : `Episode 1`}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="lg:container mx-auto px-4 py-16 md:py-8">
          {media_type === 'tv' && details.seasons && details.seasons.length > 0 && (
            <section className="mt-8">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">Seasons</h2>
              <div className="flex overflow-x-auto gap-2 sm:gap-3 pb-4 mb-6 scrollbar-hide">
                {details.seasons.map((season) => (
                  <button
                    key={season.season}
                    onClick={() => setSelectedSeason(season)}
                    className={`cursor-pointer px-3 sm:px-4 py-1 sm:py-2 rounded-full whitespace-nowrap flex-shrink-0 transition-colors duration-200 ${
                      selectedSeason?.season === season.season
                        ? 'border-white border-2 text-white'
                        : 'border-zinc-600 hover:border-zinc-400 border-2 text-gray-300'
                    }`}
                  >
                    Season {season.season}
                  </button>
                ))}
              </div>

              {selectedSeason && (
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl sm:text-2xl font-semibold">Episodes</h3>
                    <span className="text-sm text-zinc-400">
                      {currentEpisodes.length}{' '}
                      {currentEpisodes.length === 1 ? 'Episode' : 'Episodes'}
                    </span>
                  </div>

                  {episodesLoading ? (
                    <Loader></Loader>
                  ) : currentEpisodes.length > 0 ? (
                    <div className="episodeGrid">
                      {currentEpisodes.map((episode) => (
                        <EpisodeComponent
                          key={episode.title}
                          episode={episode}
                          selectedSeason={selectedSeason}
                          id={id ? id : ''}
                        ></EpisodeComponent>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-zinc-400 bg-zinc-900 bg-opacity-30 rounded-lg">
                      No episodes available for this season.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </>
  )
}
