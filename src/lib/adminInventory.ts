import { supabase } from './supabase'

export interface InventoryRow {
  productId: string
  name: string
  productType: 'apparel_footwear' | 'simple'
  isActive: boolean
  currentStock: number | null
  unitsSold: number
  variantBreakdown: { label: string; quantity: number }[] | null
}

export async function fetchInventoryOverview(): Promise<InventoryRow[]> {
  const { data: products, error } = await supabase
    .from('products')
    .select(
      `id, name, product_type, is_active,
      variants:product_variants(id, size, color, inventory(quantity)),
      simple_inventory(quantity)`
    )
    .order('name')

  if (error) throw error

  const rows: InventoryRow[] = []

  for (const p of (products ?? []) as any[]) {
    let currentStock: number | null = null
    let variantBreakdown: { label: string; quantity: number }[] | null = null

    if (p.product_type === 'apparel_footwear') {
      const variants = p.variants ?? []
      if (variants.length > 0) {
        currentStock = variants.reduce((sum: number, v: any) => sum + (v.inventory?.quantity ?? 0), 0)
        variantBreakdown = variants.map((v: any) => ({
          label: [v.size, v.color].filter(Boolean).join(' / ') || 'Default',
          quantity: v.inventory?.quantity ?? 0,
        }))
      }
    } else {
      currentStock = p.simple_inventory?.quantity ?? null
    }

    const { count } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .or(
        p.product_type === 'simple'
          ? `product_id.eq.${p.id}`
          : `variant_id.in.(${(p.variants ?? []).map((v: any) => v.id).join(',') || 'null'})`
      )

    rows.push({
      productId: p.id,
      name: p.name,
      productType: p.product_type,
      isActive: p.is_active,
      currentStock,
      unitsSold: count ?? 0,
      variantBreakdown,
    })
  }

  return rows
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
