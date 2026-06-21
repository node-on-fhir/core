# mitre:rosie-record-analyzer

This plugin implements a quality control scanner utility for `.sphr` file types, defined by the Standard Personal Health Record implementation guide. 

#### Demo  

[https://sphr.meteorapp.com/](https://sphr.meteorapp.com/)

#### Build the Utility

```bash
# download the Meteor on FHIR Community Server
git clone http://github.com/clinical-meteor/node-on-fhir

cd node-on-fhir
cd packages

# install the example plugin
git clone https://gitlab.mitre.org/awatson/rosie-record-analyzer

cd ..

# install dependencies
npm install


# run Node on FHIR  using the SPHR analyzer plugin
meteor run --settings packages/rosie-record-analyzer/configs/settings.example.json --extra-packages mitre:rosie-record-analyzer

# permanently add the example plugin to the project
meteor add mitre:rosie-record-analyzer
```

#### References  

- [Nivo - Sunburst](https://nivo.rocks/sunburst/)  
- [Nivo - NPM](https://www.npmjs.com/package/@nivo/sunburst)  
- [Patient Personas (Figma Designs; courtesy GoInvo)](https://www.figma.com/proto/MzUwuSOpldbZXQk4aYobgk/V2-Library?page-id=644%3A4036&node-id=1209%3A3415&viewport=-1016%2C-6578%2C0.38&scaling=contain&starting-point-node-id=1209%3A3269)  
- [GURPS Lite](http://www.sjgames.com/gurps/lite/3e/gurpslite.pdf)  