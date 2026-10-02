import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ShieldCheck, Truck, MessageCircle, Tag } from 'lucide-react'
import { fetchActiveProducts, fetchBestSellingProducts, fetchHomeCategoryTiles, resolveProductImageUrl } from '../lib/products'
import ProductCarousel from '../components/ProductCarousel'
import ShoppableRoom from '../components/ShoppableRoom'
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

  // Borrowed selectively from the A-dam style reference: a slim
  // announcement strip pinned above the hero. Unlike A-dam's promo
  // copy, this isn't a marketing claim - it's real category names
  // pulled from the same data already fetched for the page, so it
  // answers "do you sell what I'm looking for?" honestly instead of
  // asserting something unverified (e.g. a shipping promise).
  const stripCategories = categoryTiles.slice(0, 5).map((t) => t.category.name)

  return (
    <div>
      {/* Availability strip */}
      {stripCategories.length > 0 && (
        <div style={{ background: 'var(--color-accent)', color: 'white', textAlign: 'center', padding: '0.5rem 1rem' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.02em' }}>
            In stock now: {stripCategories.join(' · ')}
          </p>
        </div>
      )}

      {/* Hero */}
      {/* Hero, per the animation reference doc's 3.1 spec: a large real
          product photo occupies most of the hero, headline enters
          smoothly (not abrupt), buttons have subtle hover movement.
          Full-bleed background + overlay rather than a side-by-side
          split, since a photo genuinely occupying "a major part of the
          hero" is the explicit requirement. Uses the same real
          best-seller photo as before - never a stock image. */}
      <section
        style={{
          position: 'relative',
          minHeight: 520,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: 'var(--color-dark)',
        }}
      >
        {heroImage && (
          <div style={{ position: 'absolute', inset: 0 }}>
            <SmartImage src={heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(90deg, rgba(30,27,38,0.94) 0%, rgba(30,27,38,0.78) 45%, rgba(30,27,38,0.3) 100%)',
              }}
            />
          </div>
        )}

        <div style={{ position: 'relative', maxWidth: 1280, margin: '0 auto', padding: 'var(--space-64) var(--space-24)', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ maxWidth: 580 }}
          >
            <div style={{ fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.05rem', color: 'var(--color-accent)', marginBottom: 'var(--space-12)' }}>
              Built for the job site
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 5.8vw, 4.1rem)', lineHeight: 1.02, margin: 0, color: 'white', fontWeight: 800 }}>
              Kitted out for whatever the site throws at you.
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#DCE1E6', maxWidth: 480, marginTop: 'var(--space-16)' }}>
              Safety footwear, workwear, and PPE for Zambia's industrial and mining workforce.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-12)', marginTop: 'var(--space-32)', flexWrap: 'wrap' }}>
              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                <Link to="/shop" className="btn" style={{ background: 'var(--color-primary)', color: 'white', padding: '0.9rem 1.75rem', fontSize: '1rem', display: 'inline-block' }}>
                  Shop now
                </Link>
              </motion.div>
              {heroProduct?.category?.slug && (
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Link
                    to={`/shop/${heroProduct.category.slug}`}
                    className="btn btn-outline"
                    style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white', padding: '0.9rem 1.75rem', fontSize: '1rem', display: 'inline-block' }}
                  >
                    Shop {heroProduct.category.name}
                  </Link>
                </motion.div>
              )}
            </div>
          </motion.div>
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
        {/* Shop by category - moved ahead of Best Sellers: this is the
            section that most directly answers "do you sell what I'm
            looking for", so a first-time visitor should hit it before
            anything curated. Tiles are bigger and bolder than before -
            borrowed from the reference doc's "category card" pattern
            (large photo, bold centered identity, no price/rating
            clutter) rather than treating these like product cards. */}
        {categoryTiles.length > 0 && (
          <section style={{ marginTop: '2.5rem' }}>
            <h2 style={{ marginBottom: '1.25rem' }}>Shop by category</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '1.5rem' }}>
              {categoryTiles.map((tile) => (
                <Link
                  key={tile.category.id}
                  to={`/shop/${tile.category.slug}`}
                  className="category-tile"
                  style={{ aspectRatio: '4 / 5' }}
                >
                  <SmartImage src={tile.imageUrl} alt={tile.category.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="category-tile-label" style={{ fontSize: '1.3rem', left: '1.25rem', right: '1.25rem', bottom: '1.25rem' }}>
                    {tile.category.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Best sellers - ranked by real order counts, not a guess */}
        <section style={{ marginTop: '3.5rem' }}>
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

        {/* Shop the room - click a pin to see that zone's real
            subcategories. Built from a styled product room image with
            the New Balance-lookalike logo removed for trademark safety;
            since it's a rendered scene rather than real photography,
            pins link to categories rather than one exact product. */}
        <section style={{ marginTop: '3.5rem' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Shop the room</h2>
          <ShoppableRoom />
        </section>

        {/* Brand moment - the intro animation as a full-bleed cinematic
            background rather than a small boxed player, echoing the
            hero's dark-overlay treatment so it reads as a deliberate
            visual break in the page rather than an afterthought.
            Muted + playsInline so mobile browsers allow the autoplay. */}
        <section
          style={{
            position: 'relative',
            marginTop: '3.5rem',
            marginLeft: 'calc(50% - 50vw)',
            marginRight: 'calc(50% - 50vw)',
            minHeight: 420,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            background: 'var(--color-dark)',
          }}
        >
          <video
            src="/videos/afroquest-intro.mp4"
            poster="/videos/afroquest-intro-poster.jpg"
            autoPlay
            loop
            muted
            playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(36,35,49,0.55) 0%, rgba(36,35,49,0.75) 100%)',
            }}
          />
          <div style={{ position: 'relative', textAlign: 'center', padding: '2rem 1.5rem', maxWidth: 640 }}>
            <h2 style={{ color: 'white', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: 0, lineHeight: 1.15 }}>
              Real gear, tested where it matters — on the job.
            </h2>
            <Link
              to="/shop"
              className="btn"
              style={{ display: 'inline-flex', marginTop: '1.5rem', background: 'var(--color-primary)', color: 'white', padding: '0.85rem 1.75rem' }}
            >
              Shop now
            </Link>
          </div>
        </section>

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
