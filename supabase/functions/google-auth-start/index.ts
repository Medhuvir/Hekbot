// One-time flow: sends the browser to Google's consent screen.
// Visit this function's URL directly (no request body needed) to kick off authorization.

const GOOGLE_CLIENT_ID    = Deno.env.get('GOOGLE_CLIENT_ID')!
const GOOGLE_REDIRECT_URI = Deno.env.get('GOOGLE_REDIRECT_URI')!

// As decided in the build plan — confirm these match the scopes granted
// to the OAuth client in Google Cloud before running this.
const SCOPES = ['nutrition.writeonly', 'activity_and_fitness.readonly'].join(' ')

Deno.serve((req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    })
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
  authUrl.searchParams.set('redirect_uri', GOOGLE_REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope', SCOPES)
  // offline + consent is what makes Google actually hand back a refresh_token
  authUrl.searchParams.set('access_type', 'offline')
  authUrl.searchParams.set('prompt', 'consent')

  return Response.redirect(authUrl.toString(), 302)
})
