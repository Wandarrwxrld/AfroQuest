import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchProductBySlug, fetchSimpleStock, resolveProductImageUrl, computeStockStatus } from '../lib/products'
import { useCart } from '../lib/CartContext'
import { useAuth } from '../lib/AuthContext'
import type { ProductWithDetails, SimpleInventory } from '../types/database'

export default function ProductDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addVariantToCart, addSimpleToCart } = useCart()

  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [simpleStock, setSimpleStock] = useState<SimpleInventory | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addedMessage, setAddedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    fetchProductBySlug(slug)
      .then(async (p) => {
        setProduct(p)
        if (p.product_type === 'apparel_footwear' && p.variants.length > 0) {
          setSelectedVariantId(p.variants[0].id)
        }
        if (p.product_type === 'simple') {
          setSimpleStock(await fetchSimpleStock(p.id))
        }
      })
      .catch((err) => setError(err.message ?? 'Product not found'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="section"><p className="text-muted">Loading...</p></div>
  if (error || !product) {
    return (
      <div className="section">
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'Product not found'}</p>
        <Link to="/shop" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to shop</Link>
      </div>
    )
  }

  const coverImage = [...product.images].sort((a, b) => a.display_order - b.display_order)[0]
  const imageUrl = resolveProductImageUrl(coverImage?.storage_path)
  const stock = computeStockStatus(product, simpleStock?.quantity)
  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId)
  const displayPrice = selectedVariant?.price_override ?? product.base_price

  async function handleAddToCart() {
    if (!user) {
      navigate('/login')
      return
    }
    setAdding(true)
    setAddedMessage(null)
    try {
      if (product!.product_type === 'apparel_footwear' && selectedVariantId) {
        await addVariantToCart(selectedVariantId)
      } else {
        await addSimpleToCart(product!.id)
      }
      setAddedMessage('Added to cart.')
    } catch (e: any) {
      setError(e.message ?? 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
      <div style={{ aspectRatio: '1', background: '#F1EFE8', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div>
        {product.brand && <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{product.brand}</div>}
        <h1 style={{ margin: '0.25rem 0 0.75rem' }}>{product.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span className="price" style={{ fontSize: '1.4rem' }}>K{displayPrice.toFixed(2)}</span>
          <span className={`badge ${stock.className}`}>{stock.label}</span>
        </div>

        {product.description && <p className="text-muted" style={{ lineHeight: 1.6 }}>{product.description}</p>}

        {product.product_type === 'apparel_footwear' && product.variants.length > 0 && (
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select size / color</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {product.variants.map((v) => {
                const label = [v.size, v.color].filter(Boolean).join(' / ') || 'Default'
                const outOfStock = (v.inventory?.quantity ?? 0) <= 0
                return (
                  <button
                    key={v.id}
                    disabled={outOfStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={selectedVariantId === v.id ? 'btn btn-secondary' : 'btn btn-outline'}
                    style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    {label}{outOfStock ? ' (out)' : ''}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={stock.label === 'Out of stock' || adding} onClick={handleAddToCart}>
          {adding ? 'Adding...' : user ? 'Add to cart' : 'Log in to add to cart'}
        </button>
        {addedMessage && <p style={{ color: 'var(--color-success)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{addedMessage} <Link to="/cart">View cart</Link></p>}
      </div>
    </div>
  )
}
