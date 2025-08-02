
import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Button,
  Card,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableFooter,
  TablePagination,
  IconButton,
  FirstPageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  LastPageIcon
} from '@mui/material';


import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import { FhirUtilities } from '../lib/FhirUtilities';
import { FhirDehydrator } from '../lib/FhirDehydrator';


// //===========================================================================
// // FLATTENING / MAPPING

// dehydrateProcedure = function(procedure, internalDateFormat){
//   let result = {
//     _id: '',
//     id: '',
//     meta: '',
//     identifier: '',
//     status: '',
//     categoryDisplay: '',
//     code: '',
//     codeDisplay: '',
//     subject: '',
//     subjectReference: '',
//     performerDisplay: '',
//     performedStart: '',
//     performedEnd: '',
//     notesCount: '',
//     bodySiteDisplay: ''
//   };

//   if(!internalDateFormat){
//     internalDateFormat = "YYYY-MM-DD";
//   }

//   result._id =  get(procedure, 'id') ? get(procedure, 'id') : get(procedure, '_id');

//   result.id = get(procedure, 'id', '');
//   result.status = get(procedure, 'status', '');
//   result.categoryDisplay = get(procedure, 'category.coding[0].display', '');
//   result.identifier = get(procedure, 'identifier[0].value');
//   result.code = get(procedure, 'code.coding[0].code');
//   result.codeDisplay = get(procedure, 'code.coding[0].display');
//   result.categoryDisplay = get(procedure, 'category.coding[0].display')    

//   if(get(procedure, 'subject')){
//     result.subject = get(procedure, 'subject.display', '');
//     result.subjectReference = get(procedure, 'subject.reference', '');
//   } else if(get(procedure, 'patient')){
//     result.subject = get(procedure, 'patient.display', '');
//     result.subjectReference = get(procedure, 'patient.reference', '');
//   }

//   result.performedStart = moment(get(procedure, 'performedDateTime')).format(internalDateFormat);      
//   result.performerDisplay = moment(get(procedure, 'performer.display')).format(internalDateFormat);
//   result.performerReference = get(procedure, 'performer.reference');
//   result.bodySiteDisplay = get(procedure, 'bodySite.display');

//   if(get(procedure, 'performedPeriod')){
//     result.performedStart = moment(get(procedure, 'performedPeriod.start')).format(internalDateFormat);      
//     result.performedEnd = moment(get(procedure, 'performedPeriod.end')).format(internalDateFormat);      
//   }

//   let notes = get(procedure, 'notes')
//   if(notes && notes.length > 0){
//     result.notesCount = notes.length;
//   } else {
//     result.notesCount = 0;
//   }

//   return result;
// }


export function ProceduresTable(props){
  logger.info('Rendering the ProceduresTable');
  
  let { 
    id,
    children, 

    data,
    procedures,
    selectedProcedureId,
    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox = true,
    hideIdentifier,
    hideActionIcons = true,
    hideCategory = true,
    hideStatus,
    hideSubject,
    hideSubjectReference,
    hidePerformedDate,
    hidePerformedDateEnd,
    hidePerformer,
    hideBodySite = true,
    hideNotes,
    hideCode,
    hideCodeDisplay,
    hideBarcode,
    hideTextIcon = true,
    filterEnteredInError,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,
  
    rowsPerPage = 10,
    tableRowSize = "medium",
    dateFormat,
    showMinutes,
    formFactorLayout,
    count = 0,
    multiline,

    page = 0,
    onSetPage,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideSubject = true;
        hideSubjectReference = true;
        hideCode = true;
        hideStatus = true;
        hidePerformedDate = true;
        hidePerformedDateEnd = true;
        hidePerformer = true;
        hideBodySite = true;
        hideNotes = true;
        multiline = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCode = false;
        hideStatus = false;
        hidePerformedDate = false;
        hidePerformedDateEnd = true;
        hidePerformer = true;
        hideBodySite = true;
        hideNotes = true;
        multiline = false;
        hideBarcode = true;
        break;
      case "web":
        hideCode = false;
        hideStatus = false;
        hidePerformedDate = false;
        hidePerformedDateEnd = true;
        hidePerformer = false;
        hideBodySite = false;
        hideNotes = true;
        multiline = false;
        hideBarcode = true;
        break;
      case "desktop":
        hideCode = false;
        hideStatus = false;
        hidePerformedDate = false;
        hidePerformedDateEnd = false;
        hidePerformer = false;
        hideBodySite = false;
        hideNotes = false;
        multiline = false;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCode = false;
        hideStatus = false;
        hidePerformedDate = false;
        hidePerformedDateEnd = false;
        hidePerformer = false;
        hideBodySite = false;
        hideNotes = false;
        multiline = false;
        hideBarcode = true;
        break;            
    }
  }


  
  //---------------------------------------------------------------------
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

  function handleRowClick(id){
    

    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(procedure ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={ handleMetaClick.bind(procedure)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={ removeRecord.bind(procedure._id)} /> */}
        </TableCell>
      );
    }
  } 
  function handleMetaClick(_id){
    logger.info('Opening metadata for procedure: ' + _id)
    if(onMetaClick){
      onMetaClick(_id);
    }
  }
  function removeRecord(_id){
    logger.info('Remove procedure: ' + _id)
    if(onRemoveRecord){
      onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof onActionButtonClick === "function"){
      onActionButtonClick(id);
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

  function renderBarcode(id){
    if (!hideBarcode) {
      // Ensure id is a string, handle ObjectID case
      let idString = '';
      if(typeof id === 'object' && id !== null){
        if(id._str){
          idString = id._str;
        } else {
          idString = id.toString();
        }
      } else if(id){
        idString = String(id);
      }
      return (
        <TableCell><span className="barcode helvetica">{idString}</span></TableCell>
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
  function renderSubject(name, type, date){
    if (!hideSubject) {
      let result;
      return (
        <TableCell className='name'>{ name }</TableCell>
      );
    }
  }
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='name'>Subject</TableCell>
      );
    }
  }
  function renderSubjectReference(referenceString){
    if (!hideSubjectReference) {
      return (
        <TableCell className='patientReference' style={{maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis',  whiteSpace: 'nowrap'}}>
          { FhirUtilities.pluckReferenceId(referenceString) }
        </TableCell>
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
  function renderStatus(valueString){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ valueString }</TableCell>
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
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category'>Category</TableCell>
      );
    }
  }
  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );
    }
  }
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
  function renderPerformedStartHeader(){
    if (!hidePerformedDate) {
      return (
        <TableCell className='performedStart' style={{minWidth: '140px'}}>Performed</TableCell>
      );
    }
  }
  function renderPerformedStart(performedStart){
    if (!hidePerformedDate) {
      if(typeof performedStart === "object"){
        performedStart = moment(performedStart).format(internalDateFormat);
      }
      return (
        <TableCell className='performedStart' style={{minWidth: '140px'}}>{ performedStart }</TableCell>
      );
    }
  }
  function renderPerformedEndHeader(){
    if (!hidePerformedDateEnd) {
      return (
        <TableCell className='performedEnd' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderPerformedEnd(performedEnd){
    if (!hidePerformedDateEnd) {
      if(typeof performedEnd === "object"){
        performedEnd = moment(performedEnd).format(internalDateFormat);
      }
      return (
        <TableCell className='performedEnd' style={{minWidth: '140px'}}>{ performedEnd }</TableCell>
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
  function renderActionButton(procedure){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(procedure, "id"))}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
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
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }
  function renderCodeHeader(){
    if (!hideCode) {
      return (
        <TableCell className='code'>Code</TableCell>
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
  function renderCodeDisplayHeader(){
    if (!hideCodeDisplay) {
      return (
        <TableCell className='codeDisplay'>Display</TableCell>
      );
    }
  }
  function renderCodeDisplay(codeDisplay, codeValue, date){
    if (!hideCodeDisplay) {
      if(multiline){
        return (<TableCell className='codeDisplay'>
          <span style={{overflowY: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{ codeDisplay }</span><br/>
          <span style={{float: 'left'}}>{ codeValue }</span><span style={{float: 'right'}}>{ date }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='codeDisplay'>{ codeDisplay }</TableCell>
        );  
      }
    }
  }
  function renderNotes(notesCount){
    if (!hideNotes) {
      return (
        <TableCell className='notes'>{ notesCount }</TableCell>
      );
    }
  }
  function renderNotesHeader(){
    if (!hideNotes) {
      return (
        <TableCell className='notes'>Notes</TableCell>
      );
    }
  }
  function renderPerformer(text){
    if (!hidePerformer) {
      return (
        <TableCell className='performer'>{ text }</TableCell>
      );
    }
  }
  function renderPerformerHeader(){
    if (!hidePerformer) {
      return (
        <TableCell className='performer'>Performer</TableCell>
      );
    }
  }
  function renderBodySite(text){
    if (!hideBodySite) {
      return (
        <TableCell className='bodysite'>{ text }</TableCell>
      );
    }
  }
  function renderBodySiteHeader(){
    if (!hideBodySite) {
      return (
        <TableCell className='bodysite'>Body Site</TableCell>
      );
    }
  }


  let tableRows = [];
  let proceduresToRender = [];

  if(procedures){
    if(procedures.length > 0){     
      let count = 0;    
      procedures.forEach(function(procedure){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          proceduresToRender.push(FhirDehydrator.dehydrateProcedure(procedure, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(proceduresToRender.length === 0){
    logger.trace('ProceduresTable:  No procedures to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < proceduresToRender.length; i++) {
      let selected = false;
      if(proceduresToRender[i].id === selectedProcedureId){
        selected = true;
      }
      if(get(proceduresToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      logger.trace('proceduresToRender[i]', proceduresToRender[i]);

      if(get(proceduresToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, proceduresToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(proceduresToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="procedureRow" key={i} onClick={ handleRowClick.bind(this, proceduresToRender[i]._id)} hover={true} style={rowStyle} selected={selected} >            
            { renderToggle() }
            { renderActionIcons(proceduresToRender[i]) }
            { renderTextIcon(get(proceduresToRender[i], "text")) }
            { renderIdentifier(get(proceduresToRender[i], "identifier") ) }
            { renderStatus(get(proceduresToRender[i], "status"))}
            { renderCategory(get(proceduresToRender[i], "categoryDisplay"))}
            { renderCode(get(proceduresToRender[i], "code"))}
            { renderCodeDisplay(get(proceduresToRender[i], "codeDisplay"), get(proceduresToRender[i], "code"), get(proceduresToRender[i], "performedStart"))}          
            { renderSubject(get(proceduresToRender[i], "subject"))}
            { renderSubjectReference(get(proceduresToRender[i], "subjectReference"))}
            { renderPerformer(get(proceduresToRender[i], "performerDisplay"))}
            {/* { renderBodySite()} */}
            { renderPerformedStart(get(proceduresToRender[i], "performedStart"))}
            { renderPerformedEnd(get(proceduresToRender[i], "performedEnd"))}
            { renderNotes(get(proceduresToRender[i], "notesCount"))}
            { renderBarcode(get(proceduresToRender[i], "_id"))}
            { renderActionButton(proceduresToRender[i]) }
          </TableRow>
        );    
      }      
    }
  }



  return(
    <div>
      <Table id="proceduresTable" size={tableRowSize} aria-label="a dense table" { ...otherProps } >
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderCategoryHeader() }
            { renderCodeHeader() }
            { renderCodeDisplayHeader() }
            { renderSubjectHeader() }
            { renderSubjectReferenceHeader() }
            { renderPerformerHeader() }
            {/* { renderBodySiteHeader() } */}
            { renderPerformedStartHeader() }
            { renderPerformedEndHeader() }
            { renderNotesHeader() }
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

ProceduresTable.propTypes = {
  id: PropTypes.string,

  procedures: PropTypes.array,
  selectedProcedureId: PropTypes.string,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hidePerformedDate: PropTypes.bool,
  hidePerformedDateEnd: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hideBodySite: PropTypes.bool,
  hideNotes: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideCodeDisplay: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,
  filterEnteredInError: PropTypes.bool,

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
  count: PropTypes.number,
  multiline: PropTypes.bool,

  formFactorLayout: PropTypes.string
};

export default ProceduresTable;