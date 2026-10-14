import { useState } from 'react'
import roomImage from '../assets/shoppable-room.jpg'
import { ROOM_HOTSPOTS, type RoomHotspot } from '../data/roomHotspots'
import RoomCategoryOverlay from './RoomCategoryOverlay'

/** A background photo with small, soft hotspot dots - translucent
 *  white with a gentle pulse ring, centered on each product zone.
 *  Hovering shows the category label; clicking blurs the room and
 *  opens an animated panel listing that zone's real subcategories.
 *  Positions are percentage-based so dots stay aligned at any display
 *  width. */
export default function ShoppableRoom() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeZone, setActiveZone] = useState<RoomHotspot | null>(null)

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <img src={roomImage} alt="Shop the room" style={{ width: '100%', display: 'block' }} />

      {ROOM_HOTSPOTS.map((zone, i) => (
        <div
          key={zone.name}
          className="room-dot-wrap"
          style={{ left: `${zone.xPct}%`, top: `${zone.yPct}%` }}
          onMouseEnter={() => setHoveredIndex(i)}
          onMouseLeave={() => setHoveredIndex((cur) => (cur === i ? null : cur))}
        >
          {hoveredIndex === i && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                background: 'var(--color-dark)',
                color: 'white',
                padding: '0.35rem 0.7rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                pointerEvents: 'none',
              }}
            >
              {zone.name}
            </div>
          )}

          <button onClick={() => setActiveZone(zone)} aria-label={`Shop ${zone.name}`} className="room-dot-btn">
            <span className="room-dot-pulse" />
            <span className="room-dot-core" />
          </button>
        </div>
      ))}

      <RoomCategoryOverlay zone={activeZone} onClose={() => setActiveZone(null)} />
    </div>
  )
}
