import { useLoaderData } from 'react-router-dom'
import { Suspense, memo, useEffect, use } from 'react'
import { listProjects } from '../lib/content'
import { useLanguage } from '../lib/language'
import { trackOutboundProjectLink } from '../lib/analytics'

type ProjectRecord = {
  id: string
  title: { en: string; ja: string }
  description: { en: string; ja: string }
  url?: string
  repo?: string
  tags: { en: string[]; ja: string[] }
  cover?: string
}

type ProjectsLoaderData = {
  projects: Promise<ProjectRecord[]>
}

export function loader() {
  return {
    projects: loadProjects()
  }
}

export function HydrateFallback() {
  return <ProjectsSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as ProjectsLoaderData

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectsContent promise={data.projects} language={language} />
    </Suspense>
  )
}

export default Component

function ProjectsContent({ promise, language }: { promise: Promise<ProjectRecord[]>; language: 'en' | 'ja' }) {
  const projects = use(promise)
  return <ProjectsSection projects={projects} language={language} />
}

const ProjectsSection = memo(function ProjectsSection({
  projects,
  language
}: {
  projects: ProjectRecord[]
  language: 'en' | 'ja'
}) {
  const heading = language === 'ja' ? 'プロジェクト' : 'Projects'
  const neutralCopy = language === 'ja'
    ? '公開できるプロジェクトは近日追加予定です。'
    : 'Published projects are on the way—check back soon.'

  if (projects.length === 0) {
    return (
      <section>
        <h1>{heading}</h1>
        <p className="muted">{neutralCopy}</p>
      </section>
    )
  }

  useEffect(() => {
    const hosts = new Set<string>()
    projects.forEach(project => {
      const liveOrigin = extractOrigin(project.url)
      const repoOrigin = extractOrigin(project.repo)
      if (liveOrigin) hosts.add(liveOrigin)
      if (repoOrigin) hosts.add(repoOrigin)
    })
    hosts.add('https://github.com')
    const preconnectLinks = Array.from(hosts).map(origin => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = origin
      link.crossOrigin = ''
      document.head.appendChild(link)
      return link
    })
    return () => {
      preconnectLinks.forEach(link => document.head.removeChild(link))
    }
  }, [projects.map(p => `${p.id}:${p.url || ''}:${p.repo || ''}`).join('|')])

  useEffect(() => {
    const heroImages = projects.slice(0, 2).map(p => p.cover).filter(Boolean) as string[]
    const imageLinks = heroImages.map(src => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.as = 'image'
      link.href = src
      document.head.appendChild(link)
      return link
    })
    return () => {
      imageLinks.forEach(link => document.head.removeChild(link))
    }
  }, [projects.slice(0, 2).map(p => p.cover || '').join('|')])

  return (
    <section>
      <h1>{heading}</h1>
      <ul className="cards">
        {projects.map((project, index) => {
          const title = language === 'ja'
            ? project.title.ja || project.title.en
            : project.title.en || project.title.ja
          const description = language === 'ja'
            ? project.description.ja || project.description.en
            : project.description.en || project.description.ja
          const tags = language === 'ja'
            ? project.tags.ja.length ? project.tags.ja : project.tags.en
            : project.tags.en.length ? project.tags.en : project.tags.ja
          const fallbackTitle = language === 'ja' ? 'プロジェクト' : 'Project'

          return (
            <li key={project.id} className="card project-card">
              {project.cover && (
                <div className="project-cover-wrapper">
                  <img
                    src={project.cover}
                    alt={title || fallbackTitle}
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={540}
                    className="project-cover"
                  />
                </div>
              )}
              <div className="card-body">
                <h2>{title || fallbackTitle}</h2>
                {description && <p>{description}</p>}
              </div>
              <ProjectActions project={project} language={language} position={index + 1} />
              {tags.length > 0 && (
                <div className="tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
})

const ProjectActions = memo(function ProjectActions({
  project,
  language,
  position
}: {
  project: ProjectRecord
  language: 'en' | 'ja'
  position: number
}) {
  const liveLabel = language === 'ja' ? 'ライブデモ' : 'Live demo'
  const sourceLabel = language === 'ja' ? 'ソースを見る' : 'View source'
  const accessibleTitle = project.title.en || project.title.ja || ''
  const liveAria = accessibleTitle ? `${liveLabel}: ${accessibleTitle}` : liveLabel
  const sourceAria = accessibleTitle ? `${sourceLabel}: ${accessibleTitle}` : sourceLabel
  const sourceHref = project.repo || (project.url && project.url.includes('github.com') ? project.url : undefined)

  if (!project.url && !sourceHref) {
    return null
  }

  return (
    <div className="project-actions">
      {project.url && (
        <a
          href={project.url}
          target="_blank"
          rel="noopener"
          className="button secondary"
          aria-label={liveAria}
          onClick={() => trackOutboundProjectLink('demo', project.id, position, project.url!)}
        >
          {liveLabel}
        </a>
      )}
      {sourceHref && (
        <a
          href={sourceHref}
          target="_blank"
          rel="noopener"
          className="button ghost"
          aria-label={sourceAria}
          onClick={() => trackOutboundProjectLink('source', project.id, position, sourceHref)}
        >
          {sourceLabel}
        </a>
      )}
    </div>
  )
})

async function loadProjects(): Promise<ProjectRecord[]> {
  const rawItems = await listProjects()
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const pickArray = (value: unknown) =>
    Array.isArray(value)
      ? value.map(item => pick(item)).filter(Boolean)
      : []

  return rawItems.map(item => {
    const url = pick((item as any).url)
    const repo = pick((item as any).repo ?? (item as any).source ?? (item as any).github)
    const cover = pick((item as any).cover ?? (item as any).image ?? (item as any).thumbnail)
    return {
      id: String(item.id),
      title: {
        en: pick((item as any).title_en ?? (item as any).title),
        ja: pick((item as any).title_ja)
      },
      description: {
        en: pick((item as any).description_en ?? (item as any).description),
        ja: pick((item as any).description_ja)
      },
      url: url || undefined,
      repo: repo || undefined,
      tags: {
        en: pickArray((item as any).tags_en ?? (item as any).tags),
        ja: pickArray((item as any).tags_ja)
      },
      cover: cover || undefined
    }
  })
}

function ProjectsSkeleton() {
  return (
    <section>
      <span className="skeleton-block skeleton-heading" />
      <ul className="cards">
        {[0, 1, 2].map(key => (
          <li key={key} className="card">
            <span className="skeleton-block skeleton-media" />
            <span className="skeleton-block skeleton-subheading" />
            <span className="skeleton-block skeleton-paragraph" />
            <div className="skeleton-chip-row">
              {[0, 1, 2].map(tag => (
                <span key={tag} className="skeleton-block skeleton-pill" style={{ width: `${70 + tag * 12}px` }} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function extractOrigin(url?: string) {
  if (!url) return null
  try {
    const target = new URL(url)
    return `${target.protocol}//${target.host}`
  } catch {
    return null
  }
}
