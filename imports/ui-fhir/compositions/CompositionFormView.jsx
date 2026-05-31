// imports/ui-fhir/compositions/CompositionFormView.jsx

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
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function CompositionFormView({ resource, isEditing, onChange, isEmbedded }) {
  var composition = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Subject Name */}
        <Grid item xs={12} md={6}>
          <TextField
            id="subjectDisplayInput"
            fullWidth
            label="Subject Name"
            value={get(composition, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Subject ID */}
        <Grid item xs={12} md={6}>
          <TextField
            id="subjectIdInput"
            fullWidth
            label="Subject ID"
            value={get(composition, 'subject.reference', '')}
            onChange={function(e) { handleChange('subject.reference', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Title */}
        <Grid item xs={12} md={6}>
          <TextField
            id="titleInput"
            fullWidth
            label="Title"
            value={get(composition, 'title', '')}
            onChange={function(e) { handleChange('title', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              id="statusInput"
              labelId="status-label"
              value={get(composition, 'status', 'preliminary')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={3}>
          <TextField
            id="categoryTextInput"
            fullWidth
            label="Category"
            value={get(composition, 'category[0].display', '') || get(composition, 'category[0].text', '')}
            onChange={function(e) { handleChange('category[0].text', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Encounter Reference */}
        <Grid item xs={12} md={3}>
          <TextField
            id="encounterReferenceInput"
            fullWidth
            label="Encounter Reference"
            value={get(composition, 'encounter.reference', '')}
            onChange={function(e) { handleChange('encounter.reference', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Encounter Display */}
        <Grid item xs={12} md={3}>
          <TextField
            id="encounterInput"
            fullWidth
            label="Encounter"
            value={get(composition, 'encounter.display', '')}
            onChange={function(e) { handleChange('encounter.display', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Author */}
        <Grid item xs={12} md={6}>
          <TextField
            id="authorDisplayInput"
            fullWidth
            label="Author"
            value={get(composition, 'author[0].display', '')}
            onChange={function(e) { handleChange('author[0].display', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Date */}
        <Grid item xs={12} md={6}>
          <TextField
            id="dateInput"
            fullWidth
            label="Date"
            type="date"
            value={get(composition, 'date', '')}
            onChange={function(e) { handleChange('date', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Type */}
        <Grid item xs={12} md={6}>
          <TextField
            id="typeCodeInput"
            fullWidth
            label="Type Code"
            value={get(composition, 'type.coding[0].code', '') || get(composition, 'type.coding.0.code', '')}
            onChange={function(e) { handleChange('type.coding[0].code', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="typeDisplayInput"
            fullWidth
            label="Type Display"
            value={get(composition, 'type.coding[0].display', '') || get(composition, 'type.text', '')}
            onChange={function(e) {
              handleChange('type.coding[0].display', e.target.value);
              handleChange('type.text', e.target.value);
            }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default CompositionFormView;
