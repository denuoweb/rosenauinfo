import { FormEvent, useEffect, useState } from 'react'
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { resolveSharedProfileCopy } from '../../lib/profileContent'

type Bilingual = { en: string; ja: string }
type Lang = 'en' | 'ja'
type EditableLink = {
  id: string
  label: string
  url: string
}
type ProjectOption = {
  id: string
  title: string
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

const parseLineList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map(item => pick(item))
      .filter(Boolean)
  }

  return pick(value)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export default function AdminHome() {
  const [siteName, setSiteName] = useState<Bilingual>({ en: '', ja: '' })
  const [footerNote, setFooterNote] = useState('')
  const [headline, setHeadline] = useState<Bilingual>({ en: '', ja: '' })
  const [supporting, setSupporting] = useState<Bilingual>({ en: '', ja: '' })
  const [secondary, setSecondary] = useState<Bilingual>({ en: '', ja: '' })
  const [links, setLinks] = useState<{ [key in Lang]: EditableLink[] }>({ en: [], ja: [] })
  const [featuredProjectIdsText, setFeaturedProjectIdsText] = useState('')
  const [availableProjects, setAvailableProjects] = useState<ProjectOption[]>([])
  const [contactEmail, setContactEmail] = useState('')
  const [profileLinks, setProfileLinks] = useState<SiteProfiles>({
    github: '',
    linkedin: '',
    x: '',
    youtube: '',
    blog: '',
    website: ''
  })
  const [savingSite, setSavingSite] = useState(false)
  const [savingFooter, setSavingFooter] = useState(false)
  const [savingHero, setSavingHero] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingFeaturedProjects, setSavingFeaturedProjects] = useState(false)
  const [savingContactEmail, setSavingContactEmail] = useState(false)
  const [savingProfiles, setSavingProfiles] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [siteSnap, homeSnap, projectsSnap] = await Promise.all([
        getDoc(doc(db, 'public', 'site')),
        getDoc(doc(db, 'public', 'home')),
        getDocs(query(collection(db, 'projects'), orderBy('order', 'asc')))
      ])

      if (siteSnap.exists()) {
        const data = siteSnap.data()
        setSiteName({
          en: pick(data.name_en) || pick(data.name),
          ja: pick(data.name_ja) || pick(data.name)
        })
        setFooterNote(pick(data.footerNote) || pick(data.footer_note))
        setContactEmail(
          pick(data.contactEmail) || pick(data.contact_email) || pick(data.email)
        )
        setProfileLinks({
          github: pick(data.githubUrl) || pick(data.github_url) || pick(data.github),
          linkedin: pick(data.linkedinUrl) || pick(data.linkedin_url) || pick(data.linkedin),
          x: pick(data.xUrl) || pick(data.x_url) || pick(data.twitterUrl) || pick(data.twitter_url) || pick(data.twitter),
          youtube: pick(data.youtubeUrl) || pick(data.youtube_url) || pick(data.youtube),
          blog: pick(data.blogUrl) || pick(data.blog_url) || pick(data.blog),
          website: pick(data.websiteUrl) || pick(data.website_url) || pick(data.website)
        })
      }

      if (homeSnap.exists()) {
        const data = homeSnap.data()
        const sharedProfile = resolveSharedProfileCopy(data)
        setHeadline(sharedProfile.headline)
        setSupporting(sharedProfile.supporting)
        setSecondary(sharedProfile.secondarySpecialization)
        setLinks({
          en: parseLinks(data.links_en),
          ja: parseLinks(data.links_ja)
        })
        setFeaturedProjectIdsText(parseLineList(data.featured_project_ids ?? data.featured_projects_en).join('\n'))
      } else {
        const sharedProfile = resolveSharedProfileCopy(null)
        setHeadline(sharedProfile.headline)
        setSupporting(sharedProfile.supporting)
        setSecondary(sharedProfile.secondarySpecialization)
      }

      setAvailableProjects(
        projectsSnap.docs.map(projectDoc => {
          const data = projectDoc.data()
          return {
            id: projectDoc.id,
            title: pick(data.title_en) || pick(data.title) || projectDoc.id
          }
        })
      )
    }

    load()
  }, [])

  async function saveSiteName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSite(true)
    try {
      await setDoc(doc(db, 'public', 'site'), {
        name_en: siteName.en.trim(),
        name_ja: siteName.ja.trim(),
        name: siteName.en.trim()
      }, { merge: true })
      setMessage('Updated site name.')
    } finally {
      setSavingSite(false)
    }
  }

  async function saveFooter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingFooter(true)
    try {
      const trimmed = footerNote.trim()
      await setDoc(doc(db, 'public', 'site'), {
        footerNote: trimmed || null
      }, { merge: true })
      setFooterNote(trimmed)
      setMessage(trimmed ? 'Updated footer note.' : 'Cleared footer note.')
    } finally {
      setSavingFooter(false)
    }
  }

  async function saveHero(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingHero(true)
    try {
      const nextHeadline = {
        en: headline.en.trim(),
        ja: headline.ja.trim()
      }
      const nextSupporting = {
        en: supporting.en.trim(),
        ja: supporting.ja.trim()
      }
      const nextSecondary = {
        en: secondary.en.trim(),
        ja: secondary.ja.trim()
      }
      await setDoc(doc(db, 'public', 'home'), {
        headline_en: nextHeadline.en,
        headline_ja: nextHeadline.ja,
        headline: nextHeadline.en,
        supporting_en: nextSupporting.en,
        supporting_ja: nextSupporting.ja,
        supporting: nextSupporting.en,
        secondary_en: nextSecondary.en,
        secondary_ja: nextSecondary.ja,
        secondary: nextSecondary.en
      }, { merge: true })
      setHeadline(nextHeadline)
      setSupporting(nextSupporting)
      setSecondary(nextSecondary)
      setMessage('Updated homepage hero copy.')
    } finally {
      setSavingHero(false)
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
      await setDoc(doc(db, 'public', 'home'), {
        links_en: next.en,
        links_ja: next.ja
      }, { merge: true })
      setLinks({
        en: parseLinks(next.en),
        ja: parseLinks(next.ja)
      })
      setMessage('Updated homepage links.')
    } finally {
      setSavingLinks(false)
    }
  }

  async function saveFeaturedProjects(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingFeaturedProjects(true)
    try {
      const nextIds = parseLineList(featuredProjectIdsText)
      await setDoc(doc(db, 'public', 'home'), {
        featured_project_ids: nextIds
      }, { merge: true })
      setFeaturedProjectIdsText(nextIds.join('\n'))
      setMessage('Updated featured projects.')
    } finally {
      setSavingFeaturedProjects(false)
    }
  }

  async function saveContact(e: FormEvent<HTMLFormElement>) {
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

  async function saveProfiles(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfiles(true)
    try {
      const next = {
        github: profileLinks.github.trim(),
        linkedin: profileLinks.linkedin.trim(),
        x: profileLinks.x.trim(),
        youtube: profileLinks.youtube.trim(),
        blog: profileLinks.blog.trim(),
        website: profileLinks.website.trim()
      }
      await setDoc(doc(db, 'public', 'site'), {
        github_url: next.github || null,
        linkedin_url: next.linkedin || null,
        x_url: next.x || null,
        youtube_url: next.youtube || null,
        blog_url: next.blog || null,
        website_url: next.website || null
      }, { merge: true })
      setProfileLinks(next)
      setMessage('Updated profile links.')
    } finally {
      setSavingProfiles(false)
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
      <h2>Home &amp; Site</h2>

      <form className="card form" onSubmit={saveSiteName}>
        <h3>Site Name</h3>
        <p>This name appears in the navigation bar, page titles, and footer fallback.</p>
        <label>
          Name (English)
          <input value={siteName.en} onChange={e => setSiteName(prev => ({ ...prev, en: e.target.value }))} required />
        </label>
        <label>
          Name (日本語)
          <input value={siteName.ja} onChange={e => setSiteName(prev => ({ ...prev, ja: e.target.value }))} />
        </label>
        <button type="submit" disabled={savingSite}>
          {savingSite ? 'Saving…' : 'Save Name'}
        </button>
      </form>

      <form className="card form" onSubmit={saveFooter}>
        <h3>Footer Note</h3>
        <p>Optional custom footer copy. Leave blank to fall back to the site name and current year.</p>
        <label>
          Footer note
          <input
            value={footerNote}
            onChange={e => setFooterNote(e.target.value)}
            placeholder="Professional portfolio centered on shipped systems."
          />
        </label>
        <button type="submit" disabled={savingFooter}>
          {savingFooter ? 'Saving…' : 'Save Footer'}
        </button>
      </form>

      <form className="card form" onSubmit={saveHero}>
        <h3>Homepage Hero</h3>
        <p>Edit the shared role/headline copy shown across the homepage and other public pages.</p>
        <label>
          Headline (English)
          <textarea
            value={headline.en}
            onChange={e => setHeadline(prev => ({ ...prev, en: e.target.value }))}
            rows={3}
          />
        </label>
        <label>
          見出し（日本語）
          <textarea
            value={headline.ja}
            onChange={e => setHeadline(prev => ({ ...prev, ja: e.target.value }))}
            rows={3}
          />
        </label>
        <label>
          Supporting copy (English)
          <textarea
            value={supporting.en}
            onChange={e => setSupporting(prev => ({ ...prev, en: e.target.value }))}
            rows={4}
          />
        </label>
        <label>
          補足テキスト（日本語）
          <textarea
            value={supporting.ja}
            onChange={e => setSupporting(prev => ({ ...prev, ja: e.target.value }))}
            rows={4}
          />
        </label>
        <label>
          Secondary specialization (English)
          <textarea
            value={secondary.en}
            onChange={e => setSecondary(prev => ({ ...prev, en: e.target.value }))}
            rows={3}
          />
        </label>
        <label>
          副次的な専門領域（日本語）
          <textarea
            value={secondary.ja}
            onChange={e => setSecondary(prev => ({ ...prev, ja: e.target.value }))}
            rows={3}
          />
        </label>
        <button type="submit" disabled={savingHero}>
          {savingHero ? 'Saving…' : 'Save Hero Copy'}
        </button>
      </form>

      <form className="card form" onSubmit={saveLinks}>
        <h3>Homepage Links</h3>
        <p>Only rows with both a label and URL are published. LinkedIn links are ignored on the homepage hero.</p>

        <section className="stack" aria-labelledby="homepage-links-en-heading">
          <div className="section-editor-header">
            <h4 id="homepage-links-en-heading">Links (English)</h4>
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
                    placeholder="GitHub"
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('en', link.id, 'url', e.target.value)}
                    placeholder="https://github.com/your-handle"
                  />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="stack" aria-labelledby="homepage-links-ja-heading">
          <div className="section-editor-header">
            <h4 id="homepage-links-ja-heading">リンク（日本語）</h4>
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
                    placeholder="GitHub"
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('ja', link.id, 'url', e.target.value)}
                    placeholder="https://github.com/your-handle"
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

      <form className="card form" onSubmit={saveFeaturedProjects}>
        <h3>Featured Projects</h3>
        <p>Control the projects shown on the homepage. Enter one project document ID per line, in display order.</p>
        <label>
          Featured project IDs
          <textarea
            value={featuredProjectIdsText}
            onChange={e => setFeaturedProjectIdsText(e.target.value)}
            rows={5}
            placeholder="crowdpm-platform&#10;quest-by-cycle&#10;arm64-adk"
          />
        </label>
        {availableProjects.length > 0 && (
          <p className="muted">
            Available IDs: {availableProjects.map(project => `${project.id} (${project.title})`).join(', ')}
          </p>
        )}
        <button type="submit" disabled={savingFeaturedProjects}>
          {savingFeaturedProjects ? 'Saving…' : 'Save Featured Projects'}
        </button>
      </form>

      <form className="card form" onSubmit={saveContact}>
        <h3>Contact Email</h3>
        <p>This email appears in the site navigation and on the contact page.</p>
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
          {savingContactEmail ? 'Saving…' : 'Save Email'}
        </button>
      </form>

      <form className="card form" onSubmit={saveProfiles}>
        <h3>Profile Links</h3>
        <p>These links are used across public pages and structured data (`sameAs`).</p>
        <label>
          GitHub URL
          <input
            type="url"
            value={profileLinks.github}
            onChange={e => setProfileLinks(prev => ({ ...prev, github: e.target.value }))}
            placeholder="https://github.com/your-handle"
          />
        </label>
        <label>
          LinkedIn URL
          <input
            type="url"
            value={profileLinks.linkedin}
            onChange={e => setProfileLinks(prev => ({ ...prev, linkedin: e.target.value }))}
            placeholder="https://www.linkedin.com/in/your-handle"
          />
        </label>
        <label>
          X URL
          <input
            type="url"
            value={profileLinks.x}
            onChange={e => setProfileLinks(prev => ({ ...prev, x: e.target.value }))}
            placeholder="https://x.com/your-handle"
          />
        </label>
        <label>
          YouTube URL
          <input
            type="url"
            value={profileLinks.youtube}
            onChange={e => setProfileLinks(prev => ({ ...prev, youtube: e.target.value }))}
            placeholder="https://www.youtube.com/@your-channel"
          />
        </label>
        <label>
          Blog URL
          <input
            type="url"
            value={profileLinks.blog}
            onChange={e => setProfileLinks(prev => ({ ...prev, blog: e.target.value }))}
            placeholder="https://blog.example.com"
          />
        </label>
        <label>
          Website URL
          <input
            type="url"
            value={profileLinks.website}
            onChange={e => setProfileLinks(prev => ({ ...prev, website: e.target.value }))}
            placeholder="https://example.com"
          />
        </label>
        <button type="submit" disabled={savingProfiles}>
          {savingProfiles ? 'Saving…' : 'Save Profile Links'}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
    </div>
  )
}
