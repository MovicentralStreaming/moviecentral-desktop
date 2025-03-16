import axios from 'axios'
import { SearchResults } from '../../../shared/types'

const API_BASE = 'https://api.themoviedb.org/3'
const API_KEY = 'a4b333e38a353f9746a776a9a8d36a62'

interface Params {
  key: string
  value: string
}

async function makeRequest(url: string, params?: Params[]) {
  const urlParams = params
    ? params.map((param) => `${param.key}=${encodeURIComponent(param.value)}`).join('&')
    : ''

  const response = await axios.get(`${url}?api_key=${API_KEY}&${urlParams}&language=en-US`)
  return response.data
}

export async function search(query: string, page: string): Promise<SearchResults> {
  const tmdbResponse = await makeRequest(`${API_BASE}/search/multi`, [
    { key: 'include_adult', value: 'false' },
    { key: 'query', value: query },
    { key: 'page', value: page }
  ])

  return {
    results: tmdbResponse.results
      .filter((item: any) => item.poster_path)
      .map((item: any) => ({
        title: item.title || item.name,
        poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        id: item.id.toString(),
        media_type: item.media_type
      })),
    hasNextPage: Number(page) < tmdbResponse.total_pages
  }
}
