import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './AuthContext'
import type { CartItem, ProductVariant, Inventory, Product, SimpleInventory, ProductImage } from '../types/database'

/** A cart line joined with enough product/stock info to render the Cart
 *  page and validate quantities against real stock before checkout. */
export interface CartLine extends CartItem {
  variant: (ProductVariant & { inventory: Inventory | null; product: Product & { images: ProductImage[] } }) | null
  simpleProduct: (Product & { simple_inventory: SimpleInventory | null; images: ProductImage[] }) | null
}

interface CartContextValue {
  items: CartLine[]
  loading: boolean
  itemCount: number
  addVariantToCart: (variantId: string, quantity?: number) => Promise<void>
  addSimpleToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select(
        `*,
        variant:product_variants(*, inventory(*), product:products(*, images:product_images(*))),
        simpleProduct:products!cart_items_product_id_fkey(*, simple_inventory(*), images:product_images(*))`
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to load cart:', error.message)
      setItems([])
    } else {
      setItems((data ?? []) as unknown as CartLine[])
    }
    setLoading(false)
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  async function addVariantToCart(variantId: string, quantity = 1) {
    if (!user) throw new Error('Must be logged in to add to cart.')

    // Same unresolved tsc -b type collapse documented in adminProducts.ts
    // (KNOWN ISSUE note there has the full investigation trail). Affects
    // .select()/.insert()/.update() chains in this project specifically;
    // runtime behavior is correct, RLS still enforces real safety.
    const { data: existing } = await (supabase as any)
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('variant_id', variantId)
      .maybeSingle()

    if (existing) {
      const { error } = await (supabase as any).from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await (supabase as any).from('cart_items').insert({ user_id: user.id, variant_id: variantId, quantity })
      if (error) throw error
    }
    await refresh()
  }

  async function addSimpleToCart(productId: string, quantity = 1) {
    if (!user) throw new Error('Must be logged in to add to cart.')

    const { data: existing } = await (supabase as any)
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .maybeSingle()

    if (existing) {
      const { error } = await (supabase as any).from('cart_items').update({ quantity: existing.quantity + quantity }).eq('id', existing.id)
      if (error) throw error
    } else {
      const { error } = await (supabase as any).from('cart_items').insert({ user_id: user.id, product_id: productId, quantity })
      if (error) throw error
    }
    await refresh()
  }

  async function updateQuantity(cartItemId: string, quantity: number) {
    if (quantity <= 0) return removeItem(cartItemId)
    const { error } = await (supabase as any).from('cart_items').update({ quantity }).eq('id', cartItemId)
    if (error) throw error
    await refresh()
  }

  async function removeItem(cartItemId: string) {
    const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId)
    if (error) throw error
    await refresh()
  }

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, loading, itemCount, addVariantToCart, addSimpleToCart, updateQuantity, removeItem, refresh }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
