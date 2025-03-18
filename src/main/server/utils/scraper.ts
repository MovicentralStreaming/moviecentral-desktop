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
      executablePath: executablePath()
    })

    const page = await browser.newPage()
    await page.setRequestInterception(true)
    await page.setExtraHTTPHeaders({ Referer: new URL(url).origin })

    const finalResponse: ScrapeResult = { stream: '', tracks: [], referer: new URL(url).origin }

    page.on('request', async (interceptedRequest: any) => {
      const reqUrl = interceptedRequest.url()
      console.log(reqUrl)
      if (reqUrl.includes('.m3u8')) finalResponse.stream = reqUrl
      interceptedRequest.continue()
    })

    page.on('response', async (response) => {
      if (response.url().includes('getSources')) {
        const responseBody = await response.json()
        if (responseBody.tracks) {
          finalResponse.tracks = responseBody.tracks as Track[]
        }
      }
    })

    await Promise.all([
      page.waitForRequest((req: any) => req.url().includes('.m3u8'), { timeout: 30000 }),
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
