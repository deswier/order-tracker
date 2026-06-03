import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url required' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return res.status(502).json({ error: `Ozon returned ${response.status}` })
    }

    const html = await response.text()

    // og:image в двух порядках атрибутов
    const ogImage =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)?.[1]

    if (ogImage) {
      return res.json({ imageUrl: ogImage })
    }

    // Fallback: первое большое изображение товара (data-src или src с ozon CDN)
    const cdnImage = html.match(/https:\/\/cdn1\.ozon\.ru\/[^"'>\s]+\.(?:jpg|jpeg|webp|png)/i)?.[0]
    if (cdnImage) {
      return res.json({ imageUrl: cdnImage })
    }

    return res.status(404).json({ error: 'Image not found' })
  } catch (err) {
    return res.status(500).json({ error: 'Fetch failed' })
  }
}
