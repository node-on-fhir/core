// =======================================================================
// Using DSTU2  !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//
// https://www.hl7.org/fhir/DSTU2/allergyintolerance.html
//
//
// =======================================================================


import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';

import { get, set } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

//===========================================================================
// ICONS

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'



//===========================================================================
// LOGGER

const logger = {
  debug: console.debug.bind(console),
  trace: console.trace.bind(console),
  data: console.log.bind(console),
  verbose: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console)
};

//===========================================================================
// THEMING


//===========================================================================
// MAIN COMPONENT

function AllergyIntolerancesTable(props){
  logger.debug('Rendering the AllergyIntolerancesTable');
  
  // logger.data('AllergyIntolerancesTable.props', {data: props}, {source: "AllergyIntolerancesTable.jsx"});


  let { 
    id,
    children, 
    allergyIntolerances = [],
    selectedAllergyIntoleranceId = '',
    dateFormat,
    showMinutes,

    hideCheckbox = true,
    hideIdentifier = true,
    hideActionIcons = true,
    hidePatientDisplay = false,
    hidePatientReference = true,
    hideReaction = false,
    hideCriticality = false,
    hideSeverity = true,
    hideRecorder = true,
    hideOnset = false,
    hideVerification = false,
    hideClinical = false,
    hideSubstance = false,
    hideCategory = true,
    hideType = true,
    hideRecordedDate = true,
    hideBarcode = true,
    
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,

    query,
    paginationLimit,
    disablePagination = false,
    hideEnteredInError,
    rowsPerPage = 5,
    tableRowSize = "medium",

    count,
    formFactorLayout,

    page,
    onSetPage,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors

  // Store the original prop values before form factor overrides
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);

    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideType = true;
        hideSeverity = true;
        hideCriticality = true;
        hidePatientDisplay = true;
        hidePatientReference = true;
        hideRecordedDate = false;
        hideClinical = true;
        hideVerification = true;
        hideOnset = true;
        hideBarcode = true;
      break;
      case "tablet":
        hideSeverity = false;
        hideCriticality = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : true;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideRecordedDate = false;
        hideClinical = false;
        hideVerification = true;
        hideOnset = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
      case "web":
        hideSeverity = false;
        hideCriticality = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideRecordedDate = false;
        hideClinical = false;
        hideVerification = false;
        hideOnset = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
      case "desktop":
        hideSeverity = false;
        hideCriticality = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideRecordedDate = false;
        hideClinical = false;
        hideVerification = false;
        hideOnset = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
      break;
      case "hdmi":
        hideSeverity = false;
        hideCriticality = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideRecordedDate = false;
        hideClinical = false;
        hideVerification = false;
        hideOnset = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
      break;            
    }
  }


  // ------------------------------------------------------------------------
  // Helper Functions


  function handleRowClick(_id){
    // console.log('Clicking row ' + _id)
    if(props.onRowClick){
      props.onRowClick(_id);
    }
  }

  function removeRecord(_id){
    logger.info('Remove measureReport: ' + _id)
    if(props.onRemoveRecord){
      props.onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof props.onActionButtonClick === "function"){
      props.onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof props.onCellClick === "function"){
      props.onCellClick(id);
    }
  }

  function handleMetaClick(patient){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, patient);
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
            {/* <Checkbox
              defaultChecked={true}
            /> */}
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
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode">{idString}</span></TableCell>
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


  function renderSubstanceHeader(){
    if (!hideSubstance) {
      return (
        <TableCell className="substance">Substance</TableCell>
      );
    }
  }
  function renderSubstance(substance ){
    if (!hideSubstance) {
      
      return (
        <TableCell className='substance'>{ substance }</TableCell>       );
    }
  }
  function renderReactionHeader(){
    if (!hideReaction) {
      return (
        <TableCell className="reaction">Reaction</TableCell>
      );
    }
  }
  function renderReaction(reaction ){
    if (!hideReaction) {
      
      return (
        <TableCell className='reaction'>{ reaction }</TableCell>       );
    }
  }

  function renderCriticalityHeader(){
    if (!hideCriticality) {
      return (
        <TableCell className="criticality">Criticality</TableCell>
      );
    }
  }
  function renderCriticality(criticality ){
    if (!hideCriticality) {
      
      return (
        <TableCell className='criticality'>{ criticality }</TableCell>       );
    }
  }

  function renderRecorderHeader(){
    if (!hideRecorder) {
      return (
        <TableCell className="recorder">Recorder</TableCell>
      );
    }
  }
  function renderRecorder(recorder ){
    if (!hideRecorder) {
      
      return (
        <TableCell className='recorder'>{ recorder }</TableCell>       );
    }
  }

  function renderOnsetHeader(){
    if (!hideOnset) {
      return (
        <TableCell className='onset'>Onset</TableCell>
      );
    }
  }
  function renderOnset(onsetDate ){
    if (!hideOnset) {
      return (
        <TableCell className='onset'>{ onsetDate }</TableCell>
      );
    }
  }



  function renderClinicalStatusHeader(){
    if (!hideClinical) {
      return (
        <TableCell className="clinicalStatus">Status</TableCell>
      );
    }
  }
  function renderClinicalStatus(clinicalStatus ){
    if (!hideClinical) {
      return (
        <TableCell className='clinicalStatus'>{ clinicalStatus }</TableCell>       );
    }
  }


  function renderVerificationStatusHeader(){
    if (!hideVerification) {
      return (
        <TableCell className="verificationStatus">Verification</TableCell>
      );
    }
  }
  function renderVerificationStatus(verificatonStatus ){
    if (!hideVerification) {
      return (
        <TableCell className='verificationStatus'>{ verificatonStatus }</TableCell>       );
    }
  }

  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className="type">Type</TableCell>
      );
    }
  }
  function renderType(type ){
    if (!hideType) {
      return (
        <TableCell className='type'>{ type }</TableCell>       );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className="category">Category</TableCell>
      );
    }
  }
  function renderCategory(category ){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>       );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(allergyIntolerance ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, allergyIntolerance)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, allergyIntolerance._id)} /> */}
        </TableCell>
      );      
    }
  } 
  function renderPatientNameHeader(){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>Patient Name</TableCell>
      );
    }
  }
  function renderPatientName(patientDisplay ){
    if (!hidePatientDisplay) {
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
  function renderPatientReference(patientReference){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{minWidth: '140px'}}>{ patientReference }</TableCell>
      );
    }
  }


  //---------------------------------------------------------------------
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
  let allergyIntolerancesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(internalDateFormat){
    internalDateFormat = dateFormat;
  }

  if(allergyIntolerances){
    if(allergyIntolerances.length > 0){              
      let count = 0;  

      allergyIntolerances.forEach(function(allergyIntolerance){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          allergyIntolerancesToRender.push(FhirDehydrator.dehydrateAllergyIntolerance(allergyIntolerance));
        }
        count++;
      }); 
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }

  if(allergyIntolerancesToRender.length === 0){
    logger.debug('AllergyIntolerancesTable:  No allergyIntolerances to render.');
    // footer = <TableNoData noDataPadding={ props.noDataMessagePadding } />
  } else {
    for (var i = 0; i < allergyIntolerancesToRender.length; i++) {
      let selected = false;
      if(allergyIntolerancesToRender[i].id === selectedAllergyIntoleranceId){
        selected = true;
      }
      if(get(allergyIntolerancesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      logger.debug('allergyIntolerancesToRender[i]', allergyIntolerancesToRender[i])
      tableRows.push(
        <TableRow className="allergyIntoleranceRow" key={i} onClick={ handleRowClick.bind(this, allergyIntolerancesToRender[i]._id)} hover={true} style={rowStyle} selected={selected} >            
          { renderToggle() }
          { renderActionIcons(allergyIntolerancesToRender[i]) }
          { renderIdentifier(allergyIntolerancesToRender[i].identifier)}

          { renderSubstance(allergyIntolerancesToRender[i].substance) }
          { renderReaction(allergyIntolerancesToRender[i].reaction) }
          { renderCriticality(allergyIntolerancesToRender[i].criticality) }

          { renderType(allergyIntolerancesToRender[i].type) }
          { renderCategory(allergyIntolerancesToRender[i].category) }
          { renderPatientName(allergyIntolerancesToRender[i].patientDisplay ) } 
          { renderPatientReference(allergyIntolerancesToRender[i].patientReference ) }

          { renderRecorder(allergyIntolerancesToRender[i].recorder ) } 
          { renderOnset(allergyIntolerancesToRender[i].onset ) } 

          { renderClinicalStatus(allergyIntolerancesToRender[i].clinicalStatus) }
          { renderVerificationStatus(allergyIntolerancesToRender[i].verificationStatus) }
          
          { renderBarcode(allergyIntolerancesToRender[i]._id)}
        </TableRow>
      );    
    }
  }

  // Extract props that shouldn't be passed to DOM elements
  const { 
    hideActionButton,
    autoColumns,
    ...tableProps 
  } = otherProps;

  return(
    <div id={id} className="tableWithPagination">
      <Table className='allergiessTable'  size={tableRowSize} aria-label="a dense table" { ...tableProps }>
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
        
            { renderSubstanceHeader() }
            { renderReactionHeader() }
            { renderCriticalityHeader() }
      

            { renderTypeHeader() }
            { renderCategoryHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }

            { renderRecorderHeader() }
            { renderOnsetHeader() }

            { renderClinicalStatusHeader() }
            { renderVerificationStatusHeader() }

            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { paginationFooter }
    </div>
  )
}




AllergyIntolerancesTable.propTypes = {
  data: PropTypes.array,
  allergyIntolerances: PropTypes.array,
  selectedAllergyIntoleranceId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideReaction: PropTypes.bool,
  hideCriticality: PropTypes.bool,
  hideSeverity: PropTypes.bool,
  hideRecorder:  PropTypes.bool,
  hideOnset:  PropTypes.bool,
  hideSubstance: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideVerification: PropTypes.bool,
  hideClinical: PropTypes.bool,
  hideType: PropTypes.bool,
  hideRecordedDate: PropTypes.bool,

  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,
  
  showActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

// Default values are now handled via ES6 default parameters in the function declaration


export default AllergyIntolerancesTable;