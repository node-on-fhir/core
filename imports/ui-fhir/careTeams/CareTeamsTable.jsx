import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Button,
  Checkbox, 
  Table, 
  TableRow, 
  TableCell,
  TableBody,
  TableHead,
  TablePagination
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import moment from 'moment';
import { get, set } from 'lodash';

import { browserHistory } from 'react-router';


import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING



//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedTeams', []);

//===========================================================================
// MAIN COMPONENT


function CareTeamsTable(props){
  logger.debug('Rendering the CareTeamsTable');
  
  // logger.data('CareTeamsTable.props', {data: props}, {source: "CareTeamsTable.jsx"});


  let { 
    children, 
    id,

    careTeams,
    selectedCarePlanId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckboxes,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideCategory,
    hideName,
    hideSubject,
    hideEncounter,
    hidePeriodStart,
    hidePeriodEnd,
    hideParticipantCount,
    hideNotesCount,
    hideReasonCode,
    hideReasonDisplay,
    hideReasonReference,
    hideManagingOrganization,
    hideBarcode,

    onRowClick,
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

    page,
    onSetPage,

    count,
    multiline,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);

    switch (formFactorLayout) {
      case "phone":
        hideCheckboxes = true;        
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideCategory = true;
        hideName = false;
        hideSubject = false;
        hideEncounter = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideParticipantCount = false;
        hideNotesCount = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideReasonReference = false;
        hideManagingOrganization = false;    
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckboxes = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideCategory = true;
        hideName = false;
        hideSubject = false;
        hideEncounter = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideParticipantCount = false;
        hideNotesCount = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideReasonReference = false;
        hideManagingOrganization = false;    
        hideBarcode = true;
        break;
      case "web":
        hideCheckboxes = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideCategory = true;
        hideName = false;
        hideSubject = false;
        hideEncounter = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideParticipantCount = false;
        hideNotesCount = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideReasonReference = false;
        hideManagingOrganization = false;    
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckboxes = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideCategory = true;
        hideName = false;
        hideSubject = false;
        hideEncounter = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideParticipantCount = false;
        hideNotesCount = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideReasonReference = false;
        hideManagingOrganization = false;    
        hideBarcode = true;
        break;
      case "videowall":
        hideCheckboxes = false;
        hideActionIcons = false;
        hideIdentifier = false;
        hideStatus = false;
        hideCategory = false;
        hideName = false;
        hideSubject = false;
        hideEncounter = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideParticipantCount = false;
        hideNotesCount = false;
        hideReasonCode = false;
        hideReasonDisplay = false;
        hideReasonReference = false;
        hideManagingOrganization = false;    
        hideBarcode = false;
        break;            
    }
  }




  // //---------------------------------------------------------------------
  // // Pagination

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


  function handleRowClick(_id){
    // console.log('Clicking row ' + _id)
    if(onRowClick){
      onRowClick(_id);
    }
  }

  function removeRecord(_id){
    logger.info('Remove measureReport: ' + _id)
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

  function renderToggleHeader(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            {/* <Checkbox
              defaultChecked={true}
            /> */}
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
  function renderActionIcons(measureReport ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(measureReport)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(measureReport._id)} />   */}
        </TableCell>
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
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='patientDisplay'>Patient</TableCell>
      );
    }
  }
  function renderSubject(subject ){
    if (!hideSubject) {
      return (
        <TableCell className='subject' style={{minWidth: '140px'}}>{ subject }</TableCell>
      );
    }
  }
  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell className='name'>Name</TableCell>
      );
    }
  }
  function renderName(name ){
    if (!hideName) {
      return (
        <TableCell className='name' style={{minWidth: '140px'}}>{ name }</TableCell>
      );
    }
  }

  function renderParticipantCountHeader(){
    if (!hideParticipantCount) {
      return (
        <TableCell className='participantCount'># Participants</TableCell>
      );
    }
  }
  function renderParticipantCount(participantCount ){
    if (!hideParticipantCount) {
      return (
        <TableCell className='participantCount' style={{minWidth: '140px'}}>{ participantCount }</TableCell>
      );
    }
  }

  function renderTitleHeader(){
    if (!hideTitle) {
      return (
        <TableCell className='title'>Title</TableCell>
      );
    }
  }
  function renderTitle(title ){
    if (!hideTitle) {
      return (
        <TableCell className='title' >{ title }</TableCell>
      );
    }
  }
  function renderAuthorHeader(){
    if (!hideAuthor) {
      return (
        <TableCell className='author'>Author</TableCell>
      );
    }
  }
  function renderAuthor(author ){
    if (!hideAuthor) {
      return (
        <TableCell className='author' >{ author }</TableCell>
      );
    }
  }

  function renderPeriodStartHeader(){
    if (!hidePeriodStart) {
      return (
        <TableCell className='started'>Start</TableCell>
      );
    }
  }
  function renderPeriodStart(startDate ){
    if (!hidePeriodStart) {
      return (
        <TableCell className='started'>{ moment(startDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className="category">{category}</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className="category">Category</TableCell>
      );
    }
  }
  function renderActivities(activities){
    if (!hideActivities) {
      return (
        <TableCell className="activities">{activities}</TableCell>
      );
    }
  }
  function renderActivitiesHeader(){
    if (!hideActivities) {
      return (
        <TableCell className="activities">Activities</TableCell>
      );
    }
  }
  function renderGoals(goals){
    if (!hideGoals) {
      return (
        <TableCell className="goals">{goals}</TableCell>
      );
    }
  }
  function renderGoalsHeader(){
    if (!hideGoals) {
      return (
        <TableCell className="goals">Goals</TableCell>
      );
    }
  }
  function renderAddresses(addresses){
    if (!hideAddresses) {
      return (
        <TableCell className="addresses">{addresses}</TableCell>
      );
    }
  }
  function renderAddressesHeader(){
    if (!hideAddresses) {
      return (
        <TableCell className="addresses">Addresses</TableCell>
      );
    }
  }

  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell><span className="status">{status}</span></TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className="status">Status</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className="barcode">System ID</TableCell>
      );
    }
  }


  //---------------------------------------------------------------------
  // Table Rows


  let tableRows = [];
  let careTeamsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(internalDateFormat){
    internalDateFormat = dateFormat;
  }

  if(careTeams){
    if(careTeams.length > 0){              
      let count = 0;  

      careTeams.forEach(function(careTeam){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          careTeamsToRender.push(FhirDehydrator.dehydrateCareTeam(careTeam));
        }
        count++;
      }); 
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }


  if(careTeamsToRender.length === 0){
    logger.trace('CareTeamsTable:  No careTeams to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < careTeamsToRender.length; i++) {
      let selected = false;
      if(careTeamsToRender[i]._id === selectedCarePlanId){
        selected = true;
      }
      if(get(careTeamsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      tableRows.push(
        <TableRow className="careTeamRow" key={i} onClick={ handleRowClick.bind(this, careTeamsToRender[i].id)} hover={true} style={rowStyle} selected={selected} >            
          { renderToggle() }
          { renderActionIcons(careTeamsToRender[i]) }
          { renderCategory( careTeamsToRender[i].category ) } 

          { renderIdentifier(careTeamsToRender[i].identifier)}
          
          { renderSubject( careTeamsToRender[i].subject ) } 
          { renderName( careTeamsToRender[i].name ) } 
          {/* { renderTitle( careTeamsToRender[i].title ) } 
          { renderAuthor( careTeamsToRender[i].author ) } 

          { renderActivities( careTeamsToRender[i].activities ) } 
          { renderGoals( careTeamsToRender[i].goals ) } 
          { renderAddresses( careTeamsToRender[i].addresses ) }  */}

          { renderPeriodStart(careTeamsToRender[i].recorded) }
          { renderStatus(careTeamsToRender[i].status) }
          { renderParticipantCount(careTeamsToRender[i].participantCount) }
          
          { renderBarcode(careTeamsToRender[i]._id)}
        </TableRow>
      );    
    }
  }

  return(
    <div id={id} className="tableWithPagination">
      <Table className='careTeamsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderCategoryHeader() }

            { renderIdentifierHeader() }
            { renderSubjectHeader() }
            { renderNameHeader() }
            {/* { renderTitleHeader() }
            { renderAuthorHeader() }

            { renderActivitiesHeader() }
            { renderGoalsHeader() }
            { renderAddressesHeader() } */}

            { renderPeriodStartHeader() }
            { renderStatusHeader() }           
            { renderParticipantCountHeader() }            
  
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



CareTeamsTable.propTypes = {
  barcodes: PropTypes.bool,
  careTeams: PropTypes.array,
  selectedCarePlanId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,

  hideCheckboxes: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideName: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideEncounter: PropTypes.bool,
  hidePeriodStart: PropTypes.bool,
  hidePeriodEnd: PropTypes.bool,
  hideParticipantCount: PropTypes.bool,
  hideNotesCount: PropTypes.bool,
  hideReasonCode: PropTypes.bool,
  hideReasonDisplay: PropTypes.bool,
  hideReasonReference: PropTypes.bool,
  hideManagingOrganization: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  onSetPage: PropTypes.func,
  
  page: PropTypes.number,
  showActionButton: PropTypes.bool,

  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

CareTeamsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckboxes: true,
  hideActionIcons: true,
  hideIdentifier: false,
  hideStatus: false,
  hideCategory: false,
  hideName: false,
  hideSubject: false,
  hideEncounter: false,
  hidePeriodStart: false,
  hidePeriodEnd: false,
  hideParticipantCount: false,
  hideNotesCount: false,
  hideReasonCode: false,
  hideReasonDisplay: false,
  hideReasonReference: false,
  hideManagingOrganization: false,
  hideBarcode: true,
  careTeams: []
};

export default CareTeamsTable;