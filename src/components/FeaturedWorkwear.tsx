import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ProductWithDetails } from '../types/database'
import { resolveProductImageUrl, computeStockStatus } from '../lib/products'
import SmartImage from './SmartImage'

/** Real stepped/hover-expand gallery per the animation reference doc's
 *  "Featured Workwear" spec: an asymmetric row where the hovered card
 *  grows and its siblings recede, using shared hover state across the
 *  whole group (not independent per-card :hover) so the group actually
 *  reacts together, matching "the focused product expands on hover". */
export default function FeaturedWorkwear({ products }: { products: ProductWithDetails[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  if (products.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 'var(--space-16)', height: 380 }}>
      {products.slice(0, 4).map((product) => {
        const isHovered = hoveredId === product.id
        const coverImage = [...product.images].sort((a, b) => a.display_order - b.display_order)[0]
        const imageUrl = resolveProductImageUrl(coverImage?.storage_path)
        const stock = computeStockStatus(product)

        return (
          <motion.div
            key={product.id}
            onHoverStart={() => setHoveredId(product.id)}
            onHoverEnd={() => setHoveredId(null)}
            animate={{ flexGrow: isHovered ? 2.6 : 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              flexBasis: 0,
              minWidth: 0,
              borderRadius: 'var(--radius-card)',
              overflow: 'hidden',
              background: 'var(--color-dark)',
            }}
          >
            <Link to={`/product/${product.slug}`} style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}>
              <SmartImage
                src={imageUrl}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isHovered ? 1 : 0.8, transition: 'opacity 0.3s ease' }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(0deg, rgba(30,27,38,0.9) 0%, rgba(30,27,38,0.1) 55%, transparent 100%)',
                }}
              />
              <motion.div
                animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
                transition={{ duration: 0.25 }}
                style={{ position: 'absolute', bottom: 'var(--space-20)', left: 'var(--space-20)', right: 'var(--space-20)', color: 'white' }}
              >
                {product.brand && (
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', opacity: 0.8 }}>{product.brand}</div>
                )}
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 'var(--space-4)' }}>{product.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', marginTop: 'var(--space-8)' }}>
                  <span style={{ fontWeight: 700 }}>K{product.base_price.toFixed(2)}</span>
                  <span className={`badge ${stock.className}`}>{stock.label}</span>
                </div>
              </motion.div>
              {/* When not hovered, still show a minimal always-visible label
                  so the collapsed cards aren't blank - matches "others
                  recede" rather than "others disappear". */}
              {!isHovered && (
                <div style={{ position: 'absolute', bottom: 'var(--space-16)', left: 'var(--space-16)', right: 'var(--space-16)', color: 'white' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.name}</div>
                </div>
              )}
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
