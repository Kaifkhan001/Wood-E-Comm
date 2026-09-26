import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";
import { env, isProd } from "./env";

type Limiter = { limit: (key: string) => Promise<{ success: boolean }> };

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({ url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN })
    : null;

if (!redis && isProd) {
  console.warn("Upstash not configured: falling back to per-instance memory rate limiting.");
}

// In-memory fallback for local development (not shared across serverless instances).
function memoryLimiter(max: number, windowMs: number): Limiter {
  const hits = new Map<string, number[]>();
  return {
    async limit(key) {
      const now = Date.now();
      const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      arr.push(now);
      hits.set(key, arr);
      if (hits.size > 5000) hits.clear();
      return { success: arr.length <= max };
    },
  };
}

function make(prefix: string, max: number, window: `${number} ${"s" | "m" | "h"}`, windowMs: number): Limiter {
  return redis
    ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, window), prefix: `rl:${prefix}` })
    : memoryLimiter(max, windowMs);
}

export const limiters = {
  form: make("form", 5, "10 m", 10 * 60_000), // quote, contact, popup
  order: make("order", 5, "1 h", 60 * 60_000),
  upload: make("upload", 60, "10 m", 10 * 60_000),
};

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

export async function checkLimit(limiter: Limiter, key?: string) {
  const id = key ?? (await clientIp());
  const { success } = await limiter.limit(id);
  return success;
}
