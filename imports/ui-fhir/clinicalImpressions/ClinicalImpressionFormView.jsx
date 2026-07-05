// imports/ui-fhir/clinicalImpressions/ClinicalImpressionFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function ClinicalImpressionFormView({ resource, isEditing, onChange, isEmbedded }) {
  var clinicalImpression = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Status */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="statusSelect"
              value={get(clinicalImpression, 'status', 'in-progress')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              disabled={!isEditing}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            id="dateInput"
            fullWidth
            label="Date"
            type="date"
            value={get(clinicalImpression, 'date', '').split('T')[0]}
            onChange={function(e) { handleChange('date', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <TextField
            id="descriptionInput"
            fullWidth
            label="Description"
            value={get(clinicalImpression, 'description', '')}
            onChange={function(e) { handleChange('description', e.target.value); }}
            disabled={!isEditing}
            multiline
            rows={2}
            helperText="A summary of the context and/or cause of the assessment"
          />
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <TextField
            id="summaryInput"
            fullWidth
            label="Summary"
            value={get(clinicalImpression, 'summary', '')}
            onChange={function(e) { handleChange('summary', e.target.value); }}
            disabled={!isEditing}
            multiline
            rows={3}
            helperText="Summary of the assessment"
          />
        </Grid>

        {/* Effective DateTime */}
        <Grid item xs={12} sm={6}>
          <TextField
            id="effectiveDateTimeInput"
            fullWidth
            label="Effective Date/Time"
            type="datetime-local"
            value={get(clinicalImpression, 'effectiveDateTime', '').substring(0, 16)}
            onChange={function(e) { handleChange('effectiveDateTime', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
            helperText="When the assessment was made"
          />
        </Grid>

        {/* Assessor Display */}
        <Grid item xs={12} sm={6}>
          <TextField
            id="assessorDisplay"
            fullWidth
            label="Assessor"
            value={get(clinicalImpression, 'assessor.display', '')}
            onChange={function(e) { handleChange('assessor.display', e.target.value); }}
            disabled={!isEditing}
            helperText="The clinician performing the assessment"
          />
        </Grid>

        {/* Patient / Subject */}
        <Grid item xs={12}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(clinicalImpression, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for patient">
                    <IconButton
                      onClick={function() { console.log('Patient search clicked'); /* phi-audit: ok */ }}
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
        </Grid>
      </Grid>
    </Box>
  );
}

export default ClinicalImpressionFormView;
