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

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING



//===========================================================================
// MAIN COMPONENT

function TasksTable(props){
  logger.info('Rendering the TasksTable');

  let { 
    id,
    children, 

    data,
    tasks,
    selectedTaskId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hidePatientName,
    hidePatientReference,
    hideOwnerName,
    hideOwnerReference,
    hideStatus,
    hidePriority,
    hideIntent,
    hideDescription,
    hideBusinessStatus,
    hideLastModified,
    hideAuthoredOn,
    hideBarcode,
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

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideOwnerName = true;
        hideOwnerReference = true;
        hideStatus = false;
        hidePriority = true;
        hideIntent = true;
        hideDescription = false;
        hideBusinessStatus = true;
        hideLastModified = true;
        hideAuthoredOn = true;
        hideBarcode = true;  
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = false;
        hidePatientReference = true;
        hideOwnerName = false;
        hideOwnerReference = true;
        hideStatus = false;
        hidePriority = false;
        hideIntent = true;
        hideDescription = false;
        hideBusinessStatus = true;
        hideLastModified = false;
        hideAuthoredOn = true;
        hideBarcode = false;   
        multiline = false;
        hideTextIcon = false
        break;
      case "web":
        hideStatus = false;
        hidePriority = false;
        hideDescription = false;
        hidePatientName = false;
        hideOwnerName = false;
        hideBusinessStatus = true;
        hideLastModified = true;
        hideAuthoredOn = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hideStatus = false;
        hidePatientName = false;
        hideOwnerName = false;
        hidePriority = false;
        hideDescription = false;
        hideBusinessStatus = true;
        hideLastModified = false;
        hideAuthoredOn = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideStatus = false;
        hidePriority = false;
        hideDescription = false;
        hideBusinessStatus = false;
        hideLastModified = false;
        hideAuthoredOn = false;
        hideBarcode = false;
        multiline = false;
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
            defaultChecked={defaultCheckboxValue}
            onChange={ handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderTextIconHeader(){
    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon'>Text</TableCell>
      );
    }
  }
  function renderTextIcon(textDiv ){

    let textIcon = "None";
    if((typeof textDiv === "string" && (textDiv.length > 0))){
      textIcon = "Text"
    }

    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon' style={{minWidth: '140px'}}>{ textIcon }</TableCell>
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
  function renderOwnerNameHeader(){
    if (!hideOwnerName) {
      return (
        <TableCell className='ownerDisplay'>Owner</TableCell>
      );
    }
  }
  function renderOwnerName(ownerDisplay ){
    if (!hideOwnerName) {
      return (
        <TableCell className='ownerDisplay' style={{minWidth: '140px'}}>{ ownerDisplay }</TableCell>
      );
    }
  }
  function renderOwnerReferenceHeader(){
    if (!hideOwnerReference) {
      return (
        <TableCell className='ownerReference'>Owner Reference</TableCell>
      );
    }
  }
  function renderOwnerReference(ownerReference ){
    if (!hideOwnerReference) {
      return (
        <TableCell className='ownerReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(ownerReference) }
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
  function renderPriority(priority){
    if (!hidePriority) {
      return (
        <TableCell className='priority' style={{width: '100px'}}>{ priority }</TableCell>
      );
    }
  }
  function renderPriorityHeader(){
    if (!hidePriority) {
      return (
        <TableCell className='priority' style={{width: '100px'}}>{get(labels, 'priority', 'Priority')}</TableCell>
      );
    }
  }
  function renderIntent(intent){
    if (!hideIntent) {
      return (
        <TableCell className='intent' style={{width: '120px'}}>{ intent }</TableCell>
      );
    }
  }
  function renderIntentHeader(){
    if (!hideIntent) {
      return (
        <TableCell className='intent' style={{width: '120px'}}>{get(labels, 'intent', 'Intent')}</TableCell>
      );
    }
  }
  function renderDescription(description){
    if (!hideDescription) {
      if(multiline){
        return (<TableCell className='description'>
          <span style={{fontWeight: 400}}>{description }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='description' style={{whiteSpace: 'nowrap'}} >{ description }</TableCell>
        );  
      }
    }
  }
  function renderDescriptionHeader(){
    if (!hideDescription) {
      return (
        <TableCell className='description'>{get(labels, 'description', 'Description')}</TableCell>
      );
    }
  }
  function renderBusinessStatus(businessStatus){
    if (!hideBusinessStatus) {
      return (
        <TableCell className='businessStatus' >{ businessStatus }</TableCell>
      );
    }
  }
  function renderBusinessStatusHeader(){
    if (!hideBusinessStatus) {
      return (
        <TableCell className='businessStatus' >Business Status</TableCell>
      );
    }
  }
  function renderLastModifiedHeader(){
    if (!hideLastModified) {
      return (
        <TableCell className='lastModified' style={{minWidth: '140px'}}>Last Modified</TableCell>
      );
    }
  }
  function renderLastModified(lastModified ){
    if (!hideLastModified) {
      return (
        <TableCell className='lastModified' style={{minWidth: '140px'}}>{ moment(lastModified).format('YYYY-MM-DD') }</TableCell>
      );
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( task ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, task)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, task._id)} /> */}
        </TableCell>
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
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(taskId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, taskId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    if(onRowClick){
      onRowClick(id);
    }
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
  let tasksToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(tasks){
    if(tasks.length > 0){     
      let count = 0;    

      tasks.forEach(function(task){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          tasksToRender.push(FhirDehydrator.dehydrateTask(task, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(tasksToRender.length === 0){
    logger.trace('TasksTable: No tasks to render.');
  } else {
    for (var i = 0; i < tasksToRender.length; i++) {
      let selected = false;
      if(tasksToRender[i].id === selectedTaskId){
        selected = true;
      }
      if(get(tasksToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('tasksToRender[i]', tasksToRender[i])

      if(get(tasksToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="taskRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, tasksToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(tasksToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="taskRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, tasksToRender[i]._id)} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(tasksToRender[i]) }
            { renderTextIcon(get(tasksToRender[i], "text.div", "")) }
            { renderIdentifier(get(tasksToRender[i], "identifier", "")) }
            { renderPatientName(get(tasksToRender[i], "patientDisplay", "")) } 
            { renderPatientReference(get(tasksToRender[i], "patientReference", "")) }           
            { renderOwnerName(get(tasksToRender[i], "ownerDisplay", "")) } 
            { renderOwnerReference(get(tasksToRender[i], "ownerReference", "")) }
            { renderStatus(get(tasksToRender[i], "status", ""))}
            { renderPriority(get(tasksToRender[i], "priority", ""))}
            { renderIntent(get(tasksToRender[i], "intent", ""))}
            { renderDescription(get(tasksToRender[i], "description", ""))}
            { renderBusinessStatus(get(tasksToRender[i], "businessStatus.text", "")) } 
            { renderLastModified(get(tasksToRender[i], "lastModified", "")) }
            { renderAuthoredOn(get(tasksToRender[i], "authoredOn", "")) }
            { renderBarcode(get(tasksToRender[i], "_id", ""))}
            { renderActionButton(get(tasksToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='tasksTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
            { renderOwnerNameHeader() }
            { renderOwnerReferenceHeader() }
            { renderStatusHeader() }
            { renderPriorityHeader() }
            { renderIntentHeader() }
            { renderDescriptionHeader() }          
            { renderBusinessStatusHeader() }
            { renderLastModifiedHeader() }
            { renderAuthoredOnHeader() }
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


TasksTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  tasks: PropTypes.array,
  selectedTaskId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideOwnerName: PropTypes.bool,
  hideOwnerReference: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePriority: PropTypes.bool,
  hideIntent: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideBusinessStatus: PropTypes.bool,
  hideLastModified: PropTypes.bool,
  hideAuthoredOn: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,

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

  labels: PropTypes.object
};

TasksTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hidePatientName: false,
  hidePatientReference: true,
  hideOwnerName: false,
  hideOwnerReference: true,
  hideStatus: false,
  hidePriority: false,
  hideIntent: true,
  hideDescription: false,
  hideBusinessStatus: true,
  hideLastModified: true,
  hideAuthoredOn: false,
  hideTextIcon: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  tasks: [],
  labels: {
    checkbox: "Checkbox",
    description: "Description",
    priority: "Priority",
    intent: "Intent"
  },
  defaultCheckboxValue: false
}

export default TasksTable;