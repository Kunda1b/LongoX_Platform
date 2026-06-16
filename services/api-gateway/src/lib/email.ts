export async function sendInvitationEmail(
  to: string,
  inviterName: string,
  workspaceName: string,
  roleName: string,
  token: string,
): Promise<void> {
  const acceptUrl = `${getFrontendUrl()}/invitations/accept?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[Invitation] No RESEND_API_KEY set. Invitation link for ${to}: ${acceptUrl}`,
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;">You've been invited</h2>
    <p style="color:#6b7280;margin:0 0 8px;"><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on LongoX as a <strong>${roleName}</strong>.</p>
    <p style="color:#6b7280;margin:0 0 24px;">Click the button below to accept the invitation and get started.</p>
    <a href="${acceptUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;font-size:14px;">Accept invitation</a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore this email.</p>
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
      subject: `${inviterName} invited you to ${workspaceName} on LongoX`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Invitation] Resend error ${res.status}: ${body}`);
  }
}

function getFrontendUrl(): string {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, "");
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const resetUrl = `${getFrontendUrl()}/reset-password?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[Password Reset] No RESEND_API_KEY set. Reset link for ${to}: ${resetUrl}`,
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
    <h2 style="margin:0 0 8px;font-size:20px;font-weight:600;">Reset your password</h2>
    <p style="color:#6b7280;margin:0 0 24px;">Hi ${name}, click the button below to set a new password for your account.</p>
    <a href="${resetUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:500;font-size:14px;">Reset password</a>
    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
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
      subject: "Reset your LongoX password",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[Password Reset] Resend error ${res.status}: ${body}`);
  }
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
