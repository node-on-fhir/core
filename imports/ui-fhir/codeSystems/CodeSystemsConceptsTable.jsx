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
import { get, set, filter } from 'lodash';

import FhirUtilities from '../../lib/FhirUtilities';
import { FhirDehydrator } from '../../lib/FhirDehydrator';


//===========================================================================
// THEMING



//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedCodeSystems', []);




// function dehydrateCodeSystemConcepts(concepts){
//   let result = {
//     display: "",
//     definition: ""
//   };

//   if(Array.isArray(concepts)){
//     concepts.forEach(function(concept){
      
//     })
//   }

//   return result;
// }

//===========================================================================
// MAIN COMPONENT



function CodeSystemsConceptsTable(props){
  logger.info('Rendering the CodeSystemsConceptsTable');

  let { 
    children, 

    codeSystem,
    selectedCodeSystemId,
    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideDisplay,
    hideDefinition,
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
    searchText,

    ...otherProps 
  } = props;

  console.log('codeSystem', codeSystem)


  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = false;
        hideDisplay = false;
        hideDefinition = false;
        hideBarcode = true;
        break;
      case "tablet":
        hideActionIcons = false;
        hideDisplay = false;
        hideDefinition = false;
        hideBarcode = true;
        break;
      case "web":
        hideActionIcons = false;
        hideDisplay = false;
        hideDefinition = false;
        hideBarcode = true;
        break;
      case "desktop":
        hideActionIcons = false;
        hideDisplay = false;
        hideDefinition = false;
        hideBarcode = true;
        break;
      case "videowall":        
        hideActionIcons = false;
        hideDisplay = false;
        hideDefinition = false;
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

  function handleRowClick(concept){
    // console.log('Clicking row ' + concept)
    if(onRowClick){
      onRowClick(concept);
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
  // function renderActionIconsHeader(){
  //   if (!hideActionIcons) {
  //     return (
  //       <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
  //     );
  //   }
  // }
  // function renderActionIcons(codeSystem ){
  //   if (!hideActionIcons) {
  //     let iconStyle = {
  //       marginLeft: '4px', 
  //       marginRight: '4px', 
  //       marginTop: '4px', 
  //       fontSize: '120%'
  //     }

  //     return (
  //       <TableCell className='actionIcons' style={{minWidth: '120px'}}>
  //         {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(codeSystem)} />
  //         <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(codeSystem._id)} />   */}
  //       </TableCell>
  //     );
  //   }
  // } 

  function renderDisplay(display){
    if (!hideDisplay) {
      return (
        <TableCell className='display'>{ display }</TableCell>
      );
    }
  }
  function renderDisplayHeader(){
    if (!hideDisplay) {
      return (
        <TableCell className='display'>Display</TableCell>
      );
    }
  }

  function renderDefinition(definition){
    if (!hideDefinition) {
      return (
        <TableCell className='definition'>{ definition }</TableCell>
      );
    }
  }
  
  function renderDefinitionHeader(){
    if (!hideDefinition){
      return (
        <TableCell className='definition'>Definition</TableCell>        
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
  let conceptsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  let concepts = get(codeSystem, 'concept');

  if(concepts){
    console.log('concepts', concepts)
    if(concepts.length > 0){              
      let count = 0;    

      concepts.forEach(function(concept){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          conceptsToRender.push({
            code: get(concept, 'code'),
            display: get(concept, 'display'),
            definition: get(concept, 'definition')
          })
        }
        count++;
      });  
    }
  }

  if(searchText){
    console.log('searchText', searchText)
    conceptsToRender = filter(conceptsToRender, function(ctr){
      return ctr.display.includes(searchText)
    })  
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(conceptsToRender.length === 0){
    console.log('No codeSystems to render');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < conceptsToRender.length; i++) {

      let selected = false;
      if(conceptsToRender[i].id === selectedCodeSystemId){
        selected = true;
      }
      if(get(conceptsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="codeSystemRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, conceptsToRender[i])} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox() }
          { renderDisplay(conceptsToRender[i].display) }
          { renderDefinition(conceptsToRender[i].definition) }
          { renderBarcode(conceptsToRender[i].id)}
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

            { renderDisplayHeader() }
            { renderDefinitionHeader() }

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

CodeSystemsConceptsTable.propTypes = {
  barcodes: PropTypes.bool,
  codeSystem: PropTypes.object,
  selectedCodeSystemId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideDisplay: PropTypes.bool,
  hideDefinition: PropTypes.bool,
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
  checklist: PropTypes.bool,

  searchText: PropTypes.string
};
CodeSystemsConceptsTable.defaultProps = {
  hideCheckbox: true,
  hideDisplay: false,
  hideDefinition: false,
  hideBarcode: true,

  checklist: true,
  selectedCodeSystemId: '',
  rowsPerPage: 10,
  page: 0,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export',
  codeSystem: {
    referenceType: "CodeSystem"
  },
  searchText: ''
}

export default CodeSystemsConceptsTable; 