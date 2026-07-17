import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true for 465, false for 587
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  return transporter;
}

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${env.MOBILE_RESET_URL}?token=${encodeURIComponent(token)}`;
  const mailer = getTransporter();

  if (!mailer) {
    console.log(`[Journal IQ] Password reset for ${email}: ${resetUrl}`);
    console.log(
      "[Journal IQ] Tip: set SMTP_HOST, SMTP_USER, SMTP_PASS (Gmail App Password) in apps/backend/.env to send real email."
    );
    return { delivered: false as const, mode: "console" as const };
  }

  const mail = {
    from: env.EMAIL_FROM,
    to: email,
    subject: "Reset your Journal IQ password",
    html: buildResetEmailHtml(resetUrl),
    text: [
      "Reset your Journal IQ password",
      "",
      "We received a request to reset your password.",
      `Open this link on your phone (with Journal IQ installed): ${resetUrl}`,
      "",
      "This link expires in 1 hour. If you didn't request this, you can ignore this email.",
    ].join("\n"),
  };

  let lastError: string | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const info = await mailer.sendMail(mail);
      console.log(
        `[Journal IQ] Reset email sent to ${email} via SMTP (id=${info.messageId || "ok"})`
      );
      return { delivered: true as const, mode: "smtp" as const, id: info.messageId };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[Journal IQ] SMTP error (attempt ${attempt}):`, lastError);
      if (attempt < 2) await sleep(800);
    }
  }

  if (env.NODE_ENV !== "production") {
    console.log(
      `[Journal IQ] SMTP failed — using console fallback for ${email}: ${resetUrl}`
    );
    return { delivered: false as const, mode: "console" as const };
  }

  throw new Error(lastError || "Failed to send reset email");
}

function buildResetEmailHtml(resetUrl: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your Journal IQ password</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Georgia,'Times New Roman',serif;color:#0b1a33;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6ebf2;">
          <tr>
            <td style="background:#01122F;padding:28px 28px 24px;">
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#C4E562;">Journal IQ</p>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;font-weight:600;color:#FEFEFE;">Reset your password</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#334155;">
                We received a request to reset the password for your Journal IQ account.
              </p>
              <p style="margin:0 0 24px;font-size:16px;line-height:1.55;color:#334155;">
                Tap the button below on your phone. Journal IQ must be installed so the secure link can open in the app.
              </p>
              <p style="margin:0 0 28px;text-align:center;">
                <a href="${resetUrl}" style="display:inline-block;background:#C4E562;color:#01122F;text-decoration:none;font-family:system-ui,-apple-system,sans-serif;font-weight:600;font-size:15px;padding:14px 22px;border-radius:999px;">
                  Reset password
                </a>
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;color:#64748b;font-family:system-ui,-apple-system,sans-serif;">
                This link expires in <strong>1 hour</strong>. If you didn’t request a reset, you can ignore this email — your password stays the same.
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif;word-break:break-all;">
                If the button doesn’t work, copy this link into your phone:<br />${resetUrl}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
