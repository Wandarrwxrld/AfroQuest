import OfficeLocationBlock from '../components/OfficeLocation'

export default function Contact() {
  return (
    <div className="section">
      <h1>Contact us</h1>
      <p className="text-muted" style={{ marginBottom: '2rem' }}>
        Have a question about an order, product, or your account? Reach out any time.
      </p>
      <div style={{ marginBottom: '2rem', fontSize: '0.95rem' }}>
        <div><strong>Email:</strong> info@afroquest.co.zm</div>
      </div>
      <OfficeLocationBlock />
    </div>
  )
}
