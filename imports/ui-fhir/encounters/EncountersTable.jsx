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
import { get, reverse } from 'lodash';

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING




//===========================================================================
// MAIN COMPONENT

const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

function EncountersTable(props){
  logger.info('Rendering the EncountersTable');

  let { 
    id,
    children, 

    data,
    encounters,
    selectedEncounterId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hidePatientName,
    hidePatientReference,
    hidePractitionerName,
    hideStatus,
    hideClass,
    hideTypeCode,
    hideTypeDisplay,
    hideReasonCode,
    hideReasonDisplay,
    hideStartDate,
    hideEndDate,
    hideBarcode,
    hideTextIcon,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    hideEnteredInError,
    formFactorLayout,
    count,
    labels,

    defaultCheckboxValue,

    page,
    onSetPage,
    
    order,

    ...otherProps
  } = props;

  // Save original prop values before form factor switch may overwrite them
  const hidePatientNameFromProp = hidePatientName;
  const hidePractitionerNameFromProp = hidePractitionerName;
  const hideClassFromProp = hideClass;
  const hideBarcodeFromProp = hideBarcode;

    // ------------------------------------------------------------------------
  // Form Factors

  let multiline = false;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : true;
        hidePatientReference = true;
        hidePractitionerName = (hidePractitionerNameFromProp !== undefined) ? hidePractitionerNameFromProp : false;
        hideStatus = true;
        hideClass = (hideClassFromProp !== undefined) ? hideClassFromProp : true;
        hideTypeCode = true;
        hideTypeDisplay = false;
        hideReasonCode = true;
        hideReasonDisplay = true;
        hideStartDate = true;
        hideEndDate = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hidePractitionerName = (hidePractitionerNameFromProp !== undefined) ? hidePractitionerNameFromProp : false;
        hideStatus = false;
        hideClass = (hideClassFromProp !== undefined) ? hideClassFromProp : true;
        hideTypeCode = true;
        hideTypeDisplay = false;
        hideReasonCode = true;
        hideReasonDisplay = true;
        hideStartDate = false;
        hideEndDate = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        hideTextIcon = false
        break;
      case "web":
        hidePractitionerName = (hidePractitionerNameFromProp !== undefined) ? hidePractitionerNameFromProp : false;
        hideStatus = false;
        hideClass = (hideClassFromProp !== undefined) ? hideClassFromProp : false;
        hideTypeCode = true;
        hideTypeDisplay = false;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideReasonCode = true;
        hideReasonDisplay = true;
        hideStartDate = true;
        hideEndDate = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hidePractitionerName = (hidePractitionerNameFromProp !== undefined) ? hidePractitionerNameFromProp : false;
        hideStatus = false;
        hideClass = (hideClassFromProp !== undefined) ? hideClassFromProp : false;
        hideTypeCode = true;
        hideTypeDisplay = false;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideReasonCode = true;
        hideReasonDisplay = false;
        hideStartDate = false;
        hideEndDate = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hidePractitionerName = (hidePractitionerNameFromProp !== undefined) ? hidePractitionerNameFromProp : false;
        hideStatus = false;
        hideClass = (hideClassFromProp !== undefined) ? hideClassFromProp : false;
        hideTypeCode = false;
        hideTypeDisplay = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideStartDate = false;
        hideEndDate = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        hideTextIcon = true;
        break;
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(conditions)){
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
      
    //   let dehydrateedCollection = conditions.map(function(record){
    //     return dehydrateCondition(record, "YYYY-MM-DD");
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
  function renderStartDateHeader(){
    if (!hideStartDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderEndDateHeader(){
    if (!hideEndDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderStartDate(startDate ){
    if (!hideStartDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(startDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderEndDate(endDate ){
    if (!hideEndDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(endDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderTextIconHeader(){
    // Text column removed
    return null;
  }
  function renderTextIcon(textDiv ){
    // Text column removed
    return null;
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
  function renderPractitionerNameHeader(){
    if (!hidePractitionerName) {
      return (
        <TableCell className='practitionerDisplay'>Practitioner</TableCell>
      );
    }
  }
  function renderPractitionerName(practitionerDisplay ){
    if (!hidePractitionerName) {
      return (
        <TableCell className='practitionerDisplay' style={{minWidth: '140px'}}>{ practitionerDisplay }</TableCell>
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
  function renderStatus(status ){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  } 
  function renderClassHeader(){
    if (!hideClass) {
      return (
        <TableCell className='class'>Class</TableCell>
      );
    }
  }
  function renderClass(classValue ){
    if (!hideClass) {
      return (
        <TableCell className='class'>{ classValue }</TableCell>
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
  function renderTypeCode(typeCode){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode' style={{width: '180px'}}>{ typeCode }</TableCell>
      );
    }
  }
  function renderTypeCodeHeader(){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode' style={{width: '180px'}}>Type Code</TableCell>
      );
    }
  }
  function renderReasonCode(reasonCode){
    if (!hideReasonCode) {
      return (
        <TableCell className='reasonCode' style={{width: '180px'}}>{ reasonCode }</TableCell>
      );
    }
  }
  function renderReasonCodeHeader(){
    if (!hideReasonCode) {
      return (
        <TableCell className='reasonCode' style={{width: '180px'}}>Reason Code</TableCell>
      );
    }
  }
  function renderTypeDisplay(typeDisplay, typeCode){
    if (!hideTypeDisplay) {
      if(multiline){
        return (<TableCell className='typeDisplay'>
          <span style={{fontWeight: 400}}>{typeDisplay }</span> <br />
          <span style={{color: 'gray'}}>{ typeCode }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='typeDisplay' style={{whiteSpace: 'nowrap'}} >{ typeDisplay }</TableCell>
        );  
      }
    }
  }
  function renderTypeDisplayHeader(){
    if (!hideTypeDisplay) {
      return (
        <TableCell className='typeDisplay'>Type</TableCell>
      );
    }
  }
  function renderReasonDisplay(reasonDisplay){
    if (!hideReasonDisplay) {
      return (
        <TableCell className='reasonDisplay' >{ reasonDisplay }</TableCell>
      );
    }
  }
  function renderReasonDisplayHeader(){
    if (!hideReasonDisplay) {
      return (
        <TableCell className='reasonDisplay' >Reason</TableCell>
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
  function renderActionIcons( condition ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, condition)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, condition._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode helveticas">{idString}</span></TableCell>
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
  function renderActionButton(encounterId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, encounterId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedConditionId', id);
    // Session.set('conditionPageTabIndex', 2);
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
        // rowsPerPageOptions={[5, 10, 25, 100]}
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
  let encountersToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(encounters){
    if(encounters.length > 0){     
      let count = 0;    
      
      // Apply order: if 'descending' or alias 'reverse', reverse the array
      let orderedEncounters = encounters;
      if(order === 'descending' || order === 'reverse'){
        orderedEncounters = reverse([...encounters]); // Create a copy and reverse it
      }

      orderedEncounters.forEach(function(encounter){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          encountersToRender.push(FhirDehydrator.dehydrateEncounter(encounter, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(encountersToRender.length === 0){
    logger.trace('EncountersTable: No encounters to render.');
  } else {
    for (var i = 0; i < encountersToRender.length; i++) {
      let selected = false;
      if(encountersToRender[i].id === selectedEncounterId){
        selected = true;
      }
      if(get(encountersToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('encountersToRender[i]', encountersToRender[i])

      if(get(encountersToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="encounterRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, encountersToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(encountersToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="encounterRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, encountersToRender[i]._id)} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(encountersToRender[i]) }
            { renderTextIcon(get(encountersToRender[i], "text.div", "")) }
            { renderIdentifier(get(encountersToRender[i], "identifier", "")) }
            { renderPatientName(get(encountersToRender[i], "patientDisplay", "")) } 
            { renderPatientReference(get(encountersToRender[i], "patientReference", "")) }           
            { renderPractitionerName(get(encountersToRender[i], "practitionerDisplay", "")) } 
            { renderStatus(get(encountersToRender[i], "status", ""))}
            { renderClass(get(encountersToRender[i], "class", ""))}
            { renderTypeCode(get(encountersToRender[i], "typeCode", ""))}
            { renderTypeDisplay(get(encountersToRender[i], "typeDisplay", ""), get(encountersToRender[i], "typeCode", ""))}
            { renderReasonCode(get(encountersToRender[i], "reasonCode", "")) } 
            { renderReasonDisplay(get(encountersToRender[i], "reasonDisplay", "")) }
            { renderStartDate(get(encountersToRender[i], "periodStart", "")) }
            { renderEndDate(get(encountersToRender[i], "periodEnd", "")) }
            { renderBarcode(get(encountersToRender[i], "_id", ""))}
            { renderActionButton(get(encountersToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='encountersTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
            { renderPractitionerNameHeader() }
            { renderStatusHeader() }
            { renderClassHeader() }
            { renderTypeCodeHeader() }
            { renderTypeDisplayHeader() }          
            { renderReasonCodeHeader() }
            { renderReasonDisplayHeader() }
            { renderStartDateHeader() }
            { renderEndDateHeader() }
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


EncountersTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  encounters: PropTypes.array,
  selectedEncounterId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hidePractitionerName: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideClass: PropTypes.bool,
  hideTypeCode: PropTypes.bool,
  hideTypeDisplay: PropTypes.bool,
  hideReasonCode: PropTypes.bool,
  hideReasonDisplay: PropTypes.bool,
  hideStartDate: PropTypes.bool,
  hideEndDate: PropTypes.bool,
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
  
  order: PropTypes.oneOf(['ascending', 'descending', 'reverse']),

  labels: PropTypes.object
};

EncountersTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hidePatientName: false,
  hidePatientReference: true,
  hidePractitionerName: false,
  hideStatus: false,
  hideClass: false,
  hideTypeCode: true,
  hideTypeDisplay: false,
  hideReasonCode: true,
  hideReasonDisplay: true,
  hideStartDate: false,
  hideEndDate: true,
  hideTextIcon: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  encounters: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false,
  order: 'ascending'
}

export default EncountersTable;
