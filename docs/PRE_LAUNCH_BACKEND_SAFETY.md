# Kaam Karo Pre-Launch Backend Safety Checklist

This repo currently contains the static investor prototype. Before real users, Supabase, and Razorpay go live, keep backend work separate from `kaam-karo-app/index.html` and implement the checks below in server-side code/API routes.

Backend implementation reference files:

- `backend/supabase_schema.sql`
- `backend/fraud_scam_protection.md`
- `backend/README.md`

Do not redesign screens from backend files. The current app remains the visual and UX source of truth.

## Environments

- Create `development` and `production` environments.
- Keep secrets in environment variables only:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SERVICE_ROLE_KEY` server only
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_SECRET` server only
- Never expose `SERVICE_ROLE_KEY` or `RAZORPAY_SECRET` in frontend code.

## Supabase Auth And Data

- Phone OTP should map one phone number to one user account.
- On login, check existing `users.phone_number`; create only when missing.
- One user can have worker and employer profiles.
- `localStorage` is only acceptable for temporary UI preferences such as selected language. Do not use it as the production database for profiles, jobs, applications, chats, payments, reports, moderation logs, favourites, hired status, or ratings.
- Profile photos must upload to Supabase Storage, then save `photo_url` and `photo_verified` on `worker_profiles`.

Minimum tables:

- `users`: one account per phone number, with worker/employer role flags.
- `worker_profiles`: worker location, skills, availability, photo, trust score, ratings.
- `employer_profiles`: business identity, location, trust badge, ratings, hire counts.
- `jobs`: location, salary, status, boost, expiry, repost and risk fields.
- `applications`: applied, matched, hired, rejected, withdrawn, disconnected lifecycle fields.
- `chats` and `messages`: lifecycle, favourites, delivery status, blocked message fields.
- `payments`, `notifications`, `reports`, `moderation_logs`, `ratings`, `audit_logs`.

Use `backend/supabase_schema.sql` as the working schema draft.

## RLS Rules

Enable Row Level Security on every user-related table.

- Users can read/update only their own profile.
- Workers can manage only their own applications.
- Employers can read applicants only for their own jobs.
- Users can access only chats they belong to.
- Payment records are visible only to owner/admin.

## Marketplace Integrity

- Jobs must always have a real employer/business profile.
- Prevent duplicate applications with a unique constraint on `(job_id, worker_id)`.
- Application flow should be server-validated:
  - `applied -> matched/hired/rejected/withdrawn/disconnected`
- Do not allow frontend-only status changes for accepting applicants or creating chats.

## Fraud And Scam Protection

- Scan job title, description, salary, business name, location and contact instructions before publishing.
- Block high-risk illegal content.
- Send medium-risk jobs/messages to admin review.
- Store editable banned word rules in `banned_words`.
- Store reports in `reports`.
- Store filter/admin actions in `moderation_logs`.
- Store legal/debug trace in `audit_logs`.
- If a job receives 3 reports, hide it temporarily and send it to admin review.
- If an employer receives 5 serious reports, suspend posting until admin review.

Use `backend/fraud_scam_protection.md` for the detailed rule set.

## Razorpay

Frontend must never decide payment success.

Correct flow:

1. Frontend asks backend to create a Razorpay order.
2. Backend creates order using `RAZORPAY_SECRET`.
3. User pays through Razorpay checkout.
4. Frontend sends `payment_id`, `order_id`, and `signature` back to backend.
5. Backend verifies signature.
6. Only after verification, mark payment `success` and job `boosted`.

## Notifications

Start with in-app notifications:

- `application_sent`
- `application_accepted`
- `new_message`

Store notifications in database first. Push can come later.

## Validation And Errors

Validate on both frontend and backend:

- Phone number: 10 digits
- Required fields: non-empty
- Job description: 15+ words
- Payment/session user: must match server-side auth

Frontend should show safe messages like:

> Something went wrong. Please try again.

Backend should log the real error without exposing raw database/server details to users.

## Launch Test

- Worker: signup -> onboarding -> swipe -> apply -> chat
- Employer: setup -> post job -> receive applicant -> accept -> chat
- Payment: test payment -> signature verify -> boost
- Logout/login: same phone returns the same account and data persists
