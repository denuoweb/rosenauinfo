import type { Request, Response } from 'express'

const DEFAULT_BASE = 'https://rosenau.info'
const configuredBase = typeof process.env.SITE_URL === 'string'
  ? process.env.SITE_URL.trim().replace(/\/+$/, '')
  : ''

function resolveBase(req: Request): string {
  if (configuredBase) {
    return configuredBase
  }
  const forwardedHost = req.get('x-forwarded-host')?.trim()
  const host = forwardedHost || req.get('host')?.trim()
  return host ? `https://${host}` : DEFAULT_BASE
}

export async function sitemapHandler(req: Request, res: Response) {
  const base = resolveBase(req)
  const urls: string[] = ['/', '/projects', '/resume', '/resume.pdf']
  const today = new Date().toISOString().slice(0,10)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(u => `<url><loc>${base}${u}</loc><lastmod>${today}</lastmod></url>`).join('')}
</urlset>`
  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.status(200).send(xml)
}
