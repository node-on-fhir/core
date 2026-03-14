// /imports/ui-fhir/imagingStudies/ImagingStudiesTable.jsx

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

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

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

function ImagingStudiesTable(props){
  logger.info('Rendering the ImagingStudiesTable');

  let { 
    id,
    children, 

    data,
    imagingStudies,
    selectedImagingStudyId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideModality,
    hideDescription,
    hidePatientDisplay,
    hidePatientReference,
    hideStarted,
    hideProcedureCode,
    hideProcedureDisplay,
    hideReferrer,
    hideLocation,
    hideNumberOfSeries,
    hideNumberOfInstances,
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

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Preserve original prop values for form factor overrides
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;
  const hideIdentifierFromProp = hideIdentifier;
  const hideReferrerFromProp = hideReferrer;
  const hideLocationFromProp = hideLocation;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = true;
        hideModality = true;
        hideDescription = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hideStarted = true;
        hideProcedureCode = true;
        hideProcedureDisplay = true;
        hideReferrer = true;
        hideLocation = true;
        hideNumberOfSeries = true;
        hideNumberOfInstances = true;
        hideBarcode = true;  
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideModality = false;
        hideDescription = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hideStarted = false;
        hideProcedureCode = true;
        hideProcedureDisplay = true;
        hideReferrer = true;
        hideLocation = true;
        hideNumberOfSeries = true;
        hideNumberOfInstances = true;
        hideBarcode = true;   
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : false;
        hideStatus = false;
        hideModality = false;
        hideDescription = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideStarted = false;
        hideProcedureCode = true;
        hideProcedureDisplay = false;
        hideReferrer = (hideReferrerFromProp !== undefined) ? hideReferrerFromProp : false;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : true;
        hideNumberOfSeries = false;
        hideNumberOfInstances = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : false;
        hideStatus = false;
        hideModality = false;
        hideDescription = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideStarted = false;
        hideProcedureCode = true;
        hideProcedureDisplay = false;
        hideReferrer = (hideReferrerFromProp !== undefined) ? hideReferrerFromProp : false;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : false;
        hideNumberOfSeries = false;
        hideNumberOfInstances = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : false;
        hideStatus = false;
        hideModality = false;
        hideDescription = false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideStarted = false;
        hideProcedureCode = false;
        hideProcedureDisplay = false;
        hideReferrer = (hideReferrerFromProp !== undefined) ? hideReferrerFromProp : false;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : false;
        hideNumberOfSeries = false;
        hideNumberOfInstances = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(imagingStudyId){
    console.log('Clicking row ' + imagingStudyId)
    if(props.onRowClick){
      props.onRowClick(imagingStudyId);
    }
  }

  function removeRecord(_id){
    console.log('Remove imaging study ', _id)
    if(props.onRemoveRecord){
      props.onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof props.onActionButtonClick === "function"){
      props.onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof props.onCellClick === "function"){
      props.onCellClick(id);
    }
  }

  function handleMetaClick(patient){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, patient);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering Functions

  function renderToggleHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
            <Checkbox
              defaultChecked={defaultCheckboxValue}
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
  function renderActionIcons(imagingStudy ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* Add action buttons here if needed */}
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
  function renderIdentifier(imagingStudy){
    if (!hideIdentifier) {
      
      return (
        <TableCell className='identifier'>{get(imagingStudy, 'identifier')}</TableCell>       
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
  function renderStatus(imagingStudy){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{get(imagingStudy, 'status')}</TableCell>
      );
    }
  }
  function renderModalityHeader(){
    if (!hideModality) {
      return (
        <TableCell className='modality'>Modality</TableCell>
      );
    }
  }
  function renderModality(imagingStudy){
    if (!hideModality) {
      return (
        <TableCell className='modality'>{get(imagingStudy, 'modality')}</TableCell>
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
  function renderDescription(imagingStudy){
    if (!hideDescription) {
      return (
        <TableCell className='description'>{get(imagingStudy, 'description')}</TableCell>
      );
    }
  }
  function renderPatientNameHeader(){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>Patient Name</TableCell>
      );
    }
  }
  function renderPatientName(imagingStudy){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>{get(imagingStudy, 'patientDisplay')}</TableCell>
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
  function renderPatientReference(imagingStudy){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>{get(imagingStudy, 'patientReference')}</TableCell>
      );
    }
  }
  function renderStartedHeader(){
    if (!hideStarted) {
      return (
        <TableCell className='started'>Started</TableCell>
      );
    }
  }
  function renderStarted(imagingStudy){
    if (!hideStarted) {
      const startedDate = get(imagingStudy, 'started');
      let formattedDate = '';
      if(startedDate){
        formattedDate = moment(startedDate).format('YYYY-MM-DD');
      }
      return (
        <TableCell className='started'>{formattedDate}</TableCell>
      );
    }
  }
  function renderProcedureCodeHeader(){
    if (!hideProcedureCode) {
      return (
        <TableCell className='procedureCode'>Procedure Code</TableCell>
      );
    }
  }
  function renderProcedureCode(imagingStudy){
    if (!hideProcedureCode) {
      return (
        <TableCell className='procedureCode'>{get(imagingStudy, 'procedureCode')}</TableCell>
      );
    }
  }
  function renderProcedureDisplayHeader(){
    if (!hideProcedureDisplay) {
      return (
        <TableCell className='procedureDisplay'>Procedure</TableCell>
      );
    }
  }
  function renderProcedureDisplay(imagingStudy){
    if (!hideProcedureDisplay) {
      return (
        <TableCell className='procedureDisplay'>{get(imagingStudy, 'procedureDisplay')}</TableCell>
      );
    }
  }
  function renderReferrerHeader(){
    if (!hideReferrer) {
      return (
        <TableCell className='referrerDisplay'>Referrer</TableCell>
      );
    }
  }
  function renderReferrer(imagingStudy){
    if (!hideReferrer) {
      return (
        <TableCell className='referrerDisplay'>{get(imagingStudy, 'referrerDisplay')}</TableCell>
      );
    }
  }
  function renderLocationHeader(){
    if (!hideLocation) {
      return (
        <TableCell className='locationDisplay'>Location</TableCell>
      );
    }
  }
  function renderLocation(imagingStudy){
    if (!hideLocation) {
      return (
        <TableCell className='locationDisplay'>{get(imagingStudy, 'locationDisplay')}</TableCell>
      );
    }
  }
  function renderNumberOfSeriesHeader(){
    if (!hideNumberOfSeries) {
      return (
        <TableCell className='numberOfSeries'>Series</TableCell>
      );
    }
  }
  function renderNumberOfSeries(imagingStudy){
    if (!hideNumberOfSeries) {
      return (
        <TableCell className='numberOfSeries'>{get(imagingStudy, 'numberOfSeries')}</TableCell>
      );
    }
  }
  function renderNumberOfInstancesHeader(){
    if (!hideNumberOfInstances) {
      return (
        <TableCell className='numberOfInstances'>Instances</TableCell>
      );
    }
  }
  function renderNumberOfInstances(imagingStudy){
    if (!hideNumberOfInstances) {
      return (
        <TableCell className='numberOfInstances'>{get(imagingStudy, 'numberOfInstances')}</TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className='systemId'>System ID</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='systemId'><span className="barcode">{idString}</span></TableCell>
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
  function renderActionButton(imagingStudy){
    if (!hideActionButton) {
      return(
        <TableCell className='actionButton' >
          <Button onClick={ function(){ handleActionButtonClick(get(imagingStudy, '_id')); }}>{ get(props, 'actionButtonLabel', 'Action') }</Button>
        </TableCell>
      )
    }
  }

  // ------------------------------------------------------------------------
  // Data Processing

  let tableRows = [];
  let imagingStudiesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = dateFormat;
  }

  if(props.data){
    // if we receive an array of imaging studies, we process them immediately
    if(Array.isArray(props.data)){
      imagingStudiesToRender = props.data;
    } else {
      // otherwise we're receiving an object, and we need to extract the array from it
      imagingStudiesToRender = get(props, 'data.imagingStudies', []);
    }
  } else {
    // otherwise we look at the props that were passed in
    if(props.imagingStudies){
      imagingStudiesToRender = props.imagingStudies;
    }
  }

  // we need to flatten the data for the table
  if(imagingStudiesToRender.length > 0){
    let dehydratedImagingStudies = [];
    imagingStudiesToRender.forEach(function(imagingStudy){
      dehydratedImagingStudies.push(FhirDehydrator.dehydrateImagingStudy(imagingStudy, internalDateFormat));
    });
    imagingStudiesToRender = dehydratedImagingStudies;
  }

  // ------------------------------------------------------------------------
  // Pagination

  let rowsPerPageToRender = rowsPerPage || 5;
  
  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setRowsPerPage] = useState(rowsPerPageToRender);

  let currentPage = internalPage;
  if(page){
    currentPage = page;
  }

  const handleChangePage = (event, newPage) => {
    setInternalPage(newPage);
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setInternalPage(0);
  };

  let paginationCount = imagingStudiesToRender.length;
  if(count){
    paginationCount = count;
  }

  const paginatedData = imagingStudiesToRender.slice(
    currentPage * internalRowsPerPage,
    currentPage * internalRowsPerPage + internalRowsPerPage
  );

  paginatedData.forEach(function(imagingStudy){
    const currentImagingStudy = imagingStudy;
    const imagingStudyId = currentImagingStudy._id;
    
    tableRows.push(
      <TableRow 
        key={imagingStudyId} 
        className="imagingStudyRow" 
        hover={true} 
        style={{cursor: 'pointer'}} 
        onClick={ function(){ handleRowClick(imagingStudyId); }} 
        sx={{ '& td': { py: 1.5 } }}
      >
        { renderToggle(imagingStudy) }
        { renderActionIcons(imagingStudy) }
        { renderIdentifier(imagingStudy) }
        { renderStatus(imagingStudy) }
        { renderModality(imagingStudy) }
        { renderDescription(imagingStudy) }
        { renderPatientName(imagingStudy) }
        { renderPatientReference(imagingStudy) }
        { renderStarted(imagingStudy) }
        { renderProcedureCode(imagingStudy) }
        { renderProcedureDisplay(imagingStudy) }
        { renderReferrer(imagingStudy) }
        { renderLocation(imagingStudy) }
        { renderNumberOfSeries(imagingStudy) }
        { renderNumberOfInstances(imagingStudy) }
        { renderBarcode(imagingStudyId) }
        { renderActionButton(imagingStudy) }
      </TableRow>
    );
  });

  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow sx={{ '& th': { py: 1.5 } }}>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderModalityHeader() }
            { renderDescriptionHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
            { renderStartedHeader() }
            { renderProcedureCodeHeader() }
            { renderProcedureDisplayHeader() }
            { renderReferrerHeader() }
            { renderLocationHeader() }
            { renderNumberOfSeriesHeader() }
            { renderNumberOfInstancesHeader() }
            { renderBarcodeHeader() }
            { renderActionButtonHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { !disablePagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={paginationCount}
          rowsPerPage={internalRowsPerPage}
          page={currentPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
    </div>
  );
}

ImagingStudiesTable.propTypes = {
  id: PropTypes.string,

  data: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  imagingStudies: PropTypes.array,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideModality: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideStarted: PropTypes.bool,
  hideProcedureCode: PropTypes.bool,
  hideProcedureDisplay: PropTypes.bool,
  hideReferrer: PropTypes.bool,
  hideLocation: PropTypes.bool,
  hideNumberOfSeries: PropTypes.bool,
  hideNumberOfInstances: PropTypes.bool,
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
  count: PropTypes.number,
  labels: PropTypes.object,

  selectedImagingStudyId: PropTypes.string,
  defaultCheckboxValue: PropTypes.bool,

  page: PropTypes.number,
  onSetPage: PropTypes.func,

  formFactorLayout: PropTypes.string
};

ImagingStudiesTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: false,
  hideStatus: false,
  hideModality: false,
  hideDescription: false,
  hidePatientDisplay: false,
  hidePatientReference: true,
  hideStarted: false,
  hideProcedureCode: true,
  hideProcedureDisplay: false,
  hideReferrer: false,
  hideLocation: true,
  hideNumberOfSeries: false,
  hideNumberOfInstances: false,
  hideBarcode: true,
  hideActionButton: true,
  tableRowSize: 'medium',
  actionButtonLabel: 'Action'
}

export default ImagingStudiesTable;