import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

type EditableProject = {
  id: string
  title_en: string
  title_ja: string
  description_en: string
  description_ja: string
  url: string
  repo: string
  order: number
  tags_en_text: string
  tags_ja_text: string
  cover: string
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<EditableProject[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [newProject, setNewProject] = useState({
    title_en: '',
    title_ja: '',
    description_en: '',
    description_ja: '',
    url: '',
    repo: '',
    cover: '',
    tags_en_text: '',
    tags_ja_text: '',
    order: 0
  })

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, 'projects'), orderBy('order', 'asc')))
        const items: EditableProject[] = snap.docs.map(d => {
          const data = d.data()
          const tagsEn = (data.tags_en as string[]) || (data.tags as string[]) || []
          const tagsJa = (data.tags_ja as string[]) || []
          return {
            id: d.id,
            title_en: (data.title_en as string) || (data.title as string) || '',
            title_ja: (data.title_ja as string) || '',
            description_en: (data.description_en as string) || (data.description as string) || '',
            description_ja: (data.description_ja as string) || '',
            url: (data.url as string) || '',
            repo: (data.repo as string) || (data.github as string) || '',
            order: Number(data.order ?? 0),
            tags_en_text: tagsEn.join(', '),
            tags_ja_text: tagsJa.join(', '),
            cover: (data.cover as string) || (data.image as string) || (data.thumbnail as string) || ''
          }
        })
        setProjects(items)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function updateLocalProject(id: string, key: keyof EditableProject, value: string | number) {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, [key]: value } : p)))
  }

  async function saveProject(project: EditableProject) {
    setSavingId(project.id)
    const url = project.url.trim()
    const cover = project.cover.trim()
    const tagsEn = project.tags_en_text
      ? project.tags_en_text.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const tagsJa = project.tags_ja_text
      ? project.tags_ja_text.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const payload = {
      title_en: project.title_en,
      title_ja: project.title_ja,
      title: project.title_en,
      description_en: project.description_en,
      description_ja: project.description_ja,
      description: project.description_en,
      order: Number(project.order ?? 0),
      url: url || null,
      repo: project.repo.trim() || null,
      tags_en: tagsEn,
      tags_ja: tagsJa,
      tags: tagsEn,
      cover: cover || null,
      image: cover || null,
      thumbnail: cover || null
    }
    try {
      await updateDoc(doc(db, 'projects', project.id), payload)
      setProjects(prev =>
        prev.map(p =>
          p.id === project.id
            ? {
                ...p,
                ...project,
                url,
                repo: project.repo.trim(),
                cover,
                tags_en_text: tagsEn.join(', '),
                tags_ja_text: tagsJa.join(', ')
              }
            : p
        )
      )
    } finally {
      setSavingId(null)
    }
  }

  async function removeProject(id: string) {
    if (!confirm('Delete this project?')) return
    await deleteDoc(doc(db, 'projects', id))
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  async function createProject(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const url = newProject.url.trim()
    const cover = newProject.cover.trim()
    const tagsEn = newProject.tags_en_text
      ? newProject.tags_en_text.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const tagsJa = newProject.tags_ja_text
      ? newProject.tags_ja_text.split(',').map(t => t.trim()).filter(Boolean)
      : []
    const payload = {
      title_en: newProject.title_en,
      title_ja: newProject.title_ja,
      title: newProject.title_en,
      description_en: newProject.description_en,
      description_ja: newProject.description_ja,
      description: newProject.description_en,
      order: Number(newProject.order ?? 0),
      url: url || null,
      repo: newProject.repo.trim() || null,
      tags_en: tagsEn,
      tags_ja: tagsJa,
      tags: tagsEn,
      cover: cover || null,
      image: cover || null,
      thumbnail: cover || null
    }
    const ref = await addDoc(collection(db, 'projects'), payload)
    setProjects(prev => [
      ...prev,
      {
        id: ref.id,
        title_en: newProject.title_en,
        title_ja: newProject.title_ja,
        description_en: newProject.description_en,
        description_ja: newProject.description_ja,
        url,
        repo: newProject.repo.trim(),
        order: newProject.order,
        cover,
        tags_en_text: tagsEn.join(', '),
        tags_ja_text: tagsJa.join(', ')
      }
    ])
    setNewProject({
      title_en: '',
      title_ja: '',
      description_en: '',
      description_ja: '',
      url: '',
      repo: '',
      cover: '',
      tags_en_text: '',
      tags_ja_text: '',
      order: 0
    })
  }

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [projects]
  )

  return (
    <div className="stack">
      <h2>Projects</h2>
      <form className="card form" onSubmit={createProject}>
        <h3>Add Project</h3>
        <label>
          Title (English)
          <input value={newProject.title_en} onChange={e => setNewProject({ ...newProject, title_en: e.target.value })} required />
        </label>
        <label>
          Title (日本語)
          <input value={newProject.title_ja} onChange={e => setNewProject({ ...newProject, title_ja: e.target.value })} />
        </label>
        <label>
          Description (English)
          <textarea value={newProject.description_en} onChange={e => setNewProject({ ...newProject, description_en: e.target.value })} rows={3} required />
        </label>
        <label>
          説明（日本語）
          <textarea value={newProject.description_ja} onChange={e => setNewProject({ ...newProject, description_ja: e.target.value })} rows={3} />
        </label>
        <label>
          URL
          <input value={newProject.url} onChange={e => setNewProject({ ...newProject, url: e.target.value })} placeholder="https://…" />
        </label>
        <label>
          Repository URL
          <input value={newProject.repo} onChange={e => setNewProject({ ...newProject, repo: e.target.value })} placeholder="https://github.com/…" />
        </label>
        <label>
          Cover Image URL
          <input
            value={newProject.cover}
            onChange={e => setNewProject({ ...newProject, cover: e.target.value })}
            placeholder="https://…"
          />
        </label>
        {newProject.cover && (
          <div className="project-cover-preview">
            <img src={newProject.cover} alt="Cover preview" />
          </div>
        )}
        <label>
          Order
          <input type="number" value={newProject.order} onChange={e => setNewProject({ ...newProject, order: Number(e.target.value) })} />
        </label>
        <label>
          Tags EN (comma separated)
          <input value={newProject.tags_en_text} onChange={e => setNewProject({ ...newProject, tags_en_text: e.target.value })} />
        </label>
        <label>
          Tags JP (カンマ区切り)
          <input value={newProject.tags_ja_text} onChange={e => setNewProject({ ...newProject, tags_ja_text: e.target.value })} />
        </label>
        <button type="submit">Create Project</button>
      </form>

      {loading ? <p>Loading projects…</p> : (
        <ul className="stack">
          {sortedProjects.map(project => (
            <li key={project.id} className="card form">
              <h3>{project.title_en || project.title_ja || 'Untitled Project'}</h3>
              <label>
                Title (English)
                <input value={project.title_en} onChange={e => updateLocalProject(project.id, 'title_en', e.target.value)} />
              </label>
              <label>
                Title (日本語)
                <input value={project.title_ja} onChange={e => updateLocalProject(project.id, 'title_ja', e.target.value)} />
              </label>
              <label>
                Description (English)
                <textarea value={project.description_en} rows={3} onChange={e => updateLocalProject(project.id, 'description_en', e.target.value)} />
              </label>
              <label>
                説明（日本語）
                <textarea value={project.description_ja} rows={3} onChange={e => updateLocalProject(project.id, 'description_ja', e.target.value)} />
              </label>
              <label>
                URL
                <input value={project.url} onChange={e => updateLocalProject(project.id, 'url', e.target.value)} />
              </label>
              <label>
                Repository URL
                <input value={project.repo} onChange={e => updateLocalProject(project.id, 'repo', e.target.value)} placeholder="https://github.com/…" />
              </label>
              <label>
                Cover Image URL
                <input
                  value={project.cover}
                  onChange={e => updateLocalProject(project.id, 'cover', e.target.value)}
                  placeholder="https://…"
                />
              </label>
              {project.cover && (
                <div className="project-cover-preview">
                  <img src={project.cover} alt="Cover preview" />
                </div>
              )}
              <label>
                Order
                <input
                  type="number"
                  value={project.order}
                  onChange={e => updateLocalProject(project.id, 'order', Number(e.target.value))}
                />
              </label>
              <label>
                Tags EN (comma separated)
                <input
                  value={project.tags_en_text}
                  onChange={e => updateLocalProject(project.id, 'tags_en_text', e.target.value)}
                />
              </label>
              <label>
                Tags JP (カンマ区切り)
                <input
                  value={project.tags_ja_text}
                  onChange={e => updateLocalProject(project.id, 'tags_ja_text', e.target.value)}
                />
              </label>
              <div className="actions">
                <button type="button" onClick={() => saveProject(project)} disabled={savingId === project.id}>
                  {savingId === project.id ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" className="danger" onClick={() => removeProject(project.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
