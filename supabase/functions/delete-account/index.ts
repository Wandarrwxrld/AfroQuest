// Deletes the CALLING user's own account permanently (auth user row,
// which cascades to profile and related rows per the schema's FK
// constraints). This must run server-side with the service-role key -
// the anon/browser client can never be trusted to delete an auth user,
// even its own, since that key has no such privilege by design.
//
// Invoked as: POST (no body needed - the caller is identified from
// their own JWT in the Authorization header, so this endpoint can only
// ever delete the account making the request, never someone else's).
// Auth: verify_jwt must be enabled - an unauthenticated request has no
// user to delete in the first place.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: corsHeaders })
    }

    // A short-lived client scoped to the caller's own JWT, used only to
    // resolve "who is calling" - never to perform the deletion itself.
    const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: userErr } = await callerClient.auth.getUser()
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: corsHeaders })
    }

    // TODO(backend): decide what should happen to this user's existing
    // orders before deleting them - e.g. block deletion if there are
    // orders still in progress (pending/confirmed/processing/packed/
    // shipped), or keep orders but null out user_id if the FK allows it.
    // Deleting a user with an ON DELETE CASCADE on orders.user_id would
    // silently destroy their order history, which may not be desired
    // for accounting/audit reasons even after the account itself is gone.

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteErr) {
      return new Response(JSON.stringify({ error: deleteErr.message }), { status: 500, headers: corsHeaders })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: corsHeaders })
  }
})
