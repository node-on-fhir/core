// /imports/ui-fhir/nutritionIntakes/NutritionIntakesTable.jsx

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
  Chip,
  Box
} from '@mui/material';

import moment from 'moment';
import { get } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator, flattenNutritionIntake } from '../../lib/FhirDehydrator';

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
// MAIN COMPONENT

function NutritionIntakesTable(props){
  logger.info('Rendering the NutritionIntakesTable');

  let {
    children,
    id,

    data,
    nutritionIntakes,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideIdentifier,
    hideActionIcons,
    hideStatus,
    hideSubjectDisplay,
    hideSubjectReference,
    hideRecordedDate,
    hideConsumedItem,
    hideCode,
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
  // Props Processing

  // Set default date format if not provided
  if (!dateFormat) {
    dateFormat = "YYYY-MM-DD HH:mm";
  }

  // Preserve the original props for form factor override
  const hideSubjectDisplayFromProp = hideSubjectDisplay;
  const hideSubjectReferenceFromProp = hideSubjectReference;
  const hideBarcodeFromProp = hideBarcode;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideStatus = false;
        hideSubjectDisplay = false;
        hideSubjectReference = true;
        hideRecordedDate = false;
        hideConsumedItem = false;
        hideCode = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideStatus = false;
        hideSubjectDisplay = false;
        hideSubjectReference = true;
        hideRecordedDate = false;
        hideConsumedItem = false;
        hideCode = false;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : true;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hideSubjectDisplay = (hideSubjectDisplayFromProp !== undefined) ? hideSubjectDisplayFromProp : false;
        hideSubjectReference = (hideSubjectReferenceFromProp !== undefined) ? hideSubjectReferenceFromProp : true;
        hideRecordedDate = (hideRecordedDate !== undefined) ? hideRecordedDate : false;
        hideConsumedItem = (hideConsumedItem !== undefined) ? hideConsumedItem : false;
        hideCode = (hideCode !== undefined) ? hideCode : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : false;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hideSubjectDisplay = (hideSubjectDisplayFromProp !== undefined) ? hideSubjectDisplayFromProp : false;
        hideSubjectReference = (hideSubjectReferenceFromProp !== undefined) ? hideSubjectReferenceFromProp : false;
        hideRecordedDate = (hideRecordedDate !== undefined) ? hideRecordedDate : false;
        hideConsumedItem = (hideConsumedItem !== undefined) ? hideConsumedItem : false;
        hideCode = (hideCode !== undefined) ? hideCode : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "hdmi":
        hideCheckbox = (hideCheckbox !== undefined) ? hideCheckbox : true;
        hideIdentifier = (hideIdentifier !== undefined) ? hideIdentifier : false;
        hideActionIcons = (hideActionIcons !== undefined) ? hideActionIcons : true;
        hideStatus = (hideStatus !== undefined) ? hideStatus : false;
        hideSubjectDisplay = (hideSubjectDisplayFromProp !== undefined) ? hideSubjectDisplayFromProp : false;
        hideSubjectReference = (hideSubjectReferenceFromProp !== undefined) ? hideSubjectReferenceFromProp : false;
        hideRecordedDate = (hideRecordedDate !== undefined) ? hideRecordedDate : false;
        hideConsumedItem = (hideConsumedItem !== undefined) ? hideConsumedItem : false;
        hideCode = (hideCode !== undefined) ? hideCode : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function removeRecord(_id){
    logger.info('Remove nutritionIntake: ' + _id)
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
    if(typeof onMetaClick === "function"){
      onMetaClick(patient);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{ width: '60px' }} >Checkbox</TableCell>
      );
    }
  }
  function renderCheckbox(nutritionIntake){
    if (!hideCheckbox) {
      const nutritionIntakeId = get(nutritionIntake, '_id');
      return (
        <TableCell className="toggle" style={{ width: '60px' }}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
            onChange={handleRowClick.bind(this, nutritionIntakeId)}
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
  function renderActionIcons(nutritionIntake ){
    if (!hideActionIcons) {
      const nutritionIntakeId = get(nutritionIntake, '_id');
      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
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
  function renderIdentifier(nutritionIntake ){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>
          { get(nutritionIntake, 'identifier') }
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
  function renderStatus(nutritionIntake){
    if (!hideStatus) {
      const status = get(nutritionIntake, 'status', '');
      return (
        <TableCell className='status'>
          <Chip
            label={status}
            size="small"
            color={status === 'completed' ? 'success' : 'default'}
            variant={status === 'completed' ? 'filled' : 'outlined'}
          />
        </TableCell>
      );
    }
  }
  function renderSubjectNameHeader(){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay'>Subject Name</TableCell>
      );
    }
  }
  function renderSubjectName(nutritionIntake){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay'>
          { get(nutritionIntake, 'subjectDisplay', '') }
        </TableCell>
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
  function renderSubjectReference(nutritionIntake){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>
          { get(nutritionIntake, 'subjectReference', '') }
        </TableCell>
      );
    }
  }
  function renderRecordedDateHeader(){
    if (!hideRecordedDate) {
      return (
        <TableCell className='recordedDate'>Recorded Date</TableCell>
      );
    }
  }
  function renderRecordedDate(nutritionIntake){
    if (!hideRecordedDate) {
      const recordedDate = get(nutritionIntake, 'recorded', '');
      return (
        <TableCell className='recordedDate'>
          { recordedDate ? moment(recordedDate).format(dateFormat) : '' }
        </TableCell>
      );
    }
  }
  function renderConsumedItemHeader(){
    if (!hideConsumedItem) {
      return (
        <TableCell className='consumedItem'>Consumed Item</TableCell>
      );
    }
  }
  function renderConsumedItem(nutritionIntake){
    if (!hideConsumedItem) {
      return (
        <TableCell className='consumedItem'>
          { get(nutritionIntake, 'consumedItemDisplay', '') }
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
  function renderCode(nutritionIntake){
    if (!hideCode) {
      return (
        <TableCell className='code'>
          { get(nutritionIntake, 'codeDisplay', '') }
        </TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='id helveticas'><span className="barcode">{idString}</span></TableCell>
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
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(nutritionIntake){
    if (!hideActionButton) {
      const nutritionIntakeId = get(nutritionIntake, '_id');
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, nutritionIntakeId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let nutritionIntakesToRender = [];

  if(nutritionIntakes && Array.isArray(nutritionIntakes)){
    if(nutritionIntakes.length > 0){
      let count = 0;

      nutritionIntakes.forEach(function(nutritionIntake){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          // First, we need to flatten the nutrition intake for easier access in the table
          const flattenedIntake = flattenNutritionIntake(nutritionIntake);
          // Debug log to see flattened data
          if(count === 0) {
            console.log('Flattened nutrition intake:', flattenedIntake);
          }
          nutritionIntakesToRender.push(flattenedIntake);
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '55px'
  }

  if(nutritionIntakesToRender.length === 0){
    logger.trace('NutritionIntakesTable: No nutrition intakes to render.');
  } else {
    for (let i = 0; i < nutritionIntakesToRender.length; i++) {
      const currentNutritionIntake = nutritionIntakesToRender[i];
      const nutritionIntakeId = get(currentNutritionIntake, '_id', '');

      tableRows.push(
        <TableRow
          key={i}
          className="nutritionIntakeRow"
          hover={true}
          style={rowStyle}
          onClick={ handleRowClick.bind(this, nutritionIntakeId)}
        >
          { renderCheckbox(currentNutritionIntake) }
          { renderActionIcons(currentNutritionIntake) }
          { renderIdentifier(currentNutritionIntake) }
          { renderStatus(currentNutritionIntake) }
          { renderSubjectName(currentNutritionIntake) }
          { renderSubjectReference(currentNutritionIntake) }
          { renderRecordedDate(currentNutritionIntake) }
          { renderConsumedItem(currentNutritionIntake) }
          { renderCode(currentNutritionIntake) }
          { renderBarcode(nutritionIntakeId)}
          { renderActionButton(currentNutritionIntake) }
        </TableRow>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Handlers

  function handleRowClick(id){
    logger.trace('NutritionIntakesTable.handleRowClick()', id);
    if(typeof onRowClick === "function"){
      onRowClick(id);
    }
  }

  // ------------------------------------------------------------------------
  // Pagination

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={count}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangePage}
      onRowsPerPageChange={handleChangeRowsPerPage}
      style={{float: 'right', border: 'none'}}
    />
  }

  function handleChangePage(event, newPage){
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event){
    const newRowsPerPage = parseInt(event.target.value, 10);
    if(typeof onSetRowsPerPage === "function"){
      onSetRowsPerPage(newRowsPerPage);
    }
  }

  // ------------------------------------------------------------------------
  // Render Component

  return(
    <div id={id} className="tableWithPagination">
      <Table className='nutritionIntakesTable' size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderSubjectNameHeader() }
            { renderSubjectReferenceHeader() }
            { renderRecordedDateHeader() }
            { renderConsumedItemHeader() }
            { renderCodeHeader() }
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

// ------------------------------------------------------------------------
// Props

NutritionIntakesTable.propTypes = {
  id: PropTypes.string,

  data: PropTypes.array,
  nutritionIntakes: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideSubjectDisplay: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideRecordedDate: PropTypes.bool,
  hideConsumedItem: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionButton: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,

  count: PropTypes.number,
  page: PropTypes.number,
  onSetPage: PropTypes.func,

  defaultCheckboxValue: PropTypes.bool
};

NutritionIntakesTable.defaultProps = {
  nutritionIntakes: [],
  hideCheckbox: true,
  hideIdentifier: true,
  hideActionIcons: true,
  hideStatus: false,
  hideSubjectDisplay: false,
  hideSubjectReference: true,
  hideRecordedDate: false,
  hideConsumedItem: false,
  hideCode: false,
  hideBarcode: true,
  hideActionButton: true,
  rowsPerPage: 10,
  tableRowSize: 'medium',
  dateFormat: 'YYYY-MM-DD',
  page: 0,
  defaultCheckboxValue: false
};

export default NutritionIntakesTable;
