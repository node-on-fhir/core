// imports/ui-fhir/medicationStatements/MedicationStatementFormView.jsx

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
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'intended', label: 'Intended' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'not-taken', label: 'Not Taken' }
];

const categoryOptions = [
  { value: 'inpatient', label: 'Inpatient' },
  { value: 'outpatient', label: 'Outpatient' },
  { value: 'community', label: 'Community' },
  { value: 'patientspecified', label: 'Patient Specified' }
];

const periodUnitOptions = [
  { value: 's', label: 'Second' },
  { value: 'min', label: 'Minute' },
  { value: 'h', label: 'Hour' },
  { value: 'd', label: 'Day' },
  { value: 'wk', label: 'Week' },
  { value: 'mo', label: 'Month' },
  { value: 'a', label: 'Year' }
];

//===========================================================================
// COMPONENT

function MedicationStatementFormView({ resource, isEditing, onChange, isEmbedded }) {
  var medicationStatement = resource || {};

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
            value={get(medicationStatement, 'subject.display', '')}
            helperText={get(medicationStatement, 'subject.reference', '') || 'Patient reference will be assigned'}
            disabled
          />
        </Grid>

        {/* Medication Name + Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationDisplay"
            fullWidth
            label="Medication"
            value={get(medicationStatement, 'medicationCodeableConcept.text', '') ||
                   get(medicationStatement, 'medicationCodeableConcept.coding[0].display', '')}
            onChange={function(e) { handleChange('medicationCodeableConcept.text', e.target.value); }}
            helperText="Name of the medication"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationCode"
            fullWidth
            label="Medication Code"
            value={get(medicationStatement, 'medicationCodeableConcept.coding[0].code', '')}
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
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Status + Category */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(medicationStatement, 'status', 'active')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Category</InputLabel>
            <Select
              id="category"
              value={get(medicationStatement, 'category.coding[0].code', 'inpatient')}
              onChange={function(e) {
                handleChange('category.coding[0].code', e.target.value);
                var opt = categoryOptions.find(function(o) { return o.value === e.target.value; });
                if (opt) {
                  handleChange('category.coding[0].display', opt.label);
                }
              }}
              label="Category"
            >
              {categoryOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Effective Date + Date Asserted */}
        <Grid item xs={12} md={3}>
          <TextField
            id="effectiveDateTime"
            fullWidth
            type="date"
            label="Effective Date"
            value={get(medicationStatement, 'effectiveDateTime', '') ? moment(get(medicationStatement, 'effectiveDateTime', '')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('effectiveDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            id="dateAsserted"
            fullWidth
            type="date"
            label="Date Asserted"
            value={get(medicationStatement, 'dateAsserted', '') ? moment(get(medicationStatement, 'dateAsserted', '')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('dateAsserted', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Information Source */}
        <Grid item xs={12}>
          <TextField
            id="informationSourceDisplay"
            fullWidth
            label="Information Source"
            value={get(medicationStatement, 'informationSource.display', '')}
            onChange={function(e) { handleChange('informationSource.display', e.target.value); }}
            helperText="Who provided this information"
            disabled={!isEditing}
          />
        </Grid>

        {/* Reason */}
        <Grid item xs={12} md={8}>
          <TextField
            id="reasonText"
            fullWidth
            label="Reason for Taking"
            value={get(medicationStatement, 'reasonCode[0].text', '')}
            onChange={function(e) { handleChange('reasonCode[0].text', e.target.value); }}
            helperText="Hypertension, diabetes, etc."
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="reasonCode"
            fullWidth
            label="Reason Code"
            value={get(medicationStatement, 'reasonCode[0].coding[0].code', '')}
            onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
            helperText="SNOMED code"
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
            value={get(medicationStatement, 'dosage[0].text', '')}
            onChange={function(e) { handleChange('dosage[0].text', e.target.value); }}
            helperText="e.g., Take 2 tablets by mouth every 6 hours"
            disabled={!isEditing}
          />
        </Grid>

        {/* Dose Amount + Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            id="dosageValue"
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.value', '')}
            onChange={function(e) { handleChange('dosage[0].doseAndRate[0].doseQuantity.value', parseFloat(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="dosageUnit"
            fullWidth
            label="Dose Unit"
            value={get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.unit', '')}
            onChange={function(e) {
              handleChange('dosage[0].doseAndRate[0].doseQuantity.unit', e.target.value);
              handleChange('dosage[0].doseAndRate[0].doseQuantity.code', e.target.value);
            }}
            helperText="e.g., mg, mL, tablets"
            disabled={!isEditing}
          />
        </Grid>

        {/* Frequency + Period + Period Unit */}
        <Grid item xs={12} md={4}>
          <TextField
            id="frequency"
            fullWidth
            type="number"
            label="Frequency"
            value={get(medicationStatement, 'dosage[0].timing.repeat.frequency', '')}
            onChange={function(e) { handleChange('dosage[0].timing.repeat.frequency', parseInt(e.target.value) || null); }}
            helperText="Times per period"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="period"
            fullWidth
            type="number"
            label="Period"
            value={get(medicationStatement, 'dosage[0].timing.repeat.period', '')}
            onChange={function(e) { handleChange('dosage[0].timing.repeat.period', parseInt(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Period Unit</InputLabel>
            <Select
              id="periodUnit"
              value={get(medicationStatement, 'dosage[0].timing.repeat.periodUnit', 'd')}
              onChange={function(e) { handleChange('dosage[0].timing.repeat.periodUnit', e.target.value); }}
              label="Period Unit"
            >
              {periodUnitOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Route */}
        <Grid item xs={12} md={6}>
          <TextField
            id="routeDisplay"
            fullWidth
            label="Route"
            value={get(medicationStatement, 'dosage[0].route.coding[0].display', '')}
            onChange={function(e) { handleChange('dosage[0].route.coding[0].display', e.target.value); }}
            helperText="e.g., oral, IV, IM"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MedicationStatementFormView;
