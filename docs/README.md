# Kaam Karo Backend Package

This folder is backend-only reference material for the production build.

Do not use these files to redesign the current prototype UI. The live prototype remains the visual and UX source of truth.

## Files

- `supabase_schema.sql`  
  MVP production schema, indexes, unique constraints, storage buckets, and starter RLS policies.

- `server.js`  
  Railway-ready backend shell with health check and backend-only Razorpay create/verify payment endpoints.

- `.env.example`  
  Server-only environment variable template. Never copy service role or Razorpay secret into frontend files.

- `fraud_scam_protection.md`  
  Safety rules for job posts, chat messages, reports, trust scores, admin review, and auto actions.

- `supabase_rls_fix.sql`  
  One-time patch for an already-created project if Supabase reports RLS recursion on profile tables.

- `supabase_rls_hardening.sql`  
  One-time patch for an already-created project to safely support public employer profile views, employer applicant profile views, participant-only chats/messages, and recursion-safe RLS helper functions.

## Implementation Order

1. Create Supabase project and run `supabase_schema.sql` in development.
2. Connect phone OTP auth.
3. Save real `users`, `worker_profiles`, and `employer_profiles`.
4. Move photo uploads to Supabase Storage.
5. Move jobs, applications, chats, reports, ratings, notifications, and payments to real tables.
6. Add backend API routes for sensitive actions.
7. Add Razorpay verification last.

If the first schema has already been executed, run `supabase_rls_hardening.sql` once in the Supabase SQL Editor before testing real applications/chat. This patch keeps private writes locked down while allowing the public/profile reads required by the app flow.

## Frontend Supabase Config

The prototype now reads Supabase config from any of these places:

1. `window.KAAM_KARO_SUPABASE`
2. `<meta name="supabase-url">` and `<meta name="supabase-anon-key">`
3. Local browser storage keys:
   - `kkSupabaseUrl`
   - `kkSupabaseAnonKey`

Use `kaam-karo-app/js/supabase.config.example.js` as the shape reference. Only the Supabase anon key belongs in the browser. Never put `SERVICE_ROLE_KEY` in `index.html`, frontend JS, Vercel public env, or localStorage.

## Phone OTP Setup

For real Supabase phone login:

1. Enable Phone Auth in Supabase Authentication providers.
2. Configure an SMS provider such as Twilio, MessageBird, Vonage, or Textlocal.
3. Use a real supported phone number for live testing. Placeholder numbers such as `0000000000` will not receive OTP.
4. Supabase phone OTP uses a 6 digit code by default; the app now accepts 6 digits for real Supabase auth.

If Supabase returns `unsupported phone number`, it is usually an Auth/SMS provider setup issue or a test/placeholder number, not a database schema issue.

For prototype testing only, `kaam-karo-app/js/supabase.config.js` enables `devBypassOtp` on local `file://`, `localhost`, and `127.0.0.1` runs so UI and flow testing can continue while the SMS provider is not configured. This does not create a real Supabase Auth session and must not be enabled on production domains.

To force real Supabase OTP while testing locally after SMS is configured, use either:

```js
localStorage.setItem("kkForceRealOtp", "true")
```

or open the app with:

```text
?realOtp=1
```

Remove `kkForceRealOtp` to return to local prototype bypass testing.

## Railway Backend

Deploy the `backend/` folder as the Railway service.

Required Railway variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_SECRET`
- `FRONTEND_ORIGIN`

Start command:

```bash
npm start
```

Health check:

```text
GET /health
```

## Important

- Keep secrets out of frontend code.
- Use service role only in server/API routes.
- Enable RLS before testing with real users.
- Frontend localStorage is only for temporary UI preferences such as language.
