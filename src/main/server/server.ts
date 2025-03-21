import express from 'express'
import { getSources } from './api'
import cors from 'cors'
import { proxySegment, proxyVtt } from './api/proxy'
import timeout from 'connect-timeout'
import { search } from './providers/tmdb'
import { scrape } from './utils/scraper'
import { deleteHistory, getHistory, updateHistory } from '..'

export function startServer() {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cors())
  app.use(timeout('45s'))

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/search')) {
      res.set('Cache-Control', 'public, max-age=36000, stale-while-revalidate=60')
    } else if (req.path.startsWith('/api/movieorca/sources')) {
      res.set('Cache-Control', 'no-store')
    } else {
      res.set('Cache-Control', 'public, max-age=360, stale-while-revalidate=60')
    }
    next()
  })

  app.get('/api/movieorca/sources/:type/:title/:season?/:episode?', async (req, res) => {
    const { type, title, season, episode } = req.params

    if (type !== 'movie' && type !== 'tv') {
      res.status(400).json({ message: 'Invalid media type. Use "movie" or "tv".' })
      return
    }

    let embed
    try {
      embed = await getSources(
        type,
        title,
        season ? parseInt(season) : undefined,
        episode ? parseInt(episode) : undefined
      )
    } catch (error: any) {
      console.error(`Error fetching sources: ${error.message}`)
      res.status(500).json({ message: 'Error fetching sources' })
      return
    }

    if (!embed || embed.error) {
      res.set('Cache-Control', 'no-store')
      res.status(404).json(embed?.error || { message: 'No embeds found' })
      return
    }

    console.log('Available servers:', embed.length)

    for (const server of embed) {
      if (!server?.link) continue

      console.log(`Trying server with link: ${server.link}`)

      const sources = await scrape(server.link)

      if (!sources) continue

      if (sources.stream) {
        res.set('Cache-Control', 'public, max-age=3600, immutable')
        res.json(sources)
        return
      }
    }

    console.log('No working sources found after trying all servers')
    res.set('Cache-Control', 'no-store')
    res.status(404).json({ message: 'No Sources found...' })
    return
  })

  app.get('/api/proxy/:encodedUrl/:encodedReferer/segment', async (req, res) => {
    await proxySegment(req, res)
  })

  app.get('/api/proxy/:encodedUrl/captions', async (req, res) => {
    await proxyVtt(req, res)
  })

  /* History */
  app.get('/api/user/history/delete', (_req, res) => {
    deleteHistory()
    res.json({ success: true, message: 'history deleted' })
  })

  app.get('/api/user/history', (_req, res) => {
    const userData = getHistory()
    res.json(userData || { message: 'No history found' })
  })

  app.post('/api/user/history', (req, res) => {
    updateHistory(req.body)

    res.json({ success: true, message: 'history saved' })
  })
  /* History */

  app.get('/api/search/:query/:page', async (req, res) => {
    const { query, page } = req.params
    const results = await search(query, page)
    res.json(results)
  })

  app.listen(5555, () => {
    console.log('Server running on http://localhost:5555')
  })
}
