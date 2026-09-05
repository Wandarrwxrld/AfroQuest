import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      // Generic message regardless of whether it's a bad email or bad
      // password - avoids confirming which emails have accounts (spec
      // item 38: safe auth, avoid user enumeration).
      setError('Invalid email or password.')
      return
    }
    navigate('/')
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Log in</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.7rem' }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.7rem' }} />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="text-muted" style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
