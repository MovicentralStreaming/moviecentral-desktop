export type MediaType = 'movie' | 'tv'

export interface Season {
  episodeGroupId?: string
  seasonId?: string
  title: string
  overview: string
  poster: string
  season: number
}

export interface Episode {
  title: string
  overview: string
  still: string
  episode: number
}

export interface MovieDetails {
  title: string
  poster: string
  backdrop: string
  overview: string
  media_type: MediaType
  id: string
  releaseYear: string
  genres: string[]
  seasons?: Season[]
}

export interface MovieItem {
  title: string
  poster: string
  id: string
  media_type: MediaType
}

export interface EpisodeGroup {
  id: string
  name: string
  type: number
}

export interface EpisodeGroupSeason {
  id: string
  name: string
  order: number
}

export interface EpisodeGroupEpisode {
  id: string
  name: string
  overview: string
  still_path: string | null
  order: number
  episode_number: number
}

export interface Track {
  file: string
  label: string
  kind: string
  default?: boolean
}
