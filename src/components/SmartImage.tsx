import { useState } from 'react'

interface SmartImageProps {
  src: string
  alt: string
  style?: React.CSSProperties
  loading?: 'lazy' | 'eager'
}

/** An <img> that shows a shimmering skeleton until the real file has
 * actually finished loading, instead of a blank gap or a jarring pop-in.
 * Used everywhere a real product photo will eventually render. */
export default function SmartImage({ src, alt, style, loading = 'lazy' }: SmartImageProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && <div className="skeleton-shimmer" style={{ position: 'absolute', inset: 0 }} />}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.25s ease' }}
      />
    </div>
  )
}
