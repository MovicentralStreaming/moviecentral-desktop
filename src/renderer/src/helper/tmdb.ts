import {
  Episode,
  EpisodeGroup,
  EpisodeGroupEpisode,
  EpisodeGroupSeason,
  MediaType,
  MovieDetails,
  MovieItem
} from '@shared/types'
import noPoster from '../assets/no-poster.png'

const apiKey = 'a4b333e38a353f9746a776a9a8d36a62'

export const getSimilar = async (
  id: string,
  media_type: MediaType
): Promise<MovieItem[] | undefined> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${media_type}/${id}/recommendations?api_key=${apiKey}&language=en-US&page=1`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()

    const items: MovieItem[] = []

    data.results.forEach((result) => {
      items.push({
        title: result.title || result.name,
        poster: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : noPoster,
        id: result.id,
        media_type: media_type
      })
    })
    return items
  } catch (error) {
    console.error('Error fetching similar:', error)
    return undefined
  }
}

export const getTrending = async (): Promise<MovieItem[] | undefined> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&language=en-US`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()

    const items: MovieItem[] = []

    data.results.forEach((result) => {
      items.push({
        title: result.title || result.name,
        poster: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : noPoster,
        id: result.id,
        media_type: result.media_type
      })
    })
    return items
  } catch (error) {
    console.error('Error fetching trending:', error)
    return undefined
  }
}

export const getDetails = async (
  media_type: MediaType,
  id: string
): Promise<MovieDetails | undefined> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/${media_type}/${id}?api_key=${apiKey}&language=en-US`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    const genresList = data.genres ? data.genres.map((g: any) => g.name) : []

    const details: MovieDetails = {
      title: data.title || data.name,
      overview: data.overview,
      poster: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : noPoster,
      backdrop: data.backdrop_path
        ? `https://image.tmdb.org/t/p/original${data.backdrop_path}`
        : '/api/placeholder/1920/1080',
      id: data.id,
      media_type: media_type,
      releaseYear: new Date(data.release_date || data.first_air_date).getFullYear().toString(),
      genres: genresList
    }

    if (media_type === 'tv') {
      const seasonsGroup = await findSeasonsEpisodeGroup(id)

      if (seasonsGroup) {
        const groupSeasons = await getEpisodeGroupSeasons(seasonsGroup.id)
        details.seasons = groupSeasons
          .filter((season: any) => season.name !== 'Specials')
          .map((season) => ({
            episodeCount: season.episodeCount,
            title: season.name,
            overview: 'Custom season ordering from TMDB episode group',
            poster: noPoster,
            season: season.order,
            episodeGroupId: seasonsGroup.id,
            seasonId: season.id
          }))
      } else if (data.seasons) {
        details.seasons = data.seasons
          .filter((season: any) => season.name !== 'Specials')
          .map((season: any) => ({
            title: season.name,
            episodeCount: season.episode_count,
            overview: season.overview || 'No overview available',
            poster: season.poster_path
              ? `https://image.tmdb.org/t/p/w300${season.poster_path}`
              : noPoster,
            season: season.season_number
          }))
      }
    }

    return details
  } catch (error) {
    console.error('Error fetching details:', error)
    return undefined
  }
}

export const getEpisodes = async (
  id: string,
  season: number,
  episodeGroupId?: string,
  seasonId?: string
): Promise<Episode[] | undefined> => {
  try {
    if (episodeGroupId && seasonId) {
      const episodes = await getEpisodeGroupEpisodes(episodeGroupId, seasonId)
      return episodes.map((episode) => ({
        title: episode.name,
        overview: episode.overview || 'No overview available',
        still: episode.still_path
          ? `https://image.tmdb.org/t/p/original${episode.still_path}`
          : noPoster,
        episode: episode.order + 1
      }))
    } else {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${apiKey}&language=en-US`
      )
      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const data = await res.json()

      const episodes: Episode[] = data.episodes.map((episode: any) => ({
        title: episode.name,
        overview: episode.overview || 'No overview available',
        still: episode.still_path
          ? `https://image.tmdb.org/t/p/original${episode.still_path}`
          : noPoster,
        episode: episode.episode_number
      }))

      return episodes
    }
  } catch (error) {
    console.error('Error fetching episodes:', error)
    return undefined
  }
}

/* Helper functions tog get episode groups */

const getEpisodeGroups = async (tvId: string): Promise<EpisodeGroup[]> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}/episode_groups?api_key=${apiKey}`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    return data.results || []
  } catch (error) {
    console.error('Error fetching episode groups:', error)
    return []
  }
}

const findSeasonsEpisodeGroup = async (tvId: string): Promise<EpisodeGroup | undefined> => {
  const groups = await getEpisodeGroups(tvId)
  return groups.find((group) => group.name === 'Seasons')
}

const getEpisodeGroupSeasons = async (groupId: string): Promise<EpisodeGroupSeason[]> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/episode_group/${groupId}?api_key=${apiKey}`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    return data.groups || []
  } catch (error) {
    console.error('Error fetching episode group seasons:', error)
    return []
  }
}

const getEpisodeGroupEpisodes = async (
  groupId: string,
  seasonId: string
): Promise<EpisodeGroupEpisode[]> => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/episode_group/${groupId}?api_key=${apiKey}`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    const season = data.groups.find((g: any) => g.id === seasonId)

    return season ? season.episodes || [] : []
  } catch (error) {
    console.error('Error fetching episode group episodes:', error)
    return []
  }
}
