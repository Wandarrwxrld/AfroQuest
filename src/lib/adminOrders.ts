import { supabase } from './supabase'
import type { Order, OrderItem, OrderStatus } from '../types/database'

export interface OrderWithItems extends Order {
  items: OrderItem[]
  customerEmail: string | null
}

/** Legal forward transitions matching the DB's update_order_status()
 *  exactly, so the UI only ever offers buttons that will actually
 *  succeed - kept in sync manually since this is a small, stable set. */
export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

export async function fetchAllOrdersForAdmin(): Promise<OrderWithItems[]> {
  const { data, error } = await (supabase as any)
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((o: any) => ({ ...o, customerEmail: null }))
}

export interface StatusHistoryEntry {
  id: string
  status: OrderStatus
  changedBy: string | null
  notes: string | null
  occurredAt: string
}

export async function fetchOrderStatusHistory(orderId: string): Promise<StatusHistoryEntry[]> {
  const { data, error } = await (supabase as any)
    .from('order_status_history')
    .select('id, status, changed_by, notes, occurred_at')
    .eq('order_id', orderId)
    .order('occurred_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((r: any) => ({
    id: r.id,
    status: r.status,
    changedBy: r.changed_by,
    notes: r.notes,
    occurredAt: r.occurred_at,
  }))
}

/** Real, validated transition - the DB function itself re-checks
 *  authorization and legality server-side (RequireAdmin/can_manage_orders
 *  is not sufficient alone since a stale client could still try an
 *  illegal jump), this is not just a convenience wrapper. */
export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, notes?: string): Promise<void> {
  const { error } = await (supabase as any).rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
    p_notes: notes ?? null,
  })
  if (error) throw error
}
