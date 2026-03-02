import { useEffect } from 'react'

const DEFAULT_SITE_URL = 'https://rosenau.info'

function isPlaceholderHostname(hostname: string) {
  const normalized = hostname.toLowerCase()
  return normalized === 'your-domain' ||
    normalized.includes('your-domain') ||
    normalized === 'yourdomain' ||
    /(^|\.)example\.(com|org|net)$/i.test(normalized)
}

const configuredSiteUrl = (() => {
  const raw = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim()
  if (!raw) return DEFAULT_SITE_URL

  try {
    const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (
      (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
      isPlaceholderHostname(parsed.hostname)
    ) {
      return DEFAULT_SITE_URL
    }
    return parsed.origin
  } catch {
    return DEFAULT_SITE_URL
  }
})()

export type SeoOptions = {
  title: string
  description: string
  path?: string
  robots?: string
  structuredData?: Record<string, unknown> | Record<string, unknown>[]
  ogType?: string
}

function normalizePath(path: string) {
  if (!path) return '/'
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path)
      return `${url.pathname}${url.search}${url.hash}` || '/'
    } catch {
      return '/'
    }
  }
  return path.startsWith('/') ? path : `/${path}`
}

export function absoluteSiteUrl(path: string) {
  return `${configuredSiteUrl}${normalizePath(path)}`
}

function upsertMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  const selector = `meta[${attr}="${name}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.content = content
}

function upsertCanonical(href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }
  tag.href = href
}

function upsertJsonLd(data?: Record<string, unknown> | Record<string, unknown>[]) {
  const id = 'seo-jsonld'
  const current = document.getElementById(id)
  if (!data) {
    if (current) current.remove()
    return
  }

  const script = current ?? document.createElement('script')
  script.id = id
  script.setAttribute('type', 'application/ld+json')
  script.textContent = JSON.stringify(data)
  if (!current) {
    document.head.appendChild(script)
  }
}

export function useSeo({
  title,
  description,
  path = '/',
  robots = 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
  structuredData,
  ogType = 'website'
}: SeoOptions) {
  useEffect(() => {
    document.title = title
    const canonical = absoluteSiteUrl(path)
    upsertMeta('description', description)
    upsertMeta('robots', robots)
    upsertMeta('og:type', ogType, 'property')
    upsertMeta('og:title', title, 'property')
    upsertMeta('og:description', description, 'property')
    upsertMeta('og:url', canonical, 'property')
    upsertCanonical(canonical)
    upsertJsonLd(structuredData)
  }, [description, ogType, path, robots, structuredData, title])
}
