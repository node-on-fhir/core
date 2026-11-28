// imports/lib/rpcRateLimiter.js
// Rate-limit primitives for the ServerMethods pipeline. Plain CJS, zero Meteor
// imports, so it runs under `node --test` (npm run test:rpc-rate-limiter).
//
// Two things live here:
//
//   createRateLimiter()  fixed-window call counter keyed by an arbitrary string,
//                        with eviction so idle keys do not accumulate forever.
//   resolveClientIp()    which address to charge a call to when the server sits
//                        behind proxies.
//
// The counter is in-memory and per process. With several app instances each
// one enforces its own budget, so the effective limit is (limit x instances).
// That bounds abuse; it is not an exact global quota.

const DEFAULT_MAX_BUCKETS = 50000;
const SWEEP_EVERY_TAKES = 1000;

function createRateLimiter(options) {
  const config = options || {};
  const now = typeof config.now === 'function' ? config.now : Date.now;
  const maxBuckets = Number.isInteger(config.maxBuckets) && config.maxBuckets > 0 ? config.maxBuckets : DEFAULT_MAX_BUCKETS;

  // key -> { tokens, windowStartMs, intervalMs }. A Map keeps insertion order,
  // which the size cap uses to drop the oldest keys first.
  const buckets = new Map();
  let takesSinceSweep = 0;

  // Drop every bucket whose window has fully elapsed: it would be refilled to
  // full on its next use anyway, so forgetting it changes nothing.
  function sweep() {
    const nowMs = now();
    let removed = 0;
    buckets.forEach(function(bucket, key) {
      if (nowMs - bucket.windowStartMs >= bucket.intervalMs) {
        buckets.delete(key);
        removed++;
      }
    });
    takesSinceSweep = 0;
    return removed;
  }

  // Returns true when the call is allowed (and counts it), false when the key
  // has spent its budget for the current window.
  function take(key, calls, intervalMs) {
    const limit = Number(calls);
    const interval = Number(intervalMs);
    if (!(limit > 0) || !(interval > 0)) {
      return true;   // no usable limit configured: do not block
    }

    takesSinceSweep++;
    if (takesSinceSweep >= SWEEP_EVERY_TAKES) {
      sweep();
    }

    const nowMs = now();
    let bucket = buckets.get(key);
    if (!bucket || nowMs - bucket.windowStartMs >= interval) {
      if (!bucket && buckets.size >= maxBuckets) {
        sweep();
        // Still full of live windows (a flood of distinct keys): drop the
        // oldest entries rather than grow without bound.
        const iterator = buckets.keys();
        while (buckets.size >= maxBuckets) {
          const oldest = iterator.next();
          if (oldest.done) { break; }
          buckets.delete(oldest.value);
        }
      }
      bucket = { tokens: limit, windowStartMs: nowMs, intervalMs: interval };
      buckets.delete(key);       // re-insert so the key moves to the newest position
      buckets.set(key, bucket);
    }

    if (bucket.tokens <= 0) {
      return false;
    }
    bucket.tokens = bucket.tokens - 1;
    return true;
  }

  return {
    take: take,
    sweep: sweep,
    size: function() { return buckets.size; }
  };
}

// Decide which address a request came from.
//
// X-Forwarded-For is written by whoever sends the request, so it can only be
// trusted for the hops we know are ours. `forwardedCount` is the number of
// proxies in front of the app (Meteor's HTTP_FORWARDED_COUNT convention, which
// Galaxy sets). With N trusted proxies the client address is the Nth entry
// from the right. Without a positive count the header is ignored and the
// socket address is used; otherwise any caller could dodge a per-address limit
// by sending a different header each time.
function resolveClientIp(forwardedFor, remoteAddress, forwardedCount) {
  const fallback = typeof remoteAddress === 'string' && remoteAddress ? remoteAddress : null;
  const count = parseInt(forwardedCount, 10);
  if (!(count > 0) || typeof forwardedFor !== 'string' || !forwardedFor) {
    return fallback;
  }
  const hops = forwardedFor.split(',').map(function(hop) { return hop.trim(); }).filter(Boolean);
  if (hops.length < count) {
    return fallback;   // fewer hops than proxies we own: the header is not ours
  }
  return hops[hops.length - count] || fallback;
}

// Normalise a `{ calls, intervalMs }` setting. Returns null when the limit is
// switched off (false, 0, or calls <= 0), the given default when unset.
function normalizeRateLimit(value, defaultLimit) {
  if (value === false || value === 0) {
    return null;
  }
  if (value === undefined || value === null) {
    return defaultLimit || null;
  }
  const calls = Number(value.calls);
  const intervalMs = Number(value.intervalMs);
  if (!(calls > 0) || !(intervalMs > 0)) {
    return null;
  }
  return { calls: calls, intervalMs: intervalMs };
}

module.exports = { createRateLimiter, resolveClientIp, normalizeRateLimit, DEFAULT_MAX_BUCKETS };
