import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox
} from '@mui/material';

import moment from 'moment'
import { get, set } from 'lodash';

import FhirUtilities from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';

import { Session } from 'meteor/session';

//===========================================================================
// THEMING

// import { ThemeProvider, makeStyles } from '@material-ui/styles';
// const useStyles = makeStyles(theme => ({
//   button: {
//     background: theme.background,
//     border: 0,
//     borderRadius: 3,
//     boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
//     color: theme.buttonText,
//     height: 48,
//     padding: '0 30px',
//   }
// }));

// let styles = {
//   hideOnPhone: {
//     visibility: 'visible',
//     display: 'table'
//   },
//   cellHideOnPhone: {
//     visibility: 'visible',
//     display: 'table',
//     paddingTop: '16px',
//     maxWidth: '120px'
//   },
//   cell: {
//     paddingTop: '16px'
//   }
// }



//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedSubscriptions', []);


//===========================================================================
// MAIN COMPONENT


function SubscriptionsTable(props){
  console.info('Rendering the SubscriptionsTable');

  // logger.info('Rendering the SubscriptionsTable');
  // logger.data('SubscriptionsTable.props', {data: props}, {source: "SubscriptionsTable.jsx"});

  

  let { 
    children, 
    id,
    data,

    subscriptions,
    selectedSubscriptionId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideStatus,
    hideContact,
    hideEnd,
    hideReason,
    hideCriteria,
    hideError,
    hideChannelType,
    hideChannelEndpoint,
    hideBarcode,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    size,
    appHeight,
    formFactorLayout,
    displayEnteredInError, 

    checklist,

    page,
    onSetPage,
    
    count,
    multiline,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = true;
        hideStatus = true
        hideContact = true
        hideEnd = true
        hideReason = true
        hideCriteria = true
        hideError = true
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = true
        break;
      case "tablet":
        hideActionIcons = true;
        hideStatus = true;
        hideContact = true
        hideEnd = true
        hideReason = true
        hideCriteria = true
        hideError = true
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = true
        break;
      case "web":
        hideActionIcons = true;
        hideStatus = false;
        hideContact = true
        hideEnd = true
        hideReason = true
        hideCriteria = true
        hideError = true
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = true
        break;
      case "desktop":
        hideActionIcons = true;
        hideStatus = false;
        hideContact = true
        hideEnd = false
        hideReason = true
        hideCriteria = true
        hideError = true
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = false
        break;
      case "hdmi":
        hideActionIcons = true;
        hideStatus = false
        hideContact = true
        hideEnd = false
        hideReason = true
        hideCriteria = false
        hideError = true
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = false
        break;        
      case "videowall":
        hideActionIcons = true;
        hideStatus = false
        hideContact = false
        hideEnd = false
        hideReason = false
        hideCriteria = false
        hideError = false
        hideChannelType = false
        hideChannelEndpoint = false
        hideBarcode = false
        break;            
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

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(id){
    console.log('Clicking row ' + id)
    if(onRowClick){
      onRowClick(id);
    }
  }

  function removeRecord(_id){
    console.log('Remove subscription ', _id)
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
    let self = this;
    if(onMetaClick){
      onMetaClick(self, patient);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderCheckbox(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
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
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(subscription ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(subscription)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(subscription._id)} />   */}
        </TableCell>
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
        <TableCell className='status'>Status</TableCell>
      );
    }
  }
  function renderContact(contact){
    if (!hideContact) {
      return (
        <TableCell className='contact'>{ contact }</TableCell>
      );
    }
  }
  function renderContactHeader(){
    if (!hideContact) {
      return (
        <TableCell className='contact'>Contact</TableCell>
      );
    }
  }
  function renderEnd(endDate){
    if (!hideEnd) {

      if(!endDate){
        endDate = "";
      }
      return (
        <TableCell className='endDate'>{ endDate }</TableCell>
      );
    }
  }
  function renderEndHeader(){
    if (!hideEnd) {
      return (
        <TableCell className='endDate'>End</TableCell>
      );
    }
  }

  function renderReason(reason){
    if (!hideReason) {
      return (
        <TableCell className='reason'>{ reason }</TableCell>
      );
    }
  }
  function renderReasonHeader(){
    if (!hideReason) {
      return (
        <TableCell className='reason'>Reason</TableCell>
      );
    }
  }
  function renderCriteria(criteria){
    if (!hideCriteria) {
      return (
        <TableCell className='criteria'>{ criteria }</TableCell>
      );
    }
  }
  function renderCriteriaHeader(){
    if (!hideCriteria) {
      return (
        <TableCell className='criteria'>Criteria</TableCell>
      );
    }
  }
  function renderError(error){
    if (!hideError) {
      return (
        <TableCell className='error'>{ error }</TableCell>
      );
    }
  }
  function renderErrorHeader(){
    if (!hideError) {
      return (
        <TableCell className='error'>Error</TableCell>
      );
    }
  }
  function renderChannelType(channelType){
    if (!hideChannelType) {
      return (
        <TableCell className='channelType'>{ channelType }</TableCell>
      );
    }
  }
  function renderChannelTypeHeader(){
    if (!hideChannelType) {
      return (
        <TableCell className='channelType'>Channel Type</TableCell>
      );
    }
  }
  function renderChannelEndpoint(channelEndpoint){
    if (!hideChannelEndpoint) {
      return (
        <TableCell className='channelEndpoint'>{ channelEndpoint }</TableCell>
      );
    }
  }
  function renderChannelEndpointHeader(){
    if (!hideChannelEndpoint) {
      return (
        <TableCell className='channelEndpoint'>Endpoint</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode helveticas">{id}</span></TableCell>
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

  
  //---------------------------------------------------------------------
  // Table Rows



  let tableRows = [];
  let subscriptionsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(subscriptions){
    if(subscriptions.length > 0){              
      let count = 0;

      subscriptions.forEach(function(subscription){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          subscriptionsToRender.push(FhirDehydrator.dehydrateSubscription(subscription, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(subscriptionsToRender.length === 0){
    console.log('No subscriptions to render');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < subscriptionsToRender.length; i++) {

      let selected = false;
      if(subscriptionsToRender[i].id === selectedSubscriptionId){
        selected = true;
      }
      if(get(subscriptionsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="subscriptionRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, subscriptionsToRender[i].id)} 
          hover={true} 
          style={rowStyle} 
          // selected={selected}
        >
          { renderCheckbox(subscriptionsToRender[i]) }
          { renderActionIcons(subscriptionsToRender[i]) }

          { renderStatus(subscriptionsToRender[i].status) }
          { renderContact(subscriptionsToRender[i].contact) }
          { renderEnd(subscriptionsToRender[i].end) }
          { renderReason(subscriptionsToRender[i].reason) }
          { renderCriteria(subscriptionsToRender[i].criteria) }
          { renderError(subscriptionsToRender[i].error) }
          { renderChannelType(subscriptionsToRender[i].channelType) }
          { renderChannelEndpoint(subscriptionsToRender[i].channelEndpoint) }

          { renderBarcode(subscriptionsToRender[i]._id)}
        </TableRow>
      );       
    }
  }

  return(
    <div>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }

            { renderStatusHeader() }
            { renderContactHeader() }
            { renderEndHeader() }
            { renderReasonHeader() }
            { renderCriteriaHeader() }
            { renderErrorHeader() }
            { renderChannelTypeHeader() }
            { renderChannelEndpointHeader() }

            { renderBarcodeHeader() }
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

SubscriptionsTable.propTypes = {
  barcodes: PropTypes.bool,
  subscriptions: PropTypes.array,
  selectedSubscriptionId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  
  hideStatus: PropTypes.bool,
  hideContact: PropTypes.bool,
  hideEnd: PropTypes.bool,
  hideReason: PropTypes.bool,
  hideCriteria: PropTypes.bool,
  hideError: PropTypes.bool,
  hideChannelType: PropTypes.bool,
  hideChannelEndpoint: PropTypes.bool, 

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onSetPage: PropTypes.func,
  onActionButtonClick: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  tableRowSize: PropTypes.string,

  formFactorLayout: PropTypes.string,
  checklist: PropTypes.bool,
  count: PropTypes.number
};
SubscriptionsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideBarcode: true,

  hideStatus: false,
  hideContact: false,
  hideEnd: false,
  hideReason: true,
  hideCriteria: true,
  hideError: true,
  hideChannelType: false,
  hideChannelEndpoint: false,

  checklist: true,
  selectedSubscriptionId: '',
  page: 0,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default SubscriptionsTable; 