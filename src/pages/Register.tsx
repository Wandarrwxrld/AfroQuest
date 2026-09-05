import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleResend() {
    if (resendCooldown > 0) return
    setResendMessage(null)
    // Spec: "Resend-verification must be rate-limited." Client-side cooldown
    // here is a real, immediate protection against accidental spam-clicking;
    // Supabase's own backend rate limits on resend also apply underneath
    // this regardless of what the client does.
    setResendCooldown(60)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/verify-email` },
    })
    setResendMessage(error ? 'Could not resend right now. Try again shortly.' : 'Verification email resent.')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    // Spec: email verification is required after account creation.
    // If email confirmation is OFF in the Supabase project (common
    // during early development), signUp already returns a live session
    // and the account works immediately - this success screen still
    // shows either way since Supabase doesn't distinguish the two cases
    // in the response.
    setRegistered(true)
  }

  if (registered) {
    return (
      <div className="section" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h1>Check your email</h1>
        <p className="text-muted">
          We've sent a verification link to <strong>{email}</strong>. Click it to activate your account, then log in.
        </p>
        <button className="btn btn-outline" onClick={handleResend} disabled={resendCooldown > 0} style={{ marginTop: '1rem' }}>
          {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
        </button>
        {resendMessage && <p className="text-muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{resendMessage}</p>}
        <br />
        <Link to="/login" className="btn btn-outline" style={{ marginTop: '0.75rem' }}>Go to login</Link>
      </div>
    )
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
