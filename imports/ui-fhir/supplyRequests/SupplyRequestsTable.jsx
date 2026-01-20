// imports/ui-fhir/supplyRequests/SupplyRequestsTable.jsx

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

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

// Logger
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

function SupplyRequestsTable(props){
  logger.info('Rendering the SupplyRequestsTable');

  let {
    id,
    children,

    data,
    supplyRequests,
    selectedSupplyRequestId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hidePriority,
    hideQuantity,
    hideItemCodeableConcept,
    hideAuthoredOn,
    hideOccurrenceDateTime,
    hideRequester,
    hideSupplier,
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

    order,

    ...otherProps
  } = props;


    // ------------------------------------------------------------------------
  // Form Factors

  let multiline = false;

  // Store the original prop values before form factor overrides
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideStatus = false;
        hidePriority = true;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hideAuthoredOn = true;
        hideOccurrenceDateTime = true;
        hideRequester = true;
        hideSupplier = true;
        hideBarcode = true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideStatus = false;
        hidePriority = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hideAuthoredOn = false;
        hideOccurrenceDateTime = true;
        hideRequester = true;
        hideSupplier = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "web":
        hideStatus = false;
        hidePriority = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hideAuthoredOn = false;
        hideOccurrenceDateTime = false;
        hideRequester = true;
        hideSupplier = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "desktop":
        hideStatus = false;
        hidePriority = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hideAuthoredOn = false;
        hideOccurrenceDateTime = false;
        hideRequester = false;
        hideSupplier = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "hdmi":
        hideStatus = false;
        hidePriority = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hideAuthoredOn = false;
        hideOccurrenceDateTime = false;
        hideRequester = false;
        hideSupplier = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
    }
  }


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
  function renderPriorityHeader(){
    if (!hidePriority) {
      return (
        <TableCell className='priority'>Priority</TableCell>
      );
    }
  }
  function renderPriority(priority ){
    if (!hidePriority) {
      return (
        <TableCell className='priority'>{ priority }</TableCell>
      );
    }
  }
  function renderQuantityHeader(){
    if (!hideQuantity) {
      return (
        <TableCell className='quantity'>Quantity</TableCell>
      );
    }
  }
  function renderQuantity(quantity ){
    if (!hideQuantity) {
      return (
        <TableCell className='quantity'>{ quantity }</TableCell>
      );
    }
  }
  function renderItemCodeableConceptHeader(){
    if (!hideItemCodeableConcept) {
      return (
        <TableCell className='itemCodeableConcept'>Item</TableCell>
      );
    }
  }
  function renderItemCodeableConcept(itemCodeableConcept, itemCode){
    if (!hideItemCodeableConcept) {
      if(multiline){
        return (<TableCell className='itemCodeableConcept'>
          <span style={{fontWeight: 400}}>{itemCodeableConcept }</span> <br />
          <span style={{color: 'gray'}}>{ itemCode }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='itemCodeableConcept' style={{whiteSpace: 'nowrap'}} >{ itemCodeableConcept }</TableCell>
        );
      }
    }
  }
  function renderAuthoredOnHeader(){
    if (!hideAuthoredOn) {
      return (
        <TableCell className='authoredOn' style={{minWidth: '140px'}}>Authored On</TableCell>
      );
    }
  }
  function renderAuthoredOn(authoredOn ){
    if (!hideAuthoredOn) {
      return (
        <TableCell className='authoredOn' style={{minWidth: '140px'}}>{ moment(authoredOn).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderOccurrenceDateTimeHeader(){
    if (!hideOccurrenceDateTime) {
      return (
        <TableCell className='occurrenceDateTime' style={{minWidth: '140px'}}>Occurrence</TableCell>
      );
    }
  }
  function renderOccurrenceDateTime(occurrenceDateTime ){
    if (!hideOccurrenceDateTime) {
      return (
        <TableCell className='occurrenceDateTime' style={{minWidth: '140px'}}>{ occurrenceDateTime ? moment(occurrenceDateTime).format('YYYY-MM-DD') : '' }</TableCell>
      );
    }
  }
  function renderRequesterHeader(){
    if (!hideRequester) {
      return (
        <TableCell className='requester'>Requester</TableCell>
      );
    }
  }
  function renderRequester(requester ){
    if (!hideRequester) {
      return (
        <TableCell className='requester' style={{minWidth: '140px'}}>{ requester }</TableCell>
      );
    }
  }
  function renderSupplierHeader(){
    if (!hideSupplier) {
      return (
        <TableCell className='supplier'>Supplier</TableCell>
      );
    }
  }
  function renderSupplier(supplier ){
    if (!hideSupplier) {
      return (
        <TableCell className='supplier' style={{minWidth: '140px'}}>{ supplier }</TableCell>
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
  function renderActionIcons( supplyRequest ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px',
        marginRight: '4px',
        marginTop: '4px',
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* Icons would go here */}
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
  function renderActionButton(supplyRequestId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, supplyRequestId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedSupplyRequestId', id);
    // Session.set('supplyRequestPageTabIndex', 2);
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
  let supplyRequestsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(supplyRequests){
    if(supplyRequests.length > 0){
      let count = 0;

      // Apply order: if 'descending' or alias 'reverse', reverse the array
      let orderedSupplyRequests = supplyRequests;
      if(order === 'descending' || order === 'reverse'){
        orderedSupplyRequests = reverse([...supplyRequests]); // Create a copy and reverse it
      }

      orderedSupplyRequests.forEach(function(supplyRequest){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          supplyRequestsToRender.push(FhirDehydrator.dehydrateSupplyRequest(supplyRequest, internalDateFormat));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(supplyRequestsToRender.length === 0){
    logger.trace('SupplyRequestsTable: No supply requests to render.');
  } else {
    for (var i = 0; i < supplyRequestsToRender.length; i++) {
      let selected = false;
      if(supplyRequestsToRender[i].id === selectedSupplyRequestId){
        selected = true;
      }
      if(get(supplyRequestsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('supplyRequestsToRender[i]', supplyRequestsToRender[i])

      if(get(supplyRequestsToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow
          className="supplyRequestRow"
          key={i}
          style={rowStyle}
          onClick={ handleRowClick.bind(this, supplyRequestsToRender[i]._id)}
          hover={true}
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(supplyRequestsToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>
          </TableRow>
        );
      } else {
        tableRows.push(
          <TableRow className="supplyRequestRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, supplyRequestsToRender[i]._id)} hover={true} selected={selected} >
            { renderCheckbox(i) }
            { renderActionIcons(supplyRequestsToRender[i]) }
            { renderIdentifier(get(supplyRequestsToRender[i], "identifier", "")) }
            { renderStatus(get(supplyRequestsToRender[i], "status", "")) }
            { renderPriority(get(supplyRequestsToRender[i], "priority", "")) }
            { renderQuantity(get(supplyRequestsToRender[i], "quantity", "")) }
            { renderItemCodeableConcept(get(supplyRequestsToRender[i], "itemCodeableConceptDisplay", ""), get(supplyRequestsToRender[i], "itemCodeableConceptCode", "")) }
            { renderAuthoredOn(get(supplyRequestsToRender[i], "authoredOn", "")) }
            { renderOccurrenceDateTime(get(supplyRequestsToRender[i], "occurrenceDateTime", "")) }
            { renderRequester(get(supplyRequestsToRender[i], "requesterDisplay", "")) }
            { renderSupplier(get(supplyRequestsToRender[i], "supplierDisplay", "")) }
            { renderBarcode(get(supplyRequestsToRender[i], "_id", ""))}
            { renderActionButton(get(supplyRequestsToRender[i], "_id", "")) }
          </TableRow>
        );
      }


    }
  }



  //---------------------------------------------------------------------
  // Actual Render Method


  return(
    <div id={id} className="tableWithPagination">
      <Table className='supplyRequestsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderPriorityHeader() }
            { renderQuantityHeader() }
            { renderItemCodeableConceptHeader() }
            { renderAuthoredOnHeader() }
            { renderOccurrenceDateTimeHeader() }
            { renderRequesterHeader() }
            { renderSupplierHeader() }
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


SupplyRequestsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  supplyRequests: PropTypes.array,
  selectedSupplyRequestId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideQuantity: PropTypes.bool,
  hideItemCodeableConcept: PropTypes.bool,
  hideAuthoredOn: PropTypes.bool,
  hideOccurrenceDateTime: PropTypes.bool,
  hideRequester: PropTypes.bool,
  hideSupplier: PropTypes.bool,
  hideBarcode: PropTypes.bool,

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

SupplyRequestsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideStatus: false,
  hidePriority: false,
  hideQuantity: false,
  hideItemCodeableConcept: false,
  hideAuthoredOn: false,
  hideOccurrenceDateTime: false,
  hideRequester: true,
  hideSupplier: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,
  supplyRequests: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false,
  order: 'ascending'
}

export default SupplyRequestsTable;
