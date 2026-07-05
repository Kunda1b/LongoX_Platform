---
name: Resend from address — domain verification
description: Using an unverified sending domain in Resend returns 403. Default to onboarding@resend.dev which requires no domain setup.
---

# Resend from address — domain verification

**Rule:** Never hardcode a custom domain in the `from` field of a Resend email unless that domain is verified in the Resend dashboard. Use `onboarding@resend.dev` as the default (works on all free Resend accounts with no setup) and let operators override via `RESEND_FROM_EMAIL`.

**Why:** Resend validates the sending domain on every send. An unverified domain returns `403 validation_error` — the error is only logged server-side, so users never see it and emails silently vanish.

**How to apply:**

```ts
from: process.env.RESEND_FROM_EMAIL ?? "LongoX <onboarding@resend.dev>",
```

- `RESEND_FROM_EMAIL` should be set to `"Brand <noreply@yourdomain.com>"` only after verifying the domain at https://resend.com/domains.
- `onboarding@resend.dev` can only send to the Resend account owner's email in test mode; for production use a verified domain.
