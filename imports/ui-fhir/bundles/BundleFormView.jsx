// imports/ui-fhir/bundles/BundleFormView.jsx

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

var typeOptions = [
  { value: 'document', label: 'Document' },
  { value: 'message', label: 'Message' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'transaction-response', label: 'Transaction Response' },
  { value: 'batch', label: 'Batch' },
  { value: 'batch-response', label: 'Batch Response' },
  { value: 'history', label: 'History' },
  { value: 'searchset', label: 'Search Set' },
  { value: 'collection', label: 'Collection' }
];

function BundleFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  var bundle = resource || form || {};

  var entryCount = get(bundle, 'entry', []).length;

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Bundle Information</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="identifierInput"
          fullWidth
          label="Identifier"
          value={get(bundle, 'identifier.value', '')}
          onChange={(e) => onChange('identifier.value', e.target.value)}
          disabled={!isEditing}
        />

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Type</InputLabel>
          <Select
            id="typeSelect"
            value={get(bundle, 'type', '')}
            onChange={(e) => onChange('type', e.target.value)}
            label="Type"
          >
            <MenuItem value="">
              <em>Not specified</em>
            </MenuItem>
            {typeOptions.map(function(option) {
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
        id="timestampInput"
        fullWidth
        type="datetime-local"
        label="Timestamp"
        value={get(bundle, 'timestamp', '')}
        onChange={(e) => onChange('timestamp', e.target.value)}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <TextField
        id="totalInput"
        fullWidth
        type="number"
        label="Total"
        value={get(bundle, 'total', '')}
        onChange={(e) => onChange('total', parseInt(e.target.value, 10) || 0)}
        disabled={!isEditing}
        helperText="Total number of entries (for search/history bundles)"
      />

      <Typography variant="h6">Entries</Typography>

      <TextField
        id="entryCountDisplay"
        fullWidth
        label="Entry Count"
        value={entryCount}
        disabled
        helperText="Number of resources in this bundle"
      />

      <Typography variant="h6">Raw Content</Typography>

      <TextField
        id="rawContentInput"
        fullWidth
        multiline
        rows={8}
        label="Bundle JSON"
        value={JSON.stringify(get(bundle, 'entry', []), null, 2)}
        disabled
        helperText="Read-only view of bundle entries"
        InputProps={{
          sx: { fontFamily: 'monospace', fontSize: '0.85rem' }
        }}
      />
    </Stack>
  );
}

export default BundleFormView;
