import { useLoaderData, useOutletContext } from 'react-router-dom'
import { Suspense, use } from 'react'
import { getPublicDoc, type LocalizedText } from '../lib/content'
import {
  RESUME_DEFAULTS,
  localizedValue,
  resolveSharedProfileCopy,
  sanitizeProfileItems
} from '../lib/profileContent'
import { useLanguage } from '../lib/language'
import { useSeo } from '../lib/seo'
import { getLocalizedSiteName } from '../lib/site'
import type { AppShellContext } from '../components/Layout'

type ResumeSectionEntry = {
  id: string
  title: LocalizedText
  items: { en: string[]; ja: string[] }
}

type ResumeCopy = {
  enUrl?: string
  jaUrl?: string
  updatedAt?: string
  jaEta?: string
  roleHeadline: LocalizedText
  secondarySpecialization: LocalizedText
  summary: { en: string[]; ja: string[] }
  sections: ResumeSectionEntry[]
}

type ResumeLoaderData = {
  resume: Promise<ResumeCopy>
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
  const { site } = useOutletContext<AppShellContext>()
  const displayName = getLocalizedSiteName(site, language)

  return (
    <Suspense fallback={<ResumeSkeleton />}>
      <ResumeContent promise={data.resume} language={language} displayName={displayName} />
    </Suspense>
  )
}

export default Component

function ResumeContent({
  promise,
  language,
  displayName
}: {
  promise: Promise<ResumeCopy>
  language: 'en' | 'ja'
  displayName: string
}) {
  const resume = use(promise)
  const url = language === 'ja' ? resume.jaUrl ?? resume.enUrl : resume.enUrl ?? resume.jaUrl
  const defaultSummary = language === 'ja' ? RESUME_DEFAULTS.summary.ja : RESUME_DEFAULTS.summary.en
  const legacySummary = language === 'ja'
    ? (resume.summary.ja.length ? resume.summary.ja : resume.summary.en)
    : (resume.summary.en.length ? resume.summary.en : resume.summary.ja)
  const summaryParagraphs = dedupeStrings([
    ...defaultSummary,
    ...legacySummary.filter(paragraph => !isOffBrandParagraph(paragraph))
  ]).slice(0, 2)
  const sections = buildResumeSections(language, resume.sections)
  const updatedCopy = resume.updatedAt
    ? (language === 'ja' ? `最終更新: ${resume.updatedAt}` : `Updated: ${resume.updatedAt}`)
    : null
  const etaCopy = language === 'ja'
    ? (resume.jaEta ? `公開予定日: ${resume.jaEta}` : null)
    : (resume.jaEta ? `Target publish date: ${resume.jaEta}` : null)
  const description = `${localizedValue(resume.roleHeadline, language)} ${summaryParagraphs[1] || ''}`.trim()

  useSeo({
    title: `${displayName} | ${language === 'ja' ? '履歴書' : 'Resume'}`,
    description,
    path: '/resume'
  })

  return (
    <article className="resume-page">
      <section className="card resume-hero-card">
        <p className="eyebrow">{language === 'ja' ? '履歴書' : 'Resume'}</p>
        <h1>{localizedValue(resume.roleHeadline, language)}</h1>
        <p className="lead-text">{summaryParagraphs[1] || summaryParagraphs[0]}</p>
        {url && (
          <div className="resume-download resume-download--hero">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="button primary resume-download-button"
            >
              {language === 'ja' ? '履歴書 PDF をダウンロード' : 'Download Resume PDF'}
            </a>
          </div>
        )}
        {(updatedCopy || etaCopy) && (
          <div className="resume-download-row">
            {updatedCopy && <p className="muted resume-meta">{updatedCopy}</p>}
            {etaCopy && <p className="muted resume-meta">{etaCopy}</p>}
          </div>
        )}
        <div className="resume-highlight-grid">
          {buildResumeHighlights(language).map(card => (
            <article key={card.title} className="mini-card">
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
        {summaryParagraphs.map((paragraph, index) => (
          <p key={`summary-${index}`}>{paragraph}</p>
        ))}
      </section>

      <div className="resume-sections">
        {sections.map(section => (
          <section key={section.id} className="resume-section">
            <h2>{localizedValue(section.title, language)}</h2>
            <ul>
              {(language === 'ja'
                ? (section.items.ja.length ? section.items.ja : section.items.en)
                : (section.items.en.length ? section.items.en : section.items.ja)
              ).map((item, index) => (
                <li key={`${section.id}-${index}`}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="resume-section">
        <h2>{language === 'ja' ? '実行の加速要素' : 'Execution accelerators'}</h2>
        <p>{localizedValue(resume.secondarySpecialization, language)}</p>
      </section>
    </article>
  )
}

async function loadResumeCopy(): Promise<ResumeCopy> {
  const [doc, home] = await Promise.all([getPublicDoc('resume'), getPublicDoc('home')])
  const pick = (value: unknown) => typeof value === 'string' ? value.trim() : ''
  const sharedProfile = resolveSharedProfileCopy(home as Record<string, unknown> | null)
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
    roleHeadline: sharedProfile.headline,
    secondarySpecialization: sharedProfile.secondarySpecialization,
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

function buildResumeSections(language: 'en' | 'ja', sections: ResumeSectionEntry[]) {
  const defaultSections = RESUME_DEFAULTS.sections
  const sanitizedSections = sections
    .map(section => ({
      ...section,
      items: {
        en: sanitizeProfileItems(section.items.en, []),
        ja: sanitizeProfileItems(section.items.ja, [])
      }
    }))
    .filter(section => {
      const title = localizedValue(section.title, language)
      const items = language === 'ja'
        ? (section.items.ja.length ? section.items.ja : section.items.en)
        : (section.items.en.length ? section.items.en : section.items.ja)
      return Boolean(title || items.length)
    })

  return [
    ...defaultSections,
    ...sanitizedSections
  ]
}

function buildResumeHighlights(language: 'en' | 'ja') {
  return [
    {
      title: language === 'ja' ? '主軸' : 'Primary focus',
      body: language === 'ja'
        ? '実装 / 連携 delivery を本番サポートまで持つこと。'
        : 'Implementation and integration delivery with ownership through production support.'
    },
    {
      title: language === 'ja' ? '主要技術' : 'Core stack',
      body: language === 'ja'
        ? 'Python、TypeScript、API、認証、Webhook、SQL、クラウド運用。'
        : 'Python, TypeScript, APIs, auth, webhooks, SQL, and cloud operations.'
    },
    {
      title: language === 'ja' ? '実績タイプ' : 'Shipped systems',
      body: language === 'ja'
        ? '公開プロダクト、バックエンドサービス、運用ツール。'
        : 'Public products, backend services, and operational tooling.'
    }
  ]
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.map(value => value.trim()).filter(Boolean)))
}

function isOffBrandParagraph(value: string) {
  return /student|graduat|undergraduate|大学|在学|卒業予定/i.test(value)
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
