
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
import { FhirDehydrator, flattenDevice } from '../../lib/FhirDehydrator';

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

function DevicesTable(props){
  logger.info('Rendering the DevicesTable');
  
  let { 
    children, 
    id,

    data,
    devices,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideIdentifier,
    hideActionIcons,
    hideDeviceName,
    hideStatus,
    hideMake,
    hideModel,
    hideManufacturer,
    hideSerialNumber,
    hideTypeCodingDisplay,
    hideLotNumber,
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
    count,
    page,
    onSetPage,

    ...otherProps
  } = props;

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
  // Helper Functions

  function removeRecord(_id){
    console.log('removeRecord')
  }
  function rowClick(id){
    console.log('DevicesTable.rowClick', id);
    if(typeof onRowClick === 'function'){
      onRowClick(id);
    }
  }
  function handleActionButtonClick(){
    console.log('handleActionButtonClick')
  }


  //---------------------------------------------------------------------
  // Column Rendering 

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Checkbox</TableCell>
      );
    }
  }
  function renderCheckbox(patientId ){
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
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( device ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, device)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, device._id)} /> */}
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
  function renderTypeDisplay(type){
    if (!hideTypeCodingDisplay) {
      return (
        <TableCell className='type'>{type}</TableCell>
      );
    }
  }
  function renderTypeDisplayHeader(){
    if (!hideTypeCodingDisplay) {
      return (
        <TableCell className='type'>Type</TableCell>
      );
    }
  }
  function renderLotNumber(lotNumber){
    if (!hideLotNumber) {
      return (
        <TableCell className="lotNumber">{lotNumber}</TableCell>
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
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className="status">{status}</TableCell>
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
  function renderManufacturer(manufacturer){
    if (!hideManufacturer) {
      return (
        <TableCell className="manufacturer">{manufacturer}</TableCell>
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
  function renderDeviceName(deviceName){
    if (!hideDeviceName) {
      return (
        <TableCell className="deviceName">{deviceName}</TableCell>
      );
    }
  }
  function renderDeviceNameHeader(){
    if (!hideDeviceName) {
      return (
        <TableCell className="deviceName">Name</TableCell>
      );
    }
  }
  function renderModel(model){
    if (!hideModel) {
      return (
        <TableCell className="model">{model}</TableCell>
      );
    }
  }
  function renderModelHeader(){
    if (!hideModel) {
      return (
        <TableCell className="model">Model</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID
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
  function renderActionButton(device){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, device._id)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let devicesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.devices){
    if(props.devices.length > 0){     
      let count = 0;    

      props.devices.forEach(function(device){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          devicesToRender.push(flattenDevice(device, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer'
  }
  if(devicesToRender.length === 0){
    logger.trace('ConditionsTable: No devices to render.');
    // footer = <TableNoData noDataPadding={ props.noDataMessagePadding } />
  } else {
    for (var i = 0; i < devicesToRender.length; i++) {
      if(get(devicesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      // logger.trace('devicesToRender[i]', devicesToRender[i])
      tableRows.push(
        <TableRow className="deviceRow" key={i} style={{...rowStyle, cursor: 'pointer'}} onClick={ rowClick.bind(this, devicesToRender[i]._id)} hover={true} >            
          { renderCheckbox() }  
          { renderActionIcons() }
          { renderIdentifier(get(devicesToRender[i], 'identifier')) }
          { renderTypeDisplay(get(devicesToRender[i], 'deviceType')) }

          { renderDeviceName(get(devicesToRender[i], 'deviceName')) }
          { renderStatus(get(devicesToRender[i], 'status')) }
          { renderManufacturer(get(devicesToRender[i], 'manufacturer')) }
          { renderModel(get(devicesToRender[i], 'deviceModel')) }

          { renderLotNumber(get(devicesToRender[i], 'lotNumber'))}
          { renderBarcode(devicesToRender[i].id)}
          { renderActionButton(devicesToRender[i]) }
        </TableRow>
      );    
    }
  }



  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table className='devicesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }  
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderTypeDisplayHeader() }
            { renderDeviceNameHeader() }
            { renderStatusHeader() }
            { renderManufacturerHeader() }
            { renderModelHeader() }
            { renderLotNumberHeader() }
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




DevicesTable.propTypes = {
  id: PropTypes.string,

  data: PropTypes.array,
  devices: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideDeviceName: PropTypes.bool,
  hideMake: PropTypes.bool,
  hideModel: PropTypes.bool,
  hideManufacturer: PropTypes.bool,
  hideSerialNumber: PropTypes.bool,
  hideTypeCodingDisplay: PropTypes.bool,
  hideLotNumber: PropTypes.bool,

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
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,

  count: PropTypes.number,
};

DevicesTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideDeviceName: false,
  hideStatus: false,
  hideMake: true,
  hideModel: false,
  hideManufacturer: false,
  hideSerialNumber: false,
  hideTypeCodingDisplay: true,
  hideLotNumber: true,
  hideBarcode: true,
  disablePagination: false,
  hideActionButton: true,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  count: 0
}

export default DevicesTable;
