import express from 'express'
import { getSources } from './api'
import cors from 'cors'
import { proxySegment, proxyVtt } from './api/proxy'
import { readUserData, writeUserData } from '..'
import timeout from 'connect-timeout'
import { search } from './providers/tmdb'
import { scrape } from './utils/scraper'

export function startServer() {
  const app = express()

  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cors())
  app.use(timeout('30s'))

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'public, max-age=360')
    next()
  })

  app.get('/ping', (_req, res) => {
    res.send('ok')
  })

  app.get('/api/sources/movie/:title', async (req, res) => {
    const { title } = req.params
    const embed = await getSources('movie', title)
    const sources = await scrape(embed.embed)
    res.json(sources)
  })

  app.get('/api/sources/tv/:title/:season/:episode', async (req, res) => {
    const { title, season, episode } = req.params
    const embed = await getSources('tv', title, parseInt(season), parseInt(episode))
    const sources = await scrape(embed.embed)
    res.json(sources)
  })

  app.get('/api/proxy/:encodedUrl/:encodedReferer/segment', async (req, res) => {
    await proxySegment(req, res)
  })

  app.get('/api/proxy/:encodedUrl/captions', async (req, res) => {
    await proxyVtt(req, res)
  })

  app.get('/api/user', (_req, res) => {
    const userData = readUserData()
    res.json(userData || { message: 'No user data found' })
  })

  app.post('/api/user/history', (req, res) => {
    writeUserData({ history: [req.body] })
    res.json({ success: true, message: 'User data saved' })
  })

  app.get('/api/search/:query/:page', async (req, res) => {
    const { query, page } = req.params
    const results = await search(query, page)
    res.json(results)
  })

  app.listen(5555, () => {
    console.log('Server running on http://localhost:5555')
  })
}
