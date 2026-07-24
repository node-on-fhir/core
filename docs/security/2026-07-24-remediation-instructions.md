# Security Remediation Campaign — Operating Instructions (2026-07-24)

> The launch prompt for the remediation campaign. Supersedes the 2026-07-01
> draft instructions. Companions:
> [2026-07-01-honeycomb-security-audit.md](2026-07-01-honeycomb-security-audit.md)
> (the brief — read in FULL) and
> [2026-07-24-audit-status-diff.md](2026-07-24-audit-status-diff.md)
> (verified statuses + updated line anchors — the diff SUPERSEDES the audit
> where they disagree).

Authorized defensive security remediation of a FHIR EHR we own, ahead of
BaseEHR certification. Skip findings marked RESOLVED in the diff (CR-9, HI-1,
HI-6, ME-2-synthea); do not redo docs/july-fix-now.md items.

Fixes for the core app go in the campaign branch. Findings in `extensions/*`
(CR-7-residual merkalis, CR-8-residual ipfs-swarm, HI-10
timelines/desktop-*/care-commons-sandbox) are SEPARATE nested git repos —
commit those inside each package's own repo, never the honeycomb parent.

Work in the audit's "Recommended remediation order", adjusted per the diff:
order-2 becomes CR-1 + CR-10 (CR-9 closed); order-4 shrinks to the merkalis
warehouse-relay allowlist + ipfs-swarm SSRF residuals.

This is security-critical: do NOT batch, do NOT loop blindly. For EACH
finding, one full cycle:

1. **Reproduce**: failing test proving the hole — in `tests/rpc/`
   (`node --test`) or as a new check in `scripts/endpoint-smoke-test.sh`.
   NEVER in `tests/mocha/` (runs 0 tests under rspack, issue #171).
   E.g. CR-3: a patient-scoped token reading another patient's resource by id
   must return 403, not the record.
2. **Fix** per the report + the synergy note, which has since LANDED: the
   ServerMethods pipeline exists — method-auth findings are fixed via
   `ServerMethods.define(..., { requireAuth: true })`, never hand-rolled
   `this.userId`. For CR-3/CR-4 apply the EXISTING `authQuery` compartment
   filter (now `FhirEndpoints.js:1279`) uniformly to instance read (`:598`),
   PUT (`:1876`), PATCH (`:2076`/`:2177`), DELETE (`:2188`/`:2232`) — BOTH
   copies of the shadowed duplicate PATCH/DELETE routes, or de-duplicate them
   first; whitelist/strip `meta.security` + ownership refs on write.
   ⚠️ meta.source note: hydration importers legitimately write `meta.source`
   lineage stamps (2026-07-24) — the CR-4 write-path whitelist must allow the
   server-side stamps while stripping CLIENT-supplied `meta.security` labels.
   Reuse `server/lib/FhirAuth.js` — do not invent new auth.
3. **Prove closed**: reproduction passes AND the legitimate path still works
   (same-patient read succeeds; a valid signed client_assertion still
   authorizes).
4. **Commit**, one finding per commit, message naming the id
   ("fix(security): CR-3 patient-compartment filter on instance
   read/delete/patch").
5. **STOP for review after each Critical** before starting the next.

NEW findings to fold into the sequence:
- Expired-resume-token acceptance on FHIR REST (HI-1 follow-up): mirror
  RpcAuth's `when` + `Accounts._getTokenLifetimeMs()` expiry check on
  FhirAuth's two login-token lookup sites.
- BulkData's 5 remaining wildcard-CORS sites (HI-12 residual).

HUMAN-ONLY — do NOT attempt these; instead write
`docs/security/remediation-actions.md` describing exactly what the operator
must do:
- CR-5/CR-6/HI-9/HI-10: the operator rotates the actual secret values and
  purges git history (destructive force-push). You MAY: replace committed
  secret files with `*.template.json` placeholders (the pacio templates
  already model this), switch code to `process.env` / `settings.private`,
  fix force-added tracking (`git rm --cached`), and list every secret that
  needs rotating — noting that the gitleaks CI gate does NOT cover
  `extensions/*` (absent from CI checkout) and misses low-entropy secrets,
  so a green scan is NOT evidence of rotation. Do NOT invent replacement
  secret values or rewrite history.

SPECIAL HANDLING:
- CR-1 (JWT signature verification): implement the `OAuthEndpoints.js:918`
  TODO (line moved from :946) with tests — security-critical crypto touching
  the JWKS/cert path. After it passes, STOP and present the diff for careful
  review before moving on.
- CR-2 / config hardening: default `disableOauth` and `disableAccessControl`
  to false in code; add a `Meteor.startup` assertion that refuses to boot a
  production profile with either enabled; remove the flags from the 12
  shipped settings files. `server/core-startup.js` no longer exists — locate
  the current security-middleware home first. Do not change localhost dev
  behavior beyond the secure default + an explicit dev opt-in.
- Blessed design decisions (do not re-litigate): `synthea.*` methods stay
  `requireAuth: false` behind the `enableSyntheaDbUtils` settings gate — the
  package is sandbox tooling removed from production builds (recorded at the
  define site and in the status diff).

RULES: reproduce-before-fix always; never weaken a fix to make a test pass;
never commit to the honeycomb parent for extension fixes; treat every finding
as PHI-sensitive; if a fix would change external API behavior (status codes,
auth requirements clients depend on), stop and ask. Items marked *reported*
in the audit are single-auditor and unverified — confirm the vulnerability
exists before fixing it (HI-3, HI-4 relocated to
`imports/startup/server/simple-accounts-startup.js`, ME-6..9 line refs stale).

Verify continuously: `npm test`, `bash scripts/endpoint-smoke-test.sh`
against a booted server, and boot with
`settings/settings.honeycomb.localhost.json` to confirm the app still runs
after each Critical.
