// imports/ui-fhir/locations/LocationFormView.jsx

import React from 'react';

import {
  Box,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const statusOptions = ['active', 'suspended', 'inactive'];
const modeOptions = ['instance', 'kind'];

const operationalStatusOptions = [
  { code: 'operational', display: 'Operational' },
  { code: 'housekeeping', display: 'Housekeeping' },
  { code: 'overflow', display: 'Overflow' },
  { code: 'contaminated', display: 'Contaminated' },
  { code: 'decontamination', display: 'Decontamination' },
  { code: 'underway', display: 'Underway' }
];

//===========================================================================
// COMPONENT

function LocationFormView({ resource, isEditing, onChange, isEmbedded }) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Location Information</Typography>

      <TextField
        id="nameInput"
        fullWidth
        label="Name"
        value={get(resource, 'name', '')}
        onChange={(e) => onChange('name', e.target.value)}
        helperText="Name of the location"
        disabled={!isEditing}
      />

      <TextField
        id="identifierInput"
        fullWidth
        label="Identifier"
        value={get(resource, 'identifier[0].value', '')}
        onChange={(e) => onChange('identifier[0].value', e.target.value)}
        helperText="Unique identifier for the location"
        disabled={!isEditing}
      />

      <TextField
        id="descriptionTextarea"
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={get(resource, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        helperText="Description of the location"
        disabled={!isEditing}
      />

      <TextField
        id="emailInput"
        fullWidth
        label="Email"
        value={get(resource, 'telecom[1].value', '')}
        onChange={(e) => {
          onChange('telecom[1].system', 'email');
          onChange('telecom[1].value', e.target.value);
        }}
        helperText="Contact email address"
        disabled={!isEditing}
      />

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Status</InputLabel>
        <Select
          id="statusSelect"
          value={get(resource, 'status', 'active')}
          onChange={(e) => onChange('status', e.target.value)}
          label="Status"
        >
          {statusOptions.map(function(status) {
            return (
              <MenuItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Operational Status</InputLabel>
        <Select
          id="operationalStatusSelect"
          value={get(resource, 'operationalStatus.code', '')}
          onChange={(e) => onChange('operationalStatus.code', e.target.value)}
          label="Operational Status"
        >
          {operationalStatusOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Mode</InputLabel>
        <Select
          id="modeSelect"
          value={get(resource, 'mode', 'instance')}
          onChange={(e) => onChange('mode', e.target.value)}
          label="Mode"
        >
          {modeOptions.map(function(mode) {
            return (
              <MenuItem key={mode} value={mode}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        id="typeSelect"
        fullWidth
        label="Type Code"
        value={get(resource, 'type.coding[0].code', '')}
        onChange={(e) => onChange('type.coding[0].code', e.target.value)}
        helperText="Location type code (e.g., ER, ICU)"
        disabled={!isEditing}
      />

      <TextField
        id="typeDisplayInput"
        fullWidth
        label="Type Display"
        value={get(resource, 'type.coding[0].display', '')}
        onChange={(e) => onChange('type.coding[0].display', e.target.value)}
        helperText="Human-readable location type"
        disabled={!isEditing}
      />

      <TextField
        id="physicalTypeCodeInput"
        fullWidth
        label="Physical Type Code"
        value={get(resource, 'physicalType.coding[0].code', '')}
        onChange={(e) => onChange('physicalType.coding[0].code', e.target.value)}
        helperText="Physical type code (e.g., ro for room)"
        disabled={!isEditing}
      />

      <TextField
        id="physicalTypeDisplayInput"
        fullWidth
        label="Physical Type Display"
        value={get(resource, 'physicalType.coding[0].display', '')}
        onChange={(e) => onChange('physicalType.coding[0].display', e.target.value)}
        helperText="Human-readable physical type"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>Address</Typography>

      <TextField
        id="addressLineInput"
        fullWidth
        label="Address Line"
        value={get(resource, 'address.line[0]', '')}
        onChange={(e) => onChange('address.line[0]', e.target.value)}
        helperText="Street address"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="cityInput"
          fullWidth
          label="City"
          value={get(resource, 'address.city', '')}
          onChange={(e) => onChange('address.city', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="stateInput"
          fullWidth
          label="State"
          value={get(resource, 'address.state', '')}
          onChange={(e) => onChange('address.state', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="postalCodeInput"
          fullWidth
          label="Postal Code"
          value={get(resource, 'address.postalCode', '')}
          onChange={(e) => onChange('address.postalCode', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="countryInput"
          fullWidth
          label="Country"
          value={get(resource, 'address.country', '')}
          onChange={(e) => onChange('address.country', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="phoneInput"
        fullWidth
        label="Phone"
        value={get(resource, 'telecom[0].value', '')}
        onChange={(e) => onChange('telecom[0].value', e.target.value)}
        helperText="Contact phone number"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>Position</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="latitudeInput"
          fullWidth
          label="Latitude"
          value={get(resource, 'position.latitude', '')}
          onChange={(e) => onChange('position.latitude', parseFloat(e.target.value) || null)}
          type="number"
          disabled={!isEditing}
        />

        <TextField
          id="longitudeInput"
          fullWidth
          label="Longitude"
          value={get(resource, 'position.longitude', '')}
          onChange={(e) => onChange('position.longitude', parseFloat(e.target.value) || null)}
          type="number"
          disabled={!isEditing}
        />

        <TextField
          id="altitudeInput"
          fullWidth
          label="Altitude"
          value={get(resource, 'position.altitude', '')}
          onChange={(e) => onChange('position.altitude', parseFloat(e.target.value) || null)}
          type="number"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }}>Organization</Typography>

      <TextField
        id="managingOrgInput"
        fullWidth
        label="Managing Organization"
        value={get(resource, 'managingOrganization.display', '')}
        onChange={(e) => onChange('managingOrganization.display', e.target.value)}
        helperText="Organization that manages this location"
        disabled={!isEditing}
      />

      <TextField
        id="partOfInput"
        fullWidth
        label="Part Of"
        value={get(resource, 'partOf.display', '')}
        onChange={(e) => onChange('partOf.display', e.target.value)}
        helperText="Another location this one is part of"
        disabled={!isEditing}
      />

      <Box sx={{ mt: 2 }}>
        <Link href="https://www.hl7.org/fhir/valueset-c80-facilitycodes.html" target="_blank" rel="noopener">
          Location Type Codes
        </Link>
        {' | '}
        <Link href="https://www.hl7.org/fhir/valueset-location-physical-type.html" target="_blank" rel="noopener">
          Physical Type Codes
        </Link>
      </Box>
    </Stack>
  );
}

export default LocationFormView;
