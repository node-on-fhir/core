// imports/ui-fhir/libraries/LibraryFormView.jsx

import React from 'react';

import {
  Box,
  Grid,
  Link,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function LibraryFormView({ resource, isEditing, onChange, isEmbedded }) {
  var library = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6">Library Information</Typography>
        </Grid>

        {/* Patient */}
        <Grid item xs={12} md={6}>
          <TextField
            id="patientDisplayInput"
            fullWidth
            label="Patient"
            value={get(library, 'patient.display', '')}
            onChange={function(e) { handleChange('patient.display', e.target.value); }}
            helperText="Patient this library entry is for"
            disabled={!isEditing}
          />
        </Grid>

        {/* Asserter */}
        <Grid item xs={12} md={6}>
          <TextField
            id="asserterDisplayInput"
            fullWidth
            label="Asserter"
            value={get(library, 'asserter.display', '')}
            onChange={function(e) { handleChange('asserter.display', e.target.value); }}
            helperText="Person who asserted this library entry"
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Code</Typography>
        </Grid>

        {/* SNOMED Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="snomedCodeInput"
            fullWidth
            label="SNOMED Code"
            value={get(library, 'code.coding[0].code', '')}
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
            value={get(library, 'code.coding[0].display', '')}
            onChange={function(e) { handleChange('code.coding[0].display', e.target.value); }}
            helperText="Human-readable code description"
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6">Status</Typography>
        </Grid>

        {/* Clinical Status */}
        <Grid item xs={12} md={6}>
          <TextField
            id="clinicalStatusInput"
            fullWidth
            label="Clinical Status"
            value={get(library, 'clinicalStatus', '')}
            onChange={function(e) { handleChange('clinicalStatus', e.target.value); }}
            helperText="active | recurrence | inactive | remission | resolved"
            disabled={!isEditing}
          />
        </Grid>

        {/* Verification Status */}
        <Grid item xs={12} md={6}>
          <TextField
            id="verificationStatusInput"
            fullWidth
            label="Verification Status"
            value={get(library, 'verificationStatus', '')}
            onChange={function(e) { handleChange('verificationStatus', e.target.value); }}
            helperText="provisional | differential | confirmed | refuted | entered-in-error | unknown"
            disabled={!isEditing}
          />
        </Grid>

        {/* Onset Date */}
        <Grid item xs={12} md={6}>
          <TextField
            id="onsetDateTimeInput"
            fullWidth
            type="datetime-local"
            label="Onset Date/Time"
            value={get(library, 'onsetDateTime', '') || ''}
            onChange={function(e) { handleChange('onsetDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Reference link */}
        <Grid item xs={12}>
          <Box sx={{ mt: 2 }}>
            <Link
              href="http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007"
              target="_blank"
              rel="noopener"
            >
              Lookup codes with the SNOMED CT Browser
            </Link>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

export default LibraryFormView;
