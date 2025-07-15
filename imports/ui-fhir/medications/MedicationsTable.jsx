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
// MAIN COMPONENT

function MedicationsTable(props){
  logger.info('Rendering the MedicationsTable');

  let { 
    id,
    children, 

    data,
    medications,
    selectedMedicationId,

    query,
    paginationLimit,
    disablePagination,
  
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideName,
    hideForm,
    hideIngredients,
    hideManufacturer,
    hideBatch,
    hideAmount,
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

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = true;
        hideName = false;
        hideForm = true;
        hideIngredients = true;
        hideManufacturer = true;
        hideBatch = true;
        hideAmount = true;
        hideBarcode = true;  
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideName = false;
        hideForm = false;
        hideIngredients = true;
        hideManufacturer = true;
        hideBatch = true;
        hideAmount = true;
        hideBarcode = true;   
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideForm = false;
        hideIngredients = false;
        hideManufacturer = false;
        hideBatch = true;
        hideAmount = true;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideForm = false;
        hideIngredients = false;
        hideManufacturer = false;
        hideBatch = false;
        hideAmount = true;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideForm = false;
        hideIngredients = false;
        hideManufacturer = false;
        hideBatch = false;
        hideAmount = false;
        hideBarcode = false;
        break;            
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(medicationId){
    console.log('Clicking row ' + medicationId)
    if(props.onRowClick){
      props.onRowClick(medicationId);
    }
  }

  function removeRecord(_id){
    console.log('Remove medication ', _id)
    if(props.onRemoveRecord){
      props.onRemoveRecord(_id);
    }
  }
  function handleActionButtonClick(id){
    if(typeof props.onActionButtonClick === "function"){
      props.onActionButtonClick(id);
    }
  }
  function cellClick(id){
    if(typeof props.onCellClick === "function"){
      props.onCellClick(id);
    }
  }

  function handleMetaClick(patient){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, patient);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!props.hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >
          Toggle
        </TableCell>
      );
    }
  }
  function renderCheckbox(){
    if (!props.hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}}>
          <Checkbox
            defaultChecked={defaultCheckboxValue}
          />
        </TableCell>
      );
    }
  }
  function renderActionIconsHeader(){
    if (!props.hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(medication ){
    if (!props.hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* Icon buttons would go here */}
        </TableCell>
      );
    }
  } 

  function renderIdentifier(identifier){
    if (!props.hideIdentifier) {
      return (
        <TableCell className='identifier'>{ identifier }</TableCell>
      );
    }
  }
  function renderIdentifierHeader(){
    if (!props.hideIdentifier) {
      return (
        <TableCell className='identifier'>Identifier</TableCell>
      );
    }
  }

  function renderStatus(status){
    if (!props.hideStatus) {
      return (
        <TableCell className='status'>{ status }</TableCell>
      );
    }
  }
  function renderStatusHeader(){
    if (!props.hideStatus) {
      return (
        <TableCell className='status'>Status</TableCell>
      );
    }
  }

  function renderName(name){
    if (!props.hideName) {
      return (
        <TableCell className='name'>{ name }</TableCell>
      );
    }
  }
  function renderNameHeader(){
    if (!props.hideName) {
      return (
        <TableCell className='name'>Medication Name</TableCell>
      );
    }
  }

  function renderForm(form){
    if (!props.hideForm) {
      return (
        <TableCell className='form'>{ form }</TableCell>
      );
    }
  }
  function renderFormHeader(){
    if (!props.hideForm) {
      return (
        <TableCell className='form'>Form</TableCell>
      );
    }
  }

  function renderIngredients(ingredients){
    if (!props.hideIngredients) {
      return (
        <TableCell className='ingredients'>{ ingredients }</TableCell>
      );
    }
  }
  function renderIngredientsHeader(){
    if (!props.hideIngredients) {
      return (
        <TableCell className='ingredients'>Ingredients</TableCell>
      );
    }
  }

  function renderManufacturer(manufacturer){
    if (!props.hideManufacturer) {
      return (
        <TableCell className='manufacturer'>{ manufacturer }</TableCell>
      );
    }
  }
  function renderManufacturerHeader(){
    if (!props.hideManufacturer) {
      return (
        <TableCell className='manufacturer'>Manufacturer</TableCell>
      );
    }
  }

  function renderBarcode(id){
    if (!props.hideBarcode) {
      return (
        <TableCell><span className="barcode helvetica">{id}</span></TableCell>
      );  
    }
  }
  function renderBarcodeHeader(){
    if (!props.hideBarcode) {
      return (
        <TableCell>System ID</TableCell>
      );
    }
  }

  function renderActionButtonHeader(){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(medication){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(medication, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
        </TableCell>
      );
    }
  }

  // ------------------------------------------------------------------------
  // Pagination Setup
  
  const [localPage, setLocalPage] = useState(page || 0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(rowsPerPage || 5);

  useEffect(() => {
    if (page !== undefined) {
      setLocalPage(page);
    }
  }, [page]);

  useEffect(() => {
    if (rowsPerPage !== undefined) {
      setLocalRowsPerPage(rowsPerPage);
    }
  }, [rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setLocalPage(newPage);
    if (onSetPage) {
      onSetPage(event, newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setLocalRowsPerPage(newRowsPerPage);
    setLocalPage(0);
    if (onSetPage) {
      onSetPage(event, 0);
    }
  };

  // ------------------------------------------------------------------------
  // Table Row Rendering

  let tableRows = [];
  let medicationsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.medications){
    if(props.medications.length > 0){ 
      let count = 0;    
      
      props.medications.forEach(function(medication){
        if((count >= (localPage * localRowsPerPage)) && (count < (localPage + 1) * localRowsPerPage)){
          medicationsToRender.push(FhirDehydrator.dehydrateMedication(medication, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '52px'
  }
  if(medicationsToRender.length === 0){
    logger.trace('MedicationsTable: No medications to render.');
  } else {
    for (var i = 0; i < medicationsToRender.length; i++) {

      let selected = false;
      if(medicationsToRender[i]._id === selectedMedicationId){
        selected = true;
      }
      if(get(medicationsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="medicationRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, medicationsToRender[i]._id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(medicationsToRender[i]) }
          { renderActionIcons(medicationsToRender[i]) }
          { renderIdentifier(medicationsToRender[i].identifier ) }
          { renderStatus(medicationsToRender[i].status) }
          { renderName(medicationsToRender[i].medicationCodeableConceptText) }
          { renderForm(medicationsToRender[i].form) }
          { renderIngredients(medicationsToRender[i].activeIngredient) }  
          { renderManufacturer(medicationsToRender[i].manufacturer) }
          { renderBarcode(medicationsToRender[i]._id) }
          { renderActionButton(medicationsToRender[i]) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="medicationsTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderNameHeader() }
            { renderFormHeader() }
            { renderIngredientsHeader() }            
            { renderManufacturerHeader() }
            { renderBarcodeHeader() }
            { renderActionButtonHeader() }
          </TableRow>
        </TableHead>
        <TableBody>
          { tableRows }
        </TableBody>
      </Table>
      { props.disablePagination ? <div></div> : (
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 25, 100]}
          colSpan={3}
          count={count || props.medications?.length || 0}
          rowsPerPage={localRowsPerPage}
          page={localPage}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          style={{
            float: 'right',
            border: 'none'
          }}
        />
      )}
    </div>
  );
}

MedicationsTable.propTypes = {
  data: PropTypes.array,
  medications: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideName: PropTypes.bool,
  hideForm: PropTypes.bool,
  hideIngredients: PropTypes.bool,
  hideManufacturer: PropTypes.bool,
  hideBatch: PropTypes.bool,
  hideAmount: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  hideActionButton: PropTypes.bool,

  rowsPerPage: PropTypes.number,
  tableRowSize: PropTypes.string,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,

  formFactorLayout: PropTypes.string,
  count: PropTypes.number,
  labels: PropTypes.object,

  page: PropTypes.number,
  onSetPage: PropTypes.func
};

MedicationsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: true,
  hideName: false,
  hideForm: false,
  hideIngredients: false,
  hideManufacturer: false,
  hideBatch: true,
  hideAmount: true,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  medications: [],
  count: 0,
  page: 0
}

export default MedicationsTable;