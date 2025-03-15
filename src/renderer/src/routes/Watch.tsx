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
      onTracks: (callback: (tracks: any) => void) => void
    }
  }
}

export default function Watch() {
  const { media_type, id, season, episode } = useParams()

  const [mediaDetails, setMediaDetails] = useState<MovieDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [streamSources, setStreamSources] = useState<{ embed?: string } | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [streamTracks, setStreamTracks] = useState(null)

  const [devMode, _setDevMode] = useState(false)
  const devEmbedLink = 'https://kerolaunochan.live/v2/embed-4/3uLvGs3EDmqr?_debug=true'
  const devStreamUrl =
    'https://icygust24.live/file1/eqWDSfxPaKRMYh2qXFl7+0fUCLcnHu~sNbRmaB03NKVBch9WZW9545bRJdBbwzabO3A7ADG5l01X~GoCkZicZWK0GIIF+bWVYQnWV5VmDEv0bkUTgGi6V3vm6U8SH5G3gJ26Tzy+9aLYfYHB0bOLHXMZzlif75xP05w+rVJ8UGk=/cGxheWxpc3QubTN1OA==.m3u8'

  //get stream url
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

  //get tracks
  useEffect(() => {
    const onTracks = (tracks: any) => {
      if (!streamTracks) {
        setStreamTracks(tracks)
        console.log(tracks)
      }
    }

    window.api.onTracks(onTracks)

    return () => {
      window.api.onTracks(() => {})
    }
  }, [streamTracks])

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

  if (devMode) {
    return (
      <div className="h-screen flex items-center justify-center -m-4 bg-black">
        {!streamUrl && <iframe className="hidden" src={devEmbedLink}></iframe>}
        {streamUrl && streamTracks && (
          <Stream
            tracks={streamTracks}
            title={`dev mode}`}
            referer={new URL(devEmbedLink).origin}
            src={streamUrl}
          />
        )}
      </div>
    )
  } else {
    return (
      <div className="h-screen flex items-center justify-center -m-4 bg-black">
        <>
          {streamSources?.embed ? (
            <>
              {!streamUrl && <iframe className="hidden" src={streamSources.embed}></iframe>}
              {streamUrl && streamTracks && (
                <Stream
                  tracks={streamTracks}
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
      </div>
    )
  }
}
