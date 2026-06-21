import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button
} from '@material-ui/core';

import TableNoData from 'fhir-starter';

import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;

import { LayoutHelpers, } from 'meteor/clinical:hl7-fhir-data-infrastructure';
import { StyledCard, PageCanvas } from 'fhir-starter';


function dehydrateOauthClient(input){
  let result = {};

  result.software_statement = get(input, 'software_statement');
  
  result._id = get(input, '_id');
  result.iss = get(input, 'iss');
  result.sub = get(input, 'sub');
  result.aud = get(input, 'aud');
  result.iat = get(input, 'iat');
  result.exp = get(input, 'exp');
  result.jti = get(input, 'jti');
  result.client_name = get(input, 'client_name');
  result.tos_uri = get(input, 'tos_uri');
  result.token_endpoint_auth_method = get(input, 'token_endpoint_auth_method');

  return result;
}

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




function OAuthClientsTable(props){
  // logger.info('Rendering the OAuthClientsTable');
  // logger.verbose('clinical:hl7-fhir-data-infrastructure.client.OAuthClientsTable');
  // logger.data('OAuthClientsTable.props', {data: props}, {source: "OAuthClientsTable.jsx"});

  console.info('Rendering the OAuthClientsTable');
  console.debug('clinical:hl7-fhir-data-infrastructure.client.OAuthClientsTable');
  // console.data('OAuthClientsTable.props', {data: props}, {source: "OAuthClientsTable.jsx"});

  const classes = useStyles();

  let { 
    children, 

    oauthClients,
    selectedOauthClientId,

    query,
    paginationLimit,
    disablePagination,

    hideCheckbox,
    hideActionIcons,

    hideStatus,
    hideId,
    hideIss,
    hideExp,
    hideClientName,
    hideBarcode,
    hideValidated,
    hideButton,
  

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
    console.log('Remove oauthClient ', _id)
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
  function renderActionIcons(oauthClient ){
    if (!hideActionIcons) {
      let iconStyle = {
        marginLeft: '4px', 
        marginRight: '4px', 
        marginTop: '4px', 
        fontSize: '120%'
      }

      return (
        <TableCell className='actionIcons' style={{minWidth: '120px'}}>
          {/* <FaTags style={iconStyle} onClick={ onMetaClick.bind(oauthClient)} />
          <GoTrashcan style={iconStyle} onClick={ removeRecord.bind(oauthClient._id)} />   */}
        </TableCell>
      );
    }
  } 

  // function renderStatus(status){
  //   if (!hideStatus) {
  //     return (
  //       <TableCell className='status'>{ status }</TableCell>
  //     );
  //   }
  // }
  // function renderStatusHeader(){
  //   if (!hideStatus) {
  //     return (
  //       <TableCell className='status'>Status</TableCell>
  //     );
  //   }
  // }
  // function renderName(name){
  //   if (!hideName) {
  //     return (
  //       <TableCell className='name'>{ name }</TableCell>
  //     );
  //   }
  // }
  // function renderNameHeader(){
  //   if (!hideName) {
  //     return (
  //       <TableCell className='name'>Name</TableCell>
  //     );
  //   }
  // }

  // function renderConnectionType(connectionType){
  //   if (!hideConnectionType) {
  //     return (
  //       <TableCell className='connectionType'>{ connectionType }</TableCell>
  //     );
  //   }
  // }
  // function renderConnectionTypeHeader(){
  //   if (!hideConnectionType) {
  //     return (
  //       <TableCell className='connectionType'>Connection Type</TableCell>
  //     );
  //   }
  // }
  // function renderOrganization(organization){
  //   if (!hideOrganization) {
  //     return (
  //       <TableCell className='organization'>{ organization }</TableCell>
  //     );
  //   }
  // }
  // function renderOrganizationHeader(){
  //   if (!hideOrganization) {
  //     return (
  //       <TableCell className='organization'>Organization</TableCell>
  //     );
  //   }
  // }
  // function renderAddress(address){
  //   if (!hideAddress) {
  //     return (
  //       <TableCell className='address'>{ address }</TableCell>
  //     );
  //   }
  // }
  // function renderAddressHeader(){
  //   if (!hideAddress) {
  //     return (
  //       <TableCell className='address'>Address</TableCell>
  //     );
  //   }
  // }
  // function renderVersion(version){
  //   if (!hideVersion) {
  //     return (
  //       <TableCell className='version'>{ version }</TableCell>
  //     );
  //   }
  // }
  // function renderVersionHeader(){
  //   if (!hideVersion) {
  //     return (
  //       <TableCell className='version'>Version</TableCell>
  //     );
  //   }
  // }

  
  function renderValidated(validated){
    if (!hideValidated) {
      return (
        <TableCell className='validated'>{ validated }</TableCell>
      );
    }
  }
  function renderValidatedHeader(){
    if (!hideValidated) {
      return (
        <TableCell>Validated</TableCell>
      );
    }
  }
  function renderButton(_id){
    if (!hideButton) {
      return (
        <TableCell className='_id'> <Button onClick={handleActionButtonClick.bind(this, _id)}>Validate</Button></TableCell>
      );
    }
  }
  function renderButtonHeader(){
    if (!hideButton) {
      return (
        <TableCell>Validate</TableCell>
      );
    }
  }


  function renderClientName(clientName){
    if (!hideClientName) {
      return (
        <TableCell className='clientName'>{ clientName }</TableCell>
      );
    }
  }
  function renderClientNameHeader(){
    if (!hideClientName) {
      return (
        <TableCell>Client Name</TableCell>
      );
    }
  }
  function renderId(id){
    if (!hideId) {
      return (
        <TableCell className='id' className="barcode helveticas">{ id }</TableCell>
      );
    }
  }
  function renderIdHeader(){
    if (!hideId) {
      return (
        <TableCell>_id</TableCell>
      );
    }
  }
    function renderIss(iss){
    if (!hideIss) {
      return (
        <TableCell className='iss'>{ iss }</TableCell>
      );
    }
  }
  function renderIssHeader(){
    if (!hideIss) {
      return (
        <TableCell>ISS</TableCell>
      );
    }
  }
  function renderExp(exp){
    if (!hideExp) {
      return (
        <TableCell className='exp'>{ moment(exp).format("YYYY-MM-DD hh:mm") }</TableCell>
      );
    }
  }
  function renderExpHeader(){
    if (!hideExp) {
      return (
        <TableCell>Expires</TableCell>
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
  // const [page, setPage] = useState(0);
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
  let oauthClientsToRender = [];
  let internalDateFormat = "YYYY-MM-DD";

  if(showMinutes){
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if(dateFormat){
    internalDateFormat = dateFormat;
  }


  if(oauthClients){
    if(oauthClients.length > 0){              
      let count = 0;

      oauthClients.forEach(function(oauthClient){
        if((count >= (page * rowsPerPage)) && (count < (page + 1) * rowsPerPage)){
          oauthClientsToRender.push(dehydrateOauthClient(oauthClient, internalDateFormat));
        }
        count++;
      });  
    }
  }

  let rowStyle = {
    cursor: 'pointer', 
    height: '55px'
  }

  if(oauthClientsToRender.length === 0){
    console.log('No oauthClients to render');
    // footer = <TableNoData noDataPadding={ noDataMessagePadding } />
  } else {
    for (var i = 0; i < oauthClientsToRender.length; i++) {

      let selected = false;
      if(oauthClientsToRender[i].id === selectedOauthClientId){
        selected = true;
      }
      if(get(oauthClientsToRender[i], 'modifierExtension[0]')){
        rowStyle.color = "orange";
      }
      if(tableRowSize === "small"){
        rowStyle.height = '32px';
      }

      tableRows.push(
        <TableRow 
          className="oauthClientRow" 
          key={i} 
          onClick={ handleRowClick.bind(this, oauthClientsToRender[i].id)} 
          hover={true} 
          style={rowStyle} 
          selected={selected}
        >
          { renderCheckbox(oauthClientsToRender[i]) }
          { renderActionIcons(oauthClientsToRender[i]) }

          { renderValidated(oauthClientsToRender[i].validated) }
          { renderClientName(oauthClientsToRender[i].client_name) }
          { renderIss(oauthClientsToRender[i].iss) }
          { renderExp(oauthClientsToRender[i].exp) }

          { renderButton(oauthClientsToRender[i]._id) }
          { renderId(oauthClientsToRender[i]._id) }


          { renderBarcode(oauthClientsToRender[i].id)}
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

            { renderValidatedHeader() }
            { renderClientNameHeader() }
            { renderIssHeader() }
            { renderExpHeader() }

            { renderButtonHeader() }
            { renderIdHeader() }

            {/* { renderStatusHeader() }
            { renderConnectionTypeHeader() }
            { renderVersionHeader() }
            { renderNameHeader() }
            { renderOrganizationHeader() }
            { renderAddressHeader() } */}
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

OAuthClientsTable.propTypes = {
  barcodes: PropTypes.bool,
  oauthClients: PropTypes.array,
  selectedOauthClientId: PropTypes.string,

  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  showMinutes: PropTypes.bool,

  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  
  hideStatus: PropTypes.bool,
  hideValidated: PropTypes.bool,
  hideButton: PropTypes.bool,
  hideId: PropTypes.bool,
  hideIss: PropTypes.bool,
  hideExp: PropTypes.bool,
  hideClientName: PropTypes.bool,

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
OAuthClientsTable.defaultProps = {
  hideCheckbox: true,
  hideActionIcons: true,
  hideBarcode: true,

  hideStatus: false,
  hideId: true,
  hideIss: false,
  hideExp: false,
  hideClientName: false,
  hideValidated: false,
  hideButton: false,


  checklist: true,
  selectedOauthClientId: '',
  page: 0,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default OAuthClientsTable; 