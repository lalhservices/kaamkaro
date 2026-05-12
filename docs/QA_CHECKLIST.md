# Kaam Karo QA Checklist

Run before every Vercel deploy. This is a safety net for loopholes, not a redesign checklist.

## Commands

1. Install QA dependencies once:

```bash
npm install
npm run qa:install
```

2. Run full automated QA:

```bash
npm run qa
```

3. Regenerate responsive screenshots:

```bash
npm run qa:screenshots
```

Screenshots are saved in `qa-screenshots/`.

## Manual Review Gates

- No logged-out access to worker/employer protected screens.
- No bottom nav on public/login/legal screens.
- Worker mode cannot reach employer dashboard/post job/applicants unless business setup exists.
- Employer mode cannot reach worker job feed/applications unless worker setup exists.
- No horizontal scroll at 320, 360, 375, 390, 414, or 430 px.
- English and Hindi render without broken characters.
- Worker flow still works: login -> setup -> swipe -> apply -> applications -> chat.
- Employer flow still works: login -> setup -> post job -> applicants -> accept -> chat -> hired.
- Empty forms and invalid data show clean errors.
- Banned/scam words are blocked or sent to review.
- No uncaught browser errors or console errors during tests.

## Known Launch Rule

`devBypassOtp` is enabled only for prototype testing while SMS OTP is not configured. Turn it off before production OTP testing.
