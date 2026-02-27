import { Link, LoaderFunctionArgs, useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { listProjects } from '../lib/content'
import { useLanguage } from '../lib/language'
import { absoluteSiteUrl, useSeo } from '../lib/seo'
import type { AppShellContext } from '../components/Layout'

type ProjectRecord = {
  id: string
  title: { en: string; ja: string }
  description: { en: string; ja: string }
  url?: string
  repo?: string
  tags: { en: string[]; ja: string[] }
  cover?: string
}

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
      <ProjectDetailContent
        projectPromise={project}
        language={language}
        displayName={displayName}
      />
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
    ? (language === 'ja' ? (project.title.ja || project.title.en) : (project.title.en || project.title.ja))
    : notFoundTitle
  const description = project
    ? (language === 'ja'
        ? (project.description.ja || project.description.en)
        : (project.description.en || project.description.ja))
    : notFoundDescription
  const canonicalPath = project ? `/projects/${encodeURIComponent(project.id)}` : '/projects'

  useSeo({
    title: `${displayName} | ${title || (language === 'ja' ? 'プロジェクト' : 'Project')}`,
    description: project
      ? (description
          ? `${title} — ${description}`
          : (language === 'ja'
              ? `${displayName}によるプロジェクト紹介ページです。`
              : `Project details by ${displayName}.`))
      : notFoundDescription,
    path: canonicalPath,
    ...(project
      ? {
          structuredData: {
            '@context': 'https://schema.org',
            '@type': 'CreativeWork',
            name: title || project.id,
            description: description || undefined,
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

  return (
    <article className="stack">
      <p className="muted">
        <Link to="/projects" prefetch="intent">
          {language === 'ja' ? 'プロジェクト一覧へ戻る' : 'Back to Projects'}
        </Link>
      </p>
      <h1>{title || (language === 'ja' ? 'プロジェクト' : 'Project')}</h1>
      {description && <p>{description}</p>}
      {project.cover && (
        <div className="project-cover-wrapper">
          <img
            src={project.cover}
            alt={title || (language === 'ja' ? 'プロジェクト画像' : 'Project cover image')}
            loading="eager"
            decoding="async"
            width={960}
            height={540}
            className="project-cover"
          />
        </div>
      )}
      <div className="project-actions">
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener" className="button secondary">
            {language === 'ja' ? 'ライブデモ' : 'Live demo'}
          </a>
        )}
        {project.repo && (
          <a href={project.repo} target="_blank" rel="noopener" className="button ghost">
            {language === 'ja' ? 'ソースを見る' : 'View source'}
          </a>
        )}
      </div>
      {tags.length > 0 && (
        <div className="tags">
          {tags.map(tag => <span key={tag}>{tag}</span>)}
        </div>
      )}
    </article>
  )
}

async function loadProject(projectId: string): Promise<ProjectRecord | null> {
  if (!projectId) return null
  const rawItems = await listProjects()
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const pickArray = (value: unknown) =>
    Array.isArray(value)
      ? value.map(item => pick(item)).filter(Boolean)
      : []

  const matched = rawItems.find(item => String(item.id) === projectId)
  if (!matched) return null

  const url = pick((matched as any).url)
  const repo = pick((matched as any).repo ?? (matched as any).source ?? (matched as any).github)
  const cover = pick((matched as any).cover ?? (matched as any).image ?? (matched as any).thumbnail)
  return {
    id: String(matched.id),
    title: {
      en: pick((matched as any).title_en ?? (matched as any).title),
      ja: pick((matched as any).title_ja)
    },
    description: {
      en: pick((matched as any).description_en ?? (matched as any).description),
      ja: pick((matched as any).description_ja)
    },
    url: url || undefined,
    repo: repo || undefined,
    tags: {
      en: pickArray((matched as any).tags_en ?? (matched as any).tags),
      ja: pickArray((matched as any).tags_ja)
    },
    cover: cover || undefined
  }
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
