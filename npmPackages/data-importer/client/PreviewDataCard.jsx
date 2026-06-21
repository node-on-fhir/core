

import { Meteor } from 'meteor/meteor';
import React, { useState, useEffect, useCallback } from 'react';
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
  LinearProgress
} from '@mui/material';
import PropTypes from 'prop-types';

// import AceEditor from "react-ace";
// import "ace-builds/src-noconflict/mode-json";
// import "ace-builds/src-noconflict/theme-tomorrow";


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
//       logger.verbose('PreviewDataCard.useEffect()')
//       if (readyToImport) {
//         logger.verbose('PreviewDataCard.useEffect().readyToImport')
//         parseImportQueue();
//       }
//     }, [parseImportQueue, readyToImport]);

//     return { parseImportQueue, showProgressBar, progressValue, error };
//   };

//====================================================================================
// Session Variables

Session.setDefault('previewBuffer', '');

//====================================================================================
// Main Component 


function PreviewDataCard(props){
  logger.debug('Rendering the PreviewDataCard');
  logger.verbose('symptomatic:data-management.client.PreviewDataCard');
  logger.data('PreviewDataCard.props', {data: props}, {source: "PreviewDataCard.jsx"});
  
  var isDark = false;
  var useAppTheme;
  if (typeof Meteor !== 'undefined' && Meteor.useTheme) {
    useAppTheme = Meteor.useTheme;
  }
  if (useAppTheme) {
    var appTheme = useAppTheme();
    isDark = appTheme.theme === 'dark';
  }


  
  //---------------------------------------------------------------------
  // Props  

  let { 
    children, 
    initialValue = 0, 
    progressValue = 0,
    progressMax = 0, 
    mappingAlgorithm = 0,
    readyToImport = false,
    previewBuffer = "", 
    fileExtension = "json",
    onImportFile,
    ...otherProps } = props;

  if(['xml', 'xmlx', 'xlsx', 'json', 'ccd', 'bundle', 'txt', 'application/json', 'application/csv', 'application/json+fhir'].includes(fileExtension)){
    // previewBufferContents = JSON.stringify(previewBuffer, null, 2);
    previewBufferContents = previewBuffer;
  } else {
    previewBufferContents = previewBuffer;
  }

  logger.debug("PreviewDataCard.previewBufferContents", previewBufferContents);

  // const { parseImportQueue, isImporting, progressValue, error } = useAsync(autoImport, readyToImport);

  // console.log("PreviewDataCard.isImporting", isImporting);

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
  function handleScanData(){
    if(typeof props.onScanData === "function"){
      props.onScanData();
    }
  }
  function handleChangeMappingAlgorithm(event){
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
    Session.set("previewBuffer", "")
  }


  //---------------------------------------------------------------------
  // Render Methods  

  logger.trace('PreviewDataCard.progress', progressValue, progressMax)

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
    previewComponents = <CardContent>
      {/* <AceEditor
        placeholder="Select a file to import."
        mode="json"
        theme="tomorrow"
        name="exportBuffer"
        // onLoad={this.onLoad}
        onChange={ handleChangeEditor.bind(this) }
        fontSize={14}
        showPrintMargin={false}
        showGutter={true}
        highlightActiveLine={true}
        value={previewBuffer}
        setOptions={{
          enableBasicAutocompletion: false,
          enableLiveAutocompletion: false,
          enableSnippets: false,
          showLineNumbers: true,
          tabSize: 2,
        }}
        style={{width: '100%', position: 'relative', height: window.innerHeight - 440, minHeight: '200px', backgroundColor: '#f5f5f5', borderColor: '#ccc', borderRadius: '4px', lineHeight: '16px'}}        
      /> */}
      <pre 
        id="dropzonePreview"
        style={{
          width: '100%', 
          position: 'relative', 
          minHeight: '200px', 
          height: window.innerHeight - 400, 
          backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#ccc',
          borderRadius: '4px',
          lineHeight: '16px',
          overflow: 'scroll',
          color: isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#ccc'}`,
          padding: '12px'
        }} 
      >
        { previewBufferContents }
      </pre>

      <Grid container>
        <Grid item md={4} style={{paddingRight: '10px'}}>
          <Button 
            id='scanFile'
            onClick={ handleScanData.bind(this)}
            color="primary"
            variant="contained"
            fullWidth                
          >Scan</Button>   
        </Grid>
        <Grid item md={4} style={{paddingLeft: '10px'}}>
          <Button id="clearPreviewQueueBtn" fullWidth variant="contained" onClick={clearPreviewBuffer.bind(this)} >Clear</Button>             
        </Grid>
      </Grid>
    </CardContent>
  }

  return previewComponents;
}


PreviewDataCard.propTypes = {
  progressMax: PropTypes.number,
  initialValue: PropTypes.number,
  previewBuffer: PropTypes.string,
  fileExtension: PropTypes.string,
  mappingAlgorithm: PropTypes.number,
  readyToImport: PropTypes.bool,
  progressValue: PropTypes.number,

  onScanData: PropTypes.func,
  onEditorChange: PropTypes.func,
  onChangeMappingAlgorithm: PropTypes.func,
  onImportFile: PropTypes.func,
  onMapData: PropTypes.func
}


export default PreviewDataCard;