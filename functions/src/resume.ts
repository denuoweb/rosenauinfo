import type { Request, Response } from 'express'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { resolveSiteUrl } from './siteUrl.js'

if (!getApps().length) {
  initializeApp()
}

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
  footerNote?: unknown
  footer_note?: unknown
  contactEmail?: unknown
  contact_email?: unknown
  email?: unknown
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

function normalizeLanguage(req: Request): 'en' | 'ja' {
  const queryLang = Array.isArray(req.query.lang) ? req.query.lang[0] : req.query.lang
  const raw = pick(queryLang).toLowerCase()
  if (raw.startsWith('ja')) return 'ja'
  if (raw.startsWith('en')) return 'en'
  return 'en'
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

function footerCopy(site: SiteRecord | null, language: 'en' | 'ja') {
  const custom = pick(site?.footerNote ?? site?.footer_note)
  if (custom) return custom
  const year = new Date().getFullYear()
  return `© ${year} ${personName(site, language)}`
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
  sameAsLinks,
  footerText
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
  footerText: string
}) {
  const nav = language === 'ja'
    ? {
        home: 'ホーム',
        about: '紹介',
        resume: '履歴書',
        projects: 'プロジェクト',
        contact: '連絡先',
        back: 'サイトへ戻る',
        displayLanguage: '表示言語',
        relatedProfiles: '関連プロフィール',
        summary: '概要'
      }
    : {
        home: 'Home',
        about: 'About',
        resume: 'Resume',
        projects: 'Projects',
        contact: 'Contact',
        back: 'Back to site',
        displayLanguage: 'Display language',
        relatedProfiles: 'Related profiles',
        summary: 'Summary'
      }
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
  const navigationHtml = [
    { href: '/', label: nav.home },
    { href: '/about', label: nav.about },
    { href: '/resume', label: nav.resume },
    { href: '/projects', label: nav.projects },
    { href: '/contact', label: nav.contact }
  ]
    .map(item => `<a href="${escapeHtml(item.href)}"${item.href === '/resume' ? ' aria-current="page"' : ''}>${escapeHtml(item.label)}</a>`)
    .join('')

  const summaryHtml = summary
    .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
    .join('')

  const sectionsHtml = sections
    .map(section => {
      const heading = section.title ? `<h2>${escapeHtml(section.title)}</h2>` : ''
      const items = section.items.length
        ? `<ul>${section.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : ''
      return `<section class="content-card" id="${escapeHtml(section.id)}">${heading}${items}</section>`
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
      :root {
        color-scheme: light;
        --text: #111827;
        --muted: #6b7280;
        --accent: #0ea5e9;
        --highlight: #22d3ee;
        --glass-bg: rgba(255, 255, 255, 0.72);
        --glass-border: rgba(17, 24, 39, 0.12);
        --glass-shadow: 0 12px 30px rgba(2, 6, 23, 0.08);
        --card-bg: rgba(255, 255, 255, 0.76);
        --card-border: rgba(17, 24, 39, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-width: 320px;
        color: var(--text);
        background:
          radial-gradient(1200px 800px at 10% -10%, rgba(14, 165, 233, 0.12) 0%, transparent 60%),
          #f8fafc;
        font-family: "Inter", "Segoe UI", sans-serif;
        line-height: 1.65;
      }
      a { color: inherit; }
      .page {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .topnav {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--glass-bg);
        border-bottom: 1px solid var(--glass-border);
        box-shadow: var(--glass-shadow);
        backdrop-filter: blur(12px) saturate(140%);
      }
      .navcontent,
      .footer-line {
        width: min(100%, 1100px);
        margin: 0 auto;
        padding: 0 1.25rem;
      }
      .navcontent {
        min-height: 72px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 0.9rem;
        padding-bottom: 0.9rem;
        flex-wrap: wrap;
      }
      .brand {
        font-size: 1.35rem;
        font-weight: 700;
        text-decoration: none;
      }
      .navmenu {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }
      .navmenu a {
        text-decoration: none;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        transition: background 0.2s ease, color 0.2s ease;
      }
      .navmenu a:hover,
      .navmenu a:focus-visible {
        background: rgba(14, 165, 233, 0.12);
        color: var(--accent);
      }
      .navmenu a[aria-current="page"] {
        background: rgba(14, 165, 233, 0.16);
        color: var(--accent);
      }
      .main {
        width: min(100%, 980px);
        margin: 0 auto;
        padding: 2rem 1.25rem 3rem;
      }
      .hero {
        padding: clamp(1.5rem, 1.2rem + 1.6vw, 2.4rem);
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(236, 72, 153, 0.14));
        border: 1px solid rgba(14, 165, 233, 0.2);
        box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
      }
      .topline {
        display: flex;
        justify-content: space-between;
        gap: 0.75rem;
        align-items: baseline;
        flex-wrap: wrap;
      }
      h1 {
        margin: 0;
        font-size: clamp(1.8rem, 1.5rem + 0.9vw, 2.4rem);
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0.25rem 0 1rem;
        color: #475569;
        font-size: 1rem;
      }
      .meta-block {
        display: grid;
        gap: 0.15rem;
        margin-top: 1rem;
      }
      .meta {
        margin: 0;
        color: #334155;
        font-size: 0.92rem;
      }
      .links {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin: 1.25rem 0 0;
      }
      .links a {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
        padding: 0.48rem 0.9rem;
        color: #0f172a;
        background: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        font-size: 0.92rem;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      }
      .links a:hover,
      .links a:focus-visible {
        background: rgba(14, 165, 233, 0.14);
        border-color: rgba(14, 165, 233, 0.28);
        color: var(--accent);
      }
      .content {
        display: grid;
        gap: 1rem;
        margin-top: 1.5rem;
      }
      .content-card,
      .empty {
        border: 1px solid var(--card-border);
        border-radius: 14px;
        background: var(--card-bg);
        box-shadow: var(--glass-shadow);
        padding: 1rem 1.15rem;
      }
      .content-card p:first-child,
      .empty p:first-child { margin-top: 0; }
      section { margin: 0; }
      h2 {
        font-size: 1.15rem;
        margin: 0 0 0.55rem;
      }
      ul {
        margin: 0;
        padding-left: 1.2rem;
      }
      li + li { margin-top: 0.35rem; }
      p { margin: 0.8rem 0; }
      .footer {
        width: 100%;
        margin-top: auto;
        padding: 1rem 0 1.4rem;
        border-top: 1px solid var(--glass-border);
        background: var(--glass-bg);
        backdrop-filter: blur(12px) saturate(140%);
      }
      .footer-line {
        text-align: center;
      }
      .footer-line small {
        color: var(--muted);
      }
      @media (max-width: 720px) {
        .navcontent {
          justify-content: center;
          text-align: center;
        }
        .navmenu {
          justify-content: center;
        }
      }
    </style>
    <script type="application/ld+json">${structuredData}</script>
  </head>
  <body>
    <div class="page">
      <header class="topnav">
        <div class="navcontent">
          <a href="${escapeHtml(baseUrl)}" class="brand">${escapeHtml(displayName)}</a>
          <nav class="navmenu" aria-label="${escapeHtml(language === 'ja' ? '主要ナビゲーション' : 'Primary navigation')}">
            ${navigationHtml}
          </nav>
        </div>
      </header>
      <main class="main">
        <section class="hero">
          <div class="topline">
            <h1>${escapeHtml(title)}</h1>
            <a href="${escapeHtml(baseUrl)}">${escapeHtml(nav.back)}</a>
          </div>
          <p class="subtitle">${escapeHtml(subtitle)}</p>
          <p>${escapeHtml(leadText)}</p>
          ${metadataHtml ? `<div class="meta-block">${metadataHtml}</div>` : ''}
          <nav class="links" aria-label="${escapeHtml(nav.displayLanguage)}">
            <a href="${escapeHtml(englishPath)}" hreflang="en">English</a>
            <a href="${escapeHtml(japanesePath)}" hreflang="ja">日本語</a>
            ${pdfUrl ? `<a href="${escapeHtml(pdfLink)}">${escapeHtml(downloadLabel)}</a>` : ''}
          </nav>
          ${sameAsLinks.length > 0 ? `<nav class="links" aria-label="${escapeHtml(nav.relatedProfiles)}">${sameAsLinks.map(link => `<a href="${escapeHtml(link.url)}" rel="noopener">${escapeHtml(link.label)}</a>`).join('')}</nav>` : ''}
        </section>
        <section class="content" aria-label="${escapeHtml(nav.summary)}">
          ${hasContent ? `${summary.map(paragraph => `<article class="content-card"><p>${escapeHtml(paragraph)}</p></article>`).join('')}${sectionsHtml}` : `<div class="empty"><p>${escapeHtml(neutral)}</p></div>`}
        </section>
      </main>
      <footer class="footer">
        <div class="footer-line">
          <small>${escapeHtml(footerText)}</small>
        </div>
      </footer>
    </div>
  </body>
</html>`
}

export async function resumeHtmlHandler(req: Request, res: Response) {
  const language = normalizeLanguage(req)
  try {
    const [doc, site] = await Promise.all([loadResumeDoc(), loadSiteDoc()])
    const baseUrl = resolveSiteUrl(req)
    const pdfUrl = preferredResumeUrl(doc, language)
    const summary = summaryParagraphs(doc, language)
    const sections = normalizeSections(doc, language)
    const updatedAt = pick(doc?.updatedAt ?? doc?.updated_at)
    const eta = pick(doc?.ja_eta ?? doc?.eta_ja ?? doc?.jaTargetDate)
    const displayName = personName(site, language)
    const sameAsLinks = profileLinks(site)
    const footerText = footerCopy(site, language)

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
        sameAsLinks,
        footerText
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
