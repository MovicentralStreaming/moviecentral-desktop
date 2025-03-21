import { useEffect, useState, useCallback } from 'react'
import { Episode, MediaType, MovieDetails, MovieItem, Season } from '@shared/types'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Loader } from '../components/Loader'
import { Play } from '@renderer/components/player/icons/Play'
import { ItemsLabel } from '@renderer/components/ItemsLabel'
import { EpisodeComponent } from '@renderer/components/EpisodeComponent'
import { MovieItemGrid } from '@renderer/components/MovieItemGrid'
import tmdb from '@renderer/helper/tmdb'

export default function Details() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { media_type, id } = useParams()

  const [details, setDetails] = useState<MovieDetails | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null)
  const [currentEpisodes, setCurrentEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [episodesLoading, setEpisodesLoading] = useState<boolean>(false)
  const [similar, setSimilar] = useState<MovieItem[]>([])
  const [history, setHistory] = useState<Record<string, any> | null>(null)

  const fetchEpisodes = useCallback(async (showId: string, season: Season) => {
    if (!showId || !season) return

    setEpisodesLoading(true)
    try {
      const data = await tmdb.getEpisodes(showId, season.season)

      if (data) {
        setCurrentEpisodes(data)
      }
    } catch (error) {
      console.error('Failed to fetch episodes:', error)
      setCurrentEpisodes([])
    } finally {
      setEpisodesLoading(false)
    }
  }, [])

  const handleSeasonChange = useCallback(
    (seasonNumber: number) => {
      const season = details?.seasons?.find((s) => s.season === seasonNumber)
      if (season) {
        setSelectedSeason(season)

        setSearchParams(
          (prevParams) => {
            const newParams = new URLSearchParams(prevParams)
            newParams.set('season', seasonNumber.toString())
            return newParams
          },
          { replace: true }
        )
      }
    },
    [details, setSearchParams]
  )

  useEffect(() => {
    const getHistory = async () => {
      try {
        const response = await fetch('http://localhost:5555/api/user/history')
        const data = await response.json()
        setHistory(data)
      } catch (error) {
        console.error('Failed to fetch history:', error)
        setHistory(null)
      }
    }
    getHistory()
  }, [])

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!id || !media_type) return

      try {
        const items = await tmdb.getSimilar(id, media_type as MediaType)
        setSimilar(items || [])
      } catch (error) {
        console.error('Failed to fetch similar content:', error)
        setSimilar([])
      }
    }
    fetchSimilar()
  }, [id, media_type])

  useEffect(() => {
    if (!media_type || !id) return

    setLoading(true)

    tmdb
      .getDetails(media_type as MediaType, id)
      .then((data) => {
        if (data) {
          setDetails(data)
          document.title = data.title

          if (data.seasons && data.seasons.length > 0) {
            const seasonParam = searchParams.get('season')
            let targetSeason: Season | undefined

            if (seasonParam) {
              const seasonNumber = parseInt(seasonParam, 10)
              targetSeason = data.seasons.find((s) => s.season === seasonNumber)
            }

            setSelectedSeason(targetSeason || data.seasons[0])
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch details:', error)
        setDetails(null)
      })
      .finally(() => setLoading(false))
  }, [media_type, id, searchParams])

  useEffect(() => {
    if (selectedSeason && id) {
      fetchEpisodes(id, selectedSeason)
    }
  }, [selectedSeason, id, fetchEpisodes])

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (!details) {
    return <div className="text-white p-4">Could not load details.</div>
  }

  return (
    <>
      <div className="text-white min-h-screen -m-4 relative bg-neutral-950">
        <div className="relative h-[80vh] w-full">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${details.backdrop})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/30"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/50 to-transparent"></div>
          </div>

          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 md:px-12 z-10">
              <div className="w-full md:w-2/3 lg:w-1/2 flex flex-col gap-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">{details.title}</h1>

                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-300">
                  {details.releaseYear && <span>{details.releaseYear}</span>}
                  {details.releaseYear && <span className="mx-1">•</span>}
                  <span className="uppercase border border-gray-500 px-1 text-xs">
                    {media_type}
                  </span>
                  {details.genres && details.genres.length > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <div className="flex flex-wrap gap-2">
                        {details.genres.slice(0, 3).map((genre, index) => (
                          <span key={index}>{genre}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <p className="text-gray-300 text-lg leading-relaxed my-4 max-w-xl line-clamp-5">
                  {details.overview || 'No overview available'}
                </p>

                <div className="flex gap-4 items-center">
                  <Link
                    prefetch={'intent'}
                    to={media_type === 'movie' ? `/watch/movie/${id}` : `/watch/tv/${id}/1/1`}
                    className="bg-white hover:bg-gray-300 text-black rounded px-8 py-3 flex items-center gap-2 font-semibold"
                  >
                    <Play className="w-4 h-4" />
                    {media_type === 'movie' ? 'Play' : 'Play Episode 1'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 md:px-12 py-8 relative z-10 -mt-32">
          {media_type === 'tv' && details.seasons && details.seasons.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-2xl font-medium">Episodes</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">
                    {currentEpisodes.length} {currentEpisodes.length === 1 ? 'Episode' : 'Episodes'}
                  </span>
                  <div className="relative">
                    <select
                      className="appearance-none bg-neutral-950 text-white border-gray-600 hover:border-gray-400 rounded px-4 py-2 pr-8 cursor-pointer border-2 focus:outline-none focus:border-white"
                      value={selectedSeason?.season || ''}
                      onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                    >
                      {details.seasons.map((season) => (
                        <option key={season.season} value={season.season}>
                          Season {season.season}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M7 10l5 5 5-5H7z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {episodesLoading ? (
                <Loader />
              ) : currentEpisodes.length > 0 && selectedSeason ? (
                <div className="episodeGrid">
                  {currentEpisodes.map((episode) => {
                    const episodeKey = `tv-${id}-${selectedSeason.season}-${episode.episode}`
                    const historyEntry = history ? history[episodeKey] : null
                    const watchTime = historyEntry ? historyEntry.watch_time : 0
                    const duration = historyEntry ? historyEntry.duration : 0

                    return (
                      <EpisodeComponent
                        key={`${episode.episode}-${episode.title}`}
                        episode={episode}
                        selectedSeason={selectedSeason}
                        id={id || ''}
                        watchTime={watchTime}
                        duration={duration}
                      />
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 bg-zinc-900/50 rounded-lg">
                  No episodes available for this season.
                </div>
              )}
            </section>
          )}
          {similar.length > 0 && (
            <section className="mb-12">
              <ItemsLabel>More Like This</ItemsLabel>
              <MovieItemGrid items={similar} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}
