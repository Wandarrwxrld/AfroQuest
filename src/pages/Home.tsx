import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fetchActiveProducts } from '../lib/products'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeleton'
import type { ProductWithDetails } from '../types/database'

const CATEGORY_TILES = [
  { name: 'Steel Toe Boots', slug: 'steel-toe-boots', copy: 'Waterproof, composite and steel toe protection.' },
  { name: 'Safety Helmets', slug: 'safety-helmets', copy: 'Hard-shell protection for every site.' },
  { name: 'Gloves', slug: 'gloves', copy: 'Grip and protection for industrial work.' },
]

export default function Home() {
  const [featured, setFeatured] = useState<ProductWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveProducts()
      .then((products) => setFeatured(products.slice(0, 4)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero - one deliberate entrance, not scattered fade-ins everywhere */}
      <section
        style={{
          background: 'var(--color-dark)',
          color: 'white',
          padding: '4.5rem 1.5rem',
          marginBottom: '3rem',
        }}
      >
        <motion.div
          style={{ maxWidth: 1200, margin: '0 auto' }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h1 className="display" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', lineHeight: 1.1, margin: 0, maxWidth: 640 }}>
            Built for the job. Trusted on site.
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#C9C7BE', maxWidth: 520, marginTop: '1rem' }}>
            Safety footwear, workwear, and PPE for Zambia's industrial and mining workforce.
          </p>
          <Link
            to="/shop"
            className="btn"
            style={{ background: 'var(--color-primary)', color: 'white', marginTop: '1.75rem', padding: '0.9rem 1.75rem', fontSize: '1rem' }}
          >
            Shop now
          </Link>
        </motion.div>
      </section>

      <div className="site-main">
        {/* Category tiles - real doors into the catalog, not decoration */}
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Shop by category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {CATEGORY_TILES.map((cat) => (
              <Link
                key={cat.slug}
                to={`/shop/${cat.slug}`}
                className="card"
                style={{ padding: '1.5rem', textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
                  {cat.name}
                </div>
                <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>{cat.copy}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured products - real live data, not filler */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Featured</h2>
            <Link to="/shop" className="text-muted" style={{ fontSize: '0.9rem' }}>View all</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : featured.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="text-muted">Products are on the way - check back soon.</p>
            </div>
          ) : (
            <div className="grid-products">
              {featured.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
