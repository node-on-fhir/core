// imports/ui-fhir/conditions/ConditionFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

const clinicalStatusOptions = [
  { code: 'active', display: 'Active' },
  { code: 'recurrence', display: 'Recurrence' },
  { code: 'relapse', display: 'Relapse' },
  { code: 'inactive', display: 'Inactive' },
  { code: 'remission', display: 'Remission' },
  { code: 'resolved', display: 'Resolved' }
];

const verificationStatusOptions = [
  { code: 'unconfirmed', display: 'Unconfirmed' },
  { code: 'provisional', display: 'Provisional' },
  { code: 'differential', display: 'Differential' },
  { code: 'confirmed', display: 'Confirmed' },
  { code: 'refuted', display: 'Refuted' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const categoryOptions = [
  { code: 'problem-list-item', display: 'Problem List Item' },
  { code: 'encounter-diagnosis', display: 'Encounter Diagnosis' }
];

//===========================================================================
// COMPONENT

function ConditionFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var condition = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Grid container spacing={3}>
      {/* Patient and Asserter */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="patientDisplay"
          fullWidth
          label="Patient Name"
          value={get(condition, 'subject.display', '')}
          onChange={function(e) { handleChange('subject.display', e.target.value); }}
          helperText={get(condition, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled={!isEditing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Search for patient">
                  <IconButton
                    onClick={function() {
                      if (typeof onSearchPatient === 'function') {
                        onSearchPatient();
                      }
                    }}
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
      <Grid item xs={12} sm={6}>
        <TextField
          id="asserterDisplay"
          fullWidth
          label="Asserter Name"
          value={get(condition, 'asserter.display', '')}
          onChange={function(e) { handleChange('asserter.display', e.target.value); }}
          helperText={get(condition, 'asserter.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />
      </Grid>

      {/* Onset and Recorded Dates */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="onsetDate"
          fullWidth
          type="date"
          label="Onset Date"
          value={moment(get(condition, 'onsetDateTime', '')).format('YYYY-MM-DD')}
          onChange={function(e) { handleChange('onsetDateTime', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          id="recordedDate"
          fullWidth
          type="date"
          label="Recorded Date"
          value={moment(get(condition, 'recordedDate', '')).format('YYYY-MM-DD')}
          onChange={function(e) { handleChange('recordedDate', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Grid>

      {/* SNOMED Code and Condition Name */}
      <Grid item xs={12} sm={4}>
        <TextField
          id="snomedCode"
          fullWidth
          label="SNOMED Code"
          value={get(condition, 'code.coding[0].code', '')}
          onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
          helperText="SNOMED CT code"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Lookup codes with the SNOMED CT Browser">
                  <IconButton
                    onClick={function() { window.open('http://browser.ihtsdotools.org/?perspective=full&conceptId1=404684003&edition=us-edition&release=v20180301&server=https://prod-browser-exten.ihtsdotools.org/api/snomed&langRefset=900000000000509007', '_blank'); }}
                    edge="end"
                    disabled={!isEditing}
                    aria-label="Lookup codes with the SNOMED CT Browser"
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField
          id="snomedDisplay"
          fullWidth
          label="Condition Name"
          value={get(condition, 'code.coding[0].display', '')}
          onChange={function(e) { handleChange('code.coding[0].display', e.target.value); }}
          helperText="Human-readable name of the condition"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Clinical Status, Verification Status, Category */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Clinical Status</InputLabel>
          <Select
            id="clinicalStatus"
            value={get(condition, 'clinicalStatus.coding[0].code', 'active')}
            onChange={function(e) {
              var option = clinicalStatusOptions.find(function(o) { return o.code === e.target.value; });
              handleChange('clinicalStatus.coding[0].code', option.code);
              handleChange('clinicalStatus.coding[0].display', option.display);
            }}
            label="Clinical Status"
          >
            {clinicalStatusOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Verification Status</InputLabel>
          <Select
            id="verificationStatus"
            value={get(condition, 'verificationStatus.coding[0].code', 'confirmed')}
            onChange={function(e) {
              var option = verificationStatusOptions.find(function(o) { return o.code === e.target.value; });
              handleChange('verificationStatus.coding[0].code', option.code);
              handleChange('verificationStatus.coding[0].display', option.display);
            }}
            label="Verification Status"
          >
            {verificationStatusOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Category</InputLabel>
          <Select
            id="category"
            value={get(condition, 'category[0].coding[0].code', 'problem-list-item')}
            onChange={function(e) {
              var option = categoryOptions.find(function(o) { return o.code === e.target.value; });
              handleChange('category[0].coding[0].code', option.code);
              handleChange('category[0].coding[0].display', option.display);
            }}
            label="Category"
          >
            {categoryOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>

      {/* Notes */}
      <Grid item xs={12}>
        <TextField
          id="notesTextarea"
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(condition, 'note[0].text', '')}
          onChange={function(e) { handleChange('note[0].text', e.target.value); }}
          helperText="Additional notes about the condition"
          disabled={!isEditing}
        />
      </Grid>
    </Grid>
  );
}

export default ConditionFormView;
