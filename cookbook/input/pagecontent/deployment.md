
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
