import { Link } from 'react-router-dom'
import { useCart } from '../lib/CartContext'
import { resolveProductImageUrl } from '../lib/products'
import { CartRowsSkeleton } from '../components/Skeleton'

export default function Cart() {
  const { items, loading, updateQuantity, removeItem } = useCart()

  if (loading) return <div className="section"><h1>Your cart</h1><CartRowsSkeleton /></div>

  if (items.length === 0) {
    return (
      <div className="section">
        <h1>Your cart</h1>
        <p className="text-muted">Your cart is empty.</p>
        <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>Browse the shop</Link>
      </div>
    )
  }

  let total = 0

  return (
    <div className="section">
      <h1>Your cart</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
        {items.map((item) => {
          const isVariant = !!item.variant
          const product = isVariant ? item.variant!.product : item.simpleProduct!
          const unitPrice = isVariant ? (item.variant!.price_override ?? item.variant!.product.base_price) : item.simpleProduct!.base_price
          const available = isVariant ? item.variant!.inventory?.quantity ?? 0 : item.simpleProduct!.simple_inventory?.quantity ?? 0
          const label = isVariant ? [item.variant!.size, item.variant!.color].filter(Boolean).join(' / ') : null
          const lineTotal = unitPrice * item.quantity
          total += lineTotal
          const coverImage = [...(product.images ?? [])].sort((a, b) => a.display_order - b.display_order)[0]
          const imageUrl = resolveProductImageUrl(coverImage?.storage_path)

          return (
            <div key={item.id} className="card" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: 'var(--radius)', overflow: 'hidden', flexShrink: 0, background: 'white', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{product.name}</div>
                {label && <div className="text-muted" style={{ fontSize: '0.85rem' }}>{label}</div>}
                <div className="price" style={{ marginTop: '0.25rem' }}>K{unitPrice.toFixed(2)}</div>
                {item.quantity > available && (
                  <div style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Only {available} left in stock - reduce quantity before checkout.
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span style={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                <button className="btn btn-outline" onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= available}>+</button>
              </div>
              <button className="btn btn-outline" onClick={() => removeItem(item.id)}>Remove</button>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Total: K{total.toFixed(2)}</div>
        <Link to="/checkout" className="btn btn-primary">Proceed to checkout</Link>
      </div>
    </div>
  )
}
