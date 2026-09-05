import { useState, useEffect, useCallback } from 'react'
import {
  listStagedImages,
  uploadStagedImage,
  assignImageToProduct,
  discardStagedImage,
  type StagedImage,
} from '../lib/imageStaging'
import { fetchCategoryTree, createProduct, fetchRecentProductsForAdmin, setProductActive } from '../lib/adminProducts'
import type { Category, Product, ProductType } from '../types/database'

export default function AdminDashboard() {
  const [staged, setStaged] = useState<StagedImage[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<(Category & { children: Category[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [assignTarget, setAssignTarget] = useState<string>('') // productId or 'new'
  const [error, setError] = useState<string | null>(null)

  // New product form state (only shown when assignTarget === 'new')
  const [newName, setNewName] = useState('')
  const [newBrand, setNewBrand] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newType, setNewType] = useState<ProductType>('apparel_footwear')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [imgs, prods, cats] = await Promise.all([
        listStagedImages(),
        fetchRecentProductsForAdmin(),
        fetchCategoryTree(),
      ])
      setStaged(imgs)
      setProducts(prods)
      setCategories(cats)
    } catch (e: any) {
      setError(e.message ?? 'Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      // Sequential on purpose: Storage upload is the bottleneck, and keeping
      // this simple beats a half-finished Promise.all on a flaky connection.
      for (const file of Array.from(files)) {
        await uploadStagedImage(file, '(manual upload)')
      }
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function toggleSelect(path: string) {
    setSelectedImages((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }

  async function handleAssign() {
    if (selectedImages.size === 0) return
    setError(null)
    try {
      let targetProductId = assignTarget

      if (assignTarget === 'new') {
        if (!newName || !newPrice || !newCategoryId) {
          setError('Name, price, and category are required for a new product.')
          return
        }
        const product = await createProduct({
          name: newName,
          brand: newBrand || undefined,
          basePrice: parseFloat(newPrice),
          categoryId: newCategoryId,
          productType: newType,
        })
        targetProductId = product.id
      }

      if (!targetProductId) {
        setError('Pick a product to assign these photos to.')
        return
      }

      const imagesToAssign = staged.filter((s) => selectedImages.has(s.storagePath))
      for (let i = 0; i < imagesToAssign.length; i++) {
        await assignImageToProduct(imagesToAssign[i], targetProductId, i)
      }

      setSelectedImages(new Set())
      setAssignTarget('')
      setNewName(''); setNewBrand(''); setNewPrice(''); setNewCategoryId('')
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Assignment failed')
    }
  }

  async function handleDiscard(path: string) {
    try {
      await discardStagedImage(path)
      await refresh()
    } catch (e: any) {
      setError(e.message ?? 'Failed to discard image')
    }
  }

  return (
    <div className="section">
      <h1>Admin Dashboard</h1>
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {/* === Upload === */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>1. Upload product photos</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Photos upload with no product attached. Filenames are not treated as product names or SKUs -
          you'll name and assign products below.
        </p>
        <input
          type="file"
          multiple
          accept="image/*"
          disabled={uploading}
          onChange={(e) => handleFileUpload(e.target.files)}
        />
        {uploading && <p className="text-muted">Uploading...</p>}
      </div>

      {/* === Unassigned staging grid === */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>
          2. Unassigned photos ({staged.length}){selectedImages.size > 0 && ` — ${selectedImages.size} selected`}
        </h2>

        {loading ? (
          <p className="text-muted">Loading...</p>
        ) : staged.length === 0 ? (
          <p className="text-muted">No unassigned photos. Upload some above.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
            {staged.map((img) => {
              const isSelected = selectedImages.has(img.storagePath)
              return (
                <div
                  key={img.storagePath}
                  onClick={() => toggleSelect(img.storagePath)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    border: isSelected ? '3px solid var(--color-primary)' : '1px solid var(--color-border)',
                  }}
                >
                  <img src={img.url} alt={img.originalFilename} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDiscard(img.storagePath) }}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '0.75rem' }}
                    title="Discard this photo"
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* === Assign selected to a product === */}
      {selectedImages.size > 0 && (
        <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginTop: 0 }}>3. Assign {selectedImages.size} selected photo(s) to a product</h2>

          <select value={assignTarget} onChange={(e) => setAssignTarget(e.target.value)} style={{ width: '100%', padding: '0.6rem', marginBottom: '0.75rem' }}>
            <option value="">Choose a product...</option>
            <option value="new">+ Create a new product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} {p.is_active ? '' : '(draft)'}</option>
            ))}
          </select>

          {assignTarget === 'new' && (
            <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <input placeholder="Product name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ padding: '0.6rem' }} />
              <input placeholder="Brand (optional)" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} style={{ padding: '0.6rem' }} />
              <input placeholder="Base price (ZMW)" type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} style={{ padding: '0.6rem' }} />
              <select value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value)} style={{ padding: '0.6rem' }}>
                <option value="">Choose category...</option>
                {categories.map((parent) => (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name} (general)</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>{'\u00A0\u00A0'}{child.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select value={newType} onChange={(e) => setNewType(e.target.value as ProductType)} style={{ padding: '0.6rem' }}>
                <option value="apparel_footwear">Apparel / Footwear (has size/color)</option>
                <option value="simple">Simple / PPE accessory (no variants)</option>
              </select>
            </div>
          )}

          <button className="btn btn-primary" onClick={handleAssign}>Assign photos</button>
        </div>
      )}

      {/* === Products list (quick activate/deactivate) === */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <h2 style={{ fontSize: '1rem', marginTop: 0 }}>Recent products</h2>
        {products.length === 0 ? (
          <p className="text-muted">No products yet. Assign photos above to create your first one.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {products.map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <span>{p.name} <span className="text-muted">({p.product_type})</span></span>
                <button
                  className="btn btn-outline"
                  onClick={async () => { await setProductActive(p.id, !p.is_active); refresh() }}
                >
                  {p.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
