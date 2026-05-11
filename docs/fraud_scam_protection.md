# Kaam Karo Fraud And Scam Protection System

Goal: protect workers and employers before public launch without changing the current app flow or UI.

## Job Post Safety Check

Before any job goes live, scan:

- Job title
- Description
- Salary text
- Business/company name
- Location
- Contact instructions

Send job to `pending_review` when it contains:

- Fake or unrealistic salary claims
- Asking money to apply or join
- Adult, sexual, escort, or prostitution services
- Drugs or narcotics
- Weapons or explosives
- Illegal work, gambling, money laundering, fake documents
- Child labour or forced labour
- Misleading title or vague description
- Repeated same title/salary/description spam
- Copied job description patterns
- Suspicious phone/email/WhatsApp-only instructions

High-risk content should be blocked or rejected immediately. Medium-risk content should go to admin review.

## Banned Word Filter

Store editable rules in `banned_words`.

Examples:

- registration fee
- joining fee
- security deposit
- pay first
- send money
- drugs
- weapons
- adult service
- escort
- illegal work
- gambling
- fake documents
- harassment
- abuse

Severity:

- `high`: block content and save moderation log
- `medium`: send to admin review
- `low`: warn user or increase risk score

Do not show banned word lists publicly.

## Repeated Fake Job Detection

Track:

- Same employer posting the same title repeatedly
- Same salary plus same description
- Same phone number across many accounts
- Too many jobs posted too quickly
- Many reports on one employer
- Payment/refund disputes

Actions:

- Rate limit posting
- Force manual review
- Temporarily hide risky jobs
- Suspend posting after repeated serious abuse
- Ban only after admin review

## Employer Trust Score

Inputs:

- Phone verified
- Business profile complete
- Account age
- Jobs posted
- Reports count
- Accepted applicants
- Hires completed
- Rating average
- Payment/refund history

Badges:

- `New Employer`
- `Active Employer`
- `Trusted Employer`
- `Flagged Employer`

Only show simple badges in UI. Keep internal score private.

## Worker Trust Score

Inputs:

- Phone verified
- Photo verified
- Profile complete
- Applications count
- Chat response behavior
- Reports received
- Hired/completed jobs
- Ratings

Badges:

- `Phone Verified`
- `Photo Verified`
- `Active Worker`
- `Trusted Worker`

## Report System

Every job and chat must support Report.

Reasons:

- Fake job
- Asking for money
- Wrong salary
- Unsafe work
- Harassment
- Sexual content
- Illegal work
- Scam/payment request
- Abusive language
- Other

After report:

- Save to `reports`
- Increase risk score
- If serious, pause job/chat
- Send to admin review
- Save final action in `reports.action_taken`

## Chat Safety Filter

Before sending a message, scan for:

- Payment request
- Bank details pressure
- Sexual language
- Drugs/weapons
- Threats
- Harassment
- Illegal work
- Abuse/hate speech

If detected:

- Block the message
- Show safe warning to user
- Save `moderation_logs`
- After 3 blocked attempts, restrict account or send user to admin review

## Money Safety Banners

Worker side:

> Never pay money to get a job. Report suspicious messages.

Employer side:

> Never pay money upfront to hire someone. Report suspicious messages.

Show on:

- Job details
- Chat screen
- Application screen

## Job Confirmation Checkbox

Before publishing:

> I confirm this job is genuine and follows Kaam Karo's posting rules.

If unchecked, do not publish.

## Minimum Admin Panel

Admin must be able to:

- View flagged jobs
- Approve/reject jobs
- View reports
- Suspend users
- Ban users
- Remove jobs
- View moderation logs
- View repeated posts
- View payment disputes

## Auto Action Rules

- Job gets 3 reports: temporarily hide job and send to admin review
- Employer gets 5 serious reports: suspend posting
- Chat has serious illegal content: disconnect chat
- User repeats unsafe behavior: restrict account and escalate to admin

## Final Rule

Do not rely only on users reporting. Use auto filters, risk score, admin review, report system, and account limits together.
