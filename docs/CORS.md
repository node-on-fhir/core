# Disabling CORS / X-Frame-Options for Local Development

Many external sites send `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none'`, which prevents them from loading in the Honeycomb iframe panel. These workarounds are for **local development only**.

## Chrome Launch Flags (Recommended)

Launch Chrome or Chrome Canary with security restrictions disabled. The `--user-data-dir` flag is **required** -- Chrome ignores `--disable-web-security` without a separate profile directory.

### macOS - Chrome

```bash
open -na "Google Chrome" --args \
  --disable-web-security \
  --user-data-dir="/tmp/chrome-cors-disabled"
```

### macOS - Chrome Canary

```bash
open -na "Google Chrome Canary" --args \
  --disable-web-security \
  --user-data-dir="/tmp/chrome-canary-cors"
```

### Additional Flags for Iframe Restrictions

Stack these flags for more complete iframe unblocking:

```bash
open -na "Google Chrome Canary" --args \
  --disable-web-security \
  --disable-site-isolation-trials \
  --disable-features=IsolateOrigins,site-per-process \
  --user-data-dir="/tmp/chrome-iframe-dev"
```

| Flag | Purpose |
|------|---------|
| `--disable-web-security` | Disables CORS and same-origin policy |
| `--disable-site-isolation-trials` | Relaxes process isolation (helps with X-Frame-Options) |
| `--disable-features=IsolateOrigins,site-per-process` | Further relaxes iframe restrictions |
| `--user-data-dir=<path>` | Required; isolates from your normal browsing profile |

## Chrome Extension Alternative

If you don't want to relaunch the browser, extensions can strip blocking headers from responses via the `webRequest` API:

- **Ignore X-Frame headers** -- strips `X-Frame-Options` headers
- **CORS Unblock** -- strips both CORS and frame-blocking headers

These work by intercepting HTTP responses before the browser enforces restrictions.

## Local Proxy

A proxy server that strips blocking headers from upstream responses. This is the most robust approach because it doesn't require a special browser configuration:

```bash
# Install
npm install -g local-cors-proxy

# Run (proxies and strips CORS/frame headers)
lcp --proxyUrl https://pubmed.ncbi.nlm.nih.gov --port 8010
```

Then point the iframe at `http://localhost:8010` instead of the original URL.

## Convenience Script

Add a dev browser launcher to your workflow:

```bash
#!/bin/bash
# scripts/dev-browser.sh
# Opens Chrome Canary with iframe/CORS restrictions disabled

open -na "Google Chrome Canary" --args \
  --disable-web-security \
  --disable-site-isolation-trials \
  --disable-features=IsolateOrigins,site-per-process \
  --user-data-dir="/tmp/honeycomb-dev" \
  http://localhost:3000
```

```bash
chmod +x scripts/dev-browser.sh
./scripts/dev-browser.sh
```

This opens a dedicated dev browser window pointed at your local Honeycomb instance, completely separate from your normal Chrome profile.

## Production Behavior

In production (or without these workarounds), the `ExternalContentPanel` component handles blocked iframes gracefully:

- A 5-second timeout detects sites that fail to load
- A warning alert offers "Open in New Tab" and "Try Again" buttons
- Mixed content (HTTP in HTTPS) is detected and flagged with an error alert
