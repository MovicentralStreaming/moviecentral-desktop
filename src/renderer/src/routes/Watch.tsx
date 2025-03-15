import { useEffect, useState } from 'react'
import { Loader } from '../components/Loader'
import { useParams } from 'react-router-dom'
import { MediaType, MovieDetails } from '@renderer/types/types'
import { getDetails } from '@renderer/helper/tmdb'
import { Stream } from '@renderer/components/Stream'

declare global {
  interface Window {
    api: {
      onSources: (
        callback: (sources: { sources: [{ stream: string }]; tracks: any[] }) => void
      ) => void
    }
  }
}

export default function Watch() {
  const { media_type, id, season, episode } = useParams()

  const DEV = false
  const DEV_EMBED_URL = 'https://kerolaunochan.xyz/v2/embed-4/ZDDk4xM4lTfp?_debug=true'

  const [mediaDetails, setMediaDetails] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [streamSources, setStreamSources] = useState<{
    sources: [{ stream: string }]
    tracks: any[]
  } | null>(null)

  useEffect(() => {
    setStreamSources(null)
  }, [embedUrl])

  useEffect(() => {
    const onSources = (sources: { sources: [{ stream: string }]; tracks: any[] }) => {
      if (sources) {
        setStreamSources(sources)
        setIsLoading(false)
      }
    }

    window.api.onSources(onSources)

    return () => {
      window.api.onSources(() => {})
    }
  }, [])

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

      if (!DEV) {
        try {
          const apiBaseUrl = 'http://localhost:5555/api/sources'
          const encodedTitle = encodeURIComponent(mediaDetails.title)

          const apiUrl =
            media_type === 'movie'
              ? `${apiBaseUrl}/movie/${encodedTitle}`
              : `${apiBaseUrl}/tv/${encodedTitle}/${season}/${episode}`

          const response = await fetch(apiUrl)
          const data = await response.json()
          setEmbedUrl(data.embed)
        } catch (error) {
          console.error('Error fetching stream sources:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        setIsLoading(false)
      }
    }

    fetchStreamSources()
  }, [mediaDetails, media_type, season, episode])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center -m-4">
        <Loader />
      </div>
    )
  }

  if (DEV) {
    return (
      <div className="h-screen flex items-center justify-center -m-4 bg-black">
        <>
          {DEV_EMBED_URL ? (
            <>
              {!streamSources && <iframe className="hidden" src={DEV_EMBED_URL}></iframe>}
              {streamSources && (
                <Stream
                  tracks={streamSources.tracks}
                  title={`Dev Player`}
                  referer={new URL(DEV_EMBED_URL).origin}
                  src={streamSources.sources[0].stream}
                />
              )}
            </>
          ) : (
            <span>Error finding sources...</span>
          )}
        </>
      </div>
    )
  } else {
    return (
      <div className="h-screen flex items-center justify-center -m-4 bg-black">
        <>
          {embedUrl ? (
            <>
              {!streamSources && <iframe className="hidden" src={embedUrl}></iframe>}
              {streamSources && (
                <Stream
                  tracks={streamSources.tracks}
                  title={`${mediaDetails?.title} S${season}E${episode}`}
                  referer={new URL(embedUrl).origin}
                  src={streamSources.sources[0].stream}
                />
              )}
            </>
          ) : (
            <span>Error finding sources...</span>
          )}
        </>
      </div>
    )
  }
}
