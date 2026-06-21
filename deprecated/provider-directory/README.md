## National Directory    


#### Installation  

```bash
# fetch boilerplate
git clone https://github.com/clinical-meteor/node-on-fhir

# check that you can install the base boilerplate
cd node-on-fhir
meteor npm install
yarn install

cd packages
git clone https://github.com/clinical-meteor/national-directory
cd ..

# install dependencies
meteor npm install

# run the app; make sure it compiles
meteor run 

# run the FHIR server without the National Directory module
meteor add clinical:vault-server
meteor run --settings packages/vault-server/configs/settings.fhir.server.json

# test API endpoints
curl http://localhost:3000/baseR4/metadata
curl http://localhost:3000/baseR4/Patient

# run the app with custom settings file
meteor add mitre:national-directory   
meteor run --settings packages/national-directory/configs/settings.vhdir.json


# add extra data import packages (as needed)
meteor add symptomatic:data-importer
meteor add symptomatic:data-relay
```

#### Data Load-In  

```bash 
# Download NPPES Data File
# Use BentoBox to parse into FHIR Resources
# Match records on NPI numbers
# Copy id fields to _id
# Make sure postal codes have dashes if greater than 9 chars
# Geocode addresses

# Organizations File
# Lantern Endpoints
# Practitioner File
# HSA Locations
# Sample Insurance Plans
# Sample Healthcare Services
# 211 Directory ?
```

#### References  

- [Improving Health Plan Provider Directories](https://www.ama-assn.org/system/files/improving-health-plan-provider-directories.pdf)  
- [UDAP Ecosystem Participation Agreement](https://docs.google.com/document/d/1OHn8reHU10-9RI9UeJlGkgMFoeD0F30rmZWvS-L3gf4/edit)  
