import "server-only";
import { z } from "zod";

// Validates server secrets at boot so misconfiguration fails loudly and early.
const schema = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  UPSTASH_REDIS_REST_URL: z.string().optional().default(""),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional().default(""),
  TURNSTILE_SECRET_KEY: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().optional().default("Wood & Wonders <onboarding@resend.dev>"),
  OWNER_NOTIFY_EMAIL: z.string().optional().default(""),
  TRUSTED_ORIGINS: z
    .string()
    .optional()
    .default("")
    .refine(
      (v) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .every((s) => /^https?:\/\/[^/]+$/.test(s)),
      "TRUSTED_ORIGINS must be a comma-separated list of http(s)://host[:port] origins"
    ),
});

export const env = schema.parse(process.env);
export const isProd = process.env.NODE_ENV === "production";
