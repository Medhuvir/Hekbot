# Google Health integration — one-time OAuth setup

Step 1 of the build plan. This gets a refresh token stored in Supabase so the
Phase 1 edge functions (nutrition write, exercise read) can call the Google
Health API on your behalf. Everything stays cloud-hosted — no local machine
involved at any point.

## 1. Google Cloud project + OAuth client

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new project (or pick an existing one).
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Publishing status: **Testing** (keeps this out of Google's security review — testing mode covers up to 100 users)
   - Under **Test users**, add your own Google account
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URI: the deployed `google-auth-callback` function URL (see step 2 below for the exact form)
4. Note the **Client ID** and **Client secret** — you'll set these as Supabase secrets next.
5. Confirm the scopes below are enabled for the client against the current Google Health API scope list before continuing — the plan calls for `nutrition.writeonly` and `activity_and_fitness.readonly`.

## 2. Deploy the auth functions and set secrets

```bash
supabase functions deploy google-auth-start
supabase functions deploy google-auth-callback

supabase secrets set GOOGLE_CLIENT_ID="<client id from step 1>"
supabase secrets set GOOGLE_CLIENT_SECRET="<client secret from step 1>"
supabase secrets set GOOGLE_REDIRECT_URI="https://<project-ref>.supabase.co/functions/v1/google-auth-callback"
```

Use that same `GOOGLE_REDIRECT_URI` value as the redirect URI registered on the
OAuth client in step 1 — Google rejects the exchange if they don't match
exactly.

## 3. Run the one-time consent flow

Open in a browser, signed in as the test user you added:

```
https://<project-ref>.supabase.co/functions/v1/google-auth-start
```

Approve the consent screen. Google redirects to `google-auth-callback`, which
prints a refresh token as plain text — it's shown once and not stored
anywhere. Copy it and set it as the last secret:

```bash
supabase secrets set GOOGLE_REFRESH_TOKEN="<refresh token from the callback page>"
```

If the callback page says no refresh token came back, Google only issues one
on the *first* consent per account. Revoke prior access at
[myaccount.google.com/permissions](https://myaccount.google.com/permissions)
and repeat this step — `google-auth-start` already forces `prompt=consent`.

## Done

Three secrets now exist: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REFRESH_TOKEN` (plus `GOOGLE_REDIRECT_URI`, used only by the auth
functions themselves). `supabase/functions/_shared/googleHealth.ts` exchanges
the refresh token for a short-lived access token on each call — the Phase 1
nutrition-write and exercise-read functions import it rather than repeating
the token exchange.
