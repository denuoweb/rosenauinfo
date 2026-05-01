import { Link, useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc, listProjects, type ProjectRecord } from '../lib/content'
import {
  localizedValue,
  prioritizeProjects,
  projectNarrative,
  resolveSharedProfileCopy,
  selectPortfolioProjects
} from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { trackOutboundProjectLink } from '../lib/analytics'
import ProjectCoverMedia from '../components/ProjectCoverMedia'
import { useSeo } from '../lib/seo'
import { getLocalizedSiteName } from '../lib/site'
import type { AppShellContext } from '../components/Layout'

type ProjectsLoaderData = {
  projects: Promise<{
    items: ProjectRecord[]
    roleHeadline: { en: string; ja: string }
  }>
}

export function loader() {
  return {
    projects: loadProjectsPageData()
  }
}

export function HydrateFallback() {
  return <ProjectsSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as ProjectsLoaderData
  const { site } = useOutletContext<AppShellContext>()
  const displayName = getLocalizedSiteName(site, language)

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent promise={data.projects} language={language} displayName={displayName} />
    </Suspense>
  )
}

export default Component

function ProjectsContent({
  promise,
  language,
  displayName
}: {
  promise: Promise<{
    items: ProjectRecord[]
    roleHeadline: { en: string; ja: string }
  }>
  language: 'en' | 'ja'
  displayName: string
}) {
  const { items: projects, roleHeadline } = use(promise)
  const curated = selectPortfolioProjects(projects, 3)
  const remainingIds = new Set(curated.map(project => project.id))
  const additional = prioritizeProjects(projects)
    .filter(project => !remainingIds.has(project.id))
    .filter(project => projectNarrative(project).priority < 50)

  useSeo({
    title: `${displayName} | ${language === 'ja' ? '事例' : 'Case Studies'}`,
    description: language === 'ja'
      ? '実装 / 連携寄りのケーススタディ。課題、関わるシステム、バックエンド構成、運用結果が見える形で整理しています。'
      : 'Implementation and integration case studies organized around the problem, systems involved, backend architecture, and operational result.',
    path: '/projects'
  })

  if (projects.length === 0) {
    return (
      <section className="stack">
        <section className="card page-intro">
          <p className="eyebrow">{language === 'ja' ? '事例' : 'Case Studies'}</p>
          <h1>{language === 'ja' ? 'ケーススタディは準備中です' : 'Case studies are being prepared'}</h1>
        </section>
      </section>
    )
  }

  return (
    <article className="stack">
      <section className="card page-intro">
        <p className="eyebrow">{language === 'ja' ? '事例' : 'Case Studies'}</p>
        <h1>{language === 'ja' ? '実装 / 連携のケーススタディ' : 'Implementation and integration case studies'}</h1>
        <p className="lead-text">{localizedValue(roleHeadline, language)}</p>
        <p>
          {language === 'ja'
            ? 'ここでは、公開プロジェクトを、課題、関わるシステム、連携 / バックエンド構成、運用結果が見える形で整理しています。'
            : 'This page organizes public work around the problem, systems involved, integration and backend architecture, and the operational result.'}
        </p>
      </section>
      <section className="stack">
        <div className="section-heading">
          <p className="eyebrow">{language === 'ja' ? '注目事例' : 'Featured case studies'}</p>
          <h2>{language === 'ja' ? '主なケーススタディ' : 'Selected case studies'}</h2>
        </div>
        <div className="case-study-grid">
          {curated.map((project, index) => (
            <CaseStudyCard
              key={project.id}
              project={project}
              language={language}
              position={index + 1}
            />
          ))}
        </div>
      </section>

      {additional.length > 0 && (
        <section className="stack">
          <div className="section-heading">
            <p className="eyebrow">{language === 'ja' ? '補足' : 'Additional work'}</p>
            <h2>{language === 'ja' ? '他の公開事例 / リポジトリ' : 'Other public case studies and repositories'}</h2>
          </div>
          <ul className="cards compact-cards">
            {additional.map(project => {
              const title = localizedValue(project.title, language, project.id)
              const narrative = projectNarrative(project)
              const summary = localizedValue(narrative.summary, language)

              return (
                <li key={project.id} className="card compact-project-card">
                  <h3>
                    <Link to={`/projects/${encodeURIComponent(project.id)}`} prefetch="intent">
                      {title}
                    </Link>
                  </h3>
                  <p>{summary}</p>
                  <div className="project-actions">
                    <Link to={`/projects/${encodeURIComponent(project.id)}`} className="button ghost" prefetch="intent">
                      {language === 'ja' ? '事例を見る' : 'View case study'}
                    </Link>
                    {project.repo && (
                      <a href={project.repo} target="_blank" rel="noopener noreferrer" className="button ghost">
                        {language === 'ja' ? 'ソース' : 'Source'}
                      </a>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </article>
  )
}

async function loadProjectsPageData() {
  const [items, home] = await Promise.all([listProjects(), getPublicDoc('home')])
  const sharedProfile = resolveSharedProfileCopy(home as Record<string, unknown> | null)
  return {
    items,
    roleHeadline: sharedProfile.headline
  }
}

function CaseStudyCard({
  project,
  language,
  position
}: {
  project: ProjectRecord
  language: 'en' | 'ja'
  position: number
}) {
  const title = localizedValue(project.title, language, project.id)
  const tags = language === 'ja'
    ? (project.tags.ja.length ? project.tags.ja : project.tags.en)
    : (project.tags.en.length ? project.tags.en : project.tags.ja)
  const narrative = projectNarrative(project)
  const summary = localizedValue(narrative.summary, language)
  const problem = localizedValue(narrative.problem, language)
  const systems = localizedValue(narrative.systems, language)
  const architecture = localizedValue(narrative.architecture, language)
  const result = localizedValue(narrative.result, language)

  return (
    <article className="card case-study-card">
      {project.cover && (
        <div className="project-cover-wrapper">
          <ProjectCoverMedia
            cover={project.cover}
            alt={title}
            className="project-cover"
            fallbackText={title}
          />
        </div>
      )}
      <div className="card-body">
        <p className="eyebrow">{language === 'ja' ? '事例' : 'Case Study'}</p>
        <h2>
          <Link to={`/projects/${encodeURIComponent(project.id)}`} prefetch="intent">
            {title}
          </Link>
        </h2>
        <p>{summary}</p>
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
        <div className="tags">{tags.slice(0, 6).map(tag => <span key={tag}>{tag}</span>)}</div>
      )}
      <div className="project-actions">
        <Link to={`/projects/${encodeURIComponent(project.id)}`} className="button ghost" prefetch="intent">
          {language === 'ja' ? '事例を見る' : 'View case study'}
        </Link>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button secondary"
            onClick={() => trackOutboundProjectLink('demo', project.id, position, project.url!)}
          >
            {language === 'ja' ? 'ライブ' : 'Live product'}
          </a>
        )}
        {project.repo && (
          <a
            href={project.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="button ghost"
            onClick={() => trackOutboundProjectLink('source', project.id, position, project.repo!)}
          >
            {language === 'ja' ? 'ソース' : 'Source'}
          </a>
        )}
      </div>
    </article>
  )
}

function ProjectsSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-subheading" />
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
    </section>
  )
}
