import { supabase } from './supabase'

export interface InventoryVariantRow {
  variantId: string
  label: string
  available: number
  reserved: number
  total: number
  lowStockThreshold: number
}

export interface InventoryRow {
  productId: string
  name: string
  sku: string | null
  category: string | null
  brand: string | null
  productType: 'apparel_footwear' | 'simple'
  isActive: boolean
  priceBase: number
  currentStock: number | null
  reservedStock: number
  lowStockThreshold: number
  unitsSold: number
  updatedAt: string | null
  variantBreakdown: InventoryVariantRow[] | null
}

/** "Reserved" means units already subtracted from real stock (quantity)
 *  by place_order(), but for an order that hasn't shipped yet -
 *  confirmed/processing/packed. Not a stored column: quantity already
 *  reflects post-checkout stock, so this is a genuine separate
 *  calculation over live order data, not a duplicate of the same number. */
const COMMITTED_UNSHIPPED_STATUSES = ['confirmed', 'processing', 'packed']

export async function fetchInventoryOverview(): Promise<InventoryRow[]> {
  const { data: products, error } = await (supabase as any)
    .from('products')
    .select(
      `id, name, brand, base_price, product_type, is_active, updated_at,
      category:categories(name),
      variants:product_variants(id, size, color, sku, inventory(quantity, low_stock_threshold)),
      simple_inventory(quantity, low_stock_threshold)`
    )
    .order('name')

  if (error) throw error

  const { data: reservedRows } = await (supabase as any)
    .from('order_items')
    .select('product_id, variant_id, quantity, orders!inner(status)')
    .in('orders.status', COMMITTED_UNSHIPPED_STATUSES)

  const reservedByVariant = new Map<string, number>()
  const reservedByProduct = new Map<string, number>()
  for (const r of reservedRows ?? []) {
    if (r.variant_id) reservedByVariant.set(r.variant_id, (reservedByVariant.get(r.variant_id) ?? 0) + r.quantity)
    if (r.product_id) reservedByProduct.set(r.product_id, (reservedByProduct.get(r.product_id) ?? 0) + r.quantity)
  }

  const rows: InventoryRow[] = []

  for (const p of (products ?? []) as any[]) {
    let currentStock: number | null = null
    let reservedStock = 0
    let lowStockThreshold = 5
    let variantBreakdown: InventoryVariantRow[] | null = null
    let sku: string | null = null

    if (p.product_type === 'apparel_footwear') {
      const variants = p.variants ?? []
      if (variants.length > 0) {
        currentStock = variants.reduce((sum: number, v: any) => sum + (v.inventory?.quantity ?? 0), 0)
        reservedStock = variants.reduce((sum: number, v: any) => sum + (reservedByVariant.get(v.id) ?? 0), 0)
        lowStockThreshold = Math.max(...variants.map((v: any) => v.inventory?.low_stock_threshold ?? 5))
        sku = variants[0]?.sku ?? null
        variantBreakdown = variants.map((v: any) => ({
          variantId: v.id,
          label: [v.size, v.color].filter(Boolean).join(' / ') || 'Default',
          available: v.inventory?.quantity ?? 0,
          reserved: reservedByVariant.get(v.id) ?? 0,
          total: (v.inventory?.quantity ?? 0) + (reservedByVariant.get(v.id) ?? 0),
          lowStockThreshold: v.inventory?.low_stock_threshold ?? 5,
        }))
      }
    } else {
      currentStock = p.simple_inventory?.quantity ?? null
      reservedStock = reservedByProduct.get(p.id) ?? 0
      lowStockThreshold = p.simple_inventory?.low_stock_threshold ?? 5
    }

    const variantIds = (p.variants ?? []).map((v: any) => v.id)
    const orFilter =
      p.product_type === 'simple'
        ? `product_id.eq.${p.id}`
        : variantIds.length > 0
          ? `variant_id.in.(${variantIds.join(',')})`
          : null // no variants exist yet for this product - nothing to count, skip the query entirely

    let count = 0
    if (orFilter) {
      const result = await supabase.from('order_items').select('id', { count: 'exact', head: true }).or(orFilter)
      count = result.count ?? 0
    }

    rows.push({
      productId: p.id,
      name: p.name,
      sku,
      category: p.category?.name ?? null,
      brand: p.brand,
      productType: p.product_type,
      isActive: p.is_active,
      priceBase: p.base_price,
      currentStock,
      reservedStock,
      lowStockThreshold,
      unitsSold: count ?? 0,
      updatedAt: p.updated_at,
      variantBreakdown,
    })
  }

  return rows
}

export async function updateVariantStock(variantId: string, newQuantity: number): Promise<void> {
  const { error } = await (supabase as any).from('inventory').update({ quantity: newQuantity }).eq('variant_id', variantId)
  if (error) throw error
}

export async function updateSimpleProductStock(productId: string, newQuantity: number): Promise<void> {
  const { error } = await (supabase as any).from('simple_inventory').update({ quantity: newQuantity }).eq('product_id', productId)
  if (error) throw error
}

export interface AdminLoginEvent {
  id: string
  adminId: string
  eventType: 'login' | 'logout'
  occurredAt: string
}

export async function fetchAdminLoginEvents(limit = 50): Promise<AdminLoginEvent[]> {
  const { data, error } = await supabase
    .from('admin_login_events')
    .select('id, admin_id, event_type, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((r: any) => ({
    id: r.id,
    adminId: r.admin_id,
    eventType: r.event_type,
    occurredAt: r.occurred_at,
  }))
}

export interface AdminActionLogEntry {
  id: string
  adminId: string
  actionType: string
  targetTable: string | null
  targetId: string | null
  details: Record<string, unknown> | null
  occurredAt: string
}

export async function fetchAdminActionLog(limit = 100): Promise<AdminActionLogEntry[]> {
  const { data, error } = await supabase
    .from('admin_action_log')
    .select('id, admin_id, action_type, target_table, target_id, details, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)
  if (error) throw error

  return (data ?? []).map((r: any) => ({
    id: r.id,
    adminId: r.admin_id,
    actionType: r.action_type,
    targetTable: r.target_table,
    targetId: r.target_id,
    details: r.details,
    occurredAt: r.occurred_at,
  }))
}

export async function fetchAdminNames(adminIds: string[]): Promise<Record<string, string>> {
  if (adminIds.length === 0) return {}
  const { data, error } = await (supabase as any).from('profiles').select('id, full_name').in('id', adminIds)
  if (error) throw error
  const map: Record<string, string> = {}
  for (const row of data ?? []) map[row.id] = row.full_name ?? row.id
  return map
}

export async function logAdminAction(
  actionType: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await (supabase as any).rpc('log_admin_action', {
      p_action_type: actionType,
      p_target_table: targetTable ?? null,
      p_target_id: targetId ?? null,
      p_details: details ?? null,
    })
  } catch {
    // Fire-and-forget - logging failure should never block the real mutation.
  }
}
