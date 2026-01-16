import { 
  Grid, 
  Container,
  Button,
  Typography,
  DatePicker,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';

import { FhirUtilities } from '../../lib/FhirUtilities';
import { lookupReferenceName } from '../../lib/FhirDehydrator';

//====================================================================================
// THEMING


//====================================================================================
// SESSION VARIABLES

let defaultValueSet = {
  resourceType: 'ValueSet'
}

Session.setDefault('ValueSet.Current', defaultValueSet)


//====================================================================================
// MAIN COMPONENT

export function ValueSetDetail(props){

  let { 
    children, 
    valueSet,
    hideTitleElements,
    hideDescriptionElements,
    hideConcepts,
    hideTable,  
    jsonContent,
    ...otherProps 
  } = props;


  let activeValueSet = defaultValueSet;

  activeValueSet = useTracker(function(){
    return Session.get('ValueSet.Current');
  }, []);  

  // inefficient, because the tracker is still running; but hey...
  if(valueSet){
    activeValueSet = valueSet;
  }

  function updateField(path, event){
    console.log('updateField', event.currentTarget.value);

    // setCurrentCodeSystem(set(currentCodeSystem, path, event.currentTarget.value))
    Session.set('ValueSet.Current', set(activeCodeSystem, path, event.currentTarget.value))    
  }



  let renderElements = [];
  let conceptsTable;
  let composeIncludes = get(activeValueSet, 'compose.include');
  console.log('composeIncludes', composeIncludes)

  if(Array.isArray(composeIncludes)){
    composeIncludes.forEach(function(includeSystem, includeSystemIndex){
      renderElements.push(<Grid item xs={12} key={includeSystemIndex + "z"}>
        <TextField
          id={"includeSystem-" + includeSystemIndex}
          name={"includeSystem-" + includeSystemIndex}
          type='text'
          label='Group Code'
          value={get(includeSystem, 'system')}
          fullWidth          
          style={{marginTop: '20px'}}
          disabled
          key={includeSystemIndex + 'm'}
        />

      </Grid>)

      let includeConcepts = get(includeSystem, 'concept');
      if(Array.isArray(includeConcepts) && !hideConcepts){
        includeConcepts.forEach(function(concept, index){          
          renderElements.push(<Grid item xs={3} key={includeSystemIndex + "y"}>
            <TextField
              id={"concecptCode-" + get(concept, 'code')}
              name={"concecptCode-" + get(concept, 'code')}
              type='text'
              label={index === 0 ? 'Concept Code' : ''}
              value={get(concept, 'code')}
              fullWidth   
              InputLabelProps={index === 0 ? {shrink: true} : null }
              key={index + 'a'}
              // style={index === 0 ? {marginBottom: '20px'} : null }
            />  

          </Grid>)
          renderElements.push(<Grid item xs={9} key={includeSystemIndex + "w"}>
            <TextField
              id={"conceptDisplay-" + get(concept, 'code')}
              name={"conceptDisplay-" + get(concept, 'code')}
              type='text'
              label={index === 0 ? 'Concept Display' : ''}
              value={get(concept, 'display')}
              fullWidth   
              InputLabelProps={index === 0 ? {shrink: true} : null }
              key={index + 'b'}
              // style={index === 0 ? {marginBottom: '20px'} : null }         
            />  
          </Grid>)

        })
      }

      
      if(Array.isArray(includeConcepts) && hideTable){
        let tableElements = [];
        includeConcepts.forEach(function(concept, index){          
          tableElements.push(<TableRow key={index} key={includeSystemIndex}>
            <TableCell>
              <TextField
                id={"concecptCode-" + get(concept, 'code')}
                name={"concecptCode-" + get(concept, 'code')}
                type='text'
                label={index === 0 ? 'Concept Code' : ''}
                value={get(concept, 'code')}
                fullWidth   
                InputLabelProps={index === 0 ? {shrink: true} : null }
                key={includeSystemIndex + 'n'}
                // style={index === 0 ? {marginBottom: '20px'} : null }
              />
            </TableCell>  
          </TableRow>)
          tableElements.push(<TableRow>
            <TextField
              id={"conceptDisplay-" + get(concept, 'code')}
              name={"conceptDisplay-" + get(concept, 'code')}
              type='text'
              label={index === 0 ? 'Concept Display' : ''}
              value={get(concept, 'display')}
              fullWidth   
              InputLabelProps={index === 0 ? {shrink: true} : null }
              key={includeSystemIndex + 'p'}
              // style={index === 0 ? {marginBottom: '20px'} : null }         
            />  
          </TableRow>)
          conceptsTable = <Table>
            { tableElements }
          </Table>
        })

      }
    })    
  }

  let approvedOnDate = '';
  if(get(activeValueSet, 'approvedDate')){
    approvedOnDate = moment(get(activeValueSet, 'approvedDate')).format("YYYY-MM-DD")
  }
  let lastEditedDate = '';
  if(get(activeValueSet, 'date')){
    lastEditedDate = moment(get(activeValueSet, 'date')).format("YYYY-MM-DD")
  }
  let lastReviewDate = '';
  if(get(activeValueSet, 'lastReviewDate')){
    lastReviewDate = moment(get(activeValueSet, 'lastReviewDate')).format("YYYY-MM-DD")
  }

  let titleElements;
  if(!hideTitleElements){
    titleElements = <Grid container spacing={3}>
      <Grid item xs={6}>
        <TextField
          id="titleInput"
          name="titleInput"
          type='text'
          label='Title'
          value={get(activeValueSet, 'title')}
          onChange={updateField.bind(this, 'title')}
          fullWidth  
          InputLabelProps={{
            shrink: true,
          }}
          style={{marginBottom: '20px'}}        
        />
        <TextField
          id="publisherInput"
          name="publisherInput"
          type='text'
          label='Publisher'
          value={get(activeValueSet, 'publisher')}
          onChange={updateField.bind(this, 'publisher')}
          fullWidth   
          InputLabelProps={{
            shrink: true,
          }}
          style={{marginBottom: '20px'}}             
        />  
      </Grid>
      <Grid item xs={3}>
        <TextField
          id="versionInput"
          name="versionInput"
          type='text'
          label='Version'
          value={get(activeValueSet, 'version')}
          onChange={updateField.bind(this, 'version')}
          fullWidth   
          InputLabelProps={{
            shrink: true,
          }}
          style={{marginBottom: '20px'}}             
        /> 
        {/* <TextField
            id="identifierInput"
            name="identifierInput"
          type='text'
          label='Identifier'
          value={get(activeValueSet, 'identifier[0].value')}
          onChange={updateField.bind(this, 'identifier[0].value')}
          fullWidth   
          InputLabelProps={{
            shrink: true,
          }}
          style={{marginBottom: '20px'}}             
        />  */}
      </Grid>
      <Grid item xs={3}>
        <TextField
          id="statusInput"
          name="statusInpactiveValueSetut"
          type='text'
          label='Status'
          value={get(activeValueSet, 'status')}
          onChange={updateField.bind(this, 'status')}
          fullWidth   
          InputLabelProps={{
            shrink: true,
          }}
          style={{marginBottom: '20px'}}             
        /> 
      </Grid>          
    </Grid>
  }


  let descriptionElements;
  if(!hideDescriptionElements){
    descriptionElements = <Grid container spacing={3}>
      <Grid item xs={12}>            
        <TextField
          id="descriptionInput"
          name="descriptionInput"
          type='text'
          label='Description'
          value={get(activeValueSet, 'description')}
          onChange={updateField.bind(this, 'description')}
          fullWidth   
          InputLabelProps={{
            shrink: true,
          }}                     
        />                          
      </Grid>

    </Grid>
  }


  return(
    <div className='ValueSetDetails'>

        { titleElements }
        { descriptionElements }
        
        <Grid container spacing={3}>
          { renderElements }
          {/* { conceptsTable } */}
        </Grid>
    </div>
  );
}

ValueSetDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  valueSetId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  valueSet: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func,

  hideTitleElements: PropTypes.bool,
  hideDescriptionElements: PropTypes.bool,
  hideConcepts: PropTypes.bool,
  hideTable: PropTypes.bool
};
ValueSetDetail.defaultValues = {
  hideTitleElements: false,
  hideDescriptionElements: false,
  hideConcepts: false,
  hideTable: true
}

export default ValueSetDetail;