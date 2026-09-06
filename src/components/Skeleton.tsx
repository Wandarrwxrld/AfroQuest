/** Shared skeleton-loading primitives. A shimmering grey block instead of
 * plain "Loading..." text - the actual shape of what's coming, not a
 * generic spinner, so the layout doesn't jump once real content arrives. */

interface SkeletonBoxProps {
  width?: string | number
  height?: string | number
  radius?: string
  style?: React.CSSProperties
}

export function SkeletonBox({ width = '100%', height = '1rem', radius = 'var(--radius)', style }: SkeletonBoxProps) {
  return <div className="skeleton-shimmer" style={{ width, height, borderRadius: radius, ...style }} />
}

/** Matches ProductCard's exact layout: square image, brand line, title,
 * price/badge row - so the grid doesn't visibly reflow when real cards
 * replace these. */
export function ProductCardSkeleton() {
  return (
    <div className="card">
      <SkeletonBox height={0} style={{ aspectRatio: '1', borderRadius: 0 }} />
      <div style={{ padding: '1rem' }}>
        <SkeletonBox width="40%" height="0.7rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBox width="80%" height="1rem" style={{ marginBottom: '0.75rem' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <SkeletonBox width="30%" height="1rem" />
          <SkeletonBox width="25%" height="1.3rem" radius="999px" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid-products">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  )
}

/** Matches ProductDetails' two-column layout. */
export function CartRowsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
          <SkeletonBox width={72} height={72} radius="var(--radius)" />
          <div style={{ flex: 1 }}>
            <SkeletonBox width="50%" height="1rem" style={{ marginBottom: '0.5rem' }} />
            <SkeletonBox width="30%" height="0.85rem" />
          </div>
          <SkeletonBox width={90} height="2.2rem" />
        </div>
      ))}
    </div>
  )
}

/** Matches ProductDetails' two-column layout. */
export function ProductDetailsSkeleton() {
  return (
    <div className="section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
      <SkeletonBox height={0} style={{ aspectRatio: '1', borderRadius: 'var(--radius-lg)' }} />
      <div>
        <SkeletonBox width="30%" height="0.8rem" style={{ marginBottom: '0.75rem' }} />
        <SkeletonBox width="70%" height="2rem" style={{ marginBottom: '1rem' }} />
        <SkeletonBox width="40%" height="1.5rem" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBox height="0.9rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBox height="0.9rem" width="90%" style={{ marginBottom: '0.5rem' }} />
        <SkeletonBox height="0.9rem" width="60%" style={{ marginBottom: '1.5rem' }} />
        <SkeletonBox width="45%" height="3rem" radius="var(--radius)" />
      </div>
    </div>
  )
}
