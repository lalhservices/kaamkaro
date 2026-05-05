# Kaam Karo Pre-Launch Backend Safety Checklist

This repo currently contains the static investor prototype. Before real users, Supabase, and Razorpay go live, keep backend work separate from `kaam-karo-app/index.html` and implement the checks below in server-side code/API routes.

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

- `users`: `id`, `phone_number`, `role`, `created_at`, `updated_at`
- `worker_profiles`: `user_id`, `name`, `city`, `job_type`, `skills`, `availability`, `photo_url`, `photo_verified`
- `employer_profiles`: `user_id`, `business_name`, `city`
- `jobs`: `id`, `employer_id`, `title`, `description`, `salary`, `location`, `is_remote`, `created_at`
- `applications`: `id`, `job_id`, `worker_id`, `status`, `created_at`
- `conversations`, `messages`, `payments`, `notifications`, `reports`, `moderation_logs`, `ratings`

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
  - `pending -> accepted/rejected -> completed`
- Do not allow frontend-only status changes for accepting applicants or creating chats.

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
