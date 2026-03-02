import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc } from '../lib/content'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import type { AppShellContext, ProfileLink } from '../components/Layout'

type ContactLoaderData = {
  contact: Promise<ContactCopy>
}

type ContactCopy = {
  intro: { en: string; ja: string }
  availability: { en: string; ja: string }
  links: ProfileLink[]
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
  const displayName = language === 'ja' ? (site.name.ja || site.name.en) : (site.name.en || site.name.ja)
  const heading = language === 'ja' ? `${displayName}への連絡` : `Contact ${displayName}`
  const introRaw = language === 'ja'
    ? (contact.intro.ja || contact.intro.en)
    : (contact.intro.en || contact.intro.ja)
  const intro = introRaw || (
    language === 'ja'
      ? `${displayName}へのお問い合わせはこちらからお願いします。`
      : `Reach out to ${displayName} for engineering opportunities, project collaboration, or consulting work.`
  )
  const availability = language === 'ja'
    ? (contact.availability.ja || contact.availability.en)
    : (contact.availability.en || contact.availability.ja)
  const links = dedupeLinks([...site.profileLinks, ...contact.links])
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

        {site.contactEmail && (
          <div className="resume-download">
            <a href={`mailto:${site.contactEmail}`}>
              {emailLabel}: {site.contactEmail}
            </a>
          </div>
        )}
      </section>

      {links.length > 0 && (
        <section className="card">
          <h2>{language === 'ja' ? 'プロフィールリンク' : 'Profile links'}</h2>
          <div className="home-links" aria-label={language === 'ja' ? 'プロフィールリンク' : 'Profile links'}>
            {links.map(link => (
              <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener">
                {link.label}
              </a>
            ))}
          </div>
        </section>
      )}
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
    links: parseLinks(doc?.links ?? doc?.profile_links ?? doc?.sameAs ?? doc?.same_as)
  }
}

function parseLinks(raw: unknown): ProfileLink[] {
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const toEntry = (entry: string, index: number): ProfileLink | null => {
    if (!entry) return null
    const [rawLabel, rawUrl] = entry.includes('|')
      ? entry.split('|', 2).map(part => part.trim())
      : [`Profile ${index + 1}`, entry]
    const withProtocol = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    try {
      const parsed = new URL(withProtocol)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return null
      }
      return {
        label: rawLabel || `Profile ${index + 1}`,
        url: parsed.toString()
      }
    } catch {
      return null
    }
  }

  if (Array.isArray(raw)) {
    return raw
      .map(item => pick(item))
      .map((entry, index) => toEntry(entry, index))
      .filter((entry): entry is ProfileLink => Boolean(entry))
  }

  return pick(raw)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((entry, index) => toEntry(entry, index))
    .filter((entry): entry is ProfileLink => Boolean(entry))
}

function dedupeLinks(links: ProfileLink[]): ProfileLink[] {
  const map = new Map<string, ProfileLink>()
  links.forEach(link => {
    if (!map.has(link.url)) {
      map.set(link.url, link)
    }
  })
  return Array.from(map.values())
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
