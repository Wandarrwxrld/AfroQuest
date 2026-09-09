import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, loading: cartLoading, refresh } = useCart()
  const { profile } = useAuth()

  const [deliveryName, setDeliveryName] = useState(profile?.full_name ?? '')
  const [deliveryPhone, setDeliveryPhone] = useState(profile?.phone ?? '')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (cartLoading) return <div className="section"><p className="text-muted">Loading...</p></div>

  if (items.length === 0) {
    return (
      <div className="section">
        <h1>Checkout</h1>
        <p className="text-muted">Your cart is empty.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse the shop</Link>
      </div>
    )
  }

  let total = 0
  for (const item of items) {
    const unitPrice = item.variant
      ? item.variant.price_override ?? item.variant.product.base_price
      : item.simpleProduct!.base_price
    total += unitPrice * item.quantity
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // place_order() is a Postgres function: it locks and re-checks real
    // stock server-side (not the client's possibly-stale view), so this
    // is safe even if two people are buying the last item at once.
    const { data: orderId, error } = await (supabase as any).rpc('place_order', {
      p_delivery_name: deliveryName,
      p_delivery_phone: deliveryPhone,
      p_delivery_address: deliveryAddress,
      p_notes: notes || null,
    })

    setSubmitting(false)

    if (error) {
      // place_order() raises a real Postgres exception on insufficient
      // stock - surface that message directly rather than a generic one,
      // since it's actionable ("reduce quantity" etc).
      setError(error.message ?? 'Could not place order. Please try again.')
      return
    }

    // Real order-confirmation email, fire-and-forget: a slow or failed
    // email send should never block the customer from reaching their
    // confirmation page - the order itself already succeeded above.
    supabase.functions.invoke('send-order-email', { body: { orderId, emailType: 'confirmation' } }).catch(() => {})

    await refresh()
    navigate(`/order-confirmation/${orderId}`)
  }

  return (
    <div className="section" style={{ maxWidth: 560, margin: '0 auto' }}>
      <h1>Checkout</h1>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Order summary</div>
        {items.map((item) => {
          const product = item.variant ? item.variant.product : item.simpleProduct!
          const unitPrice = item.variant ? item.variant.price_override ?? item.variant.product.base_price : item.simpleProduct!.base_price
          return (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', padding: '0.35rem 0' }}>
              <span>{product.name} x{item.quantity}</span>
              <span>K{(unitPrice * item.quantity).toFixed(2)}</span>
            </div>
          )
        })}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <span>Total</span>
          <span>K{total.toFixed(2)}</span>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gap: '0.75rem' }}>
        <input placeholder="Full name" value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} required style={{ padding: '0.7rem' }} />
        <input placeholder="Phone number" value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} required style={{ padding: '0.7rem' }} />
        <textarea placeholder="Delivery address" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required rows={3} style={{ padding: '0.7rem', fontFamily: 'inherit' }} />
        <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ padding: '0.7rem', fontFamily: 'inherit' }} />
        {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
        <button className="btn btn-primary" disabled={submitting} type="submit">
          {submitting ? 'Placing order...' : `Place order - K${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  )
}
