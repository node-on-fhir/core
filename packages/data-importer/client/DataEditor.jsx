

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { useState, useEffect, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
// import Promise from 'promise';

import { 
  Button, 
  CardContent, 
  CardHeader, 
  CardActions,
  Grid, 
  Tab, 
  Tabs, 
  Typography,
  FormControl,
  Input,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  FormHelperText
} from '@mui/material';
import PropTypes from 'prop-types';

import { get, set, has, uniq, cloneDeep } from 'lodash';
import moment from 'moment';

import "ace-builds";
import ace from 'ace-builds/src-noconflict/ace';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/snippets/html"

import "ace-builds/src-noconflict/theme-tomorrow";
import "ace-builds/src-noconflict/theme-monokai";

import AppleHealthPreview from './AppleHealthPreview';

// Configure Ace Editor for Rspack compatibility
// Disable web workers to avoid __rspack__/worker-json.js loading errors
ace.config.set("useWorker", false);

// //====================================================================================
// // Async Hook


//   const useAsync = (asyncFunction, readyToImport) => {
//     const [showProgressBar, setProgressBarVisible] = useState(false);
//     const [progressValue, setProgressBarValue] = useState(0);
//     const [error, setError] = useState(null);

//     // The parseImportQueue function wraps asyncFunction and
//     // handles setting state for showProgressBar, value, and error.
//     // useCallback ensures the below useEffect is not called
//     // on every render, but only if asyncFunction changes.
//     const parseImportQueue = useCallback(() => {
//       logger.debug('Parsing import queue asynchronously.')

//       setProgressBarVisible(true);
//       setProgressBarValue(0);
//       setError(null);
      
//       return asyncFunction()
//         .then(response => setProgressBarValue(++progressValue))
//         .catch(error => setError(error))
//         .finally(() => setProgressBarVisible(false));
//     }, [asyncFunction]);

//     // Call parseImportQueue if we want to fire it right away.
//     // Otherwise parseImportQueue can be called later, such as
//     // in an onClick handler.
//     useEffect(() => {
//       logger.verbose('DataEditor.useEffect()')
//       if (readyToImport) {
//         logger.verbose('DataEditor.useEffect().readyToImport')
//         parseImportQueue();
//       }
//     }, [parseImportQueue, readyToImport]);

//     return { parseImportQueue, showProgressBar, progressValue, error };
//   };


//====================================================================================
// Shared Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})



//====================================================================================
// Main Application  


function DataEditor(props){
  // logger.debug('Rendering the DataEditor');
  // logger.verbose('symptomatic:data-management.client.DataEditor');
  // logger.data('DataEditor.props', {data: props}, {source: "DataEditor.jsx"});

  console.debug('Rendering the DataEditor');
  console.debug('symptomatic:data-management.client.DataEditor');
  // console.data('DataEditor.props', {data: props}, {source: "DataEditor.jsx"});


  const { theme, toggleTheme } = useTheme();

  //---------------------------------------------------------------------
  // Component State
  
  const [editorContent, setEditorContent] = useState("");
  const [editorWrap, setEditorWrap] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(0);
  const [detectedFileExtension, setDetectedFileExtension] = useState("json");
  const [appleHealthTimeRange, setAppleHealthTimeRange] = useState('all');
  const [appleHealthAnalysis, setAppleHealthAnalysis] = useState(null);

  //---------------------------------------------------------------------
  // Props  

  let { 
    children, 
    initialValue = 0, 
    progressValue = 0,
    progressMax = 0, 
    mappingAlgorithm = 0,
    readyToImport = false,
    previewMode = false,
    importBuffer = "", 
    fileExtension = "json",
    onImportFile,
    editorWrapEnabled = false,
    ...otherProps } = props;

  // Watch for Apple Health analysis updates
  useTracker(() => {
    const analysis = Session.get('appleHealthAnalysis');
    if (analysis && analysis !== appleHealthAnalysis) {
      setAppleHealthAnalysis(analysis);
      
      // Update the editor content with the analysis
      if (importBuffer instanceof ArrayBuffer) {
        const sizeInfo = importBuffer?.byteLength ? (importBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB' : '';
        let summaryText = `[Apple Health Export]\n\nFile size: ${sizeInfo}\n\n`;
        
        if (analysis.healthRecords) {
          summaryText += `Total records: ${analysis.totalRecords?.toLocaleString() || 0}\n`;
          
          if (analysis.dateRange?.earliest && analysis.dateRange?.latest) {
            const startDate = moment(analysis.dateRange.earliest).format('MMM YYYY');
            const endDate = moment(analysis.dateRange.latest).format('MMM YYYY');
            summaryText += `Date range: ${startDate} - ${endDate}\n`;
          }
          
          summaryText += '\n--- Health Records ---\n';
          
          const sortedTypes = Object.entries(analysis.healthRecords)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 50);
          
          sortedTypes.forEach(([type, info]) => {
            const displayName = info.displayName || type.replace(/HK(Quantity|Category)TypeIdentifier/, '');
            const count = info.count.toString().padStart(8, ' ');
            summaryText += `${count}  ${displayName}\n`;
          });
          
          if (Object.keys(analysis.healthRecords).length > 50) {
            summaryText += `\n... and ${Object.keys(analysis.healthRecords).length - 50} more types\n`;
          }
          
          if (analysis.clinicalRecords && analysis.clinicalRecords.length > 0) {
            summaryText += '\n--- Clinical Records ---\n';
            analysis.clinicalRecords.forEach(record => {
              const count = record.count.toString().padStart(8, ' ');
              summaryText += `${count}  ${record.type}\n`;
            });
          }
          
          if (analysis.workouts && Object.keys(analysis.workouts).length > 0) {
            summaryText += '\n--- Workouts ---\n';
            Object.entries(analysis.workouts)
              .sort((a, b) => b[1].count - a[1].count)
              .forEach(([type, info]) => {
                const count = info.count.toString().padStart(8, ' ');
                summaryText += `${count}  ${info.displayName}\n`;
              });
          }
          
          summaryText += '\nClick "Digest" to select which data to import.';
        } else {
          summaryText += 'This ZIP file contains your Apple Health data.\nClick "Digest" to analyze and select data for import.';
        }
        
        setEditorContent(summaryText);
      }
    }
  }, [importBuffer]);

    // console.log('DataEditor.props', props)


    useEffect(function(){
      if(['application/zip', 'application/x-zip-compressed', 'zip'].includes(fileExtension) || importBuffer instanceof ArrayBuffer){
        // Handle binary data for zip files
        const sizeInfo = importBuffer?.byteLength ? (importBuffer.byteLength / 1024 / 1024).toFixed(2) + ' MB' : '';

        // Check if we have analysis data
        const analysis = Session.get('appleHealthAnalysis');
        let summaryText = `[Apple Health Export]\n\nFile size: ${sizeInfo}\n\n`;

        if (analysis && analysis.healthRecords) {
          // Add total records count
          summaryText += `Total records: ${analysis.totalRecords?.toLocaleString() || 0}\n`;

          if (analysis.dateRange?.earliest && analysis.dateRange?.latest) {
            const startDate = moment(analysis.dateRange.earliest).format('MMM YYYY');
            const endDate = moment(analysis.dateRange.latest).format('MMM YYYY');
            summaryText += `Date range: ${startDate} - ${endDate}\n`;
          }

          summaryText += '\n--- Health Records ---\n';

          // Sort by count descending and display
          const sortedTypes = Object.entries(analysis.healthRecords)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 50); // Show top 50 types

          sortedTypes.forEach(([type, info]) => {
            const displayName = info.displayName || type.replace(/HK(Quantity|Category)TypeIdentifier/, '');
            const count = info.count.toString().padStart(8, ' ');
            summaryText += `${count}  ${displayName}\n`;
          });

          if (Object.keys(analysis.healthRecords).length > 50) {
            summaryText += `\n... and ${Object.keys(analysis.healthRecords).length - 50} more types\n`;
          }

          // Add clinical records if present
          if (analysis.clinicalRecords && analysis.clinicalRecords.length > 0) {
            summaryText += '\n--- Clinical Records ---\n';
            analysis.clinicalRecords.forEach(record => {
              const count = record.count.toString().padStart(8, ' ');
              summaryText += `${count}  ${record.type}\n`;
            });
          }

          // Add workouts if present
          if (analysis.workouts && Object.keys(analysis.workouts).length > 0) {
            summaryText += '\n--- Workouts ---\n';
            Object.entries(analysis.workouts)
              .sort((a, b) => b[1].count - a[1].count)
              .forEach(([type, info]) => {
                const count = info.count.toString().padStart(8, ' ');
                summaryText += `${count}  ${info.displayName}\n`;
              });
          }

          summaryText += '\nClick "Digest" to select which data to import.';
        } else {
          summaryText += 'This ZIP file contains your Apple Health data.\nClick "Digest" to analyze and select data for import.';
        }

        importBufferContents = summaryText;
        setSelectedAlgorithm(1); // Apple Health Export
      } else if(typeof importBuffer === 'string' && importBuffer.includes('<!DOCTYPE HealthData')){
        // Handle Apple Health XML file (detected by DOCTYPE)
        console.log('Detected Apple Health XML file');
        // Don't set importBufferContents to the raw XML - it's too large to render
        // The AppleHealthPreview component will be shown instead
        importBufferContents = 'Apple Health Export detected. Preview will appear below.';
        setSelectedAlgorithm(1); // Apple Health Export
      } else if(['xml', 'xmlx', 'xlsx', 'json', 'ccd', 'bundle', 'txt', 'application/json', 'application/csv', 'application/json+fhir'].includes(fileExtension)){
        // importBufferContents = JSON.stringify(importBuffer, null, 2);
        importBufferContents = typeof importBuffer === 'string' ? importBuffer : JSON.stringify(importBuffer, null, 2);
        setSelectedAlgorithm(0); // FHIR Bundle
      } else if(['phr', 'sphr', 'applicaion/x-phr', 'ndjson', 'application/x-ndjson'].includes(fileExtension)){
        // console.log('importBuffer application/x-ndjson', importBuffer);
        console.log('importBuffer typeof', typeof importBuffer);
        console.log('importBuffer', importBuffer);
    
        let parsedBuffer = JSON.parse(importBuffer);
    
        console.log('parsed importBuffer type: ' +  typeof parsedBuffer);
    
        let ndjsonPreview = "";
        if(Array.isArray(parsedBuffer)){
          console.log('importBuffer is an array');
          parsedBuffer.forEach(function(line){
            ndjsonPreview = ndjsonPreview + JSON.stringify(line) + "\n";
          })
        }
    
        console.log('ndjsonPreview', ndjsonPreview)
        importBufferContents = ndjsonPreview;
        setSelectedAlgorithm(3);
      } else {
        setSelectedAlgorithm(1);
        importBufferContents = importBuffer;
      }
      setEditorContent(importBufferContents);
      setDetectedFileExtension(fileExtension)

    }, [props])


  console.debug("DataEditor.importBufferContents", importBufferContents);

  
// 

  // const { parseImportQueue, isImporting, progressValue, error } = useAsync(autoImport, readyToImport);

  // console.log("DataEditor.isImporting", isImporting);

  // //---------------------------------------------------------------------

  // async function autoImport(callback){
  //   logger.debug("Auto importing items from import queue.")
  //   // setProgressCount(0);    

  //   if(Array.isArray(importQueue)){
      
  //     importQueue.forEach(async function(queueItem){
  //       logger.verbose('ImportComponent.autoImport().Promise().queueItem', queueItem);
        
  //       // setProgressCount(++progressValue)
          
  //       if(typeof onImportFile === "function"){
  //         await onImportFile(queueItem);
  //       }
  //     });      
      
  //     // Session.set('lastUpdated', new Date())

  //     if(typeof callback === "function"){
  //       callback()
  //     }
  //   }
  // }


  //---------------------------------------------------------------------
  // Methods and Functions  
  
  
  function handleMapData(){
    if(typeof props.onMapData === "function"){
      props.onMapData();
    }
  }
  function digestData(options){
    if(typeof props.onDigestData === "function"){
      // Pass the actual import buffer for binary data, not the editor content
      const dataToDigest = (importBuffer instanceof ArrayBuffer || importBuffer instanceof Uint8Array) 
        ? importBuffer 
        : editorContent;
      props.onDigestData(dataToDigest, detectedFileExtension, selectedAlgorithm, options);
    }
  }
  function handleScanData(){
    if(typeof props.onScanData === "function"){
      props.onScanData();
    }
  }
  function handleChangeMappingAlgorithm(event){
    console.log('handleChangeMappingAlgorithm', event)
    console.log('handleChangeMappingAlgorithm.target.value', event.target.value)
    setSelectedAlgorithm(event.target.value)

    if(typeof props.onChangeMappingAlgorithm === "function"){
      props.onChangeMappingAlgorithm(event);
    }
  }
  function handleChangeEditor(event){
    if(typeof props.onEditorChange === "function"){
      props.onEditorChange(event);
    }
  }

  function clearPreviewBuffer(){
    // Session.set("importBuffer", "")
    setEditorContent("");
  }
  function noMapCopyToPreviewBuffer(){
    Session.set('previewBuffer', Session.get('importBuffer'));
  }
  function onChange(newValue){
    console.log('onChange', newValue)
    setEditorContent(newValue)
  }


  //---------------------------------------------------------------------
  // Render Methods  

  logger.trace('DataEditor.progress', progressValue, progressMax)

  let previewButton;
  let digestButton;
  if(previewMode){
    digestButton = <Button 
      id='mapData'
      onClick={ handleMapData.bind(this)}
      // color="primary"
      variant="contained"
      fullWidth                
    >Map</Button>   
    previewButton = <Button id="skipBtn" fullWidth variant="contained" onClick={noMapCopyToPreviewBuffer.bind(this)} >Preview</Button>
  } else {
    digestButton = <Button 
      id='mapData'
      onClick={() => digestData()}
      // color="primary"
      variant="contained"
      fullWidth                
    >Digest</Button>   
  }
  let percentageComplete = 0;
  let previewComponents;
  

  if(readyToImport){
    // if(progressMax > 0){
    //   percentageComplete = Number(((progressValue / progressMax) * 100).toFixed(0));
    // } 
    previewComponents = <CardContent disabled>
      <CardContent style={{fontSize: '100%', paddingBottom: '28px', paddingTop: '50px', textAlign: 'center'}}>
        <CardHeader 
          title="Preview Unavailable During Import"       
          subheader={"Please wait."}
          style={{fontSize: '100%', whiteSpace: 'nowrap', marginBottom: '40px'}} />
          {/* <LinearProgress variant="determinate" value={percentageComplete} /> */}
          <LinearProgress />
            
      </CardContent>
    </CardContent>
  } else {
    // Show Apple Health Preview for Apple Health Export (both ZIP and XML), otherwise show editor
    const showAppleHealthPreview = selectedAlgorithm === 1 && (
      importBuffer instanceof ArrayBuffer ||
      importBuffer instanceof Uint8Array ||
      (typeof importBuffer === 'string' && importBuffer.includes('<!DOCTYPE HealthData'))
    );

    previewComponents = <CardContent>
      {showAppleHealthPreview ? (
        <AppleHealthPreview
          importBuffer={importBuffer}
          onImport={(options) => {
            if(typeof props.onDigestData === "function"){
              props.onDigestData(importBuffer, detectedFileExtension, selectedAlgorithm, options);
            }
          }}
          style={{height: window.innerHeight - 470}}
        />
      ) : (
        <AceEditor
          mode="json"
          theme={theme === 'light' ? "tomorrow" : "monokai"}
          wrapEnabled={editorWrapEnabled}
          onChange={onChange}
          name="rawDataEditor"
          editorProps={{ $blockScrolling: true }}
          style={{width: '100%', marginBottom: '20px', height: window.innerHeight - 470}}
          value={typeof editorContent === 'string' ? editorContent : '[Binary Data]'}
          defaultValue=""
          readOnly={importBuffer instanceof ArrayBuffer || importBuffer instanceof Uint8Array}
        />
      )}


      {!showAppleHealthPreview && (
        <>
      <Grid container spacing={2} style={{marginTop: '10px'}}>
        <Grid item xs={selectedAlgorithm === 1 ? 6 : 12}>
          <FormControl style={{width: '100%'}}>
            <InputLabel id="import-algorithm-label" style={{color: props.cardTextColor}}>Mapping Algorithm</InputLabel>
            <Select
              id="import-algorithm-selector"
              value={ selectedAlgorithm}
              onChange={handleChangeMappingAlgorithm.bind(this)}
              fullWidth
              style={{color: props.cardTextColor}}
              sx={{
                '& .MuiSelect-icon': { color: props.cardTextColor }
              }}
              >
              <MenuItem value={0} id="import-algorithm-menu-item-0" key="import-algorithm-menu-item-0" >FHIR Bundle</MenuItem>
              <MenuItem value={1} id="import-algorithm-menu-item-1" key="import-algorithm-menu-item-1" >Apple Health Export</MenuItem>
              <MenuItem value={2} id="import-algorithm-menu-item-2" key="import-algorithm-menu-item-2" >FHIR Resource</MenuItem>
              <MenuItem value={3} id="import-algorithm-menu-item-3" key="import-algorithm-menu-item-3" >FHIR Bulk Data</MenuItem>
              <MenuItem value={4} id="import-algorithm-menu-item-4" key="import-algorithm-menu-item-4" >FHIR Personal Health Record</MenuItem>
              <MenuItem value={5} id="import-algorithm-menu-item-5" key="import-algorithm-menu-item-5" >Facebook Profile</MenuItem>
              <MenuItem value={6} id="import-algorithm-menu-item-6" key="import-algorithm-menu-item-6" >City of Chicago Data File</MenuItem>
              <MenuItem value={7} id="import-algorithm-menu-item-7" key="import-algorithm-menu-item-7" >Geojson</MenuItem>
              <MenuItem value={8} id="import-algorithm-menu-item-8" key="import-algorithm-menu-item-8" >CDC Reporting Spreadsheet</MenuItem>
              <MenuItem value={9} id="import-algorithm-menu-item-9" key="import-algorithm-menu-item-9" >FEMA Reporting Spreadsheet</MenuItem>
              <MenuItem value={10} id="import-algorithm-menu-item-10" key="import-algorithm-menu-item-10" >Inpatient Prospective Payment System File</MenuItem>
              <MenuItem value={11} id="import-algorithm-menu-item-11" key="import-algorithm-menu-item-11" >SANER Hospital File</MenuItem>
              <MenuItem value={12} id="import-algorithm-menu-item-12" key="import-algorithm-menu-item-12" >LOINC Questionnaire</MenuItem>
              <MenuItem value={13} id="import-algorithm-menu-item-13" key="import-algorithm-menu-item-13" >FHIR Bundle (Collection)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        {/* Show Apple Health time range selector when Apple Health Export is selected */}
        {selectedAlgorithm === 1 && (
          <Grid item xs={6}>
            <FormControl style={{width: '100%'}}>
              <InputLabel id="apple-health-time-range-label">Time Range Filter</InputLabel>
              <Select
                labelId="apple-health-time-range-label"
                id="apple-health-time-range-selector"
                value={appleHealthTimeRange}
                onChange={(e) => {
                  setAppleHealthTimeRange(e.target.value);
                  if(typeof props.onAppleHealthTimeRangeChange === "function"){
                    props.onAppleHealthTimeRangeChange(e.target.value);
                  }
                }}
                fullWidth
              >
                <MenuItem value="all">All Data</MenuItem>
                <MenuItem value="lastDecade">Last 10 Years</MenuItem>
                <MenuItem value="lastYear">Last Year</MenuItem>
                <MenuItem value="lastMonth">Last Month</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>

      {/* <pre 
        id="dropzonePreview"
        style={{
          width: '100%', 
          position: 'relative', 
          minHeight: '200px', 
          height: window.innerHeight - 480, 
          backgroundColor: '#f5f5f5', 
          borderColor: '#ccc', 
          borderRadius: '4px', 
          lineHeight: '16px', 
          overflow: 'scroll'
        }} 
      >
        { importBufferContents }
      </pre> */}

      <Grid container style={{marginTop: '20px', paddingBottom: '20px'}}>
        <Grid item md={4} style={{paddingRight: '10px'}}>
          { digestButton }
        </Grid>
        <Grid item md={4} style={{paddingLeft: '10px'}}>
          <Button id="clearImportQueueBtn" fullWidth variant="contained" onClick={clearPreviewBuffer.bind(this)} >Clear</Button>             
        </Grid>
        <Grid item md={4} style={{paddingLeft: '10px'}}>
          { previewButton }
        </Grid>
      </Grid>
        </>
      )}
    </CardContent>
  }

  return previewComponents;
}


DataEditor.propTypes = {
  progressMax: PropTypes.number,
  initialValue: PropTypes.number,
  importBuffer: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(ArrayBuffer),
    PropTypes.instanceOf(Uint8Array)
  ]),
  fileExtension: PropTypes.string,
  mappingAlgorithm: PropTypes.number,
  readyToImport: PropTypes.bool,
  previewMode: PropTypes.bool,
  progressValue: PropTypes.number,

  onScanData: PropTypes.func,
  onDigestData: PropTypes.func,
  onEditorChange: PropTypes.func,
  onChangeMappingAlgorithm: PropTypes.func,
  onImportFile: PropTypes.func,
  onMapData: PropTypes.func,
  onAppleHealthTimeRangeChange: PropTypes.func
}


export default DataEditor;