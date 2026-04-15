import type { SupportedLanguage } from './language'

export type ProfileLink = {
  label: string
  url: string
}

export type SiteCopy = {
  name: { en: string; ja: string }
  footerNote?: string
  contactEmail?: string
  profileLinks: ProfileLink[]
  resume: {
    enUrl?: string
    jaUrl?: string
    jaStatus?: string
  }
}

function pickString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getLocalizedSiteName(
  site: Pick<SiteCopy, 'name'>,
  language: SupportedLanguage
) {
  return language === 'ja'
    ? site.name.ja || site.name.en
    : site.name.en || site.name.ja
}

export function isInternalHref(value: string) {
  return value.startsWith('/')
}

export function normalizeExternalUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || isInternalHref(trimmed)) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

export function dedupeProfileLinks(links: ProfileLink[]) {
  const deduped = new Map<string, ProfileLink>()

  links.forEach(link => {
    if (link.url && !deduped.has(link.url)) {
      deduped.set(link.url, link)
    }
  })

  return Array.from(deduped.values())
}

export function parseProfileLinks(raw: unknown, fallbackLabel = 'Profile') {
  const values = Array.isArray(raw)
    ? raw.map(item => pickString(item))
    : pickString(raw)
        .split('\n')
        .map(line => line.trim())

  return values
    .filter(Boolean)
    .map((entry, index) => normalizeProfileLinkEntry(entry, `${fallbackLabel} ${index + 1}`))
    .filter((entry): entry is ProfileLink => Boolean(entry))
}

export function normalizeSite(raw: Record<string, unknown> | null): SiteCopy {
  const rawEn = pickString(raw?.name_en ?? raw?.name)
  const rawJa = pickString(raw?.name_ja ?? raw?.name)
  const nameEn = rawEn || rawJa || 'Portfolio'
  const nameJa = rawJa || rawEn || 'ポートフォリオ'
  const footerNote = pickString(raw?.footerNote ?? raw?.footer_note)
  const resumeEnUrl = pickString(raw?.resume_url_en ?? raw?.resume_url)
  const resumeJaUrl = pickString(raw?.resume_url_ja)
  const resumeJaStatus = pickString(raw?.resume_ja_status)
  const contactEmail = pickString(raw?.contactEmail ?? raw?.contact_email ?? raw?.email)

  return {
    name: { en: nameEn, ja: nameJa },
    footerNote,
    contactEmail: contactEmail || undefined,
    profileLinks: normalizeSiteProfileLinks(raw),
    resume: {
      enUrl: resumeEnUrl || undefined,
      jaUrl: resumeJaUrl || undefined,
      jaStatus: resumeJaStatus || undefined
    }
  }
}

function normalizeProfileLinkEntry(entry: string, fallbackLabel: string): ProfileLink | null {
  if (!entry) return null

  const [rawLabel, rawUrl] = entry.includes('|')
    ? entry.split('|', 2).map(part => part.trim())
    : [fallbackLabel, entry.trim()]
  const url = normalizeExternalUrl(rawUrl)

  if (!url) return null

  return {
    label: rawLabel || fallbackLabel,
    url
  }
}

function normalizeSiteProfileLinks(raw: Record<string, unknown> | null) {
  if (!raw) return []

  const knownFields: Array<{ label: string; value: unknown }> = [
    { label: 'GitHub', value: raw.githubUrl ?? raw.github_url ?? raw.github },
    { label: 'LinkedIn', value: raw.linkedinUrl ?? raw.linkedin_url ?? raw.linkedin },
    { label: 'X', value: raw.xUrl ?? raw.x_url ?? raw.twitterUrl ?? raw.twitter_url ?? raw.twitter },
    { label: 'YouTube', value: raw.youtubeUrl ?? raw.youtube_url ?? raw.youtube },
    { label: 'Blog', value: raw.blogUrl ?? raw.blog_url ?? raw.blog },
    { label: 'Portfolio', value: raw.website ?? raw.websiteUrl ?? raw.website_url }
  ]

  const fromKnown = knownFields
    .map(entry => {
      const url = normalizeExternalUrl(pickString(entry.value))
      if (!url) return null
      return { label: entry.label, url }
    })
    .filter((entry): entry is ProfileLink => Boolean(entry))

  const rawSameAs = raw.sameAs ?? raw.same_as ?? raw.profileLinks ?? raw.profile_links
  const sameAsValues = Array.isArray(rawSameAs)
    ? rawSameAs.map(item => pickString(item))
    : pickString(rawSameAs)
        .split(/\n|,/)
        .map(part => part.trim())

  const fromSameAs = sameAsValues
    .map((entry, index) => {
      const url = normalizeExternalUrl(entry)
      if (!url) return null
      return { label: `Profile ${index + 1}`, url }
    })
    .filter((entry): entry is ProfileLink => Boolean(entry))

  return dedupeProfileLinks([...fromKnown, ...fromSameAs])
}
