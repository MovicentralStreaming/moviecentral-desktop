import { Fetcher, SourceFetcher } from '../utils/fetcher'
import slugify from '../utils/slugify'

export class Movieorca {
  static baseUrl = 'https://www2.movieorca.com'

  static async search(query: string): Promise<SearchResult[]> {
    const $ = await Fetcher.fetch(`${this.baseUrl}/search/${slugify(query)}`)
    const results: SearchResult[] = []

    $('.flw-item').each((_, item) => {
      const title = $(item).find('a.film-poster-ahref.flw-item-tip').attr('title') || ''
      const mediaType = $(item).find('.fdi-type').text().trim().toLowerCase()
      const mediaId =
        $(item)
          .find('a.film-poster-ahref.flw-item-tip')
          .attr('href')
          ?.replace(`/${mediaType}`, mediaType) || ''
      const poster = $(item).find('img.film-poster-img').attr('data-src') || ''
      results.push({ title, mediaType, mediaId, poster })
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

  static async getSources(serverId: string): Promise<Source[]> {
    const sources = await SourceFetcher.fetch(`${this.baseUrl}/ajax/episode/sources/${serverId}`)
    return [{ link: sources.link.replace('z=', '_debug=true') }]
  }
}
