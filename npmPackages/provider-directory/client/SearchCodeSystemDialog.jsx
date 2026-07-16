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
import { HTTP } from '../lib/httpClient';
import JSON5 from 'json5';

import { FhirUtilities } from '/imports/FhirUtilities';
import { DynamicSpacer } from '/imports/ui/DynamicSpacer';
import { CodeSystemDetail } from '/imports/ui-details';
import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';

import { CodeSystemSelection } from './CodeSystemSelection';




export function SearchCodeSystemDialog(props){

  const [codeSystemSearchTerm, setCodeSystemSearchTerm] = useState("");

  let selectedCodeSystem = useTracker(function(){
    return CodeSystems.findOne({id: Session.get('selectedCodeSystem')});
  }, []);

  console.log('selectedCodeSystem', selectedCodeSystem)

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

  // console.log('SearchCodeSystemDialog', errorMessage)

  if(errorMessage){
    if(typeof errorMessage === "string"){
      textToRender = errorMessage
    } else if(typeof errorMessage === "object") {
      textToRender = JSON.stringify(errorMessage, null, 2);
    }
  } 
  

  function handleSetSearchText(event){
      setCodeSystemSearchTerm(event.currentTarget.value)
  }

  // --------------------------------------------------------------------------------------------------------------------------------
  // Rendering



  return(
    <DialogContent id={id} className="SearchCodeSystemDialog" style={{width: '100%'}} dividers={scroll === 'paper'}>      
      <TextField
        id="search"
        type="search"
        label="Search"
        fullWidth={true}
        value={ codeSystemSearchTerm }
        onChange={ handleSetSearchText.bind(this) }
      />
      <DynamicSpacer />
      <CodeSystemSelection 
        codeSystem={selectedCodeSystem}
        searchTerm={ codeSystemSearchTerm }
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

SearchCodeSystemDialog.propTypes = {
  errorMessage: PropTypes.string
}
SearchCodeSystemDialog.defaultProps = {}


export default SearchCodeSystemDialog;