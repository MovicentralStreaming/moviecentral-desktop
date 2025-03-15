import { Movieorca } from './providers/movieorca'
import slugify from './utils/slugify'

export async function getSources(
  mediaType: string,
  title: string,
  season?: number,
  episode?: number
) {
  const searchResults = await Movieorca.search(title)
  if (!searchResults.length) return { error: { message: 'No results found.' } }

  let matchedResult = searchResults[0]
  for (const result of searchResults) {
    if (result.mediaType === mediaType && slugify(result.title) === slugify(title)) {
      matchedResult = result
      break
    }
  }

  let seasons, episodes, servers, sources

  if (mediaType === 'tv') {
    seasons = await Movieorca.getSeasons(matchedResult.mediaId)
    if (!seasons.length) return { error: { message: 'No seasons found.' } }

    episodes = await Movieorca.getEpisodes(seasons[season! - 1].id)
    if (!episodes.length) return { error: { message: 'No episodes found.' } }

    servers = await Movieorca.getEpisodeServers(episodes[episode! - 1].id)
    if (!servers.length) return { error: { message: 'No servers found.' } }

    sources = await Movieorca.getSources(servers[0].id)
  } else if (mediaType === 'movie') {
    servers = await Movieorca.getMovieServers(matchedResult.mediaId)
    if (!servers.length) return { error: { message: 'No servers found.' } }

    sources = await Movieorca.getSources(servers[0].id)
  }

  if (sources && sources[0].link) {
    return { embed: sources[0].link }
  }

  return { error: { message: 'Error fetching sources...' } }
}
