import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'

/* Copy comes from "Afroquest_About_Us_Page_Text.docx" (draft for review),
 * used as written. The document lists items management still has to
 * confirm before this goes live - kept here, NOT shown on the page:
 *   - the exact wording of the Zimbabwe-to-Zambia company history
 *   - the exact brands currently supplied in Zambia (see BRANDS below)
 *   - the industries currently served (see INDUSTRIES below)
 *   - the final Mission, Vision and Values wording
 *   - the official legal/business name and current contact details
 *   - any general wording management wants replaced with specific facts
 * The document's "Editing Note" / "Optional Brands" / "Important" lines are
 * instructions to the site owner, so they are deliberately not rendered.
 */

const WHAT_WE_DO = [
  {
    title: 'Safety Footwear',
    text: 'We provide safety footwear designed for demanding working environments, with options offering features such as protective toes, slip resistance, waterproofing and other workplace safety features depending on the product.',
  },
  {
    title: 'Workwear & PPE',
    text: 'Our workwear and protective equipment range is designed to support professionals working in environments where durability, functionality and protection are important.',
  },
  {
    title: 'Corporate Wear',
    text: 'We provide corporate clothing solutions for organizations looking to present a professional and consistent image.',
  },
  {
    title: 'Casual & Lifestyle Footwear',
    text: 'Our footwear range also includes products designed for everyday comfort, style and personal use.',
  },
  {
    title: 'Customized Solutions',
    text: 'Where required, Afroquest can provide bespoke or customized clothing solutions designed around specific customer and organizational requirements.',
  },
]

// To be edited to reflect the exact industries Afroquest currently serves.
const INDUSTRIES = [
  'Mining',
  'Construction',
  'Engineering',
  'Manufacturing',
  'Transport and logistics',
  'Security',
  'Corporate organizations',
  'Industrial operations',
  'Healthcare',
  'Hospitality',
  'General workplace safety',
]

// Only brands Afroquest currently carries or is authorized to supply.
// Portwest and Vulcan are intentionally NOT listed: the document says to add
// them only once Afroquest confirms they belong on the Zambia website.
const BRANDS = ['Caterpillar', 'Apache', 'Delta Plus', 'DeWalt', 'Grafter', 'Hoggs', 'Puma', 'Rebel', 'Timberland']

const WHY_CHOOSE = [
  { title: 'Quality', text: 'We place strong emphasis on product quality and work to source products from reliable manufacturers and suppliers.' },
  { title: 'Reliability', text: 'We aim to provide dependable products and consistent service to individuals and organizations.' },
  { title: 'Competitive Value', text: 'We focus on providing quality products at competitive prices while maintaining the standards our customers expect.' },
  { title: 'Customer Focus', text: 'Our customers are central to our approach, and we aim to build relationships based on respect, transparency and mutual benefit.' },
  { title: 'Industry Understanding', text: 'We recognize that different industries have different requirements and work toward providing products suited to specific working environments.' },
  { title: 'Customized Solutions', text: "Where standard products do not meet a customer's requirements, we can work toward bespoke and customized clothing solutions." },
]

const VALUES = [
  { title: 'Customer Satisfaction', text: 'We value our customers and aim to provide products and services that meet their requirements while building lasting relationships based on respect and transparency.' },
  { title: 'Quality', text: 'We are committed to maintaining high standards in the products we supply and the service we provide.' },
  { title: 'Integrity', text: 'We believe in conducting business with honesty, respect, transparency and professionalism.' },
  { title: 'Innovation', text: 'We remain open to better products, technologies and approaches that can improve the solutions we provide.' },
  { title: 'Partnership', text: 'We aim to develop long-term, mutually beneficial relationships with our customers and business partners.' },
]

/* Full-width bands break out of the page's centred column, same technique
 * the homepage's video section uses. */
const bleed = { marginLeft: 'calc(50% - 50vw)', marginRight: 'calc(50% - 50vw)' } as const
const inner = { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' } as const
const band = { padding: 'var(--space-64) 0' } as const
const grid = (min: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 'var(--space-24)' }) as const

function Reveal({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <h2 style={{ fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)', lineHeight: 1.15, margin: '0 0 var(--space-24)', color: light ? 'white' : undefined }}>
      {children}
    </h2>
  )
}

export default function About() {
  return (
    <div>
      {/* 1. Hero */}
      <section style={{ ...bleed, background: 'var(--color-dark)', color: 'white', padding: 'var(--space-64) 0', marginTop: 'calc(-1 * var(--space-24))' }}>
        <div style={inner}>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5.5vw, 3.6rem)', lineHeight: 1.05, margin: 0 }}>About Afroquest</h1>
          <p style={{ fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: 'clamp(1.15rem, 2.4vw, 1.5rem)', color: 'var(--color-accent)', margin: 'var(--space-16) 0 var(--space-24)', maxWidth: 720 }}>
            Protecting People. Equipping Businesses. Built for Every Step.
          </p>
          <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#DCE1E6', maxWidth: 680, margin: 0 }}>
            Afroquest is a supplier of quality footwear, workwear, safety footwear, PPE, corporate clothing and related products. We serve individuals, businesses and organizations looking for dependable products that combine quality, functionality and value.
          </p>
        </div>
      </section>

      {/* 2. Our Story */}
      <section style={band}>
        <div style={inner}>
          <Reveal>
            <div style={{ ...grid(300), gap: 'var(--space-48)' }}>
              <SectionHeading>Our Story</SectionHeading>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', fontSize: '1.05rem', lineHeight: 1.75 }}>
                <p style={{ margin: 0 }}>
                  Established in 2020, Afroquest was founded with a commitment to providing quality workwear, safety footwear and corporate clothing to businesses and professionals. From its beginnings in Zimbabwe, the company has developed a strong focus on providing practical products and solutions for customers across different industries and working environments.
                </p>
                <p style={{ margin: 0 }}>
                  Today, Afroquest's offering extends across safety footwear, workwear, PPE, corporate clothing and footwear for everyday use. The company combines product quality with professional service, competitive pricing and a customer-focused approach designed to build lasting business relationships.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. What We Do */}
      <section style={{ ...bleed, background: '#F3F5F7' }}>
        <div style={{ ...inner, ...band }}>
          <Reveal>
            <SectionHeading>What We Do</SectionHeading>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 760, margin: '0 0 var(--space-40)' }}>
              At Afroquest, we provide products designed to meet the needs of professionals, businesses and everyday customers. Our range brings together workplace protection, functionality, comfort and style, making it possible for customers to find products suited to both demanding work environments and everyday use.
            </p>
          </Reveal>
          <div style={grid(260)}>
            {WHAT_WE_DO.map((item, i) => (
              <Reveal key={item.title}>
                <div className="card" style={{ padding: 'var(--space-24)', height: '100%' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-primary)', letterSpacing: '0.06em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', margin: 'var(--space-8) 0' }}>{item.title}</h3>
                  <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--color-text-muted)' }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Industries We Serve */}
      <section style={band}>
        <div style={inner}>
          <Reveal>
            <SectionHeading>Solutions for Different Working Environments</SectionHeading>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 760, margin: '0 0 var(--space-16)' }}>
              Different industries have different requirements. Afroquest aims to provide products that support professionals and organizations across a range of working environments.
            </p>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 760, margin: '0 0 var(--space-24)' }}>
              Our products can support customers in areas including:
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
              {INDUSTRIES.map((name) => (
                <li key={name} style={{ padding: '0.5rem 1.1rem', borderRadius: 'var(--radius-pill)', border: '1.5px solid var(--color-border)', fontWeight: 600, fontSize: '0.92rem' }}>
                  {name}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 5. Our Brands */}
      <section style={{ ...bleed, background: '#F3F5F7' }}>
        <div style={{ ...inner, ...band }}>
          <Reveal>
            <SectionHeading>Brands You Can Trust</SectionHeading>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 760, margin: '0 0 var(--space-32)' }}>
              We work with a range of recognized brands across footwear, safety products, workwear and related categories. Our current product catalogue includes brands such as Caterpillar, Apache, Delta Plus, DeWalt, Grafter, Hoggs, Puma, Rebel and Timberland, with additional brands and product ranges available depending on market and stock availability.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 'var(--space-12)' }}>
              {BRANDS.map((name) => (
                <li key={name} style={{ padding: '0.7rem 1.4rem', borderRadius: 'var(--radius-card)', background: 'white', border: '1px solid var(--color-border)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>
                  {name}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* 6. Why Afroquest */}
      <section style={band}>
        <div style={inner}>
          <Reveal>
            <SectionHeading>Why Choose Afroquest?</SectionHeading>
            <p style={{ fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 760, margin: '0 0 var(--space-40)' }}>
              Choosing the right workwear, safety equipment or footwear is about more than simply finding a product. It is about finding products that are suitable for the environment in which they will be used and receiving dependable service throughout the purchasing process.
            </p>
          </Reveal>
          <div style={grid(300)}>
            {WHY_CHOOSE.map((item) => (
              <Reveal key={item.title}>
                <div style={{ borderTop: '3px solid var(--color-primary)', paddingTop: 'var(--space-16)' }}>
                  <h3 style={{ fontSize: '1.1rem', margin: '0 0 var(--space-8)' }}>{item.title}</h3>
                  <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--color-text-muted)' }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Quality & Customer Commitment */}
      <section style={{ ...bleed, background: 'var(--color-dark)', color: 'white' }}>
        <div style={{ ...inner, ...band }}>
          <Reveal>
            <SectionHeading light>Quality Is More Than a Promise</SectionHeading>
            <div style={{ ...grid(320), gap: 'var(--space-40)', lineHeight: 1.75, color: '#DCE1E6', fontSize: '1.05rem' }}>
              <p style={{ margin: 0 }}>
                At Afroquest, quality is not simply a product feature; it is part of our commitment to our customers. We work to source products from reliable producers and maintain a focus on manufacturing standards and consistent quality control.
              </p>
              <p style={{ margin: 0 }}>
                Our goal is to provide products that customers can depend on while delivering a professional and customer-friendly experience. We believe that quality products, responsible service and attention to customer requirements are essential to building long-term relationships.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 8 + 9. Mission and Vision */}
      <section style={band}>
        <div style={inner}>
          <div style={grid(360)}>
            <Reveal>
              <div className="card" style={{ padding: 'var(--space-32)', height: '100%' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 var(--space-16)' }}>Our Mission</h2>
                <p style={{ fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.3rem', lineHeight: 1.4, margin: '0 0 var(--space-16)', color: 'var(--color-primary)' }}>
                  To supplement product excellence with outstanding service and competitive pricing.
                </p>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
                  Our mission is reflected in the way we approach our products, customer service and relationships with businesses and individuals. We aim to combine dependable products with service that understands and responds to the needs of our customers.
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="card" style={{ padding: 'var(--space-32)', height: '100%' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 var(--space-16)' }}>Our Vision</h2>
                <p style={{ fontFamily: 'var(--font-editorial)', fontStyle: 'italic', fontSize: '1.3rem', lineHeight: 1.4, margin: '0 0 var(--space-16)', color: 'var(--color-primary)' }}>
                  To provide quality, affordable and innovative safety equipment and clothing solutions to various industries globally.
                </p>
                <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--color-text-muted)' }}>
                  We aspire to continue developing as a trusted supplier of safety equipment, footwear, workwear and clothing solutions while expanding our ability to serve customers across different industries and markets.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 10. Our Values */}
      <section style={{ paddingBottom: 'var(--space-64)' }}>
        <div style={inner}>
          <Reveal>
            <SectionHeading>What We Stand For</SectionHeading>
          </Reveal>
          <div style={grid(230)}>
            {VALUES.map((item) => (
              <Reveal key={item.title}>
                <div style={{ height: '100%' }}>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 var(--space-8)' }}>{item.title}</h3>
                  <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{item.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 11. More Than a Supplier */}
      <section style={{ ...bleed, background: '#F3F5F7' }}>
        <div style={{ ...inner, ...band }}>
          <Reveal>
            <SectionHeading>More Than a Supplier</SectionHeading>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)', maxWidth: 760, fontSize: '1.05rem', lineHeight: 1.75 }}>
              <p style={{ margin: 0 }}>
                At Afroquest, we believe that supplying a product is only part of what we do. Understanding what our customers need, helping them identify suitable solutions and providing dependable service are equally important.
              </p>
              <p style={{ margin: 0 }}>
                Whether you are looking for a single pair of safety boots, workwear for your team, corporate clothing for your organization or protective equipment for a demanding working environment, our goal is to make the process straightforward and provide solutions suited to your requirements.
              </p>
              <p style={{ margin: 0 }}>
                For organizations with specific requirements, our team can also discuss customized and bespoke solutions.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 12 + 13. Individuals and businesses */}
      <section style={band}>
        <div style={inner}>
          <div style={grid(360)}>
            <Reveal>
              <div className="card" style={{ padding: 'var(--space-32)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 var(--space-16)' }}>Shop for Yourself</h2>
                <p style={{ margin: '0 0 var(--space-24)', lineHeight: 1.7, color: 'var(--color-text-muted)', flexGrow: 1 }}>
                  Our online store makes it easier for individual customers to discover and purchase footwear, safety footwear, workwear and other products from Afroquest. Browse our collections, compare products, check availability and find the products that suit your needs.
                </p>
                <Link to="/shop" className="btn" style={{ background: 'var(--color-primary)', color: 'white' }}>Shop now</Link>
              </div>
            </Reveal>
            <Reveal>
              <div className="card" style={{ padding: 'var(--space-32)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <h2 style={{ fontSize: '1.5rem', margin: '0 0 var(--space-16)' }}>Solutions for Your Business</h2>
                <p style={{ margin: '0 0 var(--space-24)', lineHeight: 1.7, color: 'var(--color-text-muted)', flexGrow: 1 }}>
                  Afroquest also works with businesses and organizations requiring footwear, PPE, workwear and corporate clothing. Whether you are equipping a small team or sourcing products for a larger organization, we can work with you to understand your requirements and identify suitable solutions.
                </p>
                <Link to="/contact" className="btn btn-outline">Business enquiry</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 14. Final call to action */}
      <section style={{ ...bleed, background: 'var(--color-dark)', color: 'white', textAlign: 'center' }}>
        <div style={{ ...inner, ...band }}>
          <Reveal>
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', margin: '0 0 var(--space-16)', color: 'white' }}>Ready to Find the Right Solution?</h2>
            <p style={{ maxWidth: 680, margin: '0 auto var(--space-32)', fontSize: '1.05rem', lineHeight: 1.75, color: '#DCE1E6' }}>
              Explore our products, discover our brands or speak with our team about your requirements. Whether you're shopping for yourself, equipping your team or looking for a long-term business supplier, Afroquest is ready to help you take the next step.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-12)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn" style={{ background: 'var(--color-primary)', color: 'white' }}>Shop now</Link>
              <Link to="/contact" className="btn" style={{ background: 'transparent', color: 'white', border: '1.5px solid rgba(255,255,255,0.5)' }}>Contact us</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
