import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_REDIRECT_URI  = Deno.env.get('GOOGLE_REDIRECT_URI')!
const SUPABASE_URL         = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SVC         = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Single-user app — the Google Fit grant lives in exactly one row.
const TOKEN_ROW_ID = '00000000-0000-0000-0000-000000000001'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return new Response(`Google authorization failed: ${error}`, { status: 400, headers: CORS })
  }
  if (!code) {
    return new Response('Missing authorization code', { status: 400, headers: CORS })
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  GOOGLE_REDIRECT_URI,
        grant_type:    'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const body = await tokenRes.text()
      console.error('[google-auth-callback] token exchange failed:', tokenRes.status, body)
      return new Response(`Token exchange failed: ${body}`, { status: 502, headers: CORS })
    }

    const tokens = await tokenRes.json()
    const expiresAt = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString()

    const db = createClient(SUPABASE_URL, SUPABASE_SVC)

    // Google omits refresh_token on a repeat consent unless prompt=consent forces
    // a new one (it does, in google-auth-start) — fall back to the stored one if absent.
    let refreshToken = tokens.refresh_token
    if (!refreshToken) {
      const { data: existing } = await db
        .from('google_tokens')
        .select('refresh_token')
        .eq('id', TOKEN_ROW_ID)
        .maybeSingle()
      refreshToken = existing?.refresh_token
    }
    if (!refreshToken) {
      console.error('[google-auth-callback] no refresh_token available — re-authorize with account chooser reset')
      return new Response('No refresh token returned by Google. Revoke app access at myaccount.google.com/permissions and try again.', {
        status: 502,
        headers: CORS,
      })
    }

    const { error: dbErr } = await db.from('google_tokens').upsert(
      {
        id:            TOKEN_ROW_ID,
        access_token:  tokens.access_token,
        refresh_token: refreshToken,
        expires_at:    expiresAt,
        scope:         tokens.scope ?? null,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'id' },
    )

    if (dbErr) {
      console.error('[google-auth-callback] token store failed:', dbErr.message)
      return new Response(`Failed to store tokens: ${dbErr.message}`, { status: 500, headers: CORS })
    }

    console.log('[google-auth-callback] Google Fit connected')
    return new Response('Google Fit connected — you can close this tab.', {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'text/plain' },
    })
  } catch (err: any) {
    console.error('[google-auth-callback] unhandled error:', err)
    return new Response(`Unexpected error: ${err.message}`, { status: 500, headers: CORS })
  }
})
