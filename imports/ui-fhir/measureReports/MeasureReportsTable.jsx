// /imports/ui-fhir/measureReports/MeasureReportsTable.jsx

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
import { FhirDehydrator, flattenMeasureReport } from '../../lib/FhirDehydrator';

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

function MeasureReportsTable(props){
  logger.info('Rendering the MeasureReportsTable');
  
  let { 
    children, 
    id,

    data,
    measureReports,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideType,
    hideSubject,
    hideMeasure,
    hideDate,
    hideReporter,
    hidePeriod,
    hideGroup,
    hideScore,
    hidePopulation,
    hideImprovementNotation,
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
    page = 0,
    onSetPage,

    order,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  // Store original prop values to preserve user preferences
  const hideIdentifierFromProp = hideIdentifier;
  const hideStatusFromProp = hideStatus;
  const hideTypeFromProp = hideType;
  const hideSubjectFromProp = hideSubject;
  const hideMeasureFromProp = hideMeasure;
  const hideDateFromProp = hideDate;
  const hideReporterFromProp = hideReporter;
  const hidePeriodFromProp = hidePeriod;
  const hideGroupFromProp = hideGroup;
  const hideScoreFromProp = hideScore;
  const hidePopulationFromProp = hidePopulation;
  const hideImprovementNotationFromProp = hideImprovementNotation;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideIdentifier = true;
        hideType = true;
        hideReporter = true;
        hidePeriod = true;
        hideGroup = true;
        hideScore = true;
        hidePopulation = true;
        hideImprovementNotation = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideIdentifier = true;
        hideReporter = true;
        hideGroup = true;
        hidePopulation = true;
        hideImprovementNotation = true;
        hideBarcode = true;
        break;
      case "web":
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideSubject = (hideSubjectFromProp !== undefined) ? hideSubjectFromProp : false;
        hideMeasure = (hideMeasureFromProp !== undefined) ? hideMeasureFromProp : false;
        hideDate = (hideDateFromProp !== undefined) ? hideDateFromProp : false;
        hideReporter = (hideReporterFromProp !== undefined) ? hideReporterFromProp : true;
        hidePeriod = (hidePeriodFromProp !== undefined) ? hidePeriodFromProp : false;
        hideGroup = (hideGroupFromProp !== undefined) ? hideGroupFromProp : true;
        hideScore = (hideScoreFromProp !== undefined) ? hideScoreFromProp : false;
        hidePopulation = (hidePopulationFromProp !== undefined) ? hidePopulationFromProp : true;
        hideImprovementNotation = (hideImprovementNotationFromProp !== undefined) ? hideImprovementNotationFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "hdmi":
        hideCheckbox = true;
        hideActionButton = true;
        hideIdentifier = false;
        hideStatus = false;
        hideType = false;
        hideSubject = false;
        hideMeasure = false;
        hideDate = false;
        hideReporter = true;
        hidePeriod = false;
        hideGroup = true;
        hideScore = false;
        hidePopulation = true;
        hideImprovementNotation = true;
        hideBarcode = true;
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Pagination

  let rows = [];

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else if(Array.isArray(measureReports)){
    paginationCount = measureReports.length;
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function rowClick(id){
    logger.info('MeasureReportsTable.rowClick()', id);
    if(typeof onRowClick === "function"){
      onRowClick(id);
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
  function renderCheckbox(){
    if (!hideCheckbox) {
      return (
        <TableCell className="checkbox">
          <Checkbox
            defaultChecked={true}
          />
        </TableCell>
      );
    }
  }
  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className='checkbox' style={{width: '60px'}} >Selected</TableCell>
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
  function renderType(type){
    if (!hideType) {
      return (
        <TableCell className='type'>{ type }</TableCell>
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
  function renderSubject(subject){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{ subject }</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>Subject</TableCell>
      );
    }
  }
  function renderMeasure(measure){
    if (!hideMeasure) {
      return (
        <TableCell className='measure'>{ measure }</TableCell>
      );
    }
  }
  function renderMeasureHeader(){
    if (!hideMeasure) {
      return (
        <TableCell className='measure'>Measure</TableCell>
      );
    }
  }
  function renderDate(date){
    if (!hideDate) {
      let dateValue = '';
      if(date){
        if(showMinutes){
          dateValue = moment(date).format("YYYY-MM-DD hh:mm");
        } else {
          dateValue = moment(date).format("YYYY-MM-DD");
        }
      }
      return (
        <TableCell className='date'>{ dateValue }</TableCell>
      );
    }
  }
  function renderDateHeader(){
    if (!hideDate) {
      return (
        <TableCell className='date' style={{minWidth: '100px'}}>Date</TableCell>
      );
    }
  }
  function renderReporter(reporter){
    if (!hideReporter) {
      return (
        <TableCell className='reporter'>{ reporter }</TableCell>
      );
    }
  }
  function renderReporterHeader(){
    if (!hideReporter) {
      return (
        <TableCell className='reporter'>Reporter</TableCell>
      );
    }
  }
  function renderPeriod(period){
    if (!hidePeriod) {
      return (
        <TableCell className='period'>{ period }</TableCell>
      );
    }
  }
  function renderPeriodHeader(){
    if (!hidePeriod) {
      return (
        <TableCell className='period'>Period</TableCell>
      );
    }
  }
  function renderGroup(group){
    if (!hideGroup) {
      return (
        <TableCell className='group'>{ group }</TableCell>
      );
    }
  }
  function renderGroupHeader(){
    if (!hideGroup) {
      return (
        <TableCell className='group'>Group</TableCell>
      );
    }
  }
  function renderScore(score){
    if (!hideScore) {
      return (
        <TableCell className='score'>{ score }</TableCell>
      );
    }
  }
  function renderScoreHeader(){
    if (!hideScore) {
      return (
        <TableCell className='score'>Score</TableCell>
      );
    }
  }
  function renderPopulation(population){
    if (!hidePopulation) {
      return (
        <TableCell className='population'>{ population }</TableCell>
      );
    }
  }
  function renderPopulationHeader(){
    if (!hidePopulation) {
      return (
        <TableCell className='population'>Population</TableCell>
      );
    }
  }
  function renderImprovementNotation(notation){
    if (!hideImprovementNotation) {
      return (
        <TableCell className='improvementNotation'>{ notation }</TableCell>
      );
    }
  }
  function renderImprovementNotationHeader(){
    if (!hideImprovementNotation) {
      return (
        <TableCell className='improvementNotation'>Improvement</TableCell>
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
  function renderActionButton(measureReport){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, measureReport[i]._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let measureReportsToRender = [];
  if(Array.isArray(measureReports)){
    logger.debug('MeasureReportsTable: Processing', measureReports.length, 'measure reports');
    logger.debug('MeasureReportsTable: page =', page, ', rowsPerPage =', rowsPerPage);
    
    if(measureReports.length > 0){
      let count = 0;

      measureReports.forEach(function(measureReport){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          // Properly capture current values to avoid closure issues
          const currentMeasureReport = measureReport;
          const measureReportId = currentMeasureReport._id;
          
          const flattened = flattenMeasureReport(currentMeasureReport);
          logger.debug('Flattened measure report:', flattened);
          measureReportsToRender.push(flattened);
        }
        count++;
      });
    }
  }

  if(measureReportsToRender.length === 0){
    logger.trace('MeasureReportsTable: No measure reports to render.');
  } else {
    logger.debug('MeasureReportsTable: Rendering', measureReportsToRender.length, 'measure reports');
    logger.debug('MeasureReportsTable: First measure report:', measureReportsToRender[0]);
    
    for (let i = 0; i < measureReportsToRender.length; i++) {
      const currentReport = measureReportsToRender[i];
      const reportId = currentReport._id;
      
      rows.push(
        <TableRow 
          key={i} 
          className="measureReportRow" 
          style={{cursor: "pointer"}} 
          onClick={() => rowClick(reportId)}
        >
          { renderCheckbox() }
          { renderActionIcons(currentReport) }
          { renderIdentifier(get(currentReport, 'identifier', '')) }
          { renderStatus(get(currentReport, 'status', '')) }
          { renderType(get(currentReport, 'type', '')) }
          { renderSubject(get(currentReport, 'subject', '')) }
          { renderMeasure(get(currentReport, 'measure', '')) }
          { renderDate(get(currentReport, 'date')) }
          { renderReporter(get(currentReport, 'reporter', '')) }
          { renderPeriod(get(currentReport, 'period', '')) }
          { renderGroup(get(currentReport, 'group', '')) }
          { renderScore(get(currentReport, 'score', '')) }
          { renderPopulation(get(currentReport, 'population', '')) }
          { renderImprovementNotation(get(currentReport, 'improvementNotation', '')) }
          { renderBarcode(get(currentReport, '_id')) }
          { renderActionButton(currentReport) }
        </TableRow>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Actual Render Method

  return(
    <Table id='measureReportsTable' size={tableRowSize} aria-label="a table">
      <TableHead>
        <TableRow>
          { renderCheckboxHeader() }
          { renderActionIconsHeader() }
          { renderIdentifierHeader() }
          { renderStatusHeader() }
          { renderTypeHeader() }
          { renderSubjectHeader() }
          { renderMeasureHeader() }
          { renderDateHeader() }
          { renderReporterHeader() }
          { renderPeriodHeader() }
          { renderGroupHeader() }
          { renderScoreHeader() }
          { renderPopulationHeader() }
          { renderImprovementNotationHeader() }
          { renderBarcodeHeader() }
          { renderActionButtonHeader() }
        </TableRow>
      </TableHead>
      <TableBody>
        { rows }
      </TableBody>
    </Table>
  );
}

MeasureReportsTable.propTypes = {
  barcodes: PropTypes.bool,
  measureReports: PropTypes.array,
  selectedMeasureReportId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideMeasure: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideReporter: PropTypes.bool,
  hidePeriod: PropTypes.bool,
  hideGroup: PropTypes.bool,
  hideScore: PropTypes.bool,
  hidePopulation: PropTypes.bool,
  hideImprovementNotation: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  count: PropTypes.number,
  order: PropTypes.string
};

MeasureReportsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm",
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: false,
  hideStatus: false,
  hideType: false,
  hideSubject: false,
  hideMeasure: false,
  hideDate: false,
  hideReporter: true,
  hidePeriod: false,
  hideGroup: true,
  hideScore: false,
  hidePopulation: true,
  hideImprovementNotation: true,
  hideBarcode: true,
  measureReports: []
};

export default MeasureReportsTable;