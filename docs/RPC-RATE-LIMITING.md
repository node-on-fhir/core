# RPC rate limiting

Server methods defined with `Meteor.ServerMethods.define` are rate limited in
the shared pipeline (`imports/lib/ServerMethods.js`), so the same limits apply
whether a call arrives over `POST /api/rpc` or over DDP. `DDPRateLimiter` rules
cover DDP only and do not protect the HTTP transport.

## What is limited

| Caller | Method declares `rateLimit` | Method declares nothing |
|--------|-----------------------------|-------------------------|
| Signed in | the method's limit, per user | not limited |
| Anonymous | the method's limit, per client address | the anonymous default, per client address |

Limits are counted per method. A refused call gets the Meteor error
`too-many-requests`, JSON-RPC code `-32029`, HTTP status `429`.

In-process `ServerMethods.invoke()` calls are never limited.

## Declaring a limit on a method

```javascript
Meteor.ServerMethods.define('emailList.subscribe', {
  description: 'Subscribe an address to the list',
  requireAuth: false,
  rateLimit: { calls: 3, intervalMs: 60000 }
}, async function(params, context) { /* ... */ });
```

Give every public (`requireAuth: false`) method that writes data or sends
email its own, tighter limit. The anonymous default only stops unbounded use.

## The anonymous default

```json
{
  "private": {
    "rpc": {
      "anonymousRateLimit": { "calls": 300, "intervalMs": 60000 }
    }
  }
}
```

300 calls per 60 seconds per address per method when the key is absent. Set it
to `false` or `0` to switch the default off.

## Client address behind a proxy

A call is charged to the socket address unless `HTTP_FORWARDED_COUNT` is set,
in which case the address is read from `X-Forwarded-For`, counting that many
hops from the right. This is the convention Meteor uses for
`connection.clientAddress`.

Set `HTTP_FORWARDED_COUNT` to the number of proxies in front of the app. If it
is missing behind a proxy, every caller appears to come from the proxy and
shares one bucket; the server logs a warning the first time it sees the header
without the variable. The header is never trusted without it, because a caller
can put anything in it.

## Limits of this design

Counters are in memory and per process. With several app instances each
enforces its own budget, so the effective limit is the configured limit times
the number of instances. Idle counters are evicted, and the table is capped.

Code: `imports/lib/rpcRateLimiter.js` (pure, unit tested by
`npm run test:rpc-rate-limiter`).
