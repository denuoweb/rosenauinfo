import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, memo, use } from 'react'
import { getPublicDoc } from '../lib/content'
import { useLanguage } from '../lib/language'
import type { AppShellContext } from '../components/Layout'

type HomeLoaderData = {
  home: Promise<HomeCopy>
}

type HomeCopy = {
  blurb: { en: string; ja: string }
  links: {
    en: { label: string; url: string }[]
    ja: { label: string; url: string }[]
  }
}

export function loader() {
  return {
    home: loadHomeCopy()
  }
}

export function HydrateFallback() {
  return <HomeSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as HomeLoaderData
  const { site } = useOutletContext<AppShellContext>()

  return (
    <Suspense fallback={<HomeSkeleton />}>
      <HomeContent promise={data.home} language={language} site={site} />
    </Suspense>
  )
}

export default Component

const HomeSection = memo(function HomeSection({
  copy,
  language,
  site
}: {
  copy: HomeCopy
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const greeting = computeGreeting(language, site)
  const blurb = language === 'ja'
    ? copy.blurb.ja || copy.blurb.en
    : copy.blurb.en || copy.blurb.ja
  const links = language === 'ja'
    ? (copy.links.ja.length ? copy.links.ja : copy.links.en)
    : (copy.links.en.length ? copy.links.en : copy.links.ja)

  const neutralStub = language === 'ja'
    ? '詳しい紹介は近日公開予定です。'
    : 'A richer introduction is coming soon.'

  return (
    <section className="home-hero">
      {greeting && <h1>{greeting}</h1>}
      {blurb ? <p>{blurb}</p> : <p className="muted">{neutralStub}</p>}
      {links.length > 0 && (
        <nav className="home-links" aria-label={language === 'ja' ? '主要リンク' : 'Primary links'}>
          {links.map(link => (
            <a key={`${link.label}-${link.url}`} href={link.url} target="_blank" rel="noopener">
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </section>
  )
})

function computeGreeting(language: 'en' | 'ja', site: AppShellContext['site']) {
  if (language === 'ja') {
    if (site.name.ja) return `こんにちは、${site.name.ja}です。`
    if (site.name.en) return `こんにちは、${site.name.en}です。`
    return ''
  }
  if (site.name.en) return `Hi, I'm ${site.name.en}.`
  if (site.name.ja) return `Hi, I'm ${site.name.ja}.`
  return ''
}

function HomeContent({
  promise,
  language,
  site
}: {
  promise: Promise<HomeCopy>
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const resolved = use(promise)
  return <HomeSection copy={resolved} language={language} site={site} />
}

async function loadHomeCopy(): Promise<HomeCopy> {
  const home = await getPublicDoc('home')
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''

  const blurbEn = pick(home?.blurb_en ?? home?.blurb)
  const blurbJa = pick(home?.blurb_ja ?? home?.blurb)

  const linkSourceEn = pick(home?.links_en)
  const linkSourceJa = pick(home?.links_ja)

  const parseLinks = (raw: string) =>
    raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(entry => {
        const [label, url] = entry.split('|').map(part => part.trim())
        return {
          label: label || url,
          url: url || ''
        }
      })
      .filter(link => link.label && link.url)

  return {
    blurb: { en: blurbEn, ja: blurbJa },
    links: {
      en: linkSourceEn ? parseLinks(linkSourceEn) : [],
      ja: linkSourceJa ? parseLinks(linkSourceJa) : []
    }
  }
}

function HomeSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
      <div className="skeleton-chip-row">
        {[0, 1, 2].map(key => (
          <span key={key} className="skeleton-block skeleton-pill" style={{ width: `${120 + key * 10}px` }} />
        ))}
      </div>
    </section>
  )
}
