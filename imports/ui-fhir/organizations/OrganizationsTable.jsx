// /imports/ui-fhir/organizations/OrganizationsTable.jsx

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
import FhirDehydrator from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING

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

function OrganizationsTable(props){
  logger.info('Rendering the OrganizationsTable');

  let {
    id,
    children,

    data,
    organizations,
    selectedOrganizationId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideName,
    hideType,
    hideActive,
    hidePhone,
    hideEmail,
    hideAddressLine,
    hideCity,
    hideState,
    hidePostalCode,
    hideCountry,
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

    order,

    ...otherProps
  } = props;

  // ------------------------------------------------------------------------
  // Store original prop values before form factor overrides
  const hideBarcodeFromProp = hideBarcode;
  const hideAddressLineFromProp = hideAddressLine;
  const hideCityFromProp = hideCity;
  const hideStateFromProp = hideState;
  const hidePostalCodeFromProp = hidePostalCode;
  const hideCountryFromProp = hideCountry;

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
        hideType = true;
        hideActive = true;
        hidePhone = true;
        hideEmail = true;
        hideAddressLine = (hideAddressLineFromProp !== undefined) ? hideAddressLineFromProp : true;
        hideCity = (hideCityFromProp !== undefined) ? hideCityFromProp : true;
        hideState = (hideStateFromProp !== undefined) ? hideStateFromProp : true;
        hidePostalCode = (hidePostalCodeFromProp !== undefined) ? hidePostalCodeFromProp : true;
        hideCountry = (hideCountryFromProp !== undefined) ? hideCountryFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideType = false;
        hideActive = false;
        hidePhone = true;
        hideEmail = true;
        hideAddressLine = (hideAddressLineFromProp !== undefined) ? hideAddressLineFromProp : true;
        hideCity = (hideCityFromProp !== undefined) ? hideCityFromProp : true;
        hideState = (hideStateFromProp !== undefined) ? hideStateFromProp : true;
        hidePostalCode = (hidePostalCodeFromProp !== undefined) ? hidePostalCodeFromProp : true;
        hideCountry = (hideCountryFromProp !== undefined) ? hideCountryFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "web":
        hideName = false;
        hideType = false;
        hideActive = false;
        hidePhone = false;
        hideEmail = false;
        hideAddressLine = (hideAddressLineFromProp !== undefined) ? hideAddressLineFromProp : true;
        hideCity = (hideCityFromProp !== undefined) ? hideCityFromProp : false;
        hideState = (hideStateFromProp !== undefined) ? hideStateFromProp : false;
        hidePostalCode = (hidePostalCodeFromProp !== undefined) ? hidePostalCodeFromProp : true;
        hideCountry = (hideCountryFromProp !== undefined) ? hideCountryFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "desktop":
        hideName = false;
        hideType = false;
        hideActive = false;
        hidePhone = false;
        hideEmail = false;
        hideAddressLine = (hideAddressLineFromProp !== undefined) ? hideAddressLineFromProp : false;
        hideCity = (hideCityFromProp !== undefined) ? hideCityFromProp : false;
        hideState = (hideStateFromProp !== undefined) ? hideStateFromProp : false;
        hidePostalCode = (hidePostalCodeFromProp !== undefined) ? hidePostalCodeFromProp : false;
        hideCountry = (hideCountryFromProp !== undefined) ? hideCountryFromProp : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "hdmi":
        hideName = false;
        hideType = false;
        hideActive = false;
        hidePhone = false;
        hideEmail = false;
        hideAddressLine = (hideAddressLineFromProp !== undefined) ? hideAddressLineFromProp : false;
        hideCity = (hideCityFromProp !== undefined) ? hideCityFromProp : false;
        hideState = (hideStateFromProp !== undefined) ? hideStateFromProp : false;
        hidePostalCode = (hidePostalCodeFromProp !== undefined) ? hidePostalCodeFromProp : false;
        hideCountry = (hideCountryFromProp !== undefined) ? hideCountryFromProp : false;
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

  function removeRecord(_id){
    console.log('removeRecord')
  }
  function handleRowClick(id){
    console.log('OrganizationsTable handleRowClick called with id:', id);
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
      return (
        <TableCell className='name'>Name</TableCell>
      );
    }
  }
  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name' style={{minWidth: '200px'}}>{ name }</TableCell>
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
        <TableCell className='type' style={{minWidth: '140px'}}>{ type }</TableCell>
      );
    }
  }
  function renderActiveHeader(){
    if (!hideActive) {
      return (
        <TableCell className='active'>Active</TableCell>
      );
    }
  }
  function renderActive(active){
    if (!hideActive) {
      return (
        <TableCell className='active'>{ active ? 'Yes' : 'No' }</TableCell>
      );
    }
  }
  function renderPhoneHeader(){
    if (!hidePhone) {
      return (
        <TableCell className='phone'>Phone</TableCell>
      );
    }
  }
  function renderPhone(phone){
    if (!hidePhone) {
      return (
        <TableCell className='phone' style={{minWidth: '140px'}}>{ phone }</TableCell>
      );
    }
  }
  function renderEmailHeader(){
    if (!hideEmail) {
      return (
        <TableCell className='email'>Email</TableCell>
      );
    }
  }
  function renderEmail(email){
    if (!hideEmail) {
      return (
        <TableCell className='email' style={{minWidth: '180px'}}>{ email }</TableCell>
      );
    }
  }
  function renderAddressLineHeader(){
    if (!hideAddressLine) {
      return (
        <TableCell className='addressLine'>Address</TableCell>
      );
    }
  }
  function renderAddressLine(addressLine){
    if (!hideAddressLine) {
      return (
        <TableCell className='addressLine' style={{minWidth: '200px'}}>{ addressLine }</TableCell>
      );
    }
  }
  function renderCityHeader(){
    if (!hideCity) {
      return (
        <TableCell className='city'>City</TableCell>
      );
    }
  }
  function renderCity(city){
    if (!hideCity) {
      return (
        <TableCell className='city' style={{minWidth: '120px'}}>{ city }</TableCell>
      );
    }
  }
  function renderStateHeader(){
    if (!hideState) {
      return (
        <TableCell className='state'>State</TableCell>
      );
    }
  }
  function renderState(state){
    if (!hideState) {
      return (
        <TableCell className='state'>{ state }</TableCell>
      );
    }
  }
  function renderPostalCodeHeader(){
    if (!hidePostalCode) {
      return (
        <TableCell className='postalCode'>Postal Code</TableCell>
      );
    }
  }
  function renderPostalCode(postalCode){
    if (!hidePostalCode) {
      return (
        <TableCell className='postalCode'>{ postalCode }</TableCell>
      );
    }
  }
  function renderCountryHeader(){
    if (!hideCountry) {
      return (
        <TableCell className='country'>Country</TableCell>
      );
    }
  }
  function renderCountry(country){
    if (!hideCountry) {
      return (
        <TableCell className='country'>{ country }</TableCell>
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( organization ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px',
        marginRight: '4px',
        marginTop: '4px',
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
        </TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects (which have _str property)
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
  function renderActionButton(organizationId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, organizationId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedOrganizationId', id);
    // Session.set('organizationPageTabIndex', 2);
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
  let organizationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(organizations){
    if(organizations.length > 0){
      let count = 0;

      organizations.forEach(function(organization){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          organizationsToRender.push(FhirDehydrator.flattenOrganization(organization));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(organizationsToRender.length === 0){
    logger.trace('OrganizationsTable: No organizations to render.');
  } else {
    for (let i = 0; i < organizationsToRender.length; i++) {
      let selected = false;
      if(organizationsToRender[i].id === selectedOrganizationId){
        selected = true;
      }
      if(get(organizationsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('organizationsToRender[i]', organizationsToRender[i])

      const currentOrganization = organizationsToRender[i];
      // Handle MongoDB ObjectID objects (which have _str property)
      const rawId = currentOrganization._id;
      const organizationId = typeof rawId === 'object' && rawId._str ? rawId._str : String(rawId);

      tableRows.push(
        <TableRow className="organizationRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, organizationId)} hover={true} selected={selected} >
          { renderCheckbox(i) }
          { renderActionIcons(currentOrganization) }
          { renderIdentifier(get(currentOrganization, "identifier", "")) }
          { renderName(get(currentOrganization, "name", "")) }
          { renderType(get(currentOrganization, "type", "")) }
          { renderActive(get(currentOrganization, "active", false)) }
          { renderPhone(get(currentOrganization, "phone", "")) }
          { renderEmail(get(currentOrganization, "email", "")) }
          { renderAddressLine(get(currentOrganization, "addressLine", ""))}
          { renderCity(get(currentOrganization, "city", ""))}
          { renderState(get(currentOrganization, "state", ""))}
          { renderPostalCode(get(currentOrganization, "postalCode", ""))}
          { renderCountry(get(currentOrganization, "country", ""))}
          { renderBarcode(get(currentOrganization, "_id", ""))}
          { renderActionButton(get(currentOrganization, "_id", "")) }
        </TableRow>
      );
    }
  }



  //---------------------------------------------------------------------
  // Actual Render Method


  return(
    <div id={id} className="tableWithPagination">
      <Table id="organizationsTable" className='organizationsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderNameHeader() }
            { renderTypeHeader() }
            { renderActiveHeader() }
            { renderPhoneHeader() }
            { renderEmailHeader() }
            { renderAddressLineHeader() }
            { renderCityHeader() }
            { renderStateHeader() }
            { renderPostalCodeHeader() }
            { renderCountryHeader() }
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


OrganizationsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  organizations: PropTypes.array,
  selectedOrganizationId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideType: PropTypes.bool,
  hideActive: PropTypes.bool,
  hidePhone: PropTypes.bool,
  hideEmail: PropTypes.bool,
  hideAddressLine: PropTypes.bool,
  hideCity: PropTypes.bool,
  hideState: PropTypes.bool,
  hidePostalCode: PropTypes.bool,
  hideCountry: PropTypes.bool,
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
  hideEnteredInError: PropTypes.bool,
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,

  labels: PropTypes.object,
  order: PropTypes.string
};

OrganizationsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideName: false,
  hideType: false,
  hideActive: false,
  hidePhone: false,
  hideEmail: false,
  hideAddressLine: true,
  hideCity: false,
  hideState: false,
  hidePostalCode: true,
  hideCountry: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,
  organizations: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false
}

export default OrganizationsTable;
