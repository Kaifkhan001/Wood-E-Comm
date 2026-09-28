import "server-only";
import { env, isProd } from "./env";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

/** Sends transactional email through Resend's HTTP API. Never throws. */
export async function sendEmail({ to, subject, text, html, replyTo }: SendEmailInput): Promise<boolean> {
  if (!env.RESEND_API_KEY) {
    if (!isProd) console.info(`[email:dev] to=${to} subject=${subject}\n${text}`);
    else console.error("RESEND_API_KEY missing; email not sent");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      console.error("Email send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("Email send threw", e);
    return false;
  }
}

export async function notifyOwner(input: Omit<SendEmailInput, "to">): Promise<boolean> {
  if (!env.OWNER_NOTIFY_EMAIL) return false;
  return sendEmail({ to: env.OWNER_NOTIFY_EMAIL, ...input });
}

/** Escapes user-supplied text before it's interpolated into HTML. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = { bottle: "#1f3a32", paper: "#f6f6f2", ink: "#211f1b", brass: "#a9822f", muted: "#6b6a63" };

/** Wraps a body in a simple branded layout, with an optional call-to-action button. */
export function emailShell({ preheader, bodyHtml, ctaLabel, ctaUrl }: { preheader?: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.paper};font-family:Georgia,'Times New Roman',serif;color:${BRAND.ink};">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.paper};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr><td style="background:${BRAND.bottle};padding:20px 28px;"><span style="color:${BRAND.paper};font-size:20px;">Wood &amp; Wonders</span></td></tr>
            <tr><td style="padding:28px;font-size:15px;line-height:1.6;">
              ${bodyHtml}
              ${ctaLabel && ctaUrl ? `<p style="margin:28px 0 0;"><a href="${ctaUrl}" style="display:inline-block;background:${BRAND.bottle};color:${BRAND.paper};text-decoration:none;padding:12px 22px;border-radius:999px;font-size:14px;">${escapeHtml(ctaLabel)}</a></p>` : ""}
            </td></tr>
            <tr><td style="padding:16px 28px;border-top:1px solid #eee;font-size:12px;color:${BRAND.muted};">Wood &amp; Wonders</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const IST_FORMATTER = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
export const formatIST = (d: Date) => `${IST_FORMATTER.format(d)} IST`;

/** wa.me link to a customer's number, encoded the same way as the storefront's whatsappLink(). */
export function customerWhatsappLink(phone: string, message: string) {
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}
