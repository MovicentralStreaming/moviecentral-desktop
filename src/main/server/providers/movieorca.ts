import { MediaType, MovieItem } from '../../../shared/types'
import { Fetcher, SourceFetcher } from '../utils/fetcher'
import slugify from '../utils/slugify'

export class Movieorca {
  static baseUrl = 'https://www2.movieorca.com'

  static async search(query: string): Promise<MovieItem[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/search/${slugify(query)}`)
    const results: MovieItem[] = []

    $('.flw-item').each((_, item) => {
      const title = $(item).find('a.film-poster-ahref.flw-item-tip').attr('title') || ''
      const media_type = $(item).find('.fdi-type').text().trim().toLowerCase() as MediaType
      const id =
        $(item)
          .find('a.film-poster-ahref.flw-item-tip')
          .attr('href')
          ?.replace(`/${media_type}`, media_type) || ''
      const poster = $(item).find('img.film-poster-img').attr('data-src') || ''
      results.push({ title, media_type, id, poster })
    })

    return results
  }

  static async getSeasons(mediaId: string): Promise<Season[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/ajax/season/list/${mediaId.split('-').pop()}`)
    return $('.ss-item')
      .map((i, item) => ({ number: i + 1, id: $(item).attr('data-id') || '' }))
      .get()
  }

  static async getEpisodes(seasonId: string): Promise<Episode[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/ajax/season/episodes/${seasonId}`)
    return $('.eps-item')
      .map((i, item) => ({ number: i + 1, id: $(item).attr('data-id') || '' }))
      .get()
  }

  static async getEpisodeServers(episodeId: string): Promise<Server[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/ajax/episode/servers/${episodeId}`)
    return $('.link-item')
      .map((_, item) => ({
        name: $(item).attr('title')?.replace('Server ', '') || '',
        id: $(item).attr('data-id') || ''
      }))
      .get()
  }

  static async getMovieServers(mediaId: string): Promise<Server[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/ajax/episode/list/${mediaId.split('-').pop()}`)
    return $('.link-item')
      .map((_, item) => ({
        name: $(item).attr('title')?.replace('Server ', '') || '',
        id: $(item).attr('data-id') || ''
      }))
      .get()
  }

  static async getSources(servers: any): Promise<Source[]> {
    const allSources: Source[] = []

    for (const server of servers) {
      const sources = await SourceFetcher.fetch(`${this.baseUrl}/ajax/episode/sources/${server.id}`)
      allSources.push({ link: sources.link.replace('z=', '_debug=true') })
    }

    return allSources
  }
}
