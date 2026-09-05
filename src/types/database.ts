// Hand-authored types mirroring the live AfroQuest Supabase schema
// (project qrlgnhtxspkmkwdjsqnh). Regenerate later with:
//   supabase gen types typescript --project-id qrlgnhtxspkmkwdjsqnh

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type UserRole = 'customer' | 'admin'
export type ProductType = 'apparel_footwear' | 'simple'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

/** Self-referencing: parent_id null = top-level (e.g. "Boots & Safety Boots"),
 *  non-null = nested (e.g. "Steel toe boots" under that parent). */
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  brand: string | null
  description: string | null
  category_id: string | null
  base_price: number
  product_type: ProductType
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  display_order: number
  created_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  size: string | null
  color: string | null
  sku: string | null
  price_override: number | null
  created_at: string
}

export interface Inventory {
  variant_id: string
  quantity: number
  low_stock_threshold: number
  updated_at: string
}

/** Stock for a `simple` product (PPE/accessories - no size/color variants). */
export interface SimpleInventory {
  product_id: string
  quantity: number
  low_stock_threshold: number
  updated_at: string
}

/** Exactly one of variant_id / product_id is set (DB check constraint):
 *  variant_id for apparel_footwear, product_id for simple products. */
export interface CartItem {
  id: string
  user_id: string
  variant_id: string | null
  product_id: string | null
  quantity: number
  created_at: string
  updated_at: string
}

export interface WishlistItem {
  id: string
  user_id: string
  product_id: string
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total: number
  delivery_name: string
  delivery_phone: string
  delivery_address: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  variant_id: string | null
  product_id: string | null
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
  created_at: string
}

// Composite/joined shapes used across the app
export interface ProductWithDetails extends Product {
  category: Category | null
  images: ProductImage[]
  variants: (ProductVariant & { inventory: Inventory | null })[]
}

// TEMPORARY: loosened to unblock today's build. The Insert/Update shapes
// Insert types: what's required to create a row (id/timestamps are
// server-generated so they're optional/omitted here).
type ProfileInsert = Partial<Profile> & { id: string }
type CategoryInsert = Partial<Category> & { name: string; slug: string }
type ProductInsert = Partial<Product> & { name: string; slug: string; category_id: string; base_price: number }
type ProductImageInsert = Partial<ProductImage> & { product_id: string; storage_path: string; display_order: number }
type ProductVariantInsert = Partial<ProductVariant> & { product_id: string }
type InventoryInsert = Partial<Inventory> & { variant_id: string }
type SimpleInventoryInsert = Partial<SimpleInventory> & { product_id: string }
type CartItemInsert = Partial<CartItem> & { user_id: string }
type WishlistItemInsert = Partial<WishlistItem> & { user_id: string; product_id: string }
type OrderInsert = Partial<Order> & { user_id: string; delivery_name: string; delivery_phone: string; delivery_address: string }
type OrderItemInsert = Partial<OrderItem> & { order_id: string; product_name: string; unit_price: number; quantity: number }

// Matches postgrest-js's real GenericSchema/GenericTable contract (verified
// against node_modules/@supabase/postgrest-js/src/types/common/common.ts):
// every table needs Row/Insert/Update/Relationships, and the schema needs
// Views/Functions siblings to Tables even when empty.
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: ProfileInsert; Update: Partial<Profile>; Relationships: [] }
      categories: { Row: Category; Insert: CategoryInsert; Update: Partial<Category>; Relationships: [] }
      products: { Row: Product; Insert: ProductInsert; Update: Partial<Product>; Relationships: [] }
      product_images: { Row: ProductImage; Insert: ProductImageInsert; Update: Partial<ProductImage>; Relationships: [] }
      product_variants: { Row: ProductVariant; Insert: ProductVariantInsert; Update: Partial<ProductVariant>; Relationships: [] }
      inventory: { Row: Inventory; Insert: InventoryInsert; Update: Partial<Inventory>; Relationships: [] }
      simple_inventory: { Row: SimpleInventory; Insert: SimpleInventoryInsert; Update: Partial<SimpleInventory>; Relationships: [] }
      cart_items: { Row: CartItem; Insert: CartItemInsert; Update: Partial<CartItem>; Relationships: [] }
      wishlist_items: { Row: WishlistItem; Insert: WishlistItemInsert; Update: Partial<WishlistItem>; Relationships: [] }
      orders: { Row: Order; Insert: OrderInsert; Update: Partial<Order>; Relationships: [] }
      order_items: { Row: OrderItem; Insert: OrderItemInsert; Update: Partial<OrderItem>; Relationships: [] }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
