import { MovieItem } from '@shared/types'

const baseUrl = 'http://localhost:5555'

class User {
  private async fetchApi<T>(endpoint: string): Promise<T | undefined> {
    try {
      const url = `${baseUrl}${endpoint}`
      const res = await fetch(url)

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      return (await res.json()) as T
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error)
      return undefined
    }
  }

  private parseHistory(data: Record<string, any>): MovieItem[] {
    return Object.entries(data).map(([key, value]) => {
      const [, id, season, episode] = key.match(/tv-(\d+)-(\d+)-(\d+)/) || []
      return {
        id: value.id || id,
        title: value.title,
        media_type: value.media_type,
        poster: value.poster,
        season: season ? parseInt(season, 10) : undefined,
        episode: episode ? parseInt(episode, 10) : undefined,
        watch_time: value.watch_time,
        duration: value.duration
      }
    })
  }

  async getHistory(): Promise<MovieItem[] | undefined> {
    const data = await this.fetchApi<Record<string, any>>('/api/user/history')
    if (!data) return undefined

    return this.parseHistory(data)
  }
}

export default new User()
