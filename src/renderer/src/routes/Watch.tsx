import { useEffect, useState } from 'react'
import { Loader } from '../components/Loader'
import { useParams } from 'react-router-dom'
import { MediaType, MovieDetails } from '@renderer/types/types'
import { getDetails } from '@renderer/helper/tmdb'
import { Stream } from '@renderer/components/Stream'

declare global {
  interface Window {
    api: {
      onHlsUrl: (callback: (url: string) => void) => void
    }
  }
}

export default function Watch() {
  const { media_type, id, season, episode } = useParams()

  const [mediaDetails, setMediaDetails] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamSources, setStreamSources] = useState<{ embed?: string } | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const [devMode, _setDevMode] = useState(false)
  const devEmbedLink = 'https://kerolaunochan.online/v2/embed-4/yoodfHoz0VQM?z='
  const devStreamUrl =
    'https://sunrays81.xyz/file1/bjZyvV3b0TzfaJH7sVthY41DN+OZFTivp6Ga4EtFE~8USST4p1GD0s3nS4BDKQQRePecZKZ1Th0NZ7odN3Khfq7+GtmMdyL2fRELkn4HCQ45rH8jQAq7kyClSo1R1pHuf2M8rvJ3PjUnh+Rt+k82ZMRBsu~QeVu73n0TNwNHVAo=/cGxheWxpc3QubTN1OA==.m3u8'

  useEffect(() => {
    const onHlsUrl = (url: string) => {
      if (!streamUrl) {
        setStreamUrl(url)
      }
    }

    window.api.onHlsUrl(onHlsUrl)

    return () => {
      window.api.onHlsUrl(() => {})
    }
  }, [streamUrl])

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

    if (!devMode) {
      fetchMediaDetails()
    } else {
    }
  }, [media_type, id, season, episode, devMode])

  useEffect(() => {
    const fetchStreamSources = async () => {
      if (!mediaDetails) return

      try {
        if (devMode) {
          setStreamSources({ embed: devEmbedLink })
          setStreamUrl(devStreamUrl)
          setIsLoading(false)
        } else {
          const apiBaseUrl = 'http://localhost:5555/api/sources'
          const encodedTitle = encodeURIComponent(mediaDetails.title)

          const apiUrl =
            media_type === 'movie'
              ? `${apiBaseUrl}/movie/${encodedTitle}`
              : `${apiBaseUrl}/tv/${encodedTitle}/${season}/${episode}`

          const response = await fetch(apiUrl)
          const data = await response.json()
          setStreamSources(data)
        }
      } catch (error) {
        console.error('Error fetching stream sources:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStreamSources()
  }, [mediaDetails, media_type, season, episode, devMode])

  if (isLoading && !devMode) {
    return (
      <div className="h-screen flex items-center justify-center -m-4">
        <Loader />
      </div>
    )
  }

  return (
    <>
      <div className="h-screen flex items-center justify-center -m-4 bg-black">
        {!devMode ? (
          <>
            {streamSources?.embed ? (
              <>
                {!streamUrl && <iframe className="hidden" src={streamSources.embed}></iframe>}
                {streamUrl && (
                  <Stream
                    title={`${mediaDetails?.title} S${season}E${episode}`}
                    referer={new URL(streamSources.embed).origin}
                    src={streamUrl}
                  />
                )}
              </>
            ) : (
              <span>Error finding sources...</span>
            )}
          </>
        ) : (
          <Stream referer={new URL(devEmbedLink).origin} src={devStreamUrl} />
        )}
      </div>
    </>
  )
}
