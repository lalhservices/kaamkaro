# Kaam Karo Backend Package

This folder is backend-only reference material for the production build.

Do not use these files to redesign the current prototype UI. The live prototype remains the visual and UX source of truth.

## Files

- `supabase_schema.sql`  
  MVP production schema, indexes, unique constraints, storage buckets, and starter RLS policies.

- `fraud_scam_protection.md`  
  Safety rules for job posts, chat messages, reports, trust scores, admin review, and auto actions.

- `supabase_rls_fix.sql`  
  One-time patch for an already-created project if Supabase reports RLS recursion on profile tables.

## Implementation Order

1. Create Supabase project and run `supabase_schema.sql` in development.
2. Connect phone OTP auth.
3. Save real `users`, `worker_profiles`, and `employer_profiles`.
4. Move photo uploads to Supabase Storage.
5. Move jobs, applications, chats, reports, ratings, notifications, and payments to real tables.
6. Add backend API routes for sensitive actions.
7. Add Razorpay verification last.

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

For local prototype testing only, the app falls back to a local dev OTP (`123456`) when opened from `file://`, `localhost`, or `127.0.0.1` and Supabase reports that the phone provider is not ready. This does not create a real Supabase Auth session and must not be treated as production login.

## Important

- Keep secrets out of frontend code.
- Use service role only in server/API routes.
- Enable RLS before testing with real users.
- Frontend localStorage is only for temporary UI preferences such as language.
