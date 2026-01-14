import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button,
} from '@mui/material';


import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;
let has = _.has;

import FhirUtilities from '../../lib/FhirUtilities';
import TableNoData from '../../components/TableNoData';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

import { useTracker } from 'meteor/react-meteor-data';



//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedDocumentSource', '');


//===========================================================================
// MAIN COMPONENT

export function ServiceRequestsTable(props){
  
  let { 
    serviceRequests,
    selectedServiceRequestId,

    rowsPerPage,
    count,
    disablePagination,
    showMinutes,
    dateFormat,
    tableRowSize,
    query,
    limit,
    sort,


    selectedPatientId,

    hideCheckbox,
    hideActionIcons,
    hideSubjectName,
    hideSubjectReference,
    hideRequestorName,
    hideStatus,
    hideAuthoredOn,
    hidePeriodStart,
    hidePeriodEnd,
    hidePerformerName,
    hidePerformerReference,
    hideDoNotPerform,
    hideBarcode,
    hideRequestorReference,
    hideText,
    hideOrderDetail,
    hideIntent,
    hideCodeDisplay,
    cancelButtonType,
    cancelColor,

    onRevoke,

    noDataMessage,
    noDataMessagePadding,

    page,
    onSetPage

  } = props;

  //------------------------------------------------------------------------------------
  // State

  let data = {
    style: {
      hideOnPhone: {
        visibility: 'visible',
        display: 'table'
      },
      cellHideOnPhone: {
        visibility: 'visible',
        display: 'table',
        paddingTop: '16px'
      },
      cell: {
        paddingTop: '16px'
      }
    },
    selected: [],
    serviceRequests: []
  };


  //------------------------------------------------------------------------------------
  // Table Query


  if(selectedPatientId){
    query['patient.reference'] = "Patient/" +selectedPatientId;
  }

  if(query){
    query = query;
  }

  let options = {};

  if(sort){

    switch (sort) {
      case "date":
        options.sort = { authoredOn: -1 }
        break;
      case "periodStart":
        options.sort = { 'period.start': -1 }
        break;      
      default:
        break;
    }
  }

  // number of items in the table should be set globally
  if (get(Meteor, 'settings.public.defaults.paginationLimit')) {
    options.limit = get(Meteor, 'settings.public.defaults.paginationLimit');
  }

  // but can be over-ridden by props being more explicit
  if(limit){
    options.limit = limit;      
  }


  //------------------------------------------------------------------------------------
  // Trackers

  // data.serviceRequests = [];

  // function dehydrateServiceRequest(document){
  //     let result = {
  //       _id: document._id,
  //       id: get(document, 'id', ''),
  //       authoredOn: moment(get(document, 'authoredOn', null)).format("YYYY-MM-DD hh:mm:ss"),
  //       status: get(document, 'status', ''),
  //       patientReference: get(document, 'patient.reference', ''),
  //       patientName: get(document, 'patient.display', ''),
  //       // serviceRequestingParty: get(document, 'serviceRequestingParty[0].display', ''),
  //       performer: get(document, 'performer[0].display', ''),
  //       organization: get(document, 'organization[0].display', ''),
  //       policyAuthority: get(document, 'policy[0].authority', ''),
  //       policyUri: get(document, 'policy[0].uri', ''),
  //       policyRule: get(document, 'policyRule.text', ''),
  //       provisionType: get(document, 'provision[0].type', ''),
  //       provisionAction: get(document, 'provision[0].action[0].text', ''),
  //       provisionClass: get(document, 'provision[0].class', ''),
  //       start: '',
  //       end: '',
  //       sourceReference: get(document, 'sourceReference.reference', ''),
  //       category: '',
  //       scope: get(document, 'scope.coding[0].display')
  //     };

  //     if(has(document, 'patient.display')){
  //       result.patientName = get(document, 'patient.display')
  //     } else {
  //       result.patientName = get(document, 'patient.reference')
  //     }

  //     if(has(document, 'category[0].text')){
  //       result.category = get(document, 'category[0].text')
  //     } else {
  //       result.category = get(document, 'category[0].coding[0].display', '')
  //     }

  //     if(has(document, 'period.start')){
  //       result.start = moment(get(document, 'period.start', '')).format("YYYY-MM-DD hh:mm:ss");
  //     }
  //     if(has(document, 'period.end')){
  //       result.end = moment(get(document, 'period.end', '')).format("YYYY-MM-DD hh:mm:ss");
  //     }

  
  //     if(result.patientReference === ''){
  //       result.patientReference = get(document, 'patient.reference', '');
  //     }

  //     if(get(document, 'provision[0].class')){
  //       result.provisionClass = "";
  //       document.provision[0].class.forEach(function(provision){   
  //         if(result.provisionClass == ''){
  //           result.provisionClass = provision.code;
  //         }  else {
  //           result.provisionClass = result.provisionClass + ' - ' + provision.code;
  //         }      
  //       });
  //     }
  //     return result;
  // }


  //------------------------------------------------------------------------------------
  // Helper Functions

  function rowClick(id){
    if(props.onRowClick){
      props.onRowClick(id);
    } else {
      Session.set('serviceRequestsUpsert', false);
      Session.set('selectedServiceRequest', id);
      Session.set('serviceRequestPageTabIndex', 2);
    }
  }
  function handleRevoke(id){
    console.log('handleRevoke', id)

    if(typeof onRevoke === "function"){
      onRevoke(id);
    }  
  }
  function getDocumentReference(sourceReference){
    console.log('getDocumentReference...', sourceReference)

    Session.set('selectedDocumentSource', sourceReference);
  }
  function onPatientClick(id){
    if(onPatientClick){
      onPatientClick(id);
    } else {
      Session.set('serviceRequestsUpsert', false);
      Session.set('selectedServiceRequest', id);
      Session.set('serviceRequestPageTabIndex', 2);  
    }
  }
  function onIdentifierClick(id){
    if(typeof onIdentifierClick === "function"){
      onIdentifierClick(id);
    } 
  }
  function handleToggle(index){
    console.log('Toggling entry ' + index)
    if(props.onToggle){
      props.onToggle(index);
    }
  }

  //------------------------------------------------------------------------------------
  // Render Functions


  function renderSelected(index){
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
  function renderSelectedHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className='selected'>Selected</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell className="id" onClick={ onIdentifierClick.bind(this, id)} ><span className="barcode helveticas">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className="id" >Id</TableCell>
      );
    }
  }
  function renderIdentifier(identifier){
    if (!hideBarcode) {
      return (
        <TableCell className="identifier">{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!hideBarcode) {
      let identiferClassName;

      if(hideBarcode){
        identiferClassName = "identifier"
      } else {
        identiferClassName = "identifier barcode"
      }
      return (
        <TableCell className={identiferClassName} >Identifier</TableCell>
      );
    }
  }
  function renderText(narrativeText){
    if (!hideText) {
      return (
        <TableCell className='narrativeText' style={data.style.cell} >{ narrativeText }</TableCell>
      );
    }
  }
  function renderTextHeader(){
    if (!hideText) {
      return (
        <TableCell className='narrativeText' >Text</TableCell>
      );
    }
  }
  function renderDoNotPerform(doNotPerform){
    if (!hideDoNotPerform) {
      return (
        <TableCell className='doNotPerform' style={data.style.cell} >{ doNotPerform }</TableCell>
      );
    }
  }
  function renderDoNotPerformHeader(){
    if (!hideDoNotPerform) {
      return (
        <TableCell className='doNotPerform' >Do Not Perform</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hidePerformerName) {
      return (
        <TableCell className='category' style={data.style.cell} >{ category }</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!hidePerformerName) {
      return (
        <TableCell className='category' >Category</TableCell>
      );
    }
  }
  function renderAuthoredOn(id, authoredOn){
    if (!hideAuthoredOn) {
      return (
        <TableCell className='date' onClick={ rowClick.bind('this', id)} style={{minWidth: '160px', paddingTop: '16px'}}>{ moment(authoredOn).format("YYYY-MM-DD") }</TableCell>
      );
    }
  }
  function renderAuthoredOnHeader(){
    if (!hideAuthoredOn) {
      return (
        <TableCell className='date' style={{minWidth: '100px'}}>Date</TableCell>
      );
    }
  }
  function renderPeriodStart(id, periodStart){
    if (!hidePeriodStart) {
      return (
        <TableCell className='start' onClick={ rowClick.bind('this', id)} style={{minWidth: '100px', paddingTop: '16px'}}>{ periodStart }</TableCell>
      );
    }
  }
  function renderPeriodStartHeader(){
    if (!hidePeriodStart) {
      return (
        <TableCell className='start' style={{minWidth: '100px'}}>Start</TableCell>
      );
    }
  }
  function renderPeriodEnd(id, periodEnd){
    if (!hidePeriodEnd) {
      return (
        <TableCell className='end' onClick={ rowClick.bind('this', id)} style={{minWidth: '100px', paddingTop: '16px'}}>{ periodEnd }</TableCell>
      );
    }
  }
  function renderPeriodEndHeader(){
    if (!hidePeriodEnd) {
      return (
        <TableCell className='end' style={{minWidth: '100px'}}>End</TableCell>
      );
    }
  }
  function renderIntent(intent ){
    console.log('renderIntent', intent)
    if (!hideIntent) {
      return (
        <TableCell className='intent' onClick={ getDocumentReference.bind(this, intent) } style={{paddingTop: '16px'}}>{ intent }</TableCell>
      );
    }
  }
  function renderIntentHeader(){
    if (!hideIntent) {
      return (
        <TableCell className='intent' style={{marginLeft: '20px'}}> Intent </TableCell>
      );
    }
  }
  function renderCancel(rowId){
    if (!hideDoNotPerform) {
      return (
        <TableCell className='revoke'>
          <Button onClick={handleRevoke.bind(this, rowId)} variant={cancelButtonType}>Revoke</Button>
        </TableCell>
      );
    }
  }
  function renderCancelHeader(){
    if (!hideDoNotPerform) {
      return (
        <TableCell className='end' style={{minWidth: '100px', marginLeft: '20px'}}> Revoke </TableCell>
      );
    }
  }

  function renderSubjectNameHeader(){
    if (!hideSubjectName) {
      return (
        <TableCell className='subjectDisplay'>Subject</TableCell>
      );
    }
  }
  function renderSubjectName(subjectDisplay ){
    if (!hideSubjectName) {
      return (
        <TableCell className='subjectDisplay' style={{minWidth: '140px'}}>{ subjectDisplay }</TableCell>
      );
    }
  }
  function renderSubjectReferenceHeader(){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>Subject Reference</TableCell>
      );
    }
  }
  function renderSubjectReference(subjectReference ){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(subjectReference) }
        </TableCell>
      );
    }
  }


  function renderPerformerNameHeader(){
    if (!hidePerformerName) {
      return (
        <TableCell className='performerDisplay'>Performer</TableCell>
      );
    }
  }
  function renderPerformerName(performerDisplay ){
    if (!hidePerformerName) {
      return (
        <TableCell className='performerDisplay' style={{minWidth: '140px'}}>{ performerDisplay }</TableCell>
      );
    }
  }
  function renderPerformerReferenceHeader(){
    if (!hidePerformerReference) {
      return (
        <TableCell className='performerReference'>Performer Reference</TableCell>
      );
    }
  }
  function renderPerformerReference(performerReference ){
    if (!hideSubjectReference) {
      return (
        <TableCell className='performerReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(performerReference) }
        </TableCell>
      );
    }
  }


  function renderRequestorNameHeader(){
    if (!hideRequestorName) {
      return (
        <TableCell className='requestorDisplay'>Requestor</TableCell>
      );
    }
  }
  function renderRequestorName(requestorDisplay ){
    if (!hideRequestorName) {
      return (
        <TableCell className='requestorDisplay' style={{minWidth: '140px'}}>{ requestorDisplay }</TableCell>
      );
    }
  }
  function renderRequestorReferenceHeader(){
    if (!hideRequestorReference) {
      return (
        <TableCell className='requestorReference'>Requestor Reference</TableCell>
      );
    }
  }
  function renderRequestorReference(requestorReference ){
    if (!hideRequestorReference) {
      return (
        <TableCell className='requestorReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(requestorReference) }
        </TableCell>
      );
    }
  }






  function renderOrderDetailHeader(){
    if (!hideOrderDetail) {
      return (
        <TableCell className='orderDetail'>Order Detail</TableCell>
      );
    }
  }
  function renderOrderDetail(orderDetail ){
    if (!hideOrderDetail) {
      return (
        <TableCell className='orderDetail' style={{minWidth: '140px'}}>{ orderDetail }</TableCell>
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
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status' >{ status }</TableCell>
      );
    }
  }


  function renderScopeHeader(){
    if (!hideRequestorReference) {
      return (
        <TableCell className='scope'>Scope</TableCell>
      );
    }
  }
  function renderScope(scope){
    if (!hideRequestorReference) {
      return (
        <TableCell className='scope' style={{minWidth: '140px'}}>{ scope }</TableCell>
      );
    }
  }

  function renderCodeDisplayHeader(){
    if (!hideCodeDisplay) {
      return (
        <TableCell className='codeDisplay'>Code</TableCell>
      );
    }
  }
  function renderCodeDisplay(codeDisplay){
    if (!hideCodeDisplay) {
      return (
        <TableCell className='codeDisplay' style={{minWidth: '140px'}}>{ codeDisplay }</TableCell>
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
  let serviceRequestsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(serviceRequests){
    if(serviceRequests.length > 0){     
      let count = 0;    

      serviceRequests.forEach(function(serviceRequest){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          serviceRequestsToRender.push(FhirDehydrator.dehydrateServiceRequest(serviceRequest, internalDateFormat));
          // serviceRequestsToRender.push(dehydrateServiceRequest(serviceRequest, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }



  //------------------------------------------------------------------------------------
  // Rendertate

  if(serviceRequestsToRender.length === 0){
    logger.trace('ServiceRequestsTable: No serviceRequests to render.');

    if(noDataMessage){
      footer = <TableNoData noDataPadding={ noDataMessagePadding } />
    }
  } else {
    for (var i = 0; i < serviceRequestsToRender.length; i++) {
      let selected = false;
      if(serviceRequestsToRender[i].id === selectedServiceRequestId){
        selected = true;
      }
      if(get(serviceRequestsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('serviceRequestsToRender[i]', serviceRequestsToRender[i])
      tableRows.push(
        <TableRow className="serviceRequestRow" 
          key={i} 
          style={rowStyle} 
          onClick={ rowClick.bind(this, serviceRequestsToRender[i].id || serviceRequestsToRender[i]._id)} 
          hover={true} 
          selected={selected} 
          >            
          {renderSelected(get(serviceRequestsToRender[i], '_id'))}
          {renderIdentifier(get(serviceRequestsToRender[i], 'identifier', ''))}
          {renderAuthoredOn(get(serviceRequestsToRender[i], '_id'), get(serviceRequestsToRender[i], 'authoredOn'))}
          {renderCodeDisplay(get(serviceRequestsToRender[i], 'codeDisplay')) }
          {renderStatus(get(serviceRequestsToRender[i], 'status'))}
          {renderIntent(get(serviceRequestsToRender[i], 'intent'))}

          {renderSubjectName(get(serviceRequestsToRender[i], 'subjectName')) }
          {renderSubjectReference(get(serviceRequestsToRender[i], 'subjectReference')) }
          {renderPerformerName(get(serviceRequestsToRender[i], 'performerName')) }
          {renderPerformerReference(get(serviceRequestsToRender[i], 'performerReference')) }
          {renderRequestorName(get(serviceRequestsToRender[i], 'requestorName')) }
          {renderRequestorReference(get(serviceRequestsToRender[i], 'requestorReference')) }

          {renderOrderDetail(get(serviceRequestsToRender[i], 'orderDetail')) }
          {renderText( get(serviceRequestsToRender[i], 'text')) }
          {/* {renderDoNotPerform( get(serviceRequestsToRender[i], 'provisionClass')) } */}
          {/* {renderCancel(get(serviceRequestsToRender[i], '_id'))} */}

          {renderBarcode(get(serviceRequestsToRender[i], 'id', ''))}
        </TableRow>
      );    
    }
  }

  return(
    <div>
      <Table id="serviceRequestsTable" className='serviceRequestsTable' size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {renderSelectedHeader() }
            {renderIdentifierHeader() }
            {renderAuthoredOnHeader() }
            {renderCodeDisplayHeader() }
            {renderStatusHeader() }
            {renderIntentHeader() }

            {renderSubjectNameHeader() }
            {renderSubjectReferenceHeader() }
            {renderPerformerNameHeader() }
            {renderPerformerReferenceHeader() }
            {renderRequestorNameHeader() }
            {renderRequestorReferenceHeader() }

            {renderOrderDetailHeader() }
            {renderTextHeader() }
            {/* {renderDoNotPerformHeader() } */}
            {/* {renderCancelHeader() } */}

            {renderBarcodeHeader() }
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


ServiceRequestsTable.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,

  serviceRequests: PropTypes.array,
  selectedServiceRequestId: PropTypes.string,

  count: PropTypes.number,
  limit: PropTypes.number,
  query: PropTypes.object,
  sort: PropTypes.string,


  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideAuthoredOn: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideIntent: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideSubjectName: PropTypes.bool,
  hidePerformerName: PropTypes.bool,
  hidePerformerReference: PropTypes.bool,
  hideRequestorName: PropTypes.bool,
  hideRequestorReference: PropTypes.bool,
  hideCodeDisplay: PropTypes.bool,


  hideOrderDetail: PropTypes.bool,
  hideText: PropTypes.bool,
  hideDoNotPerform: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  cancelButtonType: PropTypes.string,
  cancelColor: PropTypes.string,

  onToggle: PropTypes.func,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onRevoke: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,

  sourceReference: PropTypes.bool,
  selectedDocumentSource: PropTypes.string,
  onPatientClick: PropTypes.func,
  disablePagination: PropTypes.bool,

  tableRowSize: PropTypes.string,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  dateFormat: PropTypes.string,

  showMinutes: PropTypes.bool,
  noDataMessage: PropTypes.bool,
  noDataMessagePadding: PropTypes.number,

  labels: PropTypes.object,

  selectedPatientId: PropTypes.string
};
ServiceRequestsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  selectedServiceRequestId: '',

  hideCheckbox: true,
  hideActionIcons: true,
  hideStatus: false,
  hideSubjectName: false,
  hideSubjectReference: true,
  hidePerformerName: false,
  hidePerformerReference: true,
  hideRequestorName: false,
  hideRequestorReference: true,
  hideBarcode: true,
  hideRequestorReference: false,
  hideText: true,
  hideOrderDetail: true,
  hideIntent: false,
  hideDoNotPerform: true,
  hideCodeDisplay: false,

  disablePagination: false,
  selectedListId: '',

  serviceRequests: [],
  query: {},
  selectedPatientId: '',
  sort: '',
  cancelButtonType: 'text',
  cancelColor: '',

  noDataMessage: true,
  noDataMessagePadding: 100
}

export default ServiceRequestsTable;

