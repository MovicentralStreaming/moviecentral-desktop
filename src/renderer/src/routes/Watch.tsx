import { useEffect, useState } from 'react'
import { Loader } from '../components/Loader'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getDetails } from '@renderer/helper/tmdb'
import { Stream } from '@renderer/components/Stream'
import { IconButton } from '@renderer/components/player/components/IconButton'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { MediaType, MovieDetails } from '@shared/types'

export default function Watch() {
  const [searchParams, _setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { media_type, id, season, episode } = useParams()

  const [mediaDetails, setMediaDetails] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamSources, setStreamSources] = useState<{
    referer: string
    stream: string
    tracks: any[]
  } | null>(null)

  const [lastUpdateTime, setLastUpdateTime] = useState(0)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)

  const updateHistory = async () => {
    const response = await fetch('http://localhost:5555/api/user/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: mediaDetails?.title,
        media_type: mediaDetails?.media_type,
        poster: mediaDetails?.poster,
        season: season,
        episode: episode,
        id: id,
        watch_time: currentTime,
        duration: videoDuration
      })
    })

    await response.json()
  }

  useEffect(() => {
    const fetchMediaDetails = async () => {
      if (!id || !media_type) return

      const fetchedDetails = await getDetails(media_type as MediaType, id)
      if (fetchedDetails) {
        setMediaDetails(fetchedDetails)

        const episodeInfo = fetchedDetails.media_type === 'tv' ? `S${season}E${episode}` : ''
        document.title = `${fetchedDetails.title} ${episodeInfo}`.trim()
      }
    }

    fetchMediaDetails()
  }, [media_type, id, season, episode])

  useEffect(() => {
    const fetchStreamSources = async () => {
      if (!mediaDetails) return

      try {
        const apiBaseUrl = 'http://localhost:5555/api/sources'
        const encodedTitle = encodeURIComponent(mediaDetails.title)

        const apiUrl =
          media_type === 'movie'
            ? `${apiBaseUrl}/movie/${encodedTitle}`
            : `${apiBaseUrl}/tv/${encodedTitle}/${season}/${episode}`

        const response = await fetch(apiUrl)
        const data = await response.json()
        setStreamSources(data)
      } catch (error) {
        console.error('Error fetching stream sources:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamSources()
  }, [mediaDetails, media_type, season, episode])

  useEffect(() => {
    async function update() {
      await updateHistory()
      setLastUpdateTime(currentTime)
    }
    if (currentTime - lastUpdateTime >= 10) {
      update()
    }
  }, [currentTime, lastUpdateTime, videoDuration])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center -m-4">
        <div className="items-center justify-between fixed top-0 left-0 m-4">
          <IconButton onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="w-12 h-12" />
          </IconButton>
        </div>
        <Loader />
      </div>
    )
  }

  return (
    <div className="h-screen flex items-center justify-center -m-4 bg-black">
      <>
        {streamSources?.stream ? (
          <Stream
            startAt={Number(searchParams.get('time')) || 0}
            onTimeUpdate={setCurrentTime}
            onDurationUpdate={setVideoDuration}
            tracks={streamSources.tracks}
            title={`${mediaDetails?.title} ${mediaDetails?.media_type === 'tv' ? `S${season}E${episode}` : ''}`}
            referer={streamSources.referer}
            src={streamSources.stream}
          />
        ) : (
          <>
            <div className="items-center justify-between fixed top-0 left-0 m-4 z-99">
              <IconButton onClick={() => navigate(-1)}>
                <ArrowLeftIcon className="w-12 h-12" />
              </IconButton>
            </div>
            <span>Error finding sources...</span>
          </>
        )}
      </>
    </div>
  )
}
