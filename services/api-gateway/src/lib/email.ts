function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const verifyUrl = `${getFrontendUrl()}/verify-email/confirm?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[Email Verification] No RESEND_API_KEY set. Verification link for ${to}: ${verifyUrl}`,
    );
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:32px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;border:1px solid #e5e7eb;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:36px;height:36px;background:#111;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;">LX</div>
      <span style="font-size:18px;font-weight:600;">LongoX</span>
    </div>
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;">Verify your email</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${name}, click the button below to confirm your email address and activate your account.</p>
    <a href="${verifyUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;font-size:14px;">Verify email address</a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">This link expires in 24 hours. If you didn't create a LongoX account, you can ignore this email.</p>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: "LongoX <noreply@longox.io>",
      to,
      subject: "Verify your email address",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Email Verification] Resend error ${res.status}: ${body}`);
  }
}
