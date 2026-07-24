// UMLS Metathesaurus License
// Need to file an annual report on usage

// https://taxonomy.nucc.org/
// https://www.nlm.nih.gov/vsac/support/usingvsac/vsacsvsapiv2.html  
// https://www.nlm.nih.gov/vsac/support/usingvsac/vsacfhirapi.html  

// https://npiprofile.com/
// https://npiprofile.com/validation/1679576722


import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTracker } from 'meteor/react-meteor-data';
import { makeStyles, withStyles } from '@material-ui/core/styles';

import { 
  Card,
  CardHeader,
  CardContent,
  Button,
  Tab, 
  Tabs,
  Typography,
  Box,
  TextField
} from '@material-ui/core';

import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';




import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { fetch } from 'meteor/fetch';
import JSON5 from 'json5';

import { FhirUtilities, DynamicSpacer, ValueSets, ValueSetsTable, ValueSetDetail } from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { ValueSetSelection } from './ValueSetSelection';



// SearchResourceTypesDialog


export function SearchLibraryOfMedicineDialog(props){

  let [valueSetSearchTerm, setValueSetSearchTerm] = useState("2.16.840.1.114222.4.11.1066");
  let [fetchedValueSet, setFetchedValueSet] = useState(null);

  let selectedValueSet = useTracker(function(){
    return ValueSets.findOne({id: Session.get('selectedValueSet')});
  }, []);

  console.log('selectedValueSet', selectedValueSet)

  let { 
    children, 
    id,
    // error,
    errorMessage,
    jsonContent,
    ...otherProps 
  } = props;

  let textToRender = "";
  if(jsonContent && !errorMessage){
    errorMessage = jsonContent;
  }

  // console.log('SearchLibraryOfMedicineDialog', errorMessage)

  if(errorMessage){
    if(typeof errorMessage === "string"){
      textToRender = errorMessage
    } else if(typeof errorMessage === "object") {
      textToRender = JSON.stringify(errorMessage, null, 2);
    }
  } 
  

  function handleSetSearchText(event){
      setValueSetSearchTerm(event.currentTarget.value)
  }

  // --------------------------------------------------------------------------------------------------------------------------------
  // Rendering


  let labelRowStyle = {
    clear: 'both'
  }
  let labelStyle = {
    float: 'left',
    width: '160px',
    margin: '0px'
  }
  let valueStyle = {
    float: 'left',
    whiteSpace: 'pre',
    textOverflow: 'ellipsis',
    position: 'absolute'
  }
  let blockStyle = {
    clear: 'both'
  }
  let separatorStyle = {
    marginTop: '40px', 
    marginBottom: '20px', 
    clear: 'both',
    height: '2px'
  }

  function handleQueryLibrary(){
    console.log('handleQueryLibrary', props);

    // (A dead commented-out HTTP.post block containing a REAL UMLS/VSAC API
    // key was removed here 2026-07-23 — flagged by the gitleaks CI gate. The
    // key remains in git history and should be rotated at UMLS. The live path
    // below fetches server-side via the fetchValueSetFromNlm method, which
    // reads its key from settings — the correct pattern.)

    // rpc-migration: ddp-straggler
    Meteor.call('fetchValueSetFromNlm', valueSetSearchTerm, function(error, result){
      if(error){
          alert(JSON.stringify(error.message));
      }
      if(result){
          console.log('fetchValueSetFromNlm', JSON.parse(get(result, 'content')));
          setFetchedValueSet(JSON.parse(get(result, 'content')));
      }
    })
}

  return(
    <DialogContent id={id} className="SearchLibraryOfMedicineDialog" style={{width: '100%'}} dividers={scroll === 'paper'}>      
      <TextField
        id="search"
        type="search"
        label="Search (Library of Medicine)"
        fullWidth={true}
        value={ valueSetSearchTerm }
        onChange={ handleSetSearchText.bind(this) }
      />
      <DynamicSpacer />
      
      <Button onClick={handleQueryLibrary.bind(this)} color="primary" variant="contained">
        Query Library of Medicine
      </Button>

      <ValueSetsTable 
        fullWidth
      />
      {/* <ValueSetSelection 
        valueSet={selectedValueSet}
        searchTerm={ valueSetSearchTerm }
        hideTitleElements={true}
        hideDescriptionElements={false}
        hideTable={false}
        hideConcepts={false}
        onSelection={function(selectedValue){
          Session.set(Session.get('dialogReturnValue'), selectedValue);
          Session.set('mainAppDialogOpen', false);
        }}        
      /> */}
      

    </DialogContent>
  )
}

SearchLibraryOfMedicineDialog.propTypes = {
  errorMessage: PropTypes.string
}
SearchLibraryOfMedicineDialog.defaultProps = {}


export default SearchLibraryOfMedicineDialog;