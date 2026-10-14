import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import type { RoomHotspot } from '../data/roomHotspots'

export default function RoomCategoryOverlay({
  zone,
  onClose,
}: {
  zone: RoomHotspot | null
  onClose: () => void
}) {
  return (
    <AnimatePresence>
      {zone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(36,35,49,0.5)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              background: 'white',
              padding: '1.75rem',
              width: 'min(420px, 90%)',
              position: 'relative',
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ margin: '0 0 1.1rem', fontSize: '1.15rem' }}>{zone.name}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {zone.subcategories.map((sub, i) => (
                <motion.div
                  key={sub.name}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 + i * 0.05 }}
                >
                  <Link
                    to={`/shop/${sub.slug}`}
                    onClick={onClose}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius)',
                      border: '1.5px solid var(--color-border)',
                      textDecoration: 'none',
                      color: 'var(--color-text)',
                      fontWeight: 600,
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = '#FFF3EE' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'transparent' }}
                  >
                    {sub.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
