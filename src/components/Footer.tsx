import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import OfficeLocationBlock from './OfficeLocation'
import { FacebookIcon, InstagramIcon, TikTokIcon } from './SocialIcons'
import { fetchPopularProducts, type PopularProduct } from '../lib/products'

// TODO: replace with the real AfroQuest social profile URLs once provided.
const SOCIAL_LINKS = {
  facebook: 'https://facebook.com/afroquestzambia',
  instagram: 'https://instagram.com/afroquestzambia',
  tiktok: 'https://tiktok.com/@afroquestzambia',
}

/** Structure matches the real Lamcast reference (verified from actual
 *  screenshots): a "Find Us" map block, then a dark footer with company
 *  blurb, Quick Links, Popular Products (real, order-ranked - not a
 *  generic "Our Services" list), and Contact Info columns. */
export default function Footer() {
  const [popular, setPopular] = useState<PopularProduct[]>([])

  useEffect(() => {
    fetchPopularProducts(5).then(setPopular).catch(() => setPopular([]))
  }, [])

  return (
    <footer style={{ marginTop: '3rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <OfficeLocationBlock />
      </div>

      <div style={{ background: 'var(--color-dark)', color: 'white', padding: '3rem 1.5rem 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 0.9fr 1fr 1fr', gap: '2rem' }}>
          <div>
            <div style={{ background: 'white', borderRadius: 'var(--radius)', padding: '0.4rem 0.6rem', display: 'inline-block' }}>
              <img src="/logo.png" alt="AfroQuest" style={{ height: 30, display: 'block' }} />
            </div>
            <p style={{ color: '#B9B7AD', fontSize: '0.9rem', lineHeight: 1.6, marginTop: '0.75rem' }}>
              Safety footwear, workwear, and industrial PPE for Zambia — quality gear that keeps you protected on the job.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1rem' }}>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="AfroQuest on Facebook" style={{ color: '#B9B7AD' }}>
                <FacebookIcon />
              </a>
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="AfroQuest on Instagram" style={{ color: '#B9B7AD' }}>
                <InstagramIcon />
              </a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="AfroQuest on TikTok" style={{ color: '#B9B7AD' }}>
                <TikTokIcon />
              </a>
            </div>
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
            <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Popular Products</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              {popular.length === 0 ? (
                <span style={{ color: '#8B8A82' }}>—</span>
              ) : (
                popular.map((p) => (
                  <Link key={p.slug} to={`/product/${p.slug}`} style={{ color: '#B9B7AD' }}>{p.name}</Link>
                ))
              )}
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
