/**
 * Simple in-memory cache for API responses
 * Reduces unnecessary network requests
 */

class Cache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.ttl = ttl
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  get(key) {
    const item = this.cache.get(key)
    if (!item) return null

    const age = Date.now() - item.timestamp
    if (age > this.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.value
  }

  has(key) {
    const item = this.cache.get(key)
    if (!item) return false

    const age = Date.now() - item.timestamp
    if (age > this.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  clear() {
    this.cache.clear()
  }

  delete(key) {
    this.cache.delete(key)
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Global cache instance
export const apiCache = new Cache(5 * 60 * 1000) // 5 minutes

// Cleanup expired entries every minute
setInterval(() => apiCache.cleanup(), 60 * 1000)

export default Cache
