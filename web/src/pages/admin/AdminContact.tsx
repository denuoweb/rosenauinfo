import { FormEvent, useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

type Bilingual = { en: string; ja: string }
type Lang = 'en' | 'ja'
type EditableLink = {
  id: string
  label: string
  url: string
}
type SiteProfiles = {
  github: string
  linkedin: string
  x: string
  youtube: string
  blog: string
  website: string
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const pick = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const parseLinks = (value: unknown): EditableLink[] => {
  if (typeof value !== 'string') return []

  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const separatorIndex = line.indexOf('|')
      if (separatorIndex === -1) {
        return {
          id: createId(),
          label: line,
          url: ''
        }
      }

      return {
        id: createId(),
        label: line.slice(0, separatorIndex).trim(),
        url: line.slice(separatorIndex + 1).trim()
      }
    })
}

const stringifyLinks = (links: EditableLink[]) =>
  links
    .map(link => ({
      label: link.label.trim(),
      url: link.url.trim()
    }))
    .filter(link => link.label && link.url)
    .map(link => `${link.label} | ${link.url}`)
    .join('\n')

function buildContactFallback(displayName: string, language: 'en' | 'ja') {
  return language === 'ja'
    ? `${displayName}へのご連絡は、協業、コンサルティング、またはバックエンド / プラットフォーム領域のご相談についてどうぞ。`
    : `Reach out to ${displayName} about project collaboration, consulting work, or backend/platform systems.`
}

function normalizeContactIntro(value: string, displayName: string, language: 'en' | 'ja') {
  const trimmed = value.trim()
  const fallback = buildContactFallback(displayName, language)

  if (!trimmed) return fallback
  if (/\bhiring\b|\bhire\b|\brecruit\w*\b|\brole(?:s)?\b|\bopportunit(?:y|ies)\b|採用/i.test(trimmed)) {
    return fallback
  }
  return trimmed
}

export default function AdminContact() {
  const [intro, setIntro] = useState<Bilingual>({ en: '', ja: '' })
  const [availability, setAvailability] = useState<Bilingual>({ en: '', ja: '' })
  const [links, setLinks] = useState<{ [key in Lang]: EditableLink[] }>({ en: [], ja: [] })
  const [contactEmail, setContactEmail] = useState('')
  const [sharedProfiles, setSharedProfiles] = useState<SiteProfiles>({
    github: '',
    linkedin: '',
    x: '',
    youtube: '',
    blog: '',
    website: ''
  })
  const [savingCopy, setSavingCopy] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingContactEmail, setSavingContactEmail] = useState(false)
  const [savingSharedProfiles, setSavingSharedProfiles] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [contactSnap, siteSnap] = await Promise.all([
        getDoc(doc(db, 'public', 'contact')),
        getDoc(doc(db, 'public', 'site'))
      ])
      const data = contactSnap.exists() ? contactSnap.data() : {}
      const siteData = siteSnap.exists() ? siteSnap.data() : {}
      const displayName = pick(siteData.name_en) || pick(siteData.name) || pick(siteData.name_ja) || 'this portfolio'

      setIntro({
        en: normalizeContactIntro(pick(data.intro_en) || pick(data.intro), displayName, 'en'),
        ja: normalizeContactIntro(pick(data.intro_ja) || pick(data.intro), displayName, 'ja')
      })
      setAvailability({
        en: pick(data.availability_en) || pick(data.availability),
        ja: pick(data.availability_ja) || pick(data.availability)
      })
      setLinks({
        en: parseLinks(data.links_en ?? data.links),
        ja: parseLinks(data.links_ja ?? data.links)
      })
      setContactEmail(pick(siteData.contactEmail) || pick(siteData.contact_email) || pick(siteData.email))
      setSharedProfiles({
        github: pick(siteData.githubUrl) || pick(siteData.github_url) || pick(siteData.github),
        linkedin: pick(siteData.linkedinUrl) || pick(siteData.linkedin_url) || pick(siteData.linkedin),
        x: pick(siteData.xUrl) || pick(siteData.x_url) || pick(siteData.twitterUrl) || pick(siteData.twitter_url) || pick(siteData.twitter),
        youtube: pick(siteData.youtubeUrl) || pick(siteData.youtube_url) || pick(siteData.youtube),
        blog: pick(siteData.blogUrl) || pick(siteData.blog_url) || pick(siteData.blog),
        website: pick(siteData.websiteUrl) || pick(siteData.website_url) || pick(siteData.website)
      })
    }

    load()
  }, [])

  async function saveCopy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingCopy(true)
    try {
      const nextIntro = {
        en: intro.en.trim(),
        ja: intro.ja.trim()
      }
      const nextAvailability = {
        en: availability.en.trim(),
        ja: availability.ja.trim()
      }
      await setDoc(doc(db, 'public', 'contact'), {
        intro_en: nextIntro.en,
        intro_ja: nextIntro.ja,
        intro: nextIntro.en,
        availability_en: nextAvailability.en,
        availability_ja: nextAvailability.ja,
        availability: nextAvailability.en
      }, { merge: true })
      setIntro(nextIntro)
      setAvailability(nextAvailability)
      setMessage('Updated contact page copy.')
    } finally {
      setSavingCopy(false)
    }
  }

  async function saveLinks(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingLinks(true)
    try {
      const next = {
        en: stringifyLinks(links.en),
        ja: stringifyLinks(links.ja)
      }
      await setDoc(doc(db, 'public', 'contact'), {
        links_en: next.en,
        links_ja: next.ja,
        links: next.en
      }, { merge: true })
      setLinks({
        en: parseLinks(next.en),
        ja: parseLinks(next.ja)
      })
      setMessage('Updated contact page links.')
    } finally {
      setSavingLinks(false)
    }
  }

  async function saveContactEmail(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingContactEmail(true)
    try {
      const trimmed = contactEmail.trim()
      await setDoc(doc(db, 'public', 'site'), {
        contactEmail: trimmed || null
      }, { merge: true })
      setContactEmail(trimmed)
      setMessage(trimmed ? 'Updated contact email.' : 'Cleared contact email.')
    } finally {
      setSavingContactEmail(false)
    }
  }

  async function saveSharedProfiles(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSharedProfiles(true)
    try {
      const next = {
        github: sharedProfiles.github.trim(),
        linkedin: sharedProfiles.linkedin.trim(),
        x: sharedProfiles.x.trim(),
        youtube: sharedProfiles.youtube.trim(),
        blog: sharedProfiles.blog.trim(),
        website: sharedProfiles.website.trim()
      }
      await setDoc(doc(db, 'public', 'site'), {
        github_url: next.github || null,
        linkedin_url: next.linkedin || null,
        x_url: next.x || null,
        youtube_url: next.youtube || null,
        blog_url: next.blog || null,
        website_url: next.website || null
      }, { merge: true })
      setSharedProfiles(next)
      setMessage('Updated shared profile links.')
    } finally {
      setSavingSharedProfiles(false)
    }
  }

  function addLink(lang: Lang) {
    setLinks(prev => ({
      ...prev,
      [lang]: [
        ...prev[lang],
        {
          id: createId(),
          label: '',
          url: ''
        }
      ]
    }))
  }

  function updateLink(lang: Lang, id: string, key: 'label' | 'url', value: string) {
    setLinks(prev => ({
      ...prev,
      [lang]: prev[lang].map(link => (link.id === id ? { ...link, [key]: value } : link))
    }))
  }

  function removeLink(lang: Lang, id: string) {
    setLinks(prev => ({
      ...prev,
      [lang]: prev[lang].filter(link => link.id !== id)
    }))
  }

  return (
    <div className="stack">
      <h2>Contact Page</h2>

      <form className="card form" onSubmit={saveCopy}>
        <h3>Contact Copy</h3>
        <label>
          Intro (English)
          <textarea
            value={intro.en}
            onChange={e => setIntro(prev => ({ ...prev, en: e.target.value }))}
            rows={4}
          />
        </label>
        <label>
          紹介文（日本語）
          <textarea
            value={intro.ja}
            onChange={e => setIntro(prev => ({ ...prev, ja: e.target.value }))}
            rows={4}
          />
        </label>
        <label>
          Availability note (English)
          <input
            value={availability.en}
            onChange={e => setAvailability(prev => ({ ...prev, en: e.target.value }))}
            placeholder="Typically responds within 1-2 business days."
          />
        </label>
        <label>
          稼働メモ（日本語）
          <input
            value={availability.ja}
            onChange={e => setAvailability(prev => ({ ...prev, ja: e.target.value }))}
            placeholder="通常 1-2 営業日以内に返信します。"
          />
        </label>
        <button type="submit" disabled={savingCopy}>
          {savingCopy ? 'Saving…' : 'Save Contact Copy'}
        </button>
      </form>

      <form className="card form" onSubmit={saveLinks}>
        <h3>Contact Page Links</h3>
        <p>These are contact-page-specific links. Shared site profile links shown on the public page are editable below.</p>

        <section className="stack" aria-labelledby="contact-links-en-heading">
          <div className="section-editor-header">
            <h4 id="contact-links-en-heading">Links (English)</h4>
            <button type="button" onClick={() => addLink('en')}>
              Add Link
            </button>
          </div>
          {links.en.length === 0 && <p className="muted">No English links yet.</p>}
          <div className="section-editors">
            {links.en.map((link, index) => (
              <div key={link.id} className="section-editor">
                <div className="section-editor-header">
                  <h4>Link {index + 1}</h4>
                  <button type="button" className="danger" onClick={() => removeLink('en', link.id)}>
                    Delete
                  </button>
                </div>
                <label>
                  Label
                  <input
                    value={link.label}
                    onChange={e => updateLink('en', link.id, 'label', e.target.value)}
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('en', link.id, 'url', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="stack" aria-labelledby="contact-links-ja-heading">
          <div className="section-editor-header">
            <h4 id="contact-links-ja-heading">リンク（日本語）</h4>
            <button type="button" onClick={() => addLink('ja')}>
              リンクを追加
            </button>
          </div>
          {links.ja.length === 0 && <p className="muted">日本語のリンクはまだありません。</p>}
          <div className="section-editors">
            {links.ja.map((link, index) => (
              <div key={link.id} className="section-editor">
                <div className="section-editor-header">
                  <h4>リンク {index + 1}</h4>
                  <button type="button" className="danger" onClick={() => removeLink('ja', link.id)}>
                    削除
                  </button>
                </div>
                <label>
                  ラベル
                  <input
                    value={link.label}
                    onChange={e => updateLink('ja', link.id, 'label', e.target.value)}
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('ja', link.id, 'url', e.target.value)}
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <button type="submit" disabled={savingLinks}>
          {savingLinks ? 'Saving…' : 'Save Links'}
        </button>
      </form>

      <form className="card form" onSubmit={saveContactEmail}>
        <h3>Contact Email</h3>
        <p>This site-level email is shown on the public Contact page.</p>
        <label>
          Email address
          <input
            type="email"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <button type="submit" disabled={savingContactEmail}>
          {savingContactEmail ? 'Saving…' : 'Save Contact Email'}
        </button>
      </form>

      <form className="card form" onSubmit={saveSharedProfiles}>
        <h3>Shared Profile Links</h3>
        <p>These site-level profile links also appear on the public Contact page.</p>
        <label>
          GitHub URL
          <input
            type="url"
            value={sharedProfiles.github}
            onChange={e => setSharedProfiles(prev => ({ ...prev, github: e.target.value }))}
            placeholder="https://github.com/your-handle"
          />
        </label>
        <label>
          LinkedIn URL
          <input
            type="url"
            value={sharedProfiles.linkedin}
            onChange={e => setSharedProfiles(prev => ({ ...prev, linkedin: e.target.value }))}
            placeholder="https://www.linkedin.com/in/your-handle"
          />
        </label>
        <label>
          X URL
          <input
            type="url"
            value={sharedProfiles.x}
            onChange={e => setSharedProfiles(prev => ({ ...prev, x: e.target.value }))}
            placeholder="https://x.com/your-handle"
          />
        </label>
        <label>
          YouTube URL
          <input
            type="url"
            value={sharedProfiles.youtube}
            onChange={e => setSharedProfiles(prev => ({ ...prev, youtube: e.target.value }))}
            placeholder="https://www.youtube.com/@your-channel"
          />
        </label>
        <label>
          Blog URL
          <input
            type="url"
            value={sharedProfiles.blog}
            onChange={e => setSharedProfiles(prev => ({ ...prev, blog: e.target.value }))}
            placeholder="https://blog.example.com"
          />
        </label>
        <label>
          Website URL
          <input
            type="url"
            value={sharedProfiles.website}
            onChange={e => setSharedProfiles(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://example.com"
          />
        </label>
        <button type="submit" disabled={savingSharedProfiles}>
          {savingSharedProfiles ? 'Saving…' : 'Save Shared Profile Links'}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
    </div>
  )
}
