import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/** Shown after password login when the account has MFA enrolled and the
 *  session is still at aal1 (password-only). This is what makes MFA an
 *  actual enforcement, not just an optional setting nobody is ever
 *  asked to use - AuthContext/RequireAdmin route here instead of
 *  granting access until aal2 is reached. */
export default function MfaChallenge() {
  const navigate = useNavigate()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      setLoading(false)
      if (error || !data || data.totp.length === 0) {
        navigate('/login')
        return
      }
      setFactorId(data.totp[0].id)
    })
  }, [navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setVerifying(true)
    setError(null)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challenge) {
      setError('Could not start verification. Try again.')
      setVerifying(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    })

    setVerifying(false)
    if (verifyError) {
      setError('Incorrect code. Try again.')
      return
    }

    navigate('/admin')
  }

  if (loading) return <div className="section"><p className="text-muted">Loading...</p></div>

  return (
    <div className="section" style={{ maxWidth: 380, margin: '0 auto' }}>
      <h1>Enter your code</h1>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>Open your authenticator app and enter the current code.</p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          maxLength={6}
          required
          autoFocus
          style={{ padding: '0.7rem', fontSize: '1.1rem', letterSpacing: '0.2em', textAlign: 'center' }}
        />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={verifying} type="submit">
          {verifying ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  )
}
