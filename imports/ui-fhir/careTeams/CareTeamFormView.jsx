// imports/ui-fhir/careTeams/CareTeamFormView.jsx

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
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function CareTeamFormView({ resource, isEditing, onChange, isEmbedded }) {
  var careTeam = resource || {};

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
            id="subjectInput"
            fullWidth
            label="Patient"
            value={get(careTeam, 'subject.display', '')}
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
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Care Team Name */}
        <Grid item xs={12} md={8}>
          <TextField
            id="nameInput"
            fullWidth
            label="Care Team Name"
            value={get(careTeam, 'name', '')}
            onChange={function(e) { handleChange('name', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={4}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="statusInput"
              value={get(careTeam, 'status', 'active')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Category Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="categoryCodeInput"
            fullWidth
            label="Category Code"
            value={get(careTeam, 'category[0].coding[0].code', '')}
            onChange={function(e) { handleChange('category[0].coding[0].code', e.target.value); }}
            disabled={!isEditing}
            placeholder="135411"
          />
        </Grid>

        {/* Category Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="categoryDisplayInput"
            fullWidth
            label="Category Display"
            value={get(careTeam, 'category[0].coding[0].display', '') || get(careTeam, 'category[0].text', '')}
            onChange={function(e) {
              handleChange('category[0].coding[0].display', e.target.value);
              handleChange('category[0].text', e.target.value);
            }}
            disabled={!isEditing}
            placeholder="Home health"
          />
        </Grid>

        {/* Period Start */}
        <Grid item xs={12} md={6}>
          <TextField
            id="periodStartInput"
            fullWidth
            label="Period Start"
            type="date"
            value={get(careTeam, 'period.start') ? moment(get(careTeam, 'period.start')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('period.start', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Period End */}
        <Grid item xs={12} md={6}>
          <TextField
            id="periodEndInput"
            fullWidth
            label="Period End"
            type="date"
            value={get(careTeam, 'period.end') ? moment(get(careTeam, 'period.end')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('period.end', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Participants Section */}
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>Participants</Typography>
        </Grid>

        {/* Participant Role Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="participantRoleCodeInput"
            fullWidth
            label="Participant Role Code"
            value={get(careTeam, 'participant[0].role[0].coding[0].code', '')}
            onChange={function(e) { handleChange('participant[0].role[0].coding[0].code', e.target.value); }}
            disabled={!isEditing}
            placeholder="768730001"
          />
        </Grid>

        {/* Participant Role Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="participantRoleDisplayInput"
            fullWidth
            label="Participant Role Display"
            value={get(careTeam, 'participant[0].role[0].coding[0].display', '') || get(careTeam, 'participant[0].role[0].text', '')}
            onChange={function(e) {
              handleChange('participant[0].role[0].coding[0].display', e.target.value);
              handleChange('participant[0].role[0].text', e.target.value);
            }}
            disabled={!isEditing}
            placeholder="Care coordinator"
          />
        </Grid>

        {/* Participant Member */}
        <Grid item xs={12}>
          <TextField
            id="participantMemberInput"
            fullWidth
            label="Participant Member"
            value={get(careTeam, 'participant[0].member.display', '')}
            onChange={function(e) { handleChange('participant[0].member.display', e.target.value); }}
            disabled={!isEditing}
            placeholder="Dr. Smith"
          />
        </Grid>

        {/* Participant Period Start */}
        <Grid item xs={12} md={6}>
          <TextField
            id="participantPeriodStartInput"
            fullWidth
            label="Participant Period Start"
            type="date"
            value={get(careTeam, 'participant[0].period.start') ? moment(get(careTeam, 'participant[0].period.start')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('participant[0].period.start', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Participant Period End */}
        <Grid item xs={12} md={6}>
          <TextField
            id="participantPeriodEndInput"
            fullWidth
            label="Participant Period End"
            type="date"
            value={get(careTeam, 'participant[0].period.end') ? moment(get(careTeam, 'participant[0].period.end')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('participant[0].period.end', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Managing Organization */}
        <Grid item xs={12}>
          <TextField
            id="managingOrganizationInput"
            fullWidth
            label="Managing Organization"
            value={get(careTeam, 'managingOrganization[0].display', '')}
            onChange={function(e) { handleChange('managingOrganization[0].display', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="noteInput"
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={get(careTeam, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default CareTeamFormView;
