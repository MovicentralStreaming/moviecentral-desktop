import { getEpisodes } from '@renderer/helper/tmdb'
import { Episode, MovieDetails } from '@shared/types'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function NextEpisode({
  mediaDetails,
  currentSeason,
  currentEpisode,
  currentTime,
  duration
}: {
  mediaDetails: MovieDetails
  currentSeason: number
  currentEpisode: number
  currentTime: number
  duration: number
}) {
  const navigate = useNavigate()
  const [nextSeasonNumber, setNextSeasonNumber] = useState(currentSeason)
  const [nextEpisodeNumber, setNextEpisodeNumber] = useState(currentEpisode + 1)
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(duration - currentTime)
  const [showPopup, setShowPopup] = useState(true)
  const [finalCountdown, setFinalCountdown] = useState(5)

  useEffect(() => {
    const fetchNextEpisode = async () => {
      if (!mediaDetails.seasons || mediaDetails.seasons.length === 0) return

      setLoading(true)

      let nextSeason = currentSeason
      let nextEp = currentEpisode + 1
      const currentSeasonData = mediaDetails.seasons.find(
        (season) => season.season === currentSeason
      )

      if (currentSeasonData && nextEp > currentSeasonData.episodeCount) {
        const nextSeasonData = mediaDetails.seasons.find(
          (season) => season.season === currentSeason + 1
        )

        if (nextSeasonData) {
          nextSeason = currentSeason + 1
          nextEp = 1
        } else {
          setNextEpisode(null)
          setLoading(false)
          return
        }
      }

      setNextSeasonNumber(nextSeason)
      setNextEpisodeNumber(nextEp)

      try {
        const episodes = await getEpisodes(
          mediaDetails.id,
          nextSeason,
          mediaDetails.seasons.find((season) => season.season === nextSeason)?.episodeGroupId,
          mediaDetails.seasons.find((season) => season.season === nextSeason)?.seasonId
        )

        if (episodes && episodes.length > 0) {
          const episode = episodes.find((ep) => ep.episode === nextEp) || null
          setNextEpisode(episode)
        } else {
          setNextEpisode(null)
        }
      } catch (error) {
        console.error('Error fetching next episode:', error)
        setNextEpisode(null)
      } finally {
        setLoading(false)
      }
    }

    fetchNextEpisode()
  }, [mediaDetails, currentEpisode, currentSeason])

  useEffect(() => {
    if (!nextEpisode || !showPopup) return

    if (currentTime >= duration) {
      setCountdown(0)
      setFinalCountdown(5)
    } else {
      const remainingTime = duration - currentTime
      setCountdown(remainingTime)
    }
  }, [currentTime, duration, nextEpisode, showPopup])

  useEffect(() => {
    if (countdown === 0 && finalCountdown > 0) {
      const waitTimer = window.setInterval(() => {
        setFinalCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(waitTimer)
            navigate(`/watch/tv/${mediaDetails.id}/${nextSeasonNumber}/${nextEpisodeNumber}`)
            window.location.reload()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(waitTimer)
    }
    return
  }, [countdown, finalCountdown, navigate, mediaDetails.id, nextSeasonNumber, nextEpisodeNumber])

  const handleCancel = () => {
    setShowPopup(false)
  }

  if (loading || !nextEpisode || !showPopup) {
    return null
  }

  return (
    <div className="absolute bottom-0 right-0 p-4 bg-zinc-900/90 rounded shadow-md text-white pointer-events-auto w-full max-w-lg max-h-[320px] overflow-hidden transition-all duration-300">
      <div className="flex flex-row gap-4">
        <div className="relative w-2/5 aspect-video flex-shrink-0 rounded overflow-hidden">
          <img
            src={nextEpisode.still}
            alt={nextEpisode.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-transparent"></div>
        </div>

        <div className="flex flex-col justify-between w-3/5">
          <div>
            <div className="flex items-center mb-1">
              <span className="text-xs text-gray-400 mr-2">UP NEXT</span>
              <span className="text-xs bg-zinc-700 px-2 py-0.5 rounded">
                {countdown > 0
                  ? `Plays in ${Math.floor(countdown)}s`
                  : finalCountdown > 0
                    ? `Next in ${finalCountdown}s`
                    : 'Playing now...'}
              </span>
            </div>

            <h3 className="text-lg font-medium mb-1 line-clamp-1">{nextEpisode.title}</h3>

            <div className="text-sm text-gray-300 mb-2">
              {nextSeasonNumber !== currentSeason ? `Season ${nextSeasonNumber}, ` : ''}
              Episode {nextEpisodeNumber}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                navigate(`/watch/tv/${mediaDetails.id}/${nextSeasonNumber}/${nextEpisodeNumber}`)
                window.location.reload()
              }}
              className=" cursor-pointer bg-white text-black py-2 px-4 rounded text-center transition-colors hover:bg-gray-200 text-sm font-medium  flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"></path>
              </svg>
              Play
            </button>

            <button
              onClick={handleCancel}
              className="cursor-pointer bg-transparent border border-zinc-600 hover:bg-zinc-800 text-white py-2 px-4 rounded text-center transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
