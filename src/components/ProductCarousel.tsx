import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import type { ProductWithDetails } from '../types/database'

const AUTO_ADVANCE_MS = 5000

/** Horizontal, snap-scrolling product rail. Slides one card at a time
 *  on arrow click or automatically every few seconds, and stops
 *  auto-advancing the moment someone touches it - manual control always
 *  wins over the timer, it never fights the person scrolling. Respects
 *  prefers-reduced-motion by skipping the automatic slide entirely. */
export default function ProductCarousel({ products }: { products: ProductWithDetails[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const scrollTimeout = useRef<ReturnType<typeof setTimeout>>()

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const card = track.children[index] as HTMLElement | undefined
    if (!card) return
    track.scrollTo({ left: card.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }, [])

  const step = useCallback(
    (dir: 1 | -1) => {
      const next = Math.max(0, Math.min(products.length - 1, activeIndex + dir))
      setActiveIndex(next)
      scrollToIndex(next)
      setAutoplay(false)
    },
    [activeIndex, products.length, scrollToIndex]
  )

  // Auto-advance, paused permanently once the person interacts.
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!autoplay || prefersReduced || products.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % products.length
        scrollToIndex(next)
        return next
      })
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(id)
  }, [autoplay, products.length, scrollToIndex])

  // Keep the dots in sync when someone scrolls/swipes by hand.
  function handleScroll() {
    setAutoplay(false)
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
    scrollTimeout.current = setTimeout(() => {
      const track = trackRef.current
      if (!track) return
      let closest = 0
      let closestDist = Infinity
      Array.from(track.children).forEach((child, i) => {
        const dist = Math.abs((child as HTMLElement).offsetLeft - track.offsetLeft - track.scrollLeft)
        if (dist < closestDist) {
          closestDist = dist
          closest = i
        }
      })
      setActiveIndex(closest)
    }, 100)
  }

  if (products.length === 0) return null

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        style={{
          display: 'flex',
          gap: '1.25rem',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          paddingBottom: '0.5rem',
        }}
        className="carousel-track"
      >
        {products.map((p) => (
          <div key={p.id} style={{ flex: '0 0 240px', scrollSnapAlign: 'start' }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {products.length > 1 && (
        <>
          <button
            aria-label="Previous product"
            onClick={() => step(-1)}
            disabled={activeIndex === 0}
            className="carousel-arrow"
            style={{ left: -18 }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            aria-label="Next product"
            onClick={() => step(1)}
            disabled={activeIndex === products.length - 1}
            className="carousel-arrow"
            style={{ right: -18 }}
          >
            <ChevronRight size={20} />
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
            {products.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to product ${i + 1}`}
                onClick={() => {
                  setActiveIndex(i)
                  scrollToIndex(i)
                  setAutoplay(false)
                }}
                style={{
                  width: i === activeIndex ? 18 : 7,
                  height: 7,
                  borderRadius: 999,
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  background: i === activeIndex ? 'var(--color-primary)' : 'var(--color-border)',
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
