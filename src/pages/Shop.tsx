import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchActiveProducts } from '../lib/products'
import ProductCard from '../components/ProductCard'
import type { ProductWithDetails } from '../types/database'

export default function Shop() {
  const { category } = useParams()
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchActiveProducts(category)
      .then(setProducts)
      .catch((err) => setError(err.message ?? 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="section">
      <h1 style={{ marginBottom: '1.5rem' }}>{category ? category.replace(/-/g, ' ') : 'Shop all'}</h1>
      {loading && <p className="text-muted">Loading products...</p>}
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p className="text-muted">No products here yet.</p>
      )}
      {!loading && products.length > 0 && (
        <div className="grid-products">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  )
}
