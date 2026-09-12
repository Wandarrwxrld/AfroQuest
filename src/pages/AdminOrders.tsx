import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  fetchAllOrdersForAdmin,
  fetchOrderStatusHistory,
  updateOrderStatus,
  VALID_TRANSITIONS,
  type OrderWithItems,
  type StatusHistoryEntry,
} from '../lib/adminOrders'
import type { OrderStatus } from '../types/database'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#8B8A82',
  confirmed: '#3B7DD8',
  processing: '#F56419',
  packed: '#8B5CF6',
  shipped: '#1D9E75',
  delivered: '#15734F',
  cancelled: '#A32D2D',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrders(await fetchAllOrdersForAdmin())
    } catch (e: any) {
      setError(e.message ?? 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function toggleExpand(orderId: string) {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null)
      setHistory([])
      return
    }
    setExpandedOrderId(orderId)
    try {
      setHistory(await fetchOrderStatusHistory(orderId))
    } catch (e: any) {
      setError(e.message ?? 'Failed to load order history')
    }
  }

  async function handleTransition(orderId: string, newStatus: OrderStatus) {
    const notes = newStatus === 'cancelled' ? prompt('Reason for cancelling this order (optional):') ?? undefined : undefined
    setUpdating(orderId)
    setError(null)
    try {
      // The DB's update_order_status() is the real authority here - it
      // re-validates the transition and the caller's authorization
      // server-side regardless of what this UI offers, so a stale or
      // tampered client request still cannot force an illegal jump.
      await updateOrderStatus(orderId, newStatus, notes)

      // Real shipment-confirmation email, fire-and-forget: the status
      // update above already succeeded and is the thing that matters -
      // an email hiccup shouldn't surface as an error on a real,
      // successful status change. Previously silently discarded any
      // failure - now at least logged so it's not invisible.
      if (newStatus === 'shipped') {
        supabase.functions.invoke('send-order-email', { body: { orderId, emailType: 'shipment' } })
          .then(({ error }) => { if (error) console.error('[order-email] shipment send failed:', error) })
          .catch((err) => console.error('[order-email] shipment invoke threw:', err))
      }

      await refresh()
      if (expandedOrderId === orderId) setHistory(await fetchOrderStatusHistory(orderId))
    } catch (e: any) {
      setError(e.message ?? 'Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="section">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin" className="text-muted">← Back to dashboard</Link>
      </div>
      <h1>Order Management</h1>
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {loading ? (
        <p className="text-muted">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="text-muted">No orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
          {orders.map((order) => {
            const nextSteps = VALID_TRANSITIONS[order.status]
            return (
              <div key={order.id} className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleExpand(order.id)}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Order #{order.id.slice(0, 8)}</div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {order.delivery_name} · K{order.total.toFixed(2)} · {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="badge" style={{ background: `${STATUS_COLORS[order.status]}22`, color: STATUS_COLORS[order.status] }}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  {nextSteps.length === 0 ? (
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>No further action needed.</span>
                  ) : (
                    nextSteps.map((step) => (
                      <button
                        key={step}
                        className="btn btn-outline"
                        disabled={updating === order.id}
                        onClick={(e) => { e.stopPropagation(); handleTransition(order.id, step) }}
                        style={step === 'cancelled' ? { color: 'var(--color-danger)', borderColor: 'var(--color-danger)' } : undefined}
                      >
                        {updating === order.id ? 'Updating...' : `Mark as ${STATUS_LABELS[step]}`}
                      </button>
                    ))
                  )}
                </div>

                {expandedOrderId === order.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Items</div>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                        <span>{item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''} × {item.quantity}</span>
                        <span>K{(item.unit_price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}

                    <div style={{ fontSize: '0.85rem', fontWeight: 600, margin: '0.75rem 0 0.5rem' }}>Status history</div>
                    {history.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>No history yet.</p>
                    ) : (
                      history.map((h) => (
                        <div key={h.id} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', padding: '0.15rem 0' }}>
                          {STATUS_LABELS[h.status]} — {new Date(h.occurredAt).toLocaleString()}
                          {h.notes && ` (${h.notes})`}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
