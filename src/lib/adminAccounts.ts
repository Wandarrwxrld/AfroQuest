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

/** Lists every admin-tier account (not customers) with their granted
 *  permissions attached - the real "create, edit, disable and manage
 *  administrator accounts and roles" view the roles document requires
 *  for super_admin. RLS on profiles already restricts what a non-
 *  super_admin caller could see here (role change is super_admin-only),
 *  but this whole page is additionally gated behind isSuperAdmin in
 *  the route itself. */
export async function fetchAdminAccounts(): Promise<AdminAccountRow[]> {
  const ADMIN_ROLES: UserRole[] = ['admin', 'super_admin', 'order_admin', 'inventory_admin', 'content_admin', 'general_admin']

  const { data: profiles, error } = await (supabase as any)
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ADMIN_ROLES)
  if (error) throw error

  const { data: permRows } = await (supabase as any).from('admin_permissions').select('admin_id, permission')
  const permsByAdmin = new Map<string, PermissionKey[]>()
  for (const row of permRows ?? []) {
    const list = permsByAdmin.get(row.admin_id) ?? []
    list.push(row.permission)
    permsByAdmin.set(row.admin_id, list)
  }

  // Email lives in auth.users, not profiles - resolve via the admin API
  // is not available client-side, so this reads from a view/RPC instead.
  // Simplest real approach without a service-role key on the client:
  // profiles.full_name is what's shown primarily; email is fetched only
  // where a companion RPC exists (see get_admin_emails below).
  const { data: emailRows } = await (supabase as any).rpc('get_admin_emails', { p_admin_ids: (profiles ?? []).map((p: any) => p.id) })
  const emailByAdmin = new Map<string, string>((emailRows ?? []).map((r: any) => [r.id, r.email]))

  return (profiles ?? []).map((p: any) => ({
    id: p.id,
    fullName: p.full_name,
    email: emailByAdmin.get(p.id) ?? null,
    role: p.role,
    isActive: true, // disabling is implemented via role demotion to 'customer' - see disableAdmin below
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

/** "Disable" an admin account by demoting them to 'customer' - removes
 *  every admin-tier privilege immediately via RLS (is_admin()/has_permission()
 *  both key off profiles.role), without deleting the account or its
 *  order/audit history. Reversible by a super_admin re-assigning a role. */
export async function disableAdmin(adminId: string): Promise<void> {
  await setAdminRole(adminId, 'customer')
}
