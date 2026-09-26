import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { env, isProd } from "./env";
import { sendEmail } from "./email";
import { site } from "./site";

const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

function trustedOrigins() {
  const origins = new Set<string>();
  const add = (url: string) => {
    const trimmed = url.trim().replace(/\/$/, "");
    if (trimmed) origins.add(trimmed);
  };

  add(env.BETTER_AUTH_URL);
  add(site.url);
  for (const extra of env.TRUSTED_ORIGINS.split(",")) add(extra);

  if (!isProd) {
    for (const host of ["localhost", "127.0.0.1"]) {
      for (let port = 3000; port <= 3010; port++) add(`http://${host}:${port}`);
    }
  }

  return Array.from(origins);
}

export const auth = betterAuth({
  appName: "Wood & Wonders",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: trustedOrigins(),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
    // Turn on once RESEND_API_KEY is configured in production.
    requireEmailVerification: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail(
        user.email,
        "Reset your Wood & Wonders password",
        `Hi ${user.name},\n\nReset your password using this link (valid for 1 hour):\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
      );
    },
  },
  socialProviders: googleEnabled
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {},
  user: {
    additionalFields: {
      // input:false → a client can never set its own role at signup or update.
      role: { type: "string", defaultValue: "customer", input: false },
      phone: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  advanced: {
    useSecureCookies: isProd,
    database: { generateId: () => crypto.randomUUID() },
    ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 5 },
      "/request-password-reset": { window: 60 * 10, max: 3 },
      "/reset-password": { window: 60 * 10, max: 5 },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export const isGoogleEnabled = googleEnabled;
