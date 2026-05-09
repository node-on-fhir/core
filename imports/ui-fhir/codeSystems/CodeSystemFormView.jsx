// imports/ui-fhir/codeSystems/CodeSystemFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Grid
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'unknown', label: 'Unknown' }
];

const contentOptions = [
  { value: 'not-present', label: 'Not Present' },
  { value: 'example', label: 'Example' },
  { value: 'fragment', label: 'Fragment' },
  { value: 'complete', label: 'Complete' },
  { value: 'supplement', label: 'Supplement' }
];

//===========================================================================
// COMPONENT

function CodeSystemFormView({ resource, isEditing, onChange, isEmbedded }) {
  var codeSystem = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Title */}
        <Grid item xs={12} md={6}>
          <TextField
            id="titleInput"
            fullWidth
            label="Title"
            placeholder="Lorem ipsum."
            value={get(codeSystem, 'title', '')}
            onChange={function(e) { handleChange('title', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Version */}
        <Grid item xs={12} md={3}>
          <TextField
            id="versionInput"
            fullWidth
            label="Version"
            placeholder="2020.2"
            value={get(codeSystem, 'version', '')}
            onChange={function(e) { handleChange('version', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              id="statusInput"
              labelId="status-label"
              value={get(codeSystem, 'status', 'draft')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Name */}
        <Grid item xs={12} md={6}>
          <TextField
            id="nameInput"
            fullWidth
            label="Name"
            placeholder="Lorem ipsum."
            value={get(codeSystem, 'name', '')}
            onChange={function(e) { handleChange('name', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Publisher */}
        <Grid item xs={12} md={6}>
          <TextField
            id="publisherInput"
            fullWidth
            label="Publisher"
            value={get(codeSystem, 'publisher', '')}
            onChange={function(e) { handleChange('publisher', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* URL */}
        <Grid item xs={12} md={8}>
          <TextField
            id="urlInput"
            fullWidth
            label="URL"
            placeholder="http://example.org/fhir/CodeSystem/example"
            value={get(codeSystem, 'url', '')}
            onChange={function(e) { handleChange('url', e.target.value); }}
            helperText="Canonical identifier for this code system"
            disabled={!isEditing}
          />
        </Grid>

        {/* Content */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="content-label">Content</InputLabel>
            <Select
              id="contentInput"
              labelId="content-label"
              value={get(codeSystem, 'content', 'complete')}
              onChange={function(e) { handleChange('content', e.target.value); }}
              label="Content"
            >
              {contentOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            id="descriptionInput"
            fullWidth
            multiline
            rows={4}
            label="Description"
            placeholder="Lorem ipsum."
            value={get(codeSystem, 'description', '')}
            onChange={function(e) { handleChange('description', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default CodeSystemFormView;
