import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

/** Admin MFA enrollment (spec: "Admin account recovery should have
 *  stronger controls and MFA" / "Strongly recommend MFA for admins").
 *  Uses Supabase Auth's native TOTP support - real, standard-compliant
 *  MFA (works with Google Authenticator, Authy, etc.), not a custom
 *  OTP-over-email scheme. */
export default function AdminMfaSetup() {
  const { isAdmin } = useAuth()
  const [factors, setFactors] = useState<{ id: string; friendly_name?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enrolled, setEnrolled] = useState(false)

  useEffect(() => {
    refreshFactors()
  }, [])

  async function refreshFactors() {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (!error && data) {
      setFactors(data.totp.map((f) => ({ id: f.id, friendly_name: f.friendly_name })))
    }
    setLoading(false)
  }

  async function startEnrollment() {
    setError(null)
    setEnrolling(true)
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error || !data) {
      setError(error?.message ?? 'Could not start MFA enrollment.')
      setEnrolling(false)
      return
    }
    setFactorId(data.id)
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
  }

  async function confirmEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) return
    setError(null)

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })
    if (challengeError || !challenge) {
      setError(challengeError?.message ?? 'Could not verify code.')
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: verifyCode,
    })

    if (verifyError) {
      setError('Incorrect code. Check your authenticator app and try again.')
      return
    }

    setEnrolled(true)
    setEnrolling(false)
    await refreshFactors()
  }

  async function removeFactor(id: string) {
    if (!confirm('Remove this MFA method? You will no longer be prompted for a code at login.')) return
    await supabase.auth.mfa.unenroll({ factorId: id })
    await refreshFactors()
  }

  if (!isAdmin) {
    return (
      <div className="section">
        <p className="text-muted">MFA setup is available to admin accounts only.</p>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 480, margin: '0 auto' }}>
      <h1>Two-factor authentication</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        Strongly recommended for admin accounts - adds a code from your authenticator app on top of your password.
      </p>

      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : enrolled ? (
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ color: 'var(--color-success)', fontWeight: 600 }}>Two-factor authentication is now enabled.</p>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>You'll be asked for a code from your authenticator app next time you log in.</p>
          <Link to="/admin" className="btn btn-primary" style={{ marginTop: '1rem' }}>Back to admin dashboard</Link>
        </div>
      ) : factors.length > 0 ? (
        <div className="card" style={{ padding: '1.25rem' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Active MFA methods</p>
          {factors.map((f) => (
            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
              <span>{f.friendly_name || 'Authenticator app'}</span>
              <button className="btn btn-outline" onClick={() => removeFactor(f.id)}>Remove</button>
            </div>
          ))}
        </div>
      ) : !factorId ? (
        <button className="btn btn-primary" onClick={startEnrollment} disabled={enrolling}>
          Set up two-factor authentication
        </button>
      ) : (
        <form onSubmit={confirmEnrollment} className="card" style={{ padding: '1.25rem', display: 'grid', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>1. Scan this QR code</p>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Use Google Authenticator, Authy, or any TOTP app.
            </p>
            {qrCode && <img src={qrCode} alt="MFA QR code" style={{ width: 180, height: 180 }} />}
            {secret && (
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                Can't scan? Enter manually: {secret}
              </p>
            )}
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>2. Enter the 6-digit code</p>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              style={{ padding: '0.7rem', width: '100%', fontSize: '1.1rem', letterSpacing: '0.2em', textAlign: 'center' }}
            />
          </div>
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
          <button className="btn btn-primary" type="submit">Verify and enable</button>
        </form>
      )}
    </div>
  )
}
