import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Package, AlertTriangle, XCircle, CheckCircle2, X } from 'lucide-react'
import { fetchInventoryOverview, updateVariantStock, updateSimpleProductStock, type InventoryRow, type InventoryVariantRow } from '../lib/adminInventory'
import { logAdminAction } from '../lib/adminInventory'

type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

function getStatus(row: InventoryRow): StockStatus {
  const qty = row.currentStock ?? 0
  if (qty <= 0) return 'out_of_stock'
  if (qty <= row.lowStockThreshold) return 'low_stock'
  return 'in_stock'
}

const STATUS_META: Record<StockStatus, { label: string; bg: string; color: string }> = {
  in_stock: { label: 'In Stock', bg: '#E1F5EE', color: '#15734F' },
  low_stock: { label: 'Low Stock', bg: '#FAEEDA', color: '#854F0B' },
  out_of_stock: { label: 'Out of Stock', bg: '#FCEBEB', color: '#A32D2D' },
}

export default function AdminInventory() {
  const [rows, setRows] = useState<InventoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')
  const [selected, setSelected] = useState<InventoryRow | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      setRows(await fetchInventoryOverview())
    } catch (e: any) {
      setError(e.message ?? 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [])

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))) as string[], [rows])

  const filtered = rows.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !(r.sku ?? '').toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
    if (statusFilter !== 'all' && getStatus(r) !== statusFilter) return false
    return true
  })

  const totalProducts = rows.length
  const inStockCount = rows.filter((r) => getStatus(r) === 'in_stock').length
  const lowStockCount = rows.filter((r) => getStatus(r) === 'low_stock').length
  const outOfStockCount = rows.filter((r) => getStatus(r) === 'out_of_stock').length

  return (
    <div className="section">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/admin" className="text-muted">← Back to dashboard</Link>
      </div>
      <h1>Inventory Management</h1>
      <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Manage your product stock, variants and availability</p>
      {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <StatCard icon={<Package size={20} />} iconBg="#EAF1FD" iconColor="#3B7DD8" label="Total Products" value={totalProducts} />
        <StatCard icon={<CheckCircle2 size={20} />} iconBg="#E1F5EE" iconColor="#15734F" label="In Stock" value={inStockCount} sub={totalProducts ? `${Math.round((inStockCount / totalProducts) * 100)}% of total` : undefined} />
        <StatCard icon={<AlertTriangle size={20} />} iconBg="#FAEEDA" iconColor="#854F0B" label="Low Stock" value={lowStockCount} sub={totalProducts ? `${Math.round((lowStockCount / totalProducts) * 100)}% of total` : undefined} />
        <StatCard icon={<XCircle size={20} />} iconBg="#FCEBEB" iconColor="#A32D2D" label="Out of Stock" value={outOfStockCount} sub={totalProducts ? `${Math.round((outOfStockCount / totalProducts) * 100)}% of total` : undefined} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '0.6rem', flex: 1, minWidth: 220 }}
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '0.6rem' }}>
          <option value="all">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} style={{ padding: '0.6rem' }}>
          <option value="all">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
        {(search || categoryFilter !== 'all' || statusFilter !== 'all') && (
          <button className="btn btn-outline" onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}>
            Reset Filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted">Loading inventory...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted">No products match these filters.</p>
      ) : (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem' }}>Product / SKU</th>
                <th style={{ padding: '0.75rem' }}>Category</th>
                <th style={{ padding: '0.75rem' }}>Price</th>
                <th style={{ padding: '0.75rem' }}>Available</th>
                <th style={{ padding: '0.75rem' }}>Reserved</th>
                <th style={{ padding: '0.75rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const status = getStatus(row)
                const meta = STATUS_META[status]
                return (
                  <tr
                    key={row.productId}
                    onClick={() => setSelected(row)}
                    style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ fontWeight: 600 }}>{row.name}</div>
                      {row.sku && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{row.sku}</div>}
                    </td>
                    <td style={{ padding: '0.75rem' }} className="text-muted">{row.category ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>K{row.priceBase.toFixed(2)}</td>
                    <td style={{ padding: '0.75rem' }}>{row.currentStock ?? '—'}</td>
                    <td style={{ padding: '0.75rem' }}>{row.reservedStock}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <ProductDetailPanel
          row={selected}
          onClose={() => setSelected(null)}
          onStockUpdated={async () => { await refresh(); setSelected((prev) => (prev ? rows.find((r) => r.productId === prev.productId) ?? null : null)) }}
        />
      )}
    </div>
  )
}

function StatCard({ icon, iconBg, iconColor, label, value, sub }: { icon: React.ReactNode; iconBg: string; iconColor: string; label: string; value: number; sub?: string }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.8rem' }}>{label}</div>
        <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{value}</div>
        {sub && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
      </div>
    </div>
  )
}

function ProductDetailPanel({ row, onClose, onStockUpdated }: { row: InventoryRow; onClose: () => void; onStockUpdated: () => void }) {
  const [tab, setTab] = useState<'overview' | 'history'>('overview')
  const [editingVariant, setEditingVariant] = useState<InventoryVariantRow | null>(null)
  const [newQty, setNewQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSaveStock() {
    const qty = parseInt(newQty, 10)
    if (isNaN(qty) || qty < 0) {
      setSaveError('Enter a valid quantity (0 or more).')
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      if (row.productType === 'apparel_footwear' && editingVariant) {
        await updateVariantStock(editingVariant.variantId, qty)
        await logAdminAction('stock_adjustment', 'inventory', editingVariant.variantId, { product: row.name, variant: editingVariant.label, newQuantity: qty })
      } else {
        await updateSimpleProductStock(row.productId, qty)
        await logAdminAction('stock_adjustment', 'simple_inventory', row.productId, { product: row.name, newQuantity: qty })
      }
      setEditingVariant(null)
      setNewQty('')
      onStockUpdated()
    } catch (e: any) {
      setSaveError(e.message ?? 'Failed to update stock')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 420, background: 'white', boxShadow: '-8px 0 24px rgba(0,0,0,0.12)', zIndex: 41, overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Product Details</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{row.name}</div>
        {row.sku && <div className="text-muted" style={{ fontSize: '0.85rem' }}>{row.sku}</div>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
          {row.brand && <span className="text-muted">{row.brand}</span>}
          {row.category && <span className="text-muted">· {row.category}</span>}
        </div>
        <div className="price" style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>K{row.priceBase.toFixed(2)}</div>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', borderBottom: '1px solid var(--color-border)' }}>
          {(['overview', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ background: 'none', border: 'none', padding: '0.5rem 0', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)', borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent' }}
            >
              {t === 'overview' ? 'Overview' : 'History'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ marginTop: '1rem' }}>
            {row.productType === 'apparel_footwear' && row.variantBreakdown ? (
              <>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Stock by variant</div>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.4rem 0' }}>Variant</th>
                      <th style={{ padding: '0.4rem 0' }}>Available</th>
                      <th style={{ padding: '0.4rem 0' }}>Reserved</th>
                      <th style={{ padding: '0.4rem 0' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.variantBreakdown.map((v) => (
                      <tr key={v.variantId} style={{ borderTop: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '0.4rem 0' }}>{v.label}</td>
                        <td style={{ padding: '0.4rem 0' }}>{v.available}</td>
                        <td style={{ padding: '0.4rem 0' }}>{v.reserved}</td>
                        <td style={{ padding: '0.4rem 0' }}>
                          <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => { setEditingVariant(v); setNewQty(String(v.available)) }}>
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Stock</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Available: {row.currentStock ?? 0} · Reserved: {row.reservedStock}</span>
                  <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => { setEditingVariant(null); setNewQty(String(row.currentStock ?? 0)) }}>
                    Adjust
                  </button>
                </div>
              </div>
            )}

            {(editingVariant !== null || newQty !== '') && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Set new stock quantity{editingVariant ? ` — ${editingVariant.label}` : ''}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="number" min={0} value={newQty} onChange={(e) => setNewQty(e.target.value)} style={{ padding: '0.5rem', flex: 1 }} />
                  <button className="btn btn-primary" disabled={saving} onClick={handleSaveStock}>{saving ? 'Saving...' : 'Update'}</button>
                </div>
                {saveError && <p style={{ color: 'var(--color-danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{saveError}</p>}
              </div>
            )}

            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Low stock threshold: {row.lowStockThreshold} · Units sold (all time): {row.unitsSold}
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div style={{ marginTop: '1rem' }}>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Recent stock movements. For full audit trail across all products, see the general admin action log.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
