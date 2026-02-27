import type { Request, Response } from 'express'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const DEFAULT_BASE = 'https://rosenau.info'
const configuredBase = typeof process.env.SITE_URL === 'string'
  ? process.env.SITE_URL.trim().replace(/\/+$/, '')
  : ''

if (!getApps().length) {
  initializeApp()
}

function resolveBase(req: Request): string {
  if (configuredBase) {
    return configuredBase
  }
  const forwardedHost = req.get('x-forwarded-host')?.trim()
  const host = forwardedHost || req.get('host')?.trim()
  return host ? `https://${host}` : DEFAULT_BASE
}

type SitemapItem = {
  loc: string
  lastmod: string
}

function pick(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isoDate(value: unknown): string | null {
  const parsed = new Date(pick(value))
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function loadProjectItems(base: string, fallbackDate: string): Promise<SitemapItem[]> {
  const snapshot = await getFirestore().collection('projects').get()
  return snapshot.docs.map(doc => {
    const data = doc.data() as Record<string, unknown>
    const lastmod = isoDate(
      data.updatedAt ??
      data.updated_at ??
      data.github_synced_at ??
      data.github_updated_at ??
      data.pushed_at ??
      data.createdAt ??
      data.created_at
    ) ?? fallbackDate
    return {
      loc: `${base}/projects/${encodeURIComponent(doc.id)}`,
      lastmod
    }
  })
}

export async function sitemapHandler(req: Request, res: Response) {
  try {
    const base = resolveBase(req)
    const today = new Date().toISOString().slice(0, 10)
    const staticPaths = ['/', '/about', '/projects', '/contact', '/resume', '/resume.pdf']
    const staticItems: SitemapItem[] = staticPaths.map(path => ({
      loc: `${base}${path}`,
      lastmod: today
    }))
    const projectItems = await loadProjectItems(base, today)
    const allItems = [...staticItems, ...projectItems]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allItems
    .map(item => `<url><loc>${escapeXml(item.loc)}</loc><lastmod>${escapeXml(item.lastmod)}</lastmod></url>`)
    .join('')}
</urlset>`
    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(xml)
  } catch (error) {
    console.error('sitemapHandler error:', error)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(500).send('Unable to generate sitemap right now.')
  }
}
