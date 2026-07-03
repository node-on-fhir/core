// /imports/ui-fhir/healthcareServices/HealthcareServicesTable.jsx

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
  TablePagination
} from '@mui/material';

import { get } from 'lodash';

import FhirDehydrator from '../../lib/FhirDehydrator';


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

function HealthcareServicesTable(props){
  logger.info('Rendering the HealthcareServicesTable');

  let {
    id,
    children,

    data,
    healthcareServices,
    selectedHealthcareServiceId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideName,
    hideCategory,
    hideType,
    hideSpecialty,
    hideLocation,
    hideProvidedBy,
    hidePhone,
    hideEmail,
    hideActive,
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
    formFactorLayout,
    count,
    labels,

    defaultCheckboxValue,

    page,
    onSetPage,

    order,

    ...otherProps
  } = props;

  // ------------------------------------------------------------------------
  // Store original prop values before form factor overrides
  const hideBarcodeFromProp = hideBarcode;
  const hideCategoryFromProp = hideCategory;
  const hideTypeFromProp = hideType;
  const hideSpecialtyFromProp = hideSpecialty;
  const hideLocationFromProp = hideLocation;
  const hideProvidedByFromProp = hideProvidedBy;
  const hidePhoneFromProp = hidePhone;
  const hideEmailFromProp = hideEmail;

  // ------------------------------------------------------------------------
  // Form Factors

  let multiline = false;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : true;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : true;
        hideSpecialty = (hideSpecialtyFromProp !== undefined) ? hideSpecialtyFromProp : true;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : true;
        hideProvidedBy = (hideProvidedByFromProp !== undefined) ? hideProvidedByFromProp : true;
        hidePhone = (hidePhoneFromProp !== undefined) ? hidePhoneFromProp : true;
        hideEmail = (hideEmailFromProp !== undefined) ? hideEmailFromProp : true;
        hideActive = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideSpecialty = (hideSpecialtyFromProp !== undefined) ? hideSpecialtyFromProp : true;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : true;
        hideProvidedBy = (hideProvidedByFromProp !== undefined) ? hideProvidedByFromProp : true;
        hidePhone = (hidePhoneFromProp !== undefined) ? hidePhoneFromProp : true;
        hideEmail = (hideEmailFromProp !== undefined) ? hideEmailFromProp : true;
        hideActive = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "web":
        hideName = false;
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideSpecialty = (hideSpecialtyFromProp !== undefined) ? hideSpecialtyFromProp : true;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : false;
        hideProvidedBy = (hideProvidedByFromProp !== undefined) ? hideProvidedByFromProp : false;
        hidePhone = (hidePhoneFromProp !== undefined) ? hidePhoneFromProp : false;
        hideEmail = (hideEmailFromProp !== undefined) ? hideEmailFromProp : false;
        hideActive = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "desktop":
      case "hdmi":
        hideName = false;
        hideCategory = (hideCategoryFromProp !== undefined) ? hideCategoryFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideSpecialty = (hideSpecialtyFromProp !== undefined) ? hideSpecialtyFromProp : false;
        hideLocation = (hideLocationFromProp !== undefined) ? hideLocationFromProp : false;
        hideProvidedBy = (hideProvidedByFromProp !== undefined) ? hideProvidedByFromProp : false;
        hidePhone = (hidePhoneFromProp !== undefined) ? hidePhoneFromProp : false;
        hideEmail = (hideEmailFromProp !== undefined) ? hideEmailFromProp : false;
        hideActive = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
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

  function handleRowClick(id){
    console.log('HealthcareServicesTable handleRowClick called with id:', id);
    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    } else {
      console.log('No onRowClick handler provided');
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
  function renderNameHeader(){
    if (!hideName) {
      return ( <TableCell className='name'>Name</TableCell> );
    }
  }
  function renderName(name){
    if (!hideName) {
      return ( <TableCell className='name' style={{minWidth: '200px'}}>{ name }</TableCell> );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return ( <TableCell className='category'>Category</TableCell> );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return ( <TableCell className='category' style={{minWidth: '140px'}}>{ category }</TableCell> );
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return ( <TableCell className='type'>Type</TableCell> );
    }
  }
  function renderType(type){
    if (!hideType) {
      return ( <TableCell className='type' style={{minWidth: '140px'}}>{ type }</TableCell> );
    }
  }
  function renderSpecialtyHeader(){
    if (!hideSpecialty) {
      return ( <TableCell className='specialty'>Specialty</TableCell> );
    }
  }
  function renderSpecialty(specialty){
    if (!hideSpecialty) {
      return ( <TableCell className='specialty' style={{minWidth: '140px'}}>{ specialty }</TableCell> );
    }
  }
  function renderLocationHeader(){
    if (!hideLocation) {
      return ( <TableCell className='location'>Location</TableCell> );
    }
  }
  function renderLocation(location){
    if (!hideLocation) {
      return ( <TableCell className='location' style={{minWidth: '160px'}}>{ location }</TableCell> );
    }
  }
  function renderProvidedByHeader(){
    if (!hideProvidedBy) {
      return ( <TableCell className='providedBy'>Provided By</TableCell> );
    }
  }
  function renderProvidedBy(providedBy){
    if (!hideProvidedBy) {
      return ( <TableCell className='providedBy' style={{minWidth: '160px'}}>{ providedBy }</TableCell> );
    }
  }
  function renderPhoneHeader(){
    if (!hidePhone) {
      return ( <TableCell className='phone'>Phone</TableCell> );
    }
  }
  function renderPhone(phone){
    if (!hidePhone) {
      return ( <TableCell className='phone' style={{minWidth: '140px'}}>{ phone }</TableCell> );
    }
  }
  function renderEmailHeader(){
    if (!hideEmail) {
      return ( <TableCell className='email'>Email</TableCell> );
    }
  }
  function renderEmail(email){
    if (!hideEmail) {
      return ( <TableCell className='email' style={{minWidth: '180px'}}>{ email }</TableCell> );
    }
  }
  function renderActiveHeader(){
    if (!hideActive) {
      return ( <TableCell className='active'>Active</TableCell> );
    }
  }
  function renderActive(active){
    if (!hideActive) {
      return ( <TableCell className='active'>{ active ? 'Yes' : 'No' }</TableCell> );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return ( <TableCell className='identifier'>Identifier</TableCell> );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return ( <TableCell className='identifier'>{ identifier }</TableCell> );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return ( <TableCell className='actionIcons'>Actions</TableCell> );
    }
  }
  function renderActionIcons( healthcareService ){
    if (!hideActionIcons) {
      return ( <TableCell className='actionIcons' style={{width: '120px'}}></TableCell> );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects (which have _str property)
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return ( <TableCell><span className="barcode helveticas">{idString}</span></TableCell> );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return ( <TableCell>System ID</TableCell> );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return ( <TableCell className='ActionButton' >Action</TableCell> );
    }
  }
  function renderActionButton(healthcareServiceId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, healthcareServiceId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
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
  let healthcareServicesToRender = [];

  // Accept either the named `healthcareServices` prop or the generic `data` prop
  let sourceArray = healthcareServices;
  if((!sourceArray || sourceArray.length === 0) && Array.isArray(data)){
    sourceArray = data;
  }

  if(sourceArray){
    if(sourceArray.length > 0){
      let counter = 0;

      sourceArray.forEach(function(healthcareService){
        if((counter >= (page * rowsPerPage)) && (counter < (page + 1) * rowsPerPage)){
          healthcareServicesToRender.push(FhirDehydrator.flattenHealthcareService(healthcareService));
        }
        counter++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(healthcareServicesToRender.length === 0){
    logger.trace('HealthcareServicesTable: No healthcare services to render.');
  } else {
    for (let i = 0; i < healthcareServicesToRender.length; i++) {
      let selected = false;
      if(healthcareServicesToRender[i].id === selectedHealthcareServiceId){
        selected = true;
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('healthcareServicesToRender[i]', healthcareServicesToRender[i])

      const currentHealthcareService = healthcareServicesToRender[i];
      // Handle MongoDB ObjectID objects (which have _str property)
      const rawId = currentHealthcareService._id;
      const healthcareServiceId = typeof rawId === 'object' && rawId._str ? rawId._str : String(rawId);

      tableRows.push(
        <TableRow className="healthcareServiceRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, healthcareServiceId)} hover={true} selected={selected} >
          { renderCheckbox(i) }
          { renderActionIcons(currentHealthcareService) }
          { renderIdentifier(get(currentHealthcareService, "identifier1", "")) }
          { renderName(get(currentHealthcareService, "name", "")) }
          { renderCategory(get(currentHealthcareService, "category", "")) }
          { renderType(get(currentHealthcareService, "type", "")) }
          { renderSpecialty(get(currentHealthcareService, "specialty", "")) }
          { renderLocation(get(currentHealthcareService, "locationDisplay", "")) }
          { renderProvidedBy(get(currentHealthcareService, "providedBy", "")) }
          { renderPhone(get(currentHealthcareService, "phone", "")) }
          { renderEmail(get(currentHealthcareService, "email", "")) }
          { renderActive(get(currentHealthcareService, "active", false)) }
          { renderBarcode(get(currentHealthcareService, "_id", ""))}
          { renderActionButton(get(currentHealthcareService, "_id", "")) }
        </TableRow>
      );
    }
  }


  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table id="healthcareServicesTable" className='healthcareServicesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderNameHeader() }
            { renderCategoryHeader() }
            { renderTypeHeader() }
            { renderSpecialtyHeader() }
            { renderLocationHeader() }
            { renderProvidedByHeader() }
            { renderPhoneHeader() }
            { renderEmailHeader() }
            { renderActiveHeader() }
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


HealthcareServicesTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  healthcareServices: PropTypes.array,
  selectedHealthcareServiceId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideType: PropTypes.bool,
  hideSpecialty: PropTypes.bool,
  hideLocation: PropTypes.bool,
  hideProvidedBy: PropTypes.bool,
  hidePhone: PropTypes.bool,
  hideEmail: PropTypes.bool,
  hideActive: PropTypes.bool,
  hideBarcode: PropTypes.bool,

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
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  labels: PropTypes.object,
  order: PropTypes.string
};

HealthcareServicesTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideName: false,
  hideCategory: false,
  hideType: false,
  hideSpecialty: true,
  hideLocation: false,
  hideProvidedBy: false,
  hidePhone: false,
  hideEmail: false,
  hideActive: false,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,
  healthcareServices: [],
  data: [],
  page: 0,
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false
}

export default HealthcareServicesTable;
