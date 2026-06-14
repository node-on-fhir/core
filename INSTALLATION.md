

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

## Deployment

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

