// src/lib/rate-limit.ts

type RateLimitInfo = {
  count: number;
  resetTime: number;
};

// Use global to preserve across hot reloads in dev
const globalRateLimit = globalThis as unknown as {
  __rateLimitMap?: Map<string, RateLimitInfo>;
};

const rateLimitMap = globalRateLimit.__rateLimitMap || new Map<string, RateLimitInfo>();
if (process.env.NODE_ENV !== "production") {
  globalRateLimit.__rateLimitMap = rateLimitMap;
}

export function checkRateLimit(
  ip: string,
  limit = 100, // requests
  windowMs = 60 * 1000 // 1 minute
): { success: boolean; limit: number; remaining: number; reset: number } {
  const now = Date.now();
  let info = rateLimitMap.get(ip);

  // If time has passed, reset
  if (!info || now > info.resetTime) {
    info = { count: 0, resetTime: now + windowMs };
  }

  info.count += 1;
  rateLimitMap.set(ip, info);

  const remaining = Math.max(0, limit - info.count);
  
  return {
    success: info.count <= limit,
    limit,
    remaining,
    reset: info.resetTime,
  };
}