// imports/ui-fhir/valuesets/ValueSetFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Grid,
  Typography,
  Divider
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

//===========================================================================
// COMPONENT

function ValueSetFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  var valueSet = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  // Render compose.include sections
  function renderComposeIncludes() {
    var composeIncludes = get(valueSet, 'compose.include', []);

    if (!Array.isArray(composeIncludes) || composeIncludes.length === 0) {
      return null;
    }

    var includeElements = [];

    composeIncludes.forEach(function(includeSystem, includeSystemIndex) {
      // System URL
      includeElements.push(
        <Grid item xs={12} key={'system-' + includeSystemIndex}>
          <TextField
            id={'includeSystem-' + includeSystemIndex}
            fullWidth
            label="System"
            value={get(includeSystem, 'system', '')}
            disabled
            sx={{ mt: 1 }}
          />
        </Grid>
      );

      // Concepts within this system
      var includeConcepts = get(includeSystem, 'concept', []);
      if (Array.isArray(includeConcepts)) {
        includeConcepts.forEach(function(concept, conceptIndex) {
          includeElements.push(
            <Grid item xs={3} key={'code-' + includeSystemIndex + '-' + conceptIndex}>
              <TextField
                id={'conceptCode-' + includeSystemIndex + '-' + conceptIndex}
                fullWidth
                label={conceptIndex === 0 ? 'Concept Code' : ''}
                value={get(concept, 'code', '')}
                disabled={!isEditing}
                InputLabelProps={conceptIndex === 0 ? { shrink: true } : undefined}
              />
            </Grid>
          );
          includeElements.push(
            <Grid item xs={9} key={'display-' + includeSystemIndex + '-' + conceptIndex}>
              <TextField
                id={'conceptDisplay-' + includeSystemIndex + '-' + conceptIndex}
                fullWidth
                label={conceptIndex === 0 ? 'Concept Display' : ''}
                value={get(concept, 'display', '')}
                disabled={!isEditing}
                InputLabelProps={conceptIndex === 0 ? { shrink: true } : undefined}
              />
            </Grid>
          );
        });
      }
    });

    return includeElements;
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
            placeholder="Value Set Title"
            value={get(valueSet, 'title', '')}
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
            placeholder="1.0.0"
            value={get(valueSet, 'version', '')}
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
              value={get(valueSet, 'status', 'draft')}
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
            placeholder="Computer-friendly name"
            value={get(valueSet, 'name', '')}
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
            value={get(valueSet, 'publisher', '')}
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
            placeholder="http://example.org/fhir/ValueSet/example"
            value={get(valueSet, 'url', '')}
            onChange={function(e) { handleChange('url', e.target.value); }}
            helperText="Canonical identifier for this value set"
            disabled={!isEditing}
          />
        </Grid>

        {/* Date */}
        <Grid item xs={12} md={4}>
          <TextField
            id="dateInput"
            fullWidth
            label="Date"
            type="date"
            value={get(valueSet, 'date', '')}
            onChange={function(e) { handleChange('date', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            id="descriptionInput"
            fullWidth
            multiline
            rows={4}
            label="Description"
            placeholder="A description of the value set and its contents."
            value={get(valueSet, 'description', '')}
            onChange={function(e) { handleChange('description', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Copyright */}
        <Grid item xs={12}>
          <TextField
            id="copyrightInput"
            fullWidth
            multiline
            rows={2}
            label="Copyright"
            value={get(valueSet, 'copyright', '')}
            onChange={function(e) { handleChange('copyright', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>

      {/* Compose Includes Section */}
      {get(valueSet, 'compose.include', []).length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1, color: 'text.secondary' }}>
            Compose (Included Systems)
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {renderComposeIncludes()}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

export default ValueSetFormView;
