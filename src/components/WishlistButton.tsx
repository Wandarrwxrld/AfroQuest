import { Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useWishlist } from '../lib/WishlistContext'

/** A heart toggle for a single product. Signed-out visitors are sent to
 *  login rather than the click silently doing nothing - wishlisting
 *  requires an account since it's tied to user_id. */
export default function WishlistButton({ productId, size = 18 }: { productId: string; size?: number }) {
  const { user } = useAuth()
  const { isWishlisted, toggle } = useWishlist()
  const navigate = useNavigate()
  const active = isWishlisted(productId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!user) {
          navigate('/login')
          return
        }
        toggle(productId)
      }}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,0.9)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
        cursor: 'pointer',
      }}
    >
      <Heart
        size={size}
        strokeWidth={1.75}
        color={active ? 'var(--color-primary)' : 'var(--color-text-muted)'}
        fill={active ? 'var(--color-primary)' : 'none'}
      />
    </button>
  )
}
