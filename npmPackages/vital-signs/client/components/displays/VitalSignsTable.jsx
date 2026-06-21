// packages/vital-signs/client/components/displays/VitalSignsTable.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Chip,
  Tooltip,
  Typography
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

import moment from 'moment';
import { get } from 'lodash';

// Main component
function VitalSignsTable(props) {
  const {
    id,
    vitalSigns,
    
    // Display toggles
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideType,
    hideValue,
    hideUnits,
    hidePatient,
    hidePatientReference,
    hideDateTime,
    hideStatus,
    hidePerformer,
    hideDevice,
    hideBarcode,
    
    // Interaction handlers
    onRowClick,
    onCellClick,
    onRemoveRecord,
    onActionButtonClick,
    onSetPage,
    
    // Pagination
    page,
    rowsPerPage,
    count,
    disablePagination,
    
    // Formatting
    dateFormat,
    showMinutes,
    showSeconds,
    multiline,
    tableRowSize,
    
    // Form factor
    formFactorLayout,
    
    // Action button
    actionButtonLabel,
    
    ...otherProps
  } = props;
  
  // Configure columns based on form factor
  let columnConfig = {
    hideCheckbox,
    hideActionIcons,
    hideIdentifier,
    hideType,
    hideValue,
    hideUnits,
    hidePatient,
    hidePatientReference,
    hideDateTime,
    hideStatus,
    hidePerformer,
    hideDevice,
    hideBarcode
  };
  
  if (formFactorLayout) {
    switch (formFactorLayout) {
      case "phone":
        columnConfig = {
          ...columnConfig,
          hideCheckbox: true,
          hideActionIcons: true,
          hideIdentifier: true,
          hidePatient: true,
          hidePatientReference: true,
          hideStatus: true,
          hidePerformer: true,
          hideDevice: true,
          hideBarcode: true,
          multiline: true
        };
        break;
      case "tablet":
        columnConfig = {
          ...columnConfig,
          hideCheckbox: true,
          hideActionIcons: true,
          hideIdentifier: true,
          hidePatient: true,
          hidePatientReference: true,
          hidePerformer: true,
          hideDevice: true,
          hideBarcode: true
        };
        break;
      case "web":
      case "desktop":
        columnConfig = {
          ...columnConfig,
          hideIdentifier: true,
          hidePatientReference: true,
          hideBarcode: true
        };
        break;
    }
  }
  
  // Handle pagination
  function handleChangePage(event, newPage) {
    if (typeof onSetPage === "function") {
      onSetPage(newPage);
    }
  }
  
  // Handle row click
  function handleRowClick(id) {
    if (typeof onRowClick === "function") {
      onRowClick(id);
    }
  }
  
  // Handle cell click
  function handleCellClick(id, field) {
    if (typeof onCellClick === "function") {
      onCellClick(id, field);
    }
  }
  
  // Handle remove
  function handleRemoveRecord(id) {
    if (typeof onRemoveRecord === "function") {
      onRemoveRecord(id);
    }
  }
  
  // Handle action button
  function handleActionButtonClick(id) {
    if (typeof onActionButtonClick === "function") {
      onActionButtonClick(id);
    }
  }
  
  // Format date
  let internalDateFormat = "YYYY-MM-DD";
  if (showMinutes) {
    internalDateFormat = "YYYY-MM-DD hh:mm";
  }
  if (showSeconds) {
    internalDateFormat = "YYYY-MM-DD hh:mm:ss";
  }
  if (dateFormat) {
    internalDateFormat = dateFormat;
  }
  
  // Prepare vital signs for display
  const vitalSignsToRender = [];
  if (vitalSigns && Array.isArray(vitalSigns)) {
    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    vitalSigns.slice(startIndex, endIndex).forEach(function(vital) {
      vitalSignsToRender.push({
        _id: get(vital, 'id', get(vital, '_id')),
        identifier: get(vital, 'identifier[0].value', ''),
        type: get(vital, 'code.text', get(vital, 'code.coding[0].display', '')),
        code: get(vital, 'code.coding[0].code', ''),
        value: get(vital, 'valueQuantity.value', get(vital, 'valueString', '')),
        unit: get(vital, 'valueQuantity.unit', ''),
        patient: get(vital, 'subject.display', ''),
        patientReference: get(vital, 'subject.reference', ''),
        dateTime: moment(get(vital, 'effectiveDateTime')).format(internalDateFormat),
        status: get(vital, 'status', ''),
        performer: get(vital, 'performer[0].display', ''),
        device: get(vital, 'device.display', '')
      });
    });
  }
  
  // Render functions
  function renderCheckboxHeader() {
    if (!columnConfig.hideCheckbox) {
      return <TableCell padding="checkbox">Select</TableCell>;
    }
  }
  
  function renderCheckbox(vital) {
    if (!columnConfig.hideCheckbox) {
      return (
        <TableCell padding="checkbox">
          <Checkbox />
        </TableCell>
      );
    }
  }
  
  function renderActionIconsHeader() {
    if (!columnConfig.hideActionIcons) {
      return <TableCell align="center">Actions</TableCell>;
    }
  }
  
  function renderActionIcons(vital) {
    if (!columnConfig.hideActionIcons) {
      return (
        <TableCell align="center">
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleActionButtonClick(vital._id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleCellClick(vital._id, 'edit')}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleRemoveRecord(vital._id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </TableCell>
      );
    }
  }
  
  function renderTypeHeader() {
    if (!columnConfig.hideType) {
      return <TableCell>Type</TableCell>;
    }
  }
  
  function renderType(vital) {
    if (!columnConfig.hideType) {
      if (multiline && columnConfig.hideDateTime) {
        return (
          <TableCell>
            <Typography variant="body2">{vital.type}</Typography>
            <Typography variant="caption" color="text.secondary">
              {vital.dateTime}
            </Typography>
          </TableCell>
        );
      }
      return <TableCell>{vital.type}</TableCell>;
    }
  }
  
  function renderValueHeader() {
    if (!columnConfig.hideValue) {
      return <TableCell align="right">Value</TableCell>;
    }
  }
  
  function renderValue(vital) {
    if (!columnConfig.hideValue) {
      return (
        <TableCell align="right">
          <strong>{vital.value}</strong>
          {!columnConfig.hideUnits && vital.unit && ` ${vital.unit}`}
        </TableCell>
      );
    }
  }
  
  function renderUnitsHeader() {
    if (!columnConfig.hideUnits) {
      return <TableCell>Units</TableCell>;
    }
  }
  
  function renderUnits(vital) {
    if (!columnConfig.hideUnits) {
      return <TableCell>{vital.unit}</TableCell>;
    }
  }
  
  function renderPatientHeader() {
    if (!columnConfig.hidePatient) {
      return <TableCell>Patient</TableCell>;
    }
  }
  
  function renderPatient(vital) {
    if (!columnConfig.hidePatient) {
      return <TableCell>{vital.patient}</TableCell>;
    }
  }
  
  function renderPatientReferenceHeader() {
    if (!columnConfig.hidePatientReference) {
      return <TableCell>Patient Reference</TableCell>;
    }
  }
  
  function renderPatientReference(vital) {
    if (!columnConfig.hidePatientReference) {
      return <TableCell>{vital.patientReference}</TableCell>;
    }
  }
  
  function renderDateTimeHeader() {
    if (!columnConfig.hideDateTime) {
      return <TableCell>Date/Time</TableCell>;
    }
  }
  
  function renderDateTime(vital) {
    if (!columnConfig.hideDateTime) {
      return <TableCell>{vital.dateTime}</TableCell>;
    }
  }
  
  function renderStatusHeader() {
    if (!columnConfig.hideStatus) {
      return <TableCell>Status</TableCell>;
    }
  }
  
  function renderStatus(vital) {
    if (!columnConfig.hideStatus) {
      const chipColor = vital.status === 'final' ? 'success' : 
                       vital.status === 'entered-in-error' ? 'error' : 'default';
      return (
        <TableCell>
          <Chip label={vital.status} size="small" color={chipColor} />
        </TableCell>
      );
    }
  }
  
  function renderPerformerHeader() {
    if (!columnConfig.hidePerformer) {
      return <TableCell>Performer</TableCell>;
    }
  }
  
  function renderPerformer(vital) {
    if (!columnConfig.hidePerformer) {
      return <TableCell>{vital.performer}</TableCell>;
    }
  }
  
  function renderDeviceHeader() {
    if (!columnConfig.hideDevice) {
      return <TableCell>Device</TableCell>;
    }
  }
  
  function renderDevice(vital) {
    if (!columnConfig.hideDevice) {
      return <TableCell>{vital.device}</TableCell>;
    }
  }
  
  function renderBarcodeHeader() {
    if (!columnConfig.hideBarcode) {
      return <TableCell>ID</TableCell>;
    }
  }
  
  function renderBarcode(vital) {
    if (!columnConfig.hideBarcode) {
      return (
        <TableCell>
          <Typography variant="caption" fontFamily="monospace">
            {vital._id}
          </Typography>
        </TableCell>
      );
    }
  }
  
  // Render table rows
  const tableRows = vitalSignsToRender.map(function(vital, index) {
    return (
      <TableRow
        key={vital._id || index}
        hover
        onClick={() => handleRowClick(vital._id)}
        sx={{ cursor: 'pointer' }}
      >
        {renderCheckbox(vital)}
        {renderActionIcons(vital)}
        {renderType(vital)}
        {renderValue(vital)}
        {renderUnits(vital)}
        {renderPatient(vital)}
        {renderPatientReference(vital)}
        {renderDateTime(vital)}
        {renderStatus(vital)}
        {renderPerformer(vital)}
        {renderDevice(vital)}
        {renderBarcode(vital)}
      </TableRow>
    );
  });
  
  // Pagination
  let paginationFooter;
  if (!disablePagination) {
    const paginationCount = count || (vitalSigns ? vitalSigns.length : 0);
    paginationFooter = (
      <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25, 100]}
        colSpan={3}
        count={paginationCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        sx={{ border: 'none' }}
      />
    );
  }
  
  return (
    <div id={id} className="tableWithPagination">
      <Table size={tableRowSize} aria-label="vital signs table" {...otherProps}>
        <TableHead>
          <TableRow>
            {renderCheckboxHeader()}
            {renderActionIconsHeader()}
            {renderTypeHeader()}
            {renderValueHeader()}
            {renderUnitsHeader()}
            {renderPatientHeader()}
            {renderPatientReferenceHeader()}
            {renderDateTimeHeader()}
            {renderStatusHeader()}
            {renderPerformerHeader()}
            {renderDeviceHeader()}
            {renderBarcodeHeader()}
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.length > 0 ? tableRows : (
            <TableRow>
              <TableCell colSpan={12} align="center">
                <Typography variant="body1" color="text.secondary" py={4}>
                  No vital signs to display
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {paginationFooter}
    </div>
  );
}

VitalSignsTable.propTypes = {
  id: PropTypes.string,
  vitalSigns: PropTypes.array,
  
  // Display toggles
  hideCheckbox: PropTypes.bool,
  hideActionIcons: PropTypes.bool,
  hideIdentifier: PropTypes.bool,
  hideType: PropTypes.bool,
  hideValue: PropTypes.bool,
  hideUnits: PropTypes.bool,
  hidePatient: PropTypes.bool,
  hidePatientReference: PropTypes.bool,
  hideDateTime: PropTypes.bool,
  hideStatus: PropTypes.bool,
  hidePerformer: PropTypes.bool,
  hideDevice: PropTypes.bool,
  hideBarcode: PropTypes.bool,
  
  // Interaction handlers
  onRowClick: PropTypes.func,
  onCellClick: PropTypes.func,
  onRemoveRecord: PropTypes.func,
  onActionButtonClick: PropTypes.func,
  onSetPage: PropTypes.func,
  
  // Pagination
  page: PropTypes.number,
  rowsPerPage: PropTypes.number,
  count: PropTypes.number,
  disablePagination: PropTypes.bool,
  
  // Formatting
  dateFormat: PropTypes.string,
  showMinutes: PropTypes.bool,
  showSeconds: PropTypes.bool,
  multiline: PropTypes.bool,
  tableRowSize: PropTypes.string,
  
  // Form factor
  formFactorLayout: PropTypes.string,
  
  // Action button
  actionButtonLabel: PropTypes.string
};

VitalSignsTable.defaultProps = {
  vitalSigns: [],
  tableRowSize: 'medium',
  page: 0,
  rowsPerPage: 5,
  dateFormat: "YYYY-MM-DD hh:mm",
  showMinutes: true,
  showSeconds: false,
  hideCheckbox: false,
  hideActionIcons: false,
  hideIdentifier: true,
  hidePatientReference: true,
  hideBarcode: true,
  hideUnits: false,
  multiline: false
};

export default VitalSignsTable;