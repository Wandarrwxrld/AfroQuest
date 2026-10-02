import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchProductBySlug, fetchSimpleStock, resolveProductImageUrl, computeStockStatus } from '../lib/products'
import { useCart } from '../lib/CartContext'
import { useFlyToCart } from '../lib/FlyToCartContext'
import { useAuth } from '../lib/AuthContext'
import { ProductDetailsSkeleton } from '../components/Skeleton'
import type { ProductWithDetails, SimpleInventory } from '../types/database'

type SizeSystem = 'uk' | 'eu' | 'us'

export default function ProductDetails() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addVariantToCart, addSimpleToCart } = useCart()
  const { triggerFlyToCart } = useFlyToCart()

  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [simpleStock, setSimpleStock] = useState<SimpleInventory | null>(null)
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null)
  const [selectedColor, setSelectedColorState] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [sizeSystem, setSizeSystem] = useState<SizeSystem>('uk')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addedMessage, setAddedMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)
    setSelectedImageIndex(0)
    fetchProductBySlug(slug)
      .then(async (p) => {
        setProduct(p)
        if (p.product_type === 'apparel_footwear' && p.variants.length > 0) {
          setSelectedVariantId(p.variants[0].id)
          const firstColor = p.variants.find((v) => v.color)?.color ?? null
          setSelectedColorState(firstColor)
        }
        if (p.product_type === 'simple') {
          setSimpleStock(await fetchSimpleStock(p.id))
        }
      })
      .catch((err) => setError(err.message ?? 'Product not found'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <ProductDetailsSkeleton />
  if (error || !product) {
    return (
      <div className="section">
        <p style={{ color: 'var(--color-danger)' }}>{error ?? 'Product not found'}</p>
        <Link to="/shop" className="btn btn-outline" style={{ marginTop: '1rem' }}>Back to shop</Link>
      </div>
    )
  }

  // Same unresolved tsc -b narrowing issue documented elsewhere in this
  // codebase (see adminProducts.ts KNOWN ISSUE) - `if (error || !product) return`
  // above should narrow `product` to non-null below, and does at runtime,
  // but this compiler doesn't consistently carry that narrowing through
  // this file. `p` is guaranteed non-null here since we already returned above.
  const p = product!

  // Real fix: previously only ever showed images[0]. Every assigned photo
  // is now actually rendered as a thumbnail strip + main image, matching
  // how a Nike/CAT product page shows multiple angles of the same item.
  const sortedImages = [...p.images].sort((a, b) => a.display_order - b.display_order)
  const activeImage = sortedImages[selectedImageIndex] ?? sortedImages[0]
  const imageUrl = resolveProductImageUrl(activeImage?.storage_path)

  const stock = computeStockStatus(p, simpleStock?.quantity)
  const selectedVariant = p.variants.find((v) => v.id === selectedVariantId)
  const displayPrice = selectedVariant?.price_override ?? p.base_price

  // Group variants by color so the side panel can show "Select color"
  // then "Select size" within that color - exactly the Nike/CAT pattern,
  // and directly needed since AfroQuest's own boots come in multiple
  // colors of the same shoe (the brief's own example).
  const colors = Array.from(new Set(p.variants.map((v) => v.color).filter(Boolean))) as string[]

  const sizesForColor = p.variants.filter((v) => !selectedColor || v.color === selectedColor)

  function sizeLabel(v: (typeof p.variants)[number]): string {
    if (sizeSystem === 'eu' && v.size_eu) return v.size_eu
    if (sizeSystem === 'us' && v.size_us) return v.size_us
    if (sizeSystem === 'uk' && v.size_uk) return v.size_uk
    return v.size ?? '—'
  }

  async function handleAddToCart(e: React.MouseEvent<HTMLButtonElement>) {
    // currentTarget is only valid during the event dispatch itself - it
    // is null after the first await below, so capture it up front.
    const sourceEl = e.currentTarget
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
      triggerFlyToCart(imageUrl, sourceEl)
    } catch (e: any) {
      setError(e.message ?? 'Failed to add to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="section" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '1.5rem' }}>
      {/* Thumbnail strip - every assigned image, not just the first */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {sortedImages.length > 0 ? (
          sortedImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedImageIndex(i)}
              style={{
                aspectRatio: '1',
                border: i === selectedImageIndex ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                padding: 0,
                cursor: 'pointer',
                background: 'white',
              }}
            >
              <img
                src={resolveProductImageUrl(img.storage_path)}
                alt={`${p.name} view ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </button>
          ))
        ) : null}
      </div>

      {/* Main image - uniform white background, contained (not cropped/zoomed) */}
      <div style={{ aspectRatio: '1', background: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <img src={imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: activeImage ? 1 : 0.35, filter: activeImage ? 'none' : 'grayscale(1)' }} />
      </div>

      <div>
        {p.brand && <div className="text-muted" style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{p.brand}</div>}
        <h1 style={{ margin: '0.25rem 0 0.75rem' }}>{p.name}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <span className="price" style={{ fontSize: '1.4rem' }}>K{displayPrice.toFixed(2)}</span>
          <span className={`badge ${stock.className}`}>{stock.label}</span>
        </div>

        {p.description && <p className="text-muted" style={{ lineHeight: 1.6 }}>{p.description}</p>}

        {p.features && p.features.length > 0 && (
          <ul style={{ margin: '1rem 0', paddingLeft: '1.1rem', fontSize: '0.9rem', lineHeight: 1.8 }}>
            {p.features.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        )}

        {p.product_type === 'apparel_footwear' && p.variants.length > 0 && (
          <div style={{ margin: '1.5rem 0', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            {colors.length > 1 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Select color: {selectedColor}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => { setSelectedColorState(c); setSelectedVariantId(null) }}
                      className={selectedColor === c ? 'btn btn-secondary' : 'btn btn-outline'}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select size</span>
              <div style={{ display: 'flex', gap: '0.25rem', fontSize: '0.75rem' }}>
                {(['uk', 'eu', 'us'] as SizeSystem[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSizeSystem(s)}
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                      background: sizeSystem === s ? 'var(--color-dark)' : 'transparent',
                      color: sizeSystem === s ? 'white' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {sizesForColor.map((v) => {
                const outOfStock = (v.inventory?.quantity ?? 0) <= 0
                return (
                  <button
                    key={v.id}
                    disabled={outOfStock}
                    onClick={() => setSelectedVariantId(v.id)}
                    className={selectedVariantId === v.id ? 'btn btn-secondary' : 'btn btn-outline'}
                    style={{ opacity: outOfStock ? 0.4 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer', minWidth: 52 }}
                  >
                    {sizeLabel(v)}{outOfStock ? ' ×' : ''}
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
