import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface FlyingItem {
  id: number
  imageUrl: string
  startX: number
  startY: number
  endX: number
  endY: number
}

interface FlyToCartContextValue {
  /** Header calls this once, on the actual cart icon element, so the
   *  animation has a real landing target instead of a guessed screen
   *  position. */
  registerCartIcon: (el: HTMLElement | null) => void
  /** Any Add-to-Cart button calls this with the real product image and
   *  the click event, to launch a thumbnail flying from that exact
   *  click point to wherever the cart icon actually is right now. */
  triggerFlyToCart: (imageUrl: string, sourceEl: HTMLElement) => void
  /** Header/cart icon reads this to know when to play its own pulse,
   *  timed to the moment the flying thumbnail actually lands. */
  onCartPulse: (cb: () => void) => () => void
}

const FlyToCartContext = createContext<FlyToCartContextValue | undefined>(undefined)

let nextId = 0

export function FlyToCartProvider({ children }: { children: ReactNode }) {
  const cartIconRef = useRef<HTMLElement | null>(null)
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([])
  const pulseListeners = useRef<Set<() => void>>(new Set())

  function registerCartIcon(el: HTMLElement | null) {
    cartIconRef.current = el
  }

  function onCartPulse(cb: () => void) {
    pulseListeners.current.add(cb)
    return () => { pulseListeners.current.delete(cb) }
  }

  function triggerFlyToCart(imageUrl: string, sourceEl: HTMLElement) {
    const cartEl = cartIconRef.current
    if (!cartEl) return // cart icon not mounted/registered yet - skip the animation rather than throw

    const start = sourceEl.getBoundingClientRect()
    const end = cartEl.getBoundingClientRect()

    const id = nextId++
    setFlyingItems((prev) => [
      ...prev,
      {
        id,
        imageUrl,
        startX: start.left + start.width / 2,
        startY: start.top + start.height / 2,
        endX: end.left + end.width / 2,
        endY: end.top + end.height / 2,
      },
    ])
  }

  function handleAnimationComplete(id: number) {
    setFlyingItems((prev) => prev.filter((f) => f.id !== id))
    pulseListeners.current.forEach((cb) => cb())
  }

  return (
    <FlyToCartContext.Provider value={{ registerCartIcon, triggerFlyToCart, onCartPulse }}>
      {children}
      {/* Rendered at the root so the flying thumbnail is never clipped by
          any parent's overflow:hidden - a real risk given several cards
          and carousels already use it. */}
      <AnimatePresence>
        {flyingItems.map((item) => (
          <FlyingThumbnail key={item.id} item={item} onDone={() => handleAnimationComplete(item.id)} />
        ))}
      </AnimatePresence>
    </FlyToCartContext.Provider>
  )
}

function FlyingThumbnail({ item, onDone }: { item: FlyingItem; onDone: () => void }) {
  // A real curved/parabolic path per the animation doc's spec, not a
  // straight line: the midpoint's y is pulled upward relative to a
  // straight interpolation, giving a genuine arc. Framer Motion doesn't
  // animate along an SVG path directly for a plain div, so the arc is
  // approximated with a 3-keyframe x/y animation (start -> arc apex ->
  // end), which reads as a real curve at this distance/duration.
  const midX = (item.startX + item.endX) / 2
  const straightMidY = (item.startY + item.endY) / 2
  const arcApexY = straightMidY - Math.abs(item.endX - item.startX) * 0.25 - 40

  return (
    <motion.div
      initial={{ x: item.startX, y: item.startY, opacity: 1, scale: 1 }}
      animate={{
        x: [item.startX, midX, item.endX],
        y: [item.startY, arcApexY, item.endY],
        scale: [1, 0.85, 0.2],
        opacity: [1, 1, 0.4],
      }}
      transition={{ duration: 0.65, ease: [0.34, 1.2, 0.64, 1], times: [0, 0.55, 1] }}
      onAnimationComplete={onDone}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 44,
        height: 44,
        marginLeft: -22,
        marginTop: -22,
        borderRadius: 'var(--radius-card)',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 9999,
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </motion.div>
  )
}

export function useFlyToCart() {
  const ctx = useContext(FlyToCartContext)
  if (!ctx) throw new Error('useFlyToCart must be used within FlyToCartProvider')
  return ctx
}
