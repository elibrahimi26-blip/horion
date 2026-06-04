import { headers } from "next/headers";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const isConfigured = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = isConfigured
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export type RateLimitResult = {
  success: boolean;
  retryAfterSec: number;
};

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, max: number, windowSec: number): Ratelimit | null {
  if (!redis) return null;
  const key = `${name}:${max}:${windowSec}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, `${windowSec} s`),
      prefix: `horion:rl:${name}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export function getClientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function checkRateLimit(
  name: string,
  identifier: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, max, windowSec);
  if (!limiter) return { success: true, retryAfterSec: 0 };

  const result = await limiter.limit(identifier);
  const retryAfterSec = result.success
    ? 0
    : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { success: result.success, retryAfterSec };
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
  const m = Math.ceil(seconds / 60);
  return `${m} minute${m > 1 ? "s" : ""}`;
}
