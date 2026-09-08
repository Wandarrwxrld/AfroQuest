// TODO: replace with the real Zambia office address/coordinates before launch.
// Prefer lat,lng if available (more accurate pin) over the address string.
export const OFFICE_LOCATION = {
  label: 'AfroQuest Zambia',
  address: 'Lusaka, Zambia',
  lat: -15.3875,
  lng: 28.3228,
}

function getDirectionsUrl(): string {
  const destination = `${OFFICE_LOCATION.lat},${OFFICE_LOCATION.lng}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

function getEmbedUrl(): string {
  // Public embed (no API key required) centered on the office coordinates.
  return `https://maps.google.com/maps?q=${OFFICE_LOCATION.lat},${OFFICE_LOCATION.lng}&z=15&output=embed`
}

/** "Find Us" block matching the Lamcast reference: embedded map + an
 *  "Open in Maps" link that hands off to real turn-by-turn directions. */
export default function OfficeLocationBlock() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Find Us</div>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>{OFFICE_LOCATION.label} — {OFFICE_LOCATION.address}</div>
        </div>
        <a
          href={getDirectionsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          aria-label={`Get directions to ${OFFICE_LOCATION.label}`}
        >
          Open in Maps →
        </a>
      </div>
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
        <iframe
          title="AfroQuest Zambia location"
          src={getEmbedUrl()}
          width="100%"
          height="280"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
        />
      </div>
    </div>
  )
}
