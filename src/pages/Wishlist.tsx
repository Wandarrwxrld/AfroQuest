import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchWishlist } from '../lib/wishlist'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeleton'
import type { ProductWithDetails } from '../types/database'

export default function Wishlist() {
  const { user } = useAuth()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetchWishlist(user.id)
      .then(setProducts)
      .catch((err) => setError(err.message ?? 'Could not load your wishlist'))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="section">
      <h1 style={{ marginBottom: '1.5rem' }}>My wishlist</h1>

      {loading && <ProductGridSkeleton />}

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Your wishlist is empty</p>
          <p className="text-muted" style={{ marginBottom: '1.25rem' }}>
            Tap the heart on any product to save it here for later.
          </p>
          <Link to="/shop" className="btn" style={{ background: 'var(--color-primary)', color: 'white', display: 'inline-flex' }}>
            Browse the shop
          </Link>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid-products">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
