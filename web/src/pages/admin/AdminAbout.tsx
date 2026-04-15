import { FormEvent, useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { ABOUT_DEFAULTS, resolveSharedProfileCopy } from '../../lib/profileContent'

type Bilingual = { en: string; ja: string }
type Lang = 'en' | 'ja'
type EditableLink = {
  id: string
  label: string
  url: string
}
type AboutSectionKey = 'what_i_do' | 'what_ive_shipped' | 'what_i_work_well_on'
type EditableAboutSection = {
  key: AboutSectionKey
  label: string
  title_en: string
  title_ja: string
  items_en_text: string
  items_ja_text: string
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

const defaultSections: EditableAboutSection[] = [
  {
    key: 'what_i_do',
    label: 'What I do',
    title_en: '',
    title_ja: '',
    items_en_text: '',
    items_ja_text: ''
  },
  {
    key: 'what_ive_shipped',
    label: "What I've shipped",
    title_en: '',
    title_ja: '',
    items_en_text: '',
    items_ja_text: ''
  },
  {
    key: 'what_i_work_well_on',
    label: 'What I work well on',
    title_en: '',
    title_ja: '',
    items_en_text: '',
    items_ja_text: ''
  }
]

export default function AdminAbout() {
  const [headline, setHeadline] = useState<Bilingual>({ en: '', ja: '' })
  const [intro, setIntro] = useState<Bilingual>({ en: '', ja: '' })
  const [sections, setSections] = useState<EditableAboutSection[]>(defaultSections)
  const [links, setLinks] = useState<{ [key in Lang]: EditableLink[] }>({ en: [], ja: [] })
  const [sharedProfiles, setSharedProfiles] = useState<SiteProfiles>({
    github: '',
    linkedin: '',
    x: '',
    youtube: '',
    blog: '',
    website: ''
  })
  const [savingIntro, setSavingIntro] = useState(false)
  const [savingSections, setSavingSections] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingSharedProfiles, setSavingSharedProfiles] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [aboutSnap, homeSnap, siteSnap] = await Promise.all([
        getDoc(doc(db, 'public', 'about')),
        getDoc(doc(db, 'public', 'home')),
        getDoc(doc(db, 'public', 'site'))
      ])
      const sharedProfile = resolveSharedProfileCopy(homeSnap.exists() ? homeSnap.data() : null)
      const data = aboutSnap.exists() ? aboutSnap.data() : {}
      const siteData = siteSnap.exists() ? siteSnap.data() : {}

      setHeadline({
        en: pick(data.headline_en) || pick(data.headline) || sharedProfile.headline.en,
        ja: pick(data.headline_ja) || pick(data.headline) || sharedProfile.headline.ja
      })
      setIntro({
        en: pick(data.intro_en) || pick(data.intro) || `${sharedProfile.supporting.en} ${sharedProfile.secondarySpecialization.en}`.trim(),
        ja: pick(data.intro_ja) || pick(data.intro) || `${sharedProfile.supporting.ja} ${sharedProfile.secondarySpecialization.ja}`.trim()
      })
      setSections(prev =>
        prev.map((section, index) => ({
          ...section,
          title_en: pick(data[`${section.key}_title_en`]) || ABOUT_DEFAULTS.sections[index].title.en,
          title_ja: pick(data[`${section.key}_title_ja`]) || ABOUT_DEFAULTS.sections[index].title.ja,
          items_en_text: pick(data[`${section.key}_en`]) || ABOUT_DEFAULTS.sections[index].items.en.join('\n'),
          items_ja_text: pick(data[`${section.key}_ja`]) || ABOUT_DEFAULTS.sections[index].items.ja.join('\n')
        }))
      )
      setLinks({
        en: parseLinks(data.links_en ?? data.links),
        ja: parseLinks(data.links_ja ?? data.links)
      })
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

  async function saveIntroCopy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingIntro(true)
    try {
      const nextHeadline = {
        en: headline.en.trim(),
        ja: headline.ja.trim()
      }
      const nextIntro = {
        en: intro.en.trim(),
        ja: intro.ja.trim()
      }
      await setDoc(doc(db, 'public', 'about'), {
        headline_en: nextHeadline.en,
        headline_ja: nextHeadline.ja,
        headline: nextHeadline.en,
        intro_en: nextIntro.en,
        intro_ja: nextIntro.ja,
        intro: nextIntro.en
      }, { merge: true })
      setHeadline(nextHeadline)
      setIntro(nextIntro)
      setMessage('Updated about page intro copy.')
    } finally {
      setSavingIntro(false)
    }
  }

  async function saveSectionCopy(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSections(true)
    try {
      const payload = sections.reduce<Record<string, string>>((accumulator, section) => {
        accumulator[`${section.key}_title_en`] = section.title_en.trim()
        accumulator[`${section.key}_title_ja`] = section.title_ja.trim()
        accumulator[`${section.key}_en`] = section.items_en_text.trim()
        accumulator[`${section.key}_ja`] = section.items_ja_text.trim()
        return accumulator
      }, {})
      await setDoc(doc(db, 'public', 'about'), payload, { merge: true })
      setSections(prev => prev.map(section => ({
        ...section,
        title_en: section.title_en.trim(),
        title_ja: section.title_ja.trim(),
        items_en_text: section.items_en_text.trim(),
        items_ja_text: section.items_ja_text.trim()
      })))
      setMessage('Updated about page sections.')
    } finally {
      setSavingSections(false)
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
      await setDoc(doc(db, 'public', 'about'), {
        links_en: next.en,
        links_ja: next.ja,
        links: next.en
      }, { merge: true })
      setLinks({
        en: parseLinks(next.en),
        ja: parseLinks(next.ja)
      })
      setMessage('Updated about page links.')
    } finally {
      setSavingLinks(false)
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

  function updateSection(key: AboutSectionKey, field: keyof Omit<EditableAboutSection, 'key' | 'label'>, value: string) {
    setSections(prev =>
      prev.map(section => (section.key === key ? { ...section, [field]: value } : section))
    )
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
      <h2>About Page</h2>

      <form className="card form" onSubmit={saveIntroCopy}>
        <h3>Intro Copy</h3>
        <label>
          Headline (English)
          <input
            value={headline.en}
            onChange={e => setHeadline(prev => ({ ...prev, en: e.target.value }))}
          />
        </label>
        <label>
          見出し（日本語）
          <input
            value={headline.ja}
            onChange={e => setHeadline(prev => ({ ...prev, ja: e.target.value }))}
          />
        </label>
        <label>
          Introduction (English)
          <textarea
            value={intro.en}
            onChange={e => setIntro(prev => ({ ...prev, en: e.target.value }))}
            rows={5}
          />
        </label>
        <label>
          紹介文（日本語）
          <textarea
            value={intro.ja}
            onChange={e => setIntro(prev => ({ ...prev, ja: e.target.value }))}
            rows={5}
          />
        </label>
        <button type="submit" disabled={savingIntro}>
          {savingIntro ? 'Saving…' : 'Save Intro Copy'}
        </button>
      </form>

      <form className="card form" onSubmit={saveSectionCopy}>
        <h3>About Sections</h3>
        <p>Each section title and bullet list is editable. Enter one bullet per line.</p>
        <div className="section-editors">
          {sections.map(section => (
            <div key={section.key} className="section-editor">
              <div className="section-editor-header">
                <h4>{section.label}</h4>
              </div>
              <label>
                Title (English)
                <input
                  value={section.title_en}
                  onChange={e => updateSection(section.key, 'title_en', e.target.value)}
                />
              </label>
              <label>
                タイトル（日本語）
                <input
                  value={section.title_ja}
                  onChange={e => updateSection(section.key, 'title_ja', e.target.value)}
                />
              </label>
              <label>
                Bullets (English)
                <textarea
                  value={section.items_en_text}
                  onChange={e => updateSection(section.key, 'items_en_text', e.target.value)}
                  rows={4}
                />
              </label>
              <label>
                箇条書き（日本語）
                <textarea
                  value={section.items_ja_text}
                  onChange={e => updateSection(section.key, 'items_ja_text', e.target.value)}
                  rows={4}
                />
              </label>
            </div>
          ))}
        </div>
        <button type="submit" disabled={savingSections}>
          {savingSections ? 'Saving…' : 'Save Sections'}
        </button>
      </form>

      <form className="card form" onSubmit={saveLinks}>
        <h3>About Page Links</h3>
        <p>These are about-page-specific links. Shared site profile links shown on the public page are editable below.</p>

        <section className="stack" aria-labelledby="about-links-en-heading">
          <div className="section-editor-header">
            <h4 id="about-links-en-heading">Links (English)</h4>
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

        <section className="stack" aria-labelledby="about-links-ja-heading">
          <div className="section-editor-header">
            <h4 id="about-links-ja-heading">リンク（日本語）</h4>
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

      <form className="card form" onSubmit={saveSharedProfiles}>
        <h3>Shared Profile Links</h3>
        <p>These site-level links also appear on the public About page.</p>
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
