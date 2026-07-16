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


import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';

import { FhirUtilities } from '/imports/FhirUtilities';
import { lookupReferenceName } from '/imports/lib/FhirDehydrator';

//====================================================================================
// SESSION VARIABLES

let defaultValueSet = {
  resourceType: 'ValueSet'
}

Session.setDefault('ValueSet.Current', defaultValueSet)


//====================================================================================
// MAIN COMPONENT

export function CodeSystemSelection(props){

  let {
    children, 
    codeSystem,
    hideTitleElements,
    hideDescriptionElements,
    hideConcepts,
    hideTable,  
    jsonContent,
    searchTerm,
    onSelection,
    ...otherProps 
  } = props;


  const [codeSystemSearchTerm, handleSetSearchText] = useState("");
  const [selectedValue, setSelectedValue] = useState({});


  function handleClickRow(index){
    let selectedValue = get(codeSystem, 'concept.' + index);
    setSelectedValue(selectedValue);

    console.log(selectedValue);

    if(typeof onSelection === "function"){
      onSelection(selectedValue)
    }
  }


  let renderElements = [];
  let conceptsTable;
  let codeSystemConcepts = get(codeSystem, 'concept');
  console.log('codeSystemConcepts', codeSystemConcepts)

  if(Array.isArray(codeSystemConcepts)){
    codeSystemConcepts.forEach(function(concept, index){
      // let includeConcepts = get(includeSystem, 'concept');
      // if(Array.isArray(includeConcepts) && !hideConcepts){
      //   includeConcepts.forEach(function(concept, index){         
          if(((get(concept, 'code', '')).includes(searchTerm)) || ((get(concept, 'display', '')).includes(searchTerm))){
            renderElements.push(<Grid item xs={3} key={index + "y"} >
              <Typography 
                id={"concecptCode-" + get(concept, 'code')}
                name={"concecptCode-" + get(concept, 'code')}
                variant="h5"
                label={index === 0 ? 'Concept Code' : ''}
                key={index + 'a'}
                style={{cursor: 'pointer', color: 'black'}}
                onClick={handleClickRow.bind(this, index)}
              >{get(concept, 'code')}</Typography>
            </Grid>)
            renderElements.push(<Grid item xs={9} key={index + "w"}>
              <Typography 
                id={"conceptDisplay-" + get(concept, 'code')}
                name={"conceptDisplay-" + get(concept, 'code')}
                variant="h5"
                label={index === 0 ? 'Concept Display' : ''}
                key={index + 'd'}
                style={{cursor: 'pointer', color: 'black'}}
                onClick={handleClickRow.bind(this, index)}
              >{get(concept, 'display')}</Typography>
            </Grid>)
          }

      //   })
      // }

      
      // if(Array.isArray(includeConcepts) && hideTable){
      //   let tableElements = [];
      //   includeConcepts.forEach(function(concept, index){          
      //     tableElements.push(<TableRow key={index} key={includeSystemIndex}>
      //       <TableCell>
      //         <TextField
      //           id={"concecptCode-" + get(concept, 'code')}
      //           name={"concecptCode-" + get(concept, 'code')}
      //           type='text'
      //           label={index === 0 ? 'Concept Code' : ''}
      //           value={get(concept, 'code')}
      //           fullWidth   
      //           InputLabelProps={index === 0 ? {shrink: true} : null }
      //           key={includeSystemIndex + 'n'}
      //           // style={index === 0 ? {marginBottom: '20px'} : null }
      //         />
      //       </TableCell>  
      //     </TableRow>)
      //     tableElements.push(<TableRow>
      //       <TextField
      //         id={"conceptDisplay-" + get(concept, 'code')}
      //         name={"conceptDisplay-" + get(concept, 'code')}
      //         type='text'
      //         label={index === 0 ? 'Concept Display' : ''}
      //         value={get(concept, 'display')}
      //         fullWidth   
      //         InputLabelProps={index === 0 ? {shrink: true} : null }
      //         key={includeSystemIndex + 'p'}
      //         // style={index === 0 ? {marginBottom: '20px'} : null }         
      //       />  
      //     </TableRow>)
      //     conceptsTable = <Table>
      //       { tableElements }
      //     </Table>
      //   })

      // }
    })    
  }

  let approvedOnDate = '';
  if(get(codeSystem, 'approvedDate')){
    approvedOnDate = moment(get(codeSystem, 'approvedDate')).format("YYYY-MM-DD")
  }
  let lastEditedDate = '';
  if(get(codeSystem, 'date')){
    lastEditedDate = moment(get(codeSystem, 'date')).format("YYYY-MM-DD")
  }
  let lastReviewDate = '';
  if(get(codeSystem, 'lastReviewDate')){
    lastReviewDate = moment(get(codeSystem, 'lastReviewDate')).format("YYYY-MM-DD")
  }




  return(
    <div className='CodeSystemSelections'>
        
        <Grid container spacing={3}>
          { renderElements }
        </Grid>
    </div>
  );
}

CodeSystemSelection.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,

  searchTerm: PropTypes.string,

  codeSystemId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  codeSystem: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func,

  hideTitleElements: PropTypes.bool,
  hideDescriptionElements: PropTypes.bool,
  hideConcepts: PropTypes.bool,
  hideTable: PropTypes.bool,

  onSelection: PropTypes.func
};
CodeSystemSelection.defaultValues = {
  hideTitleElements: false,
  hideDescriptionElements: false,
  hideConcepts: false,
  hideTable: true,
  searchTerm: ''
}

export default CodeSystemSelection;