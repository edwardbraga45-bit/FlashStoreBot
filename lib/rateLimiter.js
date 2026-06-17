class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 10000;
    this.max = options.max || 5;
    this.hits = new Map();
  }

  isAllowed(key) {
    const now = Date.now();
    const arr = (this.hits.get(key) || []).filter(t => now - t <= this.windowMs);
    return { allowed: arr.length < this.max, count: arr.length };
  }

  record(key) {
    const now = Date.now();
    const arr = (this.hits.get(key) || []).filter(t => now - t <= this.windowMs);
    arr.push(now);
    this.hits.set(key, arr);
  }

  reset(key) {
    this.hits.delete(key);
  }
}

module.exports = RateLimiter;
