// imports/ui-fhir/episodeOfCares/EpisodeOfCaresTable.jsx

import React from 'react';
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

function EpisodeOfCaresTable(props){
  logger.info('Rendering the EpisodeOfCaresTable');

  let {
    id,
    children,

    data,
    episodeOfCares,
    selectedEpisodeOfCareId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideStatus,
    hideIdentifier,
    hideType,
    hidePatientName,
    hidePatientReference,
    hideCareManager,
    hideOrganization,
    hidePeriodStart,
    hidePeriodEnd,
    hideDiagnosis,
    hideBarcode,
    hideActionButton,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    actionButtonLabel,

    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    formFactorLayout,
    count,

    page,
    onSetPage,

    order,

    ...otherProps
  } = props;

  // Form Factors
  const hidePatientNameFromProp = hidePatientName;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = true;
        hidePatientReference = true;
        hideCareManager = true;
        hideOrganization = true;
        hidePeriodStart = true;
        hidePeriodEnd = true;
        hideDiagnosis = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideCareManager = true;
        hideOrganization = true;
        hidePeriodStart = false;
        hidePeriodEnd = true;
        hideDiagnosis = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "web":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hidePatientReference = true;
        hideCareManager = false;
        hideOrganization = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideDiagnosis = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideCareManager = false;
        hideOrganization = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideDiagnosis = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "hdmi":
        hidePatientName = (hidePatientNameFromProp !== undefined) ? hidePatientNameFromProp : false;
        hideCareManager = false;
        hideOrganization = false;
        hidePeriodStart = false;
        hidePeriodEnd = false;
        hideDiagnosis = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
    }
  }

  //---------------------------------------------------------------------
  // Helper Functions

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

  function renderStatusHeader(){
    if (!hideStatus) {
      return <TableCell className='status'>Status</TableCell>;
    }
  }
  function renderStatus(status){
    if (!hideStatus) {
      return <TableCell className='status'>{status}</TableCell>;
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return <TableCell className='identifier'>Identifier</TableCell>;
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return <TableCell className='identifier'>{identifier}</TableCell>;
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return <TableCell className='type'>Type</TableCell>;
    }
  }
  function renderType(typeDisplay){
    if (!hideType) {
      return <TableCell className='type'>{typeDisplay}</TableCell>;
    }
  }
  function renderPatientNameHeader(){
    if (!hidePatientName) {
      return <TableCell className='patientDisplay'>Patient</TableCell>;
    }
  }
  function renderPatientName(patientDisplay){
    if (!hidePatientName) {
      return <TableCell className='patientDisplay' style={{minWidth: '140px'}}>{patientDisplay}</TableCell>;
    }
  }
  function renderPatientReferenceHeader(){
    if (!hidePatientReference) {
      return <TableCell className='patientReference'>Patient Reference</TableCell>;
    }
  }
  function renderPatientReference(patientReference){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
          {FhirUtilities.pluckReferenceId(patientReference)}
        </TableCell>
      );
    }
  }
  function renderCareManagerHeader(){
    if (!hideCareManager) {
      return <TableCell className='careManager'>Care Manager</TableCell>;
    }
  }
  function renderCareManager(careManagerDisplay){
    if (!hideCareManager) {
      return <TableCell className='careManager'>{careManagerDisplay}</TableCell>;
    }
  }
  function renderOrganizationHeader(){
    if (!hideOrganization) {
      return <TableCell className='organization'>Organization</TableCell>;
    }
  }
  function renderOrganization(organizationDisplay){
    if (!hideOrganization) {
      return <TableCell className='organization'>{organizationDisplay}</TableCell>;
    }
  }
  function renderPeriodStartHeader(){
    if (!hidePeriodStart) {
      return <TableCell className='periodStart' style={{minWidth: '120px'}}>Start</TableCell>;
    }
  }
  function renderPeriodStart(periodStart){
    if (!hidePeriodStart) {
      return <TableCell className='periodStart' style={{minWidth: '120px'}}>{periodStart}</TableCell>;
    }
  }
  function renderPeriodEndHeader(){
    if (!hidePeriodEnd) {
      return <TableCell className='periodEnd' style={{minWidth: '120px'}}>End</TableCell>;
    }
  }
  function renderPeriodEnd(periodEnd){
    if (!hidePeriodEnd) {
      return <TableCell className='periodEnd' style={{minWidth: '120px'}}>{periodEnd}</TableCell>;
    }
  }
  function renderDiagnosisHeader(){
    if (!hideDiagnosis) {
      return <TableCell className='diagnosis'>Diagnosis</TableCell>;
    }
  }
  function renderDiagnosis(diagnosisDisplay){
    if (!hideDiagnosis) {
      return <TableCell className='diagnosis'>{diagnosisDisplay}</TableCell>;
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
      return <TableCell>System ID</TableCell>;
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return <TableCell className='ActionButton'>Action</TableCell>;
    }
  }
  function renderActionButton(episodeOfCareId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton'>
          <Button onClick={handleActionButtonClick.bind(this, episodeOfCareId)}>{get(props, "actionButtonLabel", "")}</Button>
        </TableCell>
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
  let episodeOfCaresToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(episodeOfCares){
    if(episodeOfCares.length > 0){
      let count = 0;

      let orderedEpisodeOfCares = episodeOfCares;
      if(order === 'descending' || order === 'reverse'){
        orderedEpisodeOfCares = reverse([...episodeOfCares]);
      }

      orderedEpisodeOfCares.forEach(function(episodeOfCare){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          episodeOfCaresToRender.push(FhirDehydrator.dehydrateEpisodeOfCare(episodeOfCare, internalDateFormat));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  };

  if(episodeOfCaresToRender.length === 0){
    logger.trace('EpisodeOfCaresTable: No episodes of care to render.');
  } else {
    for (let i = 0; i < episodeOfCaresToRender.length; i++) {
      let selected = false;
      if(episodeOfCaresToRender[i].id === selectedEpisodeOfCareId){
        selected = true;
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow className="episodeOfCareRow" key={i} style={rowStyle} onClick={handleRowClick.bind(this, episodeOfCaresToRender[i]._id)} hover={true} selected={selected}>
          {renderStatus(get(episodeOfCaresToRender[i], "status", ""))}
          {renderIdentifier(get(episodeOfCaresToRender[i], "identifier", ""))}
          {renderType(get(episodeOfCaresToRender[i], "typeDisplay", ""))}
          {renderPatientName(get(episodeOfCaresToRender[i], "patientDisplay", ""))}
          {renderPatientReference(get(episodeOfCaresToRender[i], "patientReference", ""))}
          {renderCareManager(get(episodeOfCaresToRender[i], "careManagerDisplay", ""))}
          {renderOrganization(get(episodeOfCaresToRender[i], "managingOrganizationDisplay", ""))}
          {renderPeriodStart(get(episodeOfCaresToRender[i], "periodStart", ""))}
          {renderPeriodEnd(get(episodeOfCaresToRender[i], "periodEnd", ""))}
          {renderDiagnosis(get(episodeOfCaresToRender[i], "diagnosisDisplay", ""))}
          {renderBarcode(get(episodeOfCaresToRender[i], "_id", ""))}
          {renderActionButton(get(episodeOfCaresToRender[i], "_id", ""))}
        </TableRow>
      );
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table className='episodeOfCaresTable' size={tableRowSize} aria-label="a dense table" {...otherProps}>
        <TableHead>
          <TableRow>
            {renderStatusHeader()}
            {renderIdentifierHeader()}
            {renderTypeHeader()}
            {renderPatientNameHeader()}
            {renderPatientReferenceHeader()}
            {renderCareManagerHeader()}
            {renderOrganizationHeader()}
            {renderPeriodStartHeader()}
            {renderPeriodEndHeader()}
            {renderDiagnosisHeader()}
            {renderBarcodeHeader()}
            {renderActionButtonHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows}
        </TableBody>
      </Table>
      {paginationFooter}
    </div>
  );
}


EpisodeOfCaresTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  episodeOfCares: PropTypes.array,
  selectedEpisodeOfCareId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideType: PropTypes.bool,
  hidePatientName: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideCareManager: PropTypes.bool,
  hideOrganization: PropTypes.bool,
  hidePeriodStart: PropTypes.bool,
  hidePeriodEnd: PropTypes.bool,
  hideDiagnosis: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionButton: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  order: PropTypes.oneOf(['ascending', 'descending', 'reverse'])
};

EpisodeOfCaresTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  hideCheckbox: true,
  hideActionIcons: true,
  hideStatus: false,
  hideIdentifier: false,
  hideType: false,
  hidePatientName: false,
  hidePatientReference: true,
  hideCareManager: false,
  hideOrganization: true,
  hidePeriodStart: false,
  hidePeriodEnd: false,
  hideDiagnosis: true,
  hideBarcode: true,
  hideActionButton: true,
  disablePagination: false,
  episodeOfCares: [],
  order: 'ascending'
};

export default EpisodeOfCaresTable;
