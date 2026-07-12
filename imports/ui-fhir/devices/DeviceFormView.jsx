// imports/ui-fhir/devices/DeviceFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  IconButton,
  Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const typeOptions = [
  { code: 'monitoring', display: 'Monitoring Equipment' },
  { code: 'diagnostic', display: 'Diagnostic Equipment' },
  { code: 'therapeutic', display: 'Therapeutic Equipment' },
  { code: 'surgical', display: 'Surgical Equipment' },
  { code: '86184003', display: 'Electrocardiograph' },
  { code: '38017009', display: 'Blood pressure monitor' },
  { code: '448703006', display: 'Pulse oximeter' },
  { code: '33894003', display: 'Glucose meter' },
  { code: '19892000', display: 'Scale' },
  { code: '32033000', display: 'Thermometer' },
  { code: '336602003', display: 'Oxygen concentrator' },
  { code: '706767009', display: 'Patient data recorder' },
  { code: '303473007', display: 'Wheelchair' },
  { code: '360055006', display: 'Walker' }
];

function DeviceFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var device = resource || form || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Device Information</Typography>

      <TextField
        id="deviceNameInput"
        fullWidth
        label="Device Name"
        value={get(device, 'deviceName[0].name', '')}
        onChange={(e) => onChange('deviceName[0].name', e.target.value)}
        required
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="manufacturerInput"
          fullWidth
          label="Manufacturer"
          value={get(device, 'manufacturer', '')}
          onChange={(e) => onChange('manufacturer', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="modelNumberInput"
          fullWidth
          label="Model Number"
          value={get(device, 'modelNumber', '')}
          onChange={(e) => onChange('modelNumber', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="serialNumberInput"
          fullWidth
          label="Serial Number"
          value={get(device, 'serialNumber', '')}
          onChange={(e) => onChange('serialNumber', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="lotNumberInput"
          fullWidth
          label="Lot Number"
          value={get(device, 'lotNumber', '')}
          onChange={(e) => onChange('lotNumber', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="versionInput"
        fullWidth
        label="Version"
        value={get(device, 'version[0].value', '')}
        onChange={(e) => onChange('version[0].value', e.target.value)}
        disabled={!isEditing}
      />

      <Typography variant="h6">Type & Status</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Device Type</InputLabel>
          <Select
            id="typeSelect"
            value={get(device, 'type.coding[0].code', '')}
            onChange={(e) => {
              const option = typeOptions.find(function(o) { return o.code === e.target.value; });
              if (option) {
                const isSimpleCode = ['monitoring', 'diagnostic', 'therapeutic', 'surgical'].includes(option.code);
                const system = isSimpleCode ?
                  'http://hl7.org/fhir/device-category' :
                  'http://snomed.info/sct';

                onChange('type', {
                  coding: [{ system: system, code: option.code, display: option.display }],
                  text: option.display
                });
              }
            }}
            label="Device Type"
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>
            {typeOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="statusSelect"
            value={get(device, 'status', 'active')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <TextField
        id="typeDisplayInput"
        fullWidth
        label="Type Display"
        value={get(device, 'type.coding[0].display', '')}
        onChange={(e) => onChange('type.coding[0].display', e.target.value)}
        disabled={!isEditing}
      />

      <Typography variant="h6">Dates</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="manufactureDateInput"
          fullWidth
          type="date"
          label="Manufacture Date"
          value={get(device, 'manufactureDate', '')}
          onChange={(e) => onChange('manufactureDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="expirationDateInput"
          fullWidth
          type="date"
          label="Expiration Date"
          value={get(device, 'expirationDate', '')}
          onChange={(e) => onChange('expirationDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Patient Association</Typography>

      <TextField
        id="patientDisplay"
        fullWidth
        label="Patient"
        value={get(device, 'patient.display', '')}
        onChange={(e) => onChange('patient.display', e.target.value)}
        disabled={!isEditing}
        helperText={get(device, 'patient.reference', '') || 'Patient reference will be assigned'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton
                  onClick={onSearchPatient}
                  edge="end"
                  disabled={!isEditing}
                  aria-label="Search for patient"
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      <Typography variant="h6">Notes</Typography>

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={get(device, 'note[0].text', '')}
        onChange={(e) => onChange('note[0].text', e.target.value)}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default DeviceFormView;
