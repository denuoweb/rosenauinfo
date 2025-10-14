import { useEffect, useState } from 'react'
import { collection, getCountFromServer, doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

type SiteName = { en: string; ja: string }

export default function AdminOverview() {
  const [stats, setStats] = useState<{ projects: number } | null>(null)
  const [siteName, setSiteName] = useState<SiteName>({ en: '', ja: '' })

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const [projectsSnap, siteSnap] = await Promise.all([
          getCountFromServer(collection(db, 'projects')),
          getDoc(doc(db, 'public', 'site'))
        ])
        if (!alive) return
        setStats({
          projects: projectsSnap.data().count
        })
        if (siteSnap.exists()) {
          const data = siteSnap.data()
          setSiteName({
            en: (data.name_en as string) || (data.name as string) || '',
            ja: (data.name_ja as string) || (data.name as string) || ''
          })
        }
      } catch (err) {
        console.error(err)
        if (alive) setStats({ projects: 0 })
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <div>
      <h2>Overview</h2>
      {(siteName.en || siteName.ja) && (
        <p>
          Site name:<strong> {siteName.en || '—'} </strong>
          {siteName.ja && <span>(日本語: {siteName.ja})</span>}
        </p>
      )}
      {stats ? (
        <ul className="admin-stats">
          <li><strong>{stats.projects}</strong> project{stats.projects === 1 ? '' : 's'}</li>
        </ul>
      ) : (
        <p>Loading counts…</p>
      )}
      <p>Use the navigation to manage content across your site.</p>
    </div>
  )
}
