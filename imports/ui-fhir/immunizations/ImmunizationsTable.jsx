// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/immunizations/ImmunizationsTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TablePagination,
  Checkbox,
  Button
} from '@mui/material';

import { Session } from 'meteor/session'
import { Meteor } from 'meteor/meteor'

import { get } from 'lodash';
import moment from 'moment'

import FhirUtilities from '../../lib/FhirUtilities';
import { flattenImmunization } from '../../lib/FhirDehydrator';

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

function ImmunizationsTable(props){
  logger.info('Rendering the ImmunizationsTable');
  
  let { 
    id,
    children, 

    data,
    immunizations,
    selectedImmunizationId,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideDate,
    hideStatus,
    hidePatientDisplay,
    hidePatientReference,
    hidePerformer,
    hideVaccineCode,
    hideVaccineDisplay,
    hideLotNumber,
    hideExpirationDate,
    hideManufacturer,
    hideSite,
    hideRoute,
    hideDoseQuantity,
    hideBarcode,
    hideActionButton,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    dateFormat,
    showMinutes,
    displayEnteredInError,

    tableRowSize,
    formFactorLayout,
    count,
    order,

    page,
    onSetPage,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  // Store original prop values
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hidePatientDisplay = true;
        hidePatientReference = true;
        hideIdentifier = true;
        hidePerformer = true;
        hideVaccineCode = true;
        hideLotNumber = true;
        hideExpirationDate = true;
        hideManufacturer = true;
        hideSite = true;
        hideRoute = true;
        hideDoseQuantity = true;
        hideBarcode = true;
        break;
      case "tablet":
        hidePatientReference = true;
        hideVaccineCode = true;
        hideExpirationDate = true;
        hideManufacturer = true;
        hideSite = true;
        hideRoute = true;
        hideDoseQuantity = true;
        hideBarcode = true;
        break;
      case "web":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        hideExpirationDate = true;
        hideSite = true;
        hideRoute = true;
        hideDoseQuantity = true;
        break;
      case "desktop":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "videowall":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;            
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

  function handleRowClick(id){
    console.log('handleRowClick', id)
    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    }
  }

  function removeRecord(_id){
    console.log('Remove immunization ', _id)
    if(onRemoveRecord){
      onRemoveRecord(_id);
    }
  }
  
  //---------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
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
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(immunization ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          <Button size="small" onClick={() => removeRecord(immunization._id)}>Remove</Button>
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
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className='barcode'>System ID</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='barcode'><span className="barcode">{idString}</span></TableCell>
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
  function renderDate(newDate ){
    if (!hideDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(newDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className="status">Status</TableCell>
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
  function renderVaccineCodeHeader(){
    if (!hideVaccineCode) {
      return (
        <TableCell className="vaccineCode">CVX Code</TableCell>
      );
    }
  }
  function renderVaccineCode(vaccineCode){
    if (!hideVaccineCode) {
      return (
        <TableCell className='vaccineCode'>{ vaccineCode }</TableCell>
      );
    }
  }
  function renderVaccineDisplayHeader(){
    if (!hideVaccineDisplay) {
      return (
        <TableCell className="vaccineDisplay">Vaccine</TableCell>
      );
    }
  }
  function renderVaccineDisplay(vaccineDisplay){
    if (!hideVaccineDisplay) {
      return (
        <TableCell className='vaccineDisplay'>{ vaccineDisplay }</TableCell>
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
  function renderPatientName(patientDisplay){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>{ patientDisplay }</TableCell>
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
        <TableCell className='patientReference'>{ patientReference }</TableCell>
      );
    }
  }
  function renderPerformerHeader(){
    if (!hidePerformer) {
      return (
        <TableCell className="performer">Performer</TableCell>
      );
    }
  }
  function renderPerformer(performerDisplay){
    if (!hidePerformer) {
      return (
        <TableCell className='performer'>{ performerDisplay }</TableCell>
      );
    }
  }
  function renderLotNumberHeader(){
    if (!hideLotNumber) {
      return (
        <TableCell className="lotNumber">Lot Number</TableCell>
      );
    }
  }
  function renderLotNumber(lotNumber){
    if (!hideLotNumber) {
      return (
        <TableCell className='lotNumber'>{ lotNumber }</TableCell>
      );
    }
  }
  function renderExpirationDateHeader(){
    if (!hideExpirationDate) {
      return (
        <TableCell className='expirationDate'>Expiration</TableCell>
      );
    }
  }
  function renderExpirationDate(expirationDate ){
    if (!hideExpirationDate) {
      return (
        <TableCell className='expirationDate'>{ expirationDate }</TableCell>
      );
    }
  }
  function renderManufacturerHeader(){
    if (!hideManufacturer) {
      return (
        <TableCell className="manufacturer">Manufacturer</TableCell>
      );
    }
  }
  function renderManufacturer(manufacturer){
    if (!hideManufacturer) {
      return (
        <TableCell className='manufacturer'>{ manufacturer }</TableCell>
      );
    }
  }
  function renderSiteHeader(){
    if (!hideSite) {
      return (
        <TableCell className="site">Site</TableCell>
      );
    }
  }
  function renderSite(site){
    if (!hideSite) {
      return (
        <TableCell className='site'>{ site }</TableCell>
      );
    }
  }
  function renderRouteHeader(){
    if (!hideRoute) {
      return (
        <TableCell className="route">Route</TableCell>
      );
    }
  }
  function renderRoute(route){
    if (!hideRoute) {
      return (
        <TableCell className='route'>{ route }</TableCell>
      );
    }
  }
  function renderDoseQuantityHeader(){
    if (!hideDoseQuantity) {
      return (
        <TableCell className="doseQuantity">Dose</TableCell>
      );
    }
  }
  function renderDoseQuantity(doseQuantity, doseUnit){
    if (!hideDoseQuantity) {
      let doseDisplay = doseQuantity;
      if(doseUnit){
        doseDisplay = doseQuantity + ' ' + doseUnit;
      }
      return (
        <TableCell className='doseQuantity'>{ doseDisplay }</TableCell>
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
  function renderActionButton(immunization){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' >
          <Button onClick={ () => onActionButtonClick(immunization._id)}>{ actionButtonLabel }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let immunizationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(immunizations){
    if(immunizations.length > 0){     
      let count = 0;    

      immunizations.forEach(function(immunization){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          immunizationsToRender.push(flattenImmunization(immunization, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  
  if(immunizationsToRender.length === 0){
    logger.trace('ImmunizationsTable: No immunizations to render.');
  } else {
    // Sort the immunizations if order is specified
    if(order === 'ascending'){
      immunizationsToRender.sort((a, b) => {
        const dateA = get(a, 'date', '');
        const dateB = get(b, 'date', '');
        return dateA.localeCompare(dateB);
      });
    } else if(order === 'descending') {
      immunizationsToRender.sort((a, b) => {
        const dateA = get(a, 'date', '');
        const dateB = get(b, 'date', '');
        return dateB.localeCompare(dateA);
      });
    }

    for (let i = 0; i < immunizationsToRender.length; i++) {
      const currentImmunization = immunizationsToRender[i];
      const immunizationId = currentImmunization._id;

      let selected = false;
      if(currentImmunization.id === selectedImmunizationId){
        selected = true;
      }
      if(get(currentImmunization, 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      } 

      logger.trace('immunizationsToRender[i]', currentImmunization)

      if(get(currentImmunization, "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} 
          onClick={() => handleRowClick(immunizationId)} 
          hover={true} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}} colSpan={20}>
              {get(currentImmunization, 'issue[0].details.text', 'OperationOutcome: No data returned.')}
            </TableCell>
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="immunizationRow" key={i} style={rowStyle} onClick={() => handleRowClick(immunizationId)} hover={true} >            
            { renderCheckbox() }
            { renderActionIcons(currentImmunization) }
            { renderBarcode(get(currentImmunization, "_id")) }
            { renderIdentifier(get(currentImmunization, "identifier")) }
            { renderVaccineCode(get(currentImmunization, "vaccineCode")) }
            { renderVaccineDisplay(get(currentImmunization, "vaccineDisplay")) }
            { renderStatus(get(currentImmunization, "status")) }
            { renderDate(get(currentImmunization, "date")) }
            { renderPatientName(get(currentImmunization, "patientDisplay")) }
            { renderPatientReference(get(currentImmunization, "patientReference")) }
            { renderPerformer(get(currentImmunization, "performerDisplay")) }
            { renderLotNumber(get(currentImmunization, "lotNumber")) }
            { renderExpirationDate(get(currentImmunization, "expirationDate")) }
            { renderManufacturer(get(currentImmunization, "manufacturerDisplay")) }
            { renderSite(get(currentImmunization, "siteDisplay")) }
            { renderRoute(get(currentImmunization, "routeDisplay")) }
            { renderDoseQuantity(get(currentImmunization, "doseQuantity"), get(currentImmunization, "doseUnit")) }
            { renderActionButton(currentImmunization) }
          </TableRow>
        ); 
      }      
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div>
      <Table id={id} className='immunizationsTable' size="small" aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderBarcodeHeader() }
            { renderIdentifierHeader() }
            { renderVaccineCodeHeader() }
            { renderVaccineDisplayHeader() }
            { renderStatusHeader() }
            { renderDateHeader() }
            { renderPatientNameHeader() }
            { renderPatientReferenceHeader() }
            { renderPerformerHeader() }
            { renderLotNumberHeader() }
            { renderExpirationDateHeader() }
            { renderManufacturerHeader() }
            { renderSiteHeader() }
            { renderRouteHeader() }
            { renderDoseQuantityHeader() }
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

ImmunizationsTable.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  immunizations: PropTypes.array,
  selectedImmunizationId: PropTypes.string,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hideVaccineCode: PropTypes.bool,
  hideVaccineDisplay: PropTypes.bool,
  hideLotNumber: PropTypes.bool,
  hideExpirationDate: PropTypes.bool,
  hideManufacturer: PropTypes.bool,
  hideSite: PropTypes.bool,
  hideRoute: PropTypes.bool,
  hideDoseQuantity: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  
  rowsPerPage: PropTypes.number,
  limit: PropTypes.number,
  query: PropTypes.object,
  patient: PropTypes.string,
  patientDisplay: PropTypes.string,
  sort: PropTypes.string,
  dateFormat: PropTypes.string,
  order: PropTypes.string,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  showActionButton: PropTypes.bool,

  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};


ImmunizationsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: false,
  hideDate: false,
  hideStatus: false,
  hidePatientDisplay: false,
  hidePatientReference: true,
  hidePerformer: false,
  hideVaccineCode: false,
  hideVaccineDisplay: false,
  hideLotNumber: false,
  hideExpirationDate: true,
  hideManufacturer: false,
  hideSite: true,
  hideRoute: true,
  hideDoseQuantity: true,
  hideBarcode: true,
  hideActionButton: true
};

export default ImmunizationsTable;