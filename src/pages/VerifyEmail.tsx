import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/** Lands here after the user clicks the confirmation link in their email.
 *  Supabase validates the token from the URL hash automatically and fires
 *  a SIGNED_IN event once verified - per spec, we then sign out again and
 *  send them to login rather than leaving them auto-logged-in, matching
 *  the "mark verified -> redirect to login page -> login" flow exactly. */
export default function VerifyEmail() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')

  useEffect(() => {
    let handled = false

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (handled) return
      if (event === 'SIGNED_IN' && session) {
        handled = true
        setStatus('success')
        await supabase.auth.signOut()
        setTimeout(() => navigate('/login', { state: { justVerified: true } }), 1800)
      }
    })

    // If the link was already invalid/expired, no SIGNED_IN event will
    // ever fire - fall back to an error state after a short wait.
    const timeout = setTimeout(() => {
      if (!handled) setStatus('error')
    }, 4000)

    return () => {
      listener.subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate])

  if (status === 'checking') {
    return (
      <div className="section" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h1>Verifying your email...</h1>
        <p className="text-muted">This should only take a moment.</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="section" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h1>Email verified</h1>
        <p className="text-muted">Redirecting you to login...</p>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
      <h1>Verification link invalid or expired</h1>
      <p className="text-muted">This can happen if the link was already used or has expired.</p>
      <Link to="/login" className="btn btn-outline" style={{ marginTop: '1rem' }}>Go to login</Link>
    </div>
  )
}
