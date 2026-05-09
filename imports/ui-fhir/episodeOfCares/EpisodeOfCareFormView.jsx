// imports/ui-fhir/episodeOfCares/EpisodeOfCareFormView.jsx

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

const statusOptions = [
  { code: 'planned', display: 'Planned' },
  { code: 'waitlist', display: 'Waitlist' },
  { code: 'active', display: 'Active' },
  { code: 'onhold', display: 'On Hold' },
  { code: 'finished', display: 'Finished' },
  { code: 'cancelled', display: 'Cancelled' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function EpisodeOfCareFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var episodeOfCare = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Grid container spacing={3}>
      {/* Status */}
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
            value={get(episodeOfCare, 'status', 'planned')}
            onChange={function(e) {
              handleChange('status', e.target.value);
            }}
            label="Status"
          >
            {statusOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>

      {/* Type */}
      <Grid item xs={12} sm={8}>
        <TextField
          id="typeDisplay"
          fullWidth
          label="Type"
          value={get(episodeOfCare, 'type[0].text', get(episodeOfCare, 'type[0].coding[0].display', ''))}
          onChange={function(e) { handleChange('type[0].text', e.target.value); }}
          helperText="Type of episode of care"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Patient and Care Manager */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="patientDisplay"
          fullWidth
          label="Patient Name"
          value={get(episodeOfCare, 'patient.display', '')}
          onChange={function(e) { handleChange('patient.display', e.target.value); }}
          helperText={get(episodeOfCare, 'patient.reference', '') || 'Patient reference will be assigned'}
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
          id="careManagerDisplay"
          fullWidth
          label="Care Manager"
          value={get(episodeOfCare, 'careManager.display', '')}
          onChange={function(e) { handleChange('careManager.display', e.target.value); }}
          helperText={get(episodeOfCare, 'careManager.reference', '') || 'Care manager reference'}
          disabled={!isEditing}
        />
      </Grid>

      {/* Managing Organization */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="managingOrganizationDisplay"
          fullWidth
          label="Managing Organization"
          value={get(episodeOfCare, 'managingOrganization.display', '')}
          onChange={function(e) { handleChange('managingOrganization.display', e.target.value); }}
          helperText={get(episodeOfCare, 'managingOrganization.reference', '') || 'Organization reference'}
          disabled={!isEditing}
        />
      </Grid>

      {/* Period Start and End */}
      <Grid item xs={12} sm={3}>
        <TextField
          id="periodStart"
          fullWidth
          type="date"
          label="Period Start"
          value={get(episodeOfCare, 'period.start', '') ? moment(get(episodeOfCare, 'period.start', '')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('period.start', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <TextField
          id="periodEnd"
          fullWidth
          type="date"
          label="Period End"
          value={get(episodeOfCare, 'period.end', '') ? moment(get(episodeOfCare, 'period.end', '')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('period.end', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Grid>

      {/* Diagnosis */}
      <Grid item xs={12}>
        <TextField
          id="diagnosisDisplay"
          fullWidth
          label="Diagnosis"
          value={get(episodeOfCare, 'diagnosis[0].condition.display', get(episodeOfCare, 'diagnosis[0].condition.reference', ''))}
          onChange={function(e) { handleChange('diagnosis[0].condition.display', e.target.value); }}
          helperText="Primary diagnosis for this episode of care"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
}

export default EpisodeOfCareFormView;
