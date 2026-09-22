// Shared by the chat and log-commit Edge Functions. Both use the service-role
// key internally (so they can write regardless of RLS), which means they are
// the only thing standing between "anyone with the public anon key" and this
// app's data. `verify_jwt` alone doesn't help — the anon key IS a valid JWT.
// This checks that the caller's bearer token resolves to a real signed-in
// user, not just anon, before either function does anything else.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON = Deno.env.get('SUPABASE_ANON_KEY')!

export async function requireAuthenticatedUser(req: Request): Promise<{ id: string; email?: string } | null> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  // A real user session, verified against Auth — not just "some JWT that
  // parses," which the static anon key would also satisfy.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) return null

  return { id: data.user.id, email: data.user.email }
}

export function unauthorizedResponse(cors: Record<string, string>) {
  return new Response(JSON.stringify({ error: 'Sign in required.' }), {
    status: 401,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
