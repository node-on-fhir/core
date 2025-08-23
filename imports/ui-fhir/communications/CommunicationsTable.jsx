// /imports/ui-fhir/communications/CommunicationsTable.jsx

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
// THEMING

// Simplified logger that uses standard console methods
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

function CommunicationsTable(props){
  logger.info('Rendering the CommunicationsTable');

  let { 
    id,
    children, 

    data,
    communications,
    selectedCommunicationId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideCategory,
    hideStatus,
    hidePriority,
    hideSubject,
    hideRecipient,
    hideSender,
    hideSent,
    hideReceived,
    hideBarcode,
    hideMessageContent,
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

    ...otherProps 
  } = props;


    // ------------------------------------------------------------------------
  // Form Factors
  
  // Store original prop values to respect user preferences
  const hideBarcodeFromProp = hideBarcode;
  const hideCategoryFromProp = hideCategory;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCategory = true;
        hideStatus = true;
        hidePriority = true;
        hideSubject = false;
        hideRecipient = true;
        hideSender = true;
        hideSent = true;
        hideReceived = true;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "tablet":
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : true;
        hideStatus = false;
        hidePriority = true;
        hideSubject = false;
        hideRecipient = false;
        hideSender = false;
        hideSent = false;
        hideReceived = true;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "desktop":
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : true;
        hideStatus = false;
        hidePriority = false;
        hideSubject = false;
        hideRecipient = false;
        hideSender = false;
        hideSent = false;
        hideReceived = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : true;
        hideStatus = false;
        hidePriority = false;
        hideSubject = false;
        hideRecipient = false;
        hideSender = false;
        hideSent = false;
        hideReceived = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        hideTextIcon = true;
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
            name={`communication-${index}`}
            checked={defaultCheckboxValue}
            onChange={handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>{get(labels, 'actionIcons', 'Actions')}</TableCell>
      );
    }
  }
  function renderActionIcons(communication ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(communication)} />
          <IoMdTrash style={iconStyle} onClick={removeRecord.bind(communication._id)} /> */}
        </TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell>
          {/* <ReactBarcode value={id}/> */}
        </TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell>{get(labels, 'barcodes', 'Barcodes')}</TableCell>
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
        <TableCell className='identifier'>{get(labels, 'identifier', 'Identifier')}</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );  
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{get(labels, 'category', 'Category')}</TableCell>
      );
    }
  }
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{get(labels, 'status', 'Status')}</TableCell>
      );
    }
  }
  function renderPriority(priority){
    if (!hidePriority) {
      return (
        <TableCell className='priority'>{ priority }</TableCell>
      );
    }
  }
  function renderPriorityHeader(){
    if (!hidePriority) {
      return (
        <TableCell className='priority'>{get(labels, 'priority', 'Priority')}</TableCell>
      );
    }
  }
  function renderSubject(subject){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{ subject }</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{get(labels, 'subject', 'Subject')}</TableCell>
      );
    }
  }
  function renderRecipient(recipient){
    if (!hideRecipient) {
      return (
        <TableCell className='recipient'>{ recipient }</TableCell>
      );
    }
  }
  function renderRecipientHeader(){
    if (!hideRecipient) {
      return (
        <TableCell className='recipient'>{get(labels, 'recipient', 'Recipient')}</TableCell>
      );
    }
  }
  function renderSender(sender){
    if (!hideSender) {
      return (
        <TableCell className='sender'>{ sender }</TableCell>
      );
    }
  }
  function renderSenderHeader(){
    if (!hideSender) {
      return (
        <TableCell className='sender'>{get(labels, 'sender', 'Sender')}</TableCell>
      );
    }
  }
  function renderSent(sent){
    if (!hideSent) {
      return (
        <TableCell className='sent'>{ sent }</TableCell>
      );
    }
  }
  function renderSentHeader(){
    if (!hideSent) {
      return (
        <TableCell className='sent'>{get(labels, 'sent', 'Sent')}</TableCell>
      );
    }
  }
  function renderReceived(received){
    if (!hideReceived) {
      return (
        <TableCell className='received'>{ received }</TableCell>
      );
    }
  }
  function renderReceivedHeader(){
    if (!hideReceived) {
      return (
        <TableCell className='received'>{get(labels, 'received', 'Received')}</TableCell>
      );
    }
  }
  function renderMessageContent(messageContent){
    if (!hideMessageContent) {
      // Truncate long messages for table display
      let displayContent = messageContent || '';
      if (displayContent.length > 50) {
        displayContent = displayContent.substring(0, 47) + '...';
      }
      return (
        <TableCell className='messageContent'>{ displayContent }</TableCell>
      );
    }
  }
  function renderMessageContentHeader(){
    if (!hideMessageContent) {
      return (
        <TableCell className='messageContent'>{get(labels, 'messageContent', 'Message Content')}</TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let communicationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(communications){
    if(communications.length > 0){     
      let count = 0;    

      communicationsToRender = communications;

      if(communicationsToRender.length > 0){
        communicationsToRender.forEach(function(communication){
          if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
            let row = FhirDehydrator.dehydrateCommunication(communication);
            
            tableRows.push(
              <TableRow key={count} className="communicationRow" style={{cursor: 'pointer'}} onClick={ handleRowClick.bind(this, communication._id)}>
                { renderCheckbox(count) }
                { renderActionIcons(communication) }
                { renderStatus(row.status) }
                { renderPriority(row.priority) }
                { renderSender(row.sender) }
                { renderSent(row.sent) }
                { renderSubject(row.subject) }
                { renderMessageContent(row.messageContent || row.payloadContent) }
                { renderRecipient(row.recipient) }
                { renderReceived(row.received) }
                { renderCategory(row.category) }
                { renderBarcode(row.id) }
              </TableRow>
            )
          }
          count++;
        });
      }
    }
  }

  const handleChangePage = (event, newPage) => {
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    // This should be handled by the parent component
    // The parent needs to pass an onSetRowsPerPage function
    if(typeof props.onSetRowsPerPage === "function"){
      props.onSetRowsPerPage(parseInt(event.target.value, 10));
    }
    // Reset to first page when changing rows per page
    if(typeof onSetPage === "function"){
      onSetPage(0);
    }
  };

  
  // Render Table
  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderStatusHeader() }
            { renderPriorityHeader() }
            { renderSenderHeader() }
            { renderSentHeader() }
            { renderSubjectHeader() }
            { renderMessageContentHeader() }
            { renderRecipientHeader() }
            { renderReceivedHeader() }
            { renderCategoryHeader() }
            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25, 100]}
        count={communications ? communications.length : 0}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}

CommunicationsTable.propTypes = {
  communications: PropTypes.array,
  selectedCommunicationId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideRecipient: PropTypes.bool,
  hideSender: PropTypes.bool,
  hideSent: PropTypes.bool,
  hideReceived: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideMessageContent: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  hideActionButton: PropTypes.bool,

  autoColumns: PropTypes.bool,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,
  labels: PropTypes.object,

  defaultCheckboxValue: PropTypes.bool,

  page: PropTypes.number,
  onSetPage: PropTypes.func
};

CommunicationsTable.defaultProps = {
  rowsPerPage: 5,
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: false,
  hideCategory: true,
  hideStatus: false,
  hidePriority: false,
  hideSubject: false,
  hideRecipient: false,
  hideSender: false,
  hideSent: false,
  hideReceived: false,
  hideBarcode: true,
  hideMessageContent: false,
  defaultCheckboxValue: false,
  autoColumns: true,
  rowsPerPageOptions: [5, 10, 25, 100],
  tableRowSize: 'medium',
  page: 0
}

export default CommunicationsTable;