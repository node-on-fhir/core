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

import { get, has, filter } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import { FhirUtilities, DynamicSpacer, CodeSystems, ValueSetDetail, CodeSystemsConceptsTable } from 'meteor/clinical:hl7-fhir-data-infrastructure';






export function SearchResourceTypesDialog(props){

  const [tabIndex, setTabIndex] = useState(0);
  const [searchText, setSearchText] = useState("");

  let selectedCodeSystem = useTracker(function(){
    return CodeSystems.findOne({id: 'resource-types'});
  }, []);
  console.log('selectedCodeSystem', selectedCodeSystem)

  let { 
    children, 
    id,
    filter,
    codeSystem,
    errorMessage,
    jsonContent,
    ...otherProps 
  } = props;

  if(codeSystem){
    selectedCodeSystem = codeSystem;
  }

  let textToRender = "";
  if(jsonContent && !errorMessage){
    errorMessage = jsonContent;
  }

  // console.log('SearchResourceTypesDialog', errorMessage)

  if(errorMessage){
    if(typeof errorMessage === "string"){
      textToRender = errorMessage
    } else if(typeof errorMessage === "object") {
      textToRender = JSON.stringify(errorMessage, null, 2);
    }
  } 
  

  function handleTabChange(event, newIndex){
    setTabIndex(newIndex);
  }

  function handleSetSearchText(event){
    setSearchText(event.currentTarget.value);
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

  let conceptCount = 0;
  if(selectedCodeSystem){
    if(Array.isArray(selectedCodeSystem.concept)){
      conceptCount = selectedCodeSystem.concept.length;
    }  
  }

  console.log('searchText', searchText)

  return(
    <DialogContent id={id} className="SearchResourceTypesDialog" style={{width: '100%'}} dividers={scroll === 'paper'}>      
      <TextField
        id="search"
        type="search"
        label="Search Resource Types"
        fullWidth={true}
        value={ searchText }
        onChange={ handleSetSearchText.bind(this) }
        // error={Boolean(formik.errors.email && formik.touched.email)}
        // helperText={formik.touched.email && formik.errors.email}
      />
      <DynamicSpacer />
      {/* <ValueSetDetail 
        valueSet={selectedCodeSystem}
        hideTitleElements={true}
        hideDescriptionElements={true}
        hideTable={false}
        hideConcepts={true}
      /> */}
      <CodeSystemsConceptsTable 
        codeSystem={selectedCodeSystem}
        page={tabIndex}
        searchText={searchText}
        onSetPage={function(index){
          setTabIndex(index);
        }}
        count={conceptCount}
        rowsPerPage={conceptCount}
        disablePagination={true}
        onRowClick={function(concept){
          Session.set('SubscriptionChannelResourceType', get(concept, 'code'))
          Session.set('mainAppDialogOpen', false);
        }}
      />
      

    </DialogContent>
  )
}

SearchResourceTypesDialog.propTypes = {
  errorMessage: PropTypes.string,
  filter: PropTypes.string,
  codeSystem: PropTypes.object
}
SearchResourceTypesDialog.defaultProps = {
  filter: ''
}


export default SearchResourceTypesDialog;