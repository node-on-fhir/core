// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/supplyDeliveries/SupplyDeliveriesTable.jsx
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


//===========================================================================
// THEMING



//===========================================================================
// MAIN COMPONENT

function SupplyDeliveriesTable(props){
  logger.info('Rendering the SupplyDeliveriesTable');

  let { 
    id,
    children, 

    data,
    supplyDeliveries,
    selectedSupplyDeliveryId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideType,
    hideOccurrence,
    hideSupplier,
    hideDestination,
    hideReceiver,
    hideQuantity,
    hideItemCodeableConcept,
    hidePatientName,
    hidePatientReference,
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
  const hidePatientNameFromProp = hidePatientName;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideStatus = false;
        hideType = true;
        hideOccurrence = true;
        hideSupplier = true;
        hideDestination = true;
        hideReceiver = true;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hidePatientName = true;
        hidePatientReference = true;
        hideBarcode = true;  
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideStatus = false;
        hideType = false;
        hideOccurrence = false;
        hideSupplier = false;
        hideDestination = true;
        hideReceiver = true;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;   
        multiline = false;
        break;
      case "web":
        hideStatus = false;
        hideType = false;
        hideOccurrence = false;
        hideSupplier = false;
        hideDestination = false;
        hideReceiver = true;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "desktop":
        hideStatus = false;
        hideType = false;
        hideOccurrence = false;
        hideSupplier = false;
        hideDestination = false;
        hideReceiver = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "hdmi":
        hideStatus = false;
        hideType = false;
        hideOccurrence = false;
        hideSupplier = false;
        hideDestination = false;
        hideReceiver = false;
        hideQuantity = false;
        hideItemCodeableConcept = false;
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
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className='type'>Type</TableCell>
      );
    }
  }
  function renderType(type ){
    if (!hideType) {
      return (
        <TableCell className='type'>{ type }</TableCell>
      );
    }
  }
  function renderOccurrenceHeader(){
    if (!hideOccurrence) {
      return (
        <TableCell className='occurrence' style={{minWidth: '140px'}}>Occurrence</TableCell>
      );
    }
  }
  function renderOccurrence(occurrence ){
    if (!hideOccurrence) {
      return (
        <TableCell className='occurrence' style={{minWidth: '140px'}}>{ moment(occurrence).format('YYYY-MM-DD') }</TableCell>
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
  function renderDestinationHeader(){
    if (!hideDestination) {
      return (
        <TableCell className='destination'>Destination</TableCell>
      );
    }
  }
  function renderDestination(destination ){
    if (!hideDestination) {
      return (
        <TableCell className='destination' style={{minWidth: '140px'}}>{ destination }</TableCell>
      );
    }
  }
  function renderReceiverHeader(){
    if (!hideReceiver) {
      return (
        <TableCell className='receiver'>Receiver</TableCell>
      );
    }
  }
  function renderReceiver(receiver ){
    if (!hideReceiver) {
      return (
        <TableCell className='receiver' style={{minWidth: '140px'}}>{ receiver }</TableCell>
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( supplyDelivery ){
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
  function renderActionButton(supplyDeliveryId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, supplyDeliveryId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedSupplyDeliveryId', id);
    // Session.set('supplyDeliveryPageTabIndex', 2);
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
  let supplyDeliveriesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(supplyDeliveries){
    if(supplyDeliveries.length > 0){     
      let count = 0;    
      
      // Apply order: if 'descending' or alias 'reverse', reverse the array
      let orderedSupplyDeliveries = supplyDeliveries;
      if(order === 'descending' || order === 'reverse'){
        orderedSupplyDeliveries = reverse([...supplyDeliveries]); // Create a copy and reverse it
      }

      orderedSupplyDeliveries.forEach(function(supplyDelivery){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          supplyDeliveriesToRender.push(FhirDehydrator.dehydrateSupplyDelivery(supplyDelivery, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(supplyDeliveriesToRender.length === 0){
    logger.trace('SupplyDeliveriesTable: No supply deliveries to render.');
  } else {
    for (var i = 0; i < supplyDeliveriesToRender.length; i++) {
      let selected = false;
      if(supplyDeliveriesToRender[i].id === selectedSupplyDeliveryId){
        selected = true;
      }
      if(get(supplyDeliveriesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('supplyDeliveriesToRender[i]', supplyDeliveriesToRender[i])

      if(get(supplyDeliveriesToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="supplyDeliveryRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, supplyDeliveriesToRender[i]._id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(supplyDeliveriesToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="supplyDeliveryRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, supplyDeliveriesToRender[i]._id)} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(supplyDeliveriesToRender[i]) }
            { renderIdentifier(get(supplyDeliveriesToRender[i], "identifier", "")) }
            { renderStatus(get(supplyDeliveriesToRender[i], "status", "")) }
            { renderType(get(supplyDeliveriesToRender[i], "type", "")) }
            { renderOccurrence(get(supplyDeliveriesToRender[i], "occurrenceDateTime", "")) }
            { renderSupplier(get(supplyDeliveriesToRender[i], "supplierDisplay", "")) }
            { renderDestination(get(supplyDeliveriesToRender[i], "destinationDisplay", "")) }
            { renderReceiver(get(supplyDeliveriesToRender[i], "receiverDisplay", "")) }
            { renderQuantity(get(supplyDeliveriesToRender[i], "quantity", "")) }
            { renderItemCodeableConcept(get(supplyDeliveriesToRender[i], "itemCodeableConceptDisplay", ""), get(supplyDeliveriesToRender[i], "itemCodeableConceptCode", "")) }
            { renderPatientName(get(supplyDeliveriesToRender[i], "patientDisplay", "")) } 
            { renderPatientReference(get(supplyDeliveriesToRender[i], "patientReference", "")) }           
            { renderBarcode(get(supplyDeliveriesToRender[i], "_id", ""))}
            { renderActionButton(get(supplyDeliveriesToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='supplyDeliveriesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderTypeHeader() }
            { renderOccurrenceHeader() }
            { renderSupplierHeader() }
            { renderDestinationHeader() }
            { renderReceiverHeader() }
            { renderQuantityHeader() }
            { renderItemCodeableConceptHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
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


SupplyDeliveriesTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  supplyDeliveries: PropTypes.array,
  selectedSupplyDeliveryId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideOccurrence: PropTypes.bool,
  hideSupplier: PropTypes.bool,
  hideDestination: PropTypes.bool,
  hideReceiver: PropTypes.bool,
  hideQuantity: PropTypes.bool,
  hideItemCodeableConcept: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
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

SupplyDeliveriesTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideStatus: false,
  hideType: false,
  hideOccurrence: false,
  hideSupplier: false,
  hideDestination: false,
  hideReceiver: false,
  hideQuantity: false,
  hideItemCodeableConcept: false,
  hidePatientName: false,
  hidePatientReference: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  supplyDeliveries: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false,
  order: 'ascending'
}

export default SupplyDeliveriesTable;