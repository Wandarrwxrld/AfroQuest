import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { fetchActiveProducts } from '../lib/products'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeleton'
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

      {loading && <ProductGridSkeleton />}

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Nothing here yet</p>
          <p className="text-muted">New stock is on the way - check back soon.</p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <motion.div
          className="grid-products"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
        >
          {products.map((p) => (
            <motion.div
              key={p.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.25 }}
            >
              <ProductCard product={p} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
