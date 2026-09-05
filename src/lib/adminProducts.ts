import { supabase } from './supabase'
import type { Category, Product, ProductType } from '../types/database'

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data
}

/** Categories nested for a picker: top-level with their children attached. */
export async function fetchCategoryTree(): Promise<(Category & { children: Category[] })[]> {
  const all = await fetchAllCategories()
  const topLevel = all.filter((c) => !c.parent_id)
  return topLevel.map((parent) => ({ ...parent, children: all.filter((c) => c.parent_id === parent.id) }))
}

export interface NewProductInput {
  name: string
  brand?: string
  description?: string
  categoryId: string
  basePrice: number
  productType: ProductType
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/** Admin creates a new product shell (no images yet - those get attached
 *  separately via imageStaging.assignImageToProduct once the admin has
 *  visually picked which staged photos belong to it). */
export async function createProduct(input: NewProductInput): Promise<Product> {
  const slug = `${slugify(input.name)}-${Date.now().toString(36)}`

  // KNOWN ISSUE (investigated at length, unresolved): this insert's payload
  // type collapses to `never` under tsc -b project-reference build mode in
  // THIS file specifically. Ruled out with real tests: schema/GenericSchema
  // shape (verified against postgrest-js source - correct), client wiring
  // (isolated createClient<Database>() calls work), duplicate package installs
  // (only one @supabase/supabase-js present), missing .select() (present here),
  // cross-file pollution (fails even with imageStaging.ts removed from the
  // build), stale incremental cache (fails on --force clean rebuild), and
  // TypeScript version (fails identically on pinned stable 5.7.3, not just
  // the project's 7.0.2). An exact byte-for-byte copy of this file's content
  // in a new file in the same directory reproduces the failure; the same
  // code as a standalone plain `tsc --noEmit` single-file check does not.
  // The real variable is something about full project-reference build mode
  // (tsc -b) specifically, not yet pinned down. Runtime behavior is correct
  // and RLS still enforces real safety - this is a lost compile-time check,
  // not a security gap. Revisit before Block 5 (security hardening).
  const { data, error } = await (supabase as any)
    .from('products')
    .insert({
      name: input.name,
      slug,
      brand: input.brand || null,
      description: input.description || null,
      category_id: input.categoryId,
      base_price: input.basePrice,
      product_type: input.productType,
      is_active: false, // admin activates once images + stock are set
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/** Fetches recently-created products (including inactive ones) for the
 *  admin dashboard's "assign photos to this product" picker. */
export async function fetchRecentProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function setProductActive(productId: string, isActive: boolean): Promise<void> {
  // Same unresolved tsc -b type collapse documented in createProduct above.
  const { error } = await (supabase as any).from('products').update({ is_active: isActive }).eq('id', productId).select()
  if (error) throw error
}
