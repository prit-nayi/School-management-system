import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { setToken } from '../lib/auth'

export default function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('admin@school.local')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      setToken(res.data.token)
      nav('/', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="eval-banner">Evaluation Build - Non-Commercial Use Only</div>
      <div className="card auth-card">
        <h1>Admin Login</h1>
        <p className="muted">Login to access the dashboard.</p>
        <form onSubmit={onSubmit} className="form">
          <label className="field">
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@school.local" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error ? <div className="error">{error}</div> : null}
          <button className="btn primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        <div className="hint">
          Default credentials are configurable in <code>backend/.env</code>.
        </div>
      </div>
      <div className="eval-footer">For technical assessment, testing, and demonstration only.</div>
    </div>
  )
}

