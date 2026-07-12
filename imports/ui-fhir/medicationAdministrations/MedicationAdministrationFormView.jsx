// imports/ui-fhir/medicationAdministrations/MedicationAdministrationFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'not-done', label: 'Not Done' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'unknown', label: 'Unknown' }
];

const categoryOptions = [
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'community', label: 'Community' },
  { value: 'discharge', label: 'Discharge' }
];

//===========================================================================
// COMPONENT

function MedicationAdministrationFormView({ resource, isEditing, onChange, isEmbedded }) {
  var medicationAdministration = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient */}
        <Grid item xs={12}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(medicationAdministration, 'subject.display', '')}
            helperText={get(medicationAdministration, 'subject.reference', '') || 'Patient reference will be assigned'}
            disabled
          />
        </Grid>

        {/* Medication Name + Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationDisplay"
            fullWidth
            label="Medication Name"
            value={get(medicationAdministration, 'medicationCodeableConcept.text', '') ||
                   get(medicationAdministration, 'medicationCodeableConcept.coding[0].display', '')}
            onChange={function(e) { handleChange('medicationCodeableConcept.text', e.target.value); }}
            helperText="Name of the medication administered"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationCode"
            fullWidth
            label="Medication Code"
            value={get(medicationAdministration, 'medicationCodeableConcept.coding[0].code', '')}
            onChange={function(e) { handleChange('medicationCodeableConcept.coding[0].code', e.target.value); }}
            helperText="RxNorm code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup RxNorm codes">
                    <IconButton
                      onClick={function() { window.open('https://mor.nlm.nih.gov/RxNav/', '_blank'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Lookup RxNorm codes"
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Status + Effective Date */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(medicationAdministration, 'status', 'completed')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="effectiveDateTime"
            fullWidth
            type="datetime-local"
            label="Administration Date/Time"
            value={moment(get(medicationAdministration, 'effectiveDateTime', '')).format('YYYY-MM-DDTHH:mm')}
            onChange={function(e) { handleChange('effectiveDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Category</InputLabel>
            <Select
              id="category"
              value={get(medicationAdministration, 'category.coding[0].code', 'inpatient')}
              onChange={function(e) { handleChange('category.coding[0].code', e.target.value); }}
              label="Category"
            >
              {categoryOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Performer */}
        <Grid item xs={12} md={6}>
          <TextField
            id="performerDisplay"
            fullWidth
            label="Administered By"
            value={get(medicationAdministration, 'performer[0].actor.display', '')}
            onChange={function(e) { handleChange('performer[0].actor.display', e.target.value); }}
            helperText={get(medicationAdministration, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
            disabled={!isEditing}
          />
        </Grid>

        {/* Dosage Instructions */}
        <Grid item xs={12}>
          <TextField
            id="dosageText"
            fullWidth
            multiline
            rows={2}
            label="Dosage Instructions"
            value={get(medicationAdministration, 'dosage.text', '')}
            onChange={function(e) { handleChange('dosage.text', e.target.value); }}
            helperText="e.g., Take 2 tablets by mouth every 6 hours"
            disabled={!isEditing}
          />
        </Grid>

        {/* Dose Amount + Unit + Route */}
        <Grid item xs={12} md={4}>
          <TextField
            id="dosageDose"
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(medicationAdministration, 'dosage.dose.value', '')}
            onChange={function(e) { handleChange('dosage.dose.value', parseFloat(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="dosageDoseUnit"
            fullWidth
            label="Dose Unit"
            value={get(medicationAdministration, 'dosage.dose.unit', '')}
            onChange={function(e) {
              handleChange('dosage.dose.unit', e.target.value);
              handleChange('dosage.dose.code', e.target.value);
            }}
            helperText="e.g., mg, mL, tablets"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="dosageRouteDisplay"
            fullWidth
            label="Route"
            value={get(medicationAdministration, 'dosage.route.coding[0].display', '')}
            onChange={function(e) { handleChange('dosage.route.coding[0].display', e.target.value); }}
            helperText="e.g., oral, IV, IM"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MedicationAdministrationFormView;
