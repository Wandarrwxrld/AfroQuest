import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

export default function Header() {
  const { user, isAdmin, signOut } = useAuth()
  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e5e5' }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}>AfroQuest</Link>
      <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontSize: '0.95rem' }}>
        <Link to="/shop">Shop</Link>
        <Link to="/cart">Cart</Link>
        {isAdmin && <Link to="/admin">Admin</Link>}
        {user ? (<><Link to="/account">My Account</Link><button onClick={() => signOut()}>Sign out</button></>) : (<Link to="/login">Login</Link>)}
      </nav>
    </header>
  )
}
