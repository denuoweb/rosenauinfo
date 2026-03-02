import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc } from '../lib/content'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import type { AppShellContext, ProfileLink } from '../components/Layout'

type AboutLoaderData = {
  about: Promise<AboutCopy>
}

type AboutCopy = {
  headline: { en: string; ja: string }
  intro: { en: string; ja: string }
  highlights: { en: string[]; ja: string[] }
  links: ProfileLink[]
}

export function loader() {
  return {
    about: loadAboutCopy()
  }
}

export function HydrateFallback() {
  return <AboutSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as AboutLoaderData
  const { site } = useOutletContext<AppShellContext>()

  return (
    <Suspense fallback={<AboutSkeleton />}>
      <AboutContent aboutPromise={data.about} language={language} site={site} />
    </Suspense>
  )
}

export default Component

function AboutContent({
  aboutPromise,
  language,
  site
}: {
  aboutPromise: Promise<AboutCopy>
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const about = use(aboutPromise)
  const displayName = language === 'ja' ? (site.name.ja || site.name.en) : (site.name.en || site.name.ja)
  const defaultHeadline = language === 'ja' ? 'ソフトウェアエンジニア' : 'Software Engineer'
  const headline = language === 'ja'
    ? (about.headline.ja || about.headline.en || defaultHeadline)
    : (about.headline.en || about.headline.ja || defaultHeadline)
  const rawIntro = language === 'ja'
    ? (about.intro.ja || about.intro.en)
    : (about.intro.en || about.intro.ja)
  const intro = ensureNameMention(rawIntro, displayName, language)
  const highlights = language === 'ja'
    ? (about.highlights.ja.length ? about.highlights.ja : about.highlights.en)
    : (about.highlights.en.length ? about.highlights.en : about.highlights.ja)
  const links = dedupeLinks([...site.profileLinks, ...about.links])
  const canonicalPath = '/about'
  const seoDescription = language === 'ja'
    ? `${displayName}のプロフィールページ。${headline}。`
    : `${displayName} profile: ${headline}.`

  useSeo({
    title: `${displayName} | ${language === 'ja' ? '紹介' : 'About'}`,
    description: seoDescription,
    path: canonicalPath,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: absoluteSiteUrl(canonicalPath),
      mainEntity: {
        '@type': 'Person',
        name: displayName,
        url: absoluteSiteUrl('/'),
        jobTitle: headline,
        ...(links.length > 0 ? { sameAs: links.map(link => link.url) } : {}),
        ...(highlights.length > 0 ? { knowsAbout: highlights } : {})
      }
    }
  })

  return (
    <article className="stack">
      <section className="card">
        <h1>{displayName}</h1>
        <p className="muted">{headline}</p>
        <p>{intro}</p>
      </section>

      {highlights.length > 0 && (
        <section className="resume-section">
          <h2>{language === 'ja' ? '専門領域' : 'Focus Areas'}</h2>
          <ul>
            {highlights.map((item, idx) => (
              <li key={`${item}-${idx}`}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {links.length > 0 && (
        <section className="resume-section">
          <h2>{language === 'ja' ? 'プロフィールリンク' : 'Profiles'}</h2>
          <div className="home-links">
            {links.map(link => (
              <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

async function loadAboutCopy(): Promise<AboutCopy> {
  const doc = await getPublicDoc('about')
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const parseLines = (value: unknown) =>
    pick(value)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  const parseLinks = (value: unknown): ProfileLink[] => {
    if (Array.isArray(value)) {
      return value
        .map(item => pick(item))
        .map((entry, index) => normalizeLinkEntry(entry, `Profile ${index + 1}`))
        .filter((item): item is ProfileLink => Boolean(item))
    }
    return pick(value)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map((entry, index) => normalizeLinkEntry(entry, `Profile ${index + 1}`))
      .filter((item): item is ProfileLink => Boolean(item))
  }

  return {
    headline: {
      en: pick(doc?.headline_en ?? doc?.headline),
      ja: pick(doc?.headline_ja)
    },
    intro: {
      en: pick(doc?.intro_en ?? doc?.summary_en ?? doc?.intro ?? doc?.summary),
      ja: pick(doc?.intro_ja ?? doc?.summary_ja ?? doc?.intro ?? doc?.summary)
    },
    highlights: {
      en: parseLines(doc?.highlights_en ?? doc?.highlights),
      ja: parseLines(doc?.highlights_ja)
    },
    links: parseLinks(doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as)
  }
}

function normalizeLinkEntry(entry: string, fallbackLabel: string): ProfileLink | null {
  if (!entry) return null
  const [rawLabel, rawUrl] = entry.includes('|')
    ? entry.split('|', 2).map(part => part.trim())
    : [fallbackLabel, entry.trim()]
  const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
  try {
    const parsed = new URL(withProtocol)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return {
      label: rawLabel || fallbackLabel,
      url: parsed.toString()
    }
  } catch {
    return null
  }
}

function dedupeLinks(links: ProfileLink[]): ProfileLink[] {
  const deduped = new Map<string, ProfileLink>()
  links.forEach(link => {
    if (!deduped.has(link.url)) {
      deduped.set(link.url, link)
    }
  })
  return Array.from(deduped.values())
}

function ensureNameMention(raw: string, name: string, language: 'en' | 'ja') {
  const fallback = language === 'ja'
    ? `${name}は、地図・データ・プロダクト開発に注力するソフトウェアエンジニアです。`
    : `${name} is a software engineer focused on mapping, data-rich interfaces, and reliable product delivery.`
  const intro = raw || fallback
  if (!name) return intro
  const lower = intro.toLowerCase()
  if (lower.includes(name.toLowerCase())) {
    return intro
  }
  return language === 'ja' ? `${name}は${intro}` : `${name} is ${intro}`
}

function AboutSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-subheading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
    </section>
  )
}
