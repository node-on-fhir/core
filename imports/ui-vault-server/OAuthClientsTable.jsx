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
  Button,
  IconButton,
  Typography
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';


import moment from 'moment'
import _ from 'lodash';
let get = _.get;
let set = _.set;


import { LayoutHelpers } from '../lib/LayoutHelpers';

function dehydrateOauthClient(input){
  let result = {};

  result.software_statement = get(input, 'software_statement');

  result._id = get(input, '_id');
  result.client_id = get(input, 'client_id');
  result.iss = get(input, 'iss');
  result.sub = get(input, 'sub');
  result.aud = get(input, 'aud');
  result.iat = get(input, 'iat');
  result.exp = get(input, 'exp');
  result.jti = get(input, 'jti');
  result.client_name = get(input, 'client_name');
  result.tos_uri = get(input, 'tos_uri');
  result.token_endpoint_auth_method = get(input, 'token_endpoint_auth_method');
  result.pkce_enabled = get(input, 'pkce_enabled', false);
  result.has_secret = !!get(input, 'client_secret');

  result.verified = get(input, 'verified', false);
  result.created_at = get(input, 'created_at');

  // Determine auth type for display
  const authMethod = get(input, 'token_endpoint_auth_method', '');
  if(authMethod === 'none'){
    result.auth_type = 'Public';
  } else if(authMethod === 'private_key_jwt'){
    result.auth_type = 'Asymmetric';
  } else if(authMethod.includes('client_secret')){
    result.auth_type = 'Symmetric';
  } else {
    result.auth_type = authMethod;
  }

  return result;
}

//===========================================================================
// THEMING


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
  console.info('Rendering the OAuthClientsTable');

  // logger.info('Rendering the OAuthClientsTable');
  // logger.data('OAuthClientsTable.props', {data: props}, {source: "OAuthClientsTable.jsx"});



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
    hideClientId,
    hideIss,
    hideExp,
    hideClientName,
    hideBarcode,
    hideCreatedAt,
    hideValidated,
    hideButton,
    hideAuthType,
    hidePkce,
    hideHasSecret,
  

    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    onEditClick,
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
  function renderButton(oauthClient){
    if (!hideButton) {
      if (oauthClient.verified) {
        return (
          <TableCell>
            <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 500 }}>
              &#10003; validated
            </Typography>
          </TableCell>
        );
      } else {
        return (
          <TableCell>
            <Button onClick={handleActionButtonClick.bind(this, oauthClient._id)}>Validate</Button>
          </TableCell>
        );
      }
    }
  }
  function renderButtonHeader(){
    if (!hideButton) {
      return (
        <TableCell>Validate</TableCell>
      );
    }
  }
  function renderEditButton(oauthClient){
    if (typeof onEditClick === 'function') {
      return (
        <TableCell style={{width: '48px', padding: '4px'}}>
          <IconButton
            size="small"
            onClick={function(event){
              event.stopPropagation();
              onEditClick(oauthClient._id);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </TableCell>
      );
    }
  }
  function renderEditButtonHeader(){
    if (typeof onEditClick === 'function') {
      return (
        <TableCell style={{width: '48px'}}>Edit</TableCell>
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

  function renderCreatedAt(created_at){
    if (!hideCreatedAt) {
      return (
        <TableCell className='createdAt'>{ moment(created_at).format("YYYY-MM-DD hh:mm") }</TableCell>
      );
    }
  }
  function renderCreatedAtHeader(){
    if (!hideCreatedAt) {
      return (
        <TableCell>Created At</TableCell>
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

  function renderAuthType(authType){
    if (!hideAuthType) {
      return (
        <TableCell className='authType'>{ authType }</TableCell>
      );
    }
  }
  function renderAuthTypeHeader(){
    if (!hideAuthType) {
      return (
        <TableCell>Auth Type</TableCell>
      );
    }
  }

  function renderPkce(pkceEnabled){
    if (!hidePkce) {
      return (
        <TableCell className='pkce'>{ pkceEnabled ? 'Yes' : 'No' }</TableCell>
      );
    }
  }
  function renderPkceHeader(){
    if (!hidePkce) {
      return (
        <TableCell>PKCE</TableCell>
      );
    }
  }

  function renderHasSecret(hasSecret){
    if (!hideHasSecret) {
      return (
        <TableCell className='hasSecret'>{ hasSecret ? 'Yes' : 'No' }</TableCell>
      );
    }
  }
  function renderHasSecretHeader(){
    if (!hideHasSecret) {
      return (
        <TableCell>Has Secret</TableCell>
      );
    }
  }

  function renderClientId(clientId){
    if (!hideClientId) {
      return (
        <TableCell className='clientId'>{ clientId }</TableCell>
      );
    }
  }
  function renderClientIdHeader(){
    if (!hideClientId) {
      return (
        <TableCell>Client ID</TableCell>
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
      rowsPerPageOptions={[5, 10, 25, 100]}
      // rowsPerPageOptions={[5, 10, 25, 100]}
      colSpan={3}
      count={paginationCount}
      rowsPerPage={rowsPerPageToRender}
      page={page}
      onPageChange={handleChangePage}
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

          { renderClientName(oauthClientsToRender[i].client_name) }
          { renderClientId(oauthClientsToRender[i].client_id) }
          { renderAuthType(oauthClientsToRender[i].auth_type) }
          { renderPkce(oauthClientsToRender[i].pkce_enabled) }
          { renderHasSecret(oauthClientsToRender[i].has_secret) }
          { renderIss(oauthClientsToRender[i].iss) }
          { renderCreatedAt(oauthClientsToRender[i].created_at) }
          { renderExp(oauthClientsToRender[i].exp) }

          { renderButton(oauthClientsToRender[i]) }
          { renderEditButton(oauthClientsToRender[i]) }
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

            { renderClientNameHeader() }
            { renderClientIdHeader() }
            { renderAuthTypeHeader() }
            { renderPkceHeader() }
            { renderHasSecretHeader() }
            { renderIssHeader() }
            { renderCreatedAtHeader() }
            { renderExpHeader() }

            { renderButtonHeader() }
            { renderEditButtonHeader() }
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
  hideClientId: PropTypes.bool,
  hideIss: PropTypes.bool,
  hideExp: PropTypes.bool,
  hideClientName: PropTypes.bool,
  hideCreatedAt: PropTypes.bool,
  hideAuthType: PropTypes.bool,
  hidePkce: PropTypes.bool,
  hideHasSecret: PropTypes.bool,

  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onSetPage: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onEditClick: PropTypes.func,
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
  hideCreatedAt: false,

  hideStatus: false,
  hideId: true,
  hideClientId: false,
  hideIss: false,
  hideExp: false,
  hideClientName: false,
  hideValidated: true,
  hideButton: false,
  hideAuthType: false,
  hidePkce: false,
  hideHasSecret: false,


  checklist: true,
  selectedOauthClientId: '',
  page: 0,
  rowsPerPage: 5,
  tableRowSize: 'medium',
  actionButtonLabel: 'Export'
}

export default OAuthClientsTable; 