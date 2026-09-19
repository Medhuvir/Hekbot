// Google redirects here after consent. Exchanges the auth code for tokens
// and prints the refresh_token once, for you to copy into Supabase secrets.
// This function stores nothing — the refresh token only ever lives in
// Supabase's own secrets store from this point on.

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_REDIRECT_URI  = Deno.env.get('GOOGLE_REDIRECT_URI')!

function text(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain' } })
}

Deno.serve(async (req) => {
  const url   = new URL(req.url)
  const code  = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) return text(`Google denied authorization: ${error}`, 400)
  if (!code) return text('Missing authorization code in callback URL.', 400)

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri:  GOOGLE_REDIRECT_URI,
      grant_type:    'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()

  if (!tokenRes.ok) {
    return text(`Token exchange failed: ${JSON.stringify(tokenData)}`, 500)
  }

  if (!tokenData.refresh_token) {
    return text(
      'Authorization succeeded but Google did not return a refresh_token.\n\n' +
      'Google only issues one on the first consent for an account. Revoke prior access at ' +
      'https://myaccount.google.com/permissions, then reopen the google-auth-start URL and try again.',
      400,
    )
  }

  return text(
    'Authorization succeeded.\n\n' +
    'Copy this refresh token into Supabase now — it will not be shown again:\n\n' +
    `${tokenData.refresh_token}\n\n` +
    'Run:\n' +
    `  supabase secrets set GOOGLE_REFRESH_TOKEN="${tokenData.refresh_token}"\n\n` +
    'Then close this tab.',
  )
})
