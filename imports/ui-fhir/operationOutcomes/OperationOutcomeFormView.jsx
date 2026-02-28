// imports/ui-fhir/operationOutcomes/OperationOutcomeFormView.jsx

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

const severityOptions = [
  { value: 'fatal', label: 'Fatal' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'information', label: 'Information' }
];

const issueCodeOptions = [
  { value: 'invalid', label: 'Invalid Content' },
  { value: 'structure', label: 'Structural Issue' },
  { value: 'required', label: 'Required Element Missing' },
  { value: 'value', label: 'Element Value Invalid' },
  { value: 'invariant', label: 'Validation Rule Failed' },
  { value: 'security', label: 'Security Problem' },
  { value: 'login', label: 'Login Required' },
  { value: 'unknown', label: 'Unknown User' },
  { value: 'expired', label: 'Session Expired' },
  { value: 'forbidden', label: 'Forbidden' },
  { value: 'suppressed', label: 'Information Suppressed' },
  { value: 'processing', label: 'Processing Failure' },
  { value: 'not-supported', label: 'Content Not Supported' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'not-found', label: 'Not Found' },
  { value: 'too-long', label: 'Content Too Long' },
  { value: 'code-invalid', label: 'Invalid Code' },
  { value: 'extension', label: 'Unacceptable Extension' },
  { value: 'too-costly', label: 'Operation Too Costly' },
  { value: 'business-rule', label: 'Business Rule Violation' },
  { value: 'conflict', label: 'Edit Version Conflict' },
  { value: 'transient', label: 'Transient Issue' },
  { value: 'lock-error', label: 'Lock Error' },
  { value: 'no-store', label: 'No Store Available' },
  { value: 'exception', label: 'Exception' },
  { value: 'timeout', label: 'Timeout' },
  { value: 'throttled', label: 'Throttled' },
  { value: 'informational', label: 'Informational Note' }
];

function OperationOutcomeFormView({ resource, isEditing, onChange, isEmbedded }) {
  var operationOutcome = resource || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Issue Details</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Severity</InputLabel>
          <Select
            id="severitySelect"
            value={get(operationOutcome, 'issue[0].severity', '')}
            onChange={function(e) { onChange('issue[0].severity', e.target.value); }}
            label="Severity"
          >
            {severityOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Issue Code</InputLabel>
          <Select
            id="issueCodeSelect"
            value={get(operationOutcome, 'issue[0].code', '')}
            onChange={function(e) { onChange('issue[0].code', e.target.value); }}
            label="Issue Code"
          >
            {issueCodeOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6">Diagnostics</Typography>

      <TextField
        id="diagnosticsInput"
        fullWidth
        multiline
        rows={3}
        label="Diagnostics"
        value={get(operationOutcome, 'issue[0].diagnostics', '')}
        onChange={function(e) { onChange('issue[0].diagnostics', e.target.value); }}
        helperText="Additional diagnostic information about the issue"
        disabled={!isEditing}
      />

      <TextField
        id="detailsTextInput"
        fullWidth
        label="Details Text"
        value={get(operationOutcome, 'issue[0].details.text', '')}
        onChange={function(e) { onChange('issue[0].details.text', e.target.value); }}
        helperText="Additional details about the error"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="detailsCodeInput"
          fullWidth
          label="Details Code"
          value={get(operationOutcome, 'issue[0].details.coding[0].code', '')}
          onChange={function(e) { onChange('issue[0].details.coding[0].code', e.target.value); }}
          helperText="Coded details about the issue"
          disabled={!isEditing}
        />

        <TextField
          id="detailsDisplayInput"
          fullWidth
          label="Details Display"
          value={get(operationOutcome, 'issue[0].details.coding[0].display', '')}
          onChange={function(e) { onChange('issue[0].details.coding[0].display', e.target.value); }}
          helperText="Human readable detail description"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Expression</Typography>

      <TextField
        id="expressionInput"
        fullWidth
        label="FHIRPath Expression"
        value={get(operationOutcome, 'issue[0].expression[0]', '')}
        onChange={function(e) { onChange('issue[0].expression[0]', e.target.value); }}
        helperText="FHIRPath of element(s) related to issue"
        disabled={!isEditing}
      />

      <TextField
        id="locationInput"
        fullWidth
        label="Location (XPath)"
        value={get(operationOutcome, 'issue[0].location[0]', '')}
        onChange={function(e) { onChange('issue[0].location[0]', e.target.value); }}
        helperText="Deprecated: XPath of element(s) related to issue"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default OperationOutcomeFormView;
