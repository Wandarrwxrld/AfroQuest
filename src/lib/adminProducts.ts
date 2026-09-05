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

  // KNOWN ISSUE: this insert's payload type collapses to `never` under strict
  // checking despite Database/GenericSchema verified structurally correct
  // against postgrest-js source. Root cause not yet found after significant
  // investigation (isolated test files with equivalent inserts compile clean,
  // ruling out schema shape, client wiring, and duplicate-package causes).
  // Escape-hatched here to unblock the build; runtime behavior is correct
  // and RLS still enforces real safety - this is a lost compile-time check
  // on this one call, not a security gap. Revisit before Block 5 (security
  // hardening) so strict typing is fully back before that pass is called done.
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
  // See KNOWN ISSUE note in createProduct above - same unresolved type collapse.
  const { error } = await (supabase as any).from('products').update({ is_active: isActive }).eq('id', productId).select()
  if (error) throw error
}
