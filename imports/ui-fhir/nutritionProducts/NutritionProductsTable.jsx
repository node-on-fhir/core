// /imports/ui-fhir/nutritionProducts/NutritionProductsTable.jsx

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

function NutritionProductsTable(props){
  logger.info('Rendering the NutritionProductsTable');

  let {
    id,
    children,

    data,
    nutritionProducts,
    selectedNutritionProductId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideStatus,
    hideName,
    hideCode,
    hideCategory,
    hideManufacturer,
    hideDescription,
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
        hideCode = true;
        hideCategory = true;
        hideManufacturer = true;
        hideDescription = true;
        hideBarcode = true;
        break;
      case "tablet":
        hideCheckbox = true;
        hideActionIcons = true;
        hideIdentifier = true;
        hideStatus = false;
        hideName = false;
        hideCode = true;
        hideCategory = true;
        hideManufacturer = true;
        hideDescription = true;
        hideBarcode = true;
        break;
      case "web":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideCode = false;
        hideCategory = false;
        hideManufacturer = false;
        hideDescription = true;
        hideBarcode = true;
        break;
      case "desktop":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideCode = false;
        hideCategory = false;
        hideManufacturer = false;
        hideDescription = false;
        hideBarcode = true;
        break;
      case "hdmi":
        hideCheckbox = false;
        hideActionIcons = true;
        hideIdentifier = false;
        hideStatus = false;
        hideName = false;
        hideCode = false;
        hideCategory = false;
        hideManufacturer = false;
        hideDescription = false;
        hideBarcode = false;
        break;
    }
  }

  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(nutritionProductId){
    console.log('Clicking row ' + nutritionProductId)
    if(props.onRowClick){
      props.onRowClick(nutritionProductId);
    }
  }

  function removeRecord(_id){
    console.log('Remove nutrition product ', _id)
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

  function handleMetaClick(nutritionProduct){
    let self = this;
    if(props.onMetaClick){
      props.onMetaClick(self, nutritionProduct);
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
  function renderActionIcons(nutritionProduct){
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
        <TableCell className='name'>Product Name</TableCell>
      );
    }
  }

  function renderCode(code){
    if (!props.hideCode) {
      return (
        <TableCell className='code'>{ code }</TableCell>
      );
    }
  }
  function renderCodeHeader(){
    if (!props.hideCode) {
      return (
        <TableCell className='code'>Code</TableCell>
      );
    }
  }

  function renderCategory(category){
    if (!props.hideCategory) {
      return (
        <TableCell className='category'>{ category }</TableCell>
      );
    }
  }
  function renderCategoryHeader(){
    if (!props.hideCategory) {
      return (
        <TableCell className='category'>Category</TableCell>
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

  function renderDescription(description){
    if (!props.hideDescription) {
      return (
        <TableCell className='description'>{ description }</TableCell>
      );
    }
  }
  function renderDescriptionHeader(){
    if (!props.hideDescription) {
      return (
        <TableCell className='description'>Description</TableCell>
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
  function renderActionButton(nutritionProduct){
    if (!props.hideActionButton) {
      return (
        <TableCell className='ActionButton' >
          <Button onClick={ handleActionButtonClick.bind(this, get(nutritionProduct, "_id"))}>{get(props, "actionButtonLabel", "Action")}</Button>
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
  let nutritionProductsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(props.showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(props.dateFormat){
    internalDateFormat = props.dateFormat;
  }

  if(props.nutritionProducts){
    if(props.nutritionProducts.length > 0){
      let count = 0;

      props.nutritionProducts.forEach(function(nutritionProduct){
        if((count >= (localPage * localRowsPerPage)) && (count < (localPage + 1) * localRowsPerPage)){
          nutritionProductsToRender.push(FhirDehydrator.flattenNutritionProduct(nutritionProduct, internalDateFormat));
        }
        count++;
      });
    }
  }

  let rowStyle = {
    cursor: 'pointer',
    height: '52px'
  }
  if(nutritionProductsToRender.length === 0){
    logger.trace('NutritionProductsTable: No nutrition products to render.');
  } else {
    // Debug first nutrition product to understand data structure
    if(nutritionProductsToRender.length > 0){
      logger.info('NutritionProductsTable: Rendering', nutritionProductsToRender.length, 'nutrition products');
      logger.info('NutritionProductsTable: First nutrition product dehydrated data:', {
        _id: nutritionProductsToRender[0]._id,
        name: nutritionProductsToRender[0].name,
        code: nutritionProductsToRender[0].code,
        category: nutritionProductsToRender[0].category,
        manufacturer: nutritionProductsToRender[0].manufacturer
      });

      // Log all nutrition product names to help identify if test nutrition product is present
      const nutritionProductNames = nutritionProductsToRender.map((np, index) => ({
        index,
        name: np.name,
        manufacturer: np.manufacturer
      }));
      logger.info('NutritionProductsTable: All nutrition product names:', nutritionProductNames.slice(0, 10));
    }

    for (let i = 0; i < nutritionProductsToRender.length; i++) {
      const currentNutritionProduct = nutritionProductsToRender[i];
      const nutritionProductId = currentNutritionProduct._id;

      let selected = false;
      if(nutritionProductId === selectedNutritionProductId){
        selected = true;
      }
      if(get(currentNutritionProduct, 'modifierExtension[0]')){
        rowStyle.color = "orange"
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow
          className="nutritionProductRow"
          key={i}
          onClick={() => handleRowClick(nutritionProductId)}
          hover={true}
          style={rowStyle}
          selected={selected}
        >
          { renderCheckbox(currentNutritionProduct) }
          { renderActionIcons(currentNutritionProduct) }
          { renderIdentifier(currentNutritionProduct.identifier) }
          { renderStatus(currentNutritionProduct.status) }
          { renderName(currentNutritionProduct.name) }
          { renderCode(currentNutritionProduct.code) }
          { renderCategory(currentNutritionProduct.category) }
          { renderManufacturer(currentNutritionProduct.manufacturer) }
          { renderDescription(currentNutritionProduct.description) }
          { renderBarcode(currentNutritionProduct._id) }
          { renderActionButton(currentNutritionProduct) }
        </TableRow>
      )
    }
  }

  return(
    <div id={id} className="nutritionProductsTable">
      <Table size={tableRowSize} aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderIdentifierHeader() }
            { renderStatusHeader() }
            { renderNameHeader() }
            { renderCodeHeader() }
            { renderCategoryHeader() }
            { renderManufacturerHeader() }
            { renderDescriptionHeader() }
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
          count={count || props.nutritionProducts?.length || 0}
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

NutritionProductsTable.propTypes = {
  data: PropTypes.array,
  nutritionProducts: PropTypes.array,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hideName: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideCategory: PropTypes.bool,
  hideManufacturer: PropTypes.bool,
  hideDescription: PropTypes.bool,
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

NutritionProductsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideActionButton: true,
  hideIdentifier: true,
  hideStatus: false,
  hideName: false,
  hideCode: false,
  hideCategory: false,
  hideManufacturer: false,
  hideDescription: true,
  hideBarcode: true,
  tableRowSize: 'medium',
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD",
  nutritionProducts: [],
  count: 0,
  page: 0
}

export default NutritionProductsTable;
