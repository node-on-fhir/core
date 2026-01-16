

## Quickstart

```bash
# install the meteor compiler; this will take care of node, nvm, npm, yarn, etc.
# it will also set up debugging tools, a compiler build tool, etc
npm install -g meteor

# download the node-on-fhir application
git clone <insert Github repo for node-on-fhir>/node-on-fhir  # QWERTY: Removed internal reference
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

# when you're ready to deploy, you'll need to add the package to the app (meteor deploy won't accept --extra-packages)
meteor add clinical:example-plugin

# after adding the plugin, you can simply run the following
meteor run --settings packages/example-plugin/configs/settings.example.json
```
