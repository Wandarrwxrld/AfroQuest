// Real transactional email for order confirmation and shipment updates.
// Sends via Resend (https://resend.com). The API key is read from the
// RESEND_API_KEY environment secret - never hardcoded here - so wiring
// in a real key later is a Supabase dashboard config step, not a code
// change or redeploy of this file's logic.
//
// Invoked as: POST { orderId: string, emailType: 'confirmation' | 'shipment' }
// Auth: verify_jwt is enabled, so only an authenticated request (the
// place_order() flow, or an admin action) can trigger this - not open
// to the public internet.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FROM_EMAIL = Deno.env.get('ORDER_EMAIL_FROM') ?? 'AfroQuest Zambia <orders@afroquest.co.zm>'

interface OrderItemRow {
  product_name: string
  variant_label: string | null
  unit_price: number
  quantity: number
}

function renderOrderConfirmationHtml(order: any, items: OrderItemRow[]): string {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.product_name}${i.variant_label ? ` (${i.variant_label})` : ''} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">K${(i.unit_price * i.quantity).toFixed(2)}</td></tr>`
    )
    .join('')
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#E5001C">Order confirmed</h2>
      <p>Hi ${order.delivery_name}, thanks for your order — we've received it and it's being processed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">${rows}</table>
      <p style="font-weight:bold">Total: K${order.total.toFixed(2)}</p>
      <p style="color:#666;font-size:13px">Delivering to: ${order.delivery_address}</p>
    </div>
  `
}

function renderShipmentHtml(order: any): string {
  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1D9E75">Your order has shipped</h2>
      <p>Hi ${order.delivery_name}, your order is on its way to:</p>
      <p style="color:#666">${order.delivery_address}</p>
      <p>Order total: K${order.total.toFixed(2)}</p>
    </div>
  `
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const { orderId, emailType } = await req.json()
    if (!orderId || !['confirmation', 'shipment'].includes(emailType)) {
      return new Response(JSON.stringify({ error: 'orderId and a valid emailType are required' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: order, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
    }

    // Resolve the recipient's real email from auth.users via the order's user_id.
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(order.user_id)
    if (userError || !userData?.user?.email) {
      return new Response(JSON.stringify({ error: 'Could not resolve recipient email' }), { status: 404 })
    }
    const toEmail = userData.user.email

    let html: string
    let subject: string
    if (emailType === 'confirmation') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_name, variant_label, unit_price, quantity')
        .eq('order_id', orderId)
      html = renderOrderConfirmationHtml(order, (items ?? []) as OrderItemRow[])
      subject = `Order confirmed — #${orderId.slice(0, 8)}`
    } else {
      html = renderShipmentHtml(order)
      subject = `Your order has shipped — #${orderId.slice(0, 8)}`
    }

    if (!RESEND_API_KEY) {
      // Honest fallback: the key hasn't been configured yet. Log what
      // would have been sent instead of silently pretending it worked,
      // so this is easy to spot in function logs during setup.
      console.log(`[send-order-email] RESEND_API_KEY not set - would have sent "${subject}" to ${toEmail}`)
      return new Response(JSON.stringify({ sent: false, reason: 'RESEND_API_KEY not configured' }), { status: 200 })
    }

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: toEmail, subject, html }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('[send-order-email] Resend API error:', errText)
      return new Response(JSON.stringify({ sent: false, error: errText }), { status: 502 })
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('[send-order-email] Unexpected error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 })
  }
})
