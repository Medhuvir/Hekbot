# Google Fit integration — OAuth setup

Deployed and connected. This records how the currently live setup actually
works — it superseded an earlier draft of this doc written against the
Google Health API (`health.googleapis.com`), which was never the version
that got deployed. What's live uses the older **Google Fit REST API**
(`fitness.googleapis.com`) instead. Everything stays cloud-hosted — no local
machine involved at any point.

**Open risk to track:** Google has been sunsetting the Fit REST API in favor
of Health Connect (on-device only, unreachable from a hosted backend — which
is why the plan ruled it out in the first place). Worth confirming against
Google's current developer docs that `fitness.googleapis.com` is still
supported before building the sync function that reads from it. If it's shut
off, this OAuth flow still works but the data endpoints behind it won't.

**Project ref:** `udjuqvfihznaztolihjq`
**Redirect URI (use this exact string everywhere it's asked for):**
```
https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-callback
```
**Scopes granted:** `fitness.activity.read`, `fitness.body.read` (read-only —
workouts/steps and body weight; no write access).

## 1. Google Cloud project + OAuth client

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (or pick an existing one) dedicated to Hekbot.
2. **APIs & Services → Library** — search for the Fitness API and click **Enable**. Registering an OAuth client doesn't grant API access by itself; this step does.
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Publishing status: **Testing** (keeps this out of Google's security review — testing mode covers up to 100 users)
   - Under **Test users**, add the Google account tied to the Pixel Watch (`<your-google-account-email>` — fill in the account this needs to be, not necessarily your everyday inbox)
   - On the **Data Access** tab, add the `fitness.activity.read` and `fitness.body.read` scopes
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Hekbot`
   - Authorized redirect URIs: paste the redirect URI above
   - Authorized JavaScript origins: leave empty — this flow is a server-side redirect, no browser JS ever talks to Google directly
5. Note the **Client ID** and **Client secret** — these become Supabase secrets in step 2.

**Expect an "unverified app" warning** when you run the consent flow in step
3 below — Fit scopes are sensitive and this app isn't verified. As the test
user, click **Advanced → Go to Hekbot (unsafe)** to continue. That's expected
for single-user testing, not a misconfiguration.

## 2. Deploy the auth functions, apply the migration, and set secrets

```bash
supabase link --project-ref udjuqvfihznaztolihjq

supabase functions deploy google-auth-start
supabase functions deploy google-auth-callback

supabase secrets set GOOGLE_CLIENT_ID="<client id from step 1>"
supabase secrets set GOOGLE_CLIENT_SECRET="<client secret from step 1>"
supabase secrets set GOOGLE_REDIRECT_URI="https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-callback"
```

Migration `003_google_fit_tokens.sql` creates `google_tokens` — a single-row,
RLS-locked table (no anon/authenticated policies; service-role only) that
holds the access token, refresh token, and expiry. Apply it via the Supabase
SQL editor or `supabase db push` before running the consent flow.

The `GOOGLE_REDIRECT_URI` value here must match the redirect URI registered
on the OAuth client in step 1 exactly — Google rejects the exchange otherwise.

## 3. Run the one-time consent flow

Open in a browser, signed in as the test user you added:

```
https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-start
```

Approve the consent screen (clicking past the unverified-app warning if it
appears). Google redirects to `google-auth-callback`, which exchanges the
code for tokens and upserts them straight into `google_tokens` — no manual
copy-paste step, no Supabase secret to set for the token itself. The page
just confirms "Google Fit connected."

If the callback page reports no refresh token: Google only issues one on the
account's *first* consent, and `google-auth-callback` falls back to
whatever's already stored in `google_tokens` when Google omits it on a
re-consent — so a second connect attempt won't wipe out a working token.
If there's truly nothing stored yet, revoke prior access at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions)
and retry — `google-auth-start` already forces `prompt=consent`.

## Done

Three secrets exist in Supabase: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REDIRECT_URI`. The actual OAuth grant (access token, refresh token,
expiry) lives in the `google_tokens` table, refreshed automatically on each
re-consent. Reading Fit data into `workout_logs` — the sync function that
uses this token — is separate, not-yet-built work.
