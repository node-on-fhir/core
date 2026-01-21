// /imports/ui-fhir/substances/SubstancesTable.jsx

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

function SubstancesTable(props){
  logger.info('Rendering the SubstancesTable');

  let {
    id,
    children,

    data,
    substances,
    selectedSubstanceId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideCode,
    hideCodeDisplay,
    hideCategory,
    hideDescription,
    hideInstanceExpiry,
    hideInstanceQuantity,
    hideIngredientCount,
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
        hideCode = false;
        hideCodeDisplay = false;
        hideCategory = true;
        hideDescription = true;
        hideInstanceExpiry = true;
        hideInstanceQuantity = true;
        hideIngredientCount = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideCode = false;
        hideCodeDisplay = false;
        hideCategory = true;
        hideDescription = false;
        hideInstanceExpiry = true;
        hideInstanceQuantity = true;
        hideIngredientCount = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideCode = false;
        hideCodeDisplay = false;
        hideCategory = false;
        hideDescription = false;
        hideInstanceExpiry = true;
        hideInstanceQuantity = true;
        hideIngredientCount = true;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideCode = false;
        hideCodeDisplay = false;
        hideCategory = false;
        hideDescription = false;
        hideInstanceExpiry = false;
        hideInstanceQuantity = false;
        hideIngredientCount = false;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideCode = false;
        hideCodeDisplay = false;
        hideCategory = false;
        hideDescription = false;
        hideInstanceExpiry = false;
        hideInstanceQuantity = false;
        hideIngredientCount = false;
        hideBarcode = false;
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(substanceId){
    console.log('Clicking row ' + substanceId)
    if(props.onRowClick){
      props.onRowClick(substanceId);
    }
  }

  function removeRecord(_id){
    console.log('Remove substance ', _id)
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

  function handleMetaClick(substance){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, substance);
    }
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >
          Toggle
        </TableCell>
      );
    }
  }
  function renderCheckbox(){
    if (!hideCheckbox) {
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
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(substance){
    if (!hideActionIcons) {
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

  function renderCode(code){
    if (!hideCode) {
      return (
        <TableCell className='code'>{ code }</TableCell>
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

  function renderCodeDisplay(codeDisplay){
    if (!hideCodeDisplay) {
      return (
        <TableCell className='codeDisplay'>{ codeDisplay }</TableCell>
      );
    }
  }
  function renderCodeDisplayHeader(){
    if (!hideCodeDisplay) {
      return (
        <TableCell className='codeDisplay'>Substance Name</TableCell>
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
  function renderCategoryHeader(){
    if (!hideCategory) {
      return (
        <TableCell className='category'>Category</TableCell>
      );
    }
  }

  function renderDescription(description){
    if (!hideDescription) {
      return (
        <TableCell className='description'>{ description }</TableCell>
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

  function renderInstanceExpiry(expiry){
    if (!hideInstanceExpiry) {
      return (
        <TableCell className='instanceExpiry'>{ expiry }</TableCell>
      );
    }
  }
  function renderInstanceExpiryHeader(){
    if (!hideInstanceExpiry) {
      return (
        <TableCell className='instanceExpiry'>Expiry Date</TableCell>
      );
    }
  }

  function renderInstanceQuantity(quantity){
    if (!hideInstanceQuantity) {
      return (
        <TableCell className='instanceQuantity'>{ quantity }</TableCell>
      );
    }
  }
  function renderInstanceQuantityHeader(){
    if (!hideInstanceQuantity) {
      return (
        <TableCell className='instanceQuantity'>Quantity</TableCell>
      );
    }
  }

  function renderIngredientCount(ingredientCount){
    if (!hideIngredientCount) {
      return (
        <TableCell className='ingredientCount'>{ ingredientCount }</TableCell>
      );
    }
  }
  function renderIngredientCountHeader(){
    if (!hideIngredientCount) {
      return (
        <TableCell className='ingredientCount'>Ingredients</TableCell>
      );
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

  function renderActionButtonHeader(){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >Action</TableCell>
      );
    }
  }
  function renderActionButton(substance){
    if (!hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(substance, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
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
  let substancesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.substances){
    if(props.substances.length > 0){
      let count = 0;

      props.substances.forEach(function(substance){
        if((count >= (localPage * localRowsPerPage)) && (count < (localPage + 1) * localRowsPerPage)){
          substancesToRender.push(FhirDehydrator.dehydrateSubstance(substance, internalDateFormat));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }
  if(substancesToRender.length === 0){
    logger.trace('SubstancesTable: No substances to render.');
  } else {
    if(substancesToRender.length > 0){
      logger.info('SubstancesTable: Rendering', substancesToRender.length, 'substances');
      logger.info('SubstancesTable: First substance dehydrated data:', {
        _id: substancesToRender[0]._id,
        code: substancesToRender[0].code,
        codeDisplay: substancesToRender[0].codeDisplay,
        status: substancesToRender[0].status,
        category: substancesToRender[0].category,
        description: substancesToRender[0].description
      });

      const substanceNames = substancesToRender.map((sub, index) => ({
        index,
        codeDisplay: sub.codeDisplay,
        status: sub.status
      }));
      logger.info('SubstancesTable: All substance names:', substanceNames.slice(0, 10));
    }

    for (let i = 0; i < substancesToRender.length; i++) {
      const currentSubstance = substancesToRender[i];
      const substanceId = currentSubstance._id;

      let selected = false;
      if(substanceId === selectedSubstanceId){
        selected = true;
      }
      if(get(currentSubstance, 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow
          className="substanceRow"
          key={i}
          onClick={() => handleRowClick(substanceId)}
          hover={true}
          style={rowStyle}
          selected={selected}
        >
          { renderCheckbox(currentSubstance) }
          { renderActionIcons(currentSubstance) }
          { renderIdentifier(currentSubstance.identifier) }
          { renderStatus(currentSubstance.status) }
          { renderCode(currentSubstance.code) }
          { renderCodeDisplay(currentSubstance.codeDisplay) }
          { renderCategory(currentSubstance.category) }
          { renderDescription(currentSubstance.description) }
          { renderInstanceExpiry(currentSubstance.instanceExpiry) }
          { renderInstanceQuantity(currentSubstance.instanceQuantity) }
          { renderIngredientCount(currentSubstance.ingredientCount) }
          { renderBarcode(currentSubstance._id) }
          { renderActionButton(currentSubstance) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="substancesTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderCodeHeader() }
            { renderCodeDisplayHeader() }
            { renderCategoryHeader() }
            { renderDescriptionHeader() }
            { renderInstanceExpiryHeader() }
            { renderInstanceQuantityHeader() }
            { renderIngredientCountHeader() }
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
          count={count || props.substances?.length || 0}
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

SubstancesTable.propTypes = {
  data: PropTypes.array,
  substances: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideCodeDisplay: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideDescription: PropTypes.bool,
  hideInstanceExpiry: PropTypes.bool,
  hideInstanceQuantity: PropTypes.bool,
  hideIngredientCount: PropTypes.bool,
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

SubstancesTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: false,
  hideCode: false,
  hideCodeDisplay: false,
  hideCategory: true,
  hideDescription: false,
  hideInstanceExpiry: true,
  hideInstanceQuantity: true,
  hideIngredientCount: true,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  substances: [],
  count: 0,
  page: 0
}

export default SubstancesTable;
