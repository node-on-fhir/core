// /imports/ui-fhir/measures/MeasuresTable.jsx

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
import { FhirDehydrator, flattenMeasure } from '../../lib/FhirDehydrator';

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

function MeasuresTable(props){
  logger.info('Rendering the MeasuresTable');
  
  let { 
    children, 
    id,

    data,
    measures,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideVersion,
    hideName,
    hideTitle,
    hideStatus,
    hideDescription,
    hidePurpose,
    hideEffectivePeriod,
    hideLastReviewDate,
    hideAuthorDisplay,
    hideAuthorReference,
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

    order,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  // Store original prop values
  const hideAuthorDisplayFromProp = hideAuthorDisplay;
  const hideAuthorReferenceFromProp = hideAuthorReference;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideBarcode = true;
        hideIdentifier = true;
        hideVersion = true;
        hideDescription = true;
        hidePurpose = true;
        hideEffectivePeriod = true;
        hideLastReviewDate = true;
        hideAuthorDisplay = true;
        hideAuthorReference = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideBarcode = true;
        hideVersion = true;
        hidePurpose = true;
        hideLastReviewDate = true;
        hideAuthorReference = true;
        break;
      case "web":
        hideAuthorDisplay = (hideAuthorDisplayFromProp !== undefined) ? hideAuthorDisplayFromProp : false;
        hideAuthorReference = (hideAuthorReferenceFromProp !== undefined) ? hideAuthorReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideAuthorDisplay = (hideAuthorDisplayFromProp !== undefined) ? hideAuthorDisplayFromProp : false;
        hideAuthorReference = (hideAuthorReferenceFromProp !== undefined) ? hideAuthorReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideCheckbox = true;
        hideActionIcons = true;
        hideAuthorDisplay = (hideAuthorDisplayFromProp !== undefined) ? hideAuthorDisplayFromProp : false;
        hideAuthorReference = (hideAuthorReferenceFromProp !== undefined) ? hideAuthorReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Render Methods

  function renderRowsPerPageOptions(){
    let options = [];
    if(count > 10){
      options.push(10);
    }
    if(count > 25){
      options.push(25);
    }
    if(count > 50){
      options.push(50);
    }
    if(count > 100){
      options.push(100);
    }
    
    return options;
  }

  // ------------------------------------------------------------------------
  // Table Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Checkbox</TableCell>
      );
    }
  }
  function renderCheckbox(measureId){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle">
          <Checkbox
            defaultChecked={false}
            onChange={() => {
              console.log('Toggling measure', measureId);
            }}
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
  function renderActionIcons(measure ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>
          {/* Add action buttons here if needed */}
        </TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
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

  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{identifier}</TableCell>
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

  function renderVersion(version){
    if (!hideVersion) {
      return (
        <TableCell className='version'>{version}</TableCell>
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

  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name'>{name}</TableCell>
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

  function renderTitle(title){
    if (!hideTitle) {
      return (
        <TableCell className='title'>{title}</TableCell>
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

  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{status}</TableCell>
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

  function renderDescription(description){
    if (!hideDescription) {
      return (
        <TableCell className='description'>{description}</TableCell>
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

  function renderPurpose(purpose){
    if (!hidePurpose) {
      return (
        <TableCell className='purpose'>{purpose}</TableCell>
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

  function renderEffectivePeriod(effectivePeriod){
    if (!hideEffectivePeriod) {
      return (
        <TableCell className='effectivePeriod'>{effectivePeriod}</TableCell>
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

  function renderLastReviewDate(lastReviewDate){
    if (!hideLastReviewDate) {
      return (
        <TableCell className='lastReviewDate'>{lastReviewDate}</TableCell>
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

  function renderAuthorDisplay(authorDisplay){
    if (!hideAuthorDisplay) {
      return (
        <TableCell className='authorDisplay'>{authorDisplay}</TableCell>
      );
    }
  }
  function renderAuthorDisplayHeader(){
    if (!hideAuthorDisplay) {
      return (
        <TableCell className='authorDisplay'>Author</TableCell>
      );
    }
  }

  function renderAuthorReference(authorReference){
    if (!hideAuthorReference) {
      return (
        <TableCell className='authorReference'>{authorReference}</TableCell>
      );
    }
  }
  function renderAuthorReferenceHeader(){
    if (!hideAuthorReference) {
      return (
        <TableCell className='authorReference'>Author Reference</TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering

  
  let tableRows = [];
  let measuresToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(measures){
    if(measures.length > 0){              
      // Sort by selected order
      if(order && order.toLowerCase() === 'ascending'){
        measures = measures.sort((a, b) => {
          if (a._id < b._id) { return -1; }
          if (a._id > b._id) { return 1; }
          return 0;
        });
      } else {
        measures = measures.sort((a, b) => {
          if (a._id > b._id) { return -1; }
          if (a._id < b._id) { return 1; }
          return 0;
        });
      }

      let rows = [];
      measures.forEach(function(measure){
        if((measure.resourceType === "Measure") && (measure.status !== "entered-in-error")){
          measuresToRender.push(flattenMeasure(measure, internalDateFormat));
        }
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer'
  }

  if(measuresToRender.length === 0){
    logger.trace('MeasuresTable: No measures to render.');
  } else {
    for (let i = 0; i < measuresToRender.length; i++) {
      let currentMeasure = measuresToRender[i];
      const measureId = currentMeasure._id;

      if(currentMeasure && measureId){
        tableRows.push(
          <TableRow className="measureRow" key={i} style={rowStyle} onClick={() => handleRowClick(measureId)} hover={true} >            
            { renderCheckbox(measureId) }
            { renderActionIcons(currentMeasure) }
            { renderBarcode(measureId) }
            { renderIdentifier(get(currentMeasure, 'identifier')) }
            { renderVersion(get(currentMeasure, 'version')) }
            { renderName(get(currentMeasure, 'name')) }
            { renderTitle(get(currentMeasure, 'title')) }
            { renderStatus(get(currentMeasure, 'status')) }
            { renderDescription(get(currentMeasure, 'description')) }
            { renderPurpose(get(currentMeasure, 'purpose')) }
            { renderEffectivePeriod(get(currentMeasure, 'effectivePeriod')) }
            { renderLastReviewDate(get(currentMeasure, 'lastReviewDate')) }
            { renderAuthorDisplay(get(currentMeasure, 'authorDisplay')) }
            { renderAuthorReference(get(currentMeasure, 'authorReference')) }
          </TableRow>
        );
      } else {
        logger.warn('MeasuresTable: Missing data for row ' + i);
        logger.debug('MeasuresTable: currentMeasure', currentMeasure);
      }
    }
  }

  // ------------------------------------------------------------------------
  // Handlers

  function handleRowClick(id){
    if(onRowClick){
      onRowClick(id);
    }
  }

  function handlePageChange(event, newPage){
    if(onSetPage){
      onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event){
    const newRowsPerPage = parseInt(event.target.value, 10);
    const newPage = Math.floor((page * rowsPerPage) / newRowsPerPage);
    
    if(onSetPage){
      onSetPage(newPage);
    }
  }

  // ------------------------------------------------------------------------
  // Render Component

  return(
    <div id={id} className="measuresTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderBarcodeHeader() }
            { renderIdentifierHeader() }
            { renderVersionHeader() }
            { renderNameHeader() }
            { renderTitleHeader() }
            { renderStatusHeader() }
            { renderDescriptionHeader() }
            { renderPurposeHeader() }
            { renderEffectivePeriodHeader() }
            { renderLastReviewDateHeader() }
            { renderAuthorDisplayHeader() }
            { renderAuthorReferenceHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { (!disablePagination && (count > 0)) && (
        <TablePagination
          component="div"
          rowsPerPageOptions={renderRowsPerPageOptions()}
          count={count}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleChangeRowsPerPage}
          style={{float: 'right', border: 'none', userSelect: 'none'}}
        />
      )}
    </div>
  );
}

MeasuresTable.propTypes = {
  id: PropTypes.string,

  measures: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideVersion: PropTypes.bool,
  hideName: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hidePurpose: PropTypes.bool,
  hideEffectivePeriod: PropTypes.bool,
  hideLastReviewDate: PropTypes.bool,
  hideAuthorDisplay: PropTypes.bool,
  hideAuthorReference: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onRowClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,

  count: PropTypes.number,
  formFactorLayout: PropTypes.string,
  order: PropTypes.string
};

MeasuresTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: false,
  hideVersion: false,
  hideName: false,
  hideTitle: false,
  hideStatus: false,
  hideDescription: false,
  hidePurpose: true,
  hideEffectivePeriod: true,
  hideLastReviewDate: true,
  hideAuthorDisplay: false,
  hideAuthorReference: true,
  hideBarcode: true,
  rowsPerPage: 10,
  tableRowSize: 'small',
  page: 0,
  order: 'descending'
}

export default MeasuresTable;