// tests/unit/imports/lib/rpcRateLimiter.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createRateLimiter, resolveClientIp, normalizeRateLimit } = require('../../../../imports/lib/rpcRateLimiter.js');

function clock(start) {
  let t = start || 0;
  const now = function() { return t; };
  now.advance = function(ms) { t += ms; };
  return now;
}

test('allows up to the limit, then refuses within the window', function() {
  const limiter = createRateLimiter({ now: clock() });
  assert.equal(limiter.take('a', 3, 1000), true);
  assert.equal(limiter.take('a', 3, 1000), true);
  assert.equal(limiter.take('a', 3, 1000), true);
  assert.equal(limiter.take('a', 3, 1000), false);
  assert.equal(limiter.take('a', 3, 1000), false);
});

test('refills when the window has elapsed', function() {
  const now = clock();
  const limiter = createRateLimiter({ now: now });
  assert.equal(limiter.take('a', 1, 1000), true);
  assert.equal(limiter.take('a', 1, 1000), false);
  now.advance(999);
  assert.equal(limiter.take('a', 1, 1000), false);
  now.advance(1);
  assert.equal(limiter.take('a', 1, 1000), true);
});

test('keys are independent', function() {
  const limiter = createRateLimiter({ now: clock() });
  assert.equal(limiter.take('method:1.1.1.1', 1, 1000), true);
  assert.equal(limiter.take('method:1.1.1.1', 1, 1000), false);
  assert.equal(limiter.take('method:2.2.2.2', 1, 1000), true);
  assert.equal(limiter.take('other:1.1.1.1', 1, 1000), true);
});

test('an unusable limit never blocks', function() {
  const limiter = createRateLimiter({ now: clock() });
  for (let i = 0; i < 20; i++) {
    assert.equal(limiter.take('a', 0, 1000), true);
    assert.equal(limiter.take('a', 5, 0), true);
    assert.equal(limiter.take('a', undefined, undefined), true);
  }
  assert.equal(limiter.size(), 0);
});

test('sweep forgets keys whose window has elapsed and keeps live ones', function() {
  const now = clock();
  const limiter = createRateLimiter({ now: now });
  limiter.take('short', 5, 1000);
  limiter.take('long', 5, 60000);
  now.advance(1500);
  assert.equal(limiter.sweep(), 1);
  assert.equal(limiter.size(), 1);
  // the surviving key still remembers what it spent
  for (let i = 0; i < 4; i++) { limiter.take('long', 5, 60000); }
  assert.equal(limiter.take('long', 5, 60000), false);
});

test('idle keys are swept automatically, so churn does not grow the table forever', function() {
  const now = clock();
  const limiter = createRateLimiter({ now: now });
  for (let i = 0; i < 5000; i++) {
    limiter.take('ip-' + i, 5, 1000);
    now.advance(10);          // each key goes idle long before the run ends
  }
  assert.ok(limiter.size() < 1200, 'expected periodic sweeps to bound the table, got ' + limiter.size());
});

test('the table never exceeds maxBuckets even when every window is live', function() {
  const limiter = createRateLimiter({ now: clock(), maxBuckets: 100 });
  for (let i = 0; i < 1000; i++) {
    limiter.take('ip-' + i, 5, 60000);
  }
  assert.ok(limiter.size() <= 100, 'size was ' + limiter.size());
  // the newest key is still tracked
  for (let i = 0; i < 4; i++) { limiter.take('ip-999', 5, 60000); }
  assert.equal(limiter.take('ip-999', 5, 60000), false);
});

test('resolveClientIp ignores X-Forwarded-For unless a proxy count is configured', function() {
  assert.equal(resolveClientIp('6.6.6.6', '10.0.0.1', undefined), '10.0.0.1');
  assert.equal(resolveClientIp('6.6.6.6', '10.0.0.1', '0'), '10.0.0.1');
  assert.equal(resolveClientIp('6.6.6.6', '10.0.0.1', 'abc'), '10.0.0.1');
  assert.equal(resolveClientIp(undefined, '10.0.0.1', '1'), '10.0.0.1');
});

test('resolveClientIp takes the Nth hop from the right for N trusted proxies', function() {
  assert.equal(resolveClientIp('203.0.113.7', '10.0.0.1', '1'), '203.0.113.7');
  assert.equal(resolveClientIp('203.0.113.7, 10.0.0.2', '10.0.0.1', 2), '203.0.113.7');
  // a client-supplied prefix cannot displace the hop our own proxy appended
  assert.equal(resolveClientIp('1.2.3.4, 203.0.113.7', '10.0.0.1', '1'), '203.0.113.7');
  assert.equal(resolveClientIp('1.2.3.4, 9.9.9.9, 203.0.113.7, 10.0.0.2', '10.0.0.1', '2'), '203.0.113.7');
});

test('resolveClientIp falls back when the header has fewer hops than trusted proxies', function() {
  assert.equal(resolveClientIp('203.0.113.7', '10.0.0.1', '2'), '10.0.0.1');
  assert.equal(resolveClientIp('  ,  ', '10.0.0.1', '1'), '10.0.0.1');
  assert.equal(resolveClientIp('203.0.113.7', undefined, '3'), null);
});

test('normalizeRateLimit handles off, unset and malformed values', function() {
  const fallback = { calls: 120, intervalMs: 60000 };
  assert.deepEqual(normalizeRateLimit(undefined, fallback), fallback);
  assert.deepEqual(normalizeRateLimit(null, fallback), fallback);
  assert.equal(normalizeRateLimit(false, fallback), null);
  assert.equal(normalizeRateLimit(0, fallback), null);
  assert.equal(normalizeRateLimit({ calls: 0, intervalMs: 1000 }, fallback), null);
  assert.equal(normalizeRateLimit({ calls: 5 }, fallback), null);
  assert.deepEqual(normalizeRateLimit({ calls: '5', intervalMs: '2000' }, fallback), { calls: 5, intervalMs: 2000 });
});
