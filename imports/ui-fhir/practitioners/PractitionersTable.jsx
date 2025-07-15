// /imports/ui-fhir/practitioners/PractitionersTable.jsx

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

function PractitionersTable(props){
  logger.info('Rendering the PractitionersTable');

  let { 
    id,
    children, 

    data,
    practitioners,
    selectedPractitionerId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideName,
    hideQualification,
    hideTelecom,
    hideActive,
    hideAddress,
    hideGender,
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
        hideName = false;
        hideQualification = true;
        hideTelecom = true;
        hideActive = true;
        hideAddress = true;
        hideGender = true;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "tablet":
        hideName = false;
        hideQualification = false;
        hideTelecom = true;
        hideActive = false;
        hideAddress = true;
        hideGender = true;
        hideBarcode = true;
        hideTextIcon = false;
        break;
      case "desktop":
        hideName = false;
        hideQualification = false;
        hideTelecom = false;
        hideActive = false;
        hideAddress = false;
        hideGender = false;
        hideBarcode = false;
        hideTextIcon = true;
        break;
      case "hdmi":
        hideName = false;
        hideQualification = false;
        hideTelecom = false;
        hideActive = false;
        hideAddress = false;
        hideGender = false;
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
            name={`practitioner-${index}`}
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
  function renderActionIcons(practitioner ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(practitioner)} />
          <IoMdTrash style={iconStyle} onClick={removeRecord.bind(practitioner._id)} /> */}
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
  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name'>{ name }</TableCell>
      );  
    }
  }
  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell className='name'>{get(labels, 'name', 'Name')}</TableCell>
      );
    }
  }
  function renderQualification(qualification){
    if (!hideQualification) {
      return (
        <TableCell className='qualification'>{ qualification }</TableCell>
      );
    }
  }
  function renderQualificationHeader(){
    if (!hideQualification) {
      return (
        <TableCell className='qualification'>{get(labels, 'qualification', 'Qualification')}</TableCell>
      );
    }
  }
  function renderTelecom(telecom){
    if (!hideTelecom) {
      return (
        <TableCell className='telecom'>{ telecom }</TableCell>
      );
    }
  }
  function renderTelecomHeader(){
    if (!hideTelecom) {
      return (
        <TableCell className='telecom'>{get(labels, 'telecom', 'Telecom')}</TableCell>
      );
    }
  }
  function renderActive(active){
    if (!hideActive) {
      return (
        <TableCell className='active'>{ active ? 'Active' : 'Inactive' }</TableCell>
      );
    }
  }
  function renderActiveHeader(){
    if (!hideActive) {
      return (
        <TableCell className='active'>{get(labels, 'active', 'Active')}</TableCell>
      );
    }
  }
  function renderAddress(address){
    if (!hideAddress) {
      return (
        <TableCell className='address'>{ address }</TableCell>
      );
    }
  }
  function renderAddressHeader(){
    if (!hideAddress) {
      return (
        <TableCell className='address'>{get(labels, 'address', 'Address')}</TableCell>
      );
    }
  }
  function renderGender(gender){
    if (!hideGender) {
      return (
        <TableCell className='gender'>{ gender }</TableCell>
      );
    }
  }
  function renderGenderHeader(){
    if (!hideGender) {
      return (
        <TableCell className='gender'>{get(labels, 'gender', 'Gender')}</TableCell>
      );
    }
  }

  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let practitionersToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(practitioners){
    if(practitioners.length > 0){     
      let count = 0;    

      // if(props.limit){
      //   practitionersToRender = practitioners.slice(0, props.limit);
      // } else {
      //   practitionersToRender = practitioners;
      // }

      practitionersToRender = practitioners;

      if(practitionersToRender.length > 0){
        practitionersToRender.forEach(function(practitioner){
          if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
            let row = FhirDehydrator.dehydratePractitioner(practitioner);
            
            tableRows.push(
              <TableRow key={count} className="practitionerRow" style={{cursor: 'pointer'}} onClick={ handleRowClick.bind(this, practitioner._id)}>
                { renderCheckbox(count) }
                { renderActionIcons(practitioner) }
                { renderIdentifier(row.identifier) }
                { renderName(row.name) }
                { renderQualification(row.qualification) }
                { renderTelecom(row.telecom) }
                { renderActive(row.active) }
                { renderAddress(row.address) }
                { renderGender(row.gender) }
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
            { renderNameHeader() }
            { renderQualificationHeader() }
            { renderTelecomHeader() }
            { renderActiveHeader() }
            { renderAddressHeader() }
            { renderGenderHeader() }
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

PractitionersTable.propTypes = {
  practitioners: PropTypes.array,
  selectedPractitionerId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideQualification: PropTypes.bool,
  hideTelecom: PropTypes.bool,
  hideActive: PropTypes.bool,
  hideAddress: PropTypes.bool,
  hideGender: PropTypes.bool,
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

PractitionersTable.defaultProps = {
  rowsPerPage: 5,
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: false,
  hideName: false,
  hideQualification: false,
  hideTelecom: false,
  hideActive: false,
  hideAddress: false,
  hideGender: false,
  hideBarcode: true,
  defaultCheckboxValue: false,
  autoColumns: true,
  rowsPerPageOptions: [5, 10, 25, 100],
  tableRowSize: 'medium',
  page: 0
}

export default PractitionersTable;