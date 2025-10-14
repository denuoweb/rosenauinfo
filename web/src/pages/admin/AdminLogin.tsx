import { FormEvent, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { user, initializing, login, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  if (initializing) return <p>Loading…</p>
  if (user) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    try {
      await login(email, password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const msg = err?.code === 'auth/invalid-credential'
        ? 'Invalid email or password'
        : err?.message || 'Login failed'
      setMessage(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-auth">
      <form className="card form" onSubmit={handleSubmit}>
        <h1>Admin Login</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        {(message || error) && <p className="error">{message || error}</p>}
      </form>
    </div>
  )
}
