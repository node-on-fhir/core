import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';

import moment from 'moment'
import { get, set } from 'lodash';

import LayoutHelpers from '../../lib/LayoutHelpers';
import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';

//===========================================================================
// THEMING


//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedValueSets', []);


//===========================================================================
// MAIN COMPONENT




function ValueSetsTable(props){
  console.info('Rendering the ValueSetsTable');
  
  // logger.info('Rendering the ValueSetsTable');
  // logger.data('ValueSetsTable.props', {data: props}, {source: "ValueSetsTable.jsx"});

  
  let { 
    children, 
    id,
    
    data,
    valueSets,
    selectedValueSetId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideBarcode,
    hideId,

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

    page,
    onSetPage,

    count,
    multiline,


    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideTitle = false;
        hideDescription = false;        
        hideVersion = false;
        hideStatus = false;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideTitle = false;
        hideDescription = false;        
        hideVersion = false;
        hideStatus = false;
        hideBarcode = false;
        break;
      case "web":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideTitle = false;
        hideDescription = false;        
        hideVersion = false;
        hideStatus = false;
        hideBarcode = false;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideTitle = false;
        hideDescription = false;        
        hideVersion = false;
        hideStatus = false;
        hideBarcode = false;
        break;
      case "videowall":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideTitle = false;
        hideDescription = false;        
        hideVersion = false;
        hideStatus = false;
        hideBarcode = false;s
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
    console.log('Remove valueSet ', _id)
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
            {/* <Checkbox
              defaultChecked={true}
            /> */}
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
  function renderActionIcons(valueSet ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(valueSet)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(valueSet._id)} />   */}
        </TableCell>
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

  function renderId(id){
    if (!hideId) {
      return (
        <TableCell className='id'>{ id }</TableCell>
      );
    }
  }
  function renderIdHeader(){
    if (!hideId) {
      return (
        <TableCell className='id'>Id</TableCell>
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
  let valueSetsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(valueSets){
    if(valueSets.length > 0){              
      let count = 0;    

      valueSets.forEach(function(valueSet){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          valueSetsToRender.push(FhirDehydrator.dehydrateValueSet(valueSet, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(valueSetsToRender.length === 0){
    console.log('No valueSets currently available');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < valueSetsToRender.length; i++) {

      let selected = false;
      if(valueSetsToRender[i].id === selectedValueSetId){
        selected = true;
      }
      if(get(valueSetsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="valueSetRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, valueSetsToRender[i].id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderToggle() }
          { renderActionIcons(valueSetsToRender[i]) }
          { renderId(valueSetsToRender[i].id) }   
          { renderTitle(valueSetsToRender[i].title) }          
          { renderBarcode(valueSetsToRender[i].id)}
        </TableRow>
      );       
    }
  }

  return(
    <div>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderIdHeader() }
            { renderTitleHeader() }
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

ValueSetsTable.propTypes = {
  barcodes: PropTypes.bool,
  valueSets: PropTypes.array,
  selectedValueSetId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,
  dateFormat: PropTypes.string,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideId: PropTypes.bool,

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
  count: PropTypes.number,
};
ValueSetsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideBarcode: true,
  hideId: true,
  selectedValueSetId: '',
  page: 0,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default ValueSetsTable; 