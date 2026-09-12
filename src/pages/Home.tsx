import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ShieldCheck, Truck, MessageCircle, Tag } from 'lucide-react'
import { fetchActiveProducts, fetchBestSellingProducts, fetchHomeCategoryTiles, resolveProductImageUrl } from '../lib/products'
import ProductCarousel from '../components/ProductCarousel'
import SmartImage from '../components/SmartImage'
import { ProductGridSkeleton } from '../components/Skeleton'
import type { ProductWithDetails } from '../types/database'
import type { CategoryTile } from '../lib/products'

const TRUST_ITEMS = [
  { icon: Truck, title: 'Delivery countrywide', copy: 'Ask us about delivery timeframes and cost for your area.' },
  { icon: ShieldCheck, title: 'Genuine safety gear', copy: 'Certified PPE and safety footwear, sourced for real site conditions.' },
  { icon: MessageCircle, title: 'Not sure what you need?', copy: 'Message us your job and site conditions - we\u2019ll point you to the right gear.' },
  { icon: Tag, title: 'Current deals', copy: 'Check the shop for this month\u2019s discounted lines.' },
]

export default function Home() {
  const [bestSellers, setBestSellers] = useState<ProductWithDetails[]>([])
  const [newArrivals, setNewArrivals] = useState<ProductWithDetails[]>([])
  const [categoryTiles, setCategoryTiles] = useState<CategoryTile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchBestSellingProducts(10), fetchActiveProducts(), fetchHomeCategoryTiles(8)])
      .then(([sellers, active, tiles]) => {
        setBestSellers(sellers)
        setNewArrivals(active.slice(0, 10))
        setCategoryTiles(tiles)
      })
      .finally(() => setLoading(false))
  }, [])

  // Hero shows a real best seller (falls back to the newest active
  // product) so it's never a stock photo and never goes stale.
  const heroProduct = bestSellers[0] ?? newArrivals[0]
  const heroImage = heroProduct
    ? resolveProductImageUrl([...heroProduct.images].sort((a, b) => a.display_order - b.display_order)[0]?.storage_path)
    : null

  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'var(--color-dark)', color: 'white', overflow: 'hidden' }}>
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '3.5rem 1.5rem',
            display: 'grid',
            gridTemplateColumns: heroImage ? '1.1fr 1fr' : '1fr',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <h1 className="display" style={{ fontSize: 'clamp(2.1rem, 5vw, 3.5rem)', lineHeight: 1.08, margin: 0, maxWidth: 560 }}>
              Kitted out for whatever the site throws at you.
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#C9C7BE', maxWidth: 480, marginTop: '1rem' }}>
              Safety footwear, workwear, and PPE for Zambia's industrial and mining workforce.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.75rem', flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn" style={{ background: 'var(--color-primary)', color: 'white', padding: '0.9rem 1.75rem', fontSize: '1rem' }}>
                Shop now
              </Link>
              {heroProduct?.category?.slug && (
                <Link
                  to={`/shop/${heroProduct.category.slug}`}
                  className="btn btn-outline"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white', padding: '0.9rem 1.75rem', fontSize: '1rem' }}
                >
                  Shop {heroProduct.category.name}
                </Link>
              )}
            </div>
          </motion.div>

          {heroImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
              style={{ position: 'relative', aspectRatio: '1', maxHeight: 420, justifySelf: 'center' }}
            >
              <div style={{ position: 'absolute', inset: '10%', background: 'radial-gradient(circle, rgba(245,100,25,0.35), transparent 70%)' }} />
              <SmartImage
                src={heroImage}
                alt={heroProduct!.name}
                style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* Quick category nav - built from real categories that actually
          have active products, so a pill can never 404. */}
      {categoryTiles.length > 0 && (
        <div className="site-main" style={{ paddingTop: '1.75rem', paddingBottom: 0 }}>
          <nav className="pill-nav" aria-label="Shop by category shortcuts">
            {categoryTiles.slice(0, 6).map((tile) => (
              <Link key={tile.category.id} to={`/shop/${tile.category.slug}`} className="pill-link">
                {tile.category.name}
              </Link>
            ))}
            <Link to="/shop" className="pill-link">All products</Link>
          </nav>
        </div>
      )}

      <div className="site-main">
        {/* Best sellers - ranked by real order counts, not a guess */}
        <section style={{ marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>Best sellers</h2>
            <Link to="/shop" className="text-muted" style={{ fontSize: '0.9rem' }}>View all</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : bestSellers.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="text-muted">Products are on the way - check back soon.</p>
            </div>
          ) : (
            <ProductCarousel products={bestSellers} />
          )}
        </section>

        {/* Shop by category - each tile's photo is a real product from that category */}
        {categoryTiles.length > 0 && (
          <section style={{ marginTop: '3.5rem' }}>
            <h2 style={{ marginBottom: '1.25rem' }}>Shop by category</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
              {categoryTiles.map((tile) => (
                <Link key={tile.category.id} to={`/shop/${tile.category.slug}`} className="category-tile">
                  <SmartImage src={tile.imageUrl} alt={tile.category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="category-tile-label">{tile.category.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* New arrivals - genuinely the most recently listed active products */}
        <section style={{ marginTop: '3.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <h2 style={{ margin: 0 }}>New arrivals</h2>
            <Link to="/shop" className="text-muted" style={{ fontSize: '0.9rem' }}>View all</Link>
          </div>
          {loading ? (
            <ProductGridSkeleton count={4} />
          ) : newArrivals.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p className="text-muted">Products are on the way - check back soon.</p>
            </div>
          ) : (
            <ProductCarousel products={newArrivals} />
          )}
        </section>
      </div>

      {/* Trust strip */}
      <section style={{ background: 'var(--color-dark)', color: 'white', marginTop: '4rem', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          {TRUST_ITEMS.map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <Icon size={28} color="var(--color-accent)" strokeWidth={1.75} />
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginTop: '0.75rem' }}>{title}</div>
              <p style={{ color: '#C9C7BE', fontSize: '0.9rem', marginTop: '0.4rem' }}>{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
