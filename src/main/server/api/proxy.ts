import axios from 'axios'

export async function proxySegment(req, res) {
  try {
    const { encodedUrl, encodedReferer } = req.params
    let url = atob(encodedUrl)
    let referer = atob(encodedReferer)

    if (url.includes('http://localhost:5555/api/proxy/viper/')) {
      url = url.replace('http://localhost:5555/api/proxy/viper/', 'https://')
    }

    const urlObj = new URL(url)
    const origin = urlObj.origin

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent':
          req.headers['user-agent'] ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
        Referer: referer,
        Origin: origin,
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        Connection: 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site'
      }
    })

    res.set({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*'
    })

    response.data.pipe(res)
  } catch (error: any) {
    console.error('Error proxying HLS segment:', error.status)
    res.status(500).send('Error proxying content')
  }
}
