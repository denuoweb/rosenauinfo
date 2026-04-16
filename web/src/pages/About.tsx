import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc, type LocalizedText } from '../lib/content'
import {
  ABOUT_DEFAULTS,
  localizedValue,
  resolveSharedProfileCopy,
  sanitizeProfileText
} from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import { dedupeProfileLinks, getLocalizedSiteName, parseProfileLinks, type ProfileLink } from '../lib/site'
import type { AppShellContext } from '../components/Layout'

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
  const displayName = getLocalizedSiteName(site, language)
  const headline = localizedValue(about.headline, language)
  const intro = localizedValue(about.intro, language)
  const localizedLinks = language === 'ja'
    ? (about.links.ja.length ? about.links.ja : about.links.en)
    : (about.links.en.length ? about.links.en : about.links.ja)
  const links = dedupeProfileLinks([...site.profileLinks, ...localizedLinks])
  const showProfileLinks = links.length > 1

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

      {showProfileLinks && (
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
  const introFallbackEn = `${sharedProfile.supporting.en} ${sharedProfile.secondarySpecialization.en}`.trim()
  const introFallbackJa = `${sharedProfile.supporting.ja} ${sharedProfile.secondarySpecialization.ja}`.trim()

  return {
    headline: {
      en: sanitizeProfileText(pick(doc?.headline_en) || pick(doc?.headline), sharedProfile.headline.en),
      ja: sanitizeProfileText(pick(doc?.headline_ja) || pick(doc?.headline), sharedProfile.headline.ja)
    },
    intro: {
      en: sanitizeProfileText(pick(doc?.intro_en) || pick(doc?.intro), introFallbackEn),
      ja: sanitizeProfileText(pick(doc?.intro_ja) || pick(doc?.intro), introFallbackJa)
    },
    sections: ABOUT_DEFAULTS.sections.map(section => ({
      id: section.id,
      title: section.title,
      items: {
        en: [...section.items.en],
        ja: [...section.items.ja]
      }
    })),
    links: {
      en: parseProfileLinks(doc?.links_en ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as),
      ja: parseProfileLinks(doc?.links_ja ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as)
    }
  }
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
