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
  const displayName = language === 'ja' ? (site.name.ja || site.name.en) : (site.name.en || site.name.ja)

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
  const curated = selectPortfolioProjects(projects, 4)
  const remainingIds = new Set(curated.map(project => project.id))
  const additional = prioritizeProjects(projects).filter(project => !remainingIds.has(project.id))

  useSeo({
    title: `${displayName} | ${language === 'ja' ? 'プロジェクト' : 'Projects'}`,
    description: language === 'ja'
      ? 'バックエンド / プラットフォーム領域の実務ポートフォリオ。API、データシステム、CI/CD、クラウド運用、出荷済みプロダクトを扱います。'
      : 'Professional portfolio covering backend/platform work across shipped products, APIs, data systems, CI/CD, and cloud operations.',
    path: '/projects'
  })

  if (projects.length === 0) {
    return (
      <section className="stack">
        <section className="card page-intro">
          <p className="eyebrow">{language === 'ja' ? 'プロジェクト' : 'Projects'}</p>
          <h1>{language === 'ja' ? 'プロジェクトは準備中です' : 'Projects are being prepared'}</h1>
        </section>
      </section>
    )
  }

  return (
    <article className="stack">
      <section className="card page-intro">
        <p className="eyebrow">{language === 'ja' ? 'プロジェクト' : 'Projects'}</p>
        <h1>{language === 'ja' ? '実務ポートフォリオ' : 'Professional portfolio'}</h1>
        <p className="lead-text">{localizedValue(roleHeadline, language)}</p>
        <p>
          {language === 'ja'
            ? 'ここでは、Jaron Rosenau の公開プロジェクトを、システム設計、担当範囲、アーキテクチャ、運用シグナルが見える形で整理しています。'
            : 'This page organizes public projects around the systems, architecture, delivery work, and operating signals behind them.'}
        </p>
      </section>
      <section className="stack">
        <div className="section-heading">
          <p className="eyebrow">{language === 'ja' ? '注目プロジェクト' : 'Featured projects'}</p>
          <h2>{language === 'ja' ? '主なプロジェクト' : 'Portfolio highlights'}</h2>
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
            <h2>{language === 'ja' ? '他の公開プロジェクト' : 'Other public repositories'}</h2>
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
                      {language === 'ja' ? '詳細' : 'Details'}
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
  const owned = localizedValue(narrative.owned, language)
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
        <p className="eyebrow">{language === 'ja' ? 'プロジェクト' : 'Project'}</p>
        <h2>
          <Link to={`/projects/${encodeURIComponent(project.id)}`} prefetch="intent">
            {title}
          </Link>
        </h2>
        <p>{summary}</p>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>{language === 'ja' ? '問題設定' : 'Problem'}</dt>
          <dd>{problem}</dd>
        </div>
        <div>
          <dt>{language === 'ja' ? '担当範囲' : 'Owned directly'}</dt>
          <dd>{owned}</dd>
        </div>
        <div>
          <dt>{language === 'ja' ? 'スタック / 構成' : 'Architecture / stack'}</dt>
          <dd>{architecture}</dd>
        </div>
        <div>
          <dt>{language === 'ja' ? '結果 / 運用シグナル' : 'Result / signal'}</dt>
          <dd>{result}</dd>
        </div>
      </dl>
      {tags.length > 0 && (
        <div className="tags">{tags.slice(0, 6).map(tag => <span key={tag}>{tag}</span>)}</div>
      )}
      <div className="project-actions">
        <Link to={`/projects/${encodeURIComponent(project.id)}`} className="button ghost" prefetch="intent">
          {language === 'ja' ? '詳細ページ' : 'Project page'}
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
