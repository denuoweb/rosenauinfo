import { useLoaderData } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc } from '../lib/content'
import { useLanguage } from '../lib/language'

type ResumeLoaderData = {
  resume: Promise<ResumeCopy>
}

type ResumeSectionEntry = {
  id: string
  title: { en: string; ja: string }
  items: { en: string[]; ja: string[] }
}

type ResumeCopy = {
  enUrl?: string
  jaUrl?: string
  updatedAt?: string
  jaEta?: string
  summary: { en: string[]; ja: string[] }
  sections: ResumeSectionEntry[]
}

export function loader() {
  return {
    resume: loadResumeCopy()
  }
}

export function HydrateFallback() {
  return <ResumeSkeleton />
}

export function Component() {
  const { language } = useLanguage()
  const data = useLoaderData() as ResumeLoaderData

  return (
    <Suspense fallback={<ResumeSkeleton />}>
      <ResumeContent promise={data.resume} language={language} />
    </Suspense>
  )
}

export default Component

function ResumeContent({
  promise,
  language
}: {
  promise: Promise<ResumeCopy>
  language: 'en' | 'ja'
}) {
  const resume = use(promise)
  return <ResumeSection language={language} resume={resume} />
}

function ResumeSection({
  language,
  resume
}: {
  language: 'en' | 'ja'
  resume: ResumeCopy
}) {
  const heading = language === 'ja' ? '履歴書' : 'Resume'
  const url = language === 'ja' ? resume.jaUrl ?? resume.enUrl : resume.enUrl ?? resume.jaUrl
  const neutralCopy = language === 'ja'
    ? '履歴書は現在準備中です。近日中に公開いたします。'
    : 'The résumé is being finalised and will be available soon.'

  const summaryParagraphs = language === 'ja'
    ? (resume.summary.ja.length ? resume.summary.ja : resume.summary.en)
    : (resume.summary.en.length ? resume.summary.en : resume.summary.ja)
  const localizedSections = resume.sections
    .map(section => {
      const title = language === 'ja'
        ? section.title.ja || section.title.en
        : section.title.en || section.title.ja
      const items = language === 'ja'
        ? (section.items.ja.length ? section.items.ja : section.items.en)
        : (section.items.en.length ? section.items.en : section.items.ja)
      return {
        id: section.id,
        title,
        items
      }
    })
    .filter(section => section.title || section.items.length)

  const etaCopy = language === 'ja'
    ? resume.jaEta ? `公開予定日: ${resume.jaEta}` : null
    : resume.jaEta ? `Target publish date: ${resume.jaEta}` : null
  const updatedCopy = resume.updatedAt
    ? (language === 'ja' ? `最終更新: ${resume.updatedAt}` : `Updated: ${resume.updatedAt}`)
    : null
  const hasContent = summaryParagraphs.length > 0 || localizedSections.some(section => section.items.length > 0 || section.title)

  return (
    <section className="resume-page">
      <h1>{heading}</h1>
      {updatedCopy && <p className="muted resume-meta">{updatedCopy}</p>}
      {url && (
        <div className="resume-download">
          <a href={url} target="_blank" rel="noopener noreferrer">
            {language === 'ja' ? '履歴書（PDF）をダウンロード' : 'Download résumé (PDF)'}
          </a>
        </div>
      )}
      {!hasContent && !url && (
        <div className="card neutral-stub">
          <p>{neutralCopy}</p>
          {etaCopy && <p className="muted">{etaCopy}</p>}
        </div>
      )}
      {summaryParagraphs.map((paragraph, idx) => (
        <p key={`summary-${idx}`}>{paragraph}</p>
      ))}
      {localizedSections.length > 0 && (
        <div className="resume-sections">
          {localizedSections.map(section => (
            <article key={section.id} className="resume-section">
              {section.title && <h2>{section.title}</h2>}
              {section.items.length > 0 && (
                <ul>
                  {section.items.map((item, index) => (
                    <li key={`${section.id}-${index}`}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
      {etaCopy && (url || hasContent) && <p className="muted resume-meta">{etaCopy}</p>}
    </section>
  )
}

async function loadResumeCopy(): Promise<ResumeCopy> {
  const doc = await getPublicDoc('resume')
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const isArrayOfStrings = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string')
  const parseParagraphs = (value: unknown) =>
    pick(value)
      .split(/\n{2,}/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean)
  const parseItems = (value: unknown) => {
    if (isArrayOfStrings(value)) {
      return value.map(item => item.trim()).filter(Boolean)
    }
    return pick(value)
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
  }

  return {
    enUrl: pick(doc?.url_en ?? doc?.url) || undefined,
    jaUrl: pick(doc?.url_ja ?? doc?.url) || undefined,
    updatedAt: pick(doc?.updatedAt ?? doc?.updated_at),
    jaEta: pick(doc?.ja_eta ?? doc?.eta_ja ?? doc?.jaTargetDate),
    summary: {
      en: parseParagraphs(doc?.summary_en ?? doc?.summary),
      ja: parseParagraphs(doc?.summary_ja ?? doc?.summary)
    },
    sections: Array.isArray((doc as any)?.sections)
      ? (doc as any).sections.map((section: any, index: number) => {
          const id = pick(section?.id) || `section-${index}`
          const titleEn = pick(section?.title_en ?? section?.title)
          const titleJa = pick(section?.title_ja ?? section?.title)
          const itemsEn = parseItems(section?.items_en ?? section?.items)
          const itemsJa = parseItems(section?.items_ja ?? section?.items)
          return {
            id,
            title: { en: titleEn, ja: titleJa },
            items: { en: itemsEn, ja: itemsJa }
          }
        })
      : []
  }
}

function ResumeSkeleton() {
  return (
    <section className="route-skeleton">
      <span className="skeleton-block skeleton-heading" />
      <span className="skeleton-block skeleton-paragraph" />
      <span className="skeleton-block skeleton-paragraph" />
      <div className="skeleton-chip-column">
        {[0, 1, 2].map(key => (
          <span key={key} className="skeleton-block skeleton-pill" style={{ width: `${220 - key * 28}px` }} />
        ))}
      </div>
    </section>
  )
}
