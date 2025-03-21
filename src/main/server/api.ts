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
    if (result.media_type === mediaType && slugify(result.title) === slugify(title)) {
      matchedResult = result
      break
    }
  }

  let seasons, episodes, servers, sources

  try {
    if (mediaType === 'tv') {
      ;[seasons, episodes] = await Promise.all([
        Movieorca.getSeasons(matchedResult.id),
        Movieorca.getSeasons(matchedResult.id).then((seasons) => {
          if (seasons.length) {
            return Movieorca.getEpisodes(seasons[season! - 1].id)
          } else {
            return []
          }
        })
      ])

      if (!seasons.length || !episodes.length)
        return { error: { message: 'No seasons or episodes found.' } }

      servers = await Movieorca.getEpisodeServers(episodes[episode! - 1].id)
      if (!servers.length) return { error: { message: 'No servers found.' } }

      sources = await Movieorca.getSources(servers[0].id)
    } else if (mediaType === 'movie') {
      ;[servers, sources] = await Promise.all([
        Movieorca.getMovieServers(matchedResult.id),
        Movieorca.getMovieServers(matchedResult.id).then((servers) => {
          if (servers.length) {
            return Movieorca.getSources(servers[0].id)
          } else {
            return []
          }
        })
      ])
    }

    if (sources && sources[0].link) {
      return { embed: sources[0].link }
    }
  } catch (error) {
    return { error: { message: 'Error fetching sources...' } }
  }

  return { error: { message: 'Error fetching sources...' } }
}
