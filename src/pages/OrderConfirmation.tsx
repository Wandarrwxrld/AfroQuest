import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order, OrderItem } from '../types/database'

export default function OrderConfirmation() {
  const { orderId } = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    Promise.all([
      (supabase as any).from('orders').select('*').eq('id', orderId).single(),
      (supabase as any).from('order_items').select('*').eq('order_id', orderId),
    ])
      .then(([orderRes, itemsRes]) => {
        if (orderRes.error) throw orderRes.error
        setOrder(orderRes.data)
        setItems(itemsRes.data ?? [])
      })
      .catch((err) => setError(err.message ?? 'Order not found'))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return <div className="section"><p className="text-muted">Loading...</p></div>
  if (error || !order) {
    return (
      <div className="section">
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'Order not found'}</p>
        <Link to="/shop" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to shop</Link>
      </div>
    )
  }

  return (
    <div className="section" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <h1>Order confirmed</h1>
      <p className="text-muted">Thank you - your order has been placed and is being processed.</p>

      <div className="card" style={{ padding: '1.25rem', marginTop: '1.5rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span className="text-muted">Order ID</span>
          <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{order.id.slice(0, 8)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span className="text-muted">Status</span>
          <span className="badge badge-instock" style={{ textTransform: 'capitalize' }}>{order.status}</span>
        </div>
        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.35rem 0' }}>
            <span>{item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''} x{item.quantity}</span>
            <span>K{(item.unit_price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <span>Total</span>
          <span>K{order.total.toFixed(2)}</span>
        </div>
      </div>

      <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Continue shopping</Link>
    </div>
  )
}
