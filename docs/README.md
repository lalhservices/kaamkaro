# Kaam Karo Backend Package

This folder is backend-only reference material for the production build.

Do not use these files to redesign the current prototype UI. The live prototype remains the visual and UX source of truth.

## Files

- `supabase_schema.sql`  
  MVP production schema, indexes, unique constraints, storage buckets, and starter RLS policies.

- `fraud_scam_protection.md`  
  Safety rules for job posts, chat messages, reports, trust scores, admin review, and auto actions.

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

## Important

- Keep secrets out of frontend code.
- Use service role only in server/API routes.
- Enable RLS before testing with real users.
- Frontend localStorage is only for temporary UI preferences such as language.
