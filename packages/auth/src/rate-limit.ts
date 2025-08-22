import { LRUCache } from "lru-cache"
import { env } from "@artfromromania/shared"

export interface RateLimitResult {
	ok: boolean
	remaining: number
	reset: number
}

// In-memory rate limiter using token bucket algorithm
class InMemoryRateLimiter {
	private cache: LRUCache<string, { tokens: number; lastRefill: number }>

	constructor(private limit: number, private windowSeconds: number) {
		this.cache = new LRUCache({
			max: 1000, // Max 1000 IPs
			ttl: windowSeconds * 1000
		})
	}

	async check(key: string): Promise<RateLimitResult> {
		try {
			const now = Date.now()
			const windowMs = this.windowSeconds * 1000
			const refillRate = this.limit / windowMs

			const current = this.cache.get(key) || { tokens: this.limit, lastRefill: now }
			const timePassed = now - current.lastRefill
			const tokensToAdd = timePassed * refillRate
			const newTokens = Math.min(this.limit, current.tokens + tokensToAdd)

			if (newTokens >= 1) {
				this.cache.set(key, { tokens: newTokens - 1, lastRefill: now })
				return {
					ok: true,
					remaining: Math.floor(newTokens - 1),
					reset: now + windowMs
				}
			} else {
				return {
					ok: false,
					remaining: 0,
					reset: current.lastRefill + windowMs
				}
			}
		} catch (error) {
			console.warn("Rate limiter error:", error)
			return { ok: true, remaining: 1, reset: Date.now() + 60000 }
		}
	}
}

// Upstash Redis rate limiter
class UpstashRateLimiter {
	private redis: any
	private ratelimit: any

	constructor(private limit: number, private windowSeconds: number) {
		try {
			const { Redis } = require("@upstash/redis")
			const { Ratelimit } = require("@upstash/ratelimit")

			this.redis = new Redis({
				url: env.UPSTASH_REDIS_REST_URL,
				token: env.UPSTASH_REDIS_REST_TOKEN
			})

			this.ratelimit = new Ratelimit({
				redis: this.redis,
				limiter: Ratelimit.fixedWindow(limit, `${windowSeconds}s`)
			})
		} catch (error) {
			console.warn("Failed to initialize Upstash rate limiter:", error)
			throw error
		}
	}

	async check(key: string): Promise<RateLimitResult> {
		try {
			const result = await this.ratelimit.limit(key)
			return {
				ok: result.success,
				remaining: result.remaining,
				reset: result.reset
			}
		} catch (error) {
			console.warn("Upstash rate limiter error:", error)
			return { ok: true, remaining: 1, reset: Date.now() + 60000 }
		}
	}
}

export function createRateLimiter(keyPrefix: string, limit: number, windowSeconds: number) {
	// Check if Upstash Redis is configured
	const hasUpstash = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN

	if (hasUpstash) {
		try {
			return new UpstashRateLimiter(limit, windowSeconds)
		} catch (error) {
			console.warn("Falling back to in-memory rate limiter:", error)
		}
	}

	// Fallback to in-memory rate limiter
	return new InMemoryRateLimiter(limit, windowSeconds)
}
