import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { searchProducts } from '../lib/products'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeleton'
import type { ProductWithDetails } from '../types/database'

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [products, setProducts] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    searchProducts(query)
      .then(setProducts)
      .catch((err) => setError(err.message ?? 'Search failed'))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="section">
      <h1 style={{ marginBottom: '0.5rem' }}>Search results</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
        {query ? <>Showing results for "<strong style={{ color: 'var(--color-text)' }}>{query}</strong>"</> : 'Enter a search term to find products.'}
      </p>

      {loading && <ProductGridSkeleton />}

      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {!loading && !error && query && products.length === 0 && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No products matched "{query}"</p>
          <p className="text-muted">Try a different word, or browse the full shop instead.</p>
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
