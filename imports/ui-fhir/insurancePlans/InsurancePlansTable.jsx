// /imports/ui-fhir/insurancePlans/InsurancePlansTable.jsx

import React from 'react';
import PropTypes from 'prop-types';

import {
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';

import { get } from 'lodash';

import FhirDehydrator from '../../lib/FhirDehydrator';


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

function InsurancePlansTable(props){
  logger.info('Rendering the InsurancePlansTable');

  let {
    id,
    children,

    data,
    insurancePlans,
    selectedInsurancePlanId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideName,
    hideStatus,
    hideType,
    hideAlias,
    hideOwnedBy,
    hideAdministeredBy,
    hideCoverageArea,
    hideCoverageType,
    hideCoverageBenefitType,
    hideBarcode,

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    hideActionButton,
    actionButtonLabel,

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
  // Store original prop values before form factor overrides
  const hideBarcodeFromProp = hideBarcode;
  const hideStatusFromProp = hideStatus;
  const hideTypeFromProp = hideType;
  const hideAliasFromProp = hideAlias;
  const hideOwnedByFromProp = hideOwnedBy;
  const hideAdministeredByFromProp = hideAdministeredBy;
  const hideCoverageAreaFromProp = hideCoverageArea;
  const hideCoverageTypeFromProp = hideCoverageType;
  const hideCoverageBenefitTypeFromProp = hideCoverageBenefitType;

  // ------------------------------------------------------------------------
  // Form Factors

  let multiline = false;

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : true;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : true;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : true;
        hideAdministeredBy = (hideAdministeredByFromProp !== undefined) ? hideAdministeredByFromProp : true;
        hideCoverageArea = (hideCoverageAreaFromProp !== undefined) ? hideCoverageAreaFromProp : true;
        hideCoverageType = (hideCoverageTypeFromProp !== undefined) ? hideCoverageTypeFromProp : true;
        hideCoverageBenefitType = (hideCoverageBenefitTypeFromProp !== undefined) ? hideCoverageBenefitTypeFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        multiline = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : true;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : true;
        hideAdministeredBy = (hideAdministeredByFromProp !== undefined) ? hideAdministeredByFromProp : true;
        hideCoverageArea = (hideCoverageAreaFromProp !== undefined) ? hideCoverageAreaFromProp : true;
        hideCoverageType = (hideCoverageTypeFromProp !== undefined) ? hideCoverageTypeFromProp : true;
        hideCoverageBenefitType = (hideCoverageBenefitTypeFromProp !== undefined) ? hideCoverageBenefitTypeFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "web":
        hideName = false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : true;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : false;
        hideAdministeredBy = (hideAdministeredByFromProp !== undefined) ? hideAdministeredByFromProp : false;
        hideCoverageArea = (hideCoverageAreaFromProp !== undefined) ? hideCoverageAreaFromProp : true;
        hideCoverageType = (hideCoverageTypeFromProp !== undefined) ? hideCoverageTypeFromProp : true;
        hideCoverageBenefitType = (hideCoverageBenefitTypeFromProp !== undefined) ? hideCoverageBenefitTypeFromProp : true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
        break;
      case "desktop":
      case "hdmi":
        hideName = false;
        hideStatus = (hideStatusFromProp !== undefined) ? hideStatusFromProp : false;
        hideType = (hideTypeFromProp !== undefined) ? hideTypeFromProp : false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : false;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : false;
        hideAdministeredBy = (hideAdministeredByFromProp !== undefined) ? hideAdministeredByFromProp : false;
        hideCoverageArea = (hideCoverageAreaFromProp !== undefined) ? hideCoverageAreaFromProp : false;
        hideCoverageType = (hideCoverageTypeFromProp !== undefined) ? hideCoverageTypeFromProp : false;
        hideCoverageBenefitType = (hideCoverageBenefitTypeFromProp !== undefined) ? hideCoverageBenefitTypeFromProp : false;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        multiline = false;
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

  function handleRowClick(id){
    console.log('InsurancePlansTable handleRowClick called with id:', id);
    if(props && (typeof onRowClick === "function")){
      onRowClick(id);
    } else {
      console.log('No onRowClick handler provided');
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
  function renderNameHeader(){
    if (!hideName) {
      return ( <TableCell className='name'>Name</TableCell> );
    }
  }
  function renderName(name){
    if (!hideName) {
      return ( <TableCell className='name' style={{minWidth: '200px'}}>{ name }</TableCell> );
    }
  }
  function renderStatusHeader(){
    if (!hideStatus) {
      return ( <TableCell className='status'>Status</TableCell> );
    }
  }
  function renderStatus(status){
    if (!hideStatus) {
      return ( <TableCell className='status'>{ status }</TableCell> );
    }
  }
  function renderTypeHeader(){
    if (!hideType) {
      return ( <TableCell className='type'>Type</TableCell> );
    }
  }
  function renderType(type){
    if (!hideType) {
      return ( <TableCell className='type' style={{minWidth: '140px'}}>{ type }</TableCell> );
    }
  }
  function renderAliasHeader(){
    if (!hideAlias) {
      return ( <TableCell className='alias'>Alias</TableCell> );
    }
  }
  function renderAlias(alias){
    if (!hideAlias) {
      let aliasText = alias;
      if(Array.isArray(alias)){
        aliasText = alias.join(', ');
      }
      return ( <TableCell className='alias' style={{minWidth: '140px'}}>{ aliasText }</TableCell> );
    }
  }
  function renderOwnedByHeader(){
    if (!hideOwnedBy) {
      return ( <TableCell className='ownedBy'>Owned By</TableCell> );
    }
  }
  function renderOwnedBy(ownedBy){
    if (!hideOwnedBy) {
      return ( <TableCell className='ownedBy' style={{minWidth: '160px'}}>{ ownedBy }</TableCell> );
    }
  }
  function renderAdministeredByHeader(){
    if (!hideAdministeredBy) {
      return ( <TableCell className='administeredBy'>Administered By</TableCell> );
    }
  }
  function renderAdministeredBy(administeredBy){
    if (!hideAdministeredBy) {
      return ( <TableCell className='administeredBy' style={{minWidth: '160px'}}>{ administeredBy }</TableCell> );
    }
  }
  function renderCoverageAreaHeader(){
    if (!hideCoverageArea) {
      return ( <TableCell className='coverageArea'>Coverage Area</TableCell> );
    }
  }
  function renderCoverageArea(coverageArea){
    if (!hideCoverageArea) {
      return ( <TableCell className='coverageArea' style={{minWidth: '160px'}}>{ coverageArea }</TableCell> );
    }
  }
  function renderCoverageTypeHeader(){
    if (!hideCoverageType) {
      return ( <TableCell className='coverageType'>Coverage Type</TableCell> );
    }
  }
  function renderCoverageType(coverageType){
    if (!hideCoverageType) {
      return ( <TableCell className='coverageType' style={{minWidth: '160px'}}>{ coverageType }</TableCell> );
    }
  }
  function renderCoverageBenefitTypeHeader(){
    if (!hideCoverageBenefitType) {
      return ( <TableCell className='coverageBenefitType'>Benefit Type</TableCell> );
    }
  }
  function renderCoverageBenefitType(coverageBenefitType){
    if (!hideCoverageBenefitType) {
      return ( <TableCell className='coverageBenefitType' style={{minWidth: '160px'}}>{ coverageBenefitType }</TableCell> );
    }
  }
  function renderIdentifierHeader(){
    if (!hideIdentifier) {
      return ( <TableCell className='identifier'>Identifier</TableCell> );
    }
  }
  function renderIdentifier(identifier){
    if (!hideIdentifier) {
      return ( <TableCell className='identifier'>{ identifier }</TableCell> );
    }
  }
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return ( <TableCell className='actionIcons'>Actions</TableCell> );
    }
  }
  function renderActionIcons( insurancePlan ){
    if (!hideActionIcons) {
      return ( <TableCell className='actionIcons' style={{width: '120px'}}></TableCell> );
    }
  }
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects (which have _str property)
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return ( <TableCell><span className="barcode helveticas">{idString}</span></TableCell> );
    }
  }
  function renderBarcodeHeader(){
    if (!hideBarcode) {
      return ( <TableCell>System ID</TableCell> );
    }
  }
  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return ( <TableCell className='ActionButton' >Action</TableCell> );
    }
  }
  function renderActionButton(insurancePlanId){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, insurancePlanId)}>{ get(props, "actionButtonLabel", "") }</Button>
        </TableCell>
      );
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
  let insurancePlansToRender = [];

  // Accept either the named `insurancePlans` prop or the generic `data` prop
  let sourceArray = insurancePlans;
  if((!sourceArray || sourceArray.length === 0) && Array.isArray(data)){
    sourceArray = data;
  }

  if(sourceArray){
    if(sourceArray.length > 0){
      let counter = 0;

      sourceArray.forEach(function(insurancePlan){
        if((counter >= (page * rowsPerPage)) && (counter < (page + 1) * rowsPerPage)){
          insurancePlansToRender.push(FhirDehydrator.flattenInsurancePlan(insurancePlan));
        }
        counter++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }

  if(insurancePlansToRender.length === 0){
    logger.trace('InsurancePlansTable: No insurance plans to render.');
  } else {
    for (let i = 0; i < insurancePlansToRender.length; i++) {
      let selected = false;
      if(insurancePlansToRender[i].id === selectedInsurancePlanId){
        selected = true;
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }
      logger.trace('insurancePlansToRender[i]', insurancePlansToRender[i])

      const currentInsurancePlan = insurancePlansToRender[i];
      // Handle MongoDB ObjectID objects (which have _str property)
      const rawId = currentInsurancePlan._id;
      const insurancePlanId = typeof rawId === 'object' && rawId._str ? rawId._str : String(rawId);

      tableRows.push(
        <TableRow className="insurancePlanRow" key={i} style={rowStyle} onClick={ handleRowClick.bind(this, insurancePlanId)} hover={true} selected={selected} >
          { renderCheckbox(i) }
          { renderActionIcons(currentInsurancePlan) }
          { renderIdentifier(get(currentInsurancePlan, "identifier", "")) }
          { renderName(get(currentInsurancePlan, "name", "")) }
          { renderStatus(get(currentInsurancePlan, "status", "")) }
          { renderType(get(currentInsurancePlan, "type", "")) }
          { renderAlias(get(currentInsurancePlan, "alias", "")) }
          { renderOwnedBy(get(currentInsurancePlan, "ownedBy", "")) }
          { renderAdministeredBy(get(currentInsurancePlan, "administeredBy", "")) }
          { renderCoverageArea(get(currentInsurancePlan, "coverageArea", "")) }
          { renderCoverageType(get(currentInsurancePlan, "coverageType", "")) }
          { renderCoverageBenefitType(get(currentInsurancePlan, "coverageBenefitType", "")) }
          { renderBarcode(get(currentInsurancePlan, "_id", ""))}
          { renderActionButton(get(currentInsurancePlan, "_id", "")) }
        </TableRow>
      );
    }
  }


  //---------------------------------------------------------------------
  // Actual Render Method

  return(
    <div id={id} className="tableWithPagination">
      <Table id="insurancePlansTable" className='insurancePlansTable' size={tableRowSize} aria-label="a dense table" { ...otherProps }>
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderNameHeader() }
            { renderStatusHeader() }
            { renderTypeHeader() }
            { renderAliasHeader() }
            { renderOwnedByHeader() }
            { renderAdministeredByHeader() }
            { renderCoverageAreaHeader() }
            { renderCoverageTypeHeader() }
            { renderCoverageBenefitTypeHeader() }
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


InsurancePlansTable.propTypes = {
  id: PropTypes.string,
  data: PropTypes.array,
  insurancePlans: PropTypes.array,
  selectedInsurancePlanId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideName: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hideAlias: PropTypes.bool,
  hideOwnedBy: PropTypes.bool,
  hideAdministeredBy: PropTypes.bool,
  hideCoverageArea: PropTypes.bool,
  hideCoverageType: PropTypes.bool,
  hideCoverageBenefitType: PropTypes.bool,
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

  labels: PropTypes.object,
  order: PropTypes.string
};

InsurancePlansTable.defaultProps = {
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm:ss",
  hideCheckbox: true,
  hideActionIcons: true,
  hideIdentifier: true,
  hideName: false,
  hideStatus: false,
  hideType: false,
  hideAlias: true,
  hideOwnedBy: false,
  hideAdministeredBy: false,
  hideCoverageArea: true,
  hideCoverageType: true,
  hideCoverageBenefitType: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,
  insurancePlans: [],
  data: [],
  page: 0,
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false
}

export default InsurancePlansTable;
