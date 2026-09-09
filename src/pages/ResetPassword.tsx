import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    // Supabase's password-recovery link lands here with tokens in the URL
    // hash, which onAuthStateChange picks up as a PASSWORD_RECOVERY event
    // and turns into a temporary session - that session is what lets
    // updateUser() work below without a normal login first.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true)
    })
    // Also cover the case where the session is already present by the
    // time this component mounts (hash processed before the listener attached).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setLoading(false)
      // Token invalid/expired lands here - the token itself is single-use
      // and short-lived per spec, this is the natural failure path for that.
      setError('This reset link is invalid or has expired. Request a new one.')
      return
    }

    // Spec: "Invalidate appropriate sessions/refresh tokens after password
    // reset" and "redirect the user to the login page" (not auto-login).
    await supabase.auth.signOut()
    setLoading(false)
    navigate('/login', { state: { justReset: true } })
  }

  if (!sessionReady) {
    return (
      <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Reset your password</h1>
        <p className="text-muted">
          Waiting for the reset link to verify... If this doesn't resolve, the link may be invalid or expired.
        </p>
        <Link to="/forgot-password" className="btn btn-outline" style={{ marginTop: '1rem' }}>Request a new link</Link>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Set a new password</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ position: 'relative' }}>
          <input placeholder="New password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={{ padding: '0.7rem', paddingRight: '2.5rem', width: '100%' }} />
          <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <input placeholder="Confirm new password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} style={{ padding: '0.7rem' }} />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
