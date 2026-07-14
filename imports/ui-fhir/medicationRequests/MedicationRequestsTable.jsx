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

function MedicationRequestsTable(props){
  logger.info('Rendering the MedicationRequestsTable');

  let { 
    id,
    children, 

    data,
    medicationRequests,
    selectedMedicationRequestId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hidePatient,
    hideMedication,
    hideAuthoredOn,
    hideRequester,
    hidePriority,
    hideIntent,
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
        hideAuthoredOn = true;
        hideRequester = true;
        hidePriority = true;
        hideIntent = true;
        hideBarcode = true;  
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideAuthoredOn = false;
        hideRequester = true;
        hidePriority = true;
        hideIntent = true;
        hideBarcode = true;   
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideAuthoredOn = false;
        hideRequester = false;
        hidePriority = true;
        hideIntent = true;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideAuthoredOn = false;
        hideRequester = false;
        hidePriority = false;
        hideIntent = false;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hidePatient = false;
        hideMedication = false;
        hideAuthoredOn = false;
        hideRequester = false;
        hidePriority = false;
        hideIntent = false;
        hideBarcode = false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(medicationRequestId){
    console.log('Clicking row ' + medicationRequestId)
    if(props.onRowClick){
      props.onRowClick(medicationRequestId);
    }
  }

  function removeRecord(_id){
    console.log('Remove medication request ', _id)
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
  function renderCheckbox(medicationRequest){
    if (!props.hideCheckbox) {
      // Controlled mode when selectedIds is provided (reconciliation
      // selection); otherwise preserve the legacy uncontrolled behavior.
      const isControlled = Array.isArray(props.selectedIds);
      const rowId = get(medicationRequest, '_id');
      return (
        <TableCell className="toggle" style={{width: '60px'}} onClick={function(event){ event.stopPropagation(); }}>
          <Checkbox
            checked={isControlled ? props.selectedIds.includes(rowId) : undefined}
            defaultChecked={isControlled ? undefined : defaultCheckboxValue}
            onChange={function(event){
              if(typeof props.onCheckboxChange === 'function'){
                props.onCheckboxChange(rowId, event.target.checked);
              }
            }}
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
  function renderActionIcons(medicationRequest ){
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

  function renderAuthoredOn(authoredOn){
    if (!props.hideAuthoredOn) {
      return (
        <TableCell className='authoredOn'>{ authoredOn }</TableCell>
      );
    }
  }
  function renderAuthoredOnHeader(){
    if (!props.hideAuthoredOn) {
      return (
        <TableCell className='authoredOn'>Authored On</TableCell>
      );
    }
  }

  function renderRequester(requester){
    if (!props.hideRequester) {
      return (
        <TableCell className='requester'>{ requester }</TableCell>
      );
    }
  }
  function renderRequesterHeader(){
    if (!props.hideRequester) {
      return (
        <TableCell className='requester'>Requester</TableCell>
      );
    }
  }

  function renderPriority(priority){
    if (!props.hidePriority) {
      return (
        <TableCell className='priority'>{ priority }</TableCell>
      );
    }
  }
  function renderPriorityHeader(){
    if (!props.hidePriority) {
      return (
        <TableCell className='priority'>Priority</TableCell>
      );
    }
  }

  function renderIntent(intent){
    if (!props.hideIntent) {
      return (
        <TableCell className='intent'>{ intent }</TableCell>
      );
    }
  }
  function renderIntentHeader(){
    if (!props.hideIntent) {
      return (
        <TableCell className='intent'>Intent</TableCell>
      );
    }
  }

  function renderDosageInstruction(dosageInstructionText){
    if (!props.hideDosageInstruction) {
      return (
        <TableCell className='dosageInstruction'>{ dosageInstructionText }</TableCell>
      );
    }
  }
  function renderDosageInstructionHeader(){
    if (!props.hideDosageInstruction) {
      return (
        <TableCell className='dosageInstruction'>Dosage</TableCell>
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
  function renderActionButton(medicationRequest){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(medicationRequest, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Pagination Setup
  
  const [localPage, setLocalPage] = useState(page || 0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage || 5);

  useEffect(() => {
    if (page !== undefined) {
      setLocalPage(page);
    }
  }, [page]);

  useEffect(() => {
    if (rowsPerPage !== undefined) {
      setLocalRowsPerPage(rowsPerPage);
    }
  }, [rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setLocalPage(newPage);
    if (onSetPage) {
      onSetPage(event, newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setLocalRowsPerPage(newRowsPerPage);
    setLocalPage(0);
    if (onSetPage) {
      onSetPage(event, 0);
    }
  };

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let medicationRequestsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.medicationRequests){
    if(props.medicationRequests.length > 0){ 
      let count = 0;    
      
      props.medicationRequests.forEach(function(medicationRequest){
        if((count >= (localPage * localRowsPerPage)) && (count < (localPage + 1) * localRowsPerPage)){
          medicationRequestsToRender.push(FhirDehydrator.dehydrateMedicationRequest(medicationRequest, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(medicationRequestsToRender.length === 0){
    logger.trace('MedicationRequestsTable: No medication requests to render.');
  } else {
    for (var i = 0; i < medicationRequestsToRender.length; i++) {

      let selected = false;
      if(medicationRequestsToRender[i]._id === selectedMedicationRequestId){
        selected = true;
      }
      if(get(medicationRequestsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="medicationRequestRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, medicationRequestsToRender[i]._id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(medicationRequestsToRender[i]) }
          { renderActionIcons(medicationRequestsToRender[i]) }
          { renderIdentifier(medicationRequestsToRender[i].identifier ) }
          { renderStatus(medicationRequestsToRender[i].status) }
          { renderPatient(medicationRequestsToRender[i].subjectDisplay) }
          { renderMedication(medicationRequestsToRender[i].medicationDisplay) }
          { renderAuthoredOn(medicationRequestsToRender[i].authoredOn) }  
          { renderRequester(medicationRequestsToRender[i].requesterDisplay) }
          { renderPriority(medicationRequestsToRender[i].priority) }
          { renderIntent(medicationRequestsToRender[i].intent) }
          { renderDosageInstruction(medicationRequestsToRender[i].dosageInstructionText) }
          { renderBarcode(medicationRequestsToRender[i]._id) }
          { renderActionButton(medicationRequestsToRender[i]) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="medicationRequestsTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderPatientHeader() }
            { renderMedicationHeader() }
            { renderAuthoredOnHeader() }            
            { renderRequesterHeader() }
            { renderPriorityHeader() }
            { renderIntentHeader() }
            { renderDosageInstructionHeader() }
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
          count={count || props.medicationRequests?.length || 0}
          rowsPerPage={localRowsPerPage}
          page={localPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          style={{
            float: 'right',
            border: 'none'
          }}
        />
      )}
    </div>
  );
}

MedicationRequestsTable.propTypes = {
  data: PropTypes.array,
  medicationRequests: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePatient: PropTypes.bool,
  hideMedication: PropTypes.bool,
  hideAuthoredOn: PropTypes.bool,
  hideRequester: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideIntent: PropTypes.bool,
  hideDosageInstruction: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  hideActionButton: PropTypes.bool,

  selectedIds: PropTypes.array,
  onCheckboxChange: PropTypes.func,

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

MedicationRequestsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: true,
  hidePatient: false,
  hideMedication: false,
  hideAuthoredOn: false,
  hideRequester: false,
  hidePriority: true,
  hideIntent: true,
  hideDosageInstruction: false,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  medicationRequests: [],
  count: 0,
  page: 0
}

export default MedicationRequestsTable;