import axios from 'axios'
import * as cheerio from 'cheerio'

export class Fetcher {
  static async fetch(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get(url)
      return cheerio.load(response.data)
    } catch (error) {
      throw new Error(`Error Fetching: ${error}`)
    }
  }

  static async fetchMultiple(urls: string[]): Promise<cheerio.CheerioAPI[]> {
    const fetchPromises = urls.map((url) => this.fetch(url))
    return Promise.all(fetchPromises)
  }
}

export class SourceFetcher {
  static async fetch(url: string): Promise<{ link: string }> {
    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      throw new Error(`Error Fetching: ${error}`)
    }
  }

  static async fetchMultiple(urls: string[]): Promise<{ link: string }[]> {
    const fetchPromises = urls.map((url) => this.fetch(url))
    return Promise.all(fetchPromises)
  }
}
