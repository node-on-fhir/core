// /imports/ui-fhir/practitionerRoles/PractitionerRolesTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Button,
  IconButton,
  Box
} from '@mui/material';

import { get, has } from 'lodash';
import moment from 'moment';

import { FhirDehydrator } from '../../lib/FhirDehydrator';


//=============================================================================================================================================
// THEMING

const styles = {
  hideOnPhone: {
    visibility: 'visible',
    display: 'table'
  },
  cellHideOnPhone: {
    visibility: 'visible',
    display: 'table-cell',
    paddingTop: '16px',
    maxWidth: '120px'
  },
  cell: {
    paddingTop: '16px'
  }
};


//=============================================================================================================================================
// MAIN COMPONENT

function PractitionerRolesTable(props){
  const {
    id,
    practitionerRoles,
    selectedPractitionerRoleId,
    query,
    paginationLimit,
    disablePagination,
    count,
    formFactorLayout,
    rowsPerPage,
    dateFormat,
    showMinutes,
    hideCheckbox,
    hideActionButton,
    hideBarcode,
    hideActive,
    hidePractitioner,
    hideOrganization,
    hideCode,
    hideSpecialty,
    hideLocation,
    hidePeriodStart,
    hidePeriodEnd,
    hidePhone,
    hideEmail,
    enteredInError,
    multiline,
    onCellClick,
    onRowClick,
    onMetaClick,
    onRemoveRecord,
    onActionButtonClick,
    showActionButton,
    actionButtonLabel,
    onSetPage,
    page,
    ...otherProps
  } = props;

  // Pagination state
  const [currentPage, setCurrentPage] = useState(page || 0);
  const [rowsPerPageState, setRowsPerPageState] = useState(rowsPerPage || 5);

  // Form factor adjustments
  let hideActiveColumn = hideActive;
  let hidePractitionerColumn = hidePractitioner;
  let hideOrganizationColumn = hideOrganization;
  let hideCodeColumn = hideCode;
  let hideSpecialtyColumn = hideSpecialty;
  let hideLocationColumn = hideLocation;
  let hidePeriodStartColumn = hidePeriodStart;
  let hidePeriodEndColumn = hidePeriodEnd;
  let hidePhoneColumn = hidePhone;
  let hideEmailColumn = hideEmail;
  let hideBarcodeColumn = hideBarcode;
  let hideCheckboxColumn = hideCheckbox;

  // Apply form factor layout
  if(formFactorLayout){
    switch (formFactorLayout) {
      case "phone":
        hideActiveColumn = true;
        hideOrganizationColumn = true;
        hideLocationColumn = true;
        hidePeriodStartColumn = true;
        hidePeriodEndColumn = true;
        hidePhoneColumn = true;
        hideEmailColumn = true;
        hideBarcodeColumn = true;
        break;
      case "tablet":
        hideLocationColumn = true;
        hidePeriodStartColumn = true;
        hidePeriodEndColumn = true;
        hidePhoneColumn = true;
        hideEmailColumn = true;
        hideBarcodeColumn = true;
        break;
      case "web":
        // Show all columns on web
        break;
      case "desktop":
        // Show all columns on desktop
        break;
    }
  }

  function handleChangePage(event, newPage){
    setCurrentPage(newPage);
    if(onSetPage){
      onSetPage(newPage);
    }
  }

  function handleChangeRowsPerPage(event){
    setRowsPerPageState(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }

  function handleRowClick(practitionerRoleId){
    if(onRowClick){
      onRowClick(practitionerRoleId);
    }
  }

  function handleActionButtonClick(practitionerRoleId){
    if(onActionButtonClick){
      onActionButtonClick(practitionerRoleId);
    }
  }

  // Flatten and dehydrate practitioner roles for display
  let practitionerRolesToRender = [];
  if(practitionerRoles){
    if(practitionerRoles.length > 0){
      practitionerRoles.forEach(function(practitionerRole){
        let flattenedRole = FhirDehydrator.dehydratePractitionerRole(practitionerRole);
        practitionerRolesToRender.push(flattenedRole);
      });
    }
  }

  // Apply pagination
  const paginatedRoles = disablePagination
    ? practitionerRolesToRender
    : practitionerRolesToRender.slice(currentPage * rowsPerPageState, (currentPage + 1) * rowsPerPageState);

  // Render table headers
  function renderCheckboxHeader(){
    if(!hideCheckboxColumn){
      return <TableCell className="checkbox">Checkbox</TableCell>;
    }
  }
  function renderBarcodeHeader(){
    if(!hideBarcodeColumn){
      return <TableCell className="barcode">System ID</TableCell>;
    }
  }
  function renderActiveHeader(){
    if(!hideActiveColumn){
      return <TableCell className="active">Active</TableCell>;
    }
  }
  function renderPractitionerHeader(){
    if(!hidePractitionerColumn){
      return <TableCell className="practitioner">Practitioner</TableCell>;
    }
  }
  function renderOrganizationHeader(){
    if(!hideOrganizationColumn){
      return <TableCell className="organization">Organization</TableCell>;
    }
  }
  function renderCodeHeader(){
    if(!hideCodeColumn){
      return <TableCell className="code">Role</TableCell>;
    }
  }
  function renderSpecialtyHeader(){
    if(!hideSpecialtyColumn){
      return <TableCell className="specialty">Specialty</TableCell>;
    }
  }
  function renderLocationHeader(){
    if(!hideLocationColumn){
      return <TableCell className="location">Location</TableCell>;
    }
  }
  function renderPeriodStartHeader(){
    if(!hidePeriodStartColumn){
      return <TableCell className="periodStart">Period Start</TableCell>;
    }
  }
  function renderPeriodEndHeader(){
    if(!hidePeriodEndColumn){
      return <TableCell className="periodEnd">Period End</TableCell>;
    }
  }
  function renderPhoneHeader(){
    if(!hidePhoneColumn){
      return <TableCell className="phone">Phone</TableCell>;
    }
  }
  function renderEmailHeader(){
    if(!hideEmailColumn){
      return <TableCell className="email">Email</TableCell>;
    }
  }
  function renderActionButtonHeader(){
    if(!hideActionButton){
      return <TableCell className="actionButton">{actionButtonLabel || 'Actions'}</TableCell>;
    }
  }

  // Render table rows
  let tableRows = [];
  for (let i = 0; i < paginatedRoles.length; i++) {
    const practitionerRole = paginatedRoles[i];
    const roleId = get(practitionerRole, '_id', '');

    tableRows.push(
      <TableRow
        key={roleId || i}
        onClick={() => handleRowClick(roleId)}
        hover
        sx={{ cursor: 'pointer' }}
      >
        {!hideCheckboxColumn && (
          <TableCell className="checkbox">
            <Checkbox checked={roleId === selectedPractitionerRoleId} />
          </TableCell>
        )}
        {!hideBarcodeColumn && (
          <TableCell className="barcode">
            <span className="barcode helveticas">{roleId}</span>
          </TableCell>
        )}
        {!hideActiveColumn && (
          <TableCell className="active">
            {get(practitionerRole, 'active', false) ? 'Yes' : 'No'}
          </TableCell>
        )}
        {!hidePractitionerColumn && (
          <TableCell className="practitioner">
            {get(practitionerRole, 'practitioner', '')}
          </TableCell>
        )}
        {!hideOrganizationColumn && (
          <TableCell className="organization">
            {get(practitionerRole, 'organization', '')}
          </TableCell>
        )}
        {!hideCodeColumn && (
          <TableCell className="code">
            {get(practitionerRole, 'code', '')}
          </TableCell>
        )}
        {!hideSpecialtyColumn && (
          <TableCell className="specialty">
            {get(practitionerRole, 'specialty', '')}
          </TableCell>
        )}
        {!hideLocationColumn && (
          <TableCell className="location">
            {get(practitionerRole, 'location', '')}
          </TableCell>
        )}
        {!hidePeriodStartColumn && (
          <TableCell className="periodStart">
            {get(practitionerRole, 'periodStart', '')}
          </TableCell>
        )}
        {!hidePeriodEndColumn && (
          <TableCell className="periodEnd">
            {get(practitionerRole, 'periodEnd', '')}
          </TableCell>
        )}
        {!hidePhoneColumn && (
          <TableCell className="phone">
            {get(practitionerRole, 'phone', '')}
          </TableCell>
        )}
        {!hideEmailColumn && (
          <TableCell className="email">
            {get(practitionerRole, 'email', '')}
          </TableCell>
        )}
        {!hideActionButton && (
          <TableCell className="actionButton">
            <Button
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleActionButtonClick(roleId);
              }}
            >
              {actionButtonLabel || 'Remove'}
            </Button>
          </TableCell>
        )}
      </TableRow>
    );
  }

  return (
    <Box>
      <TableContainer>
        <Table id={id || 'practitionerRolesTable'} size="small">
          <TableHead>
            <TableRow>
              {renderCheckboxHeader()}
              {renderBarcodeHeader()}
              {renderActiveHeader()}
              {renderPractitionerHeader()}
              {renderOrganizationHeader()}
              {renderCodeHeader()}
              {renderSpecialtyHeader()}
              {renderLocationHeader()}
              {renderPeriodStartHeader()}
              {renderPeriodEndHeader()}
              {renderPhoneHeader()}
              {renderEmailHeader()}
              {renderActionButtonHeader()}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableRows}
          </TableBody>
        </Table>
      </TableContainer>
      {!disablePagination && (
        <TablePagination
          component="div"
          count={practitionerRolesToRender.length}
          page={currentPage}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPageState}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      )}
    </Box>
  );
}

PractitionerRolesTable.propTypes = {
  id: PropTypes.string,
  practitionerRoles: PropTypes.array,
  selectedPractitionerRoleId: PropTypes.string,
  query: PropTypes.object,
  paginationLimit: PropTypes.number,
  disablePagination: PropTypes.bool,
  count: PropTypes.number,
  formFactorLayout: PropTypes.string,
  rowsPerPage: PropTypes.number,
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  hideCheckbox: PropTypes.bool,
  hideActionButton: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  hideActive: PropTypes.bool,
  hidePractitioner: PropTypes.bool,
  hideOrganization: PropTypes.bool,
  hideCode: PropTypes.bool,
  hideSpecialty: PropTypes.bool,
  hideLocation: PropTypes.bool,
  hidePeriodStart: PropTypes.bool,
  hidePeriodEnd: PropTypes.bool,
  hidePhone: PropTypes.bool,
  hideEmail: PropTypes.bool,
  enteredInError: PropTypes.bool,
  multiline: PropTypes.bool,
  onCellClick: PropTypes.func,
  onRowClick: PropTypes.func,
  onMetaClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  showActionButton: PropTypes.bool,
  actionButtonLabel: PropTypes.string,
  onSetPage: PropTypes.func,
  page: PropTypes.number
};

PractitionerRolesTable.defaultProps = {
  practitionerRoles: [],
  hideCheckbox: true,
  hideActionButton: true,
  hideBarcode: true,
  hideActive: false,
  hidePractitioner: false,
  hideOrganization: false,
  hideCode: false,
  hideSpecialty: false,
  hideLocation: true,
  hidePeriodStart: true,
  hidePeriodEnd: true,
  hidePhone: true,
  hideEmail: true,
  rowsPerPage: 5,
  page: 0
};

export default PractitionerRolesTable;
