// /imports/ui-fhir/lists/ListsTable.jsx

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
// THEMING




//===========================================================================
// MAIN COMPONENT

function ListsTable(props){
  logger.info('Rendering the ListsTable');

  let { 
    id,
    children, 

    data,
    lists,
    selectedListId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideTitle,
    hideStatus,
    hideMode,
    hideCode,
    hideSubject,
    hideSource,
    hideDate,
    hideBarcode,
    hideTextIcon,
  
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
        hideTitle = false;
        hideStatus = true;
        hideMode = true;
        hideCode = true;
        hideSubject = true;
        hideSource = true;
        hideDate = true;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "tablet":
        hideTitle = false;
        hideStatus = false;
        hideMode = true;
        hideCode = false;
        hideSubject = false;
        hideSource = true;
        hideDate = false;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "desktop":
        hideTitle = false;
        hideStatus = false;
        hideMode = false;
        hideCode = false;
        hideSubject = false;
        hideSource = false;
        hideDate = false;
        hideBarcode = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideTitle = false;
        hideStatus = false;
        hideMode = false;
        hideCode = false;
        hideSubject = false;
        hideSource = false;
        hideDate = false;
        hideBarcode = false;
        hideTextIcon = true;
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
            name={`list-${index}`}
            checked={defaultCheckboxValue}
            onChange={handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>{get(labels, 'actionIcons', 'Actions')}</TableCell>
      );
    }
  }
  function renderActionIcons(list ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(list)} />
          <IoMdTrash style={iconStyle} onClick={removeRecord.bind(list._id)} /> */}
        </TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell>
          {/* <ReactBarcode value={id}/> */}
        </TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell>{get(labels, 'barcodes', 'Barcodes')}</TableCell>
      );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{get(labels, 'identifier', 'Identifier')}</TableCell>
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
        <TableCell className='title'>{get(labels, 'title', 'Title')}</TableCell>
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
        <TableCell className='status'>{get(labels, 'status', 'Status')}</TableCell>
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
  function renderModeHeader(){
    if (!hideMode) {
      return (
        <TableCell className='mode'>{get(labels, 'mode', 'Mode')}</TableCell>
      );
    }
  }
  function renderCode(code){
    if (!hideCode) {
      return (
        <TableCell className='code'>{ code }</TableCell>
      );
    }
  }
  function renderCodeHeader(){
    if (!hideCode) {
      return (
        <TableCell className='code'>{get(labels, 'code', 'Code')}</TableCell>
      );
    }
  }
  function renderSubject(subject){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{ subject }</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='subject'>{get(labels, 'subject', 'Subject')}</TableCell>
      );
    }
  }
  function renderSource(source){
    if (!hideSource) {
      return (
        <TableCell className='source'>{ source }</TableCell>
      );
    }
  }
  function renderSourceHeader(){
    if (!hideSource) {
      return (
        <TableCell className='source'>{get(labels, 'source', 'Source')}</TableCell>
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
        <TableCell className='date'>{get(labels, 'date', 'Date')}</TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let listsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(lists){
    if(lists.length > 0){     
      let count = 0;    

      listsToRender = lists;

      if(listsToRender.length > 0){
        listsToRender.forEach(function(list){
          if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
            let row = FhirDehydrator.dehydrateList(list);
            
            tableRows.push(
              <TableRow key={count} className="listRow" style={{cursor: 'pointer'}} onClick={ handleRowClick.bind(this, list._id)}>
                { renderCheckbox(count) }
                { renderActionIcons(list) }
                { renderIdentifier(row.identifier) }
                { renderTitle(row.title) }
                { renderStatus(row.status) }
                { renderMode(row.mode) }
                { renderCode(row.code) }
                { renderSubject(row.subject) }
                { renderSource(row.source) }
                { renderDate(row.date) }
                { renderBarcode(row.id) }
              </TableRow>
            )
          }
          count++;
        });
      }
    }
  }

  const handleChangePage = (event, newPage) => {
    if(typeof onSetPage === "function"){
      onSetPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    if(typeof onSetPage === "function"){
      onSetPage(parseInt(event.target.value, 10));
    }
  };

  
  // Render Table
  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderTitleHeader() }
            { renderStatusHeader() }
            { renderModeHeader() }
            { renderCodeHeader() }
            { renderSubjectHeader() }
            { renderSourceHeader() }
            { renderDateHeader() }
            { renderBarcodeHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25, 100]}
        count={count}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
}

ListsTable.propTypes = {
  lists: PropTypes.array,
  selectedListId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideMode: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideSource: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  hideActionButton: PropTypes.bool,

  autoColumns: PropTypes.bool,
  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideEnteredInError: PropTypes.bool,
  formFactorLayout: PropTypes.string,
  labels: PropTypes.object,

  defaultCheckboxValue: PropTypes.bool,

  page: PropTypes.number,
  onSetPage: PropTypes.func
};

ListsTable.defaultProps = {
  rowsPerPage: 5,
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: false,
  hideTitle: false,
  hideStatus: false,
  hideMode: false,
  hideCode: false,
  hideSubject: false,
  hideSource: false,
  hideDate: false,
  hideBarcode: true,
  defaultCheckboxValue: false,
  autoColumns: true,
  rowsPerPageOptions: [5, 10, 25, 100],
  tableRowSize: 'medium',
  page: 0
}

export default ListsTable;