import { Link } from 'react-router-dom'
import type { ProductWithDetails } from '../types/database'
import { resolveProductImageUrl, computeStockStatus } from '../lib/products'
import SmartImage from './SmartImage'
import WishlistButton from './WishlistButton'

export default function ProductCard({ product }: { product: ProductWithDetails }) {
  const coverImage = [...product.images].sort((a, b) => a.display_order - b.display_order)[0]
  const imageUrl = resolveProductImageUrl(coverImage?.storage_path)
  const stock = computeStockStatus(product)

  return (
    <Link to={`/product/${product.slug}`} className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '0.6rem', right: '0.6rem', zIndex: 1 }}>
        <WishlistButton productId={product.id} />
      </div>
      <div style={{ aspectRatio: '1', background: 'white', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <SmartImage src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '1rem' }}>
        {product.brand && (
          <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            {product.brand}
          </div>
        )}
        <div style={{ fontWeight: 600, margin: '0.25rem 0 0.5rem' }}>{product.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="price">K{product.base_price.toFixed(2)}</span>
          <span className={`badge ${stock.className}`}>{stock.label}</span>
        </div>
      </div>
    </Link>
  )
}
