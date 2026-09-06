import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '../types/database'

const ADMIN_TIER_ROLES = ['admin', 'super_admin', 'order_admin', 'inventory_admin', 'content_admin']

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  /** true once the session has completed any required MFA step (aal2).
   *  For accounts with no MFA factor enrolled, aal1 is already the
   *  highest reachable level, so this is true immediately - MFA is
   *  additive, not something that locks out accounts that haven't set
   *  it up. */
  mfaSatisfied: boolean
  mfaCheckLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaSatisfied, setMfaSatisfied] = useState(true)
  const [mfaCheckLoading, setMfaCheckLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
  }, [session?.user])

  useEffect(() => {
    if (!session) {
      setMfaSatisfied(true)
      return
    }
    setMfaCheckLoading(true)
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data, error }) => {
      setMfaCheckLoading(false)
      if (error || !data) {
        setMfaSatisfied(true)
        return
      }
      // currentLevel !== nextLevel means a higher level (aal2) is
      // available/required but not yet reached this session - i.e. a
      // factor is enrolled and the MFA challenge hasn't been completed.
      setMfaSatisfied(data.currentLevel === data.nextLevel)
    })
  }, [session])

  const role = profile?.role
  const isAdmin = !!role && ADMIN_TIER_ROLES.includes(role)
  const isSuperAdmin = role === 'super_admin'

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin,
        isSuperAdmin,
        mfaSatisfied,
        mfaCheckLoading,
        signOut: async () => { await supabase.auth.signOut() },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
