// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/
 
import { Button, CardContent, Typography } from '@mui/material';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import { Session } from 'meteor/session';

import { browserHistory } from 'react-router';
import { get } from 'lodash';

// import { parseString } from 'xml2js';
// import XLSX from 'xlsx';

import MedicalRecordImporter from '../lib/MedicalRecordImporter';



// import { render } from "react-dom";

  // import AceEditor from "react-ace";

  // import "ace-builds/src-noconflict/mode-java";
  // import "ace-builds/src-noconflict/theme-github";




  var myDropzone;

  function initCallback (dropzone) {
      myDropzone = dropzone;
  }



// //============================================================================
// // Sorting Collection 

// ImportCursor = new Mongo.Collection('ImportCursor', {connection: null});

//============================================================================
// Helper Components

function TabContainer(props) {
  return (
    <Typography component="div" >
      {props.children}
    </Typography>
  );
}
TabContainer.propTypes = {
  children: PropTypes.node.isRequired,
};


Session.setDefault('dataContent', '');
Session.setDefault('syncSourceItem', 1);
Session.setDefault('mappingAlgorithm', 1);


// ===================================================================================================================


export function JsonEditorComponent(props){
  console.log('JsonEditorComponent.props', props)

  const [tabIndex, setTabIndex] = useState(0);

  function handleTabChange(event, value){
    console.log('handleTabChange', event, value)
    setTabIndex(value);
  }

  function openFile(variable, event, value){
    console.log('Clicking on the drop zone to initiate selecting a file.')
    
    // Select File button simply clicks the hidden dropzone
    document.getElementsByClassName("dz-clickable")[0].click()

    // this.openDialog();
  }

  function parseCsvFile(dataContent){
    console.log('parseCsvFile', dataContent);
    console.log('mappingAlgorithm', Session.get('mappingAlgorithm'));

    let results = [];
    let worksheet = [];
    let orgs = [];

    if(Session.get('mappingAlgorithm') >= algorithmCount){
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = Session.get('mappingAlgorithm') - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);

      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(dataContent, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }
  }

  function parseExcelWorkbook(dataContent){
    console.log('parseExcelWorkbook', dataContent);

    let results = [];
    let worksheet = [];
    let orgs = [];


    if(Session.get('mappingAlgorithm') < algorithmCount){
      switch (Session.get('mappingAlgorithm')) {
        case 8:  // FHIR Endpoints
  
          Object.keys(dataContent).forEach(function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }

            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }

            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }

            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];

              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }

  
            if(cell.includes('A')){
              row.organization = dataContent[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = dataContent[cell].v;
            }
            if(cell.includes('B')){
              row.website = dataContent[cell].v;  

              let endpointId = Endpoints.insert({
                resourceType: "Endpoint",
                url: dataContent[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = dataContent[cell].v; 
              orgAddress.state = dataContent[cell].v; 
            }
            if(cell.includes('D')){
              row.city = dataContent[cell].v;  
              orgAddress.city = dataContent[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = dataContent[cell].v;  
              orgAddress.postalCode = dataContent[cell].v; 
            }
            if(cell.includes('F')){
              row.street = dataContent[cell].v;  
              orgAddress.line = dataContent[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = dataContent[cell].v;  
              cmioContact.name.text = dataContent[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = dataContent[cell].v;  
              cmioContact.telecom[0].value = dataContent[cell].v;
            }

            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }

            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });

          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          

          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;

          orgs.forEach(function(newOrg){
            if(count > 0){
              orgId = Organizations.insert(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                Endpoints.update({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })

          break;     
        default:
          MedicalRecordImporter.importBundle(dataContent);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = Session.get('mappingAlgorithm') - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);

      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(dataContent, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }

    console.log('results', results)           
  }

  function  parseExcelWorkbook(dataContent){
    console.log('parseExcelWorkbook', dataContent);

    let results = [];
    let worksheet = [];
    let orgs = [];


    if(Session.get('mappingAlgorithm') < algorithmCount){
      switch (Session.get('mappingAlgorithm')) {
        case 8:  // FHIR Endpoints
  
          Object.keys(dataContent).forEach(function(cell){ 
  
            // remove all non-numeric characters from the string
            let rowIndex = cell.replace(/\D/g,'');
  
            let row = {};
            if(worksheet[rowIndex]){
              row = worksheet[rowIndex];
            }

            let newOrganization = {
              resourceType: "Organization",
              active: true,
              name: "",
              telecom: [],
              address: [],
              contact: [],
              endpoint: []
            }

            let orgAddress = {
              use: 'work', 
              type: 'both',
              line: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
            let cmioContact = {
              name: {
                text: ''
              },
              telecom: [{
                value: '',
                system: 'url',
                use: 'work'
              }]
            }

            if(orgs[rowIndex]){
              newOrganization = orgs[rowIndex];

              if(get(newOrganization, 'address[0]')){
                orgAddress = get(newOrganization, 'address[0]');
                newOrganization.address = [];
              }
              if(get(newOrganization, 'contact[0]')){
                cmioContact = get(newOrganization, 'contact[0]');
                newOrganization.contact = [];
              }
            }

  
            if(cell.includes('A')){
              row.organization = dataContent[cell].v;  // each spreadsheet cell contains v, w, x, y, z properties
              newOrganization.name = dataContent[cell].v;
            }
            if(cell.includes('B')){
              row.website = dataContent[cell].v;  

              let endpointId = Endpoints.insert({
                resourceType: "Endpoint",
                url: dataContent[cell].v
              })
              if(endpointId){
                newOrganization.endpoint.push({
                  display: "Homepage",
                  reference: "Endpoint/" + endpointId
                })  
              }
            }
            if(cell.includes('C')){
              row.state = dataContent[cell].v; 
              orgAddress.state = dataContent[cell].v; 
            }
            if(cell.includes('D')){
              row.city = dataContent[cell].v;  
              orgAddress.city = dataContent[cell].v; 
            }
            if(cell.includes('E')){
              row.zipcode = dataContent[cell].v;  
              orgAddress.postalCode = dataContent[cell].v; 
            }
            if(cell.includes('F')){
              row.street = dataContent[cell].v;  
              orgAddress.line = dataContent[cell].v; 
            }
            if(cell.includes('G')){
              row.cmio = dataContent[cell].v;  
              cmioContact.name.text = dataContent[cell].v;
            }
            if(cell.includes('H')){
              row.cmio_linkedin = dataContent[cell].v;  
              cmioContact.telecom[0].value = dataContent[cell].v;
            }

            if(get(cmioContact, 'name.text')){
              newOrganization.contact.push(cmioContact)
            }
            if(orgAddress){
              newOrganization.address.push(orgAddress)
            }

            worksheet[rowIndex] = row;
            orgs[rowIndex] = newOrganization;
          });

          console.log('worksheet', worksheet)
          console.log('orgs', orgs);
          

          let count = 0;
          let orgId;
          let endpointString = '';
          let endpointId;

          orgs.forEach(function(newOrg){
            if(count > 0){
              orgId = Organizations.insert(newOrg, {validate: false, filter: false});  
              console.log('orgId', orgId);
              if(get(newOrg, 'endpoint[0].reference')){
                endpointString = get(newOrg, 'endpoint[0].reference');
                if(endpointString.includes("/")){
                  endpointId = endpointString.split("/")[1];
                } else {
                  endpointId = endpointString;
                }
                Endpoints.update({_id: endpointId}, {$set: {
                  managingOrganization: {
                    display: newOrg.name,
                    reference: "Organization/" + orgId
                  }
                }})
              }         
            }
            count++;
          })

          break;     
        default:
          MedicalRecordImporter.importBundle(dataContent);
          break;
      }
  
    } else {
      // we have a half dozen defaults, and then we drop into dynamicly loaded algorithms
      let packageCardinalityIndex = Session.get('mappingAlgorithm') - algorithmCount + 1;
      console.log('packageCardinalityIndex', packageCardinalityIndex);

      // specifically, the mappingAlgorithm is the half-dozen defaults plus the cardinality of the packages with ImportAlgorithms in alphabetical order
        let cardinality = 1;
        // to get the specified import algorithm, we loop through all the packages alphabetically, while counting up from 1
        Object.keys(Package).forEach(function(packageName){
        if(Package[packageName].ImportAlgorithm){
          console.log('Package[packageName]', Package[packageName])
          // if the cardinality of the alphabetical package matches that of the cardinality index
          if(cardinality === packageCardinalityIndex){
            console.log('found a match... ' + cardinality)
            // then we run that particular algorithm
            let importAlgorithm = Package[packageName].ImportAlgorithm;
            importAlgorithm.run(dataContent, function(){
              browserHistory.push('/questionnaires')
            })
          } else {
            // otherwise, we increment the cardinality counter (but only for those packages exporting an ImportAlgorithm)
            cardinality++;
            console.log('incrementing... ' + cardinality)
          }
        }    
      });
    }

    console.log('results', results)           
  }

  function importFile(variable, event, value){
    console.log("Let's try to import a file...")
    var self = this;

    var dataContent = Session.get('dataContent');

    // make sure we're dealing with a json object
    if(typeof dataContent === 'string'){
      console.log('This appears to be a string.  ', dataContent);
      dataContent = JSON.parse(dataContent);        
      console.log('Converting to object', dataContent);
    }

    console.log('file extension', get(this, 'data.import.fileExtension'));

    if(['csv'].includes(get(this, 'data.import.fileExtension'))){
      parseCsvFile(dataContent);
    }
    if(['xls', 'xlsx'].includes(get(this, 'data.import.fileExtension'))){
      parseExcelWorkbook(dataContent);
    }
    if(['xml'].includes(get(this, 'data.import.fileExtension'))){
      console.log('XML parser not impleted yet.');

      let document = Session.get('dataContent');

      if(document){
        delete document.$;

        console.log('Looks like we managed to parse the XML into JSON', document);
        ClinicalDocuments.insert(document);  
      } else {
        console.log("Doesn't look like we were able to parse the XML.")
      }

    }
    if(['json', 'fhir', 'ccd', 'bundle', 'txt'].includes(this.data.import.fileExtension)){
      console.log("This appears to be a JSON or FHIR file.  Parsing...")
      console.log('File contents: ', dataContent);

      switch (Session.get('mappingAlgorithm')) {
        case 1:  // FHIR Bundle
          MedicalRecordImporter.importBundle(dataContent);
          break;      
        case 2:  // FaceBook
          this.parseFacebookProfile(dataContent);
          break;      
        case 3:  // Chicago Grocers File
          this.parseChicagoGrocersFile(dataContent);
          break;
        default:
          MedicalRecordImporter.importBundle(dataContent);
          break;
      }
      
    }

    console.log('File imported.')

    if(['iPad'].includes(window.navigator.platform)){
      browserHistory.push('/continuity-of-care')
    }
  }

  function handleChangeMappingAlgorithm(event, index, value, foo){
    console.log('handleChangeMappingAlgorithm', event, index, value, foo)
    Session.set('mappingAlgorithm', value)
  }
  
  function handleChangeSyncSource(event, index, value){
    console.log('handleChangeSyncSource', event, index, value)
    Session.set('syncSourceItem', value)
  }

  function clearImportBuffer(){
    Session.set('dataContent', '');
  }

  function clearLocalCache(){
    if(confirm("Are you absolutely sure?")){

      var resourceTypes = [
        'AllergyIntolerances',
        'CarePlans',
        'Conditions',
        'Consents',
        'Contracts',
        'Communications',
        'ClinicalImpressions',
        'Devices',
        'DiagnosticReports',
        'Goals',
        'Immunizations',
        'ImagingStudies',
        'Locations',
        'Medications',
        'MedicationOrders',
        'MedicationStatements',
        'Organizations',
        'Observations',
        'Patients',
        'Practitioners',
        'Persons',
        'Procedures',
        'Questionnaires',
        'QuestionnaireResponses',
        'RiskAssessments',
        'RelatedPersons',
        'Substances',
        'Sequences'
      ];

      resourceTypes.forEach(function(resourceType){
        if(Mongo.Collection.get(resourceType)){
          Mongo.Collection.get(resourceType).find().forEach(function(record){
            Mongo.Collection.get(resourceType).remove({_id: record._id})
            Mongo.Collection.get(resourceType)._collection.remove({_id: record._id})
          })
        }
      })

      // rpc-migration: ddp-straggler
      Meteor.call('getServerStats', function(error, result){
        if(result){
          Session.set('datalakeStats', result);
        }
      });
    }
  }

  function openDialog () {
    console.log('openDialog')
    document.getElementById("importDataButton").click()
  }

  function changeInput(variable, event, value){
    Session.set(variable, value);
  }  


  function callMethod(signature){
    console.log("callMethod", signature);

    // rpc-migration: ddp-straggler
    Meteor.call(signature);
  }

  function onChange(newValue) {
    console.log("JsonEditorComponent.onChange", newValue);
  }

  return(
    <CardContent>  
      <textarea 
        id="dropzonePreview"
        value={JSON.stringify({
          id: 1,
          resourceType: "Bundle",
          text: "json.toString"
        })}
        onChange= { this.handleTextareaUpdate }
        style={{width: '100%', position: 'relative', height: '400px', minHeight: '200px', backgroundColor: 'inherit', color: 'inherit', borderColor: 'inherit', borderRadius: '4px', lineHeight: '16px'}}
        />

      {/* <AceEditor
        placeholder="Placeholder Text"
        mode="json"
        theme="tomorrow"
        name="exportBuffer"
        // onLoad={this.onLoad}
        onChange={ onChange.bind(this) }
        fontSize={14}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        //value={ get(this, 'data.import.data') }
        value={JSON.stringify({
          id: 1,
          resourceType: "Bundle",
          text: "json.toString"
        })}
        setOptions={{
          enableBasicAutocompletion: false,
          enableLiveAutocompletion: false,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
        }}
        style={{width: '100%', position: 'relative', height: '400px', minHeight: '200px', backgroundColor: '#f5f5f5', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
      /> */}

      {/* <SelectField
        floatingLabelText="Mapping Algorithm"
        value={this.data.mappingAlgorithm}
        onChange={this.handleChangeMappingAlgorithm}
        fullWidth
      >
        <MenuItem value={1} id="import-algorithm-menu-item-1" key="import-algorithm-menu-item-1" primaryText="FHIR Bundle (Any)" />
        <MenuItem value={2} id="import-algorithm-menu-item-2" key="import-algorithm-menu-item-2" primaryText="FHIR Bundle - DSTU2" />
        <MenuItem value={3} id="import-algorithm-menu-item-3" key="import-algorithm-menu-item-3" primaryText="FHIR Bundle - STU3" />
        <MenuItem value={4} id="import-algorithm-menu-item-4" key="import-algorithm-menu-item-4" primaryText="FHIR Bundle - R4" />
        <MenuItem value={5} id="import-algorithm-menu-item-5" key="import-algorithm-menu-item-5" primaryText="Facebook Profile" />
        <MenuItem value={6} id="import-algorithm-menu-item-6" key="import-algorithm-menu-item-6" primaryText="City of Chicago Data File" />
        <MenuItem value={7} id="import-algorithm-menu-item-7" key="import-algorithm-menu-item-7" primaryText="Geojson" />
        <MenuItem value={8} id="import-algorithm-menu-item-8" key="import-algorithm-menu-item-8" primaryText="Spreadsheet - Endpoints" />
        { dynamicAlgorithmItems }
      </SelectField> */}

      <Button 
        id='importDataButton'
        onClick={ importFile.bind(this)}
        color="primary"
        variant="contained"
        fullWidth
      >Import!</Button>     
    </CardContent>
  );
}
export default JsonEditorComponent;
