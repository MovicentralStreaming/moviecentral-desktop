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

async function scrape(url: string): Promise<ScrapeResult> {
  if (!url) throw new Error('No URL provided')

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

    await page.setRequestInterception(true)

    page.on('request', (request: any) => {
      const url = request.url()

      console.log(url)

      if (url.includes('.m3u8')) {
        finalResponse.stream = url
        request.continue()
      } else {
        request.continue()
      }
    })

    const finalResponse: ScrapeResult = { stream: '', tracks: [], referer: new URL(url).origin }

    page.on('response', async (response) => {
      const url = response.url()

      if (url.includes('/api/source/') || url.includes('getSources')) {
        const responseBody = await response.json()
        if (responseBody.data?.subtitles) {
          finalResponse.tracks = responseBody.data.subtitles as Track[]
        } else if (responseBody.tracks) {
          finalResponse.tracks = responseBody.tracks as Track[]
        }
        if (url.includes('.m3u8')) {
          finalResponse.stream = url
        }
      }
    })

    await Promise.all([
      page.waitForRequest((req: any) => req.url().includes('.m3u8'), { timeout: 60000 }),
      page.goto(url, { waitUntil: 'domcontentloaded' })
    ])

    return finalResponse
  } catch (error) {
    throw new Error('Scraping failed: ' + (error as Error).message)
  } finally {
    if (browser) await browser.close()
  }
}

export { scrape }
