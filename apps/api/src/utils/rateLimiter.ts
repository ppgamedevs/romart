import { FastifyPluginAsync } from "fastify"

interface RateLimiterOptions {
  windowMs: number
  max: number
  keyGenerator?: (request: any) => string
}

export function createRateLimiter(name: string, max: number, windowMs: number) {
  const store = new Map<string, { count: number; resetTime: number }>()

  return async (request: any, reply: any) => {
    const key = `${name}:${request.ip}`
    const now = Date.now()

    // Clean up expired entries
    for (const [k, v] of store.entries()) {
      if (now > v.resetTime) {
        store.delete(k)
      }
    }

    const current = store.get(key)
    
    if (!current) {
      store.set(key, { count: 1, resetTime: now + windowMs * 1000 })
      return
    }

    if (now > current.resetTime) {
      store.set(key, { count: 1, resetTime: now + windowMs * 1000 })
      return
    }

    if (current.count >= max) {
      return reply.status(429).send({ 
        error: "Too many requests", 
        retryAfter: Math.ceil((current.resetTime - now) / 1000) 
      })
    }

    current.count++
  }
}
