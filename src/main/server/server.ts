import express from 'express'
import { getSources } from './api'
import cors from 'cors'
import { proxySegment, proxyVtt } from './api/proxy'

export function startServer() {
  const app = express()

  app.use(cors())

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'public, max-age=60')
    next()
  })

  app.get('/ping', (_req, res) => {
    res.send('ok')
  })

  app.get('/api/sources/movie/:title', async (req, res) => {
    const { title } = req.params
    const sources = await getSources('movie', title)
    res.json(sources)
  })

  app.get('/api/sources/tv/:title/:season/:episode', async (req, res) => {
    const { title, season, episode } = req.params
    const sources = await getSources('tv', title, parseInt(season), parseInt(episode))
    res.json(sources)
  })

  app.get('/api/proxy-hls/:encodedUrl/:encodedReferer', async (req, res) => {
    await proxySegment(req, res)
  })

  app.get('/api/proxy-vtt/:encodedUrl', async (req, res) => {
    await proxyVtt(req, res)
  })

  app.listen(5555, () => {
    console.log('Server running on http://localhost:5555')
  })
}
