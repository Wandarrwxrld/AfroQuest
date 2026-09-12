import { useState } from 'react'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { OFFICE_LOCATION } from '../components/OfficeLocation'

// TODO: replace with real contact details once provided.
const CONTACT_INFO = {
  phone: '+260 XXX XXX XXX',
  email: 'info@afroquest.co.zm',
  hours: 'Mon - Fri: 8:00 AM - 5:00 PM\nSat: 8:00 AM - 12:00 PM',
}

export default function Contact() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Same unresolved tsc -b type collapse documented in adminProducts.ts.
    const { error } = await (supabase as any).from('contact_messages').insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
      message,
    })
    setLoading(false)
    if (error) {
      setError('Could not send your message right now. Please try again.')
      return
    }
    setSent(true)
  }

  return (
    <div className="section">
      <h1>Contact us</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Have a question about an order, product, or your account? Reach out any time.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        {/* Contact Information */}
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Contact Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <InfoCard icon={<Phone size={18} />} label="Phone" value={CONTACT_INFO.phone} />
            <InfoCard icon={<Mail size={18} />} label="Email" value={CONTACT_INFO.email} />
            <InfoCard icon={<MapPin size={18} />} label="Location" value={OFFICE_LOCATION.address} />
            <InfoCard icon={<Clock size={18} />} label="Business Hours" value={CONTACT_INFO.hours} />
          </div>
        </div>

        {/* Send us a message */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>Send us a Message</h2>
          {sent ? (
            <p style={{ color: 'var(--color-success)' }}>Thanks — your message has been sent. We'll get back to you soon.</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required style={{ padding: '0.65rem' }} />
                <input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required style={{ padding: '0.65rem' }} />
              </div>
              <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '0.65rem' }} />
              <input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ padding: '0.65rem' }} />
              <textarea placeholder="Your message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} style={{ padding: '0.65rem', fontFamily: 'inherit', resize: 'vertical' }} />
              {error && <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem' }}>{error}</p>}
              <button className="btn btn-primary" disabled={loading} type="submit">
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <div style={{ color: 'var(--color-primary)', flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
        <div className="text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{value}</div>
      </div>
    </div>
  )
}
