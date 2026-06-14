# mitre:q4-moonshot

![PatientChartScreencapture](https://gitlab.mitre.org/awatson/q4-moonshot/-/raw/main/PatientChartScreencapture.png?ref_type=heads')




#### Run Node on FHIR with your plugin  


```bash
# install the meteor compiler; this will take care of node, nvm, npm, yarn, etc.
# it will also set up debugging tools, a compiler build tool, etc
NODE_EXTRA_CA_CERTS=~/MITRE-chain.pem npm install -g meteor

# download the node-on-fhir application
git clone https://gitlab.mitre.org/awatson/honeycomb3
cd honeycomb3

# install dependencies
NODE_EXTRA_CA_CERTS=~/MITRE-chain.pem CAFILE=~/MITRE-chain.pem meteor npm install

# alternative, use yarn if you'd like a more modern package manager
meteor yarn install

# run the application in local development mode
# this will automatically launch a mongo instance
CAFILE=~/MITRE-chain.pem meteor run --settings configs/settings.honeycomb.localhost.json 

# can we get to the FHIR server yet?
open http://localhost:3000/metadata

# stop the application with Ctrl-C

# now try running it with some server configs
CAFILE=~/MITRE-chain.pem meteor run --settings configs/settings.fhir.server.json 

# does it run?  can we get to the FHIR server?  To the Patient route?
open http://localhost:3000/baseR4/metadata
open http://localhost:3000/baseR4/Patient

# stop the application with Ctrl-C

# download custom packages
cd packages
git clone https://gitlab.mitre.org/awatson/q4-moonshot
meteor add mitre:q4-moonshot

# optionally, you may also wish to add the following:  
git clone https://github.com/symptomatic/data-importer
meteor add symptomatic:data-importer

# after adding the plugin, you can simply run the following
cd ../..
CAFILE=~/MITRE-chain.pem meteor run --settings configs/settings.moonshot.json 



#### Configuration  

The package allows you to load files in three different ways.  

**Option 1.  Static File Loader**

On the `/patient-chart` route, the user is presented a button that says "Load Sample Patient".  Upon pressing this button, a Synthea generated sample patient is loaded into memory.  You can go into the browser console, and inspect the data loaded into memory, like so:

```javascript
// get the patient id
Session.get('selectedPatientId')

// get the FHIR Patient resource
Session.get('selectedPatient')

// get the FHIR Conditions
Conditions.find().fetch()
```

**Option 2.  File Load User Interface**

If you wish to import a file from the filesystem, you can use the open-source Symptomatic Data Importer package, available via the Atmosphere package.  This package is completely optional, but is convenient for working with Synthea files.  

```bash
meteor add symptomatic:data-importer
```

Once installed, the button on the Patient Chart page will be updated to say "Select Patient File", and will route you to the data importer page.  


**Option 3.  SMART on FHIR Data Fetch**

Lastly, you may wish to fetch a sample patient from a hospital sandbox, using the SMART on FHIR data protocol.  This is the most complicated approach, and requires configuring a settings file.  You will need to add a configuration object to the `Meteor.settings.public.smartOnFhir` array.  

The SMART on FHIR configuration looks like the following:
```json
[{
    "vendor": "SmartHealth IT",
    "client_id": "smarthealthit",
    "scope": "launch launch/patient Patient.Read Encounter.Read Procedure.Read Condition.Read Observation.Read offline_access",
    "fhirServiceUrl": "https://launch.smarthealthit.org/v/r4/sim/WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMV0/fhir",
    "redirect_uri": "http://localhost:3000/cms-home-page",
    "iss": "https://launch.smarthealthit.org/v/r4/sim/WzMsIiIsIiIsIkFVVE8iLDAsMCwwLCIiLCIiLCIiLCIiLCIiLCIiLCIiLDAsMV0/fhir"
}]
```

Once created, you will need to run Meteor with your custom settings file.  An example has been provided in the `configs` directory, and can be run like so:

```bash
meteor run --settings packages/q4-moonshot/configs/settings.moonshot.localhost.json  
```


#### License  
This project is licensed under the Apache License. See the `LICENSE` file for details.