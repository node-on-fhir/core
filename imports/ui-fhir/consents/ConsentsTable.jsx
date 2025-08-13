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

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

import { Session } from 'meteor/session';

//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedDocumentSource', '');


//===========================================================================
// MAIN COMPONENT

export function ConsentsTable(props){
  
  let { 
    consents,
    selectedConsentId,

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
    defaultCheckboxValue,

    hideCheckbox,
    hideActionIcons,
    hidePatientName,
    hidePatientReference,
    hideOrganization,
    hideStatus,
    hideDateTime,
    hidePeriodStart,
    hidePeriodEnd,
    hideCategory,
    hideVerify,
    hideRevoke,
    hideBarcode,
    hideScope,
    hideClass,
    hideType,
    hideActorRole,
    hideActorReference,
    hideSource,

    revokeButtonType,
    revokeColor,
    

    onRevoke,
    onRowClick,

    page, 
    onSetPage,

    noDataMessage,
    noDataMessagePadding,

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
    consents: []
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
        options.sort = { dateTime: -1 }
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

  // data.consents = [];

  // function dehydrateConsent(document){
  //     let result = {
  //       _id: document._id,
  //       id: get(document, 'id', ''),
  //       dateTime: moment(get(document, 'dateTime', null)).format("YYYY-MM-DD hh:mm:ss"),
  //       status: get(document, 'status', ''),
  //       patientReference: get(document, 'patient.reference', ''),
  //       patientName: get(document, 'patient.display', ''),
  //       // consentingParty: get(document, 'consentingParty[0].display', ''),
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
    Session.set('consentsUpsert', false);
    Session.set('selectedConsent', id);
    Session.set('consentPageTabIndex', 2);
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
      Session.set('consentsUpsert', false);
      Session.set('selectedConsent', id);
      Session.set('consentPageTabIndex', 2);  
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
  function renderType(provisionType){
    if (!hideType) {
      return (
        <TableCell className='provisionType' style={data.style.cell} >{ provisionType }</TableCell>
      );
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className='type' >Type</TableCell>
      );
    }
  }
  function renderClass(provisionClass){
    if (!hideClass) {
      return (
        <TableCell className='provisionClass' style={data.style.cell} >{ provisionClass }</TableCell>
      );
    }
  }
  function renderClassHeader(){
    if (!hideClass) {
      return (
        <TableCell className='class' >Class</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className='category' style={data.style.cell} >{ category }</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category' >Category</TableCell>
      );
    }
  }
  function renderDate(id, dateTime){
    if (!hideDateTime) {
      return (
        <TableCell className='date' onClick={ rowClick.bind('this', id)} style={{minWidth: '160px', paddingTop: '16px'}}>{ moment(dateTime).format("YYYY-MM-DD") }</TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDateTime) {
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
  function renderSource(sourceReference ){
    if (!hideSource) {
      return (
        <TableCell className='sourceReference' onClick={ getDocumentReference.bind(this, sourceReference) } style={{minWidth: '100px', paddingTop: '16px'}}>{ sourceReference }</TableCell>
      );
    }
  }
  function renderSourceHeader(){
    if (!hideSource) {
      return (
        <TableCell className='sourceReference' style={{minWidth: '100px', marginLeft: '20px'}}> Source </TableCell>
      );
    }
  }
  function renderRevoke(rowId){
    if (!hideRevoke) {
      return (
        <TableCell className='revoke'>
          <Button onClick={handleRevoke.bind(this, rowId)} variant={revokeButtonType}>Revoke</Button>
        </TableCell>
      );
    }
  }
  function renderRevokeHeader(){
    if (!hideRevoke) {
      return (
        <TableCell className='end' style={{minWidth: '100px', marginLeft: '20px'}}> Revoke </TableCell>
      );
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
  function renderOrganizationHeader(){
    if (!hideOrganization) {
      return (
        <TableCell className='organization'>Organization</TableCell>
      );
    }
  }
  function renderOrganization(organization ){
    if (!hideOrganization) {
      return (
        <TableCell className='organization' style={{minWidth: '140px'}}>{ organization }</TableCell>
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
    if (!hideScope) {
      return (
        <TableCell className='scope'>Scope</TableCell>
      );
    }
  }
  function renderScope(scope){
    if (!hideScope) {
      return (
        <TableCell className='scope' style={{minWidth: '140px'}}>{ scope }</TableCell>
      );
    }
  }

  function renderActorRoleHeader(){
    if (!hideActorRole) {
      return (
        <TableCell className='actorRole'>Actor Role</TableCell>
      );
    }
  }
  function renderActorRole(actorRole){
    if (!hideActorRole) {
      return (
        <TableCell className='actorRole' style={{minWidth: '140px'}}>{ actorRole }</TableCell>
      );
    }
  }


  function renderActorReferenceHeader(){
    if (!hideActorReference) {
      return (
        <TableCell className='actorReference'>Actor Reference</TableCell>
      );
    }
  }
  function renderActorReference(actorReference){
    if (!hideActorReference) {
      return (
        <TableCell className='actorReference' style={{minWidth: '140px'}}>{ actorReference }</TableCell>
      );
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
  let consentsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(consents){
    if(consents.length > 0){     
      let count = 0;    

      consents.forEach(function(condition){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          // consentsToRender.push(FhirDehydrator.dehydrateConsent(condition, internalDateFormat));
          consentsToRender.push(FhirDehydrator.dehydrateConsent(condition, internalDateFormat));
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

  if(consentsToRender.length === 0){
    logger.trace('ConsentsTable: No consents to render.');

    // if(noDataMessage){
    //   footer = <TableNoData noDataPadding={ noDataMessagePadding } />
    // }
  } else {
    for (let i = 0; i < consentsToRender.length; i++) {
      const currentConsent = consentsToRender[i];
      const consentId = currentConsent._id;
      
      let selected = false;
      if(currentConsent.id === selectedConsentId){
        selected = true;
      }
      if(get(currentConsent, 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('consentsToRender[i]', currentConsent)
      tableRows.push(
        <TableRow className="consentRow" 
          key={i} 
          style={rowStyle} 
          onClick={() => {
            console.log('ConsentsTable row clicked, _id:', consentId);
            if(typeof onRowClick === 'function'){
              onRowClick(consentId);
            }
          }} 
          hover={true} 
          >            
          {renderSelected(get(currentConsent, '_id'))}
          {renderIdentifier(get(currentConsent, 'identifier', ''))}
          {renderDate(get(currentConsent, '_id'), get(currentConsent, 'dateTime'))}
          {renderPeriodStart(get(currentConsent, '_id'), get(currentConsent, 'start'))}
          {renderPeriodEnd(get(currentConsent, '_id'), get(currentConsent, 'end'))}
          {renderStatus(get(currentConsent, 'status'))}
          {renderPatientName(get(currentConsent, 'patientName')) }
          {renderOrganization(get(currentConsent, 'organization')) }
          {renderType( get(currentConsent, 'provisionType')) }
          {renderClass( get(currentConsent, 'provisionClass')) }
          {renderCategory( get(currentConsent, 'category')) }
          {renderScope( get(currentConsent, 'scope')) }

          {renderActorRole( get(currentConsent, 'actorRole')) }
          {renderActorReference( get(currentConsent, 'actorReference')) }

          {renderSource(get(currentConsent, 'sourceReference')) }
          {renderRevoke(get(currentConsent, '_id'))}

          {renderBarcode(get(currentConsent, 'id', ''))}
        </TableRow>
      );    
    }
  }

  return(
    <div>
      <Table id={props.id || 'consentsTable'} className='consentsTable' size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {renderSelectedHeader() }
            {renderIdentifierHeader() }
            {renderDateHeader() }
            {renderPeriodStartHeader() }
            {renderPeriodEndHeader() }
            {renderStatusHeader() }
            {renderPatientNameHeader() }
            {renderOrganizationHeader() }
            {renderTypeHeader() }
            {renderClassHeader() }
            {renderCategoryHeader() }
            {renderScopeHeader() }
            {renderActorRoleHeader() }
            {renderActorReferenceHeader() }
 
            {renderSourceHeader() }
            {renderRevokeHeader() }

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


ConsentsTable.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,

  consents: PropTypes.array,
  selectedConsentId: PropTypes.string,

  count: PropTypes.number,
  limit: PropTypes.number,
  query: PropTypes.object,
  sort: PropTypes.string,


  defaultCheckboxValue: PropTypes.bool,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hideOrganization: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideScope: PropTypes.bool,
  hideDateTime: PropTypes.bool,
  hidePeriodStart: PropTypes.bool,
  hidePeriodEnd: PropTypes.bool,
  hideType: PropTypes.bool,
  hideClass: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideVerify: PropTypes.bool,
  hideRevoke: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideSource: PropTypes.bool,
  hideActorRole: PropTypes.bool,
  hideActorReference: PropTypes.bool,

  revokeButtonType: PropTypes.string,
  revokeColor: PropTypes.string,

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
ConsentsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  selectedConsentId: '',
  defaultCheckboxValue: false,

  hideCheckbox: true,
  hideActionIcons: true,
  hideStatus: false,
  hideTitle: false,
  hideItemCount: false,
  hidePatientName: false,
  hidePatientReference: false,
  hideBarcode: true,
  hideScope: false,
  hideClass: false,
  hideActorRole: false,
  hideActorReference: true,
  hideType: true,
  hideSource: true,
  hideRevoke: true,
  hidePeriodStart: true,
  hidePeriodEnd: true,

  disablePagination: false,
  selectedListId: '',

  consents: [],
  query: {},
  selectedPatientId: '',
  sort: '',
  revokeButtonType: 'text',
  revokeColor: '',

  noDataMessage: true,
  noDataMessagePadding: 100
}

export default ConsentsTable;

