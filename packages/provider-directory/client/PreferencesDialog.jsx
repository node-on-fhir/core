
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTracker } from 'meteor/react-meteor-data';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { useHistory } from "react-router-dom";

import { 
  Card,
  CardHeader,
  CardContent,
  Checkbox,
  FormControlLabel,
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
import { HTTP } from 'meteor/http';
import JSON5 from 'json5';

import { FhirUtilities, DynamicSpacer, ValueSets, ValueSetDetail } from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { ValueSetSelection } from './ValueSetSelection';


Session.setDefault('showSystemIds', false);
Session.setDefault('showPatientName', false);
Session.setDefault('showSystemContexts', false);
Session.setDefault('showFhirQueries', false);


export function PreferencesDialog(props){
  console.log('PreferencesDialog.props', props)

  const [showServerStats, setShowServerStats] = useState(true);
  const [showExperimental, setShowExperimental] = useState(false);
  const [onlyShowMatched, setOnlyShowMatched] = useState(false);
  const [showUrlPreview, setShowUrlPreview] = useState(false);
  const [showFhirIds, setShowFhirIds] = useState(false);
  const [showSystemIds, setShowSystemIds] = useState(false);
  const [showLatLng, setShowLatLng] = useState(false);
  const [showPatientName, setShowPatientName] = useState(false);
  const [showSystemContexts, setShowSystemContexts] = useState(false);
  const [showFhirQueries, setShowFhirQueries] = useState(false);

  let { 
    children, 
    id,
    errorMessage,
    jsonContent,
    history,
    appHeight,
    ...otherProps 
  } = props;


  useTracker(function(){
    setShowLatLng(Session.get('showLatLng'));
  }, [])
  useTracker(function(){
    setShowSystemIds(Session.get('showSystemIds'));
  }, [])
  useTracker(function(){
    setShowFhirIds(Session.get('showFhirIds'));
  }, [])
  useTracker(function(){
    setShowExperimental(Session.get('showExperimental'));
  }, [])
  useTracker(function(){
    setShowUrlPreview(Session.get('showUrlPreview'));
  }, [])
  useTracker(function(){
    setShowPatientName(Session.get('showPatientName'));
  }, [])
  useTracker(function(){
    setShowSystemContexts(Session.get('showSystemContexts'));
  }, [])
  useTracker(function(){
    setShowFhirQueries(Session.get('showFhirQueries'));
  }, [])
  


  function handleToggleShowExperimental(event, newValue){
    setShowExperimental(newValue);
    Session.set('showExperimental', newValue);
  }
  function handleToggleOnlyShowMatched(event, newValue){
    setOnlyShowMatched(newValue);
    Session.set('onlyShowMatched', newValue);
  }
  function handleToggleServerStats(event, newValue){
    setShowServerStats(newValue);
    Session.set('showServerStats', newValue);
  }
  function handleToggleShowUrlPreview(event, newValue){
    setShowUrlPreview(newValue);
    Session.set('showUrlPreview', newValue);
  }
  function handleToggleShowFhirIds(event, newValue){
    setShowFhirIds(newValue);
    Session.set('showFhirIds', newValue);
  }
  function handleToggleShowSystemIds(event, newValue){
    setShowSystemIds(newValue);
    Session.set('showSystemIds', newValue);
  }
  function handleToggleShowLatLng(event, newValue){
    setShowLatLng(newValue);
    Session.set('showLatLng', newValue);
  }
  function handleToggleShowPatientNames(event, newValue){
    setShowPatientName(newValue);
    Session.set('showPatientName', newValue);
  }
  function handleToggleShowSystemContexts(event, newValue){
    setShowSystemContexts(newValue);
    Session.set('showSystemContexts', newValue);
  }
  function handleToggleShowFhirQueries(event, newValue){
    setShowFhirQueries(newValue);
    Session.set('showFhirQueries', newValue);
  }
  function openPage(url){
    // history.replace(url)
    window.location.href = url;
  }

  return(
    <DialogContent id={id} className="PreferencesDialog" style={{width: '100%', userSelect: 'none'}} dividers={scroll === 'paper'}>      
      
      <FormControlLabel                
        control={<Checkbox checked={showServerStats} onChange={handleToggleServerStats} name="toggleShowExperimental" />}
        label="Show cursor stats"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showExperimental} onChange={handleToggleShowExperimental} name="toggleShowExperimental" />}
        label="Show experimental search options"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={onlyShowMatched} onChange={handleToggleOnlyShowMatched} name="toggleShowExperimental" />}
        label="Only show Orgs with matched names and addresses"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showUrlPreview} onChange={handleToggleShowUrlPreview} name="toggleShowExperimental" />}
        label="Show URL preview"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showFhirIds} onChange={handleToggleShowFhirIds} name="toggleShowFhirIds" />}
        label="Show FHIR ids"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showSystemIds} onChange={handleToggleShowSystemIds} name="toggleShowSystemIds" />}
        label="Show System ids"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showLatLng} onChange={handleToggleShowLatLng} name="toggleShowLatLng" />}
        label="Show Lat Lng"
      /><br />

      <FormControlLabel                
        control={<Checkbox checked={showPatientName} onChange={handleToggleShowPatientNames} name="toggleShowPatientName" />}
        label="Show Patient Name(s)"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showSystemContexts} onChange={handleToggleShowSystemContexts} name="toggleShowPatientName" />}
        label="Show System Contexts"
      /><br />
      <FormControlLabel                
        control={<Checkbox checked={showFhirQueries} onChange={handleToggleShowFhirQueries} name="toggleShowPatientName" />}
        label="Show FHIR Queries"
      /><br />


      <DynamicSpacer />            
    </DialogContent>
  )
}

PreferencesDialog.propTypes = {
  errorMessage: PropTypes.string
}
PreferencesDialog.defaultProps = {}


export default PreferencesDialog;