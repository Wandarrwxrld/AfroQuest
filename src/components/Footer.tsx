import { Link } from 'react-router-dom'
import OfficeLocationBlock from './OfficeLocation'

/** Structure matches the real Lamcast reference (verified from actual
 *  screenshots, not guessed): a "Find Us" map block, then a dark footer
 *  with company blurb, Quick Links, and Contact Info columns. */
export default function Footer() {
  return (
    <footer style={{ marginTop: '3rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <OfficeLocationBlock />
      </div>

      <div style={{ background: 'var(--color-dark)', color: 'white', padding: '3rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '2.5rem' }}>
          <div>
            <img src="/logo.svg" alt="AfroQuest" style={{ height: 30, filter: 'brightness(0) invert(1)' }} />
            <p style={{ color: '#B9B7AD', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
              Safety footwear, workwear, and industrial PPE for Zambia — quality gear that keeps you protected on the job.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Link to="/" style={{ color: '#B9B7AD' }}>Home</Link>
              <Link to="/shop" style={{ color: '#B9B7AD' }}>Shop</Link>
              <Link to="/about" style={{ color: '#B9B7AD' }}>About Us</Link>
              <Link to="/contact" style={{ color: '#B9B7AD' }}>Contact</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Contact Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: '#B9B7AD' }}>
              <span>Lusaka, Zambia</span>
              <span>info@afroquest.co.zm</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '2.5rem auto 0', paddingTop: '1.25rem', borderTop: '1px solid #3A3730', fontSize: '0.8rem', color: '#8B8A82' }}>
          © {new Date().getFullYear()} AfroQuest Zambia. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
