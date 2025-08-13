// /imports/ui-fhir/schedules/SchedulesTable.jsx

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
import { FhirDehydrator, flattenSchedule } from '../../lib/FhirDehydrator';


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

function SchedulesTable(props){
  logger.info('Rendering the SchedulesTable');

  let { 
    id,
    children, 

    data,
    schedules,
    selectedScheduleId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideActive,
    hideServiceCategory,
    hideServiceType,
    hideSpecialty,
    hideActor,
    hideStartDateTime,
    hideEndDateTime,
    hideComment,
    hideNotes,
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
    
    sortOrder,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors
  
  let multiline = false;
  
  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideServiceCategory = true;
        hideServiceType = true;
        hideSpecialty = true;
        hideStartDateTime = true;
        hideEndDateTime = true;
        hideBarcode = true;  
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = false;
        hideServiceCategory = false;
        hideServiceType = true;
        hideSpecialty = true;
        hideStartDateTime = false;
        hideEndDateTime = true;
        hideBarcode = false;   
        multiline = false;
        break;
      case "web":
        hideServiceCategory = false;
        hideServiceType = false;
        hideSpecialty = false;
        hideStartDateTime = false;
        hideEndDateTime = false;
        multiline = false;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = false;
        hideIdentifier = false;
        hideServiceCategory = false;
        hideServiceType = false;
        hideSpecialty = false;
        hideActor = false;
        hideStartDateTime = false;
        hideEndDateTime = false;
        hideComment = false;
        hideNotes = false;
        hideBarcode = false;
        multiline = false;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = false;
        hideIdentifier = false;
        hideServiceCategory = false;
        hideServiceType = false;
        hideSpecialty = false;
        hideActor = false;
        hideStartDateTime = false;
        hideEndDateTime = false;
        hideComment = false;
        hideNotes = false;
        hideBarcode = false;
        multiline = false;
        break;            
    }
  }

  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  const [currentPage, setCurrentPage] = useState(page || 0);
  const [rowsPerPageToRender, setRowsPerPage] = useState(rowsPerPage);

  if(rowsPerPage){
    rows = rowsPerPage;
  } else {
    rows = 5;
  }

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else {
    paginationCount = rows.length;
  }

  function handleChangePage(event, newPage){
    setCurrentPage(newPage);
  }

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      count={paginationCount}
      page={currentPage}
      onPageChange={handleChangePage}
      rowsPerPage={rowsPerPageToRender}
      rowsPerPageOptions={[5, 10, 25, 100]}
      style={{float: 'right', border: 'none'}}
    />
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(schedule ){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* Action buttons could go here */}
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
  function renderActiveHeader(){
    if (!hideActive) {
      return (
        <TableCell className='active'>Active</TableCell>
      );
    }
  }
  function renderActive(active ){
    if (!hideActive) {
      return (
        <TableCell className='active'>{ active ? 'Yes' : 'No' }</TableCell>
      );
    }
  }
  function renderServiceCategoryHeader(){
    if (!hideServiceCategory) {
      return (
        <TableCell className='serviceCategory'>Service Category</TableCell>
      );
    }
  }
  function renderServiceCategory(serviceCategory ){
    if (!hideServiceCategory) {
      return (
        <TableCell className='serviceCategory'>{ serviceCategory }</TableCell>
      );
    }
  }
  function renderServiceTypeHeader(){
    if (!hideServiceType) {
      return (
        <TableCell className='serviceType'>Service Type</TableCell>
      );
    }
  }
  function renderServiceType(serviceType ){
    if (!hideServiceType) {
      return (
        <TableCell className='serviceType'>{ serviceType }</TableCell>
      );
    }
  }
  function renderSpecialtyHeader(){
    if (!hideSpecialty) {
      return (
        <TableCell className='specialty'>Specialty</TableCell>
      );
    }
  }
  function renderSpecialty(specialty ){
    if (!hideSpecialty) {
      return (
        <TableCell className='specialty'>{ specialty }</TableCell>
      );
    }
  }
  function renderActorHeader(){
    if (!hideActor) {
      return (
        <TableCell className='actor'>Actor</TableCell>
      );
    }
  }
  function renderActor(actor ){
    if (!hideActor) {
      return (
        <TableCell className='actor' style={{minWidth: '140px'}}>{ actor }</TableCell>
      );
    }
  }
  function renderStartDateTimeHeader(){
    if (!hideStartDateTime) {
      return (
        <TableCell className='startDateTime' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderStartDateTime(startDateTime ){
    if (!hideStartDateTime) {
      return (
        <TableCell className='startDateTime' style={{minWidth: '140px'}}>{ moment(startDateTime).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderEndDateTimeHeader(){
    if (!hideEndDateTime) {
      return (
        <TableCell className='endDateTime' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderEndDateTime(endDateTime ){
    if (!hideEndDateTime) {
      return (
        <TableCell className='endDateTime' style={{minWidth: '140px'}}>{ moment(endDateTime).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderCommentHeader(){
    if (!hideComment) {
      return (
        <TableCell className='comment'>Comment</TableCell>
      );
    }
  }
  function renderComment(comment ){
    if (!hideComment) {
      return (
        <TableCell className='comment'>{ comment }</TableCell>
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
  function renderNotes(notes ){
    if (!hideNotes) {
      return (
        <TableCell className='notes'>{ notes }</TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className='barcode'>System ID</TableCell>
      );
    }
  }
  function renderBarcode(id ){
    if (!hideBarcode) {
      return (
        <TableCell className='barcode'>{ id }</TableCell>
      );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(id ){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }
  
  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let schedulesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(schedules){
    if(schedules.length > 0){     
      let count = 0;    
      
      // Apply order: if 'descending' or alias 'reverse', reverse the array
      let orderedSchedules = schedules;
      if(sortOrder === 'descending' || sortOrder === 'reverse'){
        orderedSchedules = reverse([...schedules]); // Create a copy and reverse it
      }

      orderedSchedules.forEach(function(schedule){
        if((count >= (currentPage * rowsPerPage)) && (count < (currentPage + 1) * rowsPerPage)){
          schedulesToRender.push(flattenSchedule(schedule, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(schedulesToRender.length === 0){
    logger.trace('SchedulesTable: No schedules to render.');
  } else {
    for (var i = 0; i < schedulesToRender.length; i++) {
      let selected = false;
      if(schedulesToRender[i].id === selectedScheduleId){
        selected = true;
      }
      if(get(schedulesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('schedulesToRender[i]', schedulesToRender[i])

      tableRows.push(
        <TableRow className="scheduleRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, schedulesToRender[i]._id || schedulesToRender[i].id)} hover={true} selected={selected} >            
          { renderCheckbox(i) }
          { renderActionIcons(schedulesToRender[i]) }
          { renderIdentifier(get(schedulesToRender[i], "identifier", "")) }
          { renderActive(get(schedulesToRender[i], "active", false)) } 
          { renderServiceCategory(get(schedulesToRender[i], "serviceCategoryDisplay", "")) }           
          { renderServiceType(get(schedulesToRender[i], "serviceTypeDisplay", "")) } 
          { renderSpecialty(get(schedulesToRender[i], "specialtyDisplay", ""))}
          { renderActor(get(schedulesToRender[i], "actorDisplay", ""))}
          { renderStartDateTime(get(schedulesToRender[i], "planningHorizonStart", ""))}
          { renderEndDateTime(get(schedulesToRender[i], "planningHorizonEnd", "")) }
          { renderComment(get(schedulesToRender[i], "comment", "")) }
          { renderNotes(get(schedulesToRender[i], "notes", "")) }
          { renderBarcode(get(schedulesToRender[i], "_id", ""))}
          { renderActionButton(get(schedulesToRender[i], "_id", "")) }
        </TableRow>
      );   
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPaginationFooter">
      <Table id='schedulesTable' >
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderActiveHeader() }
            { renderServiceCategoryHeader() }
            { renderServiceTypeHeader() }
            { renderSpecialtyHeader() }
            { renderActorHeader() }
            { renderStartDateTimeHeader() }
            { renderEndDateTimeHeader() }
            { renderCommentHeader() }
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
  )
}

SchedulesTable.propTypes = {
  schedules: PropTypes.array,
  selectedScheduleId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActive: PropTypes.bool,
  hideServiceCategory: PropTypes.bool,
  hideServiceType: PropTypes.bool,
  hideSpecialty: PropTypes.bool,
  hideActor: PropTypes.bool,
  hideStartDateTime: PropTypes.bool,
  hideEndDateTime: PropTypes.bool,
  hideComment: PropTypes.bool,
  hideNotes: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  hideActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,

  autoColumns: PropTypes.bool,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,
  count: PropTypes.number,
  sortOrder: PropTypes.string
};
SchedulesTable.defaultProps = {
  schedules: [],
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: false,
  hideActive: false,
  hideServiceCategory: false,
  hideServiceType: false,
  hideSpecialty: false,
  hideActor: false,
  hideStartDateTime: false,
  hideEndDateTime: false,
  hideComment: false,
  hideNotes: false,
  hideBarcode: true,
  autoColumns: true,
  sortOrder: 'descending'
}

export default SchedulesTable;