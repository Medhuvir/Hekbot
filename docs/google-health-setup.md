# Google Health integration — one-time OAuth setup

Step 1 of the build plan. This gets a refresh token stored in Supabase so the
Phase 1 edge functions (nutrition write, exercise read) can call the Google
Health API on your behalf. Everything stays cloud-hosted — no local machine
involved at any point.

**Project ref:** `udjuqvfihznaztolihjq`
**Redirect URI (use this exact string everywhere it's asked for):**
```
https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-callback
```

## 1. Google Cloud project + OAuth client

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (or pick an existing one) dedicated to Hekbot.
2. **APIs & Services → Library** — search for the Google Health API and click **Enable**. Registering an OAuth client doesn't grant API access by itself; this step does.
3. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Publishing status: **Testing** (keeps this out of Google's security review — testing mode covers up to 100 users)
   - Under **Test users**, add the Google account tied to the Pixel Watch (`<your-google-account-email>` — fill in the account this needs to be, not necessarily your everyday inbox)
   - On the **Data Access** tab, add the nutrition write and activity/fitness read scopes — Google lists the exact scope identifiers here once the API is enabled; use what's shown rather than the shorthand names in the build plan
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Hekbot`
   - Authorized redirect URIs: paste the redirect URI above
   - Authorized JavaScript origins: leave empty — this flow is a server-side redirect, no browser JS ever talks to Google directly
5. Note the **Client ID** and **Client secret** — you'll set these as Supabase secrets next.

**Cloud Assist shortcut** — paste this into Cloud Assist in the console (with the right project selected) to do steps 2–4 in one go:

```
Enable the Google Health API for this project.

Then configure the OAuth consent screen: set User Type to External, keep
Publishing status as Testing, and add <your-google-account-email> as a test
user.

On the OAuth consent screen's Data Access tab, add the scopes for Google
Health nutrition write access and activity/fitness read access — list the
exact scope strings available once the API is enabled.

Then create a new OAuth 2.0 Client ID under Credentials: Application type
"Web application", name it "Hekbot", and set this as the only Authorized
redirect URI:
https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-callback
Leave Authorized JavaScript origins empty.

When done, show me the resulting Client ID and Client secret, and list the
exact scope strings you added.
```

**Expect an "unverified app" warning** when you actually run the consent flow
in step 3 below — Health scopes are sensitive and this app isn't verified.
As the test user, click **Advanced → Go to Hekbot (unsafe)** to continue.
That's expected for single-user testing, not a misconfiguration.

## 2. Deploy the auth functions and set secrets

```bash
supabase link --project-ref udjuqvfihznaztolihjq

supabase functions deploy google-auth-start
supabase functions deploy google-auth-callback

supabase secrets set GOOGLE_CLIENT_ID="<client id from step 1>"
supabase secrets set GOOGLE_CLIENT_SECRET="<client secret from step 1>"
supabase secrets set GOOGLE_REDIRECT_URI="https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-callback"
```

The `GOOGLE_REDIRECT_URI` value here must match the redirect URI registered
on the OAuth client in step 1 exactly — Google rejects the exchange otherwise.

## 3. Run the one-time consent flow

Open in a browser, signed in as the test user you added:

```
https://udjuqvfihznaztolihjq.supabase.co/functions/v1/google-auth-start
```

Approve the consent screen (clicking past the unverified-app warning if it
appears). Google redirects to `google-auth-callback`, which prints a refresh
token as plain text — it's shown once and not stored anywhere. Copy it and
set it as the last secret:

```bash
supabase secrets set GOOGLE_REFRESH_TOKEN="<refresh token from the callback page>"
```

If the callback page says no refresh token came back, Google only issues one
on the *first* consent per account. Revoke prior access at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions)
and repeat this step — `google-auth-start` already forces `prompt=consent`.

## Done

Four secrets now exist in Supabase: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`.
`supabase/functions/_shared/googleHealth.ts` exchanges the refresh token for a
short-lived access token on each call — the Phase 1 nutrition-write and
exercise-read functions import it rather than repeating the token exchange.
