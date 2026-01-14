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

function DocumentReferencesTable(props){
  logger.info('Rendering the DocumentReferencesTable');

  let { 
    id,
    children, 

    data,
    documentReferences,
    selectedDocumentReferenceId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideMasterIdentifier,
    hideStatus,
    hideDocStatus,
    hideTypeDisplay,
    hideTypeCode,
    hideCategory,
    hideSubjectDisplay,
    hideSubjectReference,
    hideDate,
    hideDescription,
    hideAuthor,
    hideContentTitle,
    hideContentFormat,
    hideContentSize,
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

    ...otherProps 
  } = props;

  // Initialize multiline variable
  let multiline = false;

    // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideMasterIdentifier = true;
        hideStatus = true;
        hideDocStatus = true;
        hideTypeCode = true;
        hideCategory = true;
        hideSubjectDisplay = false;
        hideSubjectReference = true;
        hideDate = true;
        hideDescription = true;
        hideAuthor = true;
        hideContentTitle = false;
        hideContentFormat = true;
        hideContentSize = true;
        hideBarcode = true;  
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideMasterIdentifier = true;
        hideStatus = false;
        hideDocStatus = true;
        hideTypeCode = true;
        hideCategory = true;
        hideSubjectDisplay = false;
        hideSubjectReference = true;
        hideDate = false;
        hideDescription = true;
        hideAuthor = false;
        hideContentTitle = true;
        hideContentFormat = true;
        hideContentSize = true;
        hideBarcode = false;   
        multiline = false;
        break;
      case "web":
        hideStatus = false;
        hideDocStatus = true;
        hideTypeCode = true;
        hideSubjectDisplay = false;
        hideAuthor = false;
        hideContentTitle = true;
        hideContentFormat = true;
        hideContentSize = true;
        hideDate = false;
        hideBarcode = false;
        multiline = false;
        break;
      case "desktop":
        hideStatus = false;
        hideDocStatus = true;
        hideSubjectDisplay = false;
        hideTypeCode = true;
        hideTypeDisplay = false;
        hideAuthor = false;
        hideContentTitle = false;
        hideContentFormat = true;
        hideContentSize = true;
        hideDate = false;
        hideBarcode = false;
        multiline = false;
        break;
      case "hdmi":
        hideStatus = false;
        hideDocStatus = false;
        hideTypeCode = false;
        hideTypeDisplay = false;
        hideSubjectDisplay = false;
        hideAuthor = false;
        hideContentTitle = false;
        hideContentFormat = false;
        hideContentSize = false;
        hideDate = false;
        hideBarcode = false;
        multiline = false;
        break;            
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(documentReferences)){
    // if(!hasInitializedAutoColumns){
    //   let columnHasData = {
    //     identifier: false,
    //     masterIdentifier: false,
    //     status: false,
    //     docStatus: false,
    //     typeDisplay: false,
    //     typeCode: false,
    //     category: false,
    //     subjectDisplay: false,
    //     subjectReference: false,
    //     date: false,
    //     description: false,
    //     author: false,
    //     contentTitle: false,
    //     contentFormat: false,
    //     contentSize: false,
    //     barcode: false
    //   }
      
    //   let dehydrateedCollection = documentReferences.map(function(record){
    //     return dehydrateDocumentReference(record, "YYYY-MM-DD");
    //   });      
  
    //   dehydrateedCollection.forEach(function(row){
    //     if(get(row, 'id')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'identifier')){
    //       columnHasData.identifier = true;
    //     }
    //     if(get(row, 'masterIdentifier')){
    //       columnHasData.masterIdentifier = true;
    //     }
    //     if(get(row, 'status')){
    //       columnHasData.status = true;
    //     }
    //     if(get(row, 'docStatus')){
    //       columnHasData.docStatus = true;
    //     }
    //     if(get(row, 'typeDisplay')){
    //       columnHasData.typeDisplay = true;
    //     }
    //     if(get(row, 'typeCode')){
    //       columnHasData.typeCode = true;
    //     }
    //     if(get(row, 'category')){
    //       columnHasData.category = true;
    //     }
    //     if(get(row, 'subjectDisplay')){
    //       columnHasData.subjectDisplay = true;
    //     }
    //     if(get(row, 'subjectReference')){
    //       columnHasData.subjectReference = true;
    //     }
    //     if(get(row, 'date')){
    //       columnHasData.date = true;
    //     }
    //     if(get(row, 'description')){
    //       columnHasData.description = true;
    //     }
    //     if(get(row, 'author')){
    //       columnHasData.author = true;
    //     }
    //     if(get(row, 'contentTitle')){
    //       columnHasData.contentTitle = true;
    //     }
    //     if(get(row, 'contentFormat')){
    //       columnHasData.contentFormat = true;
    //     }
    //     if(get(row, 'contentSize')){
    //       columnHasData.contentSize = true;
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
  function renderDateHeader(){
    if (!hideDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>Date</TableCell>
      );
    }
  }
  function renderDate(date ){
    if (!hideDate) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(date).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderSubjectDisplayHeader(){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay'>Subject</TableCell>
      );
    }
  }
  function renderSubjectDisplay(subjectDisplay ){
    if (!hideSubjectDisplay) {
      return (
        <TableCell className='subjectDisplay' style={{minWidth: '140px'}}>{ subjectDisplay }</TableCell>
      );
    }
  }
  function renderSubjectReferenceHeader(){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>Subject Reference</TableCell>
      );
    }
  }
  function renderSubjectReference(subjectReference ){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(subjectReference) }
        </TableCell>
      );
    }
  }
  function renderAuthorHeader(){
    if (!hideAuthor) {
      return (
        <TableCell className='author'>Author</TableCell>
      );
    }
  }
  function renderAuthor(author ){
    if (!hideAuthor) {
      return (
        <TableCell className='author' style={{minWidth: '140px'}}>{ author }</TableCell>
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
  function renderMasterIdentifierHeader(){
    if (!hideMasterIdentifier) {
      return (
        <TableCell className='masterIdentifier'>Master Identifier</TableCell>
      );
    }
  }
  function renderMasterIdentifier(masterIdentifier ){
    if (!hideMasterIdentifier) {
      return (
        <TableCell className='masterIdentifier'>{ masterIdentifier }</TableCell>
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
  function renderDocStatus(docStatus){
    if (!hideDocStatus) {
      return (
        <TableCell className='docStatus'>{ docStatus }</TableCell>
      );
    }
  }
  function renderDocStatusHeader(){
    if (!hideDocStatus) {
      return (
        <TableCell className='docStatus'>Doc Status</TableCell>
      );
    }
  }
  function renderTypeCode(typeCode){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode' style={{width: '180px'}}>{ typeCode }</TableCell>
      );
    }
  }
  function renderTypeCodeHeader(){
    if (!hideTypeCode) {
      return (
        <TableCell className='typeCode' style={{width: '180px'}}>{get(labels, 'typeCode', 'Type Code')}</TableCell>
      );
    }
  }
  function renderTypeDisplay(typeDisplay, typeCode){
    if (!hideTypeDisplay) {
      if(multiline){
        return (<TableCell className='typeDisplay'>
          <span style={{fontWeight: 400}}>{typeDisplay }</span> <br />
          <span style={{color: 'gray'}}>{ typeCode }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='typeDisplay' style={{whiteSpace: 'nowrap'}} >{ typeDisplay }</TableCell>
        );  
      }
    }
  }
  function renderTypeDisplayHeader(){
    if (!hideTypeDisplay) {
      return (
        <TableCell className='typeDisplay'>{get(labels, 'typeDisplay', 'Type')}</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className='category' >{ category }</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category' >Category</TableCell>
      );
    }
  }
  function renderDescription(description){
    if (!hideDescription) {
      return (
        <TableCell className='description' >{ description }</TableCell>
      );
    }
  }
  function renderDescriptionHeader(){
    if (!hideDescription) {
      return (
        <TableCell className='description' >Description</TableCell>
      );
    }
  }
  function renderContentTitle(contentTitle){
    if (!hideContentTitle) {
      return (
        <TableCell className='contentTitle' >{ contentTitle }</TableCell>
      );
    }
  }
  function renderContentTitleHeader(){
    if (!hideContentTitle) {
      return (
        <TableCell className='contentTitle' >Content Title</TableCell>
      );
    }
  }
  function renderContentFormat(contentFormat){
    if (!hideContentFormat) {
      return (
        <TableCell className='contentFormat' >{ contentFormat }</TableCell>
      );
    }
  }
  function renderContentFormatHeader(){
    if (!hideContentFormat) {
      return (
        <TableCell className='contentFormat' >Format</TableCell>
      );
    }
  }
  function renderContentSize(contentSize){
    if (!hideContentSize) {
      return (
        <TableCell className='contentSize' >{ contentSize }</TableCell>
      );
    }
  }
  function renderContentSizeHeader(){
    if (!hideContentSize) {
      return (
        <TableCell className='contentSize' >Size</TableCell>
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
  function renderActionIcons( documentReference ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, documentReference)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, documentReference._id)} /> */}
        </TableCell>
      );
    }
  } 

  function renderBarcode(id){
    if (!hideBarcode) {
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
  function renderActionButton(documentReferenceId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, documentReferenceId)}>{ get(props, "actionButtonLabel", "") }</Button>
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
  let documentReferencesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(documentReferences){
    if(documentReferences.length > 0){     
      let count = 0;    

      documentReferences.forEach(function(documentReference){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          documentReferencesToRender.push(FhirDehydrator.dehydrateDocumentReference(documentReference, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(documentReferencesToRender.length === 0){
    logger.trace('DocumentReferencesTable: No document references to render.');
  } else {
    for (var i = 0; i < documentReferencesToRender.length; i++) {
      let selected = false;
      if(documentReferencesToRender[i].id === selectedDocumentReferenceId){
        selected = true;
      }
      if(get(documentReferencesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('documentReferencesToRender[i]', documentReferencesToRender[i])
      
      // Debug ID fields
      if (i === 0) {
        console.log('DocumentReferencesTable - First document IDs:', {
          _id: documentReferencesToRender[i]._id,
          id: documentReferencesToRender[i].id,
          willPassToClick: documentReferencesToRender[i]._id || documentReferencesToRender[i].id
        });
      }

      if(get(documentReferencesToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, documentReferencesToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(documentReferencesToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="documentReferenceRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, documentReferencesToRender[i]._id || documentReferencesToRender[i].id)} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(documentReferencesToRender[i]) }
            { renderIdentifier(get(documentReferencesToRender[i], "identifier", "")) }
            { renderMasterIdentifier(get(documentReferencesToRender[i], "masterIdentifier", "")) }
            { renderSubjectDisplay(get(documentReferencesToRender[i], "subjectDisplay", "")) } 
            { renderSubjectReference(get(documentReferencesToRender[i], "subjectReference", "")) }           
            { renderAuthor(get(documentReferencesToRender[i], "author", "")) } 
            { renderStatus(get(documentReferencesToRender[i], "status", ""))}
            { renderDocStatus(get(documentReferencesToRender[i], "docStatus", ""))}
            { renderTypeCode(get(documentReferencesToRender[i], "typeCode", ""))}
            { renderTypeDisplay(get(documentReferencesToRender[i], "typeDisplay", ""), get(documentReferencesToRender[i], "typeCode", ""))}
            { renderCategory(get(documentReferencesToRender[i], "category", "")) } 
            { renderDescription(get(documentReferencesToRender[i], "description", "")) }
            { renderContentTitle(get(documentReferencesToRender[i], "contentTitle", "")) }
            { renderContentFormat(get(documentReferencesToRender[i], "contentFormat", "")) }
            { renderContentSize(get(documentReferencesToRender[i], "contentSize", "")) }
            { renderDate(get(documentReferencesToRender[i], "date", "")) }
            { renderBarcode(get(documentReferencesToRender[i], "_id", ""))}
            { renderActionButton(get(documentReferencesToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='documentReferencesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderMasterIdentifierHeader() }
            { renderSubjectDisplayHeader() }
            { renderSubjectReferenceHeader() }
            { renderAuthorHeader() }
            { renderStatusHeader() }
            { renderDocStatusHeader() }
            { renderTypeCodeHeader() }
            { renderTypeDisplayHeader() }          
            { renderCategoryHeader() }
            { renderDescriptionHeader() }
            { renderContentTitleHeader() }
            { renderContentFormatHeader() }
            { renderContentSizeHeader() }
            { renderDateHeader() }
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


DocumentReferencesTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  documentReferences: PropTypes.array,
  selectedDocumentReferenceId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideMasterIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideDocStatus: PropTypes.bool,
  hideTypeDisplay: PropTypes.bool,
  hideTypeCode: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideSubjectDisplay: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideDate: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideAuthor: PropTypes.bool,
  hideContentTitle: PropTypes.bool,
  hideContentFormat: PropTypes.bool,
  hideContentSize: PropTypes.bool,
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

  labels: PropTypes.object
};

DocumentReferencesTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideMasterIdentifier: true,
  hideStatus: false,
  hideDocStatus: true,
  hideTypeDisplay: false,
  hideTypeCode: true,
  hideCategory: true,
  hideSubjectDisplay: false,
  hideSubjectReference: true,
  hideDate: false,
  hideDescription: true,
  hideAuthor: false,
  hideContentTitle: false,
  hideContentFormat: true,
  hideContentSize: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  documentReferences: [],
  labels: {
    checkbox: "Checkbox",
    typeDisplay: "Type",
    typeCode: "Type Code"
  },
  defaultCheckboxValue: false
}

export default DocumentReferencesTable;