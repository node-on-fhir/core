// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/appointments/AppointmentsTable.jsx

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
  Typography,
  Box
} from '@mui/material';

import moment from 'moment';
import { get } from 'lodash';

import { FhirDehydrator } from '/imports/lib/FhirDehydrator';

// Logging setup
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

import { ThemeProvider, makeStyles } from '@mui/styles';
const useStyles = makeStyles(theme => ({
  hideOnPhone: {
    visibility: 'visible',
    display: 'table'
  },
  cellHideOnPhone: {
    visibility: 'visible',
    display: 'table',
    paddingTop: '16px',
    maxWidth: '120px'
  },
  cell: {
    paddingTop: '16px',
    paddingBottom: '16px'
  },
  tableCell: {
    padding: '16px'
  }
}));

//===========================================================================
// MAIN COMPONENT

function AppointmentsTable(props){

  const classes = useStyles();

  const [page, setPage] = useState(0);
  const [rowsPerPageToRender, setRowsPerPage] = useState(props.rowsPerPage || 25);

  // Preserve original prop values
  const hideIdentifierFromProp = props.hideIdentifier;
  const hideCheckboxFromProp = props.hideCheckbox;
  const hideActionIconsFromProp = props.hideActionIcons;
  const hideStartFromProp = props.hideStart;
  const hideEndFromProp = props.hideEnd;
  const hideStatusFromProp = props.hideStatus;
  const hideTypeFromProp = props.hideType;
  const hideTypeCodeFromProp = props.hideTypeCode;
  const hideReasonFromProp = props.hideReason;
  const hideDescriptionFromProp = props.hideDescription;
  const hidePatientDisplayFromProp = props.hidePatientDisplay;
  const hidePatientReferenceFromProp = props.hidePatientReference;
  const hidePractitionerDisplayFromProp = props.hidePractitionerDisplay;
  const hidePractitionerReferenceFromProp = props.hidePractitionerReference;
  const hideLocationDisplayFromProp = props.hideLocationDisplay;
  const hideCommentFromProp = props.hideComment;
  const hideBarcodeFromProp = props.hideBarcode;

  let { 
    appointments,
    selectedAppointmentId,
    query,
    paginationLimit,
    disablePagination,
    count,
    rowsPerPage,
    formFactorLayout,
    hideIdentifier,
    hideCheckbox,
    hideActionIcons,
    hideStart,
    hideEnd,
    hideStatus,
    hideType,
    hideTypeCode,
    hideReason,
    hideDescription,
    hidePatientDisplay,
    hidePatientReference,
    hidePractitionerDisplay,
    hidePractitionerReference,
    hideLocationDisplay,
    hideComment,
    hideBarcode,
    onRowClick,
    showMinutes,
    appHeight,
    sortOrder
  } = props;

  // Form factor adjustments
  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideIdentifier = true;
        hideStart = false;
        hideEnd = true;
        hideStatus = false;
        hideType = false;
        hideTypeCode = true;
        hideReason = true;
        hideDescription = true;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hidePractitionerDisplay = true;
        hidePractitionerReference = true;
        hideLocationDisplay = true;
        hideComment = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideIdentifier = true;
        hideStart = false;
        hideEnd = false;
        hideStatus = false;
        hideType = false;
        hideTypeCode = true;
        hideReason = false;
        hideDescription = false;
        hidePatientDisplay = false;
        hidePatientReference = true;
        hidePractitionerDisplay = false;
        hidePractitionerReference = true;
        hideLocationDisplay = false;
        hideComment = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = (hideCheckboxFromProp !== undefined) ? hideCheckboxFromProp : true;
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : true;
        hideStart = (hideStartFromProp !== undefined) ? hideStartFromProp : false;
        hideEnd = (hideEndFromProp !== undefined) ? hideEndFromProp : false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideTypeCode = (hideTypeCodeFromProp !== undefined) ? hideTypeCodeFromProp : true;
        hideReason = (hideReasonFromProp !== undefined) ? hideReasonFromProp : false;
        hideDescription = (hideDescriptionFromProp !== undefined) ? hideDescriptionFromProp : false;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hidePractitionerDisplay = (hidePractitionerDisplayFromProp !== undefined) ? hidePractitionerDisplayFromProp : false;
        hidePractitionerReference = (hidePractitionerReferenceFromProp !== undefined) ? hidePractitionerReferenceFromProp : true;
        hideLocationDisplay = (hideLocationDisplayFromProp !== undefined) ? hideLocationDisplayFromProp : false;
        hideComment = (hideCommentFromProp !== undefined) ? hideCommentFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "hdmi":
        hideCheckbox = (hideCheckboxFromProp !== undefined) ? hideCheckboxFromProp : true;
        hideIdentifier = (hideIdentifierFromProp !== undefined) ? hideIdentifierFromProp : true;
        hideStart = false;
        hideEnd = false;
        hideStatus = false;
        hideType = false;
        hideTypeCode = false;
        hideReason = false;
        hideDescription = false;
        hidePatientDisplay = false;
        hidePatientReference = false;
        hidePractitionerDisplay = false;
        hidePractitionerReference = false;
        hideLocationDisplay = false;
        hideComment = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
    }
  }

  // Pagination
  let appointmentsToRender = [];
  if(appointments){
    if(disablePagination){
      appointmentsToRender = appointments;
    } else {
      appointmentsToRender = appointments.slice(page * rowsPerPageToRender, page * rowsPerPageToRender + rowsPerPageToRender);
    }
  }

  // Helper function to render barcode/identifier
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className={classes.cell}>
          <span className="barcode helveticas">{idString}</span>
        </TableCell>
      );
    }
  }

  // Helper functions for each column header
  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className='checkbox'>Checkbox</TableCell>
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
  function renderStartHeader(){
    if (!hideStart) {
      return (
        <TableCell className='start'>Start</TableCell>
      );
    }
  }
  function renderEndHeader(){
    if (!hideEnd) {
      return (
        <TableCell className='end'>End</TableCell>
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
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className='type'>Type</TableCell>
      );
    }
  }
  function renderTypeCodeHeader(){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode'>Type Code</TableCell>
      );
    }
  }
  function renderReasonHeader(){
    if (!hideReason) {
      return (
        <TableCell className='reason'>Reason</TableCell>
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
  function renderPatientDisplayHeader(){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>Patient Name</TableCell>
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
  function renderPractitionerDisplayHeader(){
    if (!hidePractitionerDisplay) {
      return (
        <TableCell className='practitionerDisplay'>Practitioner</TableCell>
      );
    }
  }
  function renderPractitionerReferenceHeader(){
    if (!hidePractitionerReference) {
      return (
        <TableCell className='practitionerReference'>Practitioner Reference</TableCell>
      );
    }
  }
  function renderLocationDisplayHeader(){
    if (!hideLocationDisplay) {
      return (
        <TableCell className='locationDisplay'>Location</TableCell>
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

  // Helper functions for each column cell
  function renderCheckbox(appointment){
    if (!hideCheckbox) {
      return (
        <TableCell className='checkbox'>
          <Checkbox />
        </TableCell>
      );
    }
  }
  function renderStart(start){
    if (!hideStart) {
      return (
        <TableCell className='start'>{moment(start).format('YYYY-MM-DD HH:mm')}</TableCell>
      );
    }
  }
  function renderEnd(end){
    if (!hideEnd) {
      return (
        <TableCell className='end'>{moment(end).format('YYYY-MM-DD HH:mm')}</TableCell>
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
  function renderType(type){
    if (!hideType) {
      return (
        <TableCell className='type'>{type}</TableCell>
      );
    }
  }
  function renderTypeCode(typeCode){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode'>{typeCode}</TableCell>
      );
    }
  }
  function renderReason(reason){
    if (!hideReason) {
      return (
        <TableCell className='reason'>{reason}</TableCell>
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
  function renderPatientDisplay(display){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>{display}</TableCell>
      );
    }
  }
  function renderPatientReference(reference){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>{reference}</TableCell>
      );
    }
  }
  function renderPractitionerDisplay(display){
    if (!hidePractitionerDisplay) {
      return (
        <TableCell className='practitionerDisplay'>{display}</TableCell>
      );
    }
  }
  function renderPractitionerReference(reference){
    if (!hidePractitionerReference) {
      return (
        <TableCell className='practitionerReference'>{reference}</TableCell>
      );
    }
  }
  function renderLocationDisplay(display){
    if (!hideLocationDisplay) {
      return (
        <TableCell className='locationDisplay'>{display}</TableCell>
      );
    }
  }
  function renderComment(comment){
    if (!hideComment) {
      return (
        <TableCell className='comment'>{comment}</TableCell>
      );
    }
  }

  let rows = [];
  for (let i = 0; i < appointmentsToRender.length; i++) {
    const currentAppointment = appointmentsToRender[i];
    const appointmentId = currentAppointment._id;
    
    // Flatten the appointment data
    let flattenedAppointment = FhirDehydrator.dehydrateAppointment(currentAppointment);
    
    rows.push(
      <TableRow 
        key={appointmentId} 
        className="appointmentRow" 
        hover
        onClick={() => handleRowClick(appointmentId)}
        style={{ cursor: 'pointer' }}
      >
        {renderCheckbox(flattenedAppointment)}
        {renderBarcode(appointmentId)}
        {renderStart(flattenedAppointment.start)}
        {renderEnd(flattenedAppointment.end)}
        {renderStatus(flattenedAppointment.status)}
        {renderType(flattenedAppointment.type)}
        {renderTypeCode(flattenedAppointment.typeCode)}
        {renderReason(flattenedAppointment.reason)}
        {renderDescription(flattenedAppointment.description)}
        {renderPatientDisplay(flattenedAppointment.patientDisplay)}
        {renderPatientReference(flattenedAppointment.patientReference)}
        {renderPractitionerDisplay(flattenedAppointment.practitionerDisplay)}
        {renderPractitionerReference(flattenedAppointment.practitionerReference)}
        {renderLocationDisplay(flattenedAppointment.locationDisplay)}
        {renderComment(flattenedAppointment.comment)}
      </TableRow>
    );
  }

  function handleRowClick(id){
    if(onRowClick){
      onRowClick(id);
    }
  }

  function handleChangePage(event, newPage){
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event){
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  return (
    <div>
      <Table id='appointmentsTable' size='small' aria-label='appointments'>
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderBarcodeHeader()}
            {renderStartHeader()}
            {renderEndHeader()}
            {renderStatusHeader()}
            {renderTypeHeader()} 
            {renderTypeCodeHeader()}
            {renderReasonHeader()}
            {renderDescriptionHeader()}
            {renderPatientDisplayHeader()}
            {renderPatientReferenceHeader()}
            {renderPractitionerDisplayHeader()}
            {renderPractitionerReferenceHeader()}
            {renderLocationDisplayHeader()}
            {renderCommentHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows}
        </TableBody>
      </Table>
      {(!disablePagination && (count > 0)) && (
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPageToRender}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100, 250]}
        />
      )}
    </div>
  );
}

AppointmentsTable.propTypes = {
  appointments: PropTypes.array,
  selectedAppointmentId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,
  count: PropTypes.number,
  rowsPerPage: PropTypes.number,
  formFactorLayout: PropTypes.string,
  
  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideStart: PropTypes.bool,
  hideEnd: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideTypeCode: PropTypes.bool,
  hideReason: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hidePractitionerDisplay: PropTypes.bool,
  hidePractitionerReference: PropTypes.bool,
  hideLocationDisplay: PropTypes.bool,
  hideComment: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onRowClick: PropTypes.func,
  showMinutes: PropTypes.bool,
  appHeight: PropTypes.number,
  sortOrder: PropTypes.string
};

AppointmentsTable.defaultProps = {
  appointments: [],
  hideCheckbox: true,
  hideIdentifier: true,
  hideActionIcons: true,
  hideStart: false,
  hideEnd: false,
  hideStatus: false,
  hideType: false,
  hideTypeCode: true,
  hideReason: false,
  hideDescription: false,
  hidePatientDisplay: false,
  hidePatientReference: true,
  hidePractitionerDisplay: false,
  hidePractitionerReference: true,
  hideLocationDisplay: false,
  hideComment: true,
  hideBarcode: true,
  rowsPerPage: 25,
  onRowClick: function(id){
    console.log('No onRowClick function defined');
  }
};

export default AppointmentsTable;