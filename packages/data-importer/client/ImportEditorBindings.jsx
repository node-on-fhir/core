// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/
 
import React, { useState, useEffect, useCallback } from 'react';
import Promise from 'promise';

import PropTypes from 'prop-types';

import { 
  Button, 
  Card,
  CardContent, 
  CardHeader, 
  CardActions,
  Checkbox,
  Grid, 
  Typography,
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  useTheme as useMuiTheme
} from '@mui/material';

// import DropzoneComponent from 'react-dropzone-component';

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { HTTP } from 'meteor/http';

import { get, set, has, uniq, cloneDeep } from 'lodash';
import moment from 'moment';

import { parseString } from 'xml2js';
import xml2js from 'xml2js';
// import XLSX from 'xlsx';  // Unused - removed to avoid web worker conflicts with Rspack
// import JSZip from 'jszip';  // Unused - removed to avoid web worker conflicts with Rspack

import MedicalRecordImporter from '../lib/MedicalRecordImporter';

import { useTracker } from 'meteor/react-meteor-data';

import { CollectionManagement } from './CollectionManagement';
import PreviewDataCard from './PreviewDataCard';
import DataEditor from './DataEditor';

// Use Meteor.startup pattern for Router utilities
let useNavigate;
Meteor.startup(function(){
  if (window.ReactRouter) {
    useNavigate = window.ReactRouter.useNavigate;
  }
});


// import "ace-builds";
// import AceEditor from "react-ace";

// import "ace-builds/src-noconflict/mode-java";
// import "ace-builds/src-noconflict/theme-github";
// import "ace-builds/src-noconflict/ext-language_tools";

// import "ace-builds/src-noconflict/theme-tomorrow";
// import "ace-builds/src-noconflict/theme-monokai";

// import 'ace-builds/webpack-resolver'




import fileDialog from 'file-dialog'

import PapaParse from 'papaparse';


let DynamicSpacer;
let useTheme;
Meteor.startup(function(){
  DynamicSpacer = Meteor.DynamicSpacer;
  useTheme = Meteor.useTheme;
})

var myDropzone;

function initCallback (dropzone) {
  myDropzone = dropzone;
}

//============================================================================
// Collections

let collectionNames = [
  "AllergyIntolerances",
  "Appointments",
  "Bundles",
  "CarePlans",
  "CareTeams",
  "Claims",
  "CodeSystems",
  "Conditions",
  "Consents",
  "Contracts",
  "Communications",
  "CommunicationRequests",
  "Compositions",
  "ClinicalImpressions",
  "ClinicalDocuments",
  "Devices",
  "DiagnosticReports",
  "DocumentReferences",
  "Endpoints",
  "Encounters",
  "ExplanationOfBenefits",
  "FamilyMemberHistories",
  "Goals",
  "HealthcareServices",
  "Immunizations",
  "InsurancePlans",
  "ImagingStudies",
  "Lists",
  "Locations",
  "Measures",
  "MeasureReports",
  "Medications",
  "MedicationOrders",
  "MedicationStatements",
  "MessageHeaders",
  "Networks",
  "Observations",
  "Organizations",
  "OrganizationAffiliations",
  "Patients",
  "Persons",
  "Practitioners",
  "PractitionerRoles",
  "Procedures",
  "ProcedureRequests",
  "Provenances",
  "Questionnaires",
  "QuestionnaireResponses",
  "RelatedPersons",
  "Restrictions",
  "RiskAssessments",
  "SearchParameters",
  "Schedules",
  "ServiceRequests",
  "Sequences",
  "StructureDefinitions",
  "Tasks",
  "ValueSets",
  "VerificationResults"
]

let Patients;
let Compositions;

Meteor.startup(function(){
  const tryInit = function() {
    if (window.Collections) {
      collectionNames.forEach(function(collectionName){
        window[collectionName] = window.Collections[collectionName];
      });
    } else {
      setTimeout(tryInit, 200);
    }
  };
  tryInit();
});

// (Legacy theme object removed — component uses isDark / cardBgColor / cardTextColor instead)



// //============================================================================
// // Sorting Collection 

// ImportCursor = new Mongo.Collection('ImportCursor', {connection: null});


//============================================================================
// HELPER COMPONENTS

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

// ===================================================================================================================
// HELPER FUNCTIONS

function pluralizeResourceName(resourceTypeString){
  var pluralized = '';
  switch (resourceTypeString) {
    case 'Binary':          
      pluralized = 'Binaries';
      break;
    case 'Library':      
      pluralized = 'Libraries';
      break;
    case 'SupplyDelivery':      
      pluralized = 'SupplyDeliveries';
      break;
    case 'ImagingStudy':      
      pluralized = 'ImagingStudies';
      break;        
    case 'FamilyMemberHistory':      
      pluralized = 'FamilyMemberHistories';
      break;        
    case 'ResearchStudy':      
      pluralized = 'ResearchStudies';
      break;        
    default:
      pluralized = resourceTypeString + 's';
      break;
  }

  return pluralized;
}


// ===================================================================================================================
// SESSIONS


Session.setDefault('fileExtension', 'json');
Session.setDefault('importBuffer', '');
Session.setDefault('syncSourceItem', 1);
Session.setDefault('mappingAlgorithm', 1);




// ===================================================================================================================
// MAIN COMPONENT

export function ImportEditorBindings(props){
  const { theme: themeMode } = useTheme();
  const muiTheme = useMuiTheme();

  const navigate = useNavigate ? useNavigate() : null;

  // Get Honeycomb theme colors from settings (not Material-UI theme)
  const isDark = themeMode === 'dark';

  // Strip !important flags if present in settings
  const stripImportant = (str) => typeof str === 'string' ? str.replace(/\s*!important\s*$/, '') : str;

  // Theme-aware colors: use mode-specific defaults since settings file has dark mode values
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const subheaderColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  if(typeof logger === "undefined"){
    if(typeof props.logger === "object"){
      logger = props.logger;
    } else if(typeof window.logger === "object"){
      logger = window.logger;
    }
  }

  // logger.info('Rendering the ImportEditorBindings');
  // logger.verbose('symptomatic:data-management.client.ImportEditorBindings');
  // logger.data('ImportEditorBindings.props', {data: props}, {source: "ImportEditorBindings.jsx"});
  
  console.debug('Rendering the ImportEditorBindings');

  let [tabIndex, setTabIndex] = useState(0);
  let [upstreamSync, setUpstreamSync] = useState(get(Meteor, 'settings.public.meshNetwork.upstreamSync', ''));
  let [mappingAlgorithm, setMappingAlgorithm] = useState(0);  
  let [directoryPath, setDirectoryPath] = useState("");  
  let [scannedResourceTypes, setScannedResourceTypes] = useState([]); 
  let [resourcePreview, setResourcePreview] = useState({}); 
  let [readyToImport, setReadyToImport] = useState(false);
  let [isImporting, setIsImporting] = useState(false);
  let [progressValue, setProgressCount] = useState(0); 
  let [progressMax, setProgressMax] = useState(0); 
  let [importBuffer, setImportBuffer] = useState(""); 
  let [previewBuffer, setPreviewBuffer] = useState(""); 
  let [importAlgorithm, setImportAlgorithm] = useState("additive"); 

  let [autoSelectFirstPatient, setAutoSelectFirstPatient] = useState(true);

  let [selectedCollectionsToExport, setCollectionsToExport] = useState({});

  let [sendToDataWarehouse, setSendToDataWarehouse] = useState(false);
  let [importResults, setImportResults] = useState(null);
  // let [autoSelectFirstPatient, setAutoSelectFirstPatient] = useState(false);
  
  let [importedPatientCount, setImportedPatientCount] = useState(0);
  
  const [importQueue, setImportQueue] = useState([]); 

  
  const downloadLabel = 'Download!';

  let dynamicAlgorithmItems = [];
  let fileExtension = "json";
  let strigifiedImportBuffer = "";
  let strigifiedPreviewBuffer = "";
  let editWrapEnabled = false;
  // let importQueue = [];

  useTracker(function(){
    setImportBuffer(Session.get("importBuffer"));
  }, []);
  previewBuffer = useTracker(function(){
    return Session.get("previewBuffer");
  }, []);

  fileExtension = useTracker(function(){
    return Session.get("fileExtension");
  }, []);
  editWrapEnabled = useTracker(function(){
    return Session.get("editWrapEnabled");
  }, []);
  
  importedPatientCount = useTracker(function(){
    return Session.get("importedPatientCount") || 0;
  }, []);

  

  let importQueueLength = 0;
  if(Array.isArray(importQueue)){
    importQueueLength = importQueue.length;
    console.debug('ImportEditorBindings.importQueueLength', importQueueLength)
  }

  if(['csv', 'xml', 'xmlx', 'xlsx', 'json', 'ccd', 'bundle', 'txt', 'application/json', 'application/csv', 'application/json+fhir'].includes(fileExtension)){
    strigifiedPreviewBuffer = JSON.stringify(previewBuffer, null, 2);
  }

  strigifiedImportBuffer = useTracker(function(){    
    const buffer = Session.get("importBuffer");
    if(buffer){
      // Don't try to stringify ArrayBuffer or binary data
      if(buffer instanceof ArrayBuffer || buffer instanceof Uint8Array){
        return "[Binary Data - Apple Health Export]";
      }
      try {
        return JSON.stringify(buffer, null, 2);
      } catch(e) {
        return String(buffer);
      }
    } else {
      return "";
    }
  }, []);


  //---------------------------------------------------------------------
  // Queue Runner (Eager, Throttled)  

  
  useEffect(() => {
    console.debug('PreviewDataCard.useEffect()')

    const queueMonitor = Meteor.setInterval(function(){
      // if(['debug', 'trace'].includes(get(Meteor, 'settings.public.loggingThreshold'))){
      //   console.trace('Queue Monitor:: ' + new Date() + " - Ready to Import: " + readyToImport)
      // }
      
      if(readyToImport){        
        importNextFile();
      }
    }, 300);  

    return () => Meteor.clearInterval(queueMonitor);
  }, [readyToImport]);




  //---------------------------------------------------------------------
  // Import Queue Pagination


  const [page, setPage] = useState(0);
  const [rowsPerPageToRender, setRowsPerPage] = useState(5);
  const [showPreviewData, setShowPreviewData] = useState(false);
  const [appleHealthTimeRange, setAppleHealthTimeRange] = useState('all');
  const [showAppleHealthOptions, setShowAppleHealthOptions] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  let paginationCount = 0;
  if(Array.isArray(importQueue)){
    paginationCount = importQueue.length;
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }


  let paginationFooter;
  if(!props.disablePagination){
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      // rowsPerPageOptions={['']}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPageToRender}
      page={page}
      onPageChange={handleChangePage}
      style={{float: 'right', border: 'none'}}
    />
  }

  //---------------------------------------------------------------------
  // Helper Functions


  function openFile(variable, event, value){
    logger.debug('Clicking on the drop zone to initiate selecting a file.')
    
    // Select File button simply clicks the hidden dropzone
    document.getElementsByClassName("dz-clickable")[0].click()

    // this.openDialog();
  }
  function processFileList(fileList){
    console.log('ImportEditorBindings.processFileList()', fileList)

      let promises = Object.keys(fileList).map(function(fileIndex){

        return new Promise(function (resolve, reject) {
          const currentFile = fileList[fileIndex];
          const fileType = currentFile.type || currentFile.name.split(".").pop();
          const isZipFile = ['application/zip', 'application/x-zip-compressed', 'zip'].includes(fileType) || currentFile.name.endsWith('.zip');

          // Detect Apple Health export.xml - large XML files or specifically named export.xml
          const isAppleHealthXml = (currentFile.name === 'export.xml' ||
                                   currentFile.name.toLowerCase().includes('apple') && currentFile.name.endsWith('.xml')) &&
                                   currentFile.size > 1000000; // > 1MB suggests Apple Health data

          var reader = new FileReader();
          reader.onload = function(event){

            let newQueueItem = {
              name: currentFile.name,
              lastModifiedDate: currentFile.lastModifiedDate,
              size: currentFile.size,
              type: fileType,
              status: 'loaded'
            }

            console.log('FileReader.currentFile', currentFile);
            console.log('FileReader.newQueueItem', newQueueItem);

            if(isZipFile){
              // Handle Apple Health export zip files
              console.log('Processing Apple Health export zip file as ArrayBuffer');
              const arrayBuffer = event.target.result;
              newQueueItem.content = arrayBuffer;
              newQueueItem.isAppleHealthExport = true;
              setShowAppleHealthOptions(true);

              // Pre-analyze the Apple Health export
              MedicalRecordImporter.analyzeAppleHealthExport(arrayBuffer).then(analysis => {
                if (!analysis.error) {
                  // Store the analysis for display
                  Session.set('appleHealthAnalysis', analysis);
                }
              }).catch(err => {
                console.error('Error analyzing Apple Health export:', err);
              });

              resolve(newQueueItem);
            } else if(isAppleHealthXml) {
              // Handle standalone Apple Health export.xml files
              console.log('Processing Apple Health export.xml file');
              var content = event.target.result;

              // Verify it's actually an Apple Health XML by checking for DOCTYPE
              if(content.includes('<!DOCTYPE HealthData') || content.includes('HealthKit Export Version')) {
                console.log('Confirmed Apple Health XML structure');
                newQueueItem.content = content;
                newQueueItem.type = 'xml';
                newQueueItem.isAppleHealthExport = true;
                newQueueItem.isAppleHealthXml = true;
                setShowAppleHealthOptions(true);

                logger.trace('FileReader.newQueueItem', newQueueItem);
                resolve(newQueueItem);
              } else {
                console.log('Large XML file but not Apple Health format, treating as standard XML');
                // Fall through to standard XML handling below
                parsedContent = content;
                newQueueItem.content = parsedContent;
                logger.trace('FileReader.newQueueItem', newQueueItem);
                resolve(newQueueItem);
              }
            } else {
              var content = event.target.result;   
              console.log('content', content);
              
              var parsedContent;

              if(newQueueItem.type === "text/csv"){
                // Disable workers to avoid Rspack bundling issues
                parsedContent = PapaParse.parse(content, { worker: false });
                newQueueItem.content = parsedContent.data;
              } else if(['application/json', 'application/json+fhir'].includes(newQueueItem.type)){
                parsedContent = JSON.parse(content); 
                newQueueItem.content = parsedContent;
              } else if(['phr', 'application/phr', 'ndjson', 'application/x-ndjson', 'application/ndjson', 'application/ndjson+fhir'].includes(newQueueItem.type)){
                let newlineArray = content.split('\n');

                console.log('newlineArray', newlineArray)
                console.log('newlineArray.length', newlineArray.length)

                if(Array.isArray(newlineArray)){
                  newQueueItem.content = [];
                  newlineArray.forEach(function(line){
                    // console.log('line', line)
                    if(line){
                      console.log('line', line)
                      let parsedContent = JSON.parse(line);
                      console.log('parsedContent', parsedContent)
    
                      newQueueItem.content.push(parsedContent);  
                    }
                  })
                }
              }

              logger.trace('FileReader.newQueueItem', newQueueItem);
              resolve(newQueueItem)
            }
          };

          // Read zip files as ArrayBuffer, everything else as text
          if(isZipFile){
            reader.readAsArrayBuffer(currentFile);
          } else {
            reader.readAsText(currentFile);
          }             
        });
      })

      Promise.all(promises).then(function(collatedData){
        //do something with all the results
        logger.trace('collatedData', collatedData)

        setImportQueue(collatedData);
        // Session.set('importQueue', collatedData)
        Session.set('lastUpdated', new Date())
      });
  }

  function selectFiles(variable, event, value){
    logger.debug('ImportEditorBindings: Selecting files.')
    fileDialog({ multiple: true }, function(fileList){
      processFileList(fileList);
    });
  }

  function handleDragOver(event){
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(event){
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(event){
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    if(event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0){
      processFileList(event.dataTransfer.files);
    }
  }

  function changeMappingAlgorithm(event){
    logger.debug('changeMappingAlgorithm', event.target.value);
    setMappingAlgorithm(event.target.value);
  }
  function mapData(){
    if(!importBuffer){
      importBuffer = Session.get('importBuffer');
    }
    console.log("Mapping data from the import buffer using mapping algorithm " + mappingAlgorithm + ".")    

    switch (mappingAlgorithm) {
      case 0:  // FHIR Bundle
        Session.set('previewBuffer', importBuffer);
        MedicalRecordImporter.importBundle(importBuffer);
        break;
      case 1:  // Apple Health Export
        console.log('Processing Apple Health Export with time range:', appleHealthTimeRange);
        if(importBuffer && typeof importBuffer === 'object') {
          MedicalRecordImporter.importAppleHealthExport(importBuffer, {
            timeRange: appleHealthTimeRange,
            includeWorkouts: true,
            includeClinicalRecords: true,
            includeHealthRecords: true
          }).then(result => {
            if(result.success) {
              console.log('Apple Health import successful');
              Session.set('lastUpdated', new Date());
            } else {
              console.error('Apple Health import failed:', result.error);
            }
          });
        }
        break;      
      case 4:  // FaceBook
        parseFacebookProfile(importBuffer);
        break;      
      case 5:  // Chicago Grocers File
        parseChicagoGrocersFile(importBuffer);
        break;
      case 7:  // CDC Reporting File (Covid19)
        if(Array.isArray(importBuffer)){
          importBuffer.forEach(async function(row, index){
            // console.log('Upserting row ' + index);

            let newReport = {
              resourceType: "MeasureReport",
              id: Random.id(),
              status: "complete",
              type: "summary",
              measure: Meteor.absoluteUrl() + '/baseR4/Measure/' + Session.get('selectedMeasureId'),
              subject: get(Meteor, 'settings.public.saner.location', null),
              date: new Date(),
              reporter: get(Meteor, 'settings.public.saner.reporter', null),
              // period: {
              //   start: "2020-04-07T00:00:00.000Z",
              //   end: "2020-04-07T00:00:00.000Z"
              // },
              group: [{
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numTotBeds"
                    }
                  ],
                  "text": "Total number of all Inpatient and outpatient beds, including all staffed, ICU, licensed, and overflow(surge) beds used for inpatients or outpatients."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numbeds"
                    }
                  ],
                  "text": "Inpatient beds, including all staffed, licensed, and overflow(surge) beds used for inpatients."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numBedsOcc"
                    }
                  ],
                  "text": "Total number of staffed inpatient beds that are occupied."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numICUBeds"
                    }
                  ],
                  "text": "Total number of staffed inpatient intensive care unit (ICU) beds."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numICUBedsOcc"
                    }
                  ],
                  "text": "Total number of staffed inpatient ICU beds that are occupied."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numVent"
                    }
                  ],
                  "text": "Total number of ventilators available."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numVentUse"
                    }
                  ],
                  "text": "Total number of ventilators in use."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19HospPats"
                    }
                  ],
                  "text": "Patients currently hospitalized in an inpatient care location who have suspected or confirmed COVID-19."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19MechVentPats"
                    }
                  ],
                  "text": "Patients hospitalized in an NHSN inpatient care location who have suspected or confirmed COVID - 19 and are on a mechanical ventilator."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19HOPats"
                    }
                  ],
                  "text": "Patients hospitalized in an NHSN inpatient care location with onset of suspected or confirmed COVID - 19 14 or more days after hospitalization."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19OverflowPats"
                    }
                  ],
                  "text": "Patients with suspected or confirmed COVID-19 who are in the ED or any overflow location awaiting an inpatient bed."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19OFMechVentPats"
                    }
                  ],
                  "text": "Patients with suspected or confirmed COVID - 19 who are in the ED or any overflow location awaiting an inpatient bed and on a mechanical ventilator."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              },
              {
                "code": {
                  "coding": [
                    {
                      "system": "http://build.fhir.org/ig/AudaciousInquiry/saner-ig",
                      "code": "numC19Died"
                    }
                  ],
                  "text": "Patients with suspected or confirmed COVID-19 who died in the hospital, ED, or any overflow location."
                },
                "population": [
                  {
                    "code": {
                      "coding": [
                        {
                          "system": "http://terminology.hl7.org/CodeSystem/measure-population",
                          "code": "initial-population",
                          "display": "Initial Population"
                        }
                      ]
                    },
                    "count": 0
                  }
                ],
                "measureScore": {
                  "value": 0
                }
              }]
            }        

            console.log('newReport', newReport)

            await MeasureReports.upsertAsync({_id: newReport._id}, {$set: newReport}, {filter: false, validate: false});
          })
        }
        setScannedResourceTypes(["MeasureReport"]);
      break;
      case 9:  // Inpatient Prospective Payment System File  
        if(Array.isArray(importBuffer)){

          importBuffer.forEach(async function(row, index){
            console.log('Upserting row ' + index);

            let newOrganization = {
              id: row[1],
              identifier: [{
                value: row[1],
                type: {
                  text: 'CMS Certification Number (CCN)'
                }
              }, {
                value: row[7],
                type: {
                  text: 'Hospital Referral Region (HRR) Description'
                }
              }],
              active: true,
              type: [{
                text: 'Inpatient Prospective Payment System (IPPS)',
                coding: [{
                  code: 'IPPS',
                  display: 'Inpatient Prospective Payment System'
                }]
              }],
              name: row[2],
              telecom: [],
              address: [{
                line: [row[3]],
                city: row[4],
                state: row[5],
                postalCode: row[6]
              }]            
            }

            await Organizations.upsertAsync({id: newOrganization.id}, {$set: newOrganization});
          })
          console.log('Total number of organizations imported: ' + Organizations.find().count())
        }
        setScannedResourceTypes(["Organization"]);
        break;
      case 10:  // Chicago Grocers File
        if(Array.isArray(importBuffer)){

          importBuffer.forEach(async function(row, index){
            console.log('Upserting row ' + index);

            let newLocation = {
              resourceType: 'Location',
              id: row[1],
              identifier: {
                  value: row[1],
                  use: 'CCN',
                  // system: 'http://www.oshpd.ca.gov/HID/Facility-Listing.html'
              },
              name: row[1],
              mode: 'instance',
              type: [],
              address: {
                  use: 'work',
                  type: row[8],
                  line: [row[2]],
                  city: row[3],
                  state: row[4],
                  postalCode: row[6]
              },
              managingOrganization: {
                display: row[11]
              },
              position: {
                  longitude: row[9],
                  latitude: row[10]
              }
          };

            await Locations.upsertAsync({id: newLocation.id}, {$set: newLocation});
          })
          // console.log('Total number of locations imported: ' + Locations.find().count())
        }

        setScannedResourceTypes(["Location"]);  
        break;
      case 11:  // LOINC Questionnaire
        console.log('Trying to parse the following buffer as a LOINC Questionnaire.', importBuffer)

        let newQuestionnaire = {
          _id: Random.id(),
          id: 'LOINC-' + get(importBuffer, 'code'),
          status: 'draft',
          resourceType: 'Questionnaire',
          title: get(importBuffer, 'name'),
          name: get(importBuffer, 'name'),
          copyright: get(importBuffer, 'copyrightNotice'),
          identifier: [],
          code: [],
          item: []
        }

        if(get(importBuffer, 'identifier')){
          newQuestionnaire.identifier.push({
            system: "LOINC",
            value: get(importBuffer, 'identifier')
          })
        }

        if(get(importBuffer, 'codeList[0].code')){
          newQuestionnaire.code.push({
            system: "LOINC",
            code: get(importBuffer, 'codeList[0].code'),
            display: get(importBuffer, 'codeList[0].display'),
          })
        }

        if(Array.isArray(importBuffer.items)){
          importBuffer.items.forEach(function(sectionItem){
            let transformedItem = {
              linkId: get(sectionItem, 'questionCode'),
              text: get(sectionItem, 'question'),
              type: get(sectionItem, 'dataType'),
              item: []
            }

            if(Array.isArray(sectionItem.items)){
              sectionItem.items.forEach(function(questionItem){
                let newQuestionItem = {
                  linkId: get(sectionItem, 'questionCode'),
                  text: get(questionItem, 'question'),
                  type: get(questionItem, 'dataType'),
                  answerOption: []
                }

                if(Array.isArray(questionItem.answers)){
                  questionItem.answers.forEach(function(answer){
                    newQuestionItem.answerOption.push({
                      valueCoding: {
                        system: 'LOINC',
                        code: get(answer, 'code'),
                        display: get(answer, 'text'),
                      }
                    })
                  })
                }
                transformedItem.item.push(newQuestionItem)
              })
            }

            newQuestionnaire.item.push(transformedItem)
          })
        }      

        Session.set('previewBuffer', newQuestionnaire)
        break;
      default:
        MedicalRecordImporter.importBundle(previewBuffer);
        break;
    }
  }

  function digestData(editorContent, fileExtension, selectedAlgorithm, appleHealthOptions){
    console.log('================================================================')
    console.log('DIGESTING DATA')
    console.log('digestData.editorContent', editorContent)
    console.log('digestData.selectedAlgorithm', selectedAlgorithm)
    console.log('digestData.fileExtension', fileExtension)
    console.log('')

    // For Apple Health Export (algorithm 1), we need the raw data (ArrayBuffer or XML string)
    if(selectedAlgorithm === 1){
      // Check if we have the ArrayBuffer in the import buffer (ZIP file)
      if(importBuffer instanceof ArrayBuffer){
        console.log('Using ArrayBuffer from importBuffer for Apple Health Export (ZIP)');
        editorContent = importBuffer;
      }
      // Check if we have Apple Health XML string (standalone export.xml)
      else if(typeof importBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(importBuffer)){
        console.log('Using XML string from importBuffer for Apple Health Export (XML)');
        editorContent = importBuffer;
      }
      // Fallback to session
      else {
        const sessionBuffer = Session.get('importBuffer');
        if(sessionBuffer instanceof ArrayBuffer){
          console.log('Using ArrayBuffer from Session for Apple Health Export (ZIP)');
          editorContent = sessionBuffer;
        } else if(typeof sessionBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(sessionBuffer)){
          console.log('Using XML string from Session for Apple Health Export (XML)');
          editorContent = sessionBuffer;
        } else {
          console.error('Apple Health Export requires ArrayBuffer (ZIP) or XML string but none found');
          console.log('importBuffer type:', typeof importBuffer);
          console.log('sessionBuffer type:', typeof sessionBuffer);
        }
      }
    } else if(!editorContent){
      // Try to get from state first, then from session
      editorContent = importBuffer || Session.get('importBuffer');
    }
    //  else {
    //   Session.set('importBuffer', editorContent)
    // }


    let proxyUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', 'http://localhost:3000/baseR4')

    parseFileContents(editorContent, fileExtension, selectedAlgorithm, appleHealthOptions)

    switch (selectedAlgorithm) {
      case 2:
        console.log("Use case 2 - Bundle")
        MedicalRecordImporter.importBundle(editorContent, get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', "http://localhost:3000/baseR4"));        
        break;
      case 3:
        console.log("Use case 3 - Bulk Data")
        MedicalRecordImporter.importNdjson(editorContent, get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', "http://localhost:3000/baseR4"));        
        break;
      case 13:
        console.log("Use case 13 - Bundle (Collection)")
        MedicalRecordImporter.importBundleAsBundle(editorContent, get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', "http://localhost:3000/baseR4"));
        break;
      
      default:
        console.log("Default use case")
        break;
    }
  }

  function scanData(previewBuffer, cumulative){
    if(!previewBuffer){
      previewBuffer = Session.get('previewBuffer');
    }
    console.log("Scanning the preview buffer...", previewBuffer)
    console.log("preview buffer type...", typeof previewBuffer)
    
    // Skip scanning for ArrayBuffer (zip files)
    if(previewBuffer instanceof ArrayBuffer){
      console.log('Skipping scan for ArrayBuffer (likely a zip file)');
      return;
    }

    let resourceTypes = [];
    let preview = {};
    let patientCount = 0;

    // Handle NDJSON array format
    if(Array.isArray(previewBuffer)){
      console.log("Preview buffer is an array (NDJSON format)");
      previewBuffer.forEach(function(line){
        let parsedLine;
        try {
          if(typeof line === 'string'){
            parsedLine = JSON.parse(line);
          } else {
            parsedLine = line;
          }
          
          if(get(parsedLine, 'resourceType')){
            resourceTypes.push(get(parsedLine, 'resourceType'));
            if(!preview[get(parsedLine, 'resourceType')]){
              preview[get(parsedLine, 'resourceType')] = 1;
            } else {
              preview[get(parsedLine, 'resourceType')] = preview[get(parsedLine, 'resourceType')] + 1;
            }
            if(get(parsedLine, 'resourceType') === 'Patient'){
              patientCount++;
            }
          }
        } catch(e) {
          console.log('Error parsing NDJSON line in scanData:', e);
        }
      });
    } else {
      // Handle regular JSON/Bundle format
      if(typeof previewBuffer === "string"){
        try {
          previewBuffer = JSON.parse(previewBuffer);
        } catch(e) {
          console.log('Error parsing preview buffer:', e);
        }
      }
      
      if(get(previewBuffer, 'resourceType')){
        resourceTypes.push(get(previewBuffer, 'resourceType'));      
        preview[get(previewBuffer, 'resourceType')] = 1;
        if(get(previewBuffer, 'resourceType') === 'Patient'){
          patientCount = 1;
        }
      }
      if(get(previewBuffer, 'entry') && Array.isArray(get(previewBuffer, 'entry'))){
        previewBuffer.entry.forEach(function(entry){
          if(get(entry, 'resource.resourceType')){
            resourceTypes.push(get(entry, 'resource.resourceType'));    
            if(!preview[get(entry, 'resource.resourceType')]){
              preview[get(entry, 'resource.resourceType')] = 1
            } else {
              preview[get(entry, 'resource.resourceType')] = preview[get(entry, 'resource.resourceType')] + 1;
            }
            if(get(entry, 'resource.resourceType') === 'Patient'){
              patientCount++;
            }
          }
        })
      }
    }
    
    logger.debug("Collected the following resources: ", resourceTypes)
    // console.log("Collected the following resources: ", resourceTypes)

    let bundleResourceTypes = uniq(resourceTypes);
    logger.debug("Compacted into the following list: ", bundleResourceTypes)
    console.log("Compacted into the following list: ", bundleResourceTypes)
    console.log("Generated the following preview: ", preview)
    console.log("Found " + patientCount + " patients in the imported data");

    if(cumulative){
      bundleResourceTypes.push(scannedResourceTypes);
      logger.debug("Cumulative resources: ", bundleResourceTypes)
    }
    setScannedResourceTypes(bundleResourceTypes);
    setResourcePreview(preview);
    
    // Store patient count in session for UI display
    Session.set('importedPatientCount', patientCount);
  }

  function handleChangeImportAlgorithm(event, index, value, foo){
    console.log('handleChangeImportAlgorithm', event)
    setImportAlgorithm(event.target.value)
  }
  
  function clearImportQueue(){
    logger.debug('Clearing import queue.');

    setImportQueue([])
    setImportBuffer(false)
    setReadyToImport(false);
  }

  function toggleAutoImport(){
    if(!readyToImport){
      setReadyToImport(true);
      setProgressCount(0);  
      if(Array.isArray(importQueue)){
        setProgressMax(importQueue.length);  
      }
    } else {
      setReadyToImport(false);
    }
  }
  function importNextFile(callback){
    logger.debug("Importing next file in queue.")

    if(Array.isArray(importQueue)){
      if(importQueue.length > 0){

        // remove and return the first item in the array 
        importFile(importQueue.shift());
        Session.set('lastUpdated', new Date())
      } else {
        logger.debug("No items in queue.");
        setReadyToImport(false);
      }
    } else {
      logger.debug("Import queue not available.");
      setReadyToImport(false);
    }
  }




  async function parseFileContents(previewBuffer, fileExtension, mappingAlgorithm, appleHealthOptions){
    // do a quick scan to determine which resource types are being used

    console.log('--------------------------------------------------------')
    console.log('Parsing Data')
    console.log('previewBuffer type:', typeof previewBuffer);
    console.log('Is ArrayBuffer?', previewBuffer instanceof ArrayBuffer);
    console.log('mappingAlgorithm:', mappingAlgorithm);

    // PRIORITY 1: Check for Apple Health Export FIRST (before any JSON parsing attempts)
    // This handles both ZIP files (ArrayBuffer) and standalone export.xml (XML string)
    if(mappingAlgorithm === 1 ||
       previewBuffer instanceof ArrayBuffer ||
       (typeof previewBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(previewBuffer))) {

      console.log('Apple Health Export detected - processing...');

      if(previewBuffer instanceof ArrayBuffer) {
        // Handle ZIP file
        console.log('Processing Apple Health ZIP file (ArrayBuffer)');
        const importOptions = appleHealthOptions || {
          timeRange: 'all',
          includeWorkouts: true,
          includeClinicalRecords: true,
          includeHealthRecords: true
        };

        try {
          const result = await MedicalRecordImporter.importAppleHealthExport(previewBuffer, importOptions);
          if(result.success) {
            console.log('Apple Health ZIP import successful');
            Session.set('lastUpdated', new Date());
          } else {
            console.error('Apple Health ZIP import failed:', result.error);
          }
        } catch(error) {
          console.error('Error importing Apple Health ZIP:', error);
        }
        return; // Exit early - we're done
      }
      else if(typeof previewBuffer === 'string' && MedicalRecordImporter.isAppleHealthXml(previewBuffer)) {
        // Handle standalone XML file
        console.log('Processing Apple Health XML file (string)');
        const importOptions = appleHealthOptions || {
          timeRange: 'all',
          includeWorkouts: true,
          includeClinicalRecords: false, // XML doesn't have clinical-records folder
          includeHealthRecords: true
        };

        try {
          await MedicalRecordImporter.processAppleHealthXML(previewBuffer, importOptions);
          console.log('Apple Health XML import successful');
          Session.set('lastUpdated', new Date());
        } catch(error) {
          console.error('Error importing Apple Health XML:', error);
        }
        return; // Exit early - we're done
      }
    }

    // PRIORITY 2: Skip scanning for binary data (but not for Apple Health which we already handled)
    if(!(previewBuffer instanceof ArrayBuffer)){
      scanData(previewBuffer, true);
    }


    logger.debug('File mime type: ' + fileExtension);
    console.log('File mime type: ' + fileExtension);

    if(['csv', 'application/csv'].includes(fileExtension)){
      parseCsvFile(previewBuffer);
    } else if(['phr', 'application/phr', 'ndjson', 'application/x-ndjson'].includes(fileExtension)){
      logger.debug('NDJSON parser.....');

      console.log('Parsing NDJSON previewBuffer', previewBuffer)

      // Auto-select first patient from NDJSON if enabled
      if(autoSelectFirstPatient && previewBuffer && Array.isArray(previewBuffer)){
        let firstPatientFound = false;
        previewBuffer.forEach(function(line){
          if(!firstPatientFound){
            let parsedLine;
            try {
              if(typeof line === 'string'){
                parsedLine = JSON.parse(line);
              } else {
                parsedLine = line;
              }
              
              if(get(parsedLine, 'resourceType') === 'Patient'){
                Session.set('selectedPatient', parsedLine);
                Session.set('selectedPatientId', get(parsedLine, 'id'));
                firstPatientFound = true;
                console.log('Auto-selected patient from NDJSON file:', get(parsedLine, 'id'));
              }
            } catch(e) {
              console.log('Error parsing NDJSON line:', e);
            }
          }
        });
      }

      MedicalRecordImporter.importNdjson(previewBuffer, get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint', "http://localhost:3000/baseR4"));              
    } else if(['xls', 'xlsx'].includes(fileExtension)){
      parseExcelWorkbook(previewBuffer);
    } else if(['xml'].includes(fileExtension)){
      logger.debug('XML parser not impleted yet.');

      let document = Session.get('previewBuffer');

      if(document){
        delete document.$;

        logger.debug('Looks like we managed to parse the XML into JSON.', document);
        if(get(document, 'resourceType')){
          setScannedResourceTypes([get(document, 'resourceType')]);
          // TODO: need to pluralize
          await window[get(document, 'resourceType')].upsertAsync({id: document.id}, {$set: document});          
        }
      } else {
        logger.debug("Doesn't look like we were able to parse the XML.")
      }

    } else if(['json', 'fhir', 'ccd', 'bundle', 'txt', 'application/json', 'application/json+fhir'].includes(fileExtension)){
      logger.debug("Otherwise, we're going to assume that this is a JSON or FHIR file.  Parsing...")
      logger.debug('File contents: ', previewBuffer);
      logger.debug('ImportEditorBindings.MappingAlgorithm: ' + mappingAlgorithm);

      // When autoSelectFirstPatient is enabled, parse the imported data to find the first Patient
      if(autoSelectFirstPatient && previewBuffer){
        // First check if this is a single Patient resource
        if(get(previewBuffer, 'resourceType') === "Patient"){
          Session.set('selectedPatient', previewBuffer);
          Session.set('selectedPatientId', get(previewBuffer, 'id'));
          console.log('Auto-selected patient from imported file:', get(previewBuffer, 'id'));
        } 
        // If it's a Bundle, look for the first Patient in the entries
        else if(get(previewBuffer, 'resourceType') === "Bundle" && Array.isArray(get(previewBuffer, 'entry'))){
          parseBufferForPatientAndSetAsSelected(previewBuffer);
        }
        // Check for International Patient Summary composition
        if(get(previewBuffer, 'resourceType') === "Composition" && get(previewBuffer, 'title') === "International Patient Summary"){
          Session.set('textNormalForm', get(previewBuffer, 'text.div'));
        }
      }  

      if(typeof previewBuffer === "object"){
        switch (mappingAlgorithm) {
          case 1:  // FHIR Bundle
            MedicalRecordImporter.importBundle(previewBuffer);
            parseBufferForPatientAndSetAsSelected(previewBuffer);
            break;      
          case 2:  // FaceBook
            parseFacebookProfile(previewBuffer);
            break;      
          case 3:  // Chicago Grocers File
            parseChicagoGrocersFile(previewBuffer);
            break;
          case 13:  // Bundle (Collections, Synthea)
          MedicalRecordImporter.importBundleAsBundle(previewBuffer);
            break;
          default:
            MedicalRecordImporter.importBundle(previewBuffer);
            parseBufferForPatientAndSetAsSelected(previewBuffer);
            break;
        }
      }

      
    } else if(['ndjson', 'phr', 'sphr', 'application/ndjson', 'application/ndjson+fhir', 'application/phr', 'application/sphr'].includes(fileExtension)){
      logger.debug("Looks like a bulk data file in NDJSON or PHR format.  Parsing...")
      // logger.debug('File contents: ', previewBuffer);
      // logger.debug('ImportEditorBindings.MappingAlgorithm: ' + mappingAlgorithm);

      MedicalRecordImporter.importNdjson(previewBuffer);
    } else if(['application/zip', 'application/x-zip-compressed', 'zip'].includes(fileExtension) || previewBuffer instanceof ArrayBuffer){
      // Note: Apple Health Export (ZIP/ArrayBuffer) is now handled at the TOP of parseFileContents
      // This block should only be reached if it's NOT Apple Health (algorithm !== 1)
      console.log("Detected zip file or ArrayBuffer (non-Apple Health)");
      console.warn('Zip file detected but not Apple Health Export - no handler implemented');
    } else {
      logger.debug("Otherwise, we're going to assume that this is a JSON or FHIR file.  Parsing...")
      logger.debug('File contents: ', previewBuffer);


      switch (mappingAlgorithm) {
        case 0:  // FHIR Bundle
          MedicalRecordImporter.importBundle(previewBuffer);
          break;
        case 1:  // Apple Health Export
          // Note: Apple Health Export is now handled at the TOP of parseFileContents
          // This case should never be reached because we return early above
          console.warn('Apple Health Export case 1 reached - should have been handled at top of parseFileContents');
          break;
        case 2:  // FaceBook
          parseFacebookProfile(previewBuffer);
          break;
        case 3:  // Chicago Grocers File
          this.parseChicagoGrocersFile(previewBuffer);
          break;
        default:
          console.log('previewBuffer', previewBuffer);
          // Meteor.call('insertBundleIntoWarehouse', previewBuffer, Session.get('accountsAccessToken'), function(error, result){
          //   if(error){
          //     console.error('error while proxy inserting', error)
          //   }
          //   if(result){
          //     console.log('proxyInsert/result', result)
          //   }
          // })
          break;
      }
    }

    function parseBufferForPatientAndSetAsSelected(previewBuffer) {
      if (autoSelectFirstPatient) {
        let patientFound = false;
        
        if(Array.isArray(get(previewBuffer, 'entry'))){
          previewBuffer.entry.forEach(function (entry) {
            // Set the first Patient resource we find
            if (!patientFound && get(entry, 'resource.resourceType') === "Patient") {
              Session.set('selectedPatient', get(entry, 'resource'));
              Session.set('selectedPatientId', get(entry, 'resource.id'));
              patientFound = true; // Mark that we've found a patient
              console.log('Auto-selected patient from imported file:', get(entry, 'resource.id'));
            }
            if ((get(entry, 'resource.resourceType') === "Composition") && (get(entry, 'resource.title') === "International Patient Summary")) {
              Session.set('textNormalForm', get(entry, 'resource.text.div', ""));
            }          
          });
        }        
      }
    }
  }


  async function importFile(queueItem, resolve){
    logger.debug("Let's try to import a file...")
    console.log("Let's try to import a file...")

    var self = this;


    // if preview buffer doesn't exist
    if(!previewBuffer){
      previewBuffer = Session.get('previewBuffer');
      logger.debug("No preview data exists.  Loading from preview buffer.")
      console.log("No preview data exists.  Loading from preview buffer.")
    }

    // if no file extension, assume its JSON
    if(!fileExtension){
      fileExtension = 'json';

      if(Session.get('fileExtension')){
        fileExtension = Session.get('fileExtension');
      }
      logger.trace("No file extension exists.  Best guess:  " + fileExtension)
      console.log("No file extension exists.  Best guess:  " + fileExtension)
    }

    // make sure our inputs exist
    // content may be an array
    if(get(queueItem, 'content')){
      logger.debug("Queue content exists.  Loading preview data from queue.");
      console.log("Queue content exists.  Loading preview data from queue.");
      previewBuffer = get(queueItem, 'content');

      if(Array.isArray(previewBuffer)){
        console.log('Preview buffer content is an array.  Probably NDJSON.')
      }

    }
    if(get(queueItem, 'type')){
      fileExtension = get(queueItem, 'type');
    }
    
    // Check if this is an Apple Health export (zip or XML)
    if(get(queueItem, 'isAppleHealthExport')){
      console.log('Processing Apple Health Export file');
      // Set the mapping algorithm to Apple Health Export
      setMappingAlgorithm(1);

      // Check if this is XML or ZIP
      if(get(queueItem, 'isAppleHealthXml')) {
        // Handle standalone XML file
        console.log('Processing Apple Health XML file');
        const importOptions = {
          timeRange: appleHealthTimeRange,
          includeWorkouts: true,
          includeClinicalRecords: false, // XML doesn't have clinical-records folder
          includeHealthRecords: true
        };
        MedicalRecordImporter.processAppleHealthXML(previewBuffer, importOptions).then(() => {
          console.log('Apple Health XML import successful');
          Session.set('lastUpdated', new Date());
        }).catch(error => {
          console.error('Apple Health XML import failed:', error);
        });
      } else {
        // Handle ZIP file (ArrayBuffer)
        MedicalRecordImporter.importAppleHealthExport(previewBuffer, {
          timeRange: appleHealthTimeRange,
          includeWorkouts: true,
          includeClinicalRecords: true,
          includeHealthRecords: true
        }).then(result => {
          if(result.success) {
            console.log('Apple Health import successful');
            Session.set('lastUpdated', new Date());
          } else {
            console.error('Apple Health import failed:', result.error);
          }
        });
      }

      // Mark as completed
      if(typeof resolve === "function"){
        queueItem.status = "completed";
        resolve(queueItem);
      }
      return; // Exit early since we handled the import
    }
    
    // // make sure we're dealing with a json object
    // let previewObject;
    // if(typeof previewBuffer === 'string'){
    //   logger.trace('This appears to be a string.  ', previewBuffer);
    //   console.log('This appears to be a string.  ', previewBuffer);
    //   try {
    //     previewObject = JSON.parse(previewBuffer);        
    //     logger.trace('Converting to object', previewBuffer);          
    //     console.log('Converting to object', previewBuffer);          
    //   } catch (error) {
    //     logger.error('Error parsing JSON', error);                  
    //     console.log('Error parsing JSON', error);                  
    //   }
    // } else if(typeof previewBuffer === 'object'){
    //   previewObject = previewBuffer;
    // }
    // console.log('previewObject', previewObject);

    if(sendToDataWarehouse){
      console.log('[ImportEditorBindings] Sending to data warehouse...');
      Meteor.call('insertBundleIntoWarehouse', previewBuffer, {}, function(error, results) {
        if(error) {
          console.error('[ImportEditorBindings] Warehouse import error:', error);
          setImportResults({ error: error.reason || error.message });
        } else {
          console.log('[ImportEditorBindings] Warehouse import results:', results);
          setImportResults(results);
        }
      });
    } else {
      parseFileContents(previewBuffer, fileExtension, mappingAlgorithm)
    }

    logger.debug('File imported.')

    // if(['iPad'].includes(window.navigator.platform)){
    //   browserHistory.push('/continuity-of-care')
    // }

    if(typeof resolve === "function"){
      queueItem.status = "completed";
      resolve(queueItem)        
    }
  }

  function sendEachToServer(){
    console.log("Sending collection preview to data warehouse....", selectedCollectionsToExport);
    let channelUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint');
    if(channelUrl){
      if(typeof selectedCollectionsToExport === "object"){
        Object.keys(selectedCollectionsToExport).forEach(function(resourceName){
          
  
          if(selectedCollectionsToExport[resourceName] === true){
            let collectionName = pluralizeResourceName(resourceName);
            console.log('collectionName', collectionName);

            if(window[collectionName]){
              const records = window[collectionName].find().fetch();
              if(records.length > 0){
                records.forEach(function(record){
                  console.log('----------------------------------')
                  console.log('record', record);
                  let channelUrl = get(Meteor, 'settings.public.interfaces.fhirRelay.channel.endpoint');

                    console.log('channelUrl.length', channelUrl.length);

                    if(channelUrl[channelUrl.length] === "/"){
                      channelUrl = channelUrl.substring(0, channelUrl.length - 1);

                    }
                    console.log('channelUrl', channelUrl);

                    if(get(record, 'id')){
                      let putUrl = channelUrl + '/' + resourceName + "/" + get(record, 'id');
                      console.log('PUT ' + putUrl)

                      HTTP.put(putUrl, {data: record}, function(error, result){
                        if(error) {console.log('HTTP.put.error', error)}
                        if(result) {console.log('HTTP.put.result', result)}
                      })
                    } else {
                      let postUrl = channelUrl + '/' + resourceName;
                      console.log('POST ' + postUrl)
                      HTTP.post(postUrl, {data: record}, function(error, result){
                        if(error) {console.log('HTTP.put.error', error)}
                        if(result) {console.log('HTTP.put.result', result)}
                      })
                    }
                })
              }
            }
          }
        })
      }  
    } else {
      alert('No FhirRelay endpoint specified in settings file.')
    }
  }
  function sendTransactionBundleToServer(){
    console.log("Sending transaction bundle to data warehouse....");

  }


  function openDialog () {
    console.log('openDialog')
    document.getElementById("importDataButton").click()
  }

  function changeInput(variable, event, value){
    Session.set(variable, value);
  }  


  function handleTextareaUpdate(text){
    console.log('handleTextareaUpdate', text)
  }

  function onChange(newValue) {
    console.log("ImportEditorBindings.onChange", newValue);
  }

  function openFileTypeDialog(){

  }
  function selectImportQueueRow(item, event){
    console.log('selectImportQueueRow', item);

    Session.set("fileExtension", get(item, 'type'))
    Session.set('lastUpdated', new Date())

    // Set the import buffer with the file content
    if(get(item, 'content')){
      setImportBuffer(get(item, 'content'));

      // Only store in Session if it's NOT a large file (avoid EJSON size limits)
      // For Apple Health XML (100MB+) or large ZIP files, keep in component state only
      const contentSize = get(item, 'content.byteLength') || get(item, 'content.length') || 0;
      if(contentSize < 10 * 1024 * 1024) { // Less than 10MB
        Session.set('importBuffer', get(item, 'content'));
      } else {
        console.log('Skipping Session.set for large file (', (contentSize / 1024 / 1024).toFixed(2), 'MB), keeping in component state only');
        // Remove any existing importBuffer from Session to avoid confusion
        Session.set('importBuffer', null);
      }
    }

    // For Apple Health exports, set the mapping algorithm
    if(get(item, 'isAppleHealthExport')){
      setMappingAlgorithm(1);
    }
  }  
  function openPageUrl(url){
    console.log('openPageUrl', url)
    if (navigate) {
      navigate(url, { replace: true });
    }
  }
  
  
  function handleChangeMappingAlgorithm(event, index, value, foo){
    console.log('handleChangeMappingAlgorithm', event, index, value, foo)
    // Session.set('mappingAlgorithm', value)
  }


  function handleSelectFirstPatient(){
    console.log('handleAutoSelectFirstPatient', autoSelectFirstPatient)
    setAutoSelectFirstPatient(!autoSelectFirstPatient);
  }
  function setFirstPatientAsSelected(){
    autoSelectFirstPatient(true, previewBuffer);
  }
  function toggleSendToDataWarehouse(event, newValue){
    // console.log('toggleSendToDataWarehouse', event.currentTarget.value, newValue)
    setSendToDataWarehouse(newValue)
  }
  function toggleAutoSelectPatient(event, newValue){
    console.log('toggleAutoSelectPatient', event.currentTarget.value, newValue)
    setAutoSelectFirstPatient(newValue)
  }
  async function sendBundleToDataWarehouse() {
    console.log('Sending to data warehouse....');

    // replace with fetch to /metadata route
    // which will return Meteor.settings.private.fhir.rest object instead

    let resourceList = get(Meteor, 'settings.public.capabilityStatement.resourceTypes');
    if(Array.isArray(resourceList)){
      for(const resourceType of resourceList){

        let pluralizedCollectionName = MedicalRecordImporter.pluralizeResourceName(resourceType);
          console.log('ImportEditorBindings.pluralizedCollectionName', pluralizedCollectionName)

          if(window[pluralizedCollectionName] && window[pluralizedCollectionName]._collection){
            // Use synchronous fetch() on client-side cursors
            const records = window[pluralizedCollectionName]._collection.find().fetch();
            console.log(`Found ${records.length} records in ${pluralizedCollectionName}`);

            for(const record of records){
              try {
                const res = await new Promise((resolve, reject) => {
                  Meteor.call('proxyInsertResource', record, function(err, result){
                    if(err) {
                      console.log('proxyInsert.err', err);
                      reject(err);
                    } else {
                      resolve(result);
                    }
                  });
                });

                if(res){
                  await window[pluralizedCollectionName].removeAsync({_id: record._id})
                }
              } catch(error) {
                console.error('Error processing record:', error);
              }
            }
          } else {
            console.log('Collection not found or missing _collection:', pluralizedCollectionName);
          }
      }
    }

  }

  let linkStyle = {
    marginLeft: '20px', 
    textDecoration: 'underline', 
    position: 'relative', 
    top: '-8px', 
    cursor: 'pointer', 
    color: muiTheme.palette.primary.main
  }


  let importQueueRowsToRender = [];
  let importQueueRows = [];
  if(Array.isArray(importQueue)){
    if(importQueue.length > 0){     
      let count = 0;    
      importQueue.forEach(function(queueItem){
        if((count >= (page * rowsPerPageToRender)) && (count < (page + 1) * rowsPerPageToRender)){
          importQueueRowsToRender.push(queueItem);
        }
        count++;
      });  
    }
    
    if(Array.isArray(importQueueRowsToRender)){
      // console.log('ImportQueue is an array.', importQueueRowsToRender)
      importQueueRowsToRender.forEach(function(item, index){
        importQueueRows.push(<TableRow key={"importQueueRow-" + index} hover={true} onClick={selectImportQueueRow.bind(this, item)} style={{cursor: 'pointer', color: cardTextColor}} >
          {/* <TableCell>{index}</TableCell> */}
          <TableCell>
            {get(item, 'name')}<br />
            {moment(get(item, 'lastModifiedDate')).format('YYYY-MM-DD hh:mm')}
          </TableCell>
          <TableCell>{get(item, 'size')}</TableCell>
          {/* <TableCell style={{minWidth: '160px'}}>{moment(get(item, 'lastModifiedDate')).format('YYYY-MM-DD hh:mm')}</TableCell> */}
        </TableRow>)
      })
    }  
  }


  let queueToggleText = "Parse items in queue";
  let queueButtonColor;
  if(readyToImport){
    queueToggleText = "Stop Processing"
    queueButtonColor = "default";
  } else {
    queueButtonColor = "primary";
  }

  let marginBottom = 84; 
  if(Meteor.isCordova){
    marginBottom = 0;
  }

  

  let headerHeight = Meteor.LayoutHelpers.calcHeaderHeight();
  let formFactor = Meteor.LayoutHelpers.determineFormFactor();
  let paddingWidth = Meteor.LayoutHelpers.calcCanvasPaddingWidth();

  let cardWidth = window.innerWidth - paddingWidth;

  return(

      <div id="ImportCanvas" style={{"height": window.innerHeight }} >

        <Grid container spacing={4} justify='center' style={{marginBottom: '100px'}}>
          <Grid item xs={12} md={8} style={{width: '100%'}}>
            <CardHeader title="FILE SYSTEM" />

            <Card
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              width={cardWidth + 'px'}
              sx={{
                bgcolor: cardBgColor,
                color: cardTextColor,
                border: isDragOver
                  ? (isDark ? '2px dashed rgba(255,255,255,0.5)' : '2px dashed #888')
                  : (isDark ? '2px dashed rgba(255,255,255,0.2)' : '2px dashed #C7C7C7'),
                minHeight: 'calc(100vh - 200px)',
                transition: 'border-color 0.2s ease',
                '& .MuiTableCell-root': {
                  color: cardTextColor,
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                },
                '& .MuiCheckbox-root': { color: cardTextColor },
                '& .MuiTablePagination-root': { color: cardTextColor },
                '& .MuiTablePagination-selectLabel': { color: cardTextColor },
                '& .MuiTablePagination-displayedRows': { color: cardTextColor },
                '& .MuiSelect-icon': { color: cardTextColor }
              }}
            >
              <CardContent>
                <Button
                  id='selectFileButton'
                  onClick={ selectFiles.bind(this) }
                  color='primary'
                  variant="contained"
                  style={{marginBottom: '20px'}}
                  fullWidth
                  disabled={(importQueue.length > 0) ? true : false }
                >Select Files</Button>

                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold', color: cardTextColor }}>Files and Directories</Typography>

                <Table>
                  <TableHead>
                    <TableRow style={{fontWeight: 'bold'}}>
                      {/* <TableCell>Index</TableCell> */}
                      <TableCell>File Name</TableCell>
                      <TableCell>Size</TableCell>
                      {/* <TableCell>Last Modified</TableCell> */}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importQueueRows}
                  </TableBody>
                </Table>
                { paginationFooter }

                <div style={{marginTop: '6px', color: cardTextColor}} >
                  <Checkbox checked={autoSelectFirstPatient} onChange={toggleAutoSelectPatient.bind(this)} />Autoselect patient
                  <br />
                  <Checkbox checked={sendToDataWarehouse} onChange={toggleSendToDataWarehouse.bind(this)} />Send to data warehouse servers
                </div>

                {importResults && (
                  <Alert
                    severity={importResults.error ? 'error' : 'success'}
                    sx={{ mt: 2 }}
                    onClose={() => setImportResults(null)}
                  >
                    {importResults.error ? (
                      <span>Import failed: {importResults.error}</span>
                    ) : (
                      <div>
                        <strong>Import complete ({importResults.mode} mode):</strong> {importResults.inserted} inserted, {importResults.updated} updated
                        {importResults.errors?.length > 0 && (
                          <div style={{color: isDark ? '#ffb74d' : '#e65100', marginTop: '4px'}}>
                            {importResults.errors.length} errors
                          </div>
                        )}
                        <div style={{fontSize: '0.85em', marginTop: '4px'}}>
                          {Object.entries(importResults.resourceTypes || {}).map(([type, count]) => (
                            <span key={type} style={{marginRight: '12px'}}>{type}: {count}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Alert>
                )}
              </CardContent>

              <CardActions style={{display: 'inline-flex', width: '100%'}} >
                <Grid item md={9} style={{paddingRight: '10px'}}>
                <Button disabled={(importQueue.length > 0) ? false : true } id="autoImportBtn" fullWidth variant="contained" onClick={toggleAutoImport.bind(this)} >{queueToggleText}</Button>
                {/* <Button disabled={(importQueue.length > 0) ? false : true } id="autoImportBtn" fullWidth variant="contained" color={queueButtonColor} onClick={toggleAutoImport.bind(this)} >{queueToggleText}</Button>                    */}
                </Grid>
                <Grid item md={3} style={{paddingLeft: '10px'}}>
                  <Button id="clearConditionsBtn" fullWidth variant="contained" onClick={clearImportQueue.bind(this)} >Clear</Button>
                </Grid>
              </CardActions>
            </Card>

            {/* Show warning if multiple patients detected */}
            {importedPatientCount > 1 && autoSelectFirstPatient && (
              <Alert severity="warning" style={{marginTop: '16px'}}>
                Multiple patients detected ({importedPatientCount} patients found). The first patient will be automatically selected when importing.
              </Alert>
            )}

          </Grid>
          <Grid item xs={12} md={4} style={{width: '100%'}}>
            <CardHeader
              title="Resource Editor"
              style={{cursor: 'pointer', color: cardTextColor}}
            />
            <Card
              style={{height: window.innerHeight - 300}}
              width={cardWidth + 'px'}
              sx={{
                bgcolor: cardBgColor,
                color: cardTextColor
              }}
            >
              <DataEditor
                previewMode={showPreviewData}
                readyToImport={readyToImport}
                progressMax={importQueueLength}
                progressValue={progressValue}
                importBuffer={importBuffer || Session.get('importBuffer') || strigifiedImportBuffer}
                mappingAlgorithm={mappingAlgorithm}
                fileExtension={fileExtension}
                // onImportFile={importFile.bind(this)}
                onScanData={scanData}
                onDigestData={digestData.bind(this)}
                onChangeMappingAlgorithm={changeMappingAlgorithm}
                onMapData={mapData}
                editWrapEnabled={editWrapEnabled}
                onAppleHealthTimeRangeChange={(value) => setAppleHealthTimeRange(value)}
                cardBgColor={cardBgColor}
                cardTextColor={cardTextColor}
                isDark={isDark}
              />
            </Card>
          </Grid>
        </Grid>
      </div>

  );
}
export default ImportEditorBindings;
