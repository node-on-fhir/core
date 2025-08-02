import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { 
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination
} from '@mui/material';


import moment from 'moment';
import { get } from 'lodash';

import { Random } from 'meteor/random'

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'



//=============================================================================================================================================
// need to pass these in via props

Meteor.startup(function(){
  window.FhirDehydrator = Meteor.FhirDehydrator;
  window.FhirUtilities = Meteor.FhirUtilities;
})


//===========================================================================
// THEMING




//===========================================================================
// MAIN COMPONENT

function ClaimsTable(props){
  logger.info('Rendering the ClaimsTable');
  logger.verbose('clinical:hl7-fhir-data-infrastructure.client.ClaimsTable');
  logger.data('ClaimsTable.props', {data: props}, {source: "ClaimsTable.jsx"});


  
  let { 
    id,
    children, 

    data,
    claims = [],
    selectedClaimId,

    query,
    paginationLimit,
    disablePagination = false,
  
    hideCheckbox = true,
    hideActionIcons = true,
    hideActionButton = true,
    defaultCheckboxValue = true,

    hideBarcode = false,
    hideTextIcon,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage = 5,
    tableRowSize = "medium",
    dateFormat = "YYYY-MM-DD hh:mm:ss",
    showMinutes,
    hideEnteredInError,
    formFactorLayout,
    count,
    labels = {
      checkbox: "Checkbox",
      snomedDisplay: "SNOMED Display",
      snomedCode: "SNOMED Code"
    },

    

    page,
    onSetPage,

    ...otherProps 
  } = props;


    // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = true;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = true;
        hideEvidence = true;
        hideDates = true;
        hideEndDate = true;
        hideBarcode = true;  
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = false;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideEvidence = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;   
        multiline = false;
        hideTextIcon = false
        hideTextIcon = false
        break;
      case "web":
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hidePatientName = false;
        hideVerification = true;
        hideSeverity = true;
        hideEvidence = true;
        hideDates = true;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hideClinicalStatus = true;
        hidePatientName = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideEvidence = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideClinicalStatus = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = false;
        hideEvidence = false;
        hideDates = false;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;            
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(claims)){
    // if(!hasInitializedAutoColumns){
    //   let columnHasData = {
    //     identifier: false,
    //     patientName: false,
    //     patientReference: false,
    //     asserterName: false,
    //     clinicalStatus: false,
    //     snomedCode: false,
    //     snomedDisplay: false,
    //     verification: false,
    //     serverity: false,
    //     evidence: false,
    //     dates: false,
    //     endDate: false,
    //     barcode: false
    //   }
      
    //   let dehydrateedCollection = claims.map(function(record){
    //     return dehydrateClaim(record, "YYYY-MM-DD");
    //   });      
  
    //   dehydrateedCollection.forEach(function(row){
    //     if(get(row, 'id')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'identifier')){
    //       columnHasData.identifier = true;
    //     }
    //     if(get(row, 'clinicalStatus')){
    //       columnHasData.clinicalStatus = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'patientDisplay')){
    //       columnHasData.patientName = true;
    //     }
    //     if(get(row, 'patientReference')){
    //       columnHasData.patientReference = true;
    //     }
    //     if(get(row, 'severity')){
    //       columnHasData.severity = true;
    //     }
    //     if(get(row, 'snomedCode')){
    //       columnHasData.snomedCode = true;
    //     }
    //     if(get(row, 'snomedDisplay')){
    //       columnHasData.snomedDisplay = true;
    //     }
    //     if(get(row, 'evidenceDisplay')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'evidence')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'onsetDateTime')){
    //       columnHasData.dates = true;
    //     }
    //     if(get(row, 'abatementDateTime')){
    //       columnHasData.endDate = true;
    //     }
    //   })
  
    //   setHasInitializedAutoColumns(true);
    //   setAutoColumns(columnHasData)
    // }
  //}


  //---------------------------------------------------------------------
  // Helper Functions

  function handleToggle(index){
    console.log('Toggling entry ' + index)
    if(props.onToggle){
      props.onToggle(index);
    }
  }

  function removeRecord(_id){
    console.log('removeRecord')
  }
  function handleRowClick(id){
    

    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    }
  }
  function handleActionButtonClick(_id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(_id);
    }
  }
  
  //---------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >{get(labels, 'checkbox', 'Checkbox')}</TableCell>
      );
    }
  }
  function renderCheckbox(index){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{padding: '0px'}}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
            onChange={ handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderEndDateHeader(){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderStartDate(startDate ){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(startDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderEndDate(endDate ){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(endDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderTextIconHeader(){
    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon'>Text</TableCell>
      );
    }
  }
  function renderTextIcon(textDiv ){

    let textIcon = "None";
    if((typeof textDiv === "string" && (textDiv.length > 0))){
      textIcon = "Text"
    }

    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon' style={{minWidth: '140px'}}>{ textIcon }</TableCell>
      );
    }
  }
  function renderPatientNameHeader(){
    if (!hidePatientName) {
      return (
        <TableCell className='patientDisplay'>Patient</TableCell>
      );
    }
  }
  function renderPatientName(patientDisplay ){
    if (!hidePatientName) {
      return (
        <TableCell className='patientDisplay' style={{minWidth: '140px'}}>{ patientDisplay }</TableCell>
      );
    }
  }
  function renderPatientReferenceHeader(){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>Patient Reference</TableCell>
      );
    }
  }
  function renderPatientReference(patientReference ){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(patientReference) }
        </TableCell>
      );
    }
  }
  function renderAsserterNameHeader(){
    if (!hideAsserterName) {
      return (
        <TableCell className='asserterDisplay'>Asserter</TableCell>
      );
    }
  }
  function renderAsserterName(asserterDisplay ){
    if (!hideAsserterName) {
      return (
        <TableCell className='asserterDisplay' style={{minWidth: '140px'}}>{ asserterDisplay }</TableCell>
      );
    }
  }  
  function renderSeverityHeader(){
    if (!hideSeverity) {
      return (
        <TableCell className='renderSeverity'>Severity</TableCell>
      );
    }
  }
  function renderSeverity(severity ){
    if (!hideSeverity) {
      return (
        <TableCell className='severity'>{ severity }</TableCell>
      );
    }
  } 
  function renderEvidenceHeader(){
    if (!hideEvidence) {
      return (
        <TableCell className='evidence'>Evidence</TableCell>
      );
    }
  }
  function renderEvidence(evidenceDisplay ){
    if (!hideEvidence) {
      return (
        <TableCell className='evidence'>{ evidenceDisplay }</TableCell>
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
  function renderIdentifier(identifier ){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  } 
  function renderClinicalStatus(clinicalStatus){
    if (!hideClinicalStatus) {
      return (
        <TableCell className='clinicalStatus'>{ clinicalStatus }</TableCell>
      );
    }
  }
  function renderClinicalStatusHeader(){
    if (!hideClinicalStatus) {
      return (
        <TableCell className='clinicalStatus'>Clinical Status</TableCell>
      );
    }
  }
  function renderSnomedCode(snomedCode){
    if (!hideSnomedCode) {
      return (
        <TableCell className='snomedCode' style={{width: '180px'}}>{ snomedCode }</TableCell>
      );
    }
  }
  function renderSnomedCodeHeader(){
    if (!hideSnomedCode) {
      return (
        <TableCell className='snomedCode' style={{width: '180px'}}>{get(labels, 'snomedCode', 'SNOMED Code')}</TableCell>
      );
    }
  }
  function renderSnomedDisplay(snomedDisplay, snomedCode){
    if (!hideSnomedDisplay) {
      if(multiline){
        return (<TableCell className='snomedDisplay'>
          <span style={{fontWeight: 400}}>{snomedDisplay }</span> <br />
          <span style={{color: 'gray'}}>{ snomedCode }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='snomedDisplay' style={{whiteSpace: 'nowrap'}} >{ snomedDisplay }</TableCell>
        );  
      }
    }
  }
  function renderSnomedDisplayHeader(){
    if (!hideSnomedDisplay) {
      return (
        <TableCell className='snomedDisplay'>{get(labels, 'snomedDisplay', 'SNOMED Display')}</TableCell>
      );
    }
  }
  function renderVerification(verificationStatus){
    if (!hideVerification) {
      return (
        <TableCell className='verificationStatus' >{ verificationStatus }</TableCell>
      );
    }
  }
  function renderVerificationHeader(){
    if (!hideVerification) {
      return (
        <TableCell className='verificationStatus' >Verification</TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( claim ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, claim)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, claim._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode helveticas">{id}</span></TableCell>
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
  function renderActionButton(claimId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, claimId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedClaimId', id);
    // Session.set('claimPageTabIndex', 2);
  };


    // Pagination

    let rows = [];

    let paginationCount = 101;
    if(count){
      paginationCount = count;
    } else {
      paginationCount = rows.length;
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
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        style={{float: 'right', border: 'none'}}
      />
    }

  
  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let claimsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(claims){
    if(claims.length > 0){     
      let count = 0;    

      claims.forEach(function(claim){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          claimsToRender.push(FhirDehydrator.dehydrateClaim(claim, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(claimsToRender.length === 0){
    logger.trace('ClaimsTable: No claims to render.');
  } else {
    for (var i = 0; i < claimsToRender.length; i++) {
      let selected = false;
      if(claimsToRender[i].id === selectedClaimId){
        selected = true;
      }
      if(get(claimsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('claimsToRender[i]', claimsToRender[i])

      if(get(claimsToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, claimsToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(claimsToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="claimRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, claimsToRender[i]._id)} style={rowStyle} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(claimsToRender[i]) }

            { renderBarcode(get(claimsToRender[i], "_id", ""))}
            { renderActionButton(get(claimsToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={Random.id()} className="tableWithPagination">
      <Table className='claimsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }

            { renderBarcodeHeader() }
            { renderActionButtonHeader() }
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


ClaimsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  claims: PropTypes.array,
  selectedClaimId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,

  defaultCheckboxValue: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  hideActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  labels: PropTypes.object
};


export default ClaimsTable;
