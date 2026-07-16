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

import { flattenInsurancePlan } from '../../lib/FhirDehydrator';


//===========================================================================
// LOGGING

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
    hideAlias,
    hideStatus,
    hideType,
    hidePeriodStart,
    hidePeriodEnd,
    hideOwnedBy,
    hideAdministeredBy,
    hideCoverageArea,
    hideNetwork,
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
  // Store original prop values before form factor overrides
  const hideBarcodeFromProp = hideBarcode;
  const hideAliasFromProp = hideAlias;
  const hidePeriodStartFromProp = hidePeriodStart;
  const hidePeriodEndFromProp = hidePeriodEnd;
  const hideOwnedByFromProp = hideOwnedBy;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    logger.verbose('formFactorLayout', formFactorLayout + ' ' + window.innerWidth);
    switch (formFactorLayout) {
      case "phone":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : true;
        hideStatus = false;
        hideType = true;
        hidePeriodStart = (hidePeriodStartFromProp !== undefined) ? hidePeriodStartFromProp : true;
        hidePeriodEnd = (hidePeriodEndFromProp !== undefined) ? hidePeriodEndFromProp : true;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : true;
        hideAdministeredBy = true;
        hideCoverageArea = true;
        hideNetwork = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideName = false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : true;
        hideStatus = false;
        hideType = false;
        hidePeriodStart = (hidePeriodStartFromProp !== undefined) ? hidePeriodStartFromProp : true;
        hidePeriodEnd = (hidePeriodEndFromProp !== undefined) ? hidePeriodEndFromProp : true;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : false;
        hideAdministeredBy = true;
        hideCoverageArea = true;
        hideNetwork = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
        break;
      case "web":
      case "desktop":
      case "hdmi":
        hideName = false;
        hideAlias = (hideAliasFromProp !== undefined) ? hideAliasFromProp : false;
        hideStatus = false;
        hideType = false;
        hidePeriodStart = (hidePeriodStartFromProp !== undefined) ? hidePeriodStartFromProp : false;
        hidePeriodEnd = (hidePeriodEndFromProp !== undefined) ? hidePeriodEndFromProp : false;
        hideOwnedBy = (hideOwnedByFromProp !== undefined) ? hideOwnedByFromProp : false;
        hideAdministeredBy = true;
        hideCoverageArea = true;
        hideNetwork = true;
        hideBarcode = (hideBarcodeFromProp !== undefined) ? hideBarcodeFromProp : false;
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons'>Actions</TableCell>
      );
    }
  }
  function renderActionIcons( insurancePlan ){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '120px'}}>
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
  function renderNameHeader(){
    if (!hideName) {
      return (
        <TableCell className='name'>Name</TableCell>
      );
    }
  }
  function renderName(name){
    if (!hideName) {
      return (
        <TableCell className='name' style={{minWidth: '200px'}}>{ name }</TableCell>
      );
    }
  }
  function renderAliasHeader(){
    if (!hideAlias) {
      return (
        <TableCell className='alias'>Alias</TableCell>
      );
    }
  }
  function renderAlias(alias){
    if (!hideAlias) {
      return (
        <TableCell className='alias' style={{minWidth: '140px'}}>{ alias }</TableCell>
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
        <TableCell className='type' style={{minWidth: '140px'}}>{ type }</TableCell>
      );
    }
  }
  function renderPeriodStartHeader(){
    if (!hidePeriodStart) {
      return (
        <TableCell className='periodStart'>Start</TableCell>
      );
    }
  }
  function renderPeriodStart(periodStart){
    if (!hidePeriodStart) {
      return (
        <TableCell className='periodStart'>{ periodStart }</TableCell>
      );
    }
  }
  function renderPeriodEndHeader(){
    if (!hidePeriodEnd) {
      return (
        <TableCell className='periodEnd'>End</TableCell>
      );
    }
  }
  function renderPeriodEnd(periodEnd){
    if (!hidePeriodEnd) {
      return (
        <TableCell className='periodEnd'>{ periodEnd }</TableCell>
      );
    }
  }
  function renderOwnedByHeader(){
    if (!hideOwnedBy) {
      return (
        <TableCell className='ownedBy'>Owned By</TableCell>
      );
    }
  }
  function renderOwnedBy(ownedBy){
    if (!hideOwnedBy) {
      return (
        <TableCell className='ownedBy' style={{minWidth: '160px'}}>{ ownedBy }</TableCell>
      );
    }
  }
  function renderAdministeredByHeader(){
    if (!hideAdministeredBy) {
      return (
        <TableCell className='administeredBy'>Administered By</TableCell>
      );
    }
  }
  function renderAdministeredBy(administeredBy){
    if (!hideAdministeredBy) {
      return (
        <TableCell className='administeredBy' style={{minWidth: '160px'}}>{ administeredBy }</TableCell>
      );
    }
  }
  function renderCoverageAreaHeader(){
    if (!hideCoverageArea) {
      return (
        <TableCell className='coverageArea'>Coverage Area</TableCell>
      );
    }
  }
  function renderCoverageArea(coverageArea){
    if (!hideCoverageArea) {
      return (
        <TableCell className='coverageArea' style={{minWidth: '140px'}}>{ coverageArea }</TableCell>
      );
    }
  }
  function renderNetworkHeader(){
    if (!hideNetwork) {
      return (
        <TableCell className='network'>Network</TableCell>
      );
    }
  }
  function renderNetwork(networkDisplay){
    if (!hideNetwork) {
      return (
        <TableCell className='network' style={{minWidth: '140px'}}>{ networkDisplay }</TableCell>
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
  function renderBarcode(id){
    if (!hideBarcode) {
      // Handle MongoDB ObjectID objects (which have _str property)
      const idString = typeof id === 'object' && id._str ? id._str : String(id);
      return (
        <TableCell><span className="barcode helveticas">{idString}</span></TableCell>
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

  // Default the page so callers that don't manage pagination state
  // (e.g. provider-directory passing disablePagination) still render rows.
  let currentPage = (typeof page === 'number') ? page : 0;

  let paginationCount = 101;
  if(count){
    paginationCount = count;
  } else if(Array.isArray(insurancePlans)){
    paginationCount = insurancePlans.length;
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
      page={currentPage}
      onPageChange={handleChangePage}
      style={{float: 'right', border: 'none'}}
    />
  }


  //---------------------------------------------------------------------
  // Table Rows

  let tableRows = [];
  let insurancePlansToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }

  if(insurancePlans){
    if(insurancePlans.length > 0){
      let index = 0;

      insurancePlans.forEach(function(insurancePlan){
        // When pagination is disabled, render everything we were given.
        if(disablePagination || ((index >= (currentPage * rowsPerPage)) && (index < (currentPage + 1) * rowsPerPage))){
          insurancePlansToRender.push(flattenInsurancePlan(insurancePlan, internalDateFormat));
        }
        index++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }
  if(tableRowSize === "small"){
    rowStyle.height = '32px';
  }

  if(insurancePlansToRender.length === 0){
    logger.trace('InsurancePlansTable: No insurance plans to render.');
  } else {
    for (let i = 0; i < insurancePlansToRender.length; i++) {
      let selected = false;
      if(insurancePlansToRender[i].id === selectedInsurancePlanId){
        selected = true;
      }

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
          { renderAlias(get(currentInsurancePlan, "alias", "")) }
          { renderStatus(get(currentInsurancePlan, "status", "")) }
          { renderType(get(currentInsurancePlan, "type", "")) }
          { renderPeriodStart(get(currentInsurancePlan, "periodStart", "")) }
          { renderPeriodEnd(get(currentInsurancePlan, "periodEnd", "")) }
          { renderOwnedBy(get(currentInsurancePlan, "ownedBy", "")) }
          { renderAdministeredBy(get(currentInsurancePlan, "administeredBy", "")) }
          { renderCoverageArea(get(currentInsurancePlan, "coverageAreaDisplay", "")) }
          { renderNetwork(get(currentInsurancePlan, "networkDisplay", "")) }
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
            { renderAliasHeader() }
            { renderStatusHeader() }
            { renderTypeHeader() }
            { renderPeriodStartHeader() }
            { renderPeriodEndHeader() }
            { renderOwnedByHeader() }
            { renderAdministeredByHeader() }
            { renderCoverageAreaHeader() }
            { renderNetworkHeader() }
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
  hideAlias: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideType: PropTypes.bool,
  hidePeriodStart: PropTypes.bool,
  hidePeriodEnd: PropTypes.bool,
  hideOwnedBy: PropTypes.bool,
  hideAdministeredBy: PropTypes.bool,
  hideCoverageArea: PropTypes.bool,
  hideNetwork: PropTypes.bool,
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
  hideAlias: false,
  hideStatus: false,
  hideType: false,
  hidePeriodStart: false,
  hidePeriodEnd: false,
  hideOwnedBy: false,
  hideAdministeredBy: true,
  hideCoverageArea: true,
  hideNetwork: true,
  hideBarcode: false,
  hideActionButton: true,
  disablePagination: false,
  insurancePlans: [],
  labels: {
    checkbox: "Checkbox"
  },
  defaultCheckboxValue: false
}

export default InsurancePlansTable;
