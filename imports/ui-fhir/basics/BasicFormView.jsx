// imports/ui-fhir/basics/BasicFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Divider
} from '@mui/material';

import { get } from 'lodash';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
  { value: 'unknown', label: 'Unknown' }
];

function BasicFormView({ resource, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>General</Typography>
      <Divider />

      <Stack direction="row" spacing={2}>
        <TextField
          id="titleInput"
          fullWidth
          label="Title"
          value={get(resource, 'title', '')}
          onChange={(e) => onChange('title', e.target.value)}
          disabled={!isEditing}
          placeholder="Lorem ipsum."
        />

        <TextField
          id="publisherInput"
          fullWidth
          label="Publisher"
          value={get(resource, 'publisher', '')}
          onChange={(e) => onChange('publisher', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="versionInput"
          fullWidth
          label="Version"
          value={get(resource, 'version', '')}
          onChange={(e) => onChange('version', e.target.value)}
          disabled={!isEditing}
          placeholder="2020.2"
        />

        <TextField
          id="identifierInput"
          fullWidth
          label="Identifier"
          value={get(resource, 'identifier.0.value', '')}
          onChange={(e) => onChange('identifier.0.value', e.target.value)}
          disabled={!isEditing}
          placeholder="XYZ.1"
        />

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="statusSelect"
            value={get(resource, 'status', '')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Content</Typography>
      <Divider />

      <TextField
        id="descriptionInput"
        fullWidth
        label="Description"
        value={get(resource, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={4}
        placeholder="Lorem ipsum."
      />
    </Stack>
  );
}

export default BasicFormView;
