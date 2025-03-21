export type MediaType = 'movie' | 'tv'

export interface Season {
  episodeGroupId?: string
  episodeCount: number
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
  season?: number
  episode?: number
  watch_time?: number
  duration?: number
}

export interface SearchResults {
  results: MovieItem[]
  hasNextPage: boolean
}

export interface Track {
  file: string
  label: string
  kind?: string
  default?: boolean
}

export interface Source {
  stream: string
  referer: string
  tracks: Track[]
}

export interface StreamInfo {
  source: Source
  title: string
}
