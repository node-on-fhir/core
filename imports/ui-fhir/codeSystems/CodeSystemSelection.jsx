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
import { Random } from 'meteor/random';

import moment from 'moment';
import { get, set, hast } from 'lodash';

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

  console.log('CodeSystemSelection.props.codeSystem', codeSystem)


  // const [codeSystemSearchTerm, handleSetSearchText] = useState("");
  // const [selectedValue, setSelectedValue] = useState({});

  searchTerm = useTracker(function(){
    return Session.get('CodeSystem.searchTerm');
  }, []);


  
  function handleClickRow(index){
    let selectedValue = get(codeSystem, 'concept.' + index);
    // setSelectedValue(selectedValue);
    Session.set('CodeSystem.selectedValue', selectedValue )

    console.log(selectedValue);

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
      <TableCell className="city">Code</TableCell>
    );
  }
  function renderDisplay(city){
    return (
      <TableCell className="city ">{ city }</TableCell>
    );
  }
  function renderDisplayHeader(){
    return (
      <TableCell className="city">Display</TableCell>
    );
  }


  let renderElements = [];
  let conceptsTable;
  let rowStyle = {
    cursor: 'pointer'
  }
  let codeSystemConcepts = get(codeSystem, 'concept');
  console.log('codeSystemConcepts', codeSystemConcepts)

  if(Array.isArray(codeSystemConcepts)){
    codeSystemConcepts.forEach(function(currentConcept, conceptIndex){

      if(searchTerm){
        if(((get(currentConcept, 'code', '')).includes(searchTerm)) || ((get(currentConcept, 'display', '')).includes(searchTerm))){
          renderElements.push(<TableRow className="practitionerRow" key={conceptIndex} style={rowStyle} onClick={ handleClickRow.bind(this, conceptIndex)} hover={true} >                      
            { renderCode(get(currentConcept, 'code')) }
            { renderDisplay(get(currentConcept, 'display'))}
          </TableRow>)
        }  
      } else {
        renderElements.push(<TableRow className="practitionerRow" key={conceptIndex} style={rowStyle} onClick={ handleClickRow.bind(this, conceptIndex)} hover={true} >                      
          { renderCode(get(currentConcept, 'code')) }
          { renderDisplay(get(currentConcept, 'display')) }
        </TableRow>)
      }
      
      // the following junky method is for v3 class role parsing
      // it should be extracted into its own method 
      if(Array.isArray(currentConcept.concept)){
        if(get(currentConcept, 'concept[0].code') === "_RoleClassAssociative"){
          console.log('_RoleClassAssociative found')

          if(Array.isArray(currentConcept.concept[0].concept)){


            if(get(currentConcept, 'concept[0].concept[0].code') === "_RoleClassMutualRelationship"){
    
              console.log('_RoleClassMutualRelationship found')

              if(Array.isArray(currentConcept.concept[0].concept[0].concept)){

                currentConcept.concept[0].concept[0].concept.forEach(function(mutualRelationRole, mutualRelationIndex){
                  if(get(mutualRelationRole, 'code') === "_RoleClassRelationshipFormal"){
                    console.log('_RoleClassRelationshipFormal found')
  
                    if(Array.isArray(mutualRelationRole.concept)){
  
                      mutualRelationRole.concept.forEach(function(roleClass, roleIndex){
                        if(get(roleClass, 'code') === "LIC"){
                          console.log('licensed entitites found')

                          if(Array.isArray(roleClass.concept)){
                            roleClass.concept.forEach(function(licensedRole){
                              let rowKey = Random.id();
                              if(searchTerm){
                                if(((get(licensedRole, 'code', '')).includes(searchTerm)) || ((get(licensedRole, 'display', '')).includes(searchTerm))){
                                  renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                                    { renderCode(get(licensedRole, 'code')) }
                                    { renderDisplay(get(licensedRole, 'display')) }
                                  </TableRow>)
                                }  
                              } else {
                                renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                                  { renderCode(get(licensedRole, 'code')) }
                                  { renderDisplay(get(licensedRole, 'display')) }
                                </TableRow>)
                              }  
                            })
                          }
                        } else {
                          let rowKey = Random.id();
                          if(searchTerm){
                            if(((get(roleClass, 'code', '')).includes(searchTerm)) || ((get(roleClass, 'display', '')).includes(searchTerm))){
                              renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                                { renderCode(get(roleClass, 'code')) }
                                { renderDisplay(get(roleClass, 'display')) }
                              </TableRow>)
                            }  
                          } else {
                            renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                              { renderCode(get(roleClass, 'code')) }
                              { renderDisplay(get(roleClass, 'display')) }
                            </TableRow>)
                          }  
                        }                  
                      })
                    }                   
                  } else {
                    let rowKey = Random.id();
                    if(searchTerm){
                      if(((get(mutualRelationRole, 'code', '')).includes(searchTerm)) || ((get(mutualRelationRole, 'display', '')).includes(searchTerm))){
                        renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                          { renderCode(get(mutualRelationRole, 'code')) }
                          { renderDisplay(get(mutualRelationRole, 'display')) }
                        </TableRow>)
                      }  
                    } else {
                      renderElements.push(<TableRow className="practitionerRow" key={rowKey} style={rowStyle} onClick={ handleClickRow.bind(this, rowKey)} hover={true} >                      
                        { renderCode(get(mutualRelationRole, 'code')) }
                        { renderDisplay(get(mutualRelationRole, 'display')) }
                      </TableRow>)
                    }
                  }
                })
              }              
            }
          }
        }
      }


      // let includeConcepts = get(includeSystem, 'concept');
      // if(Array.isArray(includeConcepts) && !hideConcepts){
      //   includeConcepts.forEach(function(concept, index){         
          // if(((get(concept, 'code', '')).includes(searchTerm)) || ((get(concept, 'display', '')).includes(searchTerm))){
            // renderElements.push(<Grid item xs={3} key={index + "y"} >
            //   <Typography 
            //     id={"concecptCode-" + get(concept, 'code')}
            //     name={"concecptCode-" + get(concept, 'code')}
            //     variant="h5"
            //     label={index === 0 ? 'Concept Code' : ''}
            //     key={index + 'a'}
            //     style={{cursor: 'pointer', color: 'black'}}
            //     onClick={handleClickRow.bind(this, index)}
            //   >{get(concept, 'code')}</Typography>
            // </Grid>)
            // renderElements.push(<Grid item xs={9} key={index + "w"}>
            //   <Typography 
            //     id={"conceptDisplay-" + get(concept, 'code')}
            //     name={"conceptDisplay-" + get(concept, 'code')}
            //     variant="h5"
            //     label={index === 0 ? 'Concept Display' : ''}
            //     key={index + 'd'}
            //     style={{cursor: 'pointer', color: 'black'}}
            //     onClick={handleClickRow.bind(this, index)}
            //   >{get(concept, 'display')}</Typography>
            // </Grid>)
          //}

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
  searchTerm: '',
  codeSystem: {}
}

export default CodeSystemSelection;