import { MediaType, MovieItem, MovieDetails, Season, Episode } from '@shared/types'
import noPoster from '../assets/no-poster.png'

export interface EpisodeGroup {
  id: string
  name: string
  type: number
}

export interface EpisodeGroupSeason {
  id: string
  name: string
  order: number
  episodeCount: number
}

export interface EpisodeGroupEpisode {
  id: string
  name: string
  overview: string
  still_path: string | null
  order: number
  episode_number: number
}

const apiKey = 'a4b333e38a353f9746a776a9a8d36a62'
const baseUrl = 'https://api.themoviedb.org/3'
const imageBaseUrl = 'https://image.tmdb.org/t/p'

class TMDB {
  private episodeGroupsCache: Record<string, EpisodeGroup | null> = {}
  private seasonsCache: Record<string, EpisodeGroupSeason[]> = {}

  private async fetchApi<T>(endpoint: string): Promise<T | undefined> {
    try {
      const url = `${baseUrl}${endpoint}api_key=${apiKey}&language=en-US`
      const res = await fetch(url)

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      return (await res.json()) as T
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      return undefined
    }
  }

  private formatPoster(path: string | null): string {
    return path ? `${imageBaseUrl}/w500${path}` : noPoster
  }

  private formatBackdrop(path: string | null): string {
    return path ? `${imageBaseUrl}/original${path}` : '/api/placeholder/1920/1080'
  }

  private formatStill(path: string | null): string {
    return path ? `${imageBaseUrl}/w500${path}` : noPoster
  }

  async getSimilar(id: string, mediaType: MediaType): Promise<MovieItem[] | undefined> {
    const data = await this.fetchApi<any>(`/${mediaType}/${id}/recommendations?`)
    if (!data) return undefined

    return data.results.map((item: any) => ({
      title: item.title || item.name,
      poster: this.formatPoster(item.poster_path),
      id: item.id,
      media_type: mediaType
    }))
  }

  async getTrending(): Promise<MovieItem[] | undefined> {
    const data = await this.fetchApi<any>('/trending/all/week?')
    if (!data) return undefined

    return data.results.map((item: any) => ({
      title: item.title || item.name,
      poster: this.formatPoster(item.poster_path),
      id: item.id,
      media_type: item.media_type
    }))
  }

  async getDetails(mediaType: MediaType, id: string): Promise<MovieDetails | undefined> {
    const data = await this.fetchApi<any>(`/${mediaType}/${id}?`)
    if (!data) return undefined

    const details: MovieDetails = {
      title: data.title || data.name,
      overview: data.overview,
      poster: this.formatPoster(data.poster_path),
      backdrop: this.formatBackdrop(data.backdrop_path),
      id: data.id,
      media_type: mediaType,
      releaseYear: new Date(data.release_date || data.first_air_date).getFullYear().toString(),
      genres: data.genres ? data.genres.map((g: any) => g.name) : []
    }

    if (mediaType === 'tv') {
      const seasonsGroup = await this.findSeasonsEpisodeGroup(id)

      if (seasonsGroup) {
        const groupSeasons = await this.getEpisodeGroupSeasons(seasonsGroup.id)
        details.seasons = groupSeasons
          .filter((season) => season.name !== 'Specials')
          .map(
            (season): Season => ({
              episodeCount: season.episodeCount,
              title: season.name,
              overview: 'Custom season ordering from TMDB episode group',
              poster: noPoster,
              season: season.order,
              episodeGroupId: seasonsGroup.id,
              seasonId: season.id
            })
          )
      } else if (data.seasons) {
        details.seasons = data.seasons
          .filter((season: any) => season.name !== 'Specials')
          .map(
            (season: any): Season => ({
              title: season.name,
              episodeCount: season.episode_count,
              overview: season.overview || 'No overview available',
              poster: this.formatPoster(season.poster_path),
              season: season.season_number
            })
          )
      }
    }

    return details
  }

  async getEpisodes(id: string, season: number): Promise<Episode[] | undefined> {
    try {
      const seasonsGroup = await this.findSeasonsEpisodeGroup(id)

      if (seasonsGroup) {
        const groupSeasons = await this.getEpisodeGroupSeasons(seasonsGroup.id)

        const matchingSeason = groupSeasons.find((s) => s.order === season)

        if (matchingSeason) {
          const episodes = await this.getEpisodeGroupEpisodes(seasonsGroup.id, matchingSeason.id)
          return episodes.map(
            (episode): Episode => ({
              title: episode.name,
              overview: episode.overview || 'No overview available',
              still: this.formatStill(episode.still_path),
              episode: episode.order + 1
            })
          )
        }
      }

      const data = await this.fetchApi<any>(`/tv/${id}/season/${season}?`)
      if (!data || !data.episodes) return undefined

      return data.episodes.map(
        (episode: any): Episode => ({
          title: episode.name,
          overview: episode.overview || 'No overview available',
          still: this.formatStill(episode.still_path),
          episode: episode.episode_number
        })
      )
    } catch (error) {
      console.error('Error fetching episodes:', error)
      return undefined
    }
  }

  private async getEpisodeGroups(tvId: string): Promise<EpisodeGroup[]> {
    const data = await this.fetchApi<any>(`/tv/${tvId}/episode_groups?`)
    return data?.results || []
  }

  private async findSeasonsEpisodeGroup(tvId: string): Promise<EpisodeGroup | undefined> {
    if (this.episodeGroupsCache[tvId] !== undefined) {
      return this.episodeGroupsCache[tvId] || undefined
    }

    const groups = await this.getEpisodeGroups(tvId)
    const seasonsGroup = groups.find((group) => group.name === 'Seasons')

    this.episodeGroupsCache[tvId] = seasonsGroup || null

    return seasonsGroup
  }

  private async getEpisodeGroupSeasons(groupId: string): Promise<EpisodeGroupSeason[]> {
    if (this.seasonsCache[groupId]) {
      return this.seasonsCache[groupId]
    }

    const data = await this.fetchApi<any>(`/tv/episode_group/${groupId}?`)
    const seasons = data?.groups || []

    this.seasonsCache[groupId] = seasons

    return seasons
  }

  private async getEpisodeGroupEpisodes(
    groupId: string,
    seasonId: string
  ): Promise<EpisodeGroupEpisode[]> {
    const data = await this.fetchApi<any>(`/tv/episode_group/${groupId}?`)
    if (!data) return []

    const season = data.groups.find((g: any) => g.id === seasonId)
    return season ? season.episodes || [] : []
  }

  async search(
    query: string,
    page: number = 1
  ): Promise<{ results: MovieItem[]; hasNextPage: boolean } | undefined> {
    if (!query.trim()) return undefined

    const data = await this.fetchApi<any>(
      `/search/multi?query=${encodeURIComponent(query)}&page=${page}&`
    )
    if (!data) return undefined

    const results = data.results
      .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: any) => ({
        title: item.title || item.name,
        poster: this.formatPoster(item.poster_path),
        id: item.id,
        media_type: item.media_type as MediaType
      }))

    return {
      results,
      hasNextPage: page < data.total_pages
    }
  }
}

export default new TMDB()
