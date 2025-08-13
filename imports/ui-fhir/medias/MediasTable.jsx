// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/medias/MediasTable.jsx

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
import { get, reverse } from 'lodash';

import { FhirUtilities } from '../../lib/FhirUtilities';
import FhirDehydrator from '../../lib/FhirDehydrator';

// Logger definition
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

function MediasTable(props){
  logger.info('Rendering the MediasTable');

  let { 
    id,
    children, 

    data,
    medias,
    selectedMediaId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hidePatientDisplay,
    hidePatientReference,
    hideStatus,
    hideType,
    hideModality,
    hideView,
    hideOperator,
    hideReasonCode,
    hideBodySite,
    hideDevice,
    hideHeight,
    hideWidth,
    hideFrames,
    hideCreated,
    hideIssued,
    hideContent,
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
    formFactorLayout,
    count,
    labels,

    defaultCheckboxValue,

    page,
    onSetPage,
    
    order,

    ...otherProps 
  } = props;


  // ------------------------------------------------------------------------
  // Form Factors
  
  let multiline = false;
  
  // Store the original prop values before form factor overrides
  const hidePatientDisplayFromProp = hidePatientDisplay;
  const hidePatientReferenceFromProp = hidePatientReference;
  const hideBarcodeFromProp = hideBarcode;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientDisplay = true;
        hidePatientReference = true;
        hideStatus = true;
        hideType = true;
        hideModality = true;
        hideView = true;
        hideOperator = true;
        hideReasonCode = true;
        hideBodySite = true;
        hideDevice = true;
        hideHeight = true;
        hideWidth = true;
        hideFrames = true;
        hideCreated = true;
        hideIssued = true;
        hideContent = false;
        hideBarcode = true;  
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideStatus = false;
        hideType = false;
        hideModality = true;
        hideView = true;
        hideOperator = false;
        hideReasonCode = true;
        hideBodySite = true;
        hideDevice = true;
        hideHeight = true;
        hideWidth = true;
        hideFrames = true;
        hideCreated = false;
        hideIssued = true;
        hideContent = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;   
        multiline = false;
        break;
      case "web":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideStatus = false;
        hideType = false;
        hideModality = false;
        hideView = true;
        hideOperator = false;
        hideReasonCode = true;
        hideBodySite = true;
        hideDevice = false;
        hideHeight = true;
        hideWidth = true;
        hideFrames = true;
        hideCreated = false;
        hideIssued = true;
        hideContent = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        multiline = false;
        break;
      case "desktop":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : true;
        hideStatus = false;
        hideType = false;
        hideModality = false;
        hideView = true;
        hideOperator = false;
        hideReasonCode = false;
        hideBodySite = true;
        hideDevice = false;
        hideHeight = false;
        hideWidth = false;
        hideFrames = true;
        hideCreated = false;
        hideIssued = true;
        hideContent = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "hdmi":
        hidePatientDisplay = (hidePatientDisplayFromProp !== undefined) ? hidePatientDisplayFromProp : false;
        hidePatientReference = (hidePatientReferenceFromProp !== undefined) ? hidePatientReferenceFromProp : false;
        hideStatus = false;
        hideType = false;
        hideModality = false;
        hideView = false;
        hideOperator = false;
        hideReasonCode = false;
        hideBodySite = false;
        hideDevice = false;
        hideHeight = false;
        hideWidth = false;
        hideFrames = false;
        hideCreated = false;
        hideIssued = false;
        hideContent = false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;            
    }
  }

  //---------------------------------------------------------------------
  // Helper Functions

  function handleToggle(index){
    console.log('Toggling entry ' + index);
    if(props.onToggle){
      props.onToggle(index);
    }
  }

  function removeRecord(_id){
    console.log('removeRecord');
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(media){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(media)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(media._id)} />   */}
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
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  } 
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className='barcode'>System ID</TableCell>
      );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle both MongoDB ObjectID and string ID
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell className='barcode'>
          <span className="barcode">{idString}</span>
        </TableCell>
      );
    }
  }
  function renderPatientDisplayHeader(){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay'>Patient Name</TableCell>
      );
    }
  }
  function renderPatientDisplay(patientDisplay){
    if (!hidePatientDisplay) {
      return (
        <TableCell className='patientDisplay' style={{minWidth: '140px'}}>{ patientDisplay }</TableCell>
      );
    }
  }
  function renderPatientReferenceHeader(){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference'>Patient Reference</TableCell>
      );
    }
  }
  function renderPatientReference(patientReference){
    if (!hidePatientReference) {
      return (
        <TableCell className='patientReference' style={{minWidth: '140px'}}>{ patientReference }</TableCell>
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
  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return (
        <TableCell className='type'>Type</TableCell>
      );
    }
  }
  function renderType(type){
    if (!hideType) {
      return (
        <TableCell className='type'>{ type }</TableCell>
      );
    }
  }
  function renderModalityHeader(){
    if (!hideModality) {
      return (
        <TableCell className='modality'>Modality</TableCell>
      );
    }
  }
  function renderModality(modality){
    if (!hideModality) {
      return (
        <TableCell className='modality'>{ modality }</TableCell>
      );
    }
  }
  function renderViewHeader(){
    if (!hideView) {
      return (
        <TableCell className='view'>View</TableCell>
      );
    }
  }
  function renderView(view){
    if (!hideView) {
      return (
        <TableCell className='view'>{ view }</TableCell>
      );
    }
  }
  function renderOperatorHeader(){
    if (!hideOperator) {
      return (
        <TableCell className='operator'>Operator</TableCell>
      );
    }
  }
  function renderOperator(operator){
    if (!hideOperator) {
      return (
        <TableCell className='operator' style={{minWidth: '140px'}}>{ operator }</TableCell>
      );
    }
  }
  function renderReasonCodeHeader(){
    if (!hideReasonCode) {
      return (
        <TableCell className='reasonCode'>Reason</TableCell>
      );
    }
  }
  function renderReasonCode(reasonCode){
    if (!hideReasonCode) {
      return (
        <TableCell className='reasonCode' style={{minWidth: '140px'}}>{ reasonCode }</TableCell>
      );
    }
  }
  function renderBodySiteHeader(){
    if (!hideBodySite) {
      return (
        <TableCell className='bodySite'>Body Site</TableCell>
      );
    }
  }
  function renderBodySite(bodySite){
    if (!hideBodySite) {
      return (
        <TableCell className='bodySite'>{ bodySite }</TableCell>
      );
    }
  }
  function renderDeviceHeader(){
    if (!hideDevice) {
      return (
        <TableCell className='device'>Device</TableCell>
      );
    }
  }
  function renderDevice(device){
    if (!hideDevice) {
      return (
        <TableCell className='device' style={{minWidth: '140px'}}>{ device }</TableCell>
      );
    }
  }
  function renderHeightHeader(){
    if (!hideHeight) {
      return (
        <TableCell className='height'>Height</TableCell>
      );
    }
  }
  function renderHeight(height){
    if (!hideHeight) {
      return (
        <TableCell className='height'>{ height }</TableCell>
      );
    }
  }
  function renderWidthHeader(){
    if (!hideWidth) {
      return (
        <TableCell className='width'>Width</TableCell>
      );
    }
  }
  function renderWidth(width){
    if (!hideWidth) {
      return (
        <TableCell className='width'>{ width }</TableCell>
      );
    }
  }
  function renderFramesHeader(){
    if (!hideFrames) {
      return (
        <TableCell className='frames'>Frames</TableCell>
      );
    }
  }
  function renderFrames(frames){
    if (!hideFrames) {
      return (
        <TableCell className='frames'>{ frames }</TableCell>
      );
    }
  }
  function renderCreatedHeader(){
    if (!hideCreated) {
      return (
        <TableCell className='created' style={{minWidth: '140px'}}>Created</TableCell>
      );
    }
  }
  function renderCreated(created){
    if (!hideCreated) {
      return (
        <TableCell className='created' style={{minWidth: '140px'}}>{ moment(created).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderIssuedHeader(){
    if (!hideIssued) {
      return (
        <TableCell className='issued' style={{minWidth: '140px'}}>Issued</TableCell>
      );
    }
  }
  function renderIssued(issued){
    if (!hideIssued) {
      return (
        <TableCell className='issued' style={{minWidth: '140px'}}>{ moment(issued).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }
  function renderContentHeader(){
    if (!hideContent) {
      return (
        <TableCell className='content'>Content</TableCell>
      );
    }
  }
  function renderContent(content){
    if (!hideContent) {
      return (
        <TableCell className='content' style={{minWidth: '200px'}}>{ content }</TableCell>
      );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' style={{minWidth: '120px'}}>Action</TableCell>
      );
    }
  }
  function renderActionButton(mediaId){
    if (!hideActionButton) {
      return (
        <TableCell className='actionButton' style={{minWidth: '120px'}}>
          <Button onClick={ handleActionButtonClick.bind(this, mediaId)}>{ get(props, "actionButtonLabel", "Action") }</Button>
        </TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Pagination

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else {
    paginationCount = medias.length;
  }

  const [internalPage, setInternalPage] = useState(0);
  const [internalRowsPerPage, setInternalRowsPerPage] = useState(rowsPerPage);

  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
      count={paginationCount}
      page={page}
      onPageChange={function(event, newPage){
        setInternalPage(newPage);
        if(typeof onSetPage === "function"){
          onSetPage(newPage);
        }
      }}
      rowsPerPage={internalRowsPerPage}
      onRowsPerPageChange={function(event) {
        setInternalRowsPerPage(parseInt(event.target.value, 10));
        setInternalPage(0);
      }}
    />
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let mediasToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(medias){
    if(medias.length > 0){     
      let count = 0;    
      
      // Apply order: if 'descending' or alias 'reverse', reverse the array
      let orderedMedias = medias;
      if(order === 'descending' || order === 'reverse'){
        orderedMedias = reverse([...medias]); // Create a copy and reverse it
      }

      orderedMedias.forEach(function(media){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          mediasToRender.push(FhirDehydrator.flattenMedia(media, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(mediasToRender.length === 0){
    logger.trace('MediasTable: No medias to render.');
  } else {
    for (var i = 0; i < mediasToRender.length; i++) {
      let selected = false;
      if(mediasToRender[i].id === selectedMediaId){
        selected = true;
      }
      if(get(mediasToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('mediasToRender[i]', mediasToRender[i]);

      tableRows.push(
        <TableRow 
          className="mediaRow" 
          key={i} 
          style={rowStyle} 
          onClick={ handleRowClick.bind(this, mediasToRender[i]._id || mediasToRender[i].id)} 
          hover={true} 
          selected={selected} 
        >            
          { renderCheckbox(i) }
          { renderActionIcons(mediasToRender[i]) }
          { renderIdentifier(get(mediasToRender[i], "identifier", "")) }
          { renderPatientDisplay(get(mediasToRender[i], "subjectDisplay", "")) } 
          { renderPatientReference(get(mediasToRender[i], "subjectReference", "")) }           
          { renderStatus(get(mediasToRender[i], "status", ""))}
          { renderType(get(mediasToRender[i], "type", ""))}
          { renderModality(get(mediasToRender[i], "modality", ""))}
          { renderView(get(mediasToRender[i], "view", "")) }
          { renderOperator(get(mediasToRender[i], "operator", "")) }
          { renderReasonCode(get(mediasToRender[i], "reasonCode", "")) }
          { renderBodySite(get(mediasToRender[i], "bodySite", "")) }
          { renderDevice(get(mediasToRender[i], "deviceName", "")) }
          { renderHeight(get(mediasToRender[i], "height", "")) }
          { renderWidth(get(mediasToRender[i], "width", "")) }
          { renderFrames(get(mediasToRender[i], "frames", "")) }
          { renderCreated(get(mediasToRender[i], "created", "")) }
          { renderIssued(get(mediasToRender[i], "issued", "")) }
          { renderContent(get(mediasToRender[i], "contentTitle", "")) }
          { renderBarcode(get(mediasToRender[i], "_id", ""))}
          { renderActionButton(get(mediasToRender[i], "_id", "")) }
        </TableRow>
      );        
    }
  }

  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table className='mediasTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() } 
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderPatientDisplayHeader() }
            { renderPatientReferenceHeader() }
            { renderStatusHeader() }
            { renderTypeHeader() }
            { renderModalityHeader() }
            { renderViewHeader() }
            { renderOperatorHeader() }
            { renderReasonCodeHeader() }
            { renderBodySiteHeader() }
            { renderDeviceHeader() }
            { renderHeightHeader() }
            { renderWidthHeader() }
            { renderFramesHeader() }
            { renderCreatedHeader() }
            { renderIssuedHeader() }
            { renderContentHeader() }
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


MediasTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  medias: PropTypes.array,
  selectedMediaId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hidePatientDisplay: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideModality: PropTypes.bool,
  hideView: PropTypes.bool,
  hideOperator: PropTypes.bool,
  hideReasonCode: PropTypes.bool,
  hideBodySite: PropTypes.bool,
  hideDevice: PropTypes.bool,
  hideHeight: PropTypes.bool,
  hideWidth: PropTypes.bool,
  hideFrames: PropTypes.bool,
  hideCreated: PropTypes.bool,
  hideIssued: PropTypes.bool,
  hideContent: PropTypes.bool,
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
  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string,
  
  order: PropTypes.oneOf(['ascending', 'descending', 'reverse']),

  labels: PropTypes.object
};

MediasTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hidePatientDisplay: false,
  hidePatientReference: true,
  hideStatus: false,
  hideType: false,
  hideModality: false,
  hideView: true,
  hideOperator: false,
  hideReasonCode: true,
  hideBodySite: true,
  hideDevice: false,
  hideHeight: true,
  hideWidth: true,
  hideFrames: true,
  hideCreated: false,
  hideIssued: true,
  hideContent: false,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,  
  medias: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false,
  order: 'ascending'
}

export default MediasTable;