import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Create an account</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ padding: '0.7rem' }} />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.7rem' }} />
        <input placeholder="Password (min 6 characters)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ padding: '0.7rem' }} />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="text-muted" style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}
