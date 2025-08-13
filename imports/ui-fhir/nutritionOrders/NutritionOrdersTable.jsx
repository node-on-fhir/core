// /imports/ui-fhir/nutritionOrders/NutritionOrdersTable.jsx

import React, { useState } from 'react';
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
  TablePagination,
  Chip,
  Box
} from '@mui/material';

import moment from 'moment';
import { get } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator, flattenNutritionOrder } from '../../lib/FhirDehydrator';

// Set up logging
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

function NutritionOrdersTable(props){
  logger.info('Rendering the NutritionOrdersTable');
  
  let { 
    children, 
    id,

    data,
    nutritionOrders,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideIdentifier,
    hideActionIcons,
    hideStatus,
    hidePatientDisplay,
    hidePatientReference,
    hideDateTime,
    hideOrderer,
    hideDietType,
    hideSupplement,
    hideInstructions,
    hideBarcode,

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
    hideEnteredInError,
    formFactorLayout,

    count,
    page,
    onSetPage,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Props Processing
  
  // Set default date format if not provided
  if (!dateFormat) {
    dateFormat = "YYYY-MM-DD HH:mm";
  }

  // Preserve the original props for form factor override
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideStatus = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hideDateTime = false;
        hideOrderer = true;
        hideDietType = false;
        hideSupplement = true;
        hideInstructions = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideStatus = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hideDateTime = false;
        hideOrderer = false;
        hideDietType = false;
        hideSupplement = true;
        hideInstructions = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : true;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideDateTime = (hideDateTime !== undefined) ? hideDateTime : false;
        hideOrderer = (hideOrderer !== undefined) ? hideOrderer : false;
        hideDietType = (hideDietType !== undefined) ? hideDietType : false;
        hideSupplement = (hideSupplement !== undefined) ? hideSupplement : false;
        hideInstructions = (hideInstructions !== undefined) ? hideInstructions : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : false;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideDateTime = (hideDateTime !== undefined) ? hideDateTime : false;
        hideOrderer = (hideOrderer !== undefined) ? hideOrderer : false;
        hideDietType = (hideDietType !== undefined) ? hideDietType : false;
        hideSupplement = (hideSupplement !== undefined) ? hideSupplement : false;
        hideInstructions = (hideInstructions !== undefined) ? hideInstructions : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : false;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideDateTime = (hideDateTime !== undefined) ? hideDateTime : false;
        hideOrderer = (hideOrderer !== undefined) ? hideOrderer : false;
        hideDietType = (hideDietType !== undefined) ? hideDietType : false;
        hideSupplement = (hideSupplement !== undefined) ? hideSupplement : false;
        hideInstructions = (hideInstructions !== undefined) ? hideInstructions : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function removeRecord(_id){
    logger.info('Remove nutritionOrder: ' + _id)
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
    if(typeof onMetaClick === "function"){
      onMetaClick(patient);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{ width: '60px' }} >Checkbox</TableCell>
      );
    }
  }
  function renderCheckbox(nutritionOrder){
    if (!hideCheckbox) {
      const nutritionOrderId = get(nutritionOrder, '_id');
      return (
        <TableCell className="toggle" style={{ width: '60px' }}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
            onChange={handleRowClick.bind(this, nutritionOrderId)} 
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
  function renderActionIcons(nutritionOrder ){
    if (!hideActionIcons) {
      const nutritionOrderId = get(nutritionOrder, '_id');
      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={{marginLeft: '2px', marginRight: '2px', marginTop: '4px', cursor: 'pointer'}} onClick={ onMetaClick.bind(nutritionOrder)} />
          <GoTrashcan style={{marginLeft: '2px', marginRight: '2px', marginTop: '4px', cursor: 'pointer'}} onClick={ removeRecord.bind(nutritionOrder, nutritionOrderId)} />   */}
        </TableCell>
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
  function renderIdentifier(nutritionOrder ){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>
          { get(nutritionOrder, 'identifier') }
        </TableCell>
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
  function renderStatus(nutritionOrder){
    if (!hideStatus) {
      const status = get(nutritionOrder, 'status', '');
      return (
        <TableCell className='status'>
          <Chip 
            label={status}
            size="small"
            color={status === 'active' ? 'success' : 'default'}
            variant={status === 'active' ? 'filled' : 'outlined'}
          />
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
  function renderPatientName(nutritionOrder){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>
          { get(nutritionOrder, 'patientDisplay', '') }
        </TableCell>
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
  function renderPatientReference(nutritionOrder){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>
          { get(nutritionOrder, 'patientReference', '') }
        </TableCell>
      );
    }
  }
  function renderDateTimeHeader(){
    if (!hideDateTime) {
      return (
        <TableCell className='dateTime'>Date/Time</TableCell>
      );
    }
  }
  function renderDateTime(nutritionOrder){
    if (!hideDateTime) {
      const dateTime = get(nutritionOrder, 'dateTime', '');
      return (
        <TableCell className='dateTime'>
          { dateTime ? moment(dateTime).format(dateFormat) : '' }
        </TableCell>
      );
    }
  }
  function renderOrdererHeader(){
    if (!hideOrderer) {
      return (
        <TableCell className='orderer'>Orderer</TableCell>
      );
    }
  }
  function renderOrderer(nutritionOrder){
    if (!hideOrderer) {
      return (
        <TableCell className='orderer'>
          { get(nutritionOrder, 'ordererDisplay', '') }
        </TableCell>
      );
    }
  }
  function renderDietTypeHeader(){
    if (!hideDietType) {
      return (
        <TableCell className='dietType'>Diet Type</TableCell>
      );
    }
  }
  function renderDietType(nutritionOrder){
    if (!hideDietType) {
      const dietType = get(nutritionOrder, 'dietType', '');
      return (
        <TableCell className='dietType'>
          { dietType || 'Not specified' }
        </TableCell>
      );
    }
  }
  function renderSupplementHeader(){
    if (!hideSupplement) {
      return (
        <TableCell className='supplement'>Supplement</TableCell>
      );
    }
  }
  function renderSupplement(nutritionOrder){
    if (!hideSupplement) {
      const supplement = get(nutritionOrder, 'supplement', '');
      return (
        <TableCell className='supplement'>
          { supplement || 'None' }
        </TableCell>
      );
    }
  }
  function renderInstructionsHeader(){
    if (!hideInstructions) {
      return (
        <TableCell className='instructions'>Instructions</TableCell>
      );
    }
  }
  function renderInstructions(nutritionOrder){
    if (!hideInstructions) {
      return (
        <TableCell className='instructions' style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          { get(nutritionOrder, 'instructions', '') }
        </TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='id helveticas'><span className="barcode">{idString}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className='id'>System ID</TableCell>
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
  function renderActionButton(nutritionOrder){
    if (!hideActionButton) {
      const nutritionOrderId = get(nutritionOrder, '_id');
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, nutritionOrderId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let nutritionOrdersToRender = [];

  if(nutritionOrders && Array.isArray(nutritionOrders)){
    if(nutritionOrders.length > 0){              
      let count = 0;

      nutritionOrders.forEach(function(nutritionOrder){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          // First, we need to flatten the nutrition order for easier access in the table
          const flattenedOrder = flattenNutritionOrder(nutritionOrder);
          // Debug log to see flattened data
          if(count === 0) {
            console.log('Flattened nutrition order:', flattenedOrder);
          }
          nutritionOrdersToRender.push(flattenedOrder);
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(nutritionOrdersToRender.length === 0){
    logger.trace('NutritionOrdersTable: No nutrition orders to render.');
  } else {
    for (let i = 0; i < nutritionOrdersToRender.length; i++) {
      const currentNutritionOrder = nutritionOrdersToRender[i];
      const nutritionOrderId = get(currentNutritionOrder, '_id', '');
      
      tableRows.push(
        <TableRow 
          key={i} 
          className="nutritionOrderRow" 
          hover={true} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, nutritionOrderId)} 
        >
          { renderCheckbox(currentNutritionOrder) }
          { renderActionIcons(currentNutritionOrder) }
          { renderIdentifier(currentNutritionOrder) }
          { renderStatus(currentNutritionOrder) }
          { renderPatientName(currentNutritionOrder) }
          { renderPatientReference(currentNutritionOrder) }
          { renderDateTime(currentNutritionOrder) }
          { renderOrderer(currentNutritionOrder) }
          { renderDietType(currentNutritionOrder) }
          { renderSupplement(currentNutritionOrder) }
          { renderInstructions(currentNutritionOrder) }
          { renderBarcode(nutritionOrderId)}
          { renderActionButton(currentNutritionOrder) }
        </TableRow>
      );       
    }
  }

  // ------------------------------------------------------------------------
  // Handlers

  function handleRowClick(id){
    logger.trace('NutritionOrdersTable.handleRowClick()', id);
    if(typeof onRowClick === "function"){
      onRowClick(id);
    }
  }

  // ------------------------------------------------------------------------
  // Pagination

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={count}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      style={{float: 'right', border: 'none'}}
    />
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event){
    const newRowsPerPage = parseInt(event.target.value, 10);
    if(typeof onSetRowsPerPage === "function"){
      onSetRowsPerPage(newRowsPerPage);
    }
  }

  // ------------------------------------------------------------------------
  // Render Component

  return(
    <div id={id} className="tableWithPagination">
      <Table className='nutritionOrdersTable' size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
            { renderDateTimeHeader() }
            { renderOrdererHeader() }
            { renderDietTypeHeader() }
            { renderSupplementHeader() }
            { renderInstructionsHeader() }
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

// ------------------------------------------------------------------------
// Props

NutritionOrdersTable.propTypes = {
  id: PropTypes.string,
  
  data: PropTypes.array,
  nutritionOrders: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideDateTime: PropTypes.bool,
  hideOrderer: PropTypes.bool,
  hideDietType: PropTypes.bool,
  hideSupplement: PropTypes.bool,
  hideInstructions: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionButton: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,

  count: PropTypes.number,
  page: PropTypes.number,
  onSetPage: PropTypes.func,

  defaultCheckboxValue: PropTypes.bool
};

NutritionOrdersTable.defaultProps = {
  nutritionOrders: [],
  hideCheckbox: true,
  hideIdentifier: true,
  hideActionIcons: true,
  hideStatus: false,
  hidePatientDisplay: false,
  hidePatientReference: true,
  hideDateTime: false,
  hideOrderer: false,
  hideDietType: false,
  hideSupplement: false,
  hideInstructions: false,
  hideBarcode: true,
  hideActionButton: true,
  rowsPerPage: 10,
  tableRowSize: 'medium',
  dateFormat: 'YYYY-MM-DD',
  page: 0,
  defaultCheckboxValue: false
};

export default NutritionOrdersTable;