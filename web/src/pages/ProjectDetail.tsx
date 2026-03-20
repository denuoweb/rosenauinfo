import { Link, LoaderFunctionArgs, useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { listProjects, type ProjectRecord } from '../lib/content'
import { localizedValue, projectNarrative } from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import type { AppShellContext } from '../components/Layout'

type ProjectDetailLoaderData = {
  project: Promise<ProjectRecord | null>
}

export function loader({ params }: LoaderFunctionArgs) {
  const projectId = typeof params.projectId === 'string' ? params.projectId : ''
  return {
    project: loadProject(projectId)
  }
}

export function HydrateFallback() {
  return <ProjectDetailSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const { project } = useLoaderData() as ProjectDetailLoaderData
  const { site } = useOutletContext<AppShellContext>()
  const displayName = language === 'ja' ? (site.name.ja || site.name.en) : (site.name.en || site.name.ja)

  return (
    <Suspense fallback={<ProjectDetailSkeleton />}>
      <ProjectDetailContent projectPromise={project} language={language} displayName={displayName} />
    </Suspense>
  )
}

export default Component

function ProjectDetailContent({
  projectPromise,
  language,
  displayName
}: {
  projectPromise: Promise<ProjectRecord | null>
  language: 'en' | 'ja'
  displayName: string
}) {
  const project = use(projectPromise)
  const notFoundTitle = language === 'ja' ? 'プロジェクトが見つかりません' : 'Project not found'
  const notFoundDescription = language === 'ja'
    ? '指定されたプロジェクトは見つかりませんでした。'
    : 'The requested project page could not be found.'
  const title = project
    ? localizedValue(project.title, language, project.id)
    : notFoundTitle
  const summary = project
    ? localizedValue(projectNarrative(project).summary, language)
    : notFoundDescription
  const result = project
    ? localizedValue(projectNarrative(project).result, language)
    : notFoundDescription
  const canonicalPath = project ? `/projects/${encodeURIComponent(project.id)}` : '/projects'

  useSeo({
    title: `${displayName} | ${title}`,
    description: `${summary} ${result}`,
    path: canonicalPath,
    ...(project
      ? {
          structuredData: {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: title,
            description: summary,
            url: absoluteSiteUrl(canonicalPath)
          }
        }
      : {})
  })

  if (!project) {
    return (
      <section className="stack">
        <h1>{notFoundTitle}</h1>
        <p>{notFoundDescription}</p>
        <p>
          <Link to="/projects" prefetch="intent">
            {language === 'ja' ? 'プロジェクト一覧に戻る' : 'Back to Projects'}
          </Link>
        </p>
      </section>
    )
  }

  const tags = language === 'ja'
    ? (project.tags.ja.length ? project.tags.ja : project.tags.en)
    : (project.tags.en.length ? project.tags.en : project.tags.ja)
  const narrative = projectNarrative(project)
  const problem = localizedValue(narrative.problem, language)
  const owned = localizedValue(narrative.owned, language)
  const architecture = localizedValue(narrative.architecture, language)

  return (
    <article className="stack">
      <p className="muted">
        <Link to="/projects" prefetch="intent">
          {language === 'ja' ? 'プロジェクト一覧へ戻る' : 'Back to Projects'}
        </Link>
      </p>

      <section className="card page-intro">
        <p className="eyebrow">{language === 'ja' ? 'Case Study' : 'Case Study'}</p>
        <h1>{title}</h1>
        <p className="lead-text">{summary}</p>
        <div className="project-actions">
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
      </section>

      {project.cover && (
        <div className="project-cover-wrapper project-detail-cover">
          <img
            src={project.cover}
            alt={title}
            loading="eager"
            decoding="async"
            width={960}
            height={540}
            className="project-cover"
          />
        </div>
      )}

      <section className="case-study-section">
        <dl className="detail-grid large-detail-grid">
          <div>
            <dt>{language === 'ja' ? '問題設定' : 'Problem statement'}</dt>
            <dd>{problem}</dd>
          </div>
          <div>
            <dt>{language === 'ja' ? '担当範囲' : 'What I owned'}</dt>
            <dd>{owned}</dd>
          </div>
          <div>
            <dt>{language === 'ja' ? '構成 / スタック' : 'Architecture / stack'}</dt>
            <dd>{architecture}</dd>
          </div>
          <div>
            <dt>{language === 'ja' ? '結果 / 運用シグナル' : 'Result / operational signal'}</dt>
            <dd>{result}</dd>
          </div>
        </dl>
      </section>

      {tags.length > 0 && (
        <section className="resume-section">
          <h2>{language === 'ja' ? '技術キーワード' : 'Technical keywords'}</h2>
          <div className="tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </section>
      )}
    </article>
  )
}

async function loadProject(projectId: string): Promise<ProjectRecord | null> {
  if (!projectId) return null
  const projects = await listProjects()
  return projects.find(project => project.id === projectId) ?? null
}

function ProjectDetailSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-subheading" />
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-media" />
    </section>
  )
}
