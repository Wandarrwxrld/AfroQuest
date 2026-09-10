import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Profile } from '../types/database'

const ADMIN_TIER_ROLES = ['admin', 'super_admin', 'order_admin', 'inventory_admin', 'content_admin', 'general_admin']

export type PermissionKey = 'inventory' | 'orders' | 'products_content' | 'admin_management' | 'security_settings'

/** Fixed roles imply their own scope automatically (mirrors has_permission()
 *  in the database exactly - kept in sync manually since it's a small,
 *  stable mapping). general_admin has no implied permissions; its grants
 *  come only from the admin_permissions table, fetched separately below. */
const ROLE_IMPLIED_PERMISSIONS: Record<string, PermissionKey[]> = {
  super_admin: ['inventory', 'orders', 'products_content', 'admin_management', 'security_settings'],
  inventory_admin: ['inventory'],
  order_admin: ['orders'],
  content_admin: ['products_content'],
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  /** Real, backend-verified access, not just a role-name guess -
   *  general_admin accounts only ever pass for keys they've actually
   *  been granted, mirroring has_permission() in the database. */
  hasPermission: (key: PermissionKey) => boolean
  permissionsLoading: boolean
  mfaSatisfied: boolean
  mfaCheckLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** Records a real login/logout event for the audit trail, but only for
 *  admin-tier accounts - customer traffic doesn't need this kind of
 *  internal accountability log. Fire-and-forget: a logging failure
 *  should never block the person from actually signing in or out. */
async function recordAdminLoginEvent(userId: string, eventType: 'login' | 'logout') {
  try {
    const { data: profile } = await (supabase as any).from('profiles').select('role').eq('id', userId).single()
    if (!profile?.role || !ADMIN_TIER_ROLES.includes(profile.role)) return
    await (supabase as any).from('admin_login_events').insert({ admin_id: userId, event_type: eventType })
  } catch {
    // Intentionally swallowed - see doc comment above.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaSatisfied, setMfaSatisfied] = useState(true)
  const [mfaCheckLoading, setMfaCheckLoading] = useState(false)
  const [grantedPermissions, setGrantedPermissions] = useState<PermissionKey[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_IN' && s?.user) recordAdminLoginEvent(s.user.id, 'login')
      if (event === 'SIGNED_OUT' && session?.user) recordAdminLoginEvent(session.user.id, 'logout')
    })
    return () => listener.subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      return
    }
    supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
  }, [session?.user])

  useEffect(() => {
    if (profile?.role !== 'general_admin') {
      setGrantedPermissions([])
      return
    }
    setPermissionsLoading(true)
    // Real grants only - RLS on admin_permissions already restricts this
    // to the caller's own rows (admin_permissions_self_read), so this
    // cannot be used to see another admin's permissions.
    ;(supabase as any)
      .from('admin_permissions')
      .select('permission')
      .eq('admin_id', profile.id)
      .then(({ data }: any) => {
        setGrantedPermissions((data ?? []).map((r: any) => r.permission))
        setPermissionsLoading(false)
      })
  }, [profile?.id, profile?.role])

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

  function hasPermission(key: PermissionKey): boolean {
    if (!role) return false
    if (role === 'general_admin') return grantedPermissions.includes(key)
    return (ROLE_IMPLIED_PERMISSIONS[role] ?? []).includes(key)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        isAdmin,
        isSuperAdmin,
        hasPermission,
        permissionsLoading,
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
