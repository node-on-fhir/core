// /imports/ui-fhir/tasks/TasksTable.jsx

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
  Typography
} from '@mui/material';

import moment from 'moment';
import { get, has } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';
import { TableNoData } from '../../components/TableNoData';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

// Logger setup
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

export function TasksTable(props){
  logger.info('Rendering the TasksTable');

  let { 
    id,
    
    tasks,
    selectedTaskId,

    rowsPerPage,
    count,
    page,
    onSetPage,
    
    disablePagination,
    showMinutes,
    dateFormat,
    tableRowSize,
    
    formFactorLayout,

    hideCheckbox,
    hideActionIcons,
    hideBarcode,
    hidePatientDisplay,
    hidePatientReference,
    hideOwnerDisplay,
    hideOwnerReference,
    hideRequesterDisplay,
    hideStatus,
    hidePriority,
    hideIntent,
    hideCode,
    hideDescription,
    hideBusinessStatus,
    hideExecutionPeriod,
    hideLastModified,
    hideAuthoredOn,
    hideActionButton,
    
    actionButtonLabel,
    
    onRowClick,
    onActionButtonClick,
    onToggle,

    defaultCheckboxValue,

    ...otherProps 
  } = props;

  // Store original prop values
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  // Form Factor adjustments
  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideBarcode = true;
        hidePatientDisplay = true;
        hidePatientReference = true;
        hideOwnerDisplay = true;
        hideOwnerReference = true;
        hideRequesterDisplay = false;
        hideStatus = false;
        hidePriority = true;
        hideIntent = true;
        hideCode = true;
        hideDescription = false;
        hideBusinessStatus = true;
        hideExecutionPeriod = true;
        hideLastModified = true;
        hideAuthoredOn = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideBarcode = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hideOwnerDisplay = false;
        hideOwnerReference = true;
        hideRequesterDisplay = false;
        hideStatus = false;
        hidePriority = false;
        hideIntent = true;
        hideCode = false;
        hideDescription = false;
        hideBusinessStatus = true;
        hideExecutionPeriod = false;
        hideLastModified = false;
        hideAuthoredOn = true;
        break;
      case "web":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideActionIcons = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideOwnerDisplay = false;
        hideOwnerReference = true;
        hideRequesterDisplay = false;
        hideStatus = false;
        hidePriority = false;
        hideIntent = true;
        hideCode = false;
        hideDescription = false;
        hideBusinessStatus = true;
        hideExecutionPeriod = false;
        hideLastModified = true;
        hideAuthoredOn = false;
        break;
      case "desktop":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideActionIcons = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideOwnerDisplay = false;
        hideOwnerReference = false;
        hideRequesterDisplay = false;
        hideStatus = false;
        hidePriority = false;
        hideIntent = false;
        hideCode = false;
        hideDescription = false;
        hideBusinessStatus = false;
        hideExecutionPeriod = false;
        hideLastModified = false;
        hideAuthoredOn = false;
        break;
      case "hdmi":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideActionIcons = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideOwnerDisplay = false;
        hideOwnerReference = false;
        hideRequesterDisplay = false;
        hideStatus = false;
        hidePriority = false;
        hideIntent = false;
        hideCode = false;
        hideDescription = false;
        hideBusinessStatus = false;
        hideExecutionPeriod = false;
        hideLastModified = false;
        hideAuthoredOn = false;
        break;            
    }
  }

  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  const [pageState, setPageState] = useState(page || 0);
  const [rowsPerPageState, setRowsPerPage] = useState(rowsPerPage || 5);

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else {
    paginationCount = rows.length;
  }

  function handleChangePage(event, newPage){
    setPageState(newPage);
    if(onSetPage){
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
      rowsPerPage={rowsPerPageState}
      page={pageState}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
    />
  }

  function handleChangeRowsPerPage(event){
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageState(0);
    if(onSetPage){
      onSetPage(0);
    }
  }

  //---------------------------------------------------------------------
  // Helper Functions

  function handleToggle(index){
    console.log('Toggling entry ' + index);
    if(props.onToggle){
      props.onToggle(index);
    }
  }

  function handleRowClick(id){
    console.log('TasksTable.handleRowClick', id);
    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    }
  }

  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(id);
    }
  }

  //---------------------------------------------------------------------
  // Column Rendering Functions

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className='toggle' style={{width: '60px'}}>
          <Checkbox 
            onChange={handleToggle} 
            disabled
          />
        </TableCell>
      );
    }
  }
  function renderCheckbox(index){
    if (!hideCheckbox) {
      return (
        <TableCell className='toggle' style={{width: '60px'}}>
          <Checkbox 
            onChange={handleToggle.bind(this, index)} 
            checked={defaultCheckboxValue}
          />
        </TableCell>
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
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='id'>
          <span className="barcode helveticas">{idString}</span>
        </TableCell>
      );
    }
  }

  function renderPatientDisplayHeader(){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>Patient Name</TableCell>
      );
    }
  }
  function renderPatientDisplay(patientDisplay){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay' style={{minWidth: '140px'}}>
          {patientDisplay }
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
  function renderPatientReference(patientReference){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{minWidth: '140px'}}>
          {patientReference}
        </TableCell>
      );
    }
  }

  function renderRequesterDisplayHeader(){
    if (!hideRequesterDisplay) {
      return (
        <TableCell className='requesterDisplay'>Requester</TableCell>
      );
    }
  }
  function renderRequesterDisplay(requesterDisplay){
    if (!hideRequesterDisplay) {
      return (
        <TableCell className='requesterDisplay' style={{minWidth: '140px'}}>
          {requesterDisplay }
        </TableCell>
      );
    }
  }

  function renderOwnerDisplayHeader(){
    if (!hideOwnerDisplay) {
      return (
        <TableCell className='ownerDisplay'>Owner</TableCell>
      );
    }
  }
  function renderOwnerDisplay(ownerDisplay){
    if (!hideOwnerDisplay) {
      return (
        <TableCell className='ownerDisplay' style={{minWidth: '140px'}}>
          {ownerDisplay }
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
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status'>
          {status}
        </TableCell>
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
  function renderPriority(priority){
    if (!hidePriority) {
      return (
        <TableCell className='priority'>
          {priority}
        </TableCell>
      );
    }
  }

  function renderIntentHeader(){
    if (!hideIntent) {
      return (
        <TableCell className='intent'>Intent</TableCell>
      );
    }
  }
  function renderIntent(intent){
    if (!hideIntent) {
      return (
        <TableCell className='intent'>
          {intent}
        </TableCell>
      );
    }
  }

  function renderCodeHeader(){
    if (!hideCode) {
      return (
        <TableCell className='code'>Code</TableCell>
      );
    }
  }
  function renderCode(code){
    if (!hideCode) {
      return (
        <TableCell className='code'>
          {code}
        </TableCell>
      );
    }
  }

  function renderDescriptionHeader(){
    if (!hideDescription) {
      return (
        <TableCell className='description'>Description</TableCell>
      );
    }
  }
  function renderDescription(description){
    if (!hideDescription) {
      return (
        <TableCell className='description'>
          {description}
        </TableCell>
      );
    }
  }

  function renderBusinessStatusHeader(){
    if (!hideBusinessStatus) {
      return (
        <TableCell className='businessStatus'>Business Status</TableCell>
      );
    }
  }
  function renderBusinessStatus(businessStatus){
    if (!hideBusinessStatus) {
      return (
        <TableCell className='businessStatus'>
          {businessStatus}
        </TableCell>
      );
    }
  }

  function renderExecutionPeriodHeader(){
    if (!hideExecutionPeriod) {
      return (
        <TableCell className='executionPeriod'>Execution Period</TableCell>
      );
    }
  }
  function renderExecutionPeriod(start, end){
    if (!hideExecutionPeriod) {
      let periodDisplay = '';
      if(start){
        periodDisplay = moment(start).format('YYYY-MM-DD');
      }
      if(end){
        periodDisplay += ' to ' + moment(end).format('YYYY-MM-DD');
      }
      return (
        <TableCell className='executionPeriod'>
          {periodDisplay}
        </TableCell>
      );
    }
  }

  function renderAuthoredOnHeader(){
    if (!hideAuthoredOn) {
      return (
        <TableCell className='authoredOn'>Authored On</TableCell>
      );
    }
  }
  function renderAuthoredOn(authoredOn){
    if (!hideAuthoredOn) {
      let authoredOnDisplay = '';
      if(authoredOn){
        authoredOnDisplay = moment(authoredOn).format('YYYY-MM-DD');
        if(showMinutes){
          authoredOnDisplay = moment(authoredOn).format('YYYY-MM-DD hh:mm');
        }
      }
      return (
        <TableCell className='authoredOn'>
          {authoredOnDisplay}
        </TableCell>
      );
    }
  }

  function renderLastModifiedHeader(){
    if (!hideLastModified) {
      return (
        <TableCell className='lastModified'>Last Modified</TableCell>
      );
    }
  }
  function renderLastModified(lastModified){
    if (!hideLastModified) {
      let lastModifiedDisplay = '';
      if(lastModified){
        lastModifiedDisplay = moment(lastModified).format('YYYY-MM-DD');
        if(showMinutes){
          lastModifiedDisplay = moment(lastModified).format('YYYY-MM-DD hh:mm');
        }
      }
      return (
        <TableCell className='lastModified'>
          {lastModifiedDisplay}
        </TableCell>
      );
    }
  }

  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton'>Action</TableCell>
      );
    }
  }
  function renderActionButton(id){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' style={{width: '100px'}}>
          <Button 
            variant="contained"
            color="primary"
            size="small"
            onClick={handleActionButtonClick.bind(this, id)}
          >
            {actionButtonLabel || 'Action'}
          </Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let tasksToRender = [];
  let internalDateFormat = dateFormat || "YYYY-MM-DD";

  if(tasks){
    if(tasks.length > 0){     
      let count = 0;

      tasks.forEach(function(task){
        if((count >= (pageState * rowsPerPageState)) && (count < (pageState + 1) * rowsPerPageState)){
          let flattenedTask = FhirDehydrator.dehydrateTask(task);
          tasksToRender.push(flattenedTask);
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  };

  if(tasksToRender.length === 0){
    logger.trace('TasksTable: No tasks to render');
  } else {
    for (let i = 0; i < tasksToRender.length; i++) {
      const task = tasksToRender[i];
      
      let selected = false;
      if(task._id === selectedTaskId){
        selected = true;
      }
      
      if(get(task, 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      
      tableRows.push(
        <TableRow 
          className="taskRow" 
          key={task._id} 
          onClick={handleRowClick.bind(this, task._id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(i) }
          { renderActionButton(task._id) }
          { renderBarcode(task._id) }
          { renderPatientDisplay(task.patientDisplay) }
          { renderPatientReference(task.patientReference) }
          { renderRequesterDisplay(task.requesterDisplay) }
          { renderOwnerDisplay(task.ownerDisplay) }
          { renderStatus(task.status) }
          { renderPriority(task.priority) }
          { renderIntent(task.intent) }
          { renderCode(task.code) }
          { renderDescription(task.description) }
          { renderBusinessStatus(task.businessStatus) }
          { renderExecutionPeriod(task.executionStart, task.executionEnd) }
          { renderAuthoredOn(task.authoredOn) }
          { renderLastModified(task.lastModified) }
        </TableRow>
      );       
    }
  }

  return(
    <div id={id} className="tableWithPagination">
      <Table id='tasksTable' >
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionButtonHeader() }
            { renderBarcodeHeader() }
            { renderPatientDisplayHeader() }
            { renderPatientReferenceHeader() }
            { renderRequesterDisplayHeader() }
            { renderOwnerDisplayHeader() }
            { renderStatusHeader() }
            { renderPriorityHeader() }
            { renderIntentHeader() }
            { renderCodeHeader() }
            { renderDescriptionHeader() }
            { renderBusinessStatusHeader() }
            { renderExecutionPeriodHeader() }
            { renderAuthoredOnHeader() }
            { renderLastModifiedHeader() }
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

TasksTable.propTypes = {
  tasks: PropTypes.array,
  selectedTaskId: PropTypes.string,
  
  rowsPerPage: PropTypes.number,
  page: PropTypes.number,
  onSetPage: PropTypes.func,
  
  hideCheckbox: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideOwnerDisplay: PropTypes.bool,
  hideOwnerReference: PropTypes.bool,
  hideRequesterDisplay: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideIntent: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideBusinessStatus: PropTypes.bool,
  hideExecutionPeriod: PropTypes.bool,
  hideLastModified: PropTypes.bool,
  hideAuthoredOn: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  
  onRowClick: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onToggle: PropTypes.func,
  
  actionButtonLabel: PropTypes.string,
  defaultCheckboxValue: PropTypes.bool,
  
  count: PropTypes.number,
  disablePagination: PropTypes.bool,
  showMinutes: PropTypes.bool,
  dateFormat: PropTypes.string,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

export default TasksTable;