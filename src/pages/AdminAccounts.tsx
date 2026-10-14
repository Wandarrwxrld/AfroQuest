import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAdminAccounts,
  setAdminRole,
  grantPermission,
  revokePermission,
  activateAdmin,
  deactivateAdmin,
  terminateAdmin,
  type AdminAccountRow,
} from '../lib/adminAccounts'
import type { UserRole } from '../types/database'
import type { PermissionKey } from '../lib/AuthContext'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  general_admin: 'General Admin',
  inventory_admin: 'Inventory Admin',
  order_admin: 'Order Admin',
  content_admin: 'Content Admin',
  admin: 'Admin',
}

const PERMISSION_LABELS: Record<PermissionKey, string> = {
  inventory: 'Inventory',
  orders: 'Orders',
  products_content: 'Products / Content',
  admin_management: 'Admin Management',
  security_settings: 'Security / Settings',
}

const ALL_PERMISSIONS: PermissionKey[] = ['inventory', 'orders', 'products_content', 'admin_management', 'security_settings']

/** Real "create, edit, disable and manage administrator accounts and
 *  roles" super_admin surface, per the roles document. Only meaningful
 *  for general_admin accounts to have explicit permission checkboxes -
 *  fixed-role admins (inventory_admin, etc.) already imply their scope
 *  and don't need per-permission grants. */
export default function AdminAccounts() {
  const [admins, setAdmins] = useState<AdminAccountRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setAdmins(await fetchAdminAccounts())
    } catch (e: any) {
      setError(e.message ?? 'Failed to load admin accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleRoleChange(adminId: string, newRole: UserRole) {
    setBusyId(adminId)
    setError(null)
    try {
      await setAdminRole(adminId, newRole)
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to update role')
    } finally {
      setBusyId(null)
    }
  }

  async function handleTogglePermission(adminId: string, permission: PermissionKey, currentlyGranted: boolean) {
    setBusyId(adminId)
    setError(null)
    try {
      if (currentlyGranted) await revokePermission(adminId, permission)
      else await grantPermission(adminId, permission)
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to update permission')
    } finally {
      setBusyId(null)
    }
  }

  async function handleToggleActive(admin: AdminAccountRow) {
    const verb = admin.isActive ? 'Deactivate' : 'Reactivate'
    if (!confirm(`${verb} ${admin.fullName ?? admin.email ?? 'this admin'}? ${admin.isActive ? 'They will immediately lose admin access, but the account and its history stay intact and this can be reversed.' : 'They will regain the admin access their role grants.'}`)) return
    setBusyId(admin.id)
    setError(null)
    try {
      if (admin.isActive) await deactivateAdmin(admin.id)
      else await activateAdmin(admin.id)
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to update account status')
    } finally {
      setBusyId(null)
    }
  }

  async function handleTerminate(admin: AdminAccountRow) {
    const name = admin.fullName ?? admin.email ?? 'this admin'
    if (!confirm(`Permanently delete ${name}'s account? This cannot be undone - their login and account history will be gone for good. Deactivating instead is reversible; this is not.`)) return
    if (!confirm(`Really sure? Type-to-confirm isn't wired up here, so this second prompt is the only safety check: permanently delete ${name}?`)) return
    setBusyId(admin.id)
    setError(null)
    try {
      await terminateAdmin(admin.id)
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to terminate account')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="section">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin" className="text-muted">← Back to dashboard</Link>
      </div>
      <h1>Admin Accounts</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        Manage administrator roles and permissions. Only Super Admin can change these.
      </p>
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p className="text-muted">Loading admin accounts...</p>
      ) : admins.length === 0 ? (
        <p className="text-muted">No admin accounts found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {admins.map((admin) => (
            <div key={admin.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{admin.fullName ?? 'Unnamed admin'}</span>
                    {!admin.isActive && (
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 999, background: '#FDEBE1', color: '#B95C1E' }}>
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.85rem' }}>{admin.email ?? admin.id}</div>
                </div>
                <select
                  value={admin.role}
                  disabled={busyId === admin.id}
                  onChange={(e) => handleRoleChange(admin.id, e.target.value as UserRole)}
                  style={{ padding: '0.4rem 0.6rem' }}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {admin.role === 'general_admin' && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Granted permissions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ALL_PERMISSIONS.map((perm) => {
                      const granted = admin.permissions.includes(perm)
                      return (
                        <button
                          key={perm}
                          disabled={busyId === admin.id}
                          onClick={() => handleTogglePermission(admin.id, perm, granted)}
                          className={granted ? 'btn btn-secondary' : 'btn btn-outline'}
                          style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
                        >
                          {granted ? '✓ ' : ''}{PERMISSION_LABELS[perm]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline"
                  disabled={busyId === admin.id}
                  onClick={() => handleToggleActive(admin)}
                  style={admin.isActive
                    ? { color: 'var(--color-danger)', borderColor: 'var(--color-danger)', fontSize: '0.85rem' }
                    : { color: 'var(--color-success)', borderColor: 'var(--color-success)', fontSize: '0.85rem' }}
                >
                  {admin.isActive ? 'Deactivate' : 'Reactivate'}
                </button>
                <button
                  className="btn btn-outline"
                  disabled={busyId === admin.id}
                  onClick={() => handleTerminate(admin)}
                  style={{ color: 'white', background: 'var(--color-danger)', borderColor: 'var(--color-danger)', fontSize: '0.85rem' }}
                >
                  Terminate account
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
