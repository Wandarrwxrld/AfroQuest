import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { fetchWishlistProductIds, addToWishlist, removeFromWishlist } from './wishlist'

interface WishlistContextValue {
  /** Product IDs currently on the signed-in user's wishlist. Empty for
   *  signed-out visitors - the heart toggle still renders but prompts
   *  sign-in on click rather than silently failing. */
  productIds: Set<string>
  loading: boolean
  isWishlisted: (productId: string) => boolean
  toggle: (productId: string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [productIds, setProductIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setProductIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setProductIds(await fetchWishlistProductIds(user.id))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function toggle(productId: string) {
    if (!user) return
    const wasWishlisted = productIds.has(productId)
    // Optimistic update - the wishlist heart should feel instant, not
    // wait on a round trip before flipping.
    setProductIds((prev) => {
      const next = new Set(prev)
      wasWishlisted ? next.delete(productId) : next.add(productId)
      return next
    })
    try {
      if (wasWishlisted) await removeFromWishlist(user.id, productId)
      else await addToWishlist(user.id, productId)
    } catch {
      // Roll back on failure rather than leaving the UI lying about
      // what's actually saved.
      setProductIds((prev) => {
        const next = new Set(prev)
        wasWishlisted ? next.add(productId) : next.delete(productId)
        return next
      })
    }
  }

  return (
    <WishlistContext.Provider
      value={{ productIds, loading, isWishlisted: (id) => productIds.has(id), toggle }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
