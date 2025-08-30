// /imports/ui-fhir/messageHeaders/MessageHeadersTable.jsx

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
} from '@mui/material';

import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator, flattenMessageHeader } from '../../lib/FhirDehydrator';

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
// THEMING




//===========================================================================
// MAIN COMPONENT

function MessageHeadersTable(props){
  logger.info('Rendering the MessageHeadersTable');
  
  let { 
    children, 
    id,

    data,
    messageHeaders,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideEventCoding,
    hideEventDisplay,
    hideDestinationName,
    hideDestinationEndpoint,
    hideSenderDisplay,
    hideSourceName,
    hideResponseCode,
    hideResponseIdentifier,
    hideFocusDisplay,
    hideFocusReference,
    hideNotes,
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
  // Form Factors

  // Store original prop values
  const hideFocusDisplayFromProp = hideFocusDisplay;
  const hideFocusReferenceFromProp = hideFocusReference;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideEventCoding = true;
        hideEventDisplay = false;
        hideDestinationName = false;
        hideDestinationEndpoint = true;
        hideSenderDisplay = true;
        hideSourceName = true;
        hideResponseCode = false;
        hideResponseIdentifier = true;
        hideFocusDisplay = true;
        hideFocusReference = true;
        hideNotes = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideEventCoding = true;
        hideEventDisplay = false;
        hideDestinationName = false;
        hideDestinationEndpoint = true;
        hideSenderDisplay = false;
        hideSourceName = true;
        hideResponseCode = false;
        hideResponseIdentifier = true;
        hideFocusDisplay = true;
        hideFocusReference = true;
        hideNotes = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = true;
        hideActionIcons = true;
        hideEventCoding = true;
        hideEventDisplay = false;
        hideDestinationName = false;
        hideDestinationEndpoint = false;
        hideSenderDisplay = false;
        hideSourceName = false;
        hideResponseCode = false;
        hideResponseIdentifier = true;
        hideFocusDisplay = (hideFocusDisplayFromProp !== undefined) ? hideFocusDisplayFromProp : false;
        hideFocusReference = (hideFocusReferenceFromProp !== undefined) ? hideFocusReferenceFromProp : true;
        hideNotes = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideEventCoding = false;
        hideEventDisplay = false;
        hideDestinationName = false;
        hideDestinationEndpoint = false;
        hideSenderDisplay = false;
        hideSourceName = false;
        hideResponseCode = false;
        hideResponseIdentifier = false;
        hideFocusDisplay = (hideFocusDisplayFromProp !== undefined) ? hideFocusDisplayFromProp : false;
        hideFocusReference = (hideFocusReferenceFromProp !== undefined) ? hideFocusReferenceFromProp : true;
        hideNotes = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideCheckbox = true;
        hideActionIcons = true;
        hideEventCoding = false;
        hideEventDisplay = false;
        hideDestinationName = false;
        hideDestinationEndpoint = false;
        hideSenderDisplay = false;
        hideSourceName = false;
        hideResponseCode = false;
        hideResponseIdentifier = false;
        hideFocusDisplay = false;
        hideFocusReference = false;
        hideNotes = false;
        hideBarcode = false;
        break;            
    }
  }

  // Click Handlers
  function handleRowClick(id){
    if(typeof onRowClick === 'function'){
      onRowClick(id);
    }
  }
  
  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === 'function'){
      onActionButtonClick(id);
    }
  }

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
  // Helper Functions

  function removeRecord(_id){
    console.log('removeRecord')
  }
  function rowClick(id){
    console.log('MessageHeadersTable.rowClick', id);
    if(typeof onRowClick === 'function'){
      onRowClick(id);
    }
  }
  function handleActionButtonClick(){
    console.log('handleActionButtonClick')
  }


  //---------------------------------------------------------------------
  // Column Rendering 

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Checkbox</TableCell>
      );
    }
  }
  function renderCheckbox(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle">
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
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(messageHeader){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* Add action icons here if needed */}
        </TableCell>
      );
    }
  } 
  function renderEventCodingHeader(){
    if (!hideEventCoding) {
      return (
        <TableCell className='eventCoding'>Event Code</TableCell>
      );
    }
  }
  function renderEventCoding(eventCoding){
    if (!hideEventCoding) {
      return (
        <TableCell className='eventCoding'>{ eventCoding }</TableCell>
      );
    }
  } 
  function renderEventDisplayHeader(){
    if (!hideEventDisplay) {
      return (
        <TableCell className='eventDisplay'>Event</TableCell>
      );
    }
  }
  function renderEventDisplay(eventDisplay){
    if (!hideEventDisplay) {
      return (
        <TableCell className='eventDisplay'>{eventDisplay}</TableCell>
      );
    }
  }
  function renderDestinationNameHeader(){
    if (!hideDestinationName) {
      return (
        <TableCell className='destinationName'>Destination</TableCell>
      );
    }
  }
  function renderDestinationName(destinationName){
    if (!hideDestinationName) {
      return (
        <TableCell className='destinationName'>{destinationName}</TableCell>
      );
    }
  }
  function renderDestinationEndpointHeader(){
    if (!hideDestinationEndpoint) {
      return (
        <TableCell className='destinationEndpoint'>Endpoint</TableCell>
      );
    }
  }
  function renderDestinationEndpoint(destinationEndpoint){
    if (!hideDestinationEndpoint) {
      return (
        <TableCell className='destinationEndpoint'>{destinationEndpoint}</TableCell>
      );
    }
  }
  function renderSenderDisplayHeader(){
    if (!hideSenderDisplay) {
      return (
        <TableCell className='senderDisplay'>Sender</TableCell>
      );
    }
  }
  function renderSenderDisplay(senderDisplay){
    if (!hideSenderDisplay) {
      return (
        <TableCell className='senderDisplay'>{senderDisplay}</TableCell>
      );
    }
  }
  function renderSourceNameHeader(){
    if (!hideSourceName) {
      return (
        <TableCell className='sourceName'>Source</TableCell>
      );
    }
  }
  function renderSourceName(sourceName){
    if (!hideSourceName) {
      return (
        <TableCell className='sourceName'>{sourceName}</TableCell>
      );
    }
  }
  function renderResponseCodeHeader(){
    if (!hideResponseCode) {
      return (
        <TableCell className='responseCode'>Response</TableCell>
      );
    }
  }
  function renderResponseCode(responseCode){
    if (!hideResponseCode) {
      return (
        <TableCell className='responseCode'>{responseCode}</TableCell>
      );
    }
  }
  function renderResponseIdentifierHeader(){
    if (!hideResponseIdentifier) {
      return (
        <TableCell className='responseIdentifier'>Response ID</TableCell>
      );
    }
  }
  function renderResponseIdentifier(responseIdentifier){
    if (!hideResponseIdentifier) {
      return (
        <TableCell className='responseIdentifier'>{responseIdentifier}</TableCell>
      );
    }
  }
  function renderFocusDisplayHeader(){
    if (!hideFocusDisplay) {
      return (
        <TableCell className='focusDisplay'>Focus</TableCell>
      );
    }
  }
  function renderFocusDisplay(focusDisplay){
    if (!hideFocusDisplay) {
      return (
        <TableCell className='focusDisplay'>{focusDisplay}</TableCell>
      );
    }
  }
  function renderFocusReferenceHeader(){
    if (!hideFocusReference) {
      return (
        <TableCell className='focusReference'>Focus Reference</TableCell>
      );
    }
  }
  function renderFocusReference(focusReference){
    if (!hideFocusReference) {
      return (
        <TableCell className='focusReference'>{focusReference}</TableCell>
      );
    }
  }
  function renderNotesHeader(){
    if (!hideNotes) {
      return (
        <TableCell className='notes'>Notes</TableCell>
      );
    }
  }
  function renderNotes(notes){
    if (!hideNotes) {
      return (
        <TableCell className='notes'>{notes}</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID
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
  function renderActionButton(messageHeader){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, messageHeader._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let messageHeadersToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.messageHeaders){
    if(props.messageHeaders.length > 0){     
      let count = 0;    

      props.messageHeaders.forEach(function(messageHeader){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          messageHeadersToRender.push(flattenMessageHeader(messageHeader, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer'
  }
  if(messageHeadersToRender.length === 0){
    logger.trace('MessageHeadersTable: No message headers to render.');
  } else {
    for (let i = 0; i < messageHeadersToRender.length; i++) {
      const currentMessageHeader = messageHeadersToRender[i];
      const messageHeaderId = currentMessageHeader._id;
      
      if(get(messageHeadersToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      
      tableRows.push(
        <TableRow className="messageHeaderRow" key={i} style={{...rowStyle, cursor: 'pointer'}} onClick={() => handleRowClick(messageHeaderId)} hover={true} >            
          { renderCheckbox() }  
          { renderActionIcons() }
          { renderEventCoding(get(currentMessageHeader, 'eventCoding')) }
          { renderEventDisplay(get(currentMessageHeader, 'eventDisplay')) }
          { renderDestinationName(get(currentMessageHeader, 'destinationName')) }
          { renderDestinationEndpoint(get(currentMessageHeader, 'destinationEndpoint')) }
          { renderSenderDisplay(get(currentMessageHeader, 'senderDisplay')) }
          { renderSourceName(get(currentMessageHeader, 'sourceName')) }
          { renderResponseCode(get(currentMessageHeader, 'responseCode')) }
          { renderResponseIdentifier(get(currentMessageHeader, 'responseIdentifier')) }
          { renderFocusDisplay(get(currentMessageHeader, 'focusDisplay')) }
          { renderFocusReference(get(currentMessageHeader, 'focusReference')) }
          { renderNotes(get(currentMessageHeader, 'notes')) }
          { renderBarcode(currentMessageHeader._id)}
          { renderActionButton(currentMessageHeader) }
        </TableRow>
      );    
    }
  }


  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table className='messageHeadersTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }  
            { renderActionIconsHeader() }
            { renderEventCodingHeader() }
            { renderEventDisplayHeader() }
            { renderDestinationNameHeader() }
            { renderDestinationEndpointHeader() }
            { renderSenderDisplayHeader() }
            { renderSourceNameHeader() }
            { renderResponseCodeHeader() }
            { renderResponseIdentifierHeader() }
            { renderFocusDisplayHeader() }
            { renderFocusReferenceHeader() }
            { renderNotesHeader() }
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




MessageHeadersTable.propTypes = {
  id: PropTypes.string,

  data: PropTypes.array,
  messageHeaders: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideEventCoding: PropTypes.bool,
  hideEventDisplay: PropTypes.bool,
  hideDestinationName: PropTypes.bool,
  hideDestinationEndpoint: PropTypes.bool,
  hideSenderDisplay: PropTypes.bool,
  hideSourceName: PropTypes.bool,
  hideResponseCode: PropTypes.bool,
  hideResponseIdentifier: PropTypes.bool,
  hideFocusDisplay: PropTypes.bool,
  hideFocusReference: PropTypes.bool,
  hideNotes: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionButton: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,

  actionButtonLabel: PropTypes.string,
  formFactorLayout: PropTypes.string,

  count: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool
};

MessageHeadersTable.defaultProps = {
  rowsPerPage: 5,
  tableRowSize: 'medium',
  page: 0,
  hideCheckbox: true,
  hideActionIcons: true,
  hideEventCoding: true,
  hideBarcode: true,
  hideFocusDisplay: false,
  hideFocusReference: true,
  messageHeaders: []
}

export default MessageHeadersTable;

