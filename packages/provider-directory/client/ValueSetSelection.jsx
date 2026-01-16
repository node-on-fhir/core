import React, { useState } from 'react';
import { useTracker } from 'meteor/react-meteor-data';

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
} from '@material-ui/core';


import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';

import { FhirUtilities, lookupReferenceName } from 'meteor/clinical:hl7-fhir-data-infrastructure';

//====================================================================================
// THEMING

import { ThemeProvider, makeStyles } from '@material-ui/styles';
const useStyles = makeStyles(theme => ({
  button: {
    background: theme.background,
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: theme.buttonText,
    height: 48,
    padding: '0 30px',
  },
  input: {
    marginBottom: '20px'
  },
  compactInput: {
    marginBottom: '10px'
  },
  label: {
    paddingBottom: '10px'
  }
}));



//====================================================================================
// SESSION VARIABLES

let defaultValueSet = {
  resourceType: 'ValueSet'
}

Session.setDefault('ValueSet.Current', defaultValueSet)


//====================================================================================
// MAIN COMPONENT

export function ValueSetSelection(props){

  let classes = useStyles();

  let { 
    children, 
    valueSet,
    hideTitleElements,
    hideDescriptionElements,
    hideConcepts,
    hideTable,  
    jsonContent,
    searchTerm,
    onSelection,
    ...otherProps 
  } = props;

  let [ activeValueSet, setActiveValueSet ] = useState(valueSet);

  let data = {
    activeValueSet: valueSet
  }

  useTracker(function(){
    setActiveValueSet(Session.get('selectedValueSet'));
  }, []);  

  const [valueSetSearchTerm, handleSetSearchText] = useState("");
  const [selectedValue, setSelectedValue] = useState({});
  // const [renderElements, setRenderElements] = useState([]);


  function updateField(path, event){
    console.log('updateField', event.currentTarget.value);

    // setCurrentCodeSystem(set(currentCodeSystem, path, event.currentTarget.value))
    Session.set('ValueSet.Current', set(activeCodeSystem, path, event.currentTarget.value))    
  }

  function handleClickRow(index){
    console.log("handleClickRow", index)
    console.log("valueSet", valueSet)
    

    let selectedValue;
    if(get(valueSet, 'compose')){
      selectedValue = get(valueSet, 'compose.include.0.concept.' + index);
    } else if (get(valueSet, 'expansion')){
      selectedValue = get(valueSet, 'expansion.contains.' + index);
    }
    console.log("selectedValue", selectedValue);

    setSelectedValue(selectedValue); 

    if(typeof onSelection === "function"){
      onSelection(selectedValue)
    }
  }

  function renderCode(city){
    return (
      <TableCell className="city ">{ city }</TableCell>
    );
  }
  function renderCodeHeader(){
    return (
      <TableCell className="city">City</TableCell>
    );
  }
  function renderDisplay(city){
    return (
      <TableCell className="city ">{ city }</TableCell>
    );
  }
  function renderDisplayHeader(){
    return (
      <TableCell className="city">City</TableCell>
    );
  }

  let renderElements = [];
  let conceptsTable;
  let composeIncludes;
  let expansionContains;

  let rowStyle = {
    cursor: 'pointer'
  }


  if(get(valueSet, 'expansion.contains')){
    expansionContains = get(valueSet, 'expansion.contains');
    // console.log('expansionContains', expansionContains)
  
    if(Array.isArray(expansionContains)){
      expansionContains.forEach(function(concept, conceptIndex){        
        if(((get(concept, 'code', '')).includes(searchTerm)) || ((get(concept, 'display', '')).includes(searchTerm))){
          renderElements.push(<TableRow className="practitionerRow" key={conceptIndex} style={rowStyle} onClick={ handleClickRow.bind(this, conceptIndex)} hover={true} >                      
            { renderCode(get(concept, 'code')) }
            { renderDisplay(get(concept, 'display')) }
          </TableRow>)
        }
      })    
    }
  }

  if(get(valueSet, 'compose.include')){
    composeIncludes = get(valueSet, 'compose.include');
    console.log('composeIncludes', composeIncludes)
  
    if(Array.isArray(composeIncludes)){
      composeIncludes.forEach(function(includeSystem, includeSystemIndex){
        
    //     // if(Array.isArray(includeConcepts) && !hideConcepts){
        if(Array.isArray(get(includeSystem, 'concept'))){
          
          includeSystem.concept.forEach(function(concept, conceptIndex){         
            console.log('concept', concept)

            
            if(((get(concept, 'code', '')).includes(searchTerm)) || ((get(concept, 'display', '')).includes(searchTerm))){
              renderElements.push(<TableRow className="practitionerRow" key={conceptIndex} style={rowStyle} onClick={ handleClickRow.bind(this, conceptIndex)} hover={true} >                      
                { renderCode(get(concept, 'code')) }
                { renderDisplay(get(concept, 'display')) }
              </TableRow>)
            }
  
          })
        }        
      })    
    }
  }

  let approvedOnDate = '';
  if(get(valueSet, 'approvedDate')){
    approvedOnDate = moment(get(valueSet, 'approvedDate')).format("YYYY-MM-DD")
  }
  let lastEditedDate = '';
  if(get(valueSet, 'date')){
    lastEditedDate = moment(get(valueSet, 'date')).format("YYYY-MM-DD")
  }
  let lastReviewDate = '';
  if(get(valueSet, 'lastReviewDate')){
    lastReviewDate = moment(get(valueSet, 'lastReviewDate')).format("YYYY-MM-DD")
  }



  console.log('renderElements', renderElements)
  return(
    <div className='ValueSetSelections'> 
      <Table id="valueSetElements" >
        <TableHead>
          <TableRow>
            { renderCodeHeader() } 
            { renderDisplayHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { renderElements }
        </TableBody>
      </Table>
    </div>
  );
}

ValueSetSelection.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,

  searchTerm: PropTypes.string,

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
  hideTable: PropTypes.bool,

  onSelection: PropTypes.func,
  jsonContent: PropTypes.object
};
ValueSetSelection.defaultValues = {
  hideTitleElements: false,
  hideDescriptionElements: false,
  hideConcepts: false,
  hideTable: true,
  searchTerm: '',
  valueSet: {
    resourceType: 'ValueSet'
  },
  jsonContent: {}
}

export default ValueSetSelection;