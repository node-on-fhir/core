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
// LOGGER

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
// MAIN COMPONENT


function ResearchStudiesTable(props){
  logger.info('Rendering the ResearchStudiesTable');

  let { 
    id,
    children, 

    data,
    researchStudies = [],
    selectedResearchStudyId,

    query,
    paginationLimit,
    disablePagination = false,
  
    hideCheckbox = true,
    hideActionIcons = true,
    hideIdentifier = true,
    hideTitle = false,
    hidePrincipalInvestigator = false,
    hideStatus = false,
    hidePhase = false,
    hideCategory = false,
    hideFocus = false,
    hideDescription = false,
    hidePeriod = false,
    hideEnrollment = false,
    hideBarcode = false,
    hideTextIcon = true,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton = true,
    actionButtonLabel,
  
    autoColumns,
    rowsPerPage = 5,
    tableRowSize = 'medium',
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

    defaultCheckboxValue = false,

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
        hideTitle = false;
        hidePrincipalInvestigator = true;
        hideStatus = true;
        hidePhase = true;
        hideCategory = true;
        hideFocus = true;
        hideDescription = true;
        hidePeriod = true;
        hideEnrollment = true;
        hideBarcode = true;  
        hideTextIcon = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideTitle = false;
        hidePrincipalInvestigator = false;
        hideStatus = true;
        hidePhase = true;
        hideCategory = true;
        hideFocus = true;
        hideDescription = true;
        hidePeriod = true;
        hideEnrollment = true;
        hideBarcode = false;   
        hideTextIcon = true;
        break;
      case "web":
        hideTitle = false;
        hidePrincipalInvestigator = false;
        hideStatus = false;
        hidePhase = true;
        hideCategory = true;
        hideFocus = true;
        hideDescription = true;
        hidePeriod = true;
        hideEnrollment = true;
        hideBarcode = false;
        hideTextIcon = true;
        break;
      case "desktop":
        hideTitle = false;
        hidePrincipalInvestigator = false;
        hideStatus = false;
        hidePhase = false;
        hideCategory = true;
        hideFocus = true;
        hideDescription = true;
        hidePeriod = true;
        hideEnrollment = true;
        hideBarcode = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideTitle = false;
        hidePrincipalInvestigator = false;
        hideStatus = false;
        hidePhase = false;
        hideCategory = false;
        hideFocus = false;
        hideDescription = false;
        hidePeriod = false;
        hideEnrollment = false;
        hideBarcode = false;
        hideTextIcon = true;
        break;            
    }
  }



  //--------------------------------------------------------------------------------
  // Autocolumns  

    
  // if(Array.isArray(researchStudies)){
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
    //     researchStudy: false,
    //     dates: false,
    //     endDate: false,
    //     barcode: false
    //   }
      
    //   let dehydrateedCollection = researchStudies.map(function(record){
    //     return dehydrateResearchStudy(record, "YYYY-MM-DD");
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
    //     if(get(row, 'researchStudyDisplay')){
    //       columnHasData.barcode = true;
    //     }
    //     if(get(row, 'researchStudy')){
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
  function renderDateHeader(){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>Start</TableCell>
      );
    }
  }
  function renderEndDateHeader(){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>End</TableCell>
      );
    }
  }
  function renderStartDate(startDate ){
    if (!hideDates) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(startDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderEndDate(endDate ){
    if ((!hideDates && !hideEndDate)) {
      return (
        <TableCell className='date' style={{minWidth: '140px'}}>{ moment(endDate).format('YYYY-MM-DD') }</TableCell>
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
  function renderTitleHeader(){
    if (!hideTitle) {
      return (
        <TableCell className='title'>Title</TableCell>
      );
    }
  }
  function renderTitle(title ){
    if (!hideTitle) {
      return (
        <TableCell className='title'>{ title }</TableCell>
      );
    }
  }
  
  function renderPrincipalInvestigatorHeader(){
    if (!hidePrincipalInvestigator) {
      return (
        <TableCell className='principalInvestigator'>Principal Investigator</TableCell>
      );
    }
  }
  function renderPrincipalInvestigator(principalInvestigator ){
    if (!hidePrincipalInvestigator) {
      return (
        <TableCell className='principalInvestigator'>{ principalInvestigator }</TableCell>
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
  function renderStatus(status ){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  
  function renderPhaseHeader(){
    if (!hidePhase) {
      return (
        <TableCell className='phase'>Phase</TableCell>
      );
    }
  }
  function renderPhase(phase ){
    if (!hidePhase) {
      return (
        <TableCell className='phase'>{ phase }</TableCell>
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
  function renderCategory(category ){
    if (!hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );
    }
  }
  
  function renderFocusHeader(){
    if (!hideFocus) {
      return (
        <TableCell className='focus'>Focus</TableCell>
      );
    }
  }
  function renderFocus(focus ){
    if (!hideFocus) {
      return (
        <TableCell className='focus'>{ focus }</TableCell>
      );
    }
  }
  
  function renderDescriptionHeader(){
    if (!hideDescription) {
      return (
        <TableCell className='description'>Description</TableCell>
      );
    }
  }
  function renderDescription(description ){
    if (!hideDescription) {
      return (
        <TableCell className='description'>{ description }</TableCell>
      );
    }
  }
  
  function renderPeriodHeader(){
    if (!hidePeriod) {
      return (
        <TableCell className='period'>Period</TableCell>
      );
    }
  }
  function renderPeriod(period ){
    if (!hidePeriod) {
      return (
        <TableCell className='period'>{ period }</TableCell>
      );
    }
  }
  
  function renderEnrollmentHeader(){
    if (!hideEnrollment) {
      return (
        <TableCell className='enrollment'>Enrollment</TableCell>
      );
    }
  }
  function renderEnrollment(enrollment ){
    if (!hideEnrollment) {
      return (
        <TableCell className='enrollment'>{ enrollment }</TableCell>
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
  function renderActionIcons( researchStudy ){
    if (!hideActionIcons) {

      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={showSecurityDialog.bind(this, researchStudy)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={removeRecord.bind(this, researchStudy._id)} /> */}
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
  function renderActionButton(researchStudyId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, researchStudyId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
    }
  }

  function rowClick(id){
    // Session.set('selectedResearchStudyId', id);
    // Session.set('researchStudyPageTabIndex', 2);
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
  let researchStudiesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(researchStudies){
    if(researchStudies.length > 0){     
      let count = 0;    

      researchStudies.forEach(function(researchStudy){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          researchStudiesToRender.push(FhirDehydrator.dehydrateResearchStudy(researchStudy, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(researchStudiesToRender.length === 0){
    logger.trace('ResearchStudiesTable: No researchStudies to render.');
  } else {
    for (var i = 0; i < researchStudiesToRender.length; i++) {
      let selected = false;
      if(researchStudiesToRender[i].id === selectedResearchStudyId){
        selected = true;
      }
      if(get(researchStudiesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('researchStudiesToRender[i]', researchStudiesToRender[i])

      if(get(researchStudiesToRender[i], "resourceType") === "OperationOutcome"){
        tableRows.push(
          <TableRow 
          className="immunizationRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, researchStudiesToRender[i].id)} 
          hover={true} 
          style={{height: '53px', background: "repeating-linear-gradient( 45deg, rgba(253,184,19, 0.9), rgba(253,184,19, 0.9) 10px, rgba(253,184,19, 0.75) 10px, rgba(253,184,19, 0.75) 20px ), url(http://s3-us-west-2.amazonaws.com/s.cdpn.io/3/old_map_@2X.png)"}} >            
            <TableCell className='actionIcons' style={{width: '100%', whiteSpace: 'nowrap'}}>
              {get(researchStudiesToRender[i], 'issue[0].text', 'OperationOutcome: No data returned.')}
            </TableCell>
            <TableCell className='actionIcons' ></TableCell>
            <TableCell className='actionIcons' ></TableCell>           
          </TableRow>
        ); 
      } else {
        tableRows.push(
          <TableRow className="researchStudyRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, researchStudiesToRender[i]._id)} style={rowStyle} hover={true} selected={selected} >            
            { renderCheckbox(i) }
            { renderActionIcons(researchStudiesToRender[i]) }
            { renderTextIcon(get(researchStudiesToRender[i], "text.div", "")) }
            { renderIdentifier(get(researchStudiesToRender[i], "identifier", "")) }
            { renderTitle(get(researchStudiesToRender[i], "title", "")) }
            { renderPrincipalInvestigator(get(researchStudiesToRender[i], "principalInvestigatorDisplay", "")) }
            { renderStatus(get(researchStudiesToRender[i], "status", "")) }
            { renderPhase(get(researchStudiesToRender[i], "phaseText", "")) }
            { renderCategory(get(researchStudiesToRender[i], "categoryText", "")) }
            { renderFocus(get(researchStudiesToRender[i], "focusDisplay", "")) }
            { renderDescription(get(researchStudiesToRender[i], "description", "")) }
            { renderPeriod(get(researchStudiesToRender[i], "periodText", "")) }
            { renderEnrollment(get(researchStudiesToRender[i], "enrollmentText", "")) } 
            { renderBarcode(get(researchStudiesToRender[i], "_id", ""))}
            { renderActionButton(get(researchStudiesToRender[i], "_id", "")) }
          </TableRow>
        );   
      }

       
    }
  }

  

  //---------------------------------------------------------------------
  // Actual Render Method

  
  return(
    <div id={id} className="tableWithPagination">
      <Table className='researchStudiesTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderIdentifierHeader() }
            { renderTitleHeader() }
            { renderPrincipalInvestigatorHeader() }
            { renderStatusHeader() }
            { renderPhaseHeader() }
            { renderCategoryHeader() }
            { renderFocusHeader() }
            { renderDescriptionHeader() }
            { renderPeriodHeader() }
            { renderEnrollmentHeader() }
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


ResearchStudiesTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  researchStudies: PropTypes.array,
  selectedResearchStudyId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hidePrincipalInvestigator: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePhase: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideFocus: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hidePeriod: PropTypes.bool,
  hideEnrollment: PropTypes.bool,
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


export default ResearchStudiesTable;
