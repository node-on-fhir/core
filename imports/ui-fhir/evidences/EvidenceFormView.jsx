// imports/ui-fhir/evidences/EvidenceFormView.jsx

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

const clinicalStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'recurrence', label: 'Recurrence' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'remission', label: 'Remission' },
  { value: 'resolved', label: 'Resolved' }
];

const verificationStatusOptions = [
  { value: 'provisional', label: 'Provisional' },
  { value: 'differential', label: 'Differential' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'refuted', label: 'Refuted' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

//===========================================================================
// COMPONENT

function EvidenceFormView({ resource, isEditing, onChange, isEmbedded }) {
  var evidence = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient */}
        <Grid item xs={12} md={6}>
          <TextField
            id="patientDisplayInput"
            fullWidth
            label="Patient"
            value={get(evidence, 'patient.display', '')}
            onChange={function(e) { handleChange('patient.display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Asserter */}
        <Grid item xs={12} md={6}>
          <TextField
            id="asserterDisplayInput"
            fullWidth
            label="Asserter"
            value={get(evidence, 'asserter.display', '')}
            onChange={function(e) { handleChange('asserter.display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* SNOMED Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="snomedCodeInput"
            fullWidth
            label="SNOMED Code"
            value={get(evidence, 'code.coding[0].code', '')}
            onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
            helperText="e.g., 307343001"
            disabled={!isEditing}
          />
        </Grid>

        {/* SNOMED Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="snomedDisplayInput"
            fullWidth
            label="SNOMED Display"
            value={get(evidence, 'code.coding[0].display', '')}
            onChange={function(e) { handleChange('code.coding[0].display', e.target.value); }}
            helperText="Human-readable condition name"
            disabled={!isEditing}
          />
        </Grid>

        {/* Clinical Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Clinical Status</InputLabel>
            <Select
              id="clinicalStatusInput"
              value={get(evidence, 'clinicalStatus', '')}
              onChange={function(e) { handleChange('clinicalStatus', e.target.value); }}
              label="Clinical Status"
            >
              {clinicalStatusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Verification Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Verification Status</InputLabel>
            <Select
              id="verificationStatusInput"
              value={get(evidence, 'verificationStatus', '')}
              onChange={function(e) { handleChange('verificationStatus', e.target.value); }}
              label="Verification Status"
            >
              {verificationStatusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Onset Date/Time */}
        <Grid item xs={12} md={6}>
          <TextField
            id="onsetDateTimeInput"
            fullWidth
            type="datetime-local"
            label="Onset Date/Time"
            value={get(evidence, 'onsetDateTime', '')}
            onChange={function(e) { handleChange('onsetDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Evidence Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="evidenceDisplayInput"
            fullWidth
            label="Evidence Display"
            value={get(evidence, 'evidence[0].detail[0].display', '')}
            onChange={function(e) { handleChange('evidence[0].detail[0].display', e.target.value); }}
            helperText="Supporting evidence reference"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default EvidenceFormView;
