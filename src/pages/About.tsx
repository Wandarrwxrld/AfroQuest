import { Link } from 'react-router-dom'

/** Deliberately modest copy - no invented founding year, headcount, or
 *  history, since none of that was given. Written to be genuinely true
 *  of any real workwear/PPE supplier operating in Zambia, and easy to
 *  replace with the real story once it's written. */
export default function About() {
  return (
    <div className="section" style={{ maxWidth: 760 }}>
      <h1 style={{ marginBottom: '1rem' }}>About AfroQuest</h1>

      <p style={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
        AfroQuest supplies safety footwear, workwear, and PPE to Zambia's industrial,
        construction, and mining workforce. We stock genuine safety boots, hi-vis
        clothing, gloves, and protective gear built for real site conditions - not
        just the shelf.
      </p>

      <p style={{ fontSize: '1.05rem', lineHeight: 1.7, marginTop: '1rem' }}>
        Whether you're kitting out a single new hire or restocking a whole crew,
        we're here to help you find gear that actually holds up on the job.
      </p>

      <div className="card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Have a question about sizing, stock, or a bulk order?</p>
        <p className="text-muted" style={{ marginBottom: '1rem' }}>
          Reach out and we'll help you find the right gear for the job.
        </p>
        <Link to="/contact" className="btn" style={{ background: 'var(--color-primary)', color: 'white', display: 'inline-flex' }}>
          Contact us
        </Link>
      </div>

      <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2rem' }}>
        dev note: this is placeholder copy - swap in the real company story,
        founding details, or team info whenever it's ready.
      </p>
    </div>
  )
}
