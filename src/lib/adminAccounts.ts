import { supabase } from './supabase'
import type { UserRole } from '../types/database'
import type { PermissionKey } from './AuthContext'

export interface AdminAccountRow {
  id: string
  fullName: string | null
  email: string | null
  role: UserRole
  isActive: boolean
  permissions: PermissionKey[]
}

const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'order_admin', 'inventory_admin', 'content_admin', 'general_admin']

/** Lists every admin-tier account (not customers) with their granted
 *  permissions attached, including deactivated ones - a deactivated
 *  admin keeps their role now (see deactivateAdmin) instead of being
 *  demoted to 'customer', specifically so they don't vanish from this
 *  list with no way to reactivate them.
 *
 *  Requires the `is_active` column on profiles - see
 *  supabase/migrations/blueprint_admin_is_active.sql. Until that's
 *  applied, this falls back to treating everyone as active. */
export async function fetchAdminAccounts(): Promise<AdminAccountRow[]> {
  const { data: profiles, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, role, is_active')
    .in('role', ADMIN_ROLES)
  if (error) throw error

  const { data: permRows } = await (supabase as any).from('admin_permissions').select('admin_id, permission')
  const permsByAdmin = new Map<string, PermissionKey[]>()
  for (const row of permRows ?? []) {
    const list = permsByAdmin.get(row.admin_id) ?? []
    list.push(row.permission)
    permsByAdmin.set(row.admin_id, list)
  }

  // Email lives in auth.users, not profiles - resolved via a companion
  // RPC since the client can't call the admin API directly.
  const { data: emailRows } = await (supabase as any).rpc('get_admin_emails', { p_admin_ids: (profiles ?? []).map((p: any) => p.id) })
  const emailByAdmin = new Map<string, string>((emailRows ?? []).map((r: any) => [r.id, r.email]))

  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name,
    email: emailByAdmin.get(p.id) ?? null,
    role: p.role,
    isActive: p.is_active ?? true,
    permissions: permsByAdmin.get(p.id) ?? [],
  }))
}

/** Only super_admin can call this successfully (enforced by the profiles
 *  RLS update policy, which requires is_super_admin() to change a role
 *  other than one's own). */
export async function setAdminRole(adminId: string, newRole: UserRole): Promise<void> {
  const { error } = await (supabase as any).from('profiles').update({ role: newRole }).eq('id', adminId)
  if (error) throw error
}

export async function grantPermission(adminId: string, permission: PermissionKey): Promise<void> {
  const { error } = await (supabase as any).from('admin_permissions').insert({ admin_id: adminId, permission })
  if (error) throw error
}

export async function revokePermission(adminId: string, permission: PermissionKey): Promise<void> {
  const { error } = await (supabase as any).from('admin_permissions').delete().eq('admin_id', adminId).eq('permission', permission)
  if (error) throw error
}

/** Deactivates an admin account: strips access immediately (is_admin()/
 *  has_permission() should check is_active per the migration blueprint)
 *  while keeping their role and history intact - reversible via
 *  activateAdmin, unlike the old role-demotion approach. */
export async function deactivateAdmin(adminId: string): Promise<void> {
  const { error } = await (supabase as any).from('profiles').update({ is_active: false }).eq('id', adminId)
  if (error) throw error
}

export async function activateAdmin(adminId: string): Promise<void> {
  const { error } = await (supabase as any).from('profiles').update({ is_active: true }).eq('id', adminId)
  if (error) throw error
}

/** Permanently deletes an admin's account (auth user + cascading rows).
 *  Goes through the delete-admin-account edge function, which re-checks
 *  server-side that the caller is really a super_admin rather than
 *  trusting anything the client claims - see that function's comments. */
export async function terminateAdmin(adminId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-admin-account', {
    method: 'POST',
    body: { targetUserId: adminId },
  })
  if (error) throw error
}
