import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTracker } from 'meteor/react-meteor-data';

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
} from '@mui/material';

import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




import { get, has } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import JSON5 from 'json5';


import { ValueSetSelection } from './ValueSetSelection';
import { DynamicSpacer } from '../../ui/DynamicSpacer';



// SearchResourceTypesDialog


//===========================================================================

let ValueSets;
Meteor.startup(function(){
  ValueSets = Meteor.Collections.ValueSets;
})


//===========================================================================
// MAIN COMPONENT

export function SearchValueSetsDialog(props){

  const [valueSetSearchTerm, setValueSetSearchTerm] = useState("");

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

  // console.log('SearchValueSetsDialog', errorMessage)

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

  return(
    <DialogContent id={id} className="SearchValueSetsDialog" style={{width: '100%'}} dividers={scroll === 'paper'}>      
      <TextField
        id="search"
        type="search"
        label="Search"
        fullWidth={true}
        value={ valueSetSearchTerm }
        onChange={ handleSetSearchText.bind(this) }
      />
      <DynamicSpacer />
      <ValueSetSelection 
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
      />
      

    </DialogContent>
  )
}

SearchValueSetsDialog.propTypes = {
  errorMessage: PropTypes.string
}
SearchValueSetsDialog.defaultProps = {}


export default SearchValueSetsDialog;