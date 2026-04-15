import { Link, useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc, listProjects, type LocalizedText, type ProjectRecord } from '../lib/content'
import {
  HOME_PROOF_POINTS,
  HOW_I_WORK_STEPS,
  INTEGRATION_AUTOMATION_ITEMS,
  localizedValue,
  projectNarrative,
  resolveSharedProfileCopy,
  selectFeaturedProjects
} from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import { getLocalizedSiteName, normalizeExternalUrl, type ProfileLink } from '../lib/site'
import type { AppShellContext } from '../components/Layout'

type HomeLink = {
  label: string
  url: string
}

type HomeCopy = {
  headline: LocalizedText
  supporting: LocalizedText
  secondarySpecialization: LocalizedText
  links: {
    en: HomeLink[]
    ja: HomeLink[]
  }
  featuredProjectIds: string[]
  projects: ProjectRecord[]
}

type HomeLoaderData = {
  home: Promise<HomeCopy>
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

function HomeContent({
  promise,
  language,
  site
}: {
  promise: Promise<HomeCopy>
  language: 'en' | 'ja'
  site: AppShellContext['site']
}) {
  const copy = use(promise)
  const displayName = getLocalizedSiteName(site, language)
  const headline = localizedValue(copy.headline, language)
  const supporting = localizedValue(copy.supporting, language)
  const specialty = localizedValue(copy.secondarySpecialization, language)
  const proofPoints = language === 'ja' ? HOME_PROOF_POINTS.ja : HOME_PROOF_POINTS.en
  const workflowSteps = HOW_I_WORK_STEPS.map(step => ({
    title: localizedValue(step.title, language),
    body: localizedValue(step.body, language)
  }))
  const integrationItems = language === 'ja' ? INTEGRATION_AUTOMATION_ITEMS.ja : INTEGRATION_AUTOMATION_ITEMS.en
  const ctas = buildHomeCtas(copy, site, language)
  const sameAs = buildHomeSameAs(copy, site, language)
  const featuredProjects = selectFeaturedProjects(copy.projects, copy.featuredProjectIds, 3)
  const description = `${headline} ${supporting}`

  useSeo({
    title: `${displayName} | ${headline}`,
    description,
    path: '/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: displayName,
      url: absoluteSiteUrl('/'),
      jobTitle: headline,
      description,
      sameAs
    }
  })

  return (
    <article className="stack home-page">
      <section className="card home-hero-shell">
        <div className="hero-kicker">{displayName}</div>
        <h1>{headline}</h1>
        <p className="hero-support">{supporting}</p>
        <nav className="cta-row" aria-label={language === 'ja' ? '主要アクション' : 'Primary actions'}>
          {ctas.map(link => (
            isInternalHref(link.url)
              ? (
                <Link key={`${link.label}-${link.url}`} to={link.url} className="button primary" prefetch="intent">
                  {link.label}
                </Link>
                )
              : (
                <a
                  key={`${link.label}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button primary"
                >
                  {link.label}
                </a>
                )
          ))}
        </nav>
      </section>

      <section className="proof-point-grid" aria-label={language === 'ja' ? '実績の要点' : 'Proof points'}>
        {proofPoints.map(point => (
          <article key={point} className="mini-card proof-point-card">
            <p>{point}</p>
          </article>
        ))}
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">{language === 'ja' ? '進め方' : 'How I Work'}</p>
          <h2>{language === 'ja' ? 'How I Work' : 'How I Work'}</h2>
        </div>
        <div className="workflow-grid">
          {workflowSteps.map(step => (
            <article key={step.title} className="mini-card workflow-card">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-heading">
          <p className="eyebrow">{language === 'ja' ? '連携 / 自動化' : 'Integration / Automation'}</p>
          <h2>{language === 'ja' ? '対応領域' : 'What I handle'}</h2>
        </div>
        <ul className="integration-list">
          {integrationItems.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="hero-secondary">{specialty}</p>
      </section>

      <section className="proof-section">
        <div className="section-heading">
          <p className="eyebrow">{language === 'ja' ? '事例' : 'Case Studies'}</p>
          <h2>{language === 'ja' ? '主なケーススタディ' : 'Selected case studies'}</h2>
        </div>
        <div className="proof-grid">
          {featuredProjects.map(project => {
            const narrative = projectNarrative(project)
            const title = localizedValue(project.title, language, project.id)
            const summary = localizedValue(narrative.summary, language)
            const problem = localizedValue(narrative.problem, language)
            const systems = localizedValue(narrative.systems, language)
            const architecture = localizedValue(narrative.architecture, language)
            const result = localizedValue(narrative.result, language)
            const tags = language === 'ja'
              ? (project.tags.ja.length ? project.tags.ja : project.tags.en)
              : (project.tags.en.length ? project.tags.en : project.tags.ja)

            return (
              <article key={project.id} className="card proof-card">
                <div className="proof-header">
                  <h3>
                    <Link to={`/projects/${encodeURIComponent(project.id)}`} prefetch="intent">
                      {title}
                    </Link>
                  </h3>
                  {summary && <p>{summary}</p>}
                </div>
                <dl className="detail-grid">
                  <div>
                    <dt>{language === 'ja' ? '課題' : 'Problem'}</dt>
                    <dd>{problem}</dd>
                  </div>
                  <div>
                    <dt>{language === 'ja' ? '関わるシステム' : 'Systems involved'}</dt>
                    <dd>{systems}</dd>
                  </div>
                  <div>
                    <dt>{language === 'ja' ? '連携 / バックエンド構成' : 'Integration / backend architecture'}</dt>
                    <dd>{architecture}</dd>
                  </div>
                  <div>
                    <dt>{language === 'ja' ? '運用結果' : 'Operational result'}</dt>
                    <dd>{result}</dd>
                  </div>
                </dl>
                {tags.length > 0 && (
                  <div className="tags">{tags.slice(0, 5).map(tag => <span key={tag}>{tag}</span>)}</div>
                )}
                <div className="project-actions">
                  <Link to={`/projects/${encodeURIComponent(project.id)}`} className="button ghost" prefetch="intent">
                    {language === 'ja' ? '事例を見る' : 'View case study'}
                  </Link>
                  {project.url && (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="button secondary">
                      {language === 'ja' ? 'ライブを見る' : 'Open live product'}
                    </a>
                  )}
                  {project.repo && (
                    <a href={project.repo} target="_blank" rel="noopener noreferrer" className="button ghost">
                      {language === 'ja' ? 'ソースを見る' : 'View source'}
                    </a>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </article>
  )
}

async function loadHomeCopy(): Promise<HomeCopy> {
  const [home, projects] = await Promise.all([getPublicDoc('home'), listProjects()])
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const sharedProfile = resolveSharedProfileCopy(home as Record<string, unknown> | null)

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

  const parseFeaturedIds = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.map(item => pick(item)).filter(Boolean)
    }
    return pick(value)
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
  }

  return {
    headline: sharedProfile.headline,
    supporting: sharedProfile.supporting,
    secondarySpecialization: sharedProfile.secondarySpecialization,
    links: {
      en: parseLinks(pick(home?.links_en)),
      ja: parseLinks(pick(home?.links_ja))
    },
    featuredProjectIds: parseFeaturedIds(home?.featured_project_ids ?? home?.featured_projects_en),
    projects
  }
}

function getLocalizedHomeLinks(copy: HomeCopy, language: 'en' | 'ja') {
  return language === 'ja'
    ? (copy.links.ja.length ? copy.links.ja : copy.links.en)
    : (copy.links.en.length ? copy.links.en : copy.links.ja)
}

function isLinkedInLink(link: HomeLink | ProfileLink) {
  return /linkedin/i.test(link.label) || /linkedin\.com/i.test(link.url)
}

function normalizeHomeLinkKey(value: string) {
  if (!value) return ''
  if (isInternalHref(value)) {
    const path = value.split(/[?#]/, 1)[0].replace(/\/+$/, '')
    return path || '/'
  }
  return normalizeExternalUrl(value) || value.trim()
}

function buildHomeCtas(copy: HomeCopy, site: AppShellContext['site'], language: 'en' | 'ja') {
  const provided = getLocalizedHomeLinks(copy, language)
    .filter(link => !isLinkedInLink(link))
  const defaultProfiles = [...site.profileLinks]
    .filter(link => Boolean(link.url) && !isLinkedInLink(link))
  const findProfile = (matcher: (link: ProfileLink | HomeLink) => boolean) =>
    provided.find(matcher)?.url ||
    defaultProfiles.find(matcher)?.url ||
    ''

  const ctas: HomeLink[] = [
    {
      label: language === 'ja' ? '履歴書' : 'Resume',
      url: '/resume'
    },
    {
      label: language === 'ja' ? '事例' : 'Case Studies',
      url: '/projects'
    },
    {
      label: 'GitHub',
      url: findProfile(link => /github/i.test(link.label) || /github\.com/i.test(link.url))
    }
  ]

  const deduped = new Map<string, HomeLink>()
  ;[...ctas, ...provided].forEach(link => {
    if (!link.url) return
    const key = normalizeHomeLinkKey(link.url)
    if (!deduped.has(key)) {
      deduped.set(key, link)
    }
  })

  return Array.from(deduped.values()).slice(0, 6)
}

function buildHomeSameAs(copy: HomeCopy, site: AppShellContext['site'], language: 'en' | 'ja') {
  const externalUrls = [...getLocalizedHomeLinks(copy, language), ...site.profileLinks]
    .map(link => normalizeExternalUrl(link.url))
    .filter((url): url is string => Boolean(url))

  return Array.from(new Set(externalUrls))
}

function isInternalHref(value: string) {
  return value.startsWith('/')
}

function HomeSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-subheading" />
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
      <div className="skeleton-chip-row">
        {[0, 1, 2, 3].map(key => (
          <span key={key} className="skeleton-block skeleton-pill" style={{ width: `${110 + key * 10}px` }} />
        ))}
      </div>
    </section>
  )
}
