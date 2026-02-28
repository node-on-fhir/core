// imports/ui-fhir/immunizations/ImmunizationFormView.jsx

import React from 'react';

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputAdornment,
  InputLabel,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

var statusOptions = [
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'not-done', label: 'Not Done' }
];

var siteOptions = [
  { value: 'LA', code: 'LA', label: 'Left arm' },
  { value: 'RA', code: 'RA', label: 'Right arm' },
  { value: 'LD', code: 'LD', label: 'Left deltoid' },
  { value: 'RD', code: 'RD', label: 'Right deltoid' },
  { value: 'LT', code: 'LT', label: 'Left thigh' },
  { value: 'RT', code: 'RT', label: 'Right thigh' },
  { value: 'LG', code: 'LG', label: 'Left gluteus medius' },
  { value: 'RG', code: 'RG', label: 'Right gluteus medius' }
];

var routeOptions = [
  { value: 'IM', code: 'IM', label: 'Intramuscular' },
  { value: 'PO', code: 'PO', label: 'Oral' },
  { value: 'SC', code: 'SC', label: 'Subcutaneous' },
  { value: 'ID', code: 'ID', label: 'Intradermal' },
  { value: 'IN', code: 'IN', label: 'Intranasal' }
];

//===========================================================================
// COMPONENT

function ImmunizationFormView({ resource, isEditing, onChange, isEmbedded }) {
  var immunization = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  function handleSearchUser() {
    console.log('Search for patient - to be implemented');
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
            value={get(immunization, 'patient.display', '')}
            onChange={function(e) { handleChange('patient.display', e.target.value); }}
            helperText={get(immunization, 'patient.reference', '') || 'Patient reference will be assigned'}
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search for patient">
                    <IconButton
                      onClick={handleSearchUser}
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

        {/* Vaccine Name + CVX Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="vaccineDisplay"
            fullWidth
            label="Vaccine Name"
            value={get(immunization, 'vaccineCode.text', '') ||
                   get(immunization, 'vaccineCode.coding[0].display', '')}
            onChange={function(e) {
              handleChange('vaccineCode.text', e.target.value);
              handleChange('vaccineCode.coding[0].display', e.target.value);
            }}
            helperText="Name of the vaccine administered"
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="vaccineCode"
            fullWidth
            label="CVX Code"
            value={get(immunization, 'vaccineCode.coding[0].code', '')}
            onChange={function(e) { handleChange('vaccineCode.coding[0].code', e.target.value); }}
            helperText="CVX vaccine code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup CVX codes">
                    <IconButton
                      onClick={function() { window.open('https://www2a.cdc.gov/vaccines/iis/iisstandards/vaccines.asp?rpt=cvx', '_blank'); }}
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

        {/* Status + Date */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="statusSelect-label">Status</InputLabel>
            <Select
              labelId="statusSelect-label"
              id="statusSelect"
              value={get(immunization, 'status', 'completed')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="occurrenceDateTime"
            fullWidth
            type="datetime-local"
            label="Administration Date/Time"
            value={moment(get(immunization, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
            onChange={function(e) { handleChange('occurrenceDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Primary Source */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                id="primarySource"
                checked={get(immunization, 'primarySource', true)}
                onChange={function(e) { handleChange('primarySource', e.target.checked); }}
                disabled={!isEditing}
              />
            }
            label="Primary Source (indicates information obtained from the person who administered the vaccine)"
          />
        </Grid>

        {/* Lot Number + Expiration Date */}
        <Grid item xs={12} md={6}>
          <TextField
            id="lotNumber"
            fullWidth
            label="Lot Number"
            value={get(immunization, 'lotNumber', '')}
            onChange={function(e) { handleChange('lotNumber', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="expirationDate"
            fullWidth
            type="date"
            label="Expiration Date"
            value={moment(get(immunization, 'expirationDate', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('expirationDate', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Manufacturer */}
        <Grid item xs={12}>
          <TextField
            id="manufacturerDisplay"
            fullWidth
            label="Manufacturer"
            value={get(immunization, 'manufacturer.display', '')}
            onChange={function(e) { handleChange('manufacturer.display', e.target.value); }}
            helperText="e.g., Pfizer, Moderna, Johnson & Johnson"
            disabled={!isEditing}
          />
        </Grid>

        {/* Site + Route */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="siteSelect-label">Injection Site</InputLabel>
            <Select
              labelId="siteSelect-label"
              id="siteSelect"
              value={get(immunization, 'site.coding[0].code', '')}
              onChange={function(e) {
                var selectedSite = siteOptions.find(function(opt) { return opt.code === e.target.value; });
                handleChange('site.coding[0].code', e.target.value);
                handleChange('site.coding[0].display', selectedSite ? selectedSite.label : '');
                handleChange('site.text', selectedSite ? selectedSite.label : '');
              }}
              label="Injection Site"
            >
              {siteOptions.map(function(option) {
                return (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="routeSelect-label">Route</InputLabel>
            <Select
              labelId="routeSelect-label"
              id="routeSelect"
              value={get(immunization, 'route.coding[0].code', '')}
              onChange={function(e) {
                var selectedRoute = routeOptions.find(function(opt) { return opt.code === e.target.value; });
                handleChange('route.coding[0].code', e.target.value);
                handleChange('route.coding[0].display', selectedRoute ? selectedRoute.label : '');
                handleChange('route.text', selectedRoute ? selectedRoute.label : '');
              }}
              label="Route"
            >
              {routeOptions.map(function(option) {
                return (
                  <MenuItem key={option.code} value={option.code}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Dose Amount + Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            id="doseQuantityValue"
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(immunization, 'doseQuantity.value', '')}
            onChange={function(e) { handleChange('doseQuantity.value', parseFloat(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="doseQuantityUnit"
            fullWidth
            label="Dose Unit"
            value={get(immunization, 'doseQuantity.unit', '')}
            onChange={function(e) {
              handleChange('doseQuantity.unit', e.target.value);
              handleChange('doseQuantity.code', e.target.value);
            }}
            helperText="e.g., mL, mg"
            disabled={!isEditing}
          />
        </Grid>

        {/* Performer */}
        <Grid item xs={12}>
          <TextField
            id="performerDisplay"
            fullWidth
            label="Administered By"
            value={get(immunization, 'performer[0].actor.display', '')}
            onChange={function(e) { handleChange('performer[0].actor.display', e.target.value); }}
            helperText={get(immunization, 'performer[0].actor.reference', '') || 'Practitioner reference will be assigned'}
            disabled={!isEditing}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="noteText"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(immunization, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            helperText="Additional notes about this immunization"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default ImmunizationFormView;
