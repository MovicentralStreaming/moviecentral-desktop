import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { executablePath } from 'puppeteer'
import { Track } from '../../../shared/types'

puppeteer.use(StealthPlugin())

interface ScrapeResult {
  referer: string
  stream: string
  tracks: Track[]
}

async function scrape(url: string): Promise<ScrapeResult | null> {
  if (!url) return null

  let browser: any = null

  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-gpu',
        '--disable-software-rasterizer'
      ]
    })

    const page = await browser.newPage()
    await page.setCacheEnabled(true)
    await page.setViewport({ width: 1280, height: 800 })
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    )
    await page.setExtraHTTPHeaders({ Referer: new URL(url).origin })

    const finalResponse: ScrapeResult = { stream: '', tracks: [], referer: new URL(url).origin }
    let firstM3u8Found = false

    await page.setRequestInterception(true)

    /* @ts-ignore */
    page.on('request', (request: any) => {
      const requestUrl = request.url()

      console.log(requestUrl)

      if (!firstM3u8Found && requestUrl.includes('v1/error/ping.gif')) {
        console.error(`Scraping failed: error GIF detected`)
        request.continue()
        if (browser) browser.close()
        return null
      }

      if (requestUrl.includes('.m3u8') && !firstM3u8Found) {
        finalResponse.stream = requestUrl
        firstM3u8Found = true
        console.log(`Found first m3u8: ${requestUrl}`)
      }

      request.continue()
    })

    page.on('response', async (response) => {
      const responseUrl = response.url()

      if (responseUrl.includes('/api/source/') || responseUrl.includes('getSources')) {
        try {
          const responseBody = await response.json()
          if (responseBody.data?.subtitles) {
            finalResponse.tracks = responseBody.data.subtitles as Track[]
          } else if (responseBody.tracks) {
            finalResponse.tracks = responseBody.tracks as Track[]
          }
        } catch (e) {}
      }
    })

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 }).catch((err) => {
      console.error(`Navigation error: ${err.message}`)
    })

    if (finalResponse.stream) {
      await browser.close()
      return finalResponse
    }

    await browser.close()
    return null
  } catch (error: any) {
    console.error(`Scraping failed: ${error.message || 'Unknown error'}`)
    if (browser) await browser.close()
    return null
  }
}

export { scrape }
