import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc } from '../lib/content'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import {
  dedupeProfileLinks,
  getLocalizedSiteName,
  parseProfileLinks,
  type ProfileLink
} from '../lib/site'
import type { AppShellContext } from '../components/Layout'

type ContactLoaderData = {
  contact: Promise<ContactCopy>
}

type ContactCopy = {
  intro: { en: string; ja: string }
  availability: { en: string; ja: string }
  links: {
    en: ProfileLink[]
    ja: ProfileLink[]
  }
}

export function loader() {
  return {
    contact: loadContactCopy()
  }
}

export function HydrateFallback() {
  return <ContactSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as ContactLoaderData
  const { site } = useOutletContext<AppShellContext>()

  return (
    <Suspense fallback={<ContactSkeleton />}>
      <ContactContent contactPromise={data.contact} language={language} site={site} />
    </Suspense>
  )
}

export default Component

function ContactContent({
  contactPromise,
  language,
  site
}: {
  contactPromise: Promise<ContactCopy>
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const contact = use(contactPromise)
  const displayName = getLocalizedSiteName(site, language)
  const heading = language === 'ja' ? `${displayName}への連絡` : `Contact ${displayName}`
  const introRaw = language === 'ja'
    ? (contact.intro.ja || contact.intro.en)
    : (contact.intro.en || contact.intro.ja)
  const intro = normalizeContactIntro(introRaw, displayName, language)
  const availability = language === 'ja'
    ? (contact.availability.ja || contact.availability.en)
    : (contact.availability.en || contact.availability.ja)
  const localizedLinks = language === 'ja'
    ? (contact.links.ja.length ? contact.links.ja : contact.links.en)
    : (contact.links.en.length ? contact.links.en : contact.links.ja)
  const links = dedupeProfileLinks([...site.profileLinks, ...localizedLinks])
  const emailLabel = language === 'ja' ? 'メールで連絡' : 'Email'

  useSeo({
    title: `${displayName} | ${language === 'ja' ? '連絡先' : 'Contact'}`,
    description: language === 'ja'
      ? `${displayName}への連絡方法とプロフィールリンク。`
      : `Contact details and profile links for ${displayName}.`,
    path: '/contact',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      url: absoluteSiteUrl('/contact'),
      name: heading,
      ...(site.contactEmail
        ? {
            mainEntity: {
              '@type': 'Person',
              name: displayName,
              email: site.contactEmail,
              ...(links.length > 0 ? { sameAs: links.map(link => link.url) } : {})
            }
          }
        : {})
    }
  })

  return (
    <section className="stack">
      <section className="card">
        <h1>{heading}</h1>
        <p>{intro}</p>
        {availability && <p className="muted">{availability}</p>}

        {(site.contactEmail || links.length > 0) && (
          <div className="contact-action-row">
            {site.contactEmail && (
              <div className="resume-download">
                <a href={`mailto:${site.contactEmail}`}>
                  {emailLabel}: {site.contactEmail}
                </a>
              </div>
            )}
            {links.length > 0 && (
              <div className="home-links contact-links" aria-label={language === 'ja' ? 'プロフィールリンク' : 'Profile links'}>
                {links.map(link => (
                  <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </section>
  )
}

async function loadContactCopy(): Promise<ContactCopy> {
  const doc = await getPublicDoc('contact')
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  return {
    intro: {
      en: pick(doc?.intro_en ?? doc?.intro),
      ja: pick(doc?.intro_ja ?? doc?.intro)
    },
    availability: {
      en: pick(doc?.availability_en ?? doc?.availability),
      ja: pick(doc?.availability_ja ?? doc?.availability)
    },
    links: {
      en: parseProfileLinks(doc?.links_en ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as),
      ja: parseProfileLinks(doc?.links_ja ?? doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as)
    }
  }
}

function normalizeContactIntro(value: string, displayName: string, language: 'en' | 'ja') {
  const trimmed = value.trim()
  const fallback = language === 'ja'
    ? `${displayName} は、実装エンジニア、開発者サポートエンジニア、技術サポート、連携エンジニア、ソリューション寄りの技術職、技術運用職に関心があります。`
    : `${displayName} is open to Implementation Engineer, Developer Support Engineer, Technical Support Engineer, Integration Engineer, Solutions Engineer, Support Engineer, and technical operations roles.`

  if (!trimmed) return fallback
  return trimmed
}

function ContactSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-pill" style={{ width: '220px' }} />
      <span className="skeleton-block skeleton-paragraph" />
    </section>
  )
}
