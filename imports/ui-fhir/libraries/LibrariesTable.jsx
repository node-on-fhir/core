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


//=============================================================================================================================================
// DATA CURSORS

// Import directly to avoid timing issues with Meteor.Collections
import LibrariesSchema from '../../lib/schemas/SimpleSchemas/Libraries';
const { Libraries } = LibrariesSchema;

//===========================================================================
// MAIN COMPONENT

function LibrariesTable(props){
  logger.info('Rendering the LibrariesTable');

  let { 
    id,
    children, 

    data,
    libraries,
    selectedLibraryId,

    query = [],
    paginationLimit,

    disablePagination,  
    hideCheckbox = true,
    hideActionIcons = true,
    hideIdentifier = true,
    hideTitle = false,
    hideBarcode = false,
    hideTextIcon = true,
    defaultCheckboxValue = false,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage = 5,
    tableRowSize = "medium",
    dateFormat = "YYYY-MM-DD hh:mm:ss",
    showMinutes,
    hideEnteredInError,
    formFactorLayout,
    count,
    labels = {
      checkbox: "Checkbox",
      snomedDisplay: "SNOMED Display",
      snomedCode: "SNOMED Code"
    },


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
        hidePatientName = true;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = true;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = true;
        hideLibrary = true;
        hideDates = true;
        hideEndDate = true;
        hideBarcode = true;  
        multiline = true;
        hideTextIcon = false
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientName = false;
        hidePatientReference = true;
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideLibrary = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;   
        multiline = false;
        hideTextIcon = false
        hideTextIcon = false
        break;
      case "web":
        hideClinicalStatus = true;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hidePatientName = false;
        hideVerification = true;
        hideSeverity = true;
        hideLibrary = true;
        hideDates = true;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = false
        break;
      case "desktop":
        hideClinicalStatus = true;
        hidePatientName = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = true;
        hideSeverity = true;
        hideLibrary = true;
        hideDates = false;
        hideEndDate = true;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideClinicalStatus = false;
        hideSnomedCode = false;
        hideSnomedDisplay = false;
        hideVerification = false;
        hideSeverity = false;
        hideLibrary = false;
        hideDates = false;
        hideEndDate = false;
        hideBarcode = false;
        multiline = false;
        hideTextIcon = true;
        break;            
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(libraries)){
    // if(!hasInitializedAutoColumns){
    //   let columnHasData = {
    //     identifier: false,
    //     patientName: false,
    //     patientReference: false,
    //     asserterName: false,
    //     clinicalStatus: false,
    //     snomedCode: false,
    //     snomedDisplay: false,
    //     verification: false,
    //     serverity: false,
    //     library: false,
    //     dates: false,
    //     endDate: false,
    //     barcode: false
    //   }
      
    //   let dehydrateedCollection = libraries.map(function(record){
    //     return dehydrateLibrary(record, "YYYY-MM-DD");
    //   });      
  
    //   dehydrateedCollection.forEach(function(row){
    //     if(get(row, 'id')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'identifier')){
    //       columnHasData.identifier = true;
    //     }
    //     if(get(row, 'clinicalStatus')){
    //       columnHasData.clinicalStatus = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'verificationStatus')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'patientDisplay')){
    //       columnHasData.patientName = true;
    //     }
    //     if(get(row, 'patientReference')){
    //       columnHasData.patientReference = true;
    //     }
    //     if(get(row, 'severity')){
    //       columnHasData.severity = true;
    //     }
    //     if(get(row, 'snomedCode')){
    //       columnHasData.snomedCode = true;
    //     }
    //     if(get(row, 'snomedDisplay')){
    //       columnHasData.snomedDisplay = true;
    //     }
    //     if(get(row, 'libraryDisplay')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'library')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'onsetDateTime')){
    //       columnHasData.dates = true;
    //     }
    //     if(get(row, 'abatementDateTime')){
    //       columnHasData.endDate = true;
    //     }
    //   })
  
    //   setHasInitializedAutoColumns(true);
    //   setAutoColumns(columnHasData)
    // }
  //}


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
            defaultChecked={defaultCheckboxValue}
            onChange={ handleToggle.bind(this, index)} 
          />
        </TableCell>
      );
    }
  }
  function renderTitle(title){
    if (!hideTitle) {
      return (
        <TableCell><span className="title">{title}</span></TableCell>
      );
    }
  }
  function renderTitleHeader(){
    if (!hideTitle) {
      return (
        <TableCell>Title</TableCell>
      );
    }
  }
  function renderTextIconHeader(){
    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon'>Text</TableCell>
      );
    }
  }
  function renderTextIcon(textDiv ){

    let textIcon = "None";
    if((typeof textDiv === "string" && (textDiv.length > 0))){
      textIcon = "Text"
    }

    if (!hideTextIcon) {
      return (
        <TableCell className='textIcon' style={{minWidth: '140px'}}>{ textIcon }</TableCell>
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
  function renderActionIcons( library ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, library)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, library._id)} /> */}
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
  function renderActionButton(libraryId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, libraryId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
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
  let librariesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(libraries){
    if(libraries.length > 0){     
      let count = 0;    

      libraries.forEach(function(library){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          librariesToRender.push(FhirDehydrator.dehydrateLibrary(library, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(librariesToRender.length === 0){
    logger.trace('LibrariesTable: No libraries to render.');
  } else {
    for (var i = 0; i < librariesToRender.length; i++) {
      let selected = false;
      if(librariesToRender[i].id === selectedLibraryId){
        selected = true;
      }
      if(get(librariesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('librariesToRender[i]', librariesToRender[i])

      if(get(librariesToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, librariesToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(librariesToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="libraryRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, librariesToRender[i]._id)} style={rowStyle} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(librariesToRender[i]) }
            { renderTextIcon(get(librariesToRender[i], "text.div", "")) }
            { renderIdentifier(get(librariesToRender[i], "identifier", "")) }
            { renderTitle(get(librariesToRender[i], "title", "")) }
            { renderBarcode(get(librariesToRender[i], "_id", ""))}
            { renderActionButton(get(librariesToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='librariesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }
            { renderTitleHeader() }
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


LibrariesTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  libraries: PropTypes.array,
  selectedLibraryId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,

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


export default LibrariesTable;
