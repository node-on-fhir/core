// imports/ui-fhir/endpoints/EndpointFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'error', label: 'Error' },
  { value: 'off', label: 'Off' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const connectionTypeOptions = [
  { value: 'hl7-fhir-rest', label: 'HL7 FHIR REST' },
  { value: 'hl7-fhir-msg', label: 'HL7 FHIR Messaging' },
  { value: 'hl7v2-mllp', label: 'HL7v2 MLLP' },
  { value: 'secure-email', label: 'Secure Email' },
  { value: 'direct-project', label: 'Direct Project' },
  { value: 'cds-hooks-service', label: 'CDS Hooks Service' },
  { value: 'ihe-xcpd', label: 'IHE XCPD' },
  { value: 'ihe-xca', label: 'IHE XCA' },
  { value: 'ihe-xdr', label: 'IHE XDR' },
  { value: 'ihe-xds', label: 'IHE XDS' },
  { value: 'dicom-wado-rs', label: 'DICOM WADO-RS' },
  { value: 'dicom-qido-rs', label: 'DICOM QIDO-RS' },
  { value: 'dicom-stow-rs', label: 'DICOM STOW-RS' }
];

//===========================================================================
// COMPONENT

function EndpointFormView({ resource, isEditing, onChange, isEmbedded }) {
  var endpoint = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Stack spacing={3}>
      <TextField
        id="nameInput"
        fullWidth
        label="Endpoint Name"
        value={get(endpoint, 'name', '')}
        onChange={function(e) { handleChange('name', e.target.value); }}
        helperText="A friendly name for this endpoint"
        disabled={!isEditing}
      />

      <TextField
        id="addressInput"
        fullWidth
        label="Address (URL)"
        value={get(endpoint, 'address', '')}
        onChange={function(e) { handleChange('address', e.target.value); }}
        helperText="The URL for connecting to this endpoint"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="statusSelect"
            value={get(endpoint, 'status', 'active')}
            onChange={function(e) { handleChange('status', e.target.value); }}
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

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Connection Type</InputLabel>
          <Select
            id="connectionTypeSelect"
            value={get(endpoint, 'connectionType[0].coding[0].code', '')}
            onChange={function(e) {
              var selectedOption = connectionTypeOptions.find(function(opt) { return opt.value === e.target.value; });
              handleChange('connectionType[0].coding[0].code', e.target.value);
              handleChange('connectionType[0].coding[0].display', selectedOption ? selectedOption.label : e.target.value);
            }}
            label="Connection Type"
          >
            {connectionTypeOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }}>Managing Organization</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="managingOrganizationDisplay"
          fullWidth
          label="Organization Name"
          value={get(endpoint, 'managingOrganization.display', '')}
          onChange={function(e) { handleChange('managingOrganization.display', e.target.value); }}
          helperText="Name of the organization managing this endpoint"
          disabled={!isEditing}
        />

        <TextField
          id="managingOrganizationReference"
          fullWidth
          label="Organization Reference"
          value={get(endpoint, 'managingOrganization.reference', '')}
          onChange={function(e) { handleChange('managingOrganization.reference', e.target.value); }}
          helperText="e.g., Organization/123"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }}>Payload Configuration</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="payloadTypeText"
          fullWidth
          label="Payload Type"
          value={get(endpoint, 'payloadType[0].text', '')}
          onChange={function(e) { handleChange('payloadType[0].text', e.target.value); }}
          helperText="Type of content this endpoint accepts"
          disabled={!isEditing}
        />

        <TextField
          id="payloadMimeType"
          fullWidth
          label="MIME Type"
          value={get(endpoint, 'payloadMimeType[0]', 'application/fhir+json')}
          onChange={function(e) { handleChange('payloadMimeType[0]', e.target.value); }}
          helperText="e.g., application/fhir+json"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }}>Validity Period</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="periodStart"
          fullWidth
          type="date"
          label="Start Date"
          value={get(endpoint, 'period.start', '') ? moment(get(endpoint, 'period.start')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('period.start', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="periodEnd"
          fullWidth
          type="date"
          label="End Date"
          value={get(endpoint, 'period.end', '') ? moment(get(endpoint, 'period.end')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('period.end', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }}>Headers</Typography>

      <TextField
        id="headersInput"
        fullWidth
        multiline
        rows={3}
        label="Custom Headers"
        value={get(endpoint, 'header', []).join('\n')}
        onChange={function(e) { handleChange('header', e.target.value.split('\n').filter(function(h) { return h.trim(); })); }}
        helperText="One header per line (e.g., Authorization: Bearer token)"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default EndpointFormView;
