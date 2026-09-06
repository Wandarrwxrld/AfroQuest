import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'limited'>('idle')

  const state = location.state as { justVerified?: boolean; justReset?: boolean } | null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNeedsVerification(false)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      // Supabase returns a distinct code when the account exists but
      // email isn't verified yet - safe to surface that specific case
      // (unlike bad-password vs bad-email, this doesn't reveal whether
      // an email exists to someone who doesn't already know the password
      // was otherwise correct).
      if (error.message.toLowerCase().includes('email not confirmed') || (error as any).code === 'email_not_confirmed') {
        setNeedsVerification(true)
        setError('Please verify your email before logging in.')
      } else {
        setError('Invalid email or password.')
      }
      return
    }
    navigate('/')
  }

  async function handleResend() {
    setResendStatus('sending')
    // Real server-side rate limit check (spec: "Resend-verification must
    // be rate-limited") - not a client-side timer, which would reset on
    // page refresh and provide no actual protection.
    const { data: allowed, error: rpcError } = await (supabase as any).rpc('check_and_record_resend_attempt', { p_email: email })

    if (rpcError || !allowed) {
      setResendStatus('limited')
      return
    }

    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setResendStatus(error ? 'limited' : 'sent')
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Log in</h1>
      {state?.justVerified && (
        <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Your email is verified. You can log in now.
        </p>
      )}
      {state?.justReset && (
        <p style={{ color: 'var(--color-success)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Your password has been reset. Log in with your new password.
        </p>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.7rem' }} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '0.7rem' }} />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      {needsVerification && (
        <div style={{ marginTop: '0.75rem' }}>
          {resendStatus === 'sent' ? (
            <p style={{ color: 'var(--color-success)', fontSize: '0.85rem' }}>Verification email resent. Check your inbox.</p>
          ) : resendStatus === 'limited' ? (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>Too many resend attempts. Try again later.</p>
          ) : (
            <button className="btn btn-outline" onClick={handleResend} disabled={resendStatus === 'sending'} type="button">
              {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
            </button>
          )}
        </div>
      )}

      <p className="text-muted" style={{ marginTop: '1rem' }}>
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
      <p className="text-muted" style={{ marginTop: '0.5rem' }}>
        <Link to="/forgot-password">Forgot your password?</Link>
      </p>
    </div>
  )
}
