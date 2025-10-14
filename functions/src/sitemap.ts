import type { Request, Response } from 'express'
const BASE = process.env.SITE_URL || 'https://your-domain'

export async function sitemapHandler(_: Request, res: Response) {
  const urls: string[] = ['/', '/projects', '/resume']
  const today = new Date().toISOString().slice(0,10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `<url><loc>${BASE}${u}</loc><lastmod>${today}</lastmod></url>`).join('')}
</urlset>`
  res.setHeader('Content-Type', 'application/xml')
  res.status(200).send(xml)
}
