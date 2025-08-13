// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/locations/LocationsTable.jsx

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

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import { FhirUtilities } from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING




//===========================================================================
// MAIN COMPONENT

function LocationsTable(props){
  logger.info('Rendering the LocationsTable');

  let { 
    id,
    children, 

    data,
    locations,
    selectedLocationId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideName,
    hideType,
    hideStatus,
    hideAddress,
    hideTelecom,
    hideManagingOrganization,
    hidePosition,
    hidePhysicalType,
    hideOperationalStatus,
    hidePartOf,
    hideBarcode,
    hideMode,
  
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
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideType = true;
        hideStatus = true;
        hideAddress = true;
        hideTelecom = true;
        hideManagingOrganization = true;
        hidePosition = true;
        hidePhysicalType = true;
        hideOperationalStatus = true;
        hidePartOf = true;
        hideBarcode = true;
        hideMode = true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideType = false;
        hideStatus = false;
        hideAddress = false;
        hideTelecom = true;
        hideManagingOrganization = true;
        hidePosition = true;
        hidePhysicalType = true;
        hideOperationalStatus = true;
        hidePartOf = true;
        hideBarcode = false;
        hideMode = true;
        multiline = false;
        break;
      case "web":
        hideName = false;
        hideType = false;
        hideStatus = false;
        hideAddress = false;
        hideTelecom = true;
        hideManagingOrganization = false;
        hidePosition = true;
        hidePhysicalType = true;
        hideOperationalStatus = true;
        hidePartOf = true;
        hideBarcode = false;
        hideMode = true;
        multiline = false;
        break;
      case "desktop":
        hideName = false;
        hideType = false;
        hideStatus = false;
        hideAddress = false;
        hideTelecom = false;
        hideManagingOrganization = false;
        hidePosition = true;
        hidePhysicalType = true;
        hideOperationalStatus = true;
        hidePartOf = true;
        hideBarcode = false;
        hideMode = true;
        multiline = false;
        break;
      case "hdmi":
        hideName = false;
        hideType = false;
        hideStatus = false;
        hideAddress = false;
        hideTelecom = false;
        hideManagingOrganization = false;
        hidePosition = false;
        hidePhysicalType = false;
        hideOperationalStatus = false;
        hidePartOf = false;
        hideBarcode = false;
        hideMode = false;
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
    console.log('LocationsTable handleRowClick called with id:', id);
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
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderAddressHeader(){
    if (!hideAddress) {
      return (
        <TableCell className='address'>Address</TableCell>
      );
    }
  }
  function renderAddress(address){
    if (!hideAddress) {
      return (
        <TableCell className='address' style={{minWidth: '200px'}}>{ address }</TableCell>
      );
    }
  }
  function renderTelecomHeader(){
    if (!hideTelecom) {
      return (
        <TableCell className='telecom'>Telecom</TableCell>
      );
    }
  }
  function renderTelecom(telecom){
    if (!hideTelecom) {
      return (
        <TableCell className='telecom' style={{minWidth: '140px'}}>{ telecom }</TableCell>
      );
    }
  }
  function renderManagingOrganizationHeader(){
    if (!hideManagingOrganization) {
      return (
        <TableCell className='managingOrganization'>Managing Organization</TableCell>
      );
    }
  }
  function renderManagingOrganization(managingOrganization){
    if (!hideManagingOrganization) {
      return (
        <TableCell className='managingOrganization' style={{minWidth: '180px'}}>{ managingOrganization }</TableCell>
      );
    }
  }
  function renderPhysicalTypeHeader(){
    if (!hidePhysicalType) {
      return (
        <TableCell className='physicalType'>Physical Type</TableCell>
      );
    }
  }
  function renderPhysicalType(physicalType){
    if (!hidePhysicalType) {
      return (
        <TableCell className='physicalType'>{ physicalType }</TableCell>
      );
    }
  }
  function renderPositionHeader(){
    if (!hidePosition) {
      return (
        <TableCell className='position'>Position</TableCell>
      );
    }
  }
  function renderPosition(latitude, longitude){
    if (!hidePosition) {
      let positionText = '';
      if(latitude && longitude){
        positionText = latitude + ', ' + longitude;
      }
      return (
        <TableCell className='position'>{ positionText }</TableCell>
      );
    }
  }
  function renderOperationalStatusHeader(){
    if (!hideOperationalStatus) {
      return (
        <TableCell className='operationalStatus'>Operational Status</TableCell>
      );
    }
  }
  function renderOperationalStatus(operationalStatus){
    if (!hideOperationalStatus) {
      return (
        <TableCell className='operationalStatus'>{ operationalStatus }</TableCell>
      );
    }
  }
  function renderPartOfHeader(){
    if (!hidePartOf) {
      return (
        <TableCell className='partOf'>Part Of</TableCell>
      );
    }
  }
  function renderPartOf(partOf){
    if (!hidePartOf) {
      return (
        <TableCell className='partOf'>{ partOf }</TableCell>
      );
    }
  }
  function renderModeHeader(){
    if (!hideMode) {
      return (
        <TableCell className='mode'>Mode</TableCell>
      );
    }
  }
  function renderMode(mode){
    if (!hideMode) {
      return (
        <TableCell className='mode'>{ mode }</TableCell>
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
  function renderActionIcons( location ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, location)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, location._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode helveticas">{id}</span></TableCell>
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
  function renderActionButton(locationId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, locationId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedLocationId', id);
    // Session.set('locationPageTabIndex', 2);
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
        // rowsPerPageOptions={[5, 10, 25, 100]}
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
  let locationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(locations){
    if(locations.length > 0){     
      let count = 0;    

      locations.forEach(function(location){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          locationsToRender.push(FhirDehydrator.dehydrateLocation(location, true));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(locationsToRender.length === 0){
    logger.trace('LocationsTable: No locations to render.');
  } else {
    for (var i = 0; i < locationsToRender.length; i++) {
      let selected = false;
      if(locationsToRender[i].id === selectedLocationId){
        selected = true;
      }
      if(get(locationsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('locationsToRender[i]', locationsToRender[i])

      if(get(locationsToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="locationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, locationsToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(locationsToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="locationRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, locationsToRender[i].id || locationsToRender[i]._id)} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(locationsToRender[i]) }
            { renderIdentifier(get(locationsToRender[i], "identifier", "")) }
            { renderName(get(locationsToRender[i], "name", "")) } 
            { renderType(get(locationsToRender[i], "typeDisplay", "")) }           
            { renderStatus(get(locationsToRender[i], "status", "")) } 
            { renderAddress(get(locationsToRender[i], "addressLine", ""))}
            { renderTelecom(get(locationsToRender[i], "telecom", ""))}
            { renderManagingOrganization(get(locationsToRender[i], "managingOrganizationDisplay", ""))}
            { renderPhysicalType(get(locationsToRender[i], "physicalTypeDisplay", "")) } 
            { renderPosition(get(locationsToRender[i], "latitude", ""), get(locationsToRender[i], "longitude", "")) }
            { renderOperationalStatus(get(locationsToRender[i], "operationalStatusDisplay", "")) }
            { renderPartOf(get(locationsToRender[i], "partOfDisplay", "")) }
            { renderMode(get(locationsToRender[i], "mode", "")) }
            { renderBarcode(get(locationsToRender[i], "_id", ""))}
            { renderActionButton(get(locationsToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='locationsTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderNameHeader() }
            { renderTypeHeader() }
            { renderStatusHeader() }
            { renderAddressHeader() }
            { renderTelecomHeader() }
            { renderManagingOrganizationHeader() }          
            { renderPhysicalTypeHeader() }
            { renderPositionHeader() }
            { renderOperationalStatusHeader() }
            { renderPartOfHeader() }
            { renderModeHeader() }
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


LocationsTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  locations: PropTypes.array,
  selectedLocationId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideType: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideAddress: PropTypes.bool,
  hideTelecom: PropTypes.bool,
  hideManagingOrganization: PropTypes.bool,
  hidePosition: PropTypes.bool,
  hidePhysicalType: PropTypes.bool,
  hideOperationalStatus: PropTypes.bool,
  hidePartOf: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideMode: PropTypes.bool,

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

  labels: PropTypes.object
};

LocationsTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideName: false,
  hideType: false,
  hideStatus: false,
  hideAddress: false,
  hideTelecom: true,
  hideManagingOrganization: true,
  hidePosition: true,
  hidePhysicalType: true,
  hideOperationalStatus: true,
  hidePartOf: true,
  hideBarcode: false,
  hideMode: true,
  hideActionButton: true,
  disablePagination: false,  
  locations: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false
}

export default LocationsTable;