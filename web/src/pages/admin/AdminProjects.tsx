import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
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
  github_full_name?: string
  github_id?: number
  github_owner?: string
  github_repo?: string
  github_synced_at?: string
}

type GitHubRepo = {
  id: number
  name: string
  full_name: string
  html_url: string
  description: string | null
  homepage: string | null
  language: string | null
  fork: boolean
  archived: boolean
  stargazers_count: number
  updated_at: string
  pushed_at: string
  owner: { login: string }
  topics?: string[]
}

const defaultGitHubAccounts = ['denuoweb', 'Denuo-Web']
const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28'
}

function normalizeGitHubUsernames(input: string) {
  const items = input
    .split(/[,\n]/)
    .map(item => item.trim())
    .filter(Boolean)
  return Array.from(new Set(items))
}

function extractFullNameFromRepoUrl(url: string) {
  if (!url) return null
  try {
    const target = new URL(url)
    const host = target.hostname.replace(/^www\./, '')
    if (host !== 'github.com') return null
    const parts = target.pathname.replace(/\.git$/i, '').split('/').filter(Boolean)
    if (parts.length < 2) return null
    return `${parts[0]}/${parts[1]}`
  } catch {
    return null
  }
}

function normalizeUrl(value?: string | null) {
  if (!value) return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function buildGitHubCover(repo: GitHubRepo) {
  return `https://opengraph.githubassets.com/1/${repo.full_name}`
}

function buildTags(repo: GitHubRepo) {
  const tags = []
  if (Array.isArray(repo.topics)) tags.push(...repo.topics)
  if (repo.language) tags.push(repo.language)
  return Array.from(new Set(tags.map(tag => tag.trim()).filter(Boolean)))
}

async function fetchReposForUser(username: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = []
  const perPage = 100
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&type=owner&sort=updated`,
      { headers: githubHeaders }
    )
    if (!response.ok) {
      throw new Error(`GitHub request failed for ${username} (status ${response.status})`)
    }
    const chunk = (await response.json()) as GitHubRepo[]
    repos.push(...chunk)
    if (chunk.length < perPage) break
  }
  return repos
}

function buildProjectPayloadFromRepo(repo: GitHubRepo, order: number, useGithubCover: boolean) {
  const title = repo.name
  const description = repo.description?.trim() ?? ''
  const homepage = normalizeUrl(repo.homepage)
  const tags = buildTags(repo)
  const cover = useGithubCover ? buildGitHubCover(repo) : ''
  return {
    title_en: title,
    title_ja: '',
    title,
    description_en: description,
    description_ja: '',
    description,
    order,
    url: homepage || null,
    repo: repo.html_url,
    tags_en: tags,
    tags_ja: [],
    tags,
    cover: cover || null,
    image: cover || null,
    thumbnail: cover || null,
    github_id: repo.id,
    github_full_name: repo.full_name,
    github_owner: repo.owner.login,
    github_repo: repo.name,
    github_updated_at: repo.updated_at,
    github_pushed_at: repo.pushed_at,
    github_language: repo.language || null,
    github_topics: Array.isArray(repo.topics) ? repo.topics : [],
    github_synced_at: new Date().toISOString()
  }
}

function buildProjectUpdateFromRepo(repo: GitHubRepo, useGithubCover: boolean) {
  const payload: Record<string, any> = {
    title_en: repo.name,
    title: repo.name,
    repo: repo.html_url,
    github_id: repo.id,
    github_full_name: repo.full_name,
    github_owner: repo.owner.login,
    github_repo: repo.name,
    github_updated_at: repo.updated_at,
    github_pushed_at: repo.pushed_at,
    github_language: repo.language || null,
    github_topics: Array.isArray(repo.topics) ? repo.topics : [],
    github_synced_at: new Date().toISOString()
  }
  const description = repo.description?.trim()
  if (description) {
    payload.description_en = description
    payload.description = description
  }
  const homepage = normalizeUrl(repo.homepage)
  if (homepage) {
    payload.url = homepage
  }
  const tags = buildTags(repo)
  if (tags.length) {
    payload.tags_en = tags
    payload.tags = tags
  }
  if (useGithubCover) {
    const cover = buildGitHubCover(repo)
    payload.cover = cover
    payload.image = cover
    payload.thumbnail = cover
  }
  return payload
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<EditableProject[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [githubUsernames, setGithubUsernames] = useState(defaultGitHubAccounts.join(', '))
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([])
  const [githubStatus, setGithubStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [githubError, setGithubError] = useState<string | null>(null)
  const [githubFilter, setGithubFilter] = useState('')
  const [includeForks, setIncludeForks] = useState(false)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [importReport, setImportReport] = useState<string | null>(null)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [useGithubCover, setUseGithubCover] = useState(false)
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

  const loadProjects = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
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
          cover: (data.cover as string) || (data.image as string) || (data.thumbnail as string) || '',
          github_full_name: (data.github_full_name as string) || '',
          github_id: (data.github_id as number) || undefined,
          github_owner: (data.github_owner as string) || '',
          github_repo: (data.github_repo as string) || '',
          github_synced_at: (data.github_synced_at as string) || ''
        }
      })
      setProjects(items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

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

  async function handleGithubFetch() {
    const usernames = normalizeGitHubUsernames(githubUsernames)
    if (usernames.length === 0) {
      setGithubStatus('error')
      setGithubError('Add at least one GitHub username.')
      return
    }
    setGithubStatus('loading')
    setGithubError(null)
    setImportReport(null)
    try {
      const results = await Promise.allSettled(usernames.map(username => fetchReposForUser(username)))
      const repos: GitHubRepo[] = []
      const errors: string[] = []
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          repos.push(...result.value)
        } else {
          const message = result.reason instanceof Error ? result.reason.message : String(result.reason)
          errors.push(`${usernames[index]}: ${message}`)
        }
      })
      const deduped = new Map<string, GitHubRepo>()
      repos.forEach(repo => {
        const key = repo.full_name.toLowerCase()
        if (!deduped.has(key)) deduped.set(key, repo)
      })
      const merged = Array.from(deduped.values())
      setGithubRepos(merged)
      setSelectedRepos(new Set())
      if (merged.length === 0 && errors.length) {
        setGithubStatus('error')
        setGithubError(`Unable to load repos. ${errors.join(' | ')}`)
      } else {
        setGithubStatus('ready')
        if (errors.length) setGithubError(`Some accounts failed: ${errors.join(' | ')}`)
      }
    } catch (err) {
      setGithubStatus('error')
      setGithubError(err instanceof Error ? err.message : 'Unable to fetch GitHub repos.')
    }
  }

  function toggleRepoSelection(fullName: string) {
    const key = fullName.toLowerCase()
    setSelectedRepos(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function selectAllFiltered(filtered: GitHubRepo[]) {
    setSelectedRepos(new Set(filtered.map(repo => repo.full_name.toLowerCase())))
  }

  function clearSelection() {
    setSelectedRepos(new Set())
  }

  async function handleImportSelected(selected: GitHubRepo[], existingByFullName: Map<string, EditableProject>) {
    if (selected.length === 0) return
    setImporting(true)
    setImportReport(null)
    let created = 0
    let updated = 0
    let skipped = 0
    const errors: string[] = []
    try {
      let nextOrder = projects.reduce((max, project) => Math.max(max, Number(project.order ?? 0)), 0) + 1
      for (const repo of selected) {
        const key = repo.full_name.toLowerCase()
        const existing = existingByFullName.get(key)
        try {
          if (existing) {
            if (!updateExisting) {
              skipped += 1
              continue
            }
            await updateDoc(doc(db, 'projects', existing.id), buildProjectUpdateFromRepo(repo, useGithubCover))
            updated += 1
          } else {
            await addDoc(collection(db, 'projects'), buildProjectPayloadFromRepo(repo, nextOrder, useGithubCover))
            nextOrder += 1
            created += 1
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error'
          errors.push(`${repo.full_name}: ${message}`)
        }
      }
      if (errors.length) {
        setGithubError(`Some imports failed: ${errors.join(' | ')}`)
      }
      setImportReport(`Imported ${created} new, updated ${updated}, skipped ${skipped}.${errors.length ? ` Failed ${errors.length}.` : ''}`)
      await loadProjects(false)
      setSelectedRepos(new Set())
    } finally {
      setImporting(false)
    }
  }

  const existingProjectByFullName = useMemo(() => {
    const map = new Map<string, EditableProject>()
    projects.forEach(project => {
      const fullName = project.github_full_name || extractFullNameFromRepoUrl(project.repo)
      if (fullName) {
        map.set(fullName.toLowerCase(), project)
      }
    })
    return map
  }, [projects])

  const filteredRepos = useMemo(() => {
    const query = githubFilter.trim().toLowerCase()
    return githubRepos.filter(repo => {
      if (!includeForks && repo.fork) return false
      if (!includeArchived && repo.archived) return false
      if (!query) return true
      const haystack = `${repo.full_name} ${repo.description ?? ''}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [githubRepos, githubFilter, includeForks, includeArchived])

  const filteredSelectedCount = useMemo(
    () => filteredRepos.filter(repo => selectedRepos.has(repo.full_name.toLowerCase())).length,
    [filteredRepos, selectedRepos]
  )

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [projects]
  )

  return (
    <div className="stack">
      <h2>Projects</h2>
      <div className="card form github-import">
        <h3>GitHub Import</h3>
        <p className="muted">
          Fetch repositories from GitHub accounts, select the ones you want, and import them into Projects.
        </p>
        <label>
          GitHub usernames (comma separated)
          <input
            value={githubUsernames}
            onChange={e => setGithubUsernames(e.target.value)}
            placeholder="denuoweb, Denuo-Web"
          />
        </label>
        <div className="actions">
          <button type="button" onClick={handleGithubFetch} disabled={githubStatus === 'loading'}>
            {githubStatus === 'loading' ? 'Fetching…' : 'Fetch Repos'}
          </button>
          {githubRepos.length > 0 && (
            <span className="muted">Loaded {githubRepos.length} repos</span>
          )}
        </div>
        {githubError && <p className="error">{githubError}</p>}
        {githubRepos.length > 0 && (
          <div className="github-import-body">
            <label>
              Search repositories
              <input
                value={githubFilter}
                onChange={e => setGithubFilter(e.target.value)}
                placeholder="Filter by name or description"
              />
            </label>
            <div className="github-checkbox-row">
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={includeForks}
                  onChange={e => setIncludeForks(e.target.checked)}
                />
                <span>Include forks</span>
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={includeArchived}
                  onChange={e => setIncludeArchived(e.target.checked)}
                />
                <span>Include archived</span>
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={e => setUpdateExisting(e.target.checked)}
                />
                <span>Update existing projects (overwrites GitHub fields)</span>
              </label>
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={useGithubCover}
                  onChange={e => setUseGithubCover(e.target.checked)}
                />
                <span>Use GitHub social preview as cover image</span>
              </label>
            </div>
            <div className="actions">
              <button type="button" onClick={() => selectAllFiltered(filteredRepos)} disabled={filteredRepos.length === 0}>
                Select all filtered ({filteredRepos.length})
              </button>
              <button type="button" onClick={clearSelection} disabled={selectedRepos.size === 0}>
                Clear selection
              </button>
              <span className="muted">
                Selected {selectedRepos.size} ({filteredSelectedCount} visible)
              </span>
            </div>
            {filteredRepos.length === 0 ? (
              <p className="muted">No repositories match the current filters.</p>
            ) : (
              <div className="github-repo-list">
                {filteredRepos.map(repo => {
                  const key = repo.full_name.toLowerCase()
                  const isSelected = selectedRepos.has(key)
                  const isImported = existingProjectByFullName.has(key)
                  return (
                    <label key={repo.id} className={`github-repo-item${isSelected ? ' selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRepoSelection(repo.full_name)}
                      />
                      <div className="github-repo-content">
                        <div className="github-repo-title">
                          <span className="github-repo-name">{repo.full_name}</span>
                          {isImported && <span className="github-repo-badge">Imported</span>}
                          {repo.fork && <span className="github-repo-badge">Fork</span>}
                          {repo.archived && <span className="github-repo-badge">Archived</span>}
                        </div>
                        {repo.description && <p className="muted">{repo.description}</p>}
                        <div className="github-repo-meta">
                          {repo.language && <span>{repo.language}</span>}
                          <span>★ {repo.stargazers_count}</span>
                          <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
            <div className="actions">
              <button
                type="button"
                onClick={() => handleImportSelected(
                  githubRepos.filter(repo => selectedRepos.has(repo.full_name.toLowerCase())),
                  existingProjectByFullName
                )}
                disabled={selectedRepos.size === 0 || importing}
              >
                {importing ? 'Importing…' : `Import selected (${selectedRepos.size})`}
              </button>
              {importReport && <span className="success">{importReport}</span>}
            </div>
          </div>
        )}
      </div>
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
