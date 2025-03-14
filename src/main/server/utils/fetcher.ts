import axios from "axios";
import * as cheerio from "cheerio";

export class Fetcher {
  static async fetch(url: string): Promise<cheerio.CheerioAPI> {
    try {
      const response = await axios.get(url);
      return cheerio.load(response.data);
    } catch (error) {
      throw new Error(`Error Fetching: ${error}`);
    }
  }
}

export class SourceFetcher {
  static async fetch(url: string): Promise<{ link: string }> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      throw new Error(`Error Fetching: ${error}`);
    }
  }
}
