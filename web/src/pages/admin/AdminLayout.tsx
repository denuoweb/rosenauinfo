import { useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export default function AdminLayout() {
  const { user, initializing, logout } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      setSigningOut(false)
    }
  }

  if (initializing) return <p>Loading…</p>
  if (!user) return <Navigate to="/admin/login" replace />

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <h1>Admin Panel</h1>
        <div className="spacer" />
        <span className="admin-user">{user.email}</span>
        <button type="button" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>
      <div className="admin-body">
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : undefined}>Overview</NavLink>
          <NavLink to="/admin/home" className={({ isActive }) => isActive ? 'active' : undefined}>Home &amp; Profile</NavLink>
          <NavLink to="/admin/projects" className={({ isActive }) => isActive ? 'active' : undefined}>Projects</NavLink>
          <NavLink to="/admin/resume" className={({ isActive }) => isActive ? 'active' : undefined}>Resume</NavLink>
        </nav>
        <section className="admin-content">
          <Outlet />
        </section>
      </div>
    </div>
  )
}
