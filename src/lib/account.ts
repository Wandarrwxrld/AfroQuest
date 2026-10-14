import { supabase } from './supabase'
import type { Order, Profile } from '../types/database'

export async function updateProfile(userId: string, updates: { full_name?: string; phone?: string }): Promise<Profile> {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data as Profile
}

/** A customer's own order history, newest first. RLS should already
 *  restrict this to the caller's own rows regardless of the .eq() below -
 *  the explicit filter is just for correctness/clarity, not the actual
 *  security boundary. */
export async function fetchMyOrders(userId: string): Promise<Order[]> {
  const { data, error } = await (supabase as any)
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Order[]
}

/** Permanently deletes the signed-in user's own account (auth user +
 *  profile, via cascade). This has to go through an edge function since
 *  deleting an auth.users row requires the service-role key, which must
 *  never be exposed to the browser - the anon client can't do this
 *  directly. See supabase/functions/delete-account. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
  if (error) throw error
}
