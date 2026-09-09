import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './lib/AuthContext'
import { CartProvider } from './lib/CartContext'
import { RequireAuth, RequireAdmin } from './components/RequireAuth'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import SearchResults from './pages/SearchResults'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import MyAccount from './pages/MyAccount'
import Wishlist from './pages/Wishlist'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderConfirmation from './pages/OrderConfirmation'
import About from './pages/About'
import Contact from './pages/Contact'
import AdminDashboard from './pages/AdminDashboard'
import AdminMfaSetup from './pages/AdminMfaSetup'
import MfaChallenge from './pages/MfaChallenge'

/** One consistent, deliberate transition on every route change - a soft
 * fade with a small vertical settle - rather than different effects
 * per page. Wrapping each Route element (not <Routes> itself) so pages
 * that need their own full-width layout (Home) aren't forced into a
 * constrained container. */
function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/shop" element={<PageTransition><div className="site-main"><Shop /></div></PageTransition>} />
        <Route path="/shop/:category" element={<PageTransition><div className="site-main"><Shop /></div></PageTransition>} />
        <Route path="/product/:slug" element={<PageTransition><div className="site-main"><ProductDetails /></div></PageTransition>} />
        <Route path="/search" element={<PageTransition><div className="site-main"><SearchResults /></div></PageTransition>} />
        <Route path="/login" element={<PageTransition><div className="site-main"><Login /></div></PageTransition>} />
        <Route path="/register" element={<PageTransition><div className="site-main"><Register /></div></PageTransition>} />
        <Route path="/forgot-password" element={<PageTransition><div className="site-main"><ForgotPassword /></div></PageTransition>} />
        <Route path="/reset-password" element={<PageTransition><div className="site-main"><ResetPassword /></div></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><div className="site-main"><VerifyEmail /></div></PageTransition>} />
        <Route path="/about" element={<PageTransition><div className="site-main"><About /></div></PageTransition>} />
        <Route path="/contact" element={<PageTransition><div className="site-main"><Contact /></div></PageTransition>} />
        <Route path="/account" element={<RequireAuth><PageTransition><div className="site-main"><MyAccount /></div></PageTransition></RequireAuth>} />
        <Route path="/wishlist" element={<RequireAuth><PageTransition><div className="site-main"><Wishlist /></div></PageTransition></RequireAuth>} />
        <Route path="/cart" element={<RequireAuth><PageTransition><div className="site-main"><Cart /></div></PageTransition></RequireAuth>} />
        <Route path="/checkout" element={<RequireAuth><PageTransition><div className="site-main"><Checkout /></div></PageTransition></RequireAuth>} />
        <Route path="/order-confirmation/:orderId" element={<RequireAuth><PageTransition><div className="site-main"><OrderConfirmation /></div></PageTransition></RequireAuth>} />
        <Route path="/mfa-challenge" element={<RequireAuth><PageTransition><div className="site-main"><MfaChallenge /></div></PageTransition></RequireAuth>} />
        <Route path="/admin" element={<RequireAdmin><PageTransition><div className="site-main"><AdminDashboard /></div></PageTransition></RequireAdmin>} />
        <Route path="/admin/mfa-setup" element={<RequireAuth><PageTransition><div className="site-main"><AdminMfaSetup /></div></PageTransition></RequireAuth>} />
      </Routes>
    </AnimatePresence>
  )
}

/** Footer previously rendered unconditionally on every route, including
 *  auth pages (login, register, etc.) and the admin dashboard - neither
 *  should show the customer-facing Find-Us/footer block. Hidden on any
 *  route under these prefixes. */
const NO_FOOTER_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/mfa-challenge', '/admin']

function ConditionalFooter() {
  const location = useLocation()
  const hide = NO_FOOTER_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  if (hide) return null
  return <Footer />
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Header />
          <AnimatedRoutes />
          <ConditionalFooter />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
