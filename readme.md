## Node on FHIR

[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/3466/badge)](https://bestpractices.coreinfrastructure.org/projects/3466) [![StackShare](http://img.shields.io/badge/tech-stack-0690fa.svg?style=flat)](https://stackshare.io/awatson1978/node-on-fhir)
[![CircleCI](https://circleci.com/gh/symptomatic/node-on-fhir.svg?style=svg)](https://circleci.com/gh/symptomatic/node-on-fhir)

![NodeOnFHIR-Honeycomb2](/assets/NodeOnFHIR-NASA.png)


Welcome to Honeycomb3 - a full-stack FHIR framework.  This project was formerly known as [Node on FHIR](https://github.com/clinical-meteor/node-on-fhir) (v2), and before that, [Meteor on FHIR](https://github.com/clinical-meteor/meteor-on-fhir) (v1).

This code repository contains a reference TEFCA compliant FHIR server and web application stack written in modern ES6/Typescript/Javascript/Node that can compile to mobile devices and supports Fast Healthcare Interoperability Resources (FHIR).  We have gone through the NPM repository, and tried to pull in as many FHIR related libraries as we could in order to find the 'center' of the Javascript FHIR community.  It supports FHIR on the server, client, database, testing, and tooling.

This repository is set up as a GitHub template, so you can simply fork it and adjust the settings file.  Included is an example plugin which can be compiled and published to NPM itself.


## Supported FHIR Libraries

The following FHIR libraries from the NPM repository have been validated to work with NodeOnFHIR.

Library           | Vendor        | Description
----------------- | ------------- | -------------
[fhirclient](https://www.npmjs.com/package/fhirclient) | smarthealthit | The official SMART on FHIR javascript client
[fhir-kit-client](https://www.npmjs.com/package/fhir-kit-client) | Vermonster | Modern FHIR client with ES6, SMART, cross-version support, etc
[fhir-starter](https://www.npmjs.com/package/fhir-starter) | symptomatic  | FhirUtilities, FhirDehydrator, and template FHIR UI components.
[fhir-react](https://www.npmjs.com/package/fhir-react) | 1uphealth | Multi use react component
[json-schema-resource-validation](https://www.npmjs.com/package/json-schema-resource-validation) | VictorGus | FHIR validator for R4
[sof-scope-checker](https://www.npmjs.com/package/@asymmetrik/sof-scope-checker) | Asymmetrik | Utility to check SMART on FHIR scope access
[fhirpath](https://www.npmjs.com/package/fhirpath) | HL7 | The official FHIRPath parser
[is-fhir-date](https://www.npmjs.com/package/is-fhir-date) | HenrikJoreteg | Checks if a date is FHIR compliant
[ts-fhir-types](https://www.npmjs.com/package/@ahryman40k/ts-fhir-types) | Ahryman40k | Typescript definitions
[fhir-list-addresses](https://www.npmjs.com/package/fhir-list-addresses) | careMESH | Utility function for extracting addresses
[hl7v2](https://www.npmjs.com/package/hl7v2) | panates | HL7 v2 parser, serializer, validator and TCP client/server.
[redox-hl7-v2](https://www.npmjs.com/package/@redoxengine/redox-hl7-v2) | Redox | This is Redox's battle-tested in-house HL7v2 parser/generator.


## Past Projects

The FHIR appplication server in this repository is the result of a decade of work; 100+ prototypes and pilots, the result of a million+ quality control tests, and the contributions of dozens of different organizations, ranging from big tech companies (Google Chrome, Facebook React) and javascript specific projects (Meteor, Material UI) to healthcare specific companies (HL7, Vermonster, Asymmetrik, SmartHealthIT, etc).   It represents a rich combination of functionality that is difficult to be found anywhere else.  It has been used to build personal health records, a longitudinal timeline that was published to the Apple App Store, patient charting software, clinical worklists, pharmacogenomics pipelines, medical imaging software, medical home hubs, and many more systems.  The code has been through a cybersecurity audit, and can be configured to be HIPAA and TEFCA compliant, as needed.

![BuiltWithNodeOnFHIR](https://user-images.githubusercontent.com/675910/143202912-afa95edd-16a3-4093-a69d-485068573ce8.jpg)


## Quickstart

```bash
# install the meteor compiler; this will take care of node, nvm, npm, yarn, etc.
# it will also set up debugging tools, a compiler build tool, etc
npm install -g meteor

# download the honeycomb application
cd honeycomb3

# install dependencies
meteor npm install

# alternative, use yarn if you'd like a more modern package manager
meteor yarn install

# run the application in local development mode
# this will automatically launch a mongo instance
meteor run --settings configs/settings.honeycomb.localhost.json

# can we get to the FHIR server yet?
open http://localhost:3000/metadata

# stop the application with Ctrl-C

# now try running it with some server configs
meteor run --settings configs/settings.fhir.server.json


# does it run?  can we get to the FHIR server?  To the Patient route?
open http://localhost:3000/baseR4/metadata
open http://localhost:3000/baseR4/Patient

# stop the application with Ctrl-C

# you'll need to add the package to the app
# QWERTY: removed internal reference to package name
meteor add <insert prefix here>:patient-chart-starter
meteor add <insert prefix here>:data-importer

# after adding the plugin, you can simply run the following
meteor run --settings configs/settings.honeycomb.localhost.json
```

## E2E Application Testing  

Honeycomb uses the Nightwatch testing harness for quality control, including validation and verification testing.  Nightwatch is a technology used and developed by Walmart, making it a complementary component to other components in the Honeycomb tech stack, such as Meta's React, and Google's Material UI.  Please refer to the following [tutorial for installing Nightwatch](https://nightwatchjs.org/guide/quickstarts/create-and-run-a-nightwatch-test.html)  

```bash
## You will begin by running the following npm command:
cd honeycomb3
npm init nightwatch

## Proceed with configuring nightwatch.
# This will install many device drivers, testing libraries, test runners, and all the necessary dependecies
❯ End-to-End testing
❯ JavaScript / Mocha
❯◯ Firefox
❯◯ Chrome
❯◯ Edge
❯◯ Safari
? Enter source folder where test files are stored (tests)
? Enter the base_url of the project (http://localhost:3000) 
❯ On localhost
? Allow Nightwatch to collect completely anonymous usage metrics? (y/N)
❯ No, skip for now

## Honeycomb comes with a nightwatch.conf.js file that has already been customized to work with Meteor.js
# Nightwatch doesn't provide an option to skip this step, and you don't want to overwrite the existing file
# So, instead, create a new file, name is something like ignore.conf.js
# Once done, delete these this file and don't check it into git.
? Overwrite the existing config file? 
❯ No, create a new one 
?Enter new config file name: ignore.conf.js

## Once completed, run the honeycomb nightwatch tests
npx nightwatch ./tests/nightwatch/honeycomb
```

## SMART on FHIR - Server Configuration

To register a client with the FHIR server, post a registration message like the following:

```js
// POST https://honeycomb.meteorapp.com/oauth/registration
{
    "client_id": "55555",
    "client_name": "Inferno",
    "scope": "launch/patient openid fhirUser offline_access patient/*.read",
    "redirect_uris": [
        "https://inferno.healthit.gov/suites/custom/smart/redirect"
    ]
}
```

Then open up the `/oauth-clients` page in the application.  You should see the client listed there.  

```bash
$ open http://localhost:3000/oauth-clients
```

## Important Links    

- [License](https://github.com/symptomatic/node-on-fhir/blob/master/LICENSE.md)
- [Change Log / Release History](https://github.com/symptomatic/node-on-fhir/releases)
- [Installation](https://github.com/symptomatic/node-on-fhir/blob/master/INSTALLATION.md)
- [Configuration Settings](https://github.com/symptomatic/node-on-fhir/blob/master/API.md)
- [Meteor Guide](https://guide.meteor.com/)
- [Getting Started with FHIR](https://www.hl7.org/fhir/modules.html).
- [Software Development Kit](https://github.com/symptomatic/software-development-kit)
- [Contributing](https://github.com/symptomatic/node-on-fhir/blob/master/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/symptomatic/node-on-fhir/blob/master/CODE_OF_CONDUCT.md)
- [Community Bridge Funding](https://funding.communitybridge.org/projects/node-on-fhir)
- [Quality Control](https://circleci.com/gh/symptomatic/node-on-fhir)
- [Material UI](https://material-ui.com/store/)
- [Example Plugin](https://github.com/clinical-meteor/example-plugin)
- [The 12-Factor App Methodology Explained](https://www.bmc.com/blogs/twelve-factor-app/)


## Technology Stack

![StackShare](https://user-images.githubusercontent.com/675910/143241422-a9d13558-0665-4e87-8f25-8257b4fcd393.png)


## References
- [Notice of Proposed Rulemaking to Improve the Interoperability of Health Information](https://www.healthit.gov/topic/laws-regulation-and-policy/notice-proposed-rulemaking-improve-interoperability-health)
- [Inferno ONC Program Edition](https://inferno.healthit.gov/)
- [Open Web Application Security Project (OWASP)](https://owasp.org/)

## Additional Notes
Private keys, special tokens, and internal URLs have been replaced with placeholders and/or comments that include the word "QWERTY". Search this codebase for "QWERTY" to locate code that needs modification before Honeycomb can be used.

## Public Release Statement
Honeycomb (Node on FHIR v3)
Approved for Public Release; Distribution Unlimited. Public Release Case Number 25-0219. Portions ©2025 The MITRE Corporation. ALL RIGHTS RESERVED. 
Date of Release: 5/3/2025
