import { useEffect, useState, useCallback, useMemo } from 'react'
import { Loader } from '../components/Loader'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Stream } from '@renderer/components/Stream'
import { IconButton } from '@renderer/components/player/components/IconButton'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { MediaType, MovieDetails, Source, StreamInfo } from '@shared/types'
import { NextEpisode } from '@renderer/components/player/components/NextEpisode'
import tmdb from '@renderer/helper/tmdb'

export default function Watch() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { media_type, id, season, episode } = useParams()

  const [mediaDetails, setMediaDetails] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)

  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [showNextEpisode, setShowNextEpisode] = useState(false)

  const updateHistory = useCallback(async () => {
    if (!mediaDetails || !videoDuration || currentTime <= 0) return

    try {
      await fetch('http://localhost:5555/api/user/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaDetails.title,
          media_type: mediaDetails.media_type,
          poster: mediaDetails.poster,
          season,
          episode,
          id,
          watch_time: currentTime,
          duration: videoDuration
        })
      })
    } catch (error) {
      console.error('Failed to update history:', error)
    }
  }, [mediaDetails, currentTime, videoDuration, season, episode, id])

  useEffect(() => {
    if (!id || !media_type) return

    const fetchMediaAndStream = async () => {
      try {
        const fetchedDetails = await tmdb.getDetails(media_type as MediaType, id)
        if (!fetchedDetails) throw new Error('Failed to fetch media details.')

        setMediaDetails(fetchedDetails)

        const episodeInfo = fetchedDetails.media_type === 'tv' ? `S${season}E${episode}` : ''
        document.title = `${fetchedDetails.title} ${episodeInfo}`.trim()

        const apiProvider = 'movieorca'
        const apiBaseUrl = `http://localhost:5555/api/${apiProvider}/sources`
        const apiEndpoint =
          media_type === 'movie'
            ? `movie/${encodeURIComponent(fetchedDetails.title)}`
            : `tv/${encodeURIComponent(fetchedDetails.title)}/${season}/${episode}`

        const apiUrl = `${apiBaseUrl}/${apiEndpoint}`

        const response = await fetch(apiUrl)
        if (!response.ok) throw new Error('Failed to fetch stream sources.')

        const data: Source = await response.json()

        setStreamInfo({
          source: data,
          title: `${fetchedDetails.title} ${fetchedDetails.media_type === 'tv' ? `S${season}E${episode}` : ''}`
        })
      } catch (error) {
        console.error('Error fetching media/streams:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMediaAndStream()
  }, [media_type, id, season, episode])

  useEffect(() => {
    if (currentTime - lastUpdateTime >= 10) {
      updateHistory()
      setLastUpdateTime(currentTime)
    }
  }, [currentTime, lastUpdateTime, updateHistory])

  useEffect(() => {
    setShowNextEpisode(!!(videoDuration && videoDuration - currentTime <= 30 && episode))
  }, [currentTime, videoDuration, episode])

  const exit = useCallback(() => {
    navigate(
      `/details/${mediaDetails?.media_type}/${id}${mediaDetails?.media_type === 'tv' ? `?season=${season}` : ''}`
    )
  }, [navigate, mediaDetails, id, season])

  const nextEpisodePrompt = useMemo(
    () =>
      showNextEpisode && mediaDetails ? (
        <NextEpisode
          currentTime={currentTime}
          duration={videoDuration || 0}
          currentSeason={Number(season)}
          currentEpisode={Number(episode)}
          mediaDetails={mediaDetails}
        />
      ) : null,
    [showNextEpisode, mediaDetails, currentTime, videoDuration, season, episode]
  )

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center -m-4">
        <div className="items-center justify-between fixed top-0 left-0 m-4">
          <IconButton onClick={exit}>
            <ArrowLeftIcon className="w-12 h-12" />
          </IconButton>
        </div>
        <Loader />
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center -m-4 bg-black">
      {streamInfo?.source ? (
        <Stream
          onExit={exit}
          startAt={Number(searchParams.get('time')) || 0}
          onTimeUpdate={setCurrentTime}
          onDurationUpdate={setVideoDuration}
          streamInfo={streamInfo}
          nextEpisodePrompt={nextEpisodePrompt}
        />
      ) : (
        <div className="items-center justify-between fixed top-0 left-0 m-4 z-99">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="w-12 h-12" />
          </IconButton>
          <span>Error finding sources...</span>
        </div>
      )}
    </div>
  )
}
