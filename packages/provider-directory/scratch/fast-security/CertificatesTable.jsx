import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox
} from '@material-ui/core';

import TableNoData from 'fhir-starter';

import moment from 'moment'
import _, { result } from 'lodash';
let get = _.get;
let set = _.set;

import { LayoutHelpers, FhirDehydrator } from 'meteor/clinical:hl7-fhir-data-infrastructure';
import { StyledCard, PageCanvas } from 'fhir-starter';


//===========================================================================
// THEMING

import { ThemeProvider, makeStyles } from '@material-ui/styles';
const useStyles = makeStyles(theme => ({
  button: {
    background: theme.background,
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: theme.buttonText,
    height: 48,
    padding: '0 30px',
  }
}));

let styles = {
  hideOnPhone: {
    visibility: 'visible',
    display: 'table'
  },
  cellHideOnPhone: {
    visibility: 'visible',
    display: 'table',
    paddingTop: '16px',
    maxWidth: '120px'
  },
  cell: {
    paddingTop: '16px'
  }
}




function CertificatesTable(props){
  logger.info('Rendering the CertificatesTable');
  logger.verbose('clinical:hl7-fhir-data-infrastructure.client.CertificatesTable');
  logger.data('CertificatesTable.props', {data: props}, {source: "CertificatesTable.jsx"});

  const classes = useStyles();

  let { 
    children, 

    certificates,
    selectedCertificateId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,

    hideOwner,
    hideCertificate,
    hideCreatedAt,
    hideBarcode,
  
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
  
    rowsPerPage,
    dateFormat,
    showMinutes,
    displayEnteredInError, 

    formFactorLayout,
    checklist,

    page,
    onSetPage,

    count,
    multiline,
    tableRowSize,

    ...otherProps 
  } = props;

  // ------------------------------------------------------------------------
  // Form Factors

  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActionIcons = false;
        hideStatus = false;
        hideConnectionType = false;
        hideName = false;
        hideOrganization = false;
        hideAddress = false;
        break;
      case "tablet":
        hideActionIcons = false;
        hideStatus = false;
        hideConnectionType = false;
        hideName = false;
        hideOrganization = false;
        hideAddress = false;
        break;
      case "web":
        hideActionIcons = false;
        hideStatus = false;
        hideConnectionType = false;
        hideName = false;
        hideOrganization = false;
        hideAddress = false;
        break;
      case "desktop":
        hideActionIcons = false;
        hideStatus = false;
        hideConnectionType = false;
        hideName = false;
        hideOrganization = false;
        hideAddress = false;
        break;
      case "videowall":
        hideActionIcons = false;
        hideStatus = false;
        hideConnectionType = false;
        hideName = false;
        hideOrganization = false;
        hideAddress = false;
        break;            
    }
  }


  // ------------------------------------------------------------------------
  // Helper Functions

  function handleRowClick(id){
    console.log('Clicking row ' + id)
    if(onRowClick){
      onRowClick(id);
    }
  }

  function removeRecord(_id){
    console.log('Remove certificate ', _id)
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

  function dehydrateCertificate(input){
    return input;
  }

  // ------------------------------------------------------------------------
  // Column Rendering

  function renderCheckboxHeader(){
    if (!hideCheckbox) {
      return (
        <TableCell className="toggle" style={{width: '60px'}} >Toggle</TableCell>
      );
    }
  }
  function renderCheckbox(){
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
  function renderActionIconsHeader(){
    if (!hideActionIcons) {
      return (
        <TableCell className='actionIcons' style={{width: '100px'}}>Actions</TableCell>
      );
    }
  }
  function renderActionIcons(certificate ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(certificate)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(certificate._id)} />   */}
        </TableCell>
      );
    }
  } 

  function renderOwner(owner){
    if (!hideOwner) {
      return (
        <TableCell className='owner' style={{"whiteSpace": 'nowrap', "maxWidth": '200px', 'overflow': 'hidden', "textOverflow": "ellipsis"}}>{ owner }</TableCell>
      );
    }
  }
  function renderOwnerHeader(){
    if (!hideOwner) {
      return (
        <TableCell className='owner'>Owner</TableCell>
      );
    }
  }

  function renderCertificate(certificate){
    if (!hideCertificate) {
      return (
        <TableCell className='certificate' style={{"whiteSpace": 'nowrap', "maxWidth": '400px', 'overflow': 'hidden', "textOverflow": "ellipsis"}}>{ certificate }</TableCell>
      );
    }
  }
  function renderCertificateHeader(){
    if (!hideCertificate) {
      return (
        <TableCell className='certificate'>Certificate</TableCell>
      );
    }
  }

  function renderCreatedAt(createdAt){
    if (!hideCreatedAt) {
      return (
        <TableCell className='createdAt' style={{"width": "160px"}}>{ moment(createdAt).format("YYYY-MM-DD") }</TableCell>
      );
    }
  }
  function renderCreatedAtHeader(){
    if (!hideCreatedAt) {
      return (
        <TableCell className='createdAt'>Created At</TableCell>
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

  //---------------------------------------------------------------------
  // Pagination

  let rows = [];
  const [rowsPerPageToRender, setRowsPerPage] = useState(rowsPerPage);


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
      rowsPerPageOptions={['']}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPageToRender}
      page={page}
      onChangePage={handleChangePage}
      style={{float: 'right', border: 'none'}}
    />
  }
  
  
  //---------------------------------------------------------------------
  // Table Rows



  let tableRows = [];
  let certificatesToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(certificates){
    if(certificates.length > 0){              
      let count = 0;

      certificates.forEach(function(certificate){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          certificatesToRender.push(dehydrateCertificate(certificate, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(certificatesToRender.length === 0){
    console.log('No certificates to render');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < certificatesToRender.length; i++) {

      let selected = false;
      if(certificatesToRender[i].id === selectedCertificateId){
        selected = true;
      }
      if(get(certificatesToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="certificateRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, certificatesToRender[i].id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(certificatesToRender[i]) }
          { renderActionIcons(certificatesToRender[i]) }
          { renderOwner(certificatesToRender[i].certificateOwner) }
          { renderCertificate(certificatesToRender[i].certificate) }
          { renderCreatedAt(certificatesToRender[i].createdAt) }
          { renderBarcode(certificatesToRender[i].id)}
        </TableRow>
      );       
    }
  }

  return(
    <div>
      <Table size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            { renderCheckboxHeader() }
            { renderActionIconsHeader() }
            { renderOwnerHeader() }
            { renderCertificateHeader() }
            { renderCreatedAtHeader() }
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

CertificatesTable.propTypes = {
  barcodes: PropTypes.bool,
  certificates: PropTypes.array,
  selectedCertificateId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  
  hideOwner: PropTypes.bool,
  hideCertificate: PropTypes.bool,
  hideCreatedAt: PropTypes.bool,
  hideBarcode: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onSetPage: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  actionButtonLabel: PropTypes.string,
  tableRowSize: PropTypes.string,

  formFactorLayout: PropTypes.string,
  checklist: PropTypes.bool,

  page: PropTypes.number,
  count: PropTypes.number
};
CertificatesTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideBarcode: true,

  hideOwner: false,
  hideCertificate: false,
  hideCreatedAt: false,
  hideBarcode: true,

  checklist: true,
  selectedCertificateId: '',
  page: 0,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default CertificatesTable; 