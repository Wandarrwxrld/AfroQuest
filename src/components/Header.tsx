import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, ShoppingCart, Heart } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useCart } from '../lib/CartContext'

/** Icon-based nav matching the reference (person/cart/heart icons, not
 *  text labels), with the account icon opening a real dropdown of
 *  account actions instead of navigating directly - matches the
 *  reference's "Sign In/Register, My Orders, ..." panel pattern. */
export default function Header() {
  const { user, isAdmin, signOut } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    await signOut()
    setAccountOpen(false)
    navigate('/')
  }

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e5e5' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/logo.svg" alt="AfroQuest" style={{ height: 32 }} />
      </Link>

      <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/shop" style={{ fontSize: '0.9rem', textDecoration: 'none', color: 'inherit' }}>Shop</Link>
        {isAdmin && <Link to="/admin" style={{ fontSize: '0.9rem', textDecoration: 'none', color: 'inherit' }}>Admin</Link>}

        <Link to="/wishlist" aria-label="Wishlist" style={{ color: 'inherit', display: 'flex' }}>
          <Heart size={22} strokeWidth={1.75} />
        </Link>

        <Link to="/cart" aria-label="Cart" style={{ color: 'inherit', display: 'flex', position: 'relative' }}>
          <ShoppingCart size={22} strokeWidth={1.75} />
          {itemCount > 0 && (
            <span style={{ position: 'absolute', top: -6, right: -8, background: 'var(--color-primary)', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {itemCount}
            </span>
          )}
        </Link>

        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setAccountOpen((v) => !v)}
            aria-label="Account"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}
          >
            <User size={22} strokeWidth={1.75} />
          </button>

          {accountOpen && (
            <div
              style={{
                position: 'absolute', right: 0, top: '2rem', background: 'white',
                border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 200, padding: '0.5rem 0', zIndex: 50,
              }}
            >
              {user ? (
                <>
                  <div style={{ padding: '0.5rem 1rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600 }}>
                    My Account
                  </div>
                  <DropdownLink to="/account" onClick={() => setAccountOpen(false)}>My Orders</DropdownLink>
                  <DropdownLink to="/wishlist" onClick={() => setAccountOpen(false)}>My Wishlist</DropdownLink>
                  <DropdownLink to="/account" onClick={() => setAccountOpen(false)}>Account Settings</DropdownLink>
                  {isAdmin && <DropdownLink to="/admin" onClick={() => setAccountOpen(false)}>Admin Dashboard</DropdownLink>}
                  <button
                    onClick={handleSignOut}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 1rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-danger)' }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <div style={{ padding: '0.5rem 1rem 0.75rem', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: 600 }}>
                    Sign In / Register
                  </div>
                  <DropdownLink to="/login" onClick={() => setAccountOpen(false)}>Log in</DropdownLink>
                  <DropdownLink to="/register" onClick={() => setAccountOpen(false)}>Create account</DropdownLink>
                </>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

function DropdownLink({ to, onClick, children }: { to: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      style={{ display: 'block', padding: '0.6rem 1rem', fontSize: '0.9rem', color: 'inherit', textDecoration: 'none' }}
    >
      {children}
    </Link>
  )
}
