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
  app.use(timeout('30s'))

  app.use((req, res, next) => {
    if (req.path.startsWith('/api/search')) {
      res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=60')
    } else if (req.path.startsWith('/api/sources')) {
      res.set('Cache-Control', 'public, max-age=3600, immutable')
    } else {
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60')
    }
    next()
  })

  app.get('/api/sources/movie/:title', async (req, res) => {
    const { title } = req.params
    const embed = await getSources('movie', title)
    const sources = await scrape(embed.embed)
    res.json(sources)
  })

  app.get('/api/movieorca/sources/tv/:title/:season/:episode', async (req, res) => {
    const { title, season, episode } = req.params
    const embed = await getSources('tv', title, parseInt(season), parseInt(episode))
    const sources = await scrape(embed.embed)
    res.json(sources)
  })

  app.get('/api/vidsrc/sources/:media_type/:id/:season/:episode', async (req, res) => {
    const { media_type, id, season, episode } = req.params
    const sources = await scrape(
      `https://vidsrc.cc/v2/embed/${media_type}/${id}${media_type === 'tv' ? `/${season}/${episode}` : ''}?autoPlay=true`
    )
    res.json(sources)
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
