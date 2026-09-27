import { supabase } from './supabase'
import type { ProductWithDetails } from '../types/database'

/** A wishlist row joined with the full product record, so the wishlist
 *  page can render real ProductCards instead of a bare list of names. */
export async function fetchWishlist(userId: string): Promise<ProductWithDetails[]> {
  const { data, error } = await (supabase as any)
    .from('wishlist_items')
    .select(
      `product:products(*,
        category:categories(*),
        images:product_images(*),
        variants:product_variants(*, inventory(*))
      )`
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  // A product could have been deleted after being wishlisted - filter
  // those out rather than rendering a broken card.
  return ((data ?? []) as any[]).map((row) => row.product).filter(Boolean) as ProductWithDetails[]
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('wishlist_items')
    .insert({ user_id: userId, product_id: productId })
  // Adding something already on the wishlist isn't a real error - most
  // likely a duplicate-key conflict from a double click.
  if (error && error.code !== '23505') throw error
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const { error } = await (supabase as any)
    .from('wishlist_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)
  if (error) throw error
}

export async function fetchWishlistProductIds(userId: string): Promise<Set<string>> {
  const { data, error } = await (supabase as any)
    .from('wishlist_items')
    .select('product_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((r: any) => r.product_id))
}
