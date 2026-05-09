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
  Tooltip,
  Typography,
  Box,
  Chip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

import { get } from 'lodash';
import moment from 'moment';

import CrudExtensions from '/imports/components/CrudExtensions';

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
          value={get(episodeOfCare, 'type[0].text', get(episodeOfCare, 'type[0].coding[0].display', '')) || get(episodeOfCare, 'typeDisplay', '')}
          onChange={function(e) { handleChange('type[0].text', e.target.value); }}
          helperText="Type of episode of care"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Patient/Group and Care Manager */}
      {(function() {
        var patientRef = get(episodeOfCare, 'patient.reference', '') || get(episodeOfCare, 'patientReference', '');
        var patientDisplay = get(episodeOfCare, 'patient.display', '') || get(episodeOfCare, 'patientDisplay', '');
        var isGroup = patientRef.startsWith('Group/');

        if (isGroup) {
          return (
            <Grid item xs={12} sm={6}>
              <Box sx={{
                border: 1,
                borderColor: 'divider',
                borderRadius: 1,
                p: 1.5,
                bgcolor: 'action.hover'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <GroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase' }}>
                    Subject
                  </Typography>
                  <Chip label="Group" size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                  <Box sx={{ flex: 1 }} />
                  {isEditing && (
                    <Tooltip title="Search for patient or group">
                      <IconButton size="small" onClick={function() {
                        if (typeof onSearchPatient === 'function') { onSearchPatient(); }
                      }}>
                        <SearchIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography variant="body2" sx={{ color: 'text.primary' }}>
                  {patientDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {patientRef}
                </Typography>
              </Box>
            </Grid>
          );
        }

        return (
          <Grid item xs={12} sm={6}>
            <TextField
              id="patientDisplay"
              fullWidth
              label="Patient Name"
              value={patientDisplay}
              onChange={function(e) { handleChange('patient.display', e.target.value); }}
              helperText={patientRef || 'Patient reference will be assigned'}
              disabled={!isEditing}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
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
        );
      })()}
      <Grid item xs={12} sm={6}>
        <TextField
          id="careManagerDisplay"
          fullWidth
          label="Care Manager"
          value={get(episodeOfCare, 'careManager.display', '') || get(episodeOfCare, 'careManagerDisplay', '')}
          onChange={function(e) { handleChange('careManager.display', e.target.value); }}
          helperText={get(episodeOfCare, 'careManager.reference', '') || get(episodeOfCare, 'careManagerReference', '') || 'Care manager reference'}
          disabled={!isEditing}
        />
      </Grid>

      {/* Managing Organization */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="managingOrganizationDisplay"
          fullWidth
          label="Managing Organization"
          value={get(episodeOfCare, 'managingOrganization.display', '') || get(episodeOfCare, 'managingOrganizationDisplay', '')}
          onChange={function(e) { handleChange('managingOrganization.display', e.target.value); }}
          helperText={get(episodeOfCare, 'managingOrganization.reference', '') || get(episodeOfCare, 'managingOrganizationReference', '') || 'Organization reference'}
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
          value={(get(episodeOfCare, 'period.start', '') || get(episodeOfCare, 'periodStart', '')) ? moment(get(episodeOfCare, 'period.start', '') || get(episodeOfCare, 'periodStart', '')).format('YYYY-MM-DD') : ''}
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
          value={(get(episodeOfCare, 'period.end', '') || get(episodeOfCare, 'periodEnd', '')) ? moment(get(episodeOfCare, 'period.end', '') || get(episodeOfCare, 'periodEnd', '')).format('YYYY-MM-DD') : ''}
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
          value={get(episodeOfCare, 'diagnosis[0].condition.display', get(episodeOfCare, 'diagnosis[0].condition.reference', '')) || get(episodeOfCare, 'diagnosisDisplay', '')}
          onChange={function(e) { handleChange('diagnosis[0].condition.display', e.target.value); }}
          helperText="Primary diagnosis for this episode of care"
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Referral Requests (read-only) */}
      {(get(episodeOfCare, 'referralRequest', []).length > 0 || get(episodeOfCare, 'referralRequests', []).length > 0) && (
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
            Referral Requests
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {(get(episodeOfCare, 'referralRequest', []).length > 0 ? get(episodeOfCare, 'referralRequest', []) : get(episodeOfCare, 'referralRequests', [])).map(function(referral, idx) {
              var refString = get(referral, 'reference', '');
              var displayText = get(referral, 'display', '');
              var resourceType = refString.split('/')[0] || '';

              return (
                <Box key={idx} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 1,
                  borderRadius: 1,
                  bgcolor: 'action.hover'
                }}>
                  {resourceType && (
                    <Chip
                      label={resourceType}
                      size="small"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {displayText || refString}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Grid>
      )}

      {/* Extensions */}
      {(function() {
        var extensionsArray = get(episodeOfCare, 'extension', []);
        if (extensionsArray.length === 0) {
          extensionsArray = get(episodeOfCare, 'extensions', []);
        }
        if (extensionsArray.length > 0) {
          return (
            <Grid item xs={12}>
              <CrudExtensions extensions={extensionsArray} />
            </Grid>
          );
        }
        return null;
      })()}
    </Grid>
  );
}

export default EpisodeOfCareFormView;
