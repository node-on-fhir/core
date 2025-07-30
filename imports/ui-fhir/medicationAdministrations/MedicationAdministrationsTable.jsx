// imports/ui-fhir/medicationAdministrations/MedicationAdministrationsTable.jsx

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
// MAIN COMPONENT

function MedicationAdministrationsTable(props){
  logger.info('Rendering the MedicationAdministrationsTable');

  let { 
    id,
    children, 

    data,
    medicationAdministrations,
    selectedMedicationAdministrationId,

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
    hidePerformer,
    hideDosage,
    hideRoute,
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
        hidePerformer = true;
        hideDosage = true;
        hideRoute = true;
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
        hidePerformer = true;
        hideDosage = true;
        hideRoute = true;
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
        hidePerformer = false;
        hideDosage = false;
        hideRoute = true;
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
        hidePerformer = false;
        hideDosage = false;
        hideRoute = false;
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
        hidePerformer = false;
        hideDosage = false;
        hideRoute = false;
        hideBarcode = false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(medicationAdministrationId){
    console.log('Clicking row ' + medicationAdministrationId)
    if(props.onRowClick){
      props.onRowClick(medicationAdministrationId);
    }
  }

  function removeRecord(_id){
    console.log('Remove medication administration ', _id)
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
  function renderActionIcons(medicationAdministration ){
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
        <TableCell className='effectiveDate'>Administered</TableCell>
      );
    }
  }

  function renderPerformer(performer){
    if (!props.hidePerformer) {
      return (
        <TableCell className='performer'>{ performer }</TableCell>
      );
    }
  }
  function renderPerformerHeader(){
    if (!props.hidePerformer) {
      return (
        <TableCell className='performer'>Performer</TableCell>
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
        <TableCell className='dosage'>Dose</TableCell>
      );
    }
  }

  function renderRoute(route){
    if (!props.hideRoute) {
      return (
        <TableCell className='route'>{ route }</TableCell>
      );
    }
  }
  function renderRouteHeader(){
    if (!props.hideRoute) {
      return (
        <TableCell className='route'>Route</TableCell>
      );
    }
  }

  function renderNote(note){
    if (!props.hideNote) {
      return (
        <TableCell className='note'>{ note }</TableCell>
      );
    }
  }
  function renderNoteHeader(){
    if (!props.hideNote) {
      return (
        <TableCell className='note'>Note</TableCell>
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
  function renderActionButton(medicationAdministration){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(medicationAdministration, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
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
  let medicationAdministrationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.medicationAdministrations){
    if(props.medicationAdministrations.length > 0){ 
      let count = 0;    
      
      props.medicationAdministrations.forEach(function(medicationAdministration){
        if((count >= (localPage * localRowsPerPage)) && (count < (localPage + 1) * localRowsPerPage)){
          medicationAdministrationsToRender.push(FhirDehydrator.dehydrateMedicationAdministration(medicationAdministration, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(medicationAdministrationsToRender.length === 0){
    logger.trace('MedicationAdministrationsTable: No medication administrations to render.');
  } else {
    for (var i = 0; i < medicationAdministrationsToRender.length; i++) {

      let selected = false;
      if(medicationAdministrationsToRender[i]._id === selectedMedicationAdministrationId){
        selected = true;
      }
      if(get(medicationAdministrationsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="medicationAdministrationRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, medicationAdministrationsToRender[i]._id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(medicationAdministrationsToRender[i]) }
          { renderActionIcons(medicationAdministrationsToRender[i]) }
          { renderIdentifier(medicationAdministrationsToRender[i].identifier ) }
          { renderStatus(medicationAdministrationsToRender[i].status) }
          { renderPatient(medicationAdministrationsToRender[i].subjectDisplay) }
          { renderMedication(medicationAdministrationsToRender[i].medicationDisplay) }
          { renderEffectiveDate(medicationAdministrationsToRender[i].effectiveDateTime) }  
          { renderPerformer(medicationAdministrationsToRender[i].performerDisplay) }
          { renderDosage(medicationAdministrationsToRender[i].dosageText) }
          { renderRoute(medicationAdministrationsToRender[i].route) }
          { renderNote(medicationAdministrationsToRender[i].note) }
          { renderBarcode(medicationAdministrationsToRender[i]._id) }
          { renderActionButton(medicationAdministrationsToRender[i]) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="medicationAdministrationsTable">
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
            { renderPerformerHeader() }
            { renderDosageHeader() }
            { renderRouteHeader() }
            { renderNoteHeader() }
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
          count={count || props.medicationAdministrations?.length || 0}
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

MedicationAdministrationsTable.propTypes = {
  data: PropTypes.array,
  medicationAdministrations: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePatient: PropTypes.bool,
  hideMedication: PropTypes.bool,
  hideEffectiveDate: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hideDosage: PropTypes.bool,
  hideRoute: PropTypes.bool,
  hideNote: PropTypes.bool,
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

MedicationAdministrationsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: true,
  hidePatient: false,
  hideMedication: false,
  hideEffectiveDate: false,
  hidePerformer: false,
  hideDosage: false,
  hideRoute: true,
  hideNote: false,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  medicationAdministrations: [],
  count: 0,
  page: 0
}

export default MedicationAdministrationsTable;