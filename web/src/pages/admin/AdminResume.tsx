import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'

type ResumeUrls = { en: string; ja: string }
type Lang = 'en' | 'ja'
type Bilingual = { en: string; ja: string }
type EditableSection = {
  id: string
  title_en: string
  title_ja: string
  items_en_text: string
  items_ja_text: string
}

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `section-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parseList = (text: string) =>
  text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

const stringifyList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .map(item => (typeof item === 'string' ? item.trim() : String(item ?? '')))
      .filter(Boolean)
      .join('\n')
  }
  return typeof value === 'string' ? value : ''
}

export default function AdminResume() {
  const [urls, setUrls] = useState<ResumeUrls>({ en: '', ja: '' })
  const [summary, setSummary] = useState<Bilingual>({ en: '', ja: '' })
  const [sections, setSections] = useState<EditableSection[]>([])
  const [uploading, setUploading] = useState<{ [key in Lang]: boolean }>({ en: false, ja: false })
  const [savingSummary, setSavingSummary] = useState(false)
  const [savingSections, setSavingSections] = useState(false)
  const [sectionsDirty, setSectionsDirty] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'public', 'resume'))
        if (snap.exists()) {
          const data = snap.data()
          setUrls({
            en: typeof data.url_en === 'string' ? data.url_en : '',
            ja: typeof data.url_ja === 'string' ? data.url_ja : ''
          })
          setSummary({
            en: typeof data.summary_en === 'string'
              ? data.summary_en
              : (typeof data.summary === 'string' ? data.summary : ''),
            ja: typeof data.summary_ja === 'string'
              ? data.summary_ja
              : (typeof data.summary === 'string' ? data.summary : '')
          })
          const rawSections = Array.isArray((data as any).sections) ? (data as any).sections : []
          setSections(
            rawSections.map((section: any) => {
              const idValue = typeof section?.id === 'string' && section.id.trim()
                ? section.id
                : createId()
              return {
                id: idValue,
                title_en: typeof section?.title_en === 'string'
                  ? section.title_en
                  : (typeof section?.title === 'string' ? section.title : ''),
                title_ja: typeof section?.title_ja === 'string' ? section.title_ja : '',
                items_en_text: stringifyList(section?.items_en ?? section?.items),
                items_ja_text: stringifyList(section?.items_ja ?? section?.items)
              }
            })
          )
          setSectionsDirty(false)
        } else {
          setSections([])
        }
      } catch (err: any) {
        console.error(err)
        setError(err?.message || 'Failed to load resume content.')
      }
    }
    load()
  }, [])

  async function handleUpload(lang: Lang, file: File) {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }
    setError(null)
    setMessage(null)
    setUploading(prev => ({ ...prev, [lang]: true }))
    try {
      const storageRef = ref(storage, `resumes/${lang}-${Date.now()}.pdf`)
      await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(storageRef)
      await setDoc(doc(db, 'public', 'resume'), { [`url_${lang}`]: downloadURL }, { merge: true })
      setUrls(prev => ({ ...prev, [lang]: downloadURL }))
      setMessage(`Uploaded ${lang === 'en' ? 'English' : '日本語'} resume.`)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(prev => ({ ...prev, [lang]: false }))
    }
  }

  function onFileChange(lang: Lang) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleUpload(lang, file)
      event.target.value = ''
    }
  }

  async function saveSummary(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSavingSummary(true)
    setError(null)
    setMessage(null)
    try {
      const next = {
        en: summary.en.trim(),
        ja: summary.ja.trim()
      }
      await setDoc(doc(db, 'public', 'resume'), {
        summary_en: next.en,
        summary_ja: next.ja,
        summary: next.en
      }, { merge: true })
      setSummary(next)
      setMessage('Saved resume summary.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to save summary.')
    } finally {
      setSavingSummary(false)
    }
  }

  async function saveSections() {
    setSavingSections(true)
    setError(null)
    setMessage(null)
    try {
      const normalized = sections.map(section => {
        const titleEn = section.title_en.trim()
        const titleJa = section.title_ja.trim()
        const itemsEn = parseList(section.items_en_text)
        const itemsJa = parseList(section.items_ja_text)
        return {
          id: section.id,
          title_en: titleEn,
          title_ja: titleJa,
          title: titleEn,
          items_en: itemsEn,
          items_ja: itemsJa,
          items: itemsEn
        }
      })
      await setDoc(doc(db, 'public', 'resume'), { sections: normalized }, { merge: true })
      setSections(
        normalized.map(section => ({
          id: section.id,
          title_en: section.title_en,
          title_ja: section.title_ja,
          items_en_text: section.items_en.join('\n'),
          items_ja_text: section.items_ja.join('\n')
        }))
      )
      setSectionsDirty(false)
      setMessage('Saved resume sections.')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to save sections.')
    } finally {
      setSavingSections(false)
    }
  }

  function addSection() {
    setSections(prev => [
      ...prev,
      {
        id: createId(),
        title_en: '',
        title_ja: '',
        items_en_text: '',
        items_ja_text: ''
      }
    ])
    setSectionsDirty(true)
  }

  function updateSection(id: string, key: keyof EditableSection, value: string) {
    setSections(prev =>
      prev.map(section => (section.id === id ? { ...section, [key]: value } : section))
    )
    setSectionsDirty(true)
  }

  function removeSection(id: string) {
    if (!confirm('Remove this section?')) return
    setSections(prev => prev.filter(section => section.id !== id))
    setSectionsDirty(true)
  }

  return (
    <div className="stack">
      <h2>Resume Content</h2>

      <form className="card form" onSubmit={saveSummary}>
        <h3>Résumé Summary</h3>
        <p>Use a short introduction to highlight your focus areas or role.</p>
        <label>
          Summary (English)
          <textarea
            value={summary.en}
            onChange={e => setSummary(prev => ({ ...prev, en: e.target.value }))}
            rows={4}
          />
        </label>
        <label>
          サマリー（日本語）
          <textarea
            value={summary.ja}
            onChange={e => setSummary(prev => ({ ...prev, ja: e.target.value }))}
            rows={4}
          />
        </label>
        <button type="submit" disabled={savingSummary}>
          {savingSummary ? 'Saving…' : 'Save Summary'}
        </button>
      </form>

      <section className="card form">
        <h3>Content Sections</h3>
        <p>Add sections like Experience or Skills. Enter one bullet per line.</p>
        {sections.length === 0 && <p className="muted">No sections yet. Add your first section below.</p>}
        <div className="section-editors">
          {sections.map((section, index) => (
            <div key={section.id} className="section-editor">
              <div className="section-editor-header">
                <h4>Section {index + 1}</h4>
                <button type="button" className="danger" onClick={() => removeSection(section.id)}>
                  Delete
                </button>
              </div>
              <label>
                Title (English)
                <input
                  value={section.title_en}
                  onChange={e => updateSection(section.id, 'title_en', e.target.value)}
                />
              </label>
              <label>
                タイトル（日本語）
                <input
                  value={section.title_ja}
                  onChange={e => updateSection(section.id, 'title_ja', e.target.value)}
                />
              </label>
              <label>
                Bullets (English)
                <textarea
                  value={section.items_en_text}
                  onChange={e => updateSection(section.id, 'items_en_text', e.target.value)}
                  rows={4}
                  placeholder="Senior Product Designer at Cycle — Led end-to-end redesign…"
                />
              </label>
              <label>
                箇条書き（日本語）
                <textarea
                  value={section.items_ja_text}
                  onChange={e => updateSection(section.id, 'items_ja_text', e.target.value)}
                  rows={4}
                />
              </label>
            </div>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={addSection}>
            Add Section
          </button>
          <button type="button" onClick={saveSections} disabled={savingSections}>
            {savingSections ? 'Saving…' : 'Save Sections'}
          </button>
        </div>
        {sectionsDirty && <p className="muted">You have unsaved section changes.</p>}
      </section>

      <section className="card form">
        <h3>Résumé PDFs</h3>
        <p>Optional downloadable PDFs for each language.</p>
        <div className="resume-upload-grid">
          <div>
            <h4>English Resume</h4>
            <p>Upload a PDF to make it available on the English site.</p>
            {urls.en && (
              <p>
                Current file:&nbsp;
                <a href={urls.en} target="_blank" rel="noopener noreferrer">
                  Download
                </a>
              </p>
            )}
            <label>
              Upload PDF
              <input
                type="file"
                accept="application/pdf"
                onChange={onFileChange('en')}
                disabled={uploading.en}
              />
            </label>
            {uploading.en && <p>Uploading English resume…</p>}
          </div>
          <div>
            <h4>日本語の履歴書</h4>
            <p>PDF をアップロードすると日本語サイトに表示されます。</p>
            {urls.ja && (
              <p>
                現在のファイル:&nbsp;
                <a href={urls.ja} target="_blank" rel="noopener noreferrer">
                  ダウンロード
                </a>
              </p>
            )}
            <label>
              PDF をアップロード
              <input
                type="file"
                accept="application/pdf"
                onChange={onFileChange('ja')}
                disabled={uploading.ja}
              />
            </label>
            {uploading.ja && <p>日本語の履歴書をアップロード中…</p>}
          </div>
        </div>
      </section>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  )
}
