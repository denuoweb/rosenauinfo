import type { Request, Response } from 'express'
import { getApps, initializeApp } from 'firebase-admin/app'
import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getFirestore } from 'firebase-admin/firestore'
import { resolveSiteUrl } from './siteUrl.js'

if (!getApps().length) {
  initializeApp()
}

type AlternateLink = {
  hreflang: string
  href: string
}

type SitemapItem = {
  loc: string
  lastmod: string
  alternates?: AlternateLink[]
  images?: string[]
}

type PublicDocs = {
  site: DocumentSnapshot
  home: DocumentSnapshot
  about: DocumentSnapshot
  contact: DocumentSnapshot
  resume: DocumentSnapshot
}

function pick(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function dateMs(value: unknown): number | null {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.getTime()
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'object' && typeof (value as { toDate?: () => Date }).toDate === 'function') {
    const parsed = (value as { toDate: () => Date }).toDate()
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
  }

  const parsed = new Date(pick(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

function latestIsoDate(...values: unknown[]): string | null {
  const timestamps = values
    .map(value => dateMs(value))
    .filter((value): value is number => value !== null)

  if (timestamps.length === 0) return null
  return new Date(Math.max(...timestamps)).toISOString().slice(0, 10)
}

function snapshotLastmod(snapshot: DocumentSnapshot | QueryDocumentSnapshot, ...fields: string[]) {
  const data = snapshot.data() as Record<string, unknown> | undefined
  return latestIsoDate(
    snapshot.updateTime,
    snapshot.createTime,
    ...fields.map(field => data?.[field])
  )
}

function docLastmod(snapshot: DocumentSnapshot, ...fields: string[]) {
  if (!snapshot.exists) return null
  return snapshotLastmod(snapshot, ...fields)
}

function maxDate(fallbackDate: string, ...values: Array<string | null>) {
  let latest = ''

  values.forEach(value => {
    if (value && value > latest) {
      latest = value
    }
  })

  return latest || fallbackDate
}

function absoluteHttpUrl(value: unknown): string | null {
  const raw = pick(value)
  if (!raw) return null

  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function loadPublicDocs(): Promise<PublicDocs> {
  const db = getFirestore()
  const [site, home, about, contact, resume] = await Promise.all([
    db.collection('public').doc('site').get(),
    db.collection('public').doc('home').get(),
    db.collection('public').doc('about').get(),
    db.collection('public').doc('contact').get(),
    db.collection('public').doc('resume').get()
  ])

  return { site, home, about, contact, resume }
}

async function loadProjectItems(base: string, fallbackDate: string): Promise<{
  items: SitemapItem[]
  lastmod: string
}> {
  const snapshot = await getFirestore().collection('projects').get()
  const items = snapshot.docs
    .map(doc => {
      const data = doc.data() as Record<string, unknown>
      const lastmod = snapshotLastmod(
        doc,
        'updatedAt',
        'updated_at',
        'github_synced_at',
        'github_updated_at',
        'github_pushed_at',
        'pushed_at',
        'createdAt',
        'created_at'
      ) ?? fallbackDate
      const image = absoluteHttpUrl(data.cover ?? data.image ?? data.thumbnail)

      return {
        id: doc.id,
        order: Number(data.order ?? 0),
        item: {
          loc: `${base}/projects/${encodeURIComponent(doc.id)}`,
          lastmod,
          ...(image ? { images: [image] } : {})
        }
      }
    })
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))

  return {
    items: items.map(entry => entry.item),
    lastmod: maxDate(fallbackDate, ...items.map(entry => entry.item.lastmod))
  }
}

function buildStaticItems(base: string, fallbackDate: string, docs: PublicDocs, projectsLastmod: string): SitemapItem[] {
  const siteLastmod = docLastmod(docs.site, 'updatedAt', 'updated_at')
  const homeLastmod = maxDate(fallbackDate, siteLastmod, docLastmod(docs.home, 'updatedAt', 'updated_at'))
  const aboutLastmod = maxDate(fallbackDate, siteLastmod, docLastmod(docs.about, 'updatedAt', 'updated_at'))
  const contactLastmod = maxDate(fallbackDate, siteLastmod, docLastmod(docs.contact, 'updatedAt', 'updated_at'))
  const resumeLastmod = maxDate(
    fallbackDate,
    siteLastmod,
    docLastmod(docs.resume, 'updatedAt', 'updated_at', 'ja_eta', 'eta_ja', 'jaTargetDate')
  )

  return [
    { loc: `${base}/`, lastmod: homeLastmod },
    { loc: `${base}/about`, lastmod: aboutLastmod },
    { loc: `${base}/projects`, lastmod: maxDate(fallbackDate, siteLastmod, projectsLastmod) },
    { loc: `${base}/contact`, lastmod: contactLastmod },
    {
      loc: `${base}/resume`,
      lastmod: resumeLastmod,
      alternates: [
        { hreflang: 'en', href: `${base}/resume?lang=en` },
        { hreflang: 'ja', href: `${base}/resume?lang=ja` },
        { hreflang: 'x-default', href: `${base}/resume` }
      ]
    },
    { loc: `${base}/resume.pdf`, lastmod: resumeLastmod }
  ]
}

function renderItem(item: SitemapItem) {
  const alternates = (item.alternates ?? [])
    .map(link => `    <xhtml:link rel="alternate" hreflang="${escapeXml(link.hreflang)}" href="${escapeXml(link.href)}" />`)
    .join('\n')
  const images = (item.images ?? [])
    .map(src => `    <image:image><image:loc>${escapeXml(src)}</image:loc></image:image>`)
    .join('\n')

  return [
    '  <url>',
    `    <loc>${escapeXml(item.loc)}</loc>`,
    `    <lastmod>${escapeXml(item.lastmod)}</lastmod>`,
    alternates,
    images,
    '  </url>'
  ]
    .filter(Boolean)
    .join('\n')
}

export async function sitemapHandler(req: Request, res: Response) {
  try {
    const base = resolveSiteUrl(req)
    const today = new Date().toISOString().slice(0, 10)
    const [docs, projectState] = await Promise.all([
      loadPublicDocs(),
      loadProjectItems(base, today)
    ])
    const allItems = [...buildStaticItems(base, today, docs, projectState.lastmod), ...projectState.items]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allItems.map(item => renderItem(item)).join('\n')}
</urlset>
`

    res.setHeader('Content-Type', 'application/xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.status(200).send(xml)
  } catch (error) {
    console.error('sitemapHandler error:', error)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(500).send('Unable to generate sitemap right now.')
  }
}
