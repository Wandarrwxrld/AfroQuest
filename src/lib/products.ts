import { supabase } from './supabase'
import type { Category, ProductWithDetails, SimpleInventory } from '../types/database'

const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

export function resolveProductImageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return PLACEHOLDER_IMAGE
  const { data } = supabase.storage.from('product-images').getPublicUrl(storagePath)
  return data.publicUrl
}

/** Active products for the Shop grid, with category, images, and
 *  variants+inventory joined so stock badges compute without a second
 *  round trip. Only surfaces is_active=true rows - draft products created
 *  by admin (pre-photo-assignment) stay hidden from customers. */
export async function fetchActiveProducts(categorySlug?: string): Promise<ProductWithDetails[]> {
  let query = supabase
    .from('products')
    .select(
      `*,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*, inventory(*))`
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (categorySlug) {
    const { data: cat } = await (supabase as any).from('categories').select('id').eq('slug', categorySlug).maybeSingle()
    if (cat) query = query.eq('category_id', cat.id)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as ProductWithDetails[]
}

export interface CategoryTile {
  category: Category
  imageUrl: string
}

/** One representative photo per category for the homepage "Shop by
 *  category" tiles - the photo of whichever active product in that
 *  category was listed most recently, not a placeholder graphic.
 *  Categories with no active products yet are left out rather than
 *  shown with a broken image. Single pass over one products query, so
 *  it costs one extra round trip total, not one per category. */
export async function fetchHomeCategoryTiles(limit = 8): Promise<CategoryTile[]> {
  const [{ data: cats, error: catErr }, { data: prods, error: prodErr }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase
      .from('products')
      .select('category_id, images:product_images(storage_path, display_order)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])
  if (catErr) throw catErr
  if (prodErr) throw prodErr

  const imageByCategory = new Map<string, string>()
  for (const p of (prods ?? []) as any[]) {
    if (!p.category_id || imageByCategory.has(p.category_id)) continue
    const cover = [...(p.images ?? [])].sort((a: any, b: any) => a.display_order - b.display_order)[0]
    imageByCategory.set(p.category_id, resolveProductImageUrl(cover?.storage_path))
  }

  return ((cats ?? []) as Category[])
    .filter((c) => imageByCategory.has(c.id))
    .slice(0, limit)
    .map((c) => ({ category: c, imageUrl: imageByCategory.get(c.id)! }))
}

/** Real text search across name/brand/description for the search bar
 *  and /search page - not a fuzzy or ranked search, just a straightforward
 *  case-insensitive substring match across the fields a customer is
 *  actually likely to type (product name, brand, or a word from the
 *  description), restricted to active products like the rest of the
 *  storefront. */
export async function searchProducts(query: string): Promise<ProductWithDetails[]> {
  const trimmed = query.trim()
  if (!trimmed) return []
  // Strip characters that are structurally meaningful to PostgREST's
  // .or() filter syntax (commas separate conditions, parens group them)
  // so a search term containing them can't accidentally reshape the
  // query instead of just being treated as literal text to match.
  const safe = trimmed.replace(/[,()]/g, ' ').trim()
  if (!safe) return []

  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*, inventory(*))`
    )
    .eq('is_active', true)
    .or(`name.ilike.%${safe}%,brand.ilike.%${safe}%,description.ilike.%${safe}%`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as ProductWithDetails[]
}

export async function fetchProductBySlug(slug: string): Promise<ProductWithDetails> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `*,
      category:categories(*),
      images:product_images(*),
      variants:product_variants(*, inventory(*))`
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data as unknown as ProductWithDetails
}

/** Stock for a `simple` product (gloves, masks, etc.) - lives in
 *  simple_inventory, not the variant/inventory join above. */
export async function fetchSimpleStock(productId: string): Promise<SimpleInventory | null> {
  const { data, error } = await supabase.from('simple_inventory').select('*').eq('product_id', productId).maybeSingle()
  if (error) throw error
  return data
}

export interface StockStatus {
  label: 'In stock' | 'Low stock' | 'Out of stock'
  className: 'badge-instock' | 'badge-lowstock' | 'badge-outofstock'
  totalQty: number
}

/** Total stock across all variants (or simple_inventory for simple
 *  products), used for the in-stock/low-stock/out-of-stock badge and to
 *  gate add-to-cart. */
export function computeStockStatus(product: ProductWithDetails, simpleQty?: number): StockStatus {
  const totalQty =
    product.product_type === 'simple'
      ? simpleQty ?? 0
      : product.variants.reduce((sum, v) => sum + (v.inventory?.quantity ?? 0), 0)

  const threshold =
    product.product_type === 'simple'
      ? 5
      : Math.max(...product.variants.map((v) => v.inventory?.low_stock_threshold ?? 5), 5)

  if (totalQty <= 0) return { label: 'Out of stock', className: 'badge-outofstock', totalQty }
  if (totalQty <= threshold) return { label: 'Low stock', className: 'badge-lowstock', totalQty }
  return { label: 'In stock', className: 'badge-instock', totalQty }
}

export interface PopularProduct {
  name: string
  slug: string
}

/** Ranks products by real completed-order count. On a young store where
 *  few products have sold yet, this genuinely has little to rank -
 *  falls back to filling remaining slots with recently-added active
 *  products rather than showing an artificially padded or empty list. */
export async function fetchPopularProducts(limit = 5): Promise<PopularProduct[]> {
  // Same unresolved tsc -b type collapse documented in adminProducts.ts.
  const { data: active } = await (supabase as any).from('products').select('id, name, slug').eq('is_active', true)
  if (!active || active.length === 0) return []

  const counts = new Map<string, number>()
  for (const p of active as any[]) {
    const variantIds = await getVariantIds(p.id)
    const orFilter = variantIds.length > 0
      ? `product_id.eq.${p.id},variant_id.in.(${variantIds.join(',')})`
      : `product_id.eq.${p.id}`
    const { count } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .or(orFilter)
    counts.set(p.id, count ?? 0)
  }

  const ranked = [...active].sort((a: any, b: any) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0))
  return ranked.slice(0, limit).map((p: any) => ({ name: p.name, slug: p.slug }))
}

async function getVariantIds(productId: string): Promise<string[]> {
  const { data } = await (supabase as any).from('product_variants').select('id').eq('product_id', productId)
  return (data ?? []).map((v: any) => v.id)
}

async function countOrdersFor(productId: string, variantIds: string[]): Promise<number> {
  const orFilter = variantIds.length > 0
    ? `product_id.eq.${productId},variant_id.in.(${variantIds.join(',')})`
    : `product_id.eq.${productId}`
  const { count } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).or(orFilter)
  return count ?? 0
}

/** Real best sellers for the homepage carousel - same order-count
 *  ranking as fetchPopularProducts, but returning full product records
 *  (image, price, stock) instead of just name+slug, since the carousel
 *  needs a real ProductCard. Runs the per-product order counts in
 *  parallel rather than fetchPopularProducts' sequential loop. */
export async function fetchBestSellingProducts(limit = 8): Promise<ProductWithDetails[]> {
  const products = await fetchActiveProducts()
  if (products.length === 0) return []
  const counts = await Promise.all(
    products.map((p) => countOrdersFor(p.id, (p.variants ?? []).map((v) => v.id)))
  )
  return products
    .map((product, i) => ({ product, count: counts[i] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map((x) => x.product)
}
