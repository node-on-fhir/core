# Human-Only Remediation Actions — Secret Rotation & History Purge

> Companion to the CR-5/CR-6/HI-9/HI-10 remediation commit (2026-07-24).
> The machine-side work is done: secret settings files are untracked with
> scrubbed `*.template.json` replacements, the deprecated-estate copies are
> scrubbed, and gitleaks now has custom rules that fail CI if either
> known-leaked literal reappears in a tracked file. Everything below requires
> a human: real credential rotation and destructive history rewrites.
> Deliberately NO secret values appear in this file — the custom gitleaks
> rules would flag them; the values are quoted only in the 2026-07-01 audit
> record.
>
> ⚠️ A green gitleaks job is NOT evidence any of this is done: the CI gate
> scans only the tracked tree of THIS repo — it cannot see `extensions/*`
> (absent from the CI checkout), other machines' clones, or git history.
>
> **Risk calibration (2026-07-24, per project owner)**: the only deployed
> instance is the care-commons.app SANDBOX — no production PHI deployments
> exist. The leaked values therefore expose sandbox data only. Treat this
> list as data-hygiene backlog, not incident response: rotate at convenience,
> and re-read this list as a HARD prerequisite checklist before any first
> real production deployment.

## 1. Rotate the pacio account-server token (CR-5)

The shared `accountServerTokenSecret` gates account-server token auth
(`server/FhirEndpoints.js:127`, `server/ConsentEngineHttp.js:44`,
`server/main.js:605`). It was committed to this repo's history and is in a
**production deploy config**. Anyone with repo access can forge
account-server tokens against any deployment still using it.

- [ ] Generate a new secret (e.g. `openssl rand -base64 48`) — do NOT commit it
- [ ] Update every deployment that sets it, especially **care-commons.app**
      (Galaxy) — the deploy config lives at
      `extensions/care-commons-sandbox/settings/settings.pacio-core.2026.galaxy.json`
      (nested repo). Set the new value there (that repo is private, but
      treat it as settings-not-for-git too: prefer env/Galaxy secrets)
- [ ] Update local working copies: `settings/settings.pacio.json` (now
      untracked) and the untracked `npmPackages/pacio-core/configs/settings.*.json`
      files still carry the old value on disk — replace or blank them
- [ ] Note: when the setting is absent, the consumers fall back to
      `Random.secret()` per boot — fail-closed (nothing can authenticate),
      but multi-instance deployments need an explicit shared value

## 2. Change the admin password (HI-9)

`settings/accounts.multiuser.settings.json` (now untracked) shipped a
default `adminPassword` in git history.

- [ ] Change the admin account password on ANY deployment ever launched with
      that settings file
- [ ] Set a real password only in local/deploy copies, never the template

## 3. Rotate the extension-repo secrets (HI-10) — nested repos

These live in `extensions/*` nested git repos (not this monorepo, not
covered by CI gitleaks). Rotate the credential FIRST, then clean the repo.

- [ ] **RSA private key** in `extensions/timelines/configs/settings.lcars.json`
      — regenerate the keypair, update whatever consumed it, scrub the file
      (template pattern), purge the timelines repo history
- [ ] **Google Maps API keys** (`AIzaSy…`) in:
      `extensions/desktop-lunar-colony-sim/package.json` + `settings/settings.lunar-sim.json`,
      `extensions/timelines/configs/settings.timelines.json`,
      `extensions/desktop-care-commons/settings/settings.carecommons.galaxy.json`,
      `extensions/care-commons-sandbox/settings/settings.pacio-core.2026.galaxy.json`
      — rotate in Google Cloud console (and add referrer/IP restrictions),
      move to `settings.private.googleMaps.apiKey` / env per the CSP-BYOK
      pattern, scrub the files
- [ ] **Stripe `sk_test_…` keys** in several `desktop-*` settings — roll them
      in the Stripe dashboard (test keys, but still rotate), scrub files
- [ ] Commit each cleanup inside its own nested repo (never the honeycomb
      parent); replicate the `.template.json` + gitignore pattern there

## 4. Purge git history (CR-5/CR-6 closure) — OPTIONAL at current posture

The old values remain in this repo's history until rewritten. With
sandbox-only exposure, the disruption of a history rewrite (force-push, all
clones re-cloned, PRs rebased) may not be worth it — a reasonable call is to
rotate (making the historical values dead) and skip the purge until/unless a
compliance review requires it. If purging, do it AFTER rotation (order
matters — purge without rotation buys nothing):

- [ ] `git filter-repo` (or BFG) to excise
      `settings/settings.pacio.json`, `settings/accounts.multiuser.settings.json`,
      and `deprecated/pacio-core/configs/settings.*.json` blobs containing
      the old token from all history
- [ ] Coordinate the force-push: all clones re-clone or hard-reset;
      open PRs will need rebasing
- [ ] Repeat for the affected extension repos (timelines at minimum — the
      RSA key)
- [ ] GitHub support request to drop cached views of the old commits, if
      desired

## 5. Verify

- [ ] New secrets deployed and old ones confirmed non-functional (an old
      account-server token must fail auth against care-commons.app)
- [ ] `git grep` for the old literals across history returns nothing after
      the rewrite
- [ ] CI gitleaks job stays green (custom rules guard reintroduction)
