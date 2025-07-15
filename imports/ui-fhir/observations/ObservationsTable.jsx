import React, { useState } from 'react';
import PropTypes from 'prop-types';


import { 
  Checkbox,
  Card,
  CardHeader,
  CardContent,
  Tab, 
  Tabs,
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
let has = _.has;

// import { get, set, has } from 'lodash';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'


//===========================================================================
// THEMING



//===========================================================================
// MAIN COMPONENT


function ObservationsTable(props){
  logger.debug('Rendering the ObservationsTable');
  
  //---------------------------------------------------------------------
  // Properties

  let {
    childen,
    id,

    observations,
    query,
    barcodes,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideCategory,
    hideValue,
    hideUnits,
    hideSubject,
    hideSubjects,
    hideSubjectReference,
    hideEffectiveDateTime,
    hideIssued,
    hideStatus,
    hideCodeValue,
    hideCode,
    hideDevices,
    hideComparator,
    hideTextIcon,
  
    hideNumerator,
    hideDenominator,
    denominatorLabel,
    denominatorCode,
    numeratorLabel,
    numeratorCode,
  
    enteredInError,
    multiline,
    multiComponentValues,
    sampledData,
  
  
    hideBarcode,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    actionButtonLabel,
  
    rowsPerPage,
    tableRowSize,
    dateFormat,
    showMinutes,
    showSeconds,
    count,

    page,
    onSetPage,

    formFactorLayout,

    ...otherProps

  } = props


  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideCategory = true;
        hideValue = false;
        hideUnits = false;
        hideSubject = true;
        hideSubjects = true;
        hideSubjectReference = true;
        hideEffectiveDateTime = true;
        hideIssued = true;
        hideStatus = true;
        hideCodeValue = true;
        hideCode = false;
        hideDevices = true;
        hideComparator = true;
        hideTextIcon = true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideCategory = true;
        hideValue = false;
        hideUnits = false;
        hideSubject = true;
        hideSubjects = true;
        hideSubjectReference = true;
        hideEffectiveDateTime = false;
        hideIssued = false;
        hideStatus = false;
        hideCodeValue = true;
        hideCode = false;
        hideDevices = true;
        hideComparator = true;
        hideTextIcon = true;
        multiline = false;
        break;
      case "web":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideCategory = false;
        hideValue = false;
        hideUnits = false;
        hideSubject = true;
        hideSubjects = true;
        hideSubjectReference = true;
        hideEffectiveDateTime = false;
        hideIssued = false;
        hideStatus = false;
        hideCodeValue = false;
        hideCode = false;
        hideDevices = true;
        hideComparator = true;
        hideTextIcon = true;
        multiline = false;
        break;
      case "desktop":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideCategory = false;
        hideValue = false;
        hideUnits = false;
        hideSubject = true;
        hideSubjects = true;
        hideSubjectReference = true;
        hideEffectiveDateTime = false;
        hideIssued = false;
        hideStatus = false;
        hideCodeValue = false;
        hideCode = false;
        hideDevices = false;
        hideComparator = true;
        hideTextIcon = false;
        multiline = false;
        break;
      case "hdmi":

        break;            
    }
  }



  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(rowsPerPage);

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

  function rowClick(id){
    if(typeof onRowClick === "function"){
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
  function renderActionIcons(observation ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <Icon icon={tag} style={iconStyle} onClick={this.onMetaClick.bind(this, observation)} />
          <Icon icon={iosTrashOutline} style={iconStyle} onClick={this.removeRecord.bind(this, observation._id)} /> */}
        </TableCell>
      );
    }
  } 
  function removeRecord(_id){
    logger.info('Remove observation: ' + _id)
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
  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode helvetica">{id}</span></TableCell>
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
  function renderSubject(id){
    if (!hideSubject) {
      return (
        <TableCell className='name'>{ id }</TableCell>
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
  function renderSubjectReference(id){
    if (!hideSubjectReference) {
      return (
        <TableCell className='subjectReference'>{ id }</TableCell>
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
  function renderDevice(device){
    if (!hideDevices) {
      return (
      <TableCell className='device.display'>{device }</TableCell>
      );
    }    
  }
  function renderDeviceHeader(){
    if (!hideDevices) {
      return (
        <TableCell className='device.display'>Device</TableCell>
      );
    }
  }
  function renderValue(valueString){
    if (!hideValue) {
      return (
        <TableCell className='value'>{ valueString }</TableCell>
      );
    }
  }
  function renderValueHeader(){
    if (!hideValue) {
      return (
        <TableCell className='value'>Value</TableCell>
      );
    }
  }
  function renderUnits(units){
    if (!hideUnits) {
      return (
        <TableCell className='units'>{ units }</TableCell>
      );
    }
  }
  function renderUnitsHeader(){
    if (!hideUnits) {
      return (
        <TableCell className='units'>Units</TableCell>
      );
    }
  }
  function renderCodeValueHeader(){
    if (!hideCodeValue) {
      return (
        <TableCell className='codeValue'>Code Value</TableCell>
      );
    }
  }
  function renderCodeValue(code){
    if (!hideCodeValue) {
      return (
        <TableCell className='codeValue'>{ code }</TableCell>
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
  function renderCode(code, value){
    if (!hideCode) {
      if(multiline){
        return (<TableCell className='code'>
          <span style={{fontWeight: 400}}>{code }</span> <br />
          <span style={{color: 'gray'}}>{ value }</span>
        </TableCell>)
      } else {
        return (
          <TableCell className='category'>{ code }</TableCell>
        );  
      }
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
  function renderValueString(valueString){
    if (!hideValue) {
      return (
        <TableCell className='value'>{ valueString }</TableCell>
      );
    }
  }
  function renderValueStringHeader(){
    if (!hideValue) {
      return (
        <TableCell className='value'>Value</TableCell>
      );
    }
  }
  function renderComparator(comparator){
    if (!hideComparator) {
      return (
        <TableCell className='comparator'>{ comparator }</TableCell>
      );
    }
  }
  function renderComparatorHeader(){
    if (!hideComparator) {
      return (
        <TableCell className='comparator'>Comparator</TableCell>
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
            <Checkbox
              defaultChecked={true}
            />
          </TableCell>
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
  function renderEffectiveDateTimeHeader(){
    if (!hideEffectiveDateTime) {
      return (
        <TableCell className='effectiveDateTime' style={{minWidth: '180px'}}>Performed</TableCell>
      );
    }
  }
  function renderEffectiveDateTime(effectiveDateTime){
    if (!hideEffectiveDateTime) {
      return (
        <TableCell className='effectiveDateTime' style={{minWidth: '180px'}}>{ effectiveDateTime }</TableCell>
      );
    }
  }

  function renderIssuedHeader(){
    if (!hideIssued) {
      return (
        <TableCell className='issued' style={{minWidth: '180px'}}>Issued</TableCell>
      );
    }
  }
  function renderIssued(issued){
    if (!hideIssued) {
      return (
        <TableCell className='issued' style={{minWidth: '180px'}}>{ issued }</TableCell>
      );
    }
  }

  function renderComponentNumerator(numerator){
    if (!hideNumerator) {
      return (
        <TableCell className='numerator'>{ numerator }</TableCell>
      );
    }
  }
  function renderComponentNumeratorHeader(){
    if (!hideNumerator) {
      return (
        <TableCell className='numerator'>{numeratorLabel}</TableCell>
      );
    }
  }
  function renderComponentDenominator(denominator){
    if (!hideDenominator) {
      return (
        <TableCell className='denominator'>{ denominator }</TableCell>
      );
    }
  }
  function renderComponentDenominatorHeader(){
    if (!hideDenominator) {
      return (
        <TableCell className='denominator'>{denominatorLabel}</TableCell>
      );
    }
  }

  function renderSampledPeriod(value){
    if (sampledData) {
      return (
        <TableCell className='sampledPeriod'>{ value }</TableCell>
      );
    }
  }
  function renderSampledPeriodHeader(){
    if (sampledData) {
      return (
        <TableCell className='sampledPeriod'>Sample Rate</TableCell>
      );
    }
  }

  function renderSampledMin(value){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='sampledMin'>{ value }</TableCell>
      );
    }
  }
  function renderSampledMinHeader(){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='sampledMin'>Sample Min</TableCell>
      );
    }
  }
  function renderSampledMax(value){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='sampledMax'>{ value }</TableCell>
      );
    }
  }
  function renderSampledMaxHeader(){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='sampledMax'>Sample Max</TableCell>
      );
    }
  }
  function renderSampledChecksum(value){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='checksum'>{ value }</TableCell>
      );
    }
  }
  function renderSampledChecksumHeader(){
    if (sampledData && !Meteor.isCordova) {
      return (
        <TableCell className='checksum'>Checksum</TableCell>
      );
    }
  }


  let tableRows = [];
  let observationsToRender = [];
  let footer;
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(showSeconds){
    internalDateFormat = "YYYY-MM-DD hh:mm:ss";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(observations){
    if(observations.length > 0){     
      let count = 0;    
      observations.forEach(function(observation){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          observationsToRender.push(FhirDehydrator.dehydrateObservation(
            observation, 
            internalDateFormat, 
            get(props, 'numeratorCode'),
            get(props, 'denominatorCode'),
            get(props, 'multiComponentValues'),
            get(props, 'sampledData')
          ));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    verticalAlign: 'top'
  }

  if(observationsToRender.length === 0){
    logger.trace('ObservationsTable:  No observations to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < observationsToRender.length; i++) {
      if(multiline){
        tableRows.push(
          <TableRow className="observationRow" key={i} onClick={ rowClick.bind(this, observationsToRender[i]._id)} hover={true} style={rowStyle}>
            { renderToggle() }
            { renderActionIcons(observationsToRender[i]) }
            { renderTextIcon(get(observationsToRender[i], "text.div", "")) }
            { renderCategory(get(observationsToRender[i], "category")) }
            { renderCodeValue(get(observationsToRender[i], "codeValue")) }
            { renderCode(get(observationsToRender[i], "codeDisplay"), get(observationsToRender[i], "effectiveDateTime")) }
            { renderValue(get(observationsToRender[i], "valueString"))}
            { renderSubject(get(observationsToRender[i], "subject"))}
            { renderSubjectReference(get(observationsToRender[i], "subjectReference"))}
            { renderStatus(get(observationsToRender[i], "status")) }
            { renderDevice(get(observationsToRender[i], "device"))}
            { renderEffectiveDateTime(get(observationsToRender[i], "effectiveDateTime")) }
            { renderIssued(get(observationsToRender[i], "effectiveDateTime")) }
            { renderComponentNumerator(get(observationsToRender[i], "numerator"))}
            { renderComponentDenominator(get(observationsToRender[i], "denominator"))}

            { renderSampledPeriod(get(observationsToRender[i], "sampledPeriod"))}
            { renderSampledMin(get(observationsToRender[i], "sampledMin"))}
            { renderSampledMax(get(observationsToRender[i], "sampledMax"))}
            { renderSampledChecksum(get(observationsToRender[i], "sampledChecksum"))}

            { renderBarcode(get(observationsToRender[i], "id"))}
          </TableRow>
        );    

      } else {
        tableRows.push(
          <TableRow className="observationRow" key={i} onClick={ rowClick.bind(this, observationsToRender[i].id)} hover={true} style={rowStyle}>            
            { renderToggle() }
            { renderActionIcons(observationsToRender[i]) }
            { renderTextIcon(get(observationsToRender[i], "text.div", "")) }
            { renderCategory(get(observationsToRender[i], "category")) }
            { renderCodeValue(get(observationsToRender[i], "codeValue")) }
            { renderCode(get(observationsToRender[i], "codeDisplay")) }
            { renderValue(get(observationsToRender[i], "valueString"))}
            { renderSubject(get(observationsToRender[i], "subject"))}
            { renderSubjectReference(get(observationsToRender[i], "subjectReference"))}
            { renderStatus(get(observationsToRender[i], "status")) }
            { renderDevice(get(observationsToRender[i], "device"))}
            { renderEffectiveDateTime(get(observationsToRender[i], "effectiveDateTime")) }
            { renderIssued(get(observationsToRender[i], "effectiveDateTime")) }
            { renderComponentNumerator(get(observationsToRender[i], "numerator"))}
            { renderComponentDenominator(get(observationsToRender[i], "denominator"))}

            { renderSampledPeriod(get(observationsToRender[i], "sampledPeriod"))}
            { renderSampledMin(get(observationsToRender[i], "sampledMin"))}
            { renderSampledMax(get(observationsToRender[i], "sampledMax"))}
            { renderSampledChecksum(get(observationsToRender[i], "sampledChecksum"))}

            { renderBarcode(get(observationsToRender[i], "id"))}
          </TableRow>
        );    
      }
    }
  }


  let paginationFooter;
  if(!disablePagination){
    paginationFooter = <TablePagination
      component="div"
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
      <Table id="observationsTable" size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow key='tableHeader'>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderTextIconHeader() }
            { renderCategoryHeader() }
            { renderCodeValueHeader() }
            { renderCodeHeader() }
            { renderValueHeader() }
            { renderSubjectHeader() }
            { renderSubjectReferenceHeader() }
            { renderStatusHeader() }
            { renderDeviceHeader() }
            { renderEffectiveDateTimeHeader() }
            { renderIssuedHeader() }
            { renderComponentNumeratorHeader()}
            { renderComponentDenominatorHeader()}

            { renderSampledPeriodHeader()}
            { renderSampledMinHeader()}
            { renderSampledMaxHeader()}
            { renderSampledChecksumHeader()}

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

ObservationsTable.propTypes = {
  id: PropTypes.string,

  observations: PropTypes.array,
  query: PropTypes.object,
  
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideValue: PropTypes.bool,
  hideUnits: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideSubjects: PropTypes.bool,
  hideSubjectReference: PropTypes.bool,
  hideEffectiveDateTime: PropTypes.bool,
  hideIssued: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideCodeValue: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideDevices: PropTypes.bool,
  hideComparator: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideTextIcon: PropTypes.bool,

  hideNumerator: PropTypes.bool,
  hideDenominator: PropTypes.bool,
  denominatorLabel: PropTypes.string,
  denominatorCode: PropTypes.string,
  numeratorLabel: PropTypes.string,
  numeratorCode: PropTypes.string,

  enteredInError: PropTypes.bool,
  multiline: PropTypes.bool,
  multiComponentValues: PropTypes.bool,
  sampledData: PropTypes.bool,  

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,

  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  showSeconds: PropTypes.bool,
  tableRowSize: PropTypes.string,
  noDataMessagePadding: PropTypes.string,

  page: PropTypes.number,
  count: PropTypes.number,
  formFactorLayout: PropTypes.string
};
ObservationsTable.defaultProps = {
  tableRowSize: 'medium',
  page: 0,
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideCategory: true,
  hideBarcode: true,
  hideActionIcons: true,
  hideNumerator: true,
  hideDenominator: true,
  hideDevices: true,
  hideCode: false,
  hideCodeValue: false,
  hideEffectiveDateTime: true,
  hideIssued: true,
  hideIssued: false,
  hideTextIcon: true,
  sampledData: false,
  hideUnits: false,
  multiline: true,
  numeratorLabel: "Systolic",
  denominatorLabel: "Diastolic",
  numeratorCode: "8480-6",
  denominatorCode: "8462-4",
  multiComponentValues: false
}


export default ObservationsTable; 