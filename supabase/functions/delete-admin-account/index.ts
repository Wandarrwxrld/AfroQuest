// Permanently deletes an ADMIN-TIER account (auth user + cascading rows).
// Restricted to callers whose OWN profile role is 'super_admin', checked
// server-side against the database - never trusting a client-supplied
// role claim. Distinct from delete-account (self-service) because this
// one target a DIFFERENT user's id, which the anon/browser client must
// never be able to do directly regardless of who's asking.
//
// Invoked as: POST { targetUserId: string }
// Auth: verify_jwt must be enabled.

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

    const { targetUserId } = await req.json()
    if (!targetUserId || typeof targetUserId !== 'string') {
      return new Response(JSON.stringify({ error: 'targetUserId is required' }), { status: 400, headers: corsHeaders })
    }

    const callerClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerErr } = await callerClient.auth.getUser()
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: corsHeaders })
    }

    if (caller.id === targetUserId) {
      return new Response(JSON.stringify({ error: 'Use account self-deletion instead of terminating yourself here' }), { status: 400, headers: corsHeaders })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // The real authorization check - the caller's role is read fresh
    // from the database with the service-role client, not taken from
    // anything the browser sent.
    const { data: callerProfile, error: profileErr } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()
    if (profileErr || callerProfile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Only a super admin can terminate an account' }), { status: 403, headers: corsHeaders })
    }

    // TODO(backend): consider blocking termination of the LAST remaining
    // super_admin account, so the store can never be left with no one
    // able to manage admin accounts at all.

    const { error: deleteErr } = await adminClient.auth.admin.deleteUser(targetUserId)
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
