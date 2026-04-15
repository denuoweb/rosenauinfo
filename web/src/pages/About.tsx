import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc, type LocalizedText } from '../lib/content'
import {
  ABOUT_DEFAULTS,
  localizedValue,
  resolveSharedProfileCopy
} from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import type { AppShellContext, ProfileLink } from '../components/Layout'

type AboutSectionCopy = {
  id: string
  title: LocalizedText
  items: { en: string[]; ja: string[] }
}

type AboutCopy = {
  headline: LocalizedText
  intro: LocalizedText
  sections: AboutSectionCopy[]
  links: {
    en: ProfileLink[]
    ja: ProfileLink[]
  }
}

type AboutLoaderData = {
  about: Promise<AboutCopy>
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
      <AboutContent promise={data.about} language={language} site={site} />
    </Suspense>
  )
}

export default Component

function AboutContent({
  promise,
  language,
  site
}: {
  promise: Promise<AboutCopy>
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const about = use(promise)
  const displayName = language === 'ja' ? (site.name.ja || site.name.en) : (site.name.en || site.name.ja)
  const headline = localizedValue(about.headline, language)
  const intro = localizedValue(about.intro, language)
  const localizedLinks = language === 'ja'
    ? (about.links.ja.length ? about.links.ja : about.links.en)
    : (about.links.en.length ? about.links.en : about.links.ja)
  const links = dedupeLinks([...site.profileLinks, ...localizedLinks])

  useSeo({
    title: `${displayName} | ${language === 'ja' ? '紹介' : 'About'}`,
    description: `${headline} ${intro}`.trim(),
    path: '/about',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      url: absoluteSiteUrl('/about'),
      mainEntity: {
        '@type': 'Person',
        name: displayName,
        url: absoluteSiteUrl('/'),
        jobTitle: headline,
        description: intro,
        sameAs: links.map(link => link.url)
      }
    }
  })

  return (
    <article className="stack">
      <section className="card page-intro">
        <p className="eyebrow">{language === 'ja' ? '紹介' : 'About'}</p>
        <h1>{displayName}</h1>
        <p className="lead-text">{headline}</p>
        <p>{intro}</p>
      </section>

      <div className="section-grid">
        {about.sections.map(section => {
          const title = localizedValue(section.title, language)
          const items = language === 'ja'
            ? (section.items.ja.length ? section.items.ja : section.items.en)
            : (section.items.en.length ? section.items.en : section.items.ja)

          return (
            <section key={section.id} className="resume-section about-section-card">
              <h2>{title}</h2>
              <ul>
                {items.map((item, index) => (
                  <li key={`${section.id}-${index}`}>{item}</li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {links.length > 0 && (
        <section className="resume-section">
          <h2>{language === 'ja' ? 'プロフィール' : 'Profiles'}</h2>
          <div className="home-links">
            {links.map(link => (
              <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener noreferrer">
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
  const [doc, home] = await Promise.all([getPublicDoc('about'), getPublicDoc('home')])
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const sharedProfile = resolveSharedProfileCopy(home as Record<string, unknown> | null)
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

  const sectionFromDoc = (
    id: string,
    title: LocalizedText,
    itemsEn: string[],
    itemsJa: string[]
  ): AboutSectionCopy => ({
    id,
    title,
    items: {
      en: itemsEn,
      ja: itemsJa
    }
  })

  const defaults = ABOUT_DEFAULTS.sections

  return {
    headline: {
      en: pick(doc?.headline_en) || sharedProfile.headline.en,
      ja: pick(doc?.headline_ja) || sharedProfile.headline.ja
    },
    intro: {
      en: pick(doc?.intro_en) || `${sharedProfile.supporting.en} ${sharedProfile.secondarySpecialization.en}`.trim(),
      ja: pick(doc?.intro_ja) || `${sharedProfile.supporting.ja} ${sharedProfile.secondarySpecialization.ja}`.trim()
    },
    sections: [
      sectionFromDoc(
        defaults[0].id,
        {
          en: pick(doc?.what_i_do_title_en) || defaults[0].title.en,
          ja: pick(doc?.what_i_do_title_ja) || defaults[0].title.ja
        },
        parseLines(doc?.what_i_do_en),
        parseLines(doc?.what_i_do_ja)
      ),
      sectionFromDoc(
        defaults[1].id,
        {
          en: pick(doc?.what_ive_shipped_title_en) || defaults[1].title.en,
          ja: pick(doc?.what_ive_shipped_title_ja) || defaults[1].title.ja
        },
        parseLines(doc?.what_ive_shipped_en),
        parseLines(doc?.what_ive_shipped_ja)
      ),
      sectionFromDoc(
        defaults[2].id,
        {
          en: pick(doc?.what_i_work_well_on_title_en) || defaults[2].title.en,
          ja: pick(doc?.what_i_work_well_on_title_ja) || defaults[2].title.ja
        },
        parseLines(doc?.what_i_work_well_on_en),
        parseLines(doc?.what_i_work_well_on_ja)
      )
    ].map((section, index) => ({
      ...section,
      items: {
        en: section.items.en.length ? section.items.en : defaults[index].items.en,
        ja: section.items.ja.length ? section.items.ja : defaults[index].items.ja
      }
    })),
    links: {
      en: parseLinks(doc?.links_en ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as),
      ja: parseLinks(doc?.links_ja ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as)
    }
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
    if (link.url && !deduped.has(link.url)) {
      deduped.set(link.url, link)
    }
  })
  return Array.from(deduped.values())
}

function AboutSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-subheading" />
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
    </section>
  )
}
