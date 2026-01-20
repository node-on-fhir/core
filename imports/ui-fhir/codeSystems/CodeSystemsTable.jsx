import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox
} from '@mui/material';


import moment from 'moment'
import { get, set } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING




//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedCodeSystems', []);


//===========================================================================
// MAIN COMPONENT



function CodeSystemsTable(props){
  // logger.info('Rendering the CodeSystemsTable');
  
  console.info('Rendering the CodeSystemsTable');
  

  let { 
    children, 

    codeSystems,
    selectedCodeSystemId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideVersion,
    hideName,
    hideTitle,
    hideStatus,
    hideExperimental,
    hideDate,
    hidePublisher,
    hideContact,
    hideDescription,
    hideBarcode,

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

    page,
    onSetPage,

    checklist,
    count,
    multiline,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = false;

        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideStatus = false;
        hideExperimental = false;
        hideDate = false;
        hidePublisher = false;
        hideContact = false;
        hideDescription = false;
        
        hideBarcode = true;
        break;
      case "tablet":
        hideActionIcons = false;
        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideStatus = false;
        hideExperimental = false;
        hideDate = false;
        hidePublisher = false;
        hideContact = false;
        hideDescription = false;
        hideBarcode = true;
        break;
      case "web":
        hideActionIcons = false;
        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideStatus = false;
        hideExperimental = false;
        hideDate = false;
        hidePublisher = false;
        hideContact = false;
        hideDescription = false;
        hideBarcode = true;
        break;
      case "desktop":
        hideActionIcons = false;
        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideStatus = false;
        hideExperimental = false;
        hideDate = false;
        hidePublisher = false;
        hideContact = false;
        hideDescription = false;
        hideBarcode = true;
        break;
      case "videowall":        
        hideActionIcons = false;
        hideVersion = false;
        hideName = false;
        hideTitle = false;
        hideStatus = false;
        hideExperimental = false;
        hideDate = false;
        hidePublisher = false;
        hideContact = false;
        hideDescription = false;
        hideBarcode = true;
        break;            
    }
  }


  // //---------------------------------------------------------------------
  // // Pagination

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
  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(id){
    console.log('Clicking row ' + id)
    if(onRowClick){
      onRowClick(id);
    }
  }

  function removeRecord(_id){
    console.log('Remove codeSystem ', _id)
    if(onRemoveRecord){
      onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof onCellClick === "function"){
      onCellClick(id);
    }
  }
  function handleMetaClick(patient){
    let self = this;
    if(onMetaClick){
      onMetaClick(self, patient);
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
  function renderActionIcons(codeSystem ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(codeSystem)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(codeSystem._id)} />   */}
        </TableCell>
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
        <TableCell className='name'>Name</TableCell>
      );
    }
  }

  function renderTitle(title){
    if (!hideTitle) {
      return (
        <TableCell className='title'>{ title }</TableCell>
      );
    }
  }
  function renderTitleHeader(){
    if (!hideTitle) {
      return (
        <TableCell className='title'>Title</TableCell>
      );
    }
  }

  function renderExperimental(experimental){
    if (!hideExperimental) {
      return (
        <TableCell className='experimental'>{ experimental }</TableCell>
      );
    }
  }
  function renderExperimentalHeader(){
    if (!hideExperimental) {
      return (
        <TableCell className='experimental'>Experimental</TableCell>
      );
    }
  }


  function renderDate(date){
    if (!hideDate) {
      return (
        <TableCell className='date'>{ date }</TableCell>
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
  function renderPublisher(publisher){
    if (!hidePublisher) {
      return (
        <TableCell className='publisher'>{ publisher }</TableCell>
      );
    }
  }
  function renderPublisherHeader(){
    if (!hidePublisher) {
      return (
        <TableCell className='publisher'>Publisher</TableCell>
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
  let codeSystemsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(codeSystems){
    if(codeSystems.length > 0){              
      let count = 0;    

      codeSystems.forEach(function(codeSystem){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          codeSystemsToRender.push(FhirDehydrator.dehydrateCodeSystem(codeSystem, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(codeSystemsToRender.length === 0){
    console.log('No codeSystems to render');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < codeSystemsToRender.length; i++) {

      let selected = false;
      if(codeSystemsToRender[i].id === selectedCodeSystemId){
        selected = true;
      }
      if(get(codeSystemsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="codeSystemRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, codeSystemsToRender[i].id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox() }
          { renderActionIcons(codeSystemsToRender[i]) }
          { renderStatus(codeSystemsToRender[i].status) }

          { renderVersion(codeSystemsToRender[i].version) }
          { renderName(codeSystemsToRender[i].name) }
          { renderTitle(codeSystemsToRender[i].title) }
          { renderExperimental(codeSystemsToRender[i].experimental) }
          { renderDate(codeSystemsToRender[i].date) }
          { renderPublisher(codeSystemsToRender[i].publisher) }

          { renderBarcode(codeSystemsToRender[i].id)}
        </TableRow>
      );       
    }
  }

  return(
    <div>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderStatusHeader() }
            
            { renderVersionHeader() }
            { renderNameHeader() }
            { renderTitleHeader() }
            { renderExperimentalHeader() }
            { renderDateHeader() }
            { renderPublisherHeader() }

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

CodeSystemsTable.propTypes = {
  barcodes: PropTypes.bool,
  codeSystems: PropTypes.array,
  selectedCodeSystemId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,

  hideVersion: PropTypes.bool,
  hideName: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideExperimental: PropTypes.bool,
  hideDate: PropTypes.bool,
  hidePublisher: PropTypes.bool,
  hideContact: PropTypes.bool,
  hideDescription: PropTypes.bool,

  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,
  
  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  tableRowSize: PropTypes.string,

  formFactorLayout: PropTypes.string,
  checklist: PropTypes.bool
};
CodeSystemsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,

  hideVersion: false,
  hideName: false,
  hideTitle: false,
  hideStatus: false,
  hideExperimental: false,
  hideDate: false,
  hidePublisher: false,
  hideContact: false,
  hideDescription: false,

  hideBarcode: true,

  checklist: true,
  selectedCodeSystemId: '',
  rowsPerPage: 5,
  page: 0,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default CodeSystemsTable; 