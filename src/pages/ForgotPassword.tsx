import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    // Spec requirement: "Use generic responses for password-reset requests
    // so attackers cannot discover whether an email exists." We call the
    // API regardless and always show the same success state, whether or
    // not this email has an account - Supabase itself does not reveal
    // that distinction in the response either.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
        <h1>Check your email</h1>
        <p className="text-muted">
          If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
          The link expires shortly and can only be used once.
        </p>
        <Link to="/login" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to login</Link>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>Reset your password</h1>
      <p className="text-muted" style={{ marginBottom: '1rem' }}>
        Enter your email and we'll send you a link to reset your password.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.7rem' }} />
        <button className="btn btn-primary" disabled={loading} type="submit">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="text-muted" style={{ marginTop: '1rem' }}>
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}
