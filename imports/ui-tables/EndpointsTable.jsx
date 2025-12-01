import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { logger } from '/client/ClientLogger';

import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
} from '@mui/material';


import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import { FhirUtilities } from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';





export function EndpointsTable(props){
  logger.info('Rendering the EndpointsTable');
  logger.data('EndpointsTable.props', {data: props}, {source: "EndpointsTable.jsx"});

  let { 
    children, 
    id,

    data,
    endpoints,
    selectedEndpointId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideStatus,
    hideConnectionType,
    hideName,
    hideVersion,
    hideOrganization,
    hideAddress,
    hideBarcode,
    hideFhirId,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    size,
    appHeight,
    formFactorLayout,
    displayEnteredInError, 

    checklist,
    multiline,

    page,
    onSetPage,
    
    count,

    ...otherProps 
  } = props;

  let rows = [];




  let paginationCount = 101;
  if(props.count){
    paginationCount = props.count;
  } else {
    paginationCount = rows.length;
  }

  //---------------------------------------------------------------------
  // Render Methods


  function rowClick(id){
    // console.log('EndpointsTable.rowClick', id);

    if(props && (typeof props.onRowClick === "function")){
      props.onRowClick(id);
    }
  }
  function renderActionIconsHeader(){
    if (!props.hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(endpoint ){
    if (!props.hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={ onMetaClick.bind(endpoint)}  />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={ removeRecord.bind(endpoint._id)} /> */}
        </TableCell>
      );
    }
  } 




  // ------------------------------------------------------------------------
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
        <TableCell className="toggle" style={{width: '60px'}}>
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
  function renderActionIcons(endpoint ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(endpoint)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(endpoint._id)} />   */}
        </TableCell>
      );
    }
  } 

  function renderFhirId(fhirId){
    if (!hideFhirId) {
      return (
        <TableCell className='fhirId'>{ fhirId }</TableCell>
      );
    }
  }
  function renderFhirIdHeader(){
    if (!hideFhirId) {
      return (
        <TableCell className='fhirId'>FHIR ID</TableCell>
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
  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name'>{ name }</TableCell>
      );
    }
  }
  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell style={{minWidth: '160px'}} className='name'>Name</TableCell>
      );
    }
  }

  function renderConnectionType(connectionType){
    if (!hideConnectionType) {
      return (
        <TableCell className='connectionType'>{ connectionType }</TableCell>
      );
    }
  }
  function renderConnectionTypeHeader(){
    if (!hideConnectionType) {
      return (
        <TableCell style={{minWidth: '140px'}} className='connectionType'>Connection Type</TableCell>
      );
    }
  }
  function renderOrganization(organization, address){
    if (!hideOrganization) {

      // let renderedContent;
      // if(multiline){
      //   renderedContent = <div><b>{organization}</b><br /><a style={{color: 'grey', textDecoration: 'none'}}>{address}</a></div>
      // } else {
      //   renderedContent = <div>{organization}</div>
      // }
      return (
        <TableCell className='organization'>{ organization }</TableCell>
      );
    }
  }
  function renderOrganizationHeader(){
    if (!hideOrganization) {
      return (
        <TableCell className='organization'>Organization</TableCell>
      );
    }
  }
  function renderAddress(address){
    if (!hideAddress) {
      return (
        <TableCell className='address'>{ address }</TableCell>
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
  function renderVersion(version){
    if (!hideVersion) {
      return (
        <TableCell className='version'>{ version }</TableCell>
      );
    }
  }
  function renderVersionHeader(){
    if (!hideVersion) {
      return (
        <TableCell className='version'>Version</TableCell>
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

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let endpointsToRender = [];
  let proceduresToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.internalDateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.endpoints){
    if(props.endpoints.length > 0){     
      let count = 0;    
      props.endpoints.forEach(function(endpoint){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          endpointsToRender.push(FhirDehydrator.dehydrateEndpoint(endpoint, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(endpointsToRender.length === 0){
    logger.trace('EndpointsTable:  No endpoints to render.');
  } else {
    for (var i = 0; i < endpointsToRender.length; i++) {

      let selected = false;
      if(endpointsToRender[i].id === selectedEndpointId){
        selected = true;
      }
      if(get(endpointsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      console.log('endpointsToRender[i]', endpointsToRender[i])

      if(props.multiline){
        tableRows.push(
          <TableRow className="encounterRow" key={i} onClick={ rowClick.bind(this, endpointsToRender[i]._id)} style={{cursor: 'pointer'}} style={rowStyle} hover={true} selected={selected} >
            { renderCheckbox(endpointsToRender[i]) }
            { renderActionIcons(endpointsToRender[i]) }
            { renderFhirId(get(endpointsToRender[i], "id")) }
            { renderStatus(get(endpointsToRender[i], "status")) }
            { renderConnectionType(get(endpointsToRender[i], "connectionType")) }
            { renderVersion(get(endpointsToRender[i], "version")) }
            { renderName(get(endpointsToRender[i], "name")) }
            { renderOrganization(get(endpointsToRender[i], "managingOrganization"), get(endpointsToRender[i], "address")) }
            { renderAddress(get(endpointsToRender[i], "address")) }

            { renderBarcode(get(endpointsToRender[i], "id"))}
          </TableRow>
        );    
      } else {
        tableRows.push(
          <TableRow className="encounterRow" key={i} onClick={ rowClick.bind(this, endpointsToRender[i]._id)} style={{cursor: 'pointer'}} style={rowStyle} hover={true} selected={selected} >            
            { renderCheckbox(endpointsToRender[i]) }
            { renderActionIcons(endpointsToRender[i]) }
            { renderFhirId(get(endpointsToRender[i], "id")) }
            { renderStatus(get(endpointsToRender[i], "status")) }
            { renderConnectionType(get(endpointsToRender[i], "connectionType")) }
            { renderVersion(get(endpointsToRender[i], "version")) }
            { renderName(get(endpointsToRender[i], "name")) }
            { renderOrganization(get(endpointsToRender[i], "managingOrganization"), get(endpointsToRender[i], "address")) }
            { renderAddress(get(endpointsToRender[i], "address")) }

            { renderBarcode(get(endpointsToRender[i], "id"))}
          </TableRow>
        );    
      }
    }
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

  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a dense table" { ...otherProps } >
        <TableHead>
          <TableRow>
          { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderFhirIdHeader() }
            { renderStatusHeader() }
            { renderConnectionTypeHeader() }
            { renderVersionHeader() }
            { renderNameHeader() }
            { renderOrganizationHeader() }
            { renderAddressHeader() }
            { renderBarcodeHeader() }
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

EndpointsTable.propTypes = {
  barcodes: PropTypes.bool,
  endpoints: PropTypes.array,
  selectedEndpointId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideFhirId: PropTypes.bool,

  hideStatus: PropTypes.bool,
  hideConnectionType: PropTypes.bool,
  hideVersion: PropTypes.bool,
  hideName: PropTypes.bool,
  hideOrganization: PropTypes.bool,
  hideAddress: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onSetPage: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  tableRowSize: PropTypes.string,

  multiline: PropTypes.bool,

  formFactorLayout: PropTypes.string,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  size: PropTypes.string,

  page: PropTypes.number,
  count: PropTypes.number
};

// EndpointsTable.defaultProps = {
//   hideBarcode: true,
//   hideSubjects: false,
//   endpoints: [],
//   rowsPerPage: 5,
//   count: 0
// }


export default EndpointsTable; 