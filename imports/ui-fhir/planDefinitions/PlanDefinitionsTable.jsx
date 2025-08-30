// /imports/ui-fhir/planDefinitions/PlanDefinitionsTable.jsx

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
import { FhirDehydrator, flattenPlanDefinition } from '../../lib/FhirDehydrator';

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

function PlanDefinitionsTable(props){
  logger.info('Rendering the PlanDefinitionsTable');
  
  let { 
    children, 
    id,

    data,
    planDefinitions,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideUrl,
    hideVersion,
    hideName,
    hideTitle,
    hideType,
    hideStatus,
    hideDate,
    hidePublisher,
    hideDescription,
    hidePurpose,
    hideUsage,
    hideApprovalDate,
    hideLastReviewDate,
    hideEffectivePeriod,
    hideTopics,
    hideAuthor,
    hideEditor,
    hideReviewer,
    hideEndorser,
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
  const hideUrlFromProp = hideUrl;
  const hideVersionFromProp = hideVersion;
  const hideNameFromProp = hideName;
  const hideTitleFromProp = hideTitle;
  const hideTypeFromProp = hideType;
  const hideStatusFromProp = hideStatus;
  const hideDateFromProp = hideDate;
  const hidePublisherFromProp = hidePublisher;
  const hideDescriptionFromProp = hideDescription;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideUrl = true;
        hideVersion = true;
        hideName = true;
        hideTitle = false;
        hideType = true;
        hideStatus = false;
        hideDate = true;
        hidePublisher = true;
        hideDescription = true;
        hidePurpose = true;
        hideUsage = true;
        hideApprovalDate = true;
        hideLastReviewDate = true;
        hideEffectivePeriod = true;
        hideTopics = true;
        hideAuthor = true;
        hideEditor = true;
        hideReviewer = true;
        hideEndorser = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideUrl = true;
        hideVersion = true;
        hideName = true;
        hideTitle = false;
        hideType = false;
        hideStatus = false;
        hideDate = false;
        hidePublisher = true;
        hideDescription = true;
        hidePurpose = true;
        hideUsage = true;
        hideApprovalDate = true;
        hideLastReviewDate = true;
        hideEffectivePeriod = true;
        hideTopics = true;
        hideAuthor = true;
        hideEditor = true;
        hideReviewer = true;
        hideEndorser = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = true;
        hideActionIcons = true;
        hideUrl = (hideUrlFromProp !== undefined) ? hideUrlFromProp : true;
        hideVersion = (hideVersionFromProp !== undefined) ? hideVersionFromProp : false;
        hideName = (hideNameFromProp !== undefined) ? hideNameFromProp : true;
        hideTitle = (hideTitleFromProp !== undefined) ? hideTitleFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideDate = (hideDateFromProp !== undefined) ? hideDateFromProp : false;
        hidePublisher = (hidePublisherFromProp !== undefined) ? hidePublisherFromProp : false;
        hideDescription = (hideDescriptionFromProp !== undefined) ? hideDescriptionFromProp : true;
        hidePurpose = true;
        hideUsage = true;
        hideApprovalDate = true;
        hideLastReviewDate = true;
        hideEffectivePeriod = true;
        hideTopics = true;
        hideAuthor = true;
        hideEditor = true;
        hideReviewer = true;
        hideEndorser = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideUrl = (hideUrlFromProp !== undefined) ? hideUrlFromProp : false;
        hideVersion = (hideVersionFromProp !== undefined) ? hideVersionFromProp : false;
        hideName = (hideNameFromProp !== undefined) ? hideNameFromProp : false;
        hideTitle = (hideTitleFromProp !== undefined) ? hideTitleFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideDate = (hideDateFromProp !== undefined) ? hideDateFromProp : false;
        hidePublisher = (hidePublisherFromProp !== undefined) ? hidePublisherFromProp : false;
        hideDescription = (hideDescriptionFromProp !== undefined) ? hideDescriptionFromProp : false;
        hidePurpose = true;
        hideUsage = true;
        hideApprovalDate = true;
        hideLastReviewDate = true;
        hideEffectivePeriod = true;
        hideTopics = true;
        hideAuthor = true;
        hideEditor = true;
        hideReviewer = true;
        hideEndorser = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideCheckbox = true;
        hideActionIcons = true;
        hideUrl = false;
        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideType = false;
        hideStatus = false;
        hideDate = false;
        hidePublisher = false;
        hideDescription = false;
        hidePurpose = false;
        hideUsage = false;
        hideApprovalDate = false;
        hideLastReviewDate = false;
        hideEffectivePeriod = false;
        hideTopics = false;
        hideAuthor = false;
        hideEditor = false;
        hideReviewer = false;
        hideEndorser = false;
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
    console.log('PlanDefinitionsTable.rowClick', id);
    if(typeof onRowClick === 'function'){
      onRowClick(id);
    }
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
  function renderActionIcons(planDefinition){
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
  function renderUrlHeader(){
    if (!hideUrl) {
      return (
        <TableCell className='url'>URL</TableCell>
      );
    }
  }
  function renderUrl(url){
    if (!hideUrl) {
      return (
        <TableCell className='url'>{ url }</TableCell>
      );
    }
  } 
  function renderVersionHeader(){
    if (!hideVersion) {
      return (
        <TableCell className='version'>Version</TableCell>
      );
    }
  }
  function renderVersion(version){
    if (!hideVersion) {
      return (
        <TableCell className='version'>{version}</TableCell>
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
  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name'>{name}</TableCell>
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
  function renderTitle(title){
    if (!hideTitle) {
      return (
        <TableCell className='title'>{title}</TableCell>
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
  function renderType(type){
    if (!hideType) {
      return (
        <TableCell className='type'>{type}</TableCell>
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
        <TableCell className='status'>{status}</TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDate) {
      return (
        <TableCell className='date'>Date</TableCell>
      );
    }
  }
  function renderDate(date){
    if (!hideDate) {
      return (
        <TableCell className='date'>{date}</TableCell>
      );
    }
  }
  function renderPublisherHeader(){
    if (!hidePublisher) {
      return (
        <TableCell className='publisher'>Publisher</TableCell>
      );
    }
  }
  function renderPublisher(publisher){
    if (!hidePublisher) {
      return (
        <TableCell className='publisher'>{publisher}</TableCell>
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
        <TableCell className='description'>{description}</TableCell>
      );
    }
  }
  function renderPurposeHeader(){
    if (!hidePurpose) {
      return (
        <TableCell className='purpose'>Purpose</TableCell>
      );
    }
  }
  function renderPurpose(purpose){
    if (!hidePurpose) {
      return (
        <TableCell className='purpose'>{purpose}</TableCell>
      );
    }
  }
  function renderUsageHeader(){
    if (!hideUsage) {
      return (
        <TableCell className='usage'>Usage</TableCell>
      );
    }
  }
  function renderUsage(usage){
    if (!hideUsage) {
      return (
        <TableCell className='usage'>{usage}</TableCell>
      );
    }
  }
  function renderApprovalDateHeader(){
    if (!hideApprovalDate) {
      return (
        <TableCell className='approvalDate'>Approval Date</TableCell>
      );
    }
  }
  function renderApprovalDate(approvalDate){
    if (!hideApprovalDate) {
      return (
        <TableCell className='approvalDate'>{approvalDate}</TableCell>
      );
    }
  }
  function renderLastReviewDateHeader(){
    if (!hideLastReviewDate) {
      return (
        <TableCell className='lastReviewDate'>Last Review</TableCell>
      );
    }
  }
  function renderLastReviewDate(lastReviewDate){
    if (!hideLastReviewDate) {
      return (
        <TableCell className='lastReviewDate'>{lastReviewDate}</TableCell>
      );
    }
  }
  function renderEffectivePeriodHeader(){
    if (!hideEffectivePeriod) {
      return (
        <TableCell className='effectivePeriod'>Effective Period</TableCell>
      );
    }
  }
  function renderEffectivePeriod(effectivePeriod){
    if (!hideEffectivePeriod) {
      return (
        <TableCell className='effectivePeriod'>{effectivePeriod}</TableCell>
      );
    }
  }
  function renderTopicsHeader(){
    if (!hideTopics) {
      return (
        <TableCell className='topics'>Topics</TableCell>
      );
    }
  }
  function renderTopics(topics){
    if (!hideTopics) {
      return (
        <TableCell className='topics'>{topics}</TableCell>
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
  function renderAuthor(author){
    if (!hideAuthor) {
      return (
        <TableCell className='author'>{author}</TableCell>
      );
    }
  }
  function renderEditorHeader(){
    if (!hideEditor) {
      return (
        <TableCell className='editor'>Editor</TableCell>
      );
    }
  }
  function renderEditor(editor){
    if (!hideEditor) {
      return (
        <TableCell className='editor'>{editor}</TableCell>
      );
    }
  }
  function renderReviewerHeader(){
    if (!hideReviewer) {
      return (
        <TableCell className='reviewer'>Reviewer</TableCell>
      );
    }
  }
  function renderReviewer(reviewer){
    if (!hideReviewer) {
      return (
        <TableCell className='reviewer'>{reviewer}</TableCell>
      );
    }
  }
  function renderEndorserHeader(){
    if (!hideEndorser) {
      return (
        <TableCell className='endorser'>Endorser</TableCell>
      );
    }
  }
  function renderEndorser(endorser){
    if (!hideEndorser) {
      return (
        <TableCell className='endorser'>{endorser}</TableCell>
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
  function renderActionButton(planDefinition){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, planDefinition._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let planDefinitionsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.planDefinitions){
    if(props.planDefinitions.length > 0){     
      let count = 0;    

      props.planDefinitions.forEach(function(planDefinition){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          planDefinitionsToRender.push(flattenPlanDefinition(planDefinition, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer'
  }
  if(planDefinitionsToRender.length === 0){
    logger.trace('PlanDefinitionsTable: No plan definitions to render.');
  } else {
    for (let i = 0; i < planDefinitionsToRender.length; i++) {
      const currentPlanDefinition = planDefinitionsToRender[i];
      const planDefinitionId = currentPlanDefinition._id;
      
      if(get(planDefinitionsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      
      tableRows.push(
        <TableRow className="planDefinitionRow" key={i} style={{...rowStyle, cursor: 'pointer'}} onClick={() => handleRowClick(planDefinitionId)} hover={true} >            
          { renderCheckbox() }  
          { renderActionIcons() }
          { renderUrl(get(currentPlanDefinition, 'url')) }
          { renderVersion(get(currentPlanDefinition, 'version')) }
          { renderName(get(currentPlanDefinition, 'name')) }
          { renderTitle(get(currentPlanDefinition, 'title')) }
          { renderType(get(currentPlanDefinition, 'type')) }
          { renderStatus(get(currentPlanDefinition, 'status')) }
          { renderDate(get(currentPlanDefinition, 'date')) }
          { renderPublisher(get(currentPlanDefinition, 'publisher')) }
          { renderDescription(get(currentPlanDefinition, 'description')) }
          { renderPurpose(get(currentPlanDefinition, 'purpose')) }
          { renderUsage(get(currentPlanDefinition, 'usage')) }
          { renderApprovalDate(get(currentPlanDefinition, 'approvalDate')) }
          { renderLastReviewDate(get(currentPlanDefinition, 'lastReviewDate')) }
          { renderEffectivePeriod(get(currentPlanDefinition, 'effectivePeriod')) }
          { renderTopics(get(currentPlanDefinition, 'topics')) }
          { renderAuthor(get(currentPlanDefinition, 'author')) }
          { renderEditor(get(currentPlanDefinition, 'editor')) }
          { renderReviewer(get(currentPlanDefinition, 'reviewer')) }
          { renderEndorser(get(currentPlanDefinition, 'endorser')) }
          { renderBarcode(currentPlanDefinition._id)}
          { renderActionButton(currentPlanDefinition) }
        </TableRow>
      );    
    }
  }


  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table className='planDefinitionsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }  
            { renderActionIconsHeader() }
            { renderUrlHeader() }
            { renderVersionHeader() }
            { renderNameHeader() }
            { renderTitleHeader() }
            { renderTypeHeader() }
            { renderStatusHeader() }
            { renderDateHeader() }
            { renderPublisherHeader() }
            { renderDescriptionHeader() }
            { renderPurposeHeader() }
            { renderUsageHeader() }
            { renderApprovalDateHeader() }
            { renderLastReviewDateHeader() }
            { renderEffectivePeriodHeader() }
            { renderTopicsHeader() }
            { renderAuthorHeader() }
            { renderEditorHeader() }
            { renderReviewerHeader() }
            { renderEndorserHeader() }
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




PlanDefinitionsTable.propTypes = {
  id: PropTypes.string,

  data: PropTypes.array,
  planDefinitions: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideUrl: PropTypes.bool,
  hideVersion: PropTypes.bool,
  hideName: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideType: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideDate: PropTypes.bool,
  hidePublisher: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hidePurpose: PropTypes.bool,
  hideUsage: PropTypes.bool,
  hideApprovalDate: PropTypes.bool,
  hideLastReviewDate: PropTypes.bool,
  hideEffectivePeriod: PropTypes.bool,
  hideTopics: PropTypes.bool,
  hideAuthor: PropTypes.bool,
  hideEditor: PropTypes.bool,
  hideReviewer: PropTypes.bool,
  hideEndorser: PropTypes.bool,
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

PlanDefinitionsTable.defaultProps = {
  rowsPerPage: 5,
  tableRowSize: 'medium',
  page: 0,
  hideCheckbox: true,
  hideActionIcons: true,
  hideBarcode: true,
  hideUrl: true,
  hideName: true,
  hidePurpose: true,
  hideUsage: true,
  hideApprovalDate: true,
  hideLastReviewDate: true,
  hideEffectivePeriod: true,
  hideTopics: true,
  hideAuthor: true,
  hideEditor: true,
  hideReviewer: true,
  hideEndorser: true,
  planDefinitions: []
}

export default PlanDefinitionsTable;