// imports/ui-fhir/claims/ClaimFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
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

function ClaimFormView({ resource, isEditing, onChange, isEmbedded }) {
  var claim = resource || {};

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
            value={get(claim, 'patient.display', '')}
            onChange={function(e) { handleChange('patient.display', e.target.value); }}
            disabled={!isEditing}
            helperText="Patient associated with this claim"
          />
        </Grid>

        {/* Asserter */}
        <Grid item xs={12} md={6}>
          <TextField
            id="asserterDisplayInput"
            fullWidth
            label="Asserter"
            value={get(claim, 'asserter.display', '')}
            onChange={function(e) { handleChange('asserter.display', e.target.value); }}
            disabled={!isEditing}
            helperText="Person who asserted the claim"
          />
        </Grid>

        {/* SNOMED Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="snomedCodeInput"
            fullWidth
            label="SNOMED Code"
            value={get(claim, 'code.coding[0].code', '')}
            onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
            disabled={!isEditing}
            placeholder="307343001"
            helperText="SNOMED CT code"
          />
        </Grid>

        {/* SNOMED Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="snomedDisplayInput"
            fullWidth
            label="SNOMED Display"
            value={get(claim, 'code.coding[0].display', '')}
            onChange={function(e) { handleChange('code.coding[0].display', e.target.value); }}
            disabled={!isEditing}
            placeholder="Acquired hemoglobin H disease (disorder)"
            helperText="Human-readable code description"
          />
        </Grid>

        {/* Clinical Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Clinical Status</InputLabel>
            <Select
              id="clinicalStatusInput"
              value={get(claim, 'clinicalStatus', '')}
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
              value={get(claim, 'verificationStatus', '')}
              onChange={function(e) { handleChange('verificationStatus', e.target.value); }}
              label="Verification Status"
            >
              {verificationStatusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Onset DateTime */}
        <Grid item xs={12} md={6}>
          <TextField
            id="onsetDateTimeInput"
            fullWidth
            type="datetime-local"
            label="Onset Date/Time"
            value={get(claim, 'onsetDateTime', '') ? get(claim, 'onsetDateTime', '').substring(0, 16) : ''}
            onChange={function(e) { handleChange('onsetDateTime', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
            helperText="When the condition first manifested"
          />
        </Grid>

        {/* Evidence Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="evidenceDisplayInput"
            fullWidth
            label="Evidence"
            value={get(claim, 'evidence[0].detail[0].display', '')}
            onChange={function(e) { handleChange('evidence[0].detail[0].display', e.target.value); }}
            disabled={!isEditing}
            helperText="Supporting clinical evidence"
          />
        </Grid>

        {/* SNOMED Browser Link */}
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            <a
              href="http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit' }}
            >
              Lookup codes with the SNOMED CT Browser
            </a>
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ClaimFormView;
