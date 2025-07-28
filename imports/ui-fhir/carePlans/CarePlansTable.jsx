// /imports/ui-fhir/carePlans/CarePlansTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { 
  Checkbox, 
  Table, 
  TableRow, 
  TableCell,
  TableBody,
  TableHead,
  TablePagination
} from '@mui/material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get } from 'lodash';

import moment from 'moment';

// import { Icon } from 'react-icons-kit'
// import { tag } from 'react-icons-kit/fa/tag'
// import {iosTrashOutline} from 'react-icons-kit/ionicons/iosTrashOutline'

import { FhirUtilities } from '../../lib/FhirUtilities';

import { FhirDehydrator } from '../../lib/FhirDehydrator';

// Logger setup
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
// THEMING



//===========================================================================
// SESSION VARIABLES

Session.setDefault('selectedCarePlans', []);


//===========================================================================
// MAIN COMPONENT


function CarePlansTable(props){
  logger.debug('Rendering the CarePlansTable');
  
  const navigate = useNavigate();
  
  // logger.data('CarePlansTable.props', {data: props}, {source: "CarePlansTable.jsx"});

  let { 
    children, 
    id,

    carePlans,
    selectedCarePlanId,
    dateFormat,
    showMinutes,

    hideCheckboxes,
    hideIdentifier,
    hideActionIcons,
    hideSubject,
    hideAuthor,
    hideTitle,
    hideActivities,
    hideGoals,
    hideAddresses,
    hideCategory,
    hideTemplate,
    hideCreated,
    hideStatus,
    hideBarcode,

    onRowClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,

    query,
    paginationLimit,
    disablePagination,
    rowsPerPage,
    tableRowSize,

    count,
    formFactorLayout,

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
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideSubject = true;
        hideAuthor = true;
        hideTitle = false;
        hideActivities = true;
        hideGoals = true;
        hideAddresses = true;
        hideCategory = true;
        hideTemplate = true;
        hideCreated = false;
        hideStatus = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideSubject = true;
        hideAuthor = true;
        hideTitle = false;
        hideActivities = true;
        hideGoals = true;
        hideAddresses = true;
        hideCategory = true;
        hideTemplate = true;
        hideCreated = false;
        hideStatus = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideSubject = true;
        hideAuthor = false;
        hideTitle = false;
        hideActivities = false;
        hideGoals = false;
        hideAddresses = true;
        hideCategory = false;
        hideTemplate = true;
        hideCreated = false;
        hideStatus = false;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckboxes = true;
        hideIdentifier = true;
        hideActionIcons = true;
        hideSubject = false;
        hideAuthor = false;
        hideTitle = false;
        hideActivities = false;
        hideGoals = false;
        hideAddresses = false;
        hideCategory = false;
        hideTemplate = false;
        hideCreated = false;
        hideStatus = false;
        hideBarcode = false;
        break;
      case "videowall":
        hideCheckboxes = false;
        hideIdentifier = false;
        hideActionIcons = false;
        hideSubject = false;
        hideAuthor = false;
        hideTitle = false;
        hideActivities = false;
        hideGoals = false;
        hideAddresses = false;
        hideCategory = false;
        hideTemplate = false;
        hideCreated = false;
        hideStatus = false;
        hideBarcode = false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions


  function handleRowClick(_id){
    // console.log('Clicking row ' + _id)
    if(onRowClick){
      onRowClick(_id);
    }
  }

  function removeRecord(_id){
    logger.info('Remove measureReport: ' + _id)
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
    if (!hideCheckboxes) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderToggle(){
    if (!hideCheckboxes) {
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
  function renderActionIcons(measureReport ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(measureReport)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(measureReport._id)} />   */}
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
  function renderSubjectHeader(){
    if (!hideSubject) {
      return (
        <TableCell className='patientDisplay'>Patient</TableCell>
      );
    }
  }
  function renderSubject(subject ){
    if (!hideSubject) {
      return (
        <TableCell className='subject' style={{minWidth: '140px'}}>{ subject }</TableCell>
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
        <TableCell className='title' >{ title }</TableCell>
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
        <TableCell className='author' >{ author }</TableCell>
      );
    }
  }

  function renderCreatedHeader(){
    if (!hideCreated) {
      return (
        <TableCell className='created'>Created</TableCell>
      );
    }
  }
  function renderCreated(createdDate ){
    if (!hideCreated) {
      return (
        <TableCell className='created'>{ moment(createdDate).format('YYYY-MM-DD') }</TableCell>
      );
    }
  }

  function renderCategory(category){
    if (!hideCategory) {
      return (
        <TableCell className="category">{category}</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className="category">Category</TableCell>
      );
    }
  }
  function renderActivities(activities){
    if (!hideActivities) {
      return (
        <TableCell className="activities">{activities}</TableCell>
      );
    }
  }
  function renderActivitiesHeader(){
    if (!hideActivities) {
      return (
        <TableCell className="activities">Activities</TableCell>
      );
    }
  }
  function renderGoals(goals){
    if (!hideGoals) {
      return (
        <TableCell className="goals">{goals}</TableCell>
      );
    }
  }
  function renderGoalsHeader(){
    if (!hideGoals) {
      return (
        <TableCell className="goals">Goals</TableCell>
      );
    }
  }
  function renderAddresses(addresses){
    if (!hideAddresses) {
      return (
        <TableCell className="addresses">{addresses}</TableCell>
      );
    }
  }
  function renderAddressesHeader(){
    if (!hideAddresses) {
      return (
        <TableCell className="addresses">Addresses</TableCell>
      );
    }
  }

  function renderStatus(status){
    if (!hideStatus) {
      return (
        <TableCell><span className="status">{status}</span></TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return (
        <TableCell className="status">Status</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!hideBarcode) {
      return (
        <TableCell><span className="barcode">{id}</span></TableCell>
      );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return (
        <TableCell className="barcode">System ID</TableCell>
      );
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
  let carePlansToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(internalDateFormat){
    internalDateFormat = dateFormat;
  }

  if(carePlans){
    if(carePlans.length > 0){              
      let count = 0;  

      carePlans.forEach(function(carePlan){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          carePlansToRender.push(FhirDehydrator.dehydrateCarePlan(carePlan));
        }
        count++;
      }); 
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }


  if(carePlansToRender.length === 0){
    logger.trace('CarePlansTable:  No carePlans to render.');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < carePlansToRender.length; i++) {
      let selected = false;
      if(carePlansToRender[i]._id === selectedCarePlanId){
        selected = true;
      }
      if(get(carePlansToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      tableRows.push(
        <TableRow className="carePlanRow" key={i} onClick={ handleRowClick.bind(this, carePlansToRender[i]._id)} hover={true} style={rowStyle} selected={selected} >            
          { renderToggle() }
          { renderActionIcons(carePlansToRender[i]) }
          { renderTitle( carePlansToRender[i].title ) } 
          { renderSubject( carePlansToRender[i].subject ) } 
          { renderCategory( carePlansToRender[i].category ) } 

          { renderIdentifier(carePlansToRender[i].identifier)}
          
          { renderAuthor( carePlansToRender[i].author ) } 

          { renderActivities( carePlansToRender[i].activities ) } 
          { renderGoals( carePlansToRender[i].goals ) } 
          { renderAddresses( carePlansToRender[i].addresses ) } 

          { renderCreated(carePlansToRender[i].recorded) }
          { renderStatus(carePlansToRender[i].status) }
          
          { renderBarcode(carePlansToRender[i]._id)}
        </TableRow>
      );    
    }
  }

  return(
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderToggleHeader() }
            { renderActionIconsHeader() }
            { renderTitleHeader() }
            { renderSubjectHeader() }
            { renderCategoryHeader() }

            { renderIdentifierHeader() }
            { renderAuthorHeader() }

            { renderActivitiesHeader() }
            { renderGoalsHeader() }
            { renderAddressesHeader() }

            { renderCreatedHeader() }            
            { renderStatusHeader() }            
  
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



CarePlansTable.propTypes = {
  barcodes: PropTypes.bool,
  carePlans: PropTypes.array,
  selectedCarePlanId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,

  hideCheckboxes: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideSubject: PropTypes.bool,
  hideAuthor: PropTypes.bool,
  hideTitle: PropTypes.bool,
  hideActivities: PropTypes.bool,
  hideGoals: PropTypes.bool,
  hideAddresses: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideTemplate: PropTypes.bool,
  hideCreated: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,

  page: PropTypes.number,
  actionButtonLabel: PropTypes.string,
  showActionButton: PropTypes.bool,

  count: PropTypes.number,
  tableRowSize: PropTypes.string,
  formFactorLayout: PropTypes.string
};

CarePlansTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckboxes: true,
  hideActionIcons: true,
  hideIdentifier: false,
  hideSubject: false,
  hideAuthor: false,
  hideTitle: false,
  hideActivities: false,
  hideGoals: false,
  hideAddresses: false,
  hideCategory: true,
  hideTemplate: false,
  hideCreated: false,
  hideStatus: false,
  hideBarcode: true,
  carePlans: []
};

export default CarePlansTable;