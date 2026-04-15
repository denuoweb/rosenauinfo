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

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

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

export default function AdminHome() {
  const [siteName, setSiteName] = useState<Bilingual>({ en: '', ja: '' })
  const [blurb, setBlurb] = useState<Bilingual>({ en: '', ja: '' })
  const [links, setLinks] = useState<{ [key in Lang]: EditableLink[] }>({ en: [], ja: [] })
  const [contactEmail, setContactEmail] = useState('')
  const [profileLinks, setProfileLinks] = useState({ github: '', linkedin: '' })
  const [savingSite, setSavingSite] = useState(false)
  const [savingBlurb, setSavingBlurb] = useState(false)
  const [savingLinks, setSavingLinks] = useState(false)
  const [savingContactEmail, setSavingContactEmail] = useState(false)
  const [savingProfiles, setSavingProfiles] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const siteSnap = await getDoc(doc(db, 'public', 'site'))
      if (siteSnap.exists()) {
        const data = siteSnap.data()
        setSiteName({
          en: (data.name_en as string) || (data.name as string) || '',
          ja: (data.name_ja as string) || (data.name as string) || ''
        })
        setContactEmail(
          ((data.contactEmail as string) || (data.contact_email as string) || (data.email as string) || '').trim()
        )
        setProfileLinks({
          github: ((data.githubUrl as string) || (data.github_url as string) || (data.github as string) || '').trim(),
          linkedin: ((data.linkedinUrl as string) || (data.linkedin_url as string) || (data.linkedin as string) || '').trim()
        })
      }
      const homeSnap = await getDoc(doc(db, 'public', 'home'))
      if (homeSnap.exists()) {
        const data = homeSnap.data()
        setBlurb({
          en: (data.blurb_en as string) || (data.blurb as string) || '',
          ja: (data.blurb_ja as string) || (data.blurb as string) || ''
        })
        setLinks({
          en: parseLinks(data.links_en),
          ja: parseLinks(data.links_ja)
        })
      }
    }
    load()
  }, [])

  async function saveSiteName(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSite(true)
    try {
      await setDoc(doc(db, 'public', 'site'), {
        name_en: siteName.en,
        name_ja: siteName.ja,
        name: siteName.en
      }, { merge: true })
      setMessage('Updated site name')
    } finally {
      setSavingSite(false)
    }
  }

  async function saveBlurb(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingBlurb(true)
    try {
      await setDoc(doc(db, 'public', 'home'), {
        blurb_en: blurb.en,
        blurb_ja: blurb.ja,
        blurb: blurb.en
      }, { merge: true })
      setMessage('Updated homepage blurb')
    } finally {
      setSavingBlurb(false)
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
      setMessage('Updated homepage links')
    } finally {
      setSavingLinks(false)
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
      setMessage(trimmed ? 'Updated contact email' : 'Cleared contact email')
    } finally {
      setSavingContactEmail(false)
    }
  }

  async function saveProfiles(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingProfiles(true)
    try {
      const github = profileLinks.github.trim()
      const linkedin = profileLinks.linkedin.trim()
      await setDoc(doc(db, 'public', 'site'), {
        github_url: github || null,
        linkedin_url: linkedin || null
      }, { merge: true })
      setProfileLinks({ github, linkedin })
      setMessage('Updated profile links')
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
      <h2>Home &amp; Profile</h2>
      <form className="card form" onSubmit={saveSiteName}>
        <h3>Site Name</h3>
        <p>This name appears in the navigation bar and footer.</p>
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

      <form className="card form" onSubmit={saveBlurb}>
        <h3>Homepage Blurb</h3>
        <label>
          Introduction (English)
          <textarea value={blurb.en} onChange={e => setBlurb(prev => ({ ...prev, en: e.target.value }))} rows={4} />
        </label>
        <label>
          紹介文（日本語）
          <textarea value={blurb.ja} onChange={e => setBlurb(prev => ({ ...prev, ja: e.target.value }))} rows={4} />
        </label>
        <button type="submit" disabled={savingBlurb}>
          {savingBlurb ? 'Saving…' : 'Save Blurb'}
        </button>
      </form>

      <form className="card form" onSubmit={saveLinks}>
        <h3>Homepage Links</h3>
        <p>Only rows with both a label and URL are published, so empty LinkedIn rows will not show on the site.</p>

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
                    placeholder="LinkedIn"
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('en', link.id, 'url', e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
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
                    placeholder="LinkedIn"
                  />
                </label>
                <label>
                  URL
                  <input
                    value={link.url}
                    onChange={e => updateLink('ja', link.id, 'url', e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
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

      <form className="card form" onSubmit={saveContact}>
        <h3>Contact Email</h3>
        <p>This email appears in the site navigation as a mailto link.</p>
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
        <p>These links are used on About/Contact pages and in structured data (`sameAs`).</p>
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
        <button type="submit" disabled={savingProfiles}>
          {savingProfiles ? 'Saving…' : 'Save Profile Links'}
        </button>
      </form>

      {message && <p className="success">{message}</p>}
    </div>
  )
}
