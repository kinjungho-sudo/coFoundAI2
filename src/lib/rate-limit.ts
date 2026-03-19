/**
 * Rate Limiting — 메모리 기반 (Upstash Redis 키 미설정 시 폴백)
 * 분당 10회 제한
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// 서버 메모리 내 임시 스토어 (단일 인스턴스 / 개발 환경용)
const store = new Map<string, RateLimitEntry>();

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // 초
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  // Upstash Redis가 설정된 경우 Redis 사용
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkRateLimitRedis(userId);
  }

  // 폴백: 메모리 기반
  return checkRateLimitMemory(userId);
}

async function checkRateLimitRedis(userId: string): Promise<RateLimitResult> {
  const key = `rl:user:${userId}`;
  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  try {
    // INCR
    const incrRes = await fetch(`${url}/incr/${key}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const incrData = await incrRes.json();
    const count: number = incrData.result;

    if (count === 1) {
      // 첫 요청 — TTL 설정
      await fetch(`${url}/expire/${key}/${WINDOW_SECONDS}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    if (count > MAX_REQUESTS) {
      // 남은 TTL 조회
      const ttlRes = await fetch(`${url}/ttl/${key}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ttlData = await ttlRes.json();
      return { allowed: false, remaining: 0, retryAfter: ttlData.result };
    }

    return { allowed: true, remaining: MAX_REQUESTS - count };
  } catch {
    // Redis 오류 시 허용 (fail-open)
    return { allowed: true, remaining: MAX_REQUESTS };
  }
}

function checkRateLimitMemory(userId: string): RateLimitResult {
  const now = Date.now();
  const entry = store.get(userId);

  if (!entry || now >= entry.resetAt) {
    store.set(userId, { count: 1, resetAt: now + WINDOW_SECONDS * 1000 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count };
}
