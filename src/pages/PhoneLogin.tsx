import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/** Real "linked fallback" phone login per the auth setup document:
 *  shouldCreateUser: false is the critical part - it means a phone
 *  number that isn't already linked to an existing account cannot spin
 *  up a new, disconnected one. This only works for logging back into
 *  an account that already has a verified phone attached.
 *
 *  Honest limitation: sending a real SMS requires an SMS provider
 *  (Twilio, per the document) configured in Supabase's dashboard -
 *  separate infrastructure this code cannot set up itself. Until that
 *  exists, this correctly surfaces Supabase's real error rather than
 *  pretend the OTP was sent. */
export default function PhoneLogin() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setStage('code')
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    setLoading(false)
    if (error) {
      setError('Incorrect or expired code. Try again.')
      return
    }
    navigate('/')
  }

  return (
    <div className="section" style={{ maxWidth: 400, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Log in with phone</h1>
      <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Only works if a phone number is already linked to your account.
      </p>

      {stage === 'phone' ? (
        <form onSubmit={handleSendCode} style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            placeholder="+260..."
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={{ padding: '0.7rem' }}
          />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} style={{ display: 'grid', gap: '0.75rem' }}>
          <input
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            required
            style={{ padding: '0.7rem', letterSpacing: '0.2em', textAlign: 'center' }}
          />
          {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
          <button className="btn btn-primary" disabled={loading} type="submit">
            {loading ? 'Verifying...' : 'Verify and log in'}
          </button>
        </form>
      )}

      <p className="text-muted" style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
        <Link to="/login">Back to email login</Link>
      </p>
    </div>
  )
}
