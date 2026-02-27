import type { Request, Response } from 'express'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp()
}

const DEFAULT_SITE_URL = 'https://rosenau.info'
const DEFAULT_PERSON_NAME = 'Jaron Rosenau'

type ResumeSectionRecord = {
  id?: unknown
  title_en?: unknown
  title_ja?: unknown
  title?: unknown
  items_en?: unknown
  items_ja?: unknown
  items?: unknown
}

type ResumeRecord = {
  url_en?: unknown
  url_ja?: unknown
  url?: unknown
  summary_en?: unknown
  summary_ja?: unknown
  summary?: unknown
  updatedAt?: unknown
  updated_at?: unknown
  ja_eta?: unknown
  eta_ja?: unknown
  jaTargetDate?: unknown
  sections?: unknown
}

type SiteRecord = {
  name_en?: unknown
  name_ja?: unknown
  name?: unknown
  githubUrl?: unknown
  github_url?: unknown
  github?: unknown
  linkedinUrl?: unknown
  linkedin_url?: unknown
  linkedin?: unknown
  xUrl?: unknown
  x_url?: unknown
  twitterUrl?: unknown
  twitter_url?: unknown
  twitter?: unknown
  website?: unknown
  websiteUrl?: unknown
  website_url?: unknown
  blogUrl?: unknown
  blog_url?: unknown
  blog?: unknown
  sameAs?: unknown
  same_as?: unknown
  profile_links?: unknown
  profileLinks?: unknown
}

type ProfileLink = {
  label: string
  url: string
}

type NormalizedSection = {
  id: string
  title: string
  items: string[]
}

const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''

function getBaseUrl(req: Request): string {
  const configured = pick(process.env.SITE_URL)
  if (configured) {
    return configured.replace(/\/+$/, '')
  }
  const forwardedHost = pick(req.get('x-forwarded-host'))
  const host = forwardedHost || pick(req.get('host'))
  return host ? `https://${host}` : DEFAULT_SITE_URL
}

function normalizeLanguage(req: Request): 'en' | 'ja' {
  const queryLang = Array.isArray(req.query.lang) ? req.query.lang[0] : req.query.lang
  const raw = pick(queryLang)
  if (raw.toLowerCase().startsWith('ja')) {
    return 'ja'
  }
  const acceptLanguage = pick(req.get('accept-language')).toLowerCase()
  return acceptLanguage.includes('ja') ? 'ja' : 'en'
}

function toList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(entry => pick(entry))
      .filter(Boolean)
  }
  return pick(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function toParagraphs(value: unknown): string[] {
  return pick(value)
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function safeUrl(value: string): string | null {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function toSafeUrl(value: unknown): string | null {
  const raw = pick(value)
  if (!raw) return null
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  return safeUrl(withProtocol)
}

function parseProfileLinks(raw: unknown): ProfileLink[] {
  const normalizeEntry = (entry: string, fallbackLabel: string): ProfileLink | null => {
    if (!entry) return null
    const [labelPart, urlPart] = entry.includes('|')
      ? entry.split('|', 2).map(part => part.trim())
      : [fallbackLabel, entry.trim()]
    const url = toSafeUrl(urlPart)
    if (!url) return null
    return {
      label: labelPart || fallbackLabel,
      url
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map(item => pick(item))
      .map((entry, index) => normalizeEntry(entry, `Profile ${index + 1}`))
      .filter((entry): entry is ProfileLink => Boolean(entry))
  }

  return pick(raw)
    .split(/\n|,/)
    .map(entry => entry.trim())
    .filter(Boolean)
    .map((entry, index) => normalizeEntry(entry, `Profile ${index + 1}`))
    .filter((entry): entry is ProfileLink => Boolean(entry))
}

function dedupeProfileLinks(links: ProfileLink[]): ProfileLink[] {
  const map = new Map<string, ProfileLink>()
  links.forEach(link => {
    if (!map.has(link.url)) {
      map.set(link.url, link)
    }
  })
  return Array.from(map.values())
}

function personName(site: SiteRecord | null, language: 'en' | 'ja') {
  const en = pick(site?.name_en ?? site?.name)
  const ja = pick(site?.name_ja ?? site?.name)
  if (language === 'ja') {
    return ja || en || DEFAULT_PERSON_NAME
  }
  return en || ja || DEFAULT_PERSON_NAME
}

function profileLinks(site: SiteRecord | null): ProfileLink[] {
  if (!site) return []
  const known: ProfileLink[] = [
    { label: 'GitHub', url: toSafeUrl(site.githubUrl ?? site.github_url ?? site.github) || '' },
    { label: 'LinkedIn', url: toSafeUrl(site.linkedinUrl ?? site.linkedin_url ?? site.linkedin) || '' },
    { label: 'X', url: toSafeUrl(site.xUrl ?? site.x_url ?? site.twitterUrl ?? site.twitter_url ?? site.twitter) || '' },
    { label: 'Website', url: toSafeUrl(site.website ?? site.websiteUrl ?? site.website_url) || '' },
    { label: 'Blog', url: toSafeUrl(site.blogUrl ?? site.blog_url ?? site.blog) || '' }
  ].filter(link => Boolean(link.url))

  const rawLinks = parseProfileLinks(site.sameAs ?? site.same_as ?? site.profileLinks ?? site.profile_links)
  return dedupeProfileLinks([...known, ...rawLinks])
}

function preferredResumeUrl(doc: ResumeRecord | null, language: 'en' | 'ja'): string | null {
  if (!doc) return null
  const primary = language === 'ja'
    ? pick(doc.url_ja ?? doc.url)
    : pick(doc.url_en ?? doc.url)
  const fallback = language === 'ja'
    ? pick(doc.url_en ?? doc.url)
    : pick(doc.url_ja ?? doc.url)
  return safeUrl(primary) ?? safeUrl(fallback)
}

function summaryParagraphs(doc: ResumeRecord | null, language: 'en' | 'ja'): string[] {
  if (!doc) return []
  const localized = language === 'ja'
    ? toParagraphs(doc.summary_ja ?? doc.summary)
    : toParagraphs(doc.summary_en ?? doc.summary)
  if (localized.length > 0) return localized
  return language === 'ja'
    ? toParagraphs(doc.summary_en ?? doc.summary)
    : toParagraphs(doc.summary_ja ?? doc.summary)
}

function normalizeSections(doc: ResumeRecord | null, language: 'en' | 'ja'): NormalizedSection[] {
  if (!doc || !Array.isArray(doc.sections)) {
    return []
  }

  return (doc.sections as ResumeSectionRecord[])
    .map((section, index) => {
      const titlePrimary = language === 'ja'
        ? pick(section.title_ja ?? section.title)
        : pick(section.title_en ?? section.title)
      const titleFallback = language === 'ja'
        ? pick(section.title_en ?? section.title)
        : pick(section.title_ja ?? section.title)
      const itemsPrimary = language === 'ja'
        ? toList(section.items_ja ?? section.items)
        : toList(section.items_en ?? section.items)
      const itemsFallback = language === 'ja'
        ? toList(section.items_en ?? section.items)
        : toList(section.items_ja ?? section.items)
      return {
        id: pick(section.id) || `section-${index}`,
        title: titlePrimary || titleFallback,
        items: itemsPrimary.length > 0 ? itemsPrimary : itemsFallback
      }
    })
    .filter(section => section.title || section.items.length > 0)
}

async function loadResumeDoc(): Promise<ResumeRecord | null> {
  const snapshot = await getFirestore().collection('public').doc('resume').get()
  if (!snapshot.exists) {
    return null
  }
  return snapshot.data() as ResumeRecord
}

async function loadSiteDoc(): Promise<SiteRecord | null> {
  const snapshot = await getFirestore().collection('public').doc('site').get()
  if (!snapshot.exists) {
    return null
  }
  return snapshot.data() as SiteRecord
}

function resumeHtml({
  baseUrl,
  language,
  pdfUrl,
  updatedAt,
  eta,
  summary,
  sections,
  displayName,
  sameAsLinks
}: {
  baseUrl: string
  language: 'en' | 'ja'
  pdfUrl: string | null
  updatedAt: string
  eta: string
  summary: string[]
  sections: NormalizedSection[]
  displayName: string
  sameAsLinks: ProfileLink[]
}) {
  const title = language === 'ja' ? '履歴書' : 'Resume'
  const subtitle = language === 'ja'
    ? '職務経歴・スキル・実績'
    : 'Experience, skills, and impact'
  const description = language === 'ja'
    ? `${displayName}の履歴書ページです。`
    : `${displayName}'s resume page.`
  const downloadLabel = language === 'ja' ? '履歴書PDFを開く' : 'Open resume PDF'
  const neutral = language === 'ja'
    ? '履歴書データは現在準備中です。'
    : 'Resume data is currently being prepared.'
  const updatedLabel = language === 'ja' ? '最終更新' : 'Updated'
  const etaLabel = language === 'ja' ? '公開予定日' : 'Target publish date'
  const leadText = language === 'ja'
    ? `${displayName}の職務経歴、スキル、実績をまとめたページです。`
    : `This page covers ${displayName}'s experience, skills, and measurable project impact.`
  const hasContent = summary.length > 0 || sections.length > 0
  const pdfLink = `/resume.pdf${language === 'ja' ? '?lang=ja' : ''}`
  const englishPath = '/resume?lang=en'
  const japanesePath = '/resume?lang=ja'

  const summaryHtml = summary
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')

  const sectionsHtml = sections
    .map(section => {
      const heading = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''
      const items = section.items.length
        ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''
      return `<section id="${escapeHtml(section.id)}">${heading}${items}</section>`
    })
    .join('')

  const metadataHtml = [
    updatedAt ? `<p class="meta">${escapeHtml(updatedLabel)}: ${escapeHtml(updatedAt)}</p>` : '',
    eta ? `<p class="meta">${escapeHtml(etaLabel)}: ${escapeHtml(eta)}</p>` : ''
  ].join('')

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: `${title} | ${displayName}`,
    url: `${baseUrl}/resume`,
    isPartOf: baseUrl,
    inLanguage: language === 'ja' ? 'ja' : 'en',
    mainEntity: {
      '@type': 'Person',
      name: displayName,
      ...(sameAsLinks.length > 0 ? { sameAs: sameAsLinks.map(link => link.url) } : {})
    }
  })

  return `<!doctype html>
<html lang="${language === 'ja' ? 'ja' : 'en'}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)} | ${escapeHtml(displayName)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${escapeHtml(`${title} | ${displayName}`)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(`${baseUrl}/resume`)}" />
    <link rel="canonical" href="${escapeHtml(`${baseUrl}/resume`)}" />
    <link rel="alternate" hreflang="en" href="${escapeHtml(`${baseUrl}${englishPath}`)}" />
    <link rel="alternate" hreflang="ja" href="${escapeHtml(`${baseUrl}${japanesePath}`)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeHtml(`${baseUrl}/resume`)}" />
    <link rel="alternate" type="application/pdf" href="${escapeHtml(`${baseUrl}/resume.pdf`)}" />
    <style>
      :root { color-scheme: light; }
      body { margin: 0; font-family: "Inter", "Segoe UI", sans-serif; color: #0f172a; background: #f8fafc; line-height: 1.6; }
      .wrap { max-width: 760px; margin: 0 auto; padding: 2rem 1rem 3rem; }
      h1 { margin: 0; font-size: 2rem; letter-spacing: -0.02em; }
      .subtitle { margin: 0.25rem 0 1rem; color: #475569; }
      .meta { margin: 0.15rem 0; color: #334155; font-size: 0.92rem; }
      .links { display: flex; flex-wrap: wrap; gap: 0.75rem; margin: 1.25rem 0 1.5rem; }
      .links a { display: inline-flex; align-items: center; border-radius: 999px; border: 1px solid #cbd5e1; padding: 0.4rem 0.85rem; color: #0f172a; text-decoration: none; font-size: 0.92rem; }
      .links a:hover { border-color: #64748b; }
      section { margin-top: 1.6rem; }
      h2 { font-size: 1.15rem; margin: 0 0 0.55rem; }
      ul { margin: 0; padding-left: 1.2rem; }
      li + li { margin-top: 0.35rem; }
      p { margin: 0.8rem 0; }
      .empty { margin-top: 1.2rem; padding: 0.9rem 1rem; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #ffffff; }
      .topline { display: flex; justify-content: space-between; gap: 0.75rem; align-items: baseline; flex-wrap: wrap; }
      .topline a { color: #334155; text-decoration: underline; }
    </style>
    <script type="application/ld+json">${structuredData}</script>
  </head>
  <body>
    <main class="wrap">
      <div class="topline">
        <h1>${escapeHtml(title)}</h1>
        <a href="${escapeHtml(baseUrl)}">${escapeHtml(language === 'ja' ? 'サイトへ戻る' : 'Back to site')}</a>
      </div>
      <p class="subtitle">${escapeHtml(subtitle)}</p>
      <p>${escapeHtml(leadText)}</p>
      ${metadataHtml}
      <nav class="links" aria-label="${escapeHtml(language === 'ja' ? '表示言語' : 'Display language')}">
        <a href="${escapeHtml(englishPath)}" hreflang="en">English</a>
        <a href="${escapeHtml(japanesePath)}" hreflang="ja">日本語</a>
        ${pdfUrl ? `<a href="${escapeHtml(pdfLink)}">${escapeHtml(downloadLabel)}</a>` : ''}
      </nav>
      ${sameAsLinks.length > 0 ? `<nav class="links" aria-label="${escapeHtml(language === 'ja' ? '関連プロフィール' : 'Related profiles')}">${sameAsLinks.map(link => `<a href="${escapeHtml(link.url)}" rel="noopener">${escapeHtml(link.label)}</a>`).join('')}</nav>` : ''}
      ${hasContent ? `${summaryHtml}${sectionsHtml}` : `<p class="empty">${escapeHtml(neutral)}</p>`}
    </main>
  </body>
</html>`
}

export async function resumeHtmlHandler(req: Request, res: Response) {
  const language = normalizeLanguage(req)
  try {
    const [doc, site] = await Promise.all([loadResumeDoc(), loadSiteDoc()])
    const baseUrl = getBaseUrl(req)
    const pdfUrl = preferredResumeUrl(doc, language)
    const summary = summaryParagraphs(doc, language)
    const sections = normalizeSections(doc, language)
    const updatedAt = pick(doc?.updatedAt ?? doc?.updated_at)
    const eta = pick(doc?.ja_eta ?? doc?.eta_ja ?? doc?.jaTargetDate)
    const displayName = personName(site, language)
    const sameAsLinks = profileLinks(site)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.setHeader('Vary', 'Accept-Language')
    res.status(200).send(
      resumeHtml({
        baseUrl,
        language,
        pdfUrl,
        updatedAt,
        eta,
        summary,
        sections,
        displayName,
        sameAsLinks
      })
    )
  } catch (error) {
    console.error('resumeHtmlHandler error:', error)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(500).send('Unable to load resume page right now.')
  }
}

export async function resumePdfHandler(req: Request, res: Response) {
  const language = normalizeLanguage(req)
  try {
    const doc = await loadResumeDoc()
    const url = preferredResumeUrl(doc, language)
    if (!url) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.status(404).send('Resume PDF is not configured.')
      return
    }
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.redirect(302, url)
  } catch (error) {
    console.error('resumePdfHandler error:', error)
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.status(500).send('Unable to load resume PDF right now.')
  }
}
