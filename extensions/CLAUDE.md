# extensions/ — Private & User-Defined Packages

NPM workflow packages that are **NOT part of the core honeycomb
distribution**: private modules, trade-secret work, mission-specific or
user-defined extensions. Same package format as everywhere else — different
git and licensing posture.

## Directory Contract

| Aspect | Convention |
|--------|-----------|
| Git | **Gitignored from the monorepo** (`extensions/*`, this CLAUDE.md excepted); each package has its **own nested git repo** |
| Remote | Convention `git@github.com:awatson1978/{name}.git`, **private** by default |
| License | **UNLICENSED** + `"private": true` in package.json (blocks accidental `npm publish`) |
| npm scope | Any (`@node-on-fhir/`, `@merkalis/`, custom) |
| Format | Identical to all package dirs: `package.json` + `workflow.json` + `client.js` + `server.js` (see `npmPackages/CLAUDE.md`) |
| Registration | Entry in `workflows/workflows.json` (`serverEntry: "./server"`); enabled via `EXTRA_WORKFLOWS` |
| Workspaces | Covered by the `extensions/*` glob in root `package.json` — run `npm install` after adding a package |

## Component Override API (branding)

A brand extension can replace select terminal components of the host app —
business pages, welcome/404/guard-fallback pages, Sidebar, Header,
ProminentHeader, Footer — via the `components` map on its `client.js` default
export. **One brand package per runtime**; duplicate slot registrations log a
console warning (zIndex wins). Guard logic itself (`AuthGuard`,
`PatientGuard`, `DataGuard` in `imports/ui/guards/`) is core and not
overridable — you override the fallback pages they render
(`NoAuthorizationPage`, `NoSelectedPatientPage`, `NoDataPage`).

```javascript
export default {
  name: 'my-brand',
  routes: DynamicRoutes,
  components: {
    AboutPage: BrandAboutPage,
    WelcomePage: BrandWelcome,
    NotFoundPage: Brand404,
    Sidebar: BrandSidebar,
    ProminentHeader: BrandPatientBanner
  }
};
```

Full slot list, props contracts, zIndex/tie semantics, and the deprecated
legacy surface (`notFoundPage`/`welcomeComponent`/`noPatientSelectedPage`
keys, `Meteor.NotSignedInWrapper`/`NoDataWrapper` globals): **`extensions/API.md`**.

## Reference Implementation

`npmPackages/tracss-to-fhir` is the proven private-package pattern (nested
repo, private remote, UNLICENSED, firehose architecture) — it and its
siblings will migrate into this directory opportunistically.

## What Belongs Here

- Trade-secret packages (e.g. tracss-to-fhir, voyager-technologies)
- Personal/experimental packages (lunar/orbital simulator modules)
- Deployment-specific customizations not meant for the distribution

**Not here**: anything that ships with honeycomb → `core/` (tracked,
Apache-2.0).

## Gotchas

- A new package here won't appear in `git status` (ignored) — its history
  lives in its own nested repo. `git init` + remote + push is part of
  package creation, not an afterthought.
- npm workspaces resolve gitignored directories fine (the `npmPackages/*`
  precedent) — `npm install` symlinks regardless of git status.

## Related

- Package format & patterns: `npmPackages/CLAUDE.md`
- Migration command: `.claude/commands/migrate-atmosphere-package.md`
- Sibling contract: `core/CLAUDE.md`
