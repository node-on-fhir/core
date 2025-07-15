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

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

//===========================================================================
// MAIN COMPONENT

function MedicationStatementsTable(props){
  logger.info('Rendering the MedicationStatementsTable');

  let { 
    id,
    children, 

    data,
    medicationStatements,
    selectedMedicationStatementId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hidePatient,
    hideMedication,
    hideEffectiveDate,
    hideInformationSource,
    hideReason,
    hideDosage,
    hideBarcode,
  
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
        hideIdentifier = true;
        hideStatus = true;
        hidePatient = false;
        hideMedication = false;
        hideEffectiveDate = true;
        hideInformationSource = true;
        hideReason = true;
        hideDosage = true;
        hideBarcode = true;  
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideEffectiveDate = false;
        hideInformationSource = true;
        hideReason = true;
        hideDosage = true;
        hideBarcode = true;   
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideEffectiveDate = false;
        hideInformationSource = false;
        hideReason = true;
        hideDosage = true;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideEffectiveDate = false;
        hideInformationSource = false;
        hideReason = false;
        hideDosage = false;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideEffectiveDate = false;
        hideInformationSource = false;
        hideReason = false;
        hideDosage = false;
        hideBarcode = false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(medicationStatementId){
    console.log('Clicking row ' + medicationStatementId)
    if(props.onRowClick){
      props.onRowClick(medicationStatementId);
    }
  }

  function removeRecord(_id){
    console.log('Remove medication statement ', _id)
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

  function renderCheckboxHeader(){
    if (!props.hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >
          Toggle
        </TableCell>
      );
    }
  }
  function renderCheckbox(){
    if (!props.hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
          />
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!props.hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(medicationStatement ){
    if (!props.hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* Icon buttons would go here */}
        </TableCell>
      );
    }
  } 

  function renderIdentifier(identifier){
    if (!props.hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!props.hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }

  function renderStatus(status){
    if (!props.hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!props.hideStatus) {
      return (
        <TableCell className='status'>Status</TableCell>
      );
    }
  }

  function renderPatient(patient){
    if (!props.hidePatient) {
      return (
        <TableCell className='patient'>{ patient }</TableCell>
      );
    }
  }
  function renderPatientHeader(){
    if (!props.hidePatient) {
      return (
        <TableCell className='patient'>Patient</TableCell>
      );
    }
  }

  function renderMedication(medication){
    if (!props.hideMedication) {
      return (
        <TableCell className='medication'>{ medication }</TableCell>
      );
    }
  }
  function renderMedicationHeader(){
    if (!props.hideMedication) {
      return (
        <TableCell className='medication'>Medication</TableCell>
      );
    }
  }

  function renderEffectiveDate(effectiveDate){
    if (!props.hideEffectiveDate) {
      return (
        <TableCell className='effectiveDate'>{ effectiveDate }</TableCell>
      );
    }
  }
  function renderEffectiveDateHeader(){
    if (!props.hideEffectiveDate) {
      return (
        <TableCell className='effectiveDate'>Effective Date</TableCell>
      );
    }
  }

  function renderInformationSource(informationSource){
    if (!props.hideInformationSource) {
      return (
        <TableCell className='informationSource'>{ informationSource }</TableCell>
      );
    }
  }
  function renderInformationSourceHeader(){
    if (!props.hideInformationSource) {
      return (
        <TableCell className='informationSource'>Information Source</TableCell>
      );
    }
  }

  function renderReason(reason){
    if (!props.hideReason) {
      return (
        <TableCell className='reason'>{ reason }</TableCell>
      );
    }
  }
  function renderReasonHeader(){
    if (!props.hideReason) {
      return (
        <TableCell className='reason'>Reason</TableCell>
      );
    }
  }

  function renderDosage(dosage){
    if (!props.hideDosage) {
      return (
        <TableCell className='dosage'>{ dosage }</TableCell>
      );
    }
  }
  function renderDosageHeader(){
    if (!props.hideDosage) {
      return (
        <TableCell className='dosage'>Dosage</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!props.hideBarcode) {
      return (
        <TableCell><span className="barcode helvetica">{id}</span></TableCell>
      );  
    }
  }
  function renderBarcodeHeader(){
    if (!props.hideBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }

  function renderActionButtonHeader(){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(medicationStatement){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(medicationStatement, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let medicationStatementsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.medicationStatements){
    if(props.medicationStatements.length > 0){ 
      let count = 0;    
      
      props.medicationStatements.forEach(function(medicationStatement){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          medicationStatementsToRender.push(FhirDehydrator.dehydrateMedicationStatement(medicationStatement, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(medicationStatementsToRender.length === 0){
    logger.trace('MedicationStatementsTable: No medication statements to render.');
  } else {
    for (var i = 0; i < medicationStatementsToRender.length; i++) {

      let selected = false;
      if(medicationStatementsToRender[i]._id === selectedMedicationStatementId){
        selected = true;
      }
      if(get(medicationStatementsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="medicationStatementRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, medicationStatementsToRender[i]._id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(medicationStatementsToRender[i]) }
          { renderActionIcons(medicationStatementsToRender[i]) }
          { renderIdentifier(medicationStatementsToRender[i].identifier ) }
          { renderStatus(medicationStatementsToRender[i].status) }
          { renderPatient(medicationStatementsToRender[i].subjectDisplay) }
          { renderMedication(medicationStatementsToRender[i].medicationDisplay) }
          { renderEffectiveDate(medicationStatementsToRender[i].effectiveDateTime) }  
          { renderInformationSource(medicationStatementsToRender[i].informationSourceDisplay) }
          { renderReason(medicationStatementsToRender[i].reasonDisplay) }
          { renderDosage(medicationStatementsToRender[i].dosageText) }
          { renderBarcode(medicationStatementsToRender[i]._id) }
          { renderActionButton(medicationStatementsToRender[i]) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="medicationStatementsTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderPatientHeader() }
            { renderMedicationHeader() }
            { renderEffectiveDateHeader() }            
            { renderInformationSourceHeader() }
            { renderReasonHeader() }
            { renderDosageHeader() }
            { renderBarcodeHeader() }
            { renderActionButtonHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { props.disablePagination ? <div></div> : (
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 100]}
          colSpan={3}
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={props.onSetPage}
          style={{
            float: 'right',
            border: 'none'
          }}
        />
      )}
    </div>
  );
}

MedicationStatementsTable.propTypes = {
  data: PropTypes.array,
  medicationStatements: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePatient: PropTypes.bool,
  hideMedication: PropTypes.bool,
  hideEffectiveDate: PropTypes.bool,
  hideInformationSource: PropTypes.bool,
  hideReason: PropTypes.bool,
  hideDosage: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  hideActionButton: PropTypes.bool,

  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,

  formFactorLayout: PropTypes.string,
  count: PropTypes.number,
  labels: PropTypes.object,

  page: PropTypes.number,
  onSetPage: PropTypes.func
};

MedicationStatementsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: true,
  hidePatient: false,
  hideMedication: false,
  hideEffectiveDate: false,
  hideInformationSource: true,
  hideReason: true,
  hideDosage: true,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  medicationStatements: [],
  count: 0,
  page: 0
}

export default MedicationStatementsTable;