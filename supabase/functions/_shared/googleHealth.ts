// Shared by the Phase 1 nutrition-write and exercise-read functions.
// Exchanges the long-lived refresh token (stored as a Supabase secret) for a
// short-lived access token. Called fresh on every request — nothing is cached
// across invocations, matching the plan's "exchange on each call" design.

const GOOGLE_CLIENT_ID     = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN')!

export async function getGoogleAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`)
  }

  const data = await res.json()
  return data.access_token as string
}
