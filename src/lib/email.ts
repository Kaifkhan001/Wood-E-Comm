import "server-only";
import { env, isProd } from "./env";

/** Sends transactional email through Resend's HTTP API. */
export async function sendEmail(to: string, subject: string, text: string) {
  if (!env.RESEND_API_KEY) {
    if (!isProd) console.info(`[email:dev] to=${to} subject=${subject}\n${text}`);
    else console.error("RESEND_API_KEY missing; email not sent");
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, text }),
  });
  if (!res.ok) console.error("Email send failed", res.status);
}

export async function notifyOwner(subject: string, text: string) {
  if (env.OWNER_NOTIFY_EMAIL) await sendEmail(env.OWNER_NOTIFY_EMAIL, subject, text);
}
