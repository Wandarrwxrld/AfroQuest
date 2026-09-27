import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { updateProfile, fetchMyOrders, deleteMyAccount } from '../lib/account'
import type { Order, OrderStatus } from '../types/database'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  general_admin: 'General Admin',
  inventory_admin: 'Inventory Admin',
  order_admin: 'Order Admin',
  content_admin: 'Content Admin',
  admin: 'Admin',
  customer: 'Customer',
}

export default function MyAccount() {
  const { user, profile, isAdmin, isSuperAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setFullName(profile?.full_name ?? '')
    setPhone(profile?.phone ?? '')
  }, [profile])

  useEffect(() => {
    if (!user || isAdmin) return
    setOrdersLoading(true)
    fetchMyOrders(user.id)
      .then(setOrders)
      .finally(() => setOrdersLoading(false))
  }, [user, isAdmin])

  if (!user) return null

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    setSaveMessage(null)
    try {
      await updateProfile(user!.id, { full_name: fullName, phone })
      setSaveMessage('Saved.')
    } catch (err: any) {
      setSaveMessage(err.message ?? 'Could not save changes.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteMyAccount()
      await signOut()
      navigate('/')
    } catch (err: any) {
      setDeleteError(err.message ?? 'Could not delete your account. Please try again or contact us.')
      setDeleting(false)
    }
  }

  return (
    <div className="section" style={{ maxWidth: 640 }}>
      <h1 style={{ marginBottom: '0.25rem' }}>My account</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        {user.email} · {ROLE_LABELS[profile?.role ?? 'customer']}
      </p>

      {/* Profile - shared by everyone */}
      <section className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Profile</h2>
        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Full name
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--color-border)' }}
            />
          </label>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            Phone
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ display: 'block', width: '100%', marginTop: '0.35rem', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--color-border)' }}
            />
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button type="submit" disabled={savingProfile} className="btn" style={{ background: 'var(--color-primary)', color: 'white' }}>
              {savingProfile ? 'Saving...' : 'Save changes'}
            </button>
            {saveMessage && <span className="text-muted" style={{ fontSize: '0.85rem' }}>{saveMessage}</span>}
          </div>
        </form>
      </section>

      {/* Admin tools - only for admin-tier accounts */}
      {isAdmin && (
        <section className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Admin tools</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
            <Link to="/admin" className="btn btn-outline">Go to admin dashboard</Link>
            {isSuperAdmin && (
              <Link to="/admin/accounts" className="btn btn-outline">Manage admin accounts</Link>
            )}
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '1rem' }}>
            To close an admin account, a super admin needs to deactivate or terminate it from
            Admin Accounts - self-service deletion is turned off for admin-tier accounts so a
            role with real store access can't be removed by accident.
          </p>
        </section>
      )}

      {/* Order history + wishlist + self-delete - only for customers */}
      {!isAdmin && (
        <>
          <section className="card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', margin: 0 }}>Order history</h2>
              <Link to="/wishlist" className="text-muted" style={{ fontSize: '0.85rem' }}>View wishlist →</Link>
            </div>
            {ordersLoading ? (
              <p className="text-muted">Loading...</p>
            ) : orders.length === 0 ? (
              <p className="text-muted">No orders yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {orders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/order-confirmation/${o.id}`}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 1rem', borderRadius: 'var(--radius)', border: '1.5px solid var(--color-border)',
                      textDecoration: 'none', color: 'var(--color-text)',
                    }}
                  >
                    <span>
                      <span style={{ fontWeight: 600 }}>K{o.total.toFixed(2)}</span>
                      <span className="text-muted" style={{ marginLeft: '0.6rem', fontSize: '0.85rem' }}>
                        {new Date(o.created_at).toLocaleDateString()}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{STATUS_LABELS[o.status]}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--color-danger)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-danger)' }}>Delete account</h2>
            <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              This permanently deletes your account and login. This can't be undone.
            </p>
            {deleteError && <p style={{ color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{deleteError}</p>}
            {!deleteConfirming ? (
              <button className="btn btn-outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => setDeleteConfirming(true)}>
                Delete my account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button
                  className="btn"
                  disabled={deleting}
                  style={{ background: 'var(--color-danger)', color: 'white' }}
                  onClick={handleDeleteAccount}
                >
                  {deleting ? 'Deleting...' : 'Yes, permanently delete my account'}
                </button>
                <button className="btn btn-outline" disabled={deleting} onClick={() => setDeleteConfirming(false)}>
                  Cancel
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
