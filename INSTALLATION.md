

## Quickstart

```bash
# install the meteor compiler; this will take care of node, nvm, npm, yarn, etc.
# it will also set up debugging tools, a compiler build tool, etc
npm install -g meteor

# download the node-on-fhir application
git clone **QWERTY: insert github repo link to node-on-fhir**
cd node-on-fhir

# install dependencies
meteor npm install

# alternative, use yarn if you'd like a more modern package manager
meteor yarn install

# run the application in local development mode
# this will automatically launch a mongo instance
meteor run --settings configs/settings.nodeonfhir.json  

# stop the application with Ctrl-C

# add custom packages (the FHIR server)
meteor add clinical:vault-server

# now run it with a custom settings file
# does it compile?
meteor run --settings configs/settings.nodeonfhir.localhost.json

# can we get to the FHIR server yet?
open http://localhost:3000/metadata

# does it run?  can we get to the FHIR server?  To the Patient route?
open http://localhost:3000/baseR4/metadata
open http://localhost:3000/baseR4/Patient

# stop the application with Ctrl-C

# download custom packages
cd packages
git clone https://github.com/clinical-meteor/example-plugin
cd ..

# alternatively, run the config from a plugin
meteor run --settings packages/example-plugin/configs/settings.example.json  --extra-packages symptomatic:example-plugin

# after adding the plugin, you can simply run the following
meteor run --settings settings/settings.honeycomb.localhost.json
```

## Workflow Packages

Clinical/workflow features are **NPM workflow packages** (this replaced the
Atmosphere.js `packages/` + `meteor add` model — migration completed 2026).
Packages live in:

- **`npmPackages/*`** — tracked in this monorepo; ships with honeycomb.
- **`core/*`** — Apache-licensed core subset (reserved).
- **`extensions/*`** — private/user-defined; each its own nested git repo, **not**
  checked into this monorepo (only the directory `CLAUDE.md` stub is tracked).

The workflow parser resolves packages **by name** via `node_modules` symlinks, so
location is organizational only. Register a package in `workflows/workflows.json`
and enable it there (`enabled: true`) or at runtime via `EXTRA_WORKFLOWS`:

```bash
# enable specific workflow packages for this run
EXTRA_WORKFLOWS=@node-on-fhir/us-core,@node-on-fhir/pacio-core \
  meteor run --settings settings/settings.honeycomb.localhost.json
```

A package's own settings/configs travel with it (e.g.
`npmPackages/pacio-core/configs/settings.pacio-core.2026.json`). See
`npmPackages/CLAUDE.md` for the full package guide.

## Windows notes

Findings from OS-compatibility testing on Windows 11. The PowerShell quickstart
is in `README.md` § Windows (PowerShell).

### Use `meteor npm`, not a system-wide `npm`

Meteor 3.4 bundles its own Node 22 and npm 10. A system-wide Node 24+ ships
npm 12, which changes install defaults: `allow-remote=none`, `allow-git=none`,
and install scripts disabled. In this repo that produces:

- `npm error code EALLOWREMOTE ... Refusing to fetch "https://registry.npmjs.org/npm/-/npm-11.x.tgz"`
  (pulled in by an extension's `semantic-release` devDependencies).
- `postinstall` not running, so `libraries/dcmjs` is never built.
- A Windows install rewrote most of `package-lock.json` (~58,000 lines).

Check which one you're using: `meteor npm -v` should print `10.x`. Always
install with:

```powershell
meteor npm install
```

If you must use npm 12, allow remote tarballs and build dcmjs by hand:

```powershell
npm install --allow-remote=all
npm run dcmjs:setup
```

### Known issue: `extensions/keeptrack.space` breaks workspace installs

If `extensions/keeptrack.space` is checked out, it trips up both npm versions,
because npm resolves every workspace on every install:

- **npm 10** (`meteor npm install`) crashes while resolving `vitest`'s optional
  peers: `npm error Cannot read properties of null (reading 'edgesOut')`
  (stack in `#loadPeerSet`).
- **npm 12** refuses its `semantic-release` tooling with `EALLOWREMOTE` (see
  above).

`--legacy-peer-deps` avoids the npm 10 crash but rewrites over 1,500 packages,
so don't use it just to add one dependency. To install a single missing
package without re-resolving the workspace, install it in an empty folder and
copy it in with its dependencies nested underneath:

```powershell
mkdir $env:TEMP\iso; cd $env:TEMP\iso
npm init -y; npm install amazon-cognito-identity-js@6.3.7 --ignore-scripts --no-package-lock
# then copy node_modules\amazon-cognito-identity-js into C:\Code\core\node_modules\,
# and every other folder in node_modules\ into
# C:\Code\core\node_modules\amazon-cognito-identity-js\node_modules\
```

### Don't commit a Windows-rewritten lockfile

If `git status` shows a large `package-lock.json` change you didn't intend,
restore it before committing (`git checkout -- package-lock.json`) and commit
only deliberate dependency changes.

### Extensions cloned after install aren't linked

Workflow packages resolve through `node_modules/@scope/<pkg>` links (directory
junctions on Windows). A package cloned into `extensions/` after the last
install has no link yet. Symptoms:

- `[WorkflowParser] EXTRA_WORKFLOWS package not installed, skipping: @scope/pkg`
- `Module not found: Can't resolve '@scope/pkg'`

Fix: re-run `meteor npm install`, which also installs the package's own npm
dependencies. If that install fails (see the `keeptrack.space` issue above),
create the junction by hand:
`New-Item -ItemType Junction -Path node_modules\@scope\pkg -Target extensions\pkg`.
That fixes resolution but leaves the package's own dependencies missing; they
show up later as `Cannot find module '<dep>'` from inside `extensions/<pkg>/`.
Install those with the isolated-folder method above.

### Keep extension repos current

Each `extensions/*` directory is its own git repo, and pulling core doesn't
update them. A stale sibling repo shows up as:

- `Package subpath './client/lib/...' is not defined by "exports"`
- `ESModulesLinkingError: export 'X' ... was not found in '@orbital/...'`

Fix: `git pull` in each affected `extensions/<name>` repo. Some extensions were
migrated to npm on a branch other than `main` (for example, `ecg` is on
`feat/json-rpc`); if a clone has `package.js` but no `package.json`, it's on a
pre-npm branch.

### Harmless warnings

- `Warning: Passing args to a child process with shell option true ...`
  comes from Meteor's own tooling on Windows and is safe to ignore.
- `[WorkflowParser] Could not resolve assets for ... EBUSY: resource busy or locked, copyfile`:
  the client and server rspack processes both copy workflow assets into
  `public/workflows/` at once, and Windows locks files mid-copy. The other
  process's copy normally succeeds; restart `meteor run` if an asset is
  actually missing.

## Deployment

### Hosted deploy (Meteor Galaxy)

```bash
# Galaxy deploy — these env prefixes are REQUIRED for a non-trivial workflow set:
#
#   TOOL_NODE_FLAGS="--max-old-space-size=8192"
#       Raises the local meteor-tool build heap past Node's ~4 GB default. Without it
#       the build dies with "FATAL ERROR: ... JavaScript heap out of memory" at the
#       "Linking" stage. Bump to 12288/16384 if a very large workflow set still OOMs.
#
#   PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
#       Skips the Playwright browser download (a build-time install blocker on this app).
#
#   EXTRA_WORKFLOWS=<comma-separated @scope/pkg list>
#       Build-time only — read before the bundle is uploaded. `meteor deploy` does NOT
#       accept `--extra-packages`; you must pass the workflow set this way (or enable
#       packages in workflows/workflows.json).
#
# Settings (with any secrets) ride via --settings and are NOT committed to git.

TOOL_NODE_FLAGS="--max-old-space-size=8192" \
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
EXTRA_WORKFLOWS=@node-on-fhir/us-core,@node-on-fhir/pacio-core,@node-on-fhir/radiology-workflow \
  meteor deploy --settings <path/to/settings.json> <your-app>.meteorapp.com
```

Galaxy rejects bundles over **367,001,600 bytes (~350 MiB compressed)**. If the upload
fails with "Application is too large", trim heavy workflows you don't need (each drops
its native deps from the bundle) and remove unused static assets. If the app deploys but
crash-loops on boot with `heap out of memory`, the container is too small — bump it to
**Standard (2 GB)** in the Galaxy dashboard (a live setting, no redeploy).

### Self-hosted (build your own node bundle)

```bash
# when you're ready to deploy, you'll need to add the package to the app (meteor deploy won't accept --extra-packages)
meteor add symptomatic:covid19-on-fhir

# test the code minification doesnt break anything
meteor run --settings packages/covid19-on-fhir/configs/settings.covid19.json --production

# build the application
meteor build --directory ../output

# run the node application  
# warning!  we don't have a mongo instance yet
# while `meteor run` will autolaunch a local copy of Mongo,
# the compiled node bundle will not.  
# you will need to specify a MONGO_URL

cd ../output
more README

cd programs/server 
npm install
export MONGO_URL='mongodb://user:password@host:port/databasename'
export ROOT_URL='http://example.com'

# finally, run the node server itself
export METEOR_SETTINGS=`(cat configs/settings.nodeonfhir.json)`
node main.js

# or if you're looking for a one-liner
MONGO_URL='mongodb://user:password@host:port/databasename' PORT=4200 ROOT_URL=http://localhost METEOR_SETTINGS=`(cat ../../node-on-fhir/configs/settings.nodeonfhir.json)` node main.js
```

## Testing  
```bash
# run the app
meteor --settings configs/settings.nodeonfhir.localhost.json 

# in a second terminal, run static code analysis tools
meteor npm run-script lint

# in a second terminal, run the verification tests
TEST_BROWSER_DRIVER=chrome meteor test --driver-package meteortesting:mocha --port 3002 --once --full-app

# in a second terminal, run the vaildation tests
meteor npm run-script nightwatch -- --tag circle 
```

