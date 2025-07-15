import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Button  
} from '@mui/material';


import { get } from 'lodash';
import { FhirUtilities } from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';


// //===========================================================================
// // FLATTENING / MAPPING

// dehydrateQuestionnaireResponse = function(questionnaireResponse){
//   let result = {
//     _id: questionnaireResponse._id,
//     id: '',
//     title: '',
//     identifier: '',
//     questionnaire: '',
//     status: '',
//     subjectDisplay: '',
//     subjectReference: '',
//     sourceDisplay: '',
//     sourceReference: '',
//     encounter: '',
//     author: '',
//     date: '',
//     count: 0
//   };


//   // there's an off-by-1 error between momment() and Date() that we want
//   // to account for when converting back to a string
//   result.date = moment(questionnaireResponse.authored).add(1, 'days').format("YYYY-MM-DD HH:mm")
//   result.questionnaire = get(questionnaireResponse, 'questionnaire', '');
//   result.encounter = get(questionnaireResponse, 'encounter.reference', '');
//   result.subjectDisplay = get(questionnaireResponse, 'subject.display', '');
//   result.subjectReference = get(questionnaireResponse, 'subject.reference', '');
//   result.sourceDisplay = get(questionnaireResponse, 'source.display', '');
//   result.sourceReference = get(questionnaireResponse, 'source.reference', '');
//   result.author = get(questionnaireResponse, 'author.display', '');
//   result.identifier = get(questionnaireResponse, 'identifier.value', '');
//   result.status = get(questionnaireResponse, 'status', '');
//   result.id = get(questionnaireResponse, 'id', '');

//   let items = get(questionnaireResponse, 'item', []);

//   result.count = items.length;
  
//   return result;
// }

//===========================================================================
// MAIN COMPONENT 

export function QuestionnaireResponsesTable(props){

  let { 
    children, 
    id,

    data,
    questionnaireResponses,
    selectedResponseId,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideIdentifier,
    hideSourceDisplay,
    hideSourceReference,
    hideSubjectDisplay,
    hideSubjectReference,
    hideQuestionnaire,
    hideStatus,
    hideBarcode,
    hideAuthored,
    hideActionIcons,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    
    formFactorLayout,
    multiline,

    page,
    onSetPage,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout: ' +  formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideSourceDisplay = false;
        hideSourceReference = true;
        hideSubjectDisplay = true;
        hideSubjectReference = true;
        hideAuthored = true;
        hideStatus = true;
        hideBarcode = true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideSourceDisplay = false;
        hideSourceReference = true;
        hideSubjectDisplay = true;
        hideSubjectReference = true;
        hideStatus = false;
        hideBarcode = true;
        hideAuthored = true;
        multiline = true;
        break;
      case "web":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideSourceDisplay = false;
        hideSourceReference = true;
        hideSubjectDisplay = true;
        hideSubjectReference = false;
        hideStatus = false;
        hideAuthored = false;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideSourceDisplay = false;
        hideSourceReference = true;
        hideSubjectDisplay = true;
        hideSubjectReference = false;
        hideStatus = false;
        hideAuthored = false;
        hideBarcode = false;
        break;
      case "hdmi":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideSourceDisplay = false;
        hideSourceReference = true;
        hideSubjectDisplay = true;
        hideSubjectReference = false;
        hideStatus = false;
        hideAuthored = false;
        hideBarcode = false;
        break;   
      case "hdmi":
        hideCheckbox = true;
        hideActionIcons = false;
        hideIdentifier = false;
        hideSourceDisplay = false;
        hideSourceReference = false;
        hideSubjectDisplay = true;
        hideSubjectReference = false;
        hideStatus = false;
        hideBarcode = false;
        hideAuthored = false;
        break;            
    }
  }


  // ------------------------------------------------------------------------
  // CRUD Methods

  function removeRecord(_id){
    console.log('Remove questionnaire ', _id)
    if(onRemoveRecord){
      onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof onCellClick === "function"){
      onCellClick(id);
    }
  }

  function handleMetaClick(patient){
    let self = this;
    if(onMetaClick){
      onMetaClick(self, patient);
    }
  }

  function handleRowClick(responseId){
    if(typeof onRowClick === "function"){
      onRowClick(responseId);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderToggleHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            <Checkbox
              defaultChecked={true}
            />
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(measureReport ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(measureReport)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(measureReport._id)} />   */}
        </TableCell>
      );
    }
  } 
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className='status'>Status</TableCell>
      );
    }
  }
  function renderAuthored(authored){
    if (!hideAuthored) {
      return (
        <TableCell className='authored'>{ authored }</TableCell>
      );
    }
  }
  function renderAuthoredHeader(){
    if (!hideAuthored) {
      return (
        <TableCell className='authored'>Authored</TableCell>
      );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }
  function renderSubjectDisplay(subjectDisplay){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay'>{ subjectDisplay }</TableCell>
      );
    }
  }
  function renderSubjectDisplayHeader(){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay'>Subject</TableCell>
      );
    }
  }
  function renderSubjectReference(subjectReference){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>{ subjectReference }</TableCell>
      );
    }
  }
  function renderSubjectReferenceHeader(){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>Reference</TableCell>
      );
    }
  }
  function renderSourceReference(sourceReference){
    if (!hideSourceReference) {
      return (
        <TableCell className='sourceReference'>{ sourceReference }</TableCell>
      );
    }
  }
  function renderSourceReferenceHeader(){
    if (!hideSourceReference) {
      return (
        <TableCell className='sourceReference'>Source Reference</TableCell>
      );
    }
  }
  function renderSourceDisplay(sourceDisplay){
    if (!hideSourceDisplay) {
      return (
        <TableCell className='sourceDisplay'>{ sourceDisplay }</TableCell>
      );
    }
  }
  function renderSourceDisplayHeader(){
    if (!hideSourceDisplay) {
      return (
        <TableCell className='sourceDisplay'>Source Display</TableCell>
      );
    }
  }
  function renderQuestionnaire(response){ 
    if (!hideQuestionnaire) {
      if(multiline){
        return (<TableCell >
          <span className='authored' style={{fontWeight: 400}}>{ response.authored }</span> <span className='status' style={{float: 'right'}}>{ response.status }</span><br />
          <span className='questionnaireUrl' style={{color: 'gray'}}>{response.questionnaire }</span> <br />
          <span className='subjectReference' style={{color: 'gray'}}>{ response.subjectReference }</span>
        </TableCell>)  
      } else {
        return (
          <TableCell className='questionnaireUrl'>{ response.questionnaire }</TableCell>
        );  
      }
    }
  }
  function renderQuestionnaireHeader(){
    if (!hideQuestionnaire) {
      return (
        <TableCell className='questionnaireUrl'>Questionnaire</TableCell>
      );
    }
  }
      

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(patient){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, patient[i]._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering


  let tableRows = [];
  let responsesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(internalDateFormat){
    internalDateFormat = dateFormat;
  }

  // Pagination
  let paginationCount = 0;
  if(props.count){
    paginationCount = props.count;
  } else {
    paginationCount = questionnaireResponses ? questionnaireResponses.length : 0;
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPage || 5}
      page={page || 0}
      onPageChange={handleChangePage}
      style={{float: 'right', border: 'none'}}
    />
  }

  if(questionnaireResponses){
    if(questionnaireResponses.length > 0){              
      let count = 0;
      questionnaireResponses.forEach(function(questionnaireResponse){
        if((count >= ((page || 0) * (rowsPerPage || 5))) && (count < ((page || 0) + 1) * (rowsPerPage || 5))){
          responsesToRender.push(FhirDehydrator.dehydrateQuestionnaireResponse(questionnaireResponse, internalDateFormat));
        }
        count++;
      });  
    }
  }


  if(responsesToRender.length === 0){
    console.log('No questionnaire responses to render');
  } else {
    for (var i = 0; i < responsesToRender.length; i++) {
      tableRows.push(
        <TableRow key={i} className="patientRow" style={{cursor: "pointer"}} onClick={ handleRowClick.bind(this, responsesToRender[i]._id )} hover={true} >
          { renderToggle(responsesToRender[i]) }
          { renderActionIcons(responsesToRender[i]) }
          { renderIdentifier(responsesToRender[i].identifier) }
          { renderStatus(responsesToRender[i].status) }
          { renderAuthored(responsesToRender[i].authored) }
          { renderQuestionnaire(responsesToRender[i]) }
          { renderSubjectDisplay(responsesToRender[i].subjectDisplay) }
          { renderSubjectReference(responsesToRender[i].subjectReference) }
          { renderSourceReference(responsesToRender[i].sourceReference) }          
          { renderBarcode(responsesToRender[i].id) }
        </TableRow>
      );
    }
  }
  
  return(
    <div id={id} className="tableWithPagination">
      <Table id='questionnaireResponsesTable' >
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderAuthoredHeader() }
            { renderQuestionnaireHeader() }
            { renderSubjectDisplayHeader() }
            { renderSubjectReferenceHeader() }
            { renderSourceReferenceHeader() }
            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { paginationFooter }
    </div>
  );
}




QuestionnaireResponsesTable.propTypes = {
  id: PropTypes.string,
 
  questionnaireResponses: PropTypes.array,
  fhirVersion: PropTypes.string,
  query: PropTypes.object,
  sort: PropTypes.string,
  paginationLimit: PropTypes.number,
  selectedResponseId: PropTypes.string,  

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideSourceDisplay: PropTypes.bool,
  hideSourceReference: PropTypes.bool,
  hideSubjectDisplay: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideQuestionnaire: PropTypes.bool,
  hideAuthored: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionIcons: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onCheck: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,

  formFactorLayout: PropTypes.string,
  multiline: PropTypes.bool
};

// QuestionnaireResponsesTable.defaultTypes = {
//   tableRowSize: 'medium',
//   rowsPerPage: 5,
//   dateFormat: "YYYY-MM-DD",
//   multiline: false,
//   hideQuestionnaire: false,
//   hideCheckbox: true,
//   hideIdentifier: true,
//   hideSubjectDisplay: true,
//   hideSubjectReference: false,
//   hideSourceDisplay: false,
//   hideSourceReference: false,
//   hideBarcode: false,
//   hideActionIcons: true,
//   hideStatus: false,
//   hideAuthored: false
// }


export default QuestionnaireResponsesTable;