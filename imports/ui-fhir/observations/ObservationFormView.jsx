// imports/ui-fhir/observations/ObservationFormView.jsx

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
  { value: 'registered', label: 'Registered' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const categoryOptions = [
  { code: 'vital-signs', display: 'Vital Signs' },
  { code: 'laboratory', display: 'Laboratory' },
  { code: 'imaging', display: 'Imaging' },
  { code: 'procedure', display: 'Procedure' },
  { code: 'survey', display: 'Survey' },
  { code: 'exam', display: 'Exam' },
  { code: 'therapy', display: 'Therapy' },
  { code: 'activity', display: 'Activity' }
];

//===========================================================================
// COMPONENT

function ObservationFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  // Use resource as the observation data, form for transient UI state
  var observation = resource || {};
  var valueType = get(form, 'valueType', 'valueQuantity');
  var onValueTypeChange = get(form, 'onValueTypeChange', function() {});
  var onClearAllValues = get(form, 'onClearAllValues', function() {});
  var showPatientInputs = get(form, 'showPatientInputs', true);
  var showDeviceInputs = get(form, 'showDeviceInputs', true);

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient Fields */}
        {showPatientInputs !== false && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                id="patientDisplay"
                fullWidth
                label="Patient Name"
                value={get(observation, 'subject.display', '')}
                helperText={get(observation, 'subject.reference', '') || 'Patient reference will be assigned'}
                disabled
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="patientReference"
                fullWidth
                label="Patient ID"
                value={get(observation, 'subject.reference', '')}
                disabled
              />
            </Grid>
          </>
        )}

        {/* Performer */}
        <Grid item xs={12} md={6}>
          <TextField
            id="performerDisplay"
            fullWidth
            label="Performer"
            value={get(observation, 'performer[0].display', '')}
            helperText={get(observation, 'performer[0].reference', '') || 'Performer reference will be assigned'}
            disabled
          />
        </Grid>

        {/* Category */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Category</InputLabel>
            <Select
              id="category"
              value={get(observation, 'category[0].coding[0].code', 'vital-signs')}
              onChange={function(e) {
                var option = categoryOptions.find(function(o) { return o.code === e.target.value; });
                handleChange('category[0].coding[0].code', option.code);
                handleChange('category[0].coding[0].display', option.display);
                handleChange('category[0].text', option.display);
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

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              id="status"
              labelId="status-label"
              value={get(observation, 'status', 'preliminary')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Effective Date/Time */}
        <Grid item xs={12} md={6}>
          <TextField
            id="effectiveDate"
            fullWidth
            type="datetime-local"
            label="Effective Date/Time"
            value={get(observation, 'effectiveDateTime') ? moment(get(observation, 'effectiveDateTime')).format('YYYY-MM-DDTHH:mm') : ''}
            onChange={function(e) { handleChange('effectiveDateTime', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* LOINC Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="loincCode"
            fullWidth
            label="LOINC Code"
            value={get(observation, 'code.coding[0].code', '')}
            onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
            helperText="LOINC observation code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Search LOINC codes">
                    <IconButton
                      onClick={function() { window.open('https://loinc.org/search/', '_blank'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Search LOINC codes"
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* LOINC Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="loincDisplay"
            fullWidth
            label="LOINC Display"
            value={get(observation, 'code.coding[0].display', '') || get(observation, 'code.text', '')}
            onChange={function(e) {
              handleChange('code.coding[0].display', e.target.value);
              handleChange('code.text', e.target.value);
            }}
            helperText="Human-readable observation name"
            disabled={!isEditing}
          />
        </Grid>

        {/* Value Type selector */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Value</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Value Type</InputLabel>
            <Select
              value={valueType}
              onChange={function(e) {
                onClearAllValues();
                onValueTypeChange(e.target.value);
              }}
              label="Value Type"
            >
              <MenuItem value="valueQuantity">Quantity</MenuItem>
              <MenuItem value="valueCodeableConcept">Codeable Concept</MenuItem>
              <MenuItem value="valueString">String</MenuItem>
              <MenuItem value="valueBoolean">Boolean</MenuItem>
              <MenuItem value="valueInteger">Integer</MenuItem>
              <MenuItem value="valueRange">Range</MenuItem>
              <MenuItem value="valueRatio">Ratio</MenuItem>
              <MenuItem value="valueSampledData">Sampled Data</MenuItem>
              <MenuItem value="valueTime">Time</MenuItem>
              <MenuItem value="valueDateTime">Date/Time</MenuItem>
              <MenuItem value="valuePeriod">Period</MenuItem>
              <MenuItem value="valueAttachment">Attachment</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Value fields based on type */}
        {valueType === 'valueQuantity' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                id="valueQuantity"
                fullWidth
                type="number"
                label="Quantity Value"
                value={get(observation, 'valueQuantity.value', '')}
                onChange={function(e) { handleChange('valueQuantity.value', parseFloat(e.target.value) || null); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                id="unit"
                fullWidth
                label="Unit"
                value={get(observation, 'valueQuantity.unit', '')}
                onChange={function(e) {
                  handleChange('valueQuantity.unit', e.target.value);
                  handleChange('valueQuantity.code', e.target.value);
                }}
                helperText="e.g., kg, mmHg, mg/dL"
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {valueType === 'valueString' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="String Value"
              value={get(observation, 'valueString', '')}
              onChange={function(e) { handleChange('valueString', e.target.value); }}
              helperText="e.g., Positive, Negative, A+, Normal"
              disabled={!isEditing}
            />
          </Grid>
        )}

        {valueType === 'valueBoolean' && (
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Boolean Value</InputLabel>
              <Select
                value={get(observation, 'valueBoolean', '') === '' ? '' : String(get(observation, 'valueBoolean', false))}
                onChange={function(e) { handleChange('valueBoolean', e.target.value === 'true'); }}
                label="Boolean Value"
              >
                <MenuItem value="">Select Value</MenuItem>
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {valueType === 'valueInteger' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Integer Value"
              value={get(observation, 'valueInteger', '')}
              onChange={function(e) { handleChange('valueInteger', parseInt(e.target.value) || null); }}
              helperText="Whole number only"
              disabled={!isEditing}
            />
          </Grid>
        )}

        {valueType === 'valueCodeableConcept' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Code"
                value={get(observation, 'valueCodeableConcept.coding[0].code', '')}
                onChange={function(e) { handleChange('valueCodeableConcept.coding[0].code', e.target.value); }}
                helperText="e.g., 260373001"
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Display"
                value={get(observation, 'valueCodeableConcept.coding[0].display', '')}
                onChange={function(e) { handleChange('valueCodeableConcept.coding[0].display', e.target.value); }}
                helperText="e.g., Detected"
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="System"
                value={get(observation, 'valueCodeableConcept.coding[0].system', 'http://snomed.info/sct')}
                onChange={function(e) { handleChange('valueCodeableConcept.coding[0].system', e.target.value); }}
                helperText="Code system URL"
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {valueType === 'valueRange' && (
          <>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Low Value"
                value={get(observation, 'valueRange.low.value', '')}
                onChange={function(e) { handleChange('valueRange.low.value', parseFloat(e.target.value) || null); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="High Value"
                value={get(observation, 'valueRange.high.value', '')}
                onChange={function(e) { handleChange('valueRange.high.value', parseFloat(e.target.value) || null); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Unit"
                value={get(observation, 'valueRange.low.unit', '')}
                onChange={function(e) {
                  handleChange('valueRange.low.unit', e.target.value);
                  handleChange('valueRange.high.unit', e.target.value);
                }}
                helperText="e.g., mg/dL"
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {valueType === 'valueRatio' && (
          <>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Numerator"
                value={get(observation, 'valueRatio.numerator.value', '')}
                onChange={function(e) { handleChange('valueRatio.numerator.value', parseFloat(e.target.value) || null); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Numerator Unit"
                value={get(observation, 'valueRatio.numerator.unit', '')}
                onChange={function(e) { handleChange('valueRatio.numerator.unit', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="number"
                label="Denominator"
                value={get(observation, 'valueRatio.denominator.value', '')}
                onChange={function(e) { handleChange('valueRatio.denominator.value', parseFloat(e.target.value) || null); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Denominator Unit"
                value={get(observation, 'valueRatio.denominator.unit', '')}
                onChange={function(e) { handleChange('valueRatio.denominator.unit', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {valueType === 'valueTime' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="time"
              label="Time Value"
              value={get(observation, 'valueTime', '')}
              onChange={function(e) { handleChange('valueTime', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Grid>
        )}

        {valueType === 'valueDateTime' && (
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="datetime-local"
              label="Date/Time Value"
              value={get(observation, 'valueDateTime') ? moment(get(observation, 'valueDateTime')).format('YYYY-MM-DDTHH:mm') : ''}
              onChange={function(e) { handleChange('valueDateTime', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Grid>
        )}

        {valueType === 'valuePeriod' && (
          <>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Period Start"
                value={get(observation, 'valuePeriod.start') ? moment(get(observation, 'valuePeriod.start')).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={function(e) { handleChange('valuePeriod.start', e.target.value); }}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Period End"
                value={get(observation, 'valuePeriod.end') ? moment(get(observation, 'valuePeriod.end')).format('YYYY-MM-DDTHH:mm') : ''}
                onChange={function(e) { handleChange('valuePeriod.end', e.target.value); }}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {valueType === 'valueSampledData' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Sampled Data"
              value={get(observation, 'valueSampledData.data', '')}
              onChange={function(e) { handleChange('valueSampledData.data', e.target.value); }}
              helperText="E format: values separated by spaces"
              disabled={!isEditing}
            />
          </Grid>
        )}

        {valueType === 'valueAttachment' && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Attachment URL"
              value={get(observation, 'valueAttachment.url', '')}
              onChange={function(e) { handleChange('valueAttachment.url', e.target.value); }}
              helperText="URL to the attached resource"
              disabled={!isEditing}
            />
          </Grid>
        )}

        {/* Device */}
        {showDeviceInputs !== false && (
          <>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 1 }}>Device</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device Name"
                value={get(observation, 'device.display', '')}
                onChange={function(e) { handleChange('device.display', e.target.value); }}
                helperText="e.g., Blood Pressure Monitor"
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device Reference"
                value={get(observation, 'device.reference', '')}
                onChange={function(e) { handleChange('device.reference', e.target.value); }}
                helperText="e.g., Device/12345"
                disabled={!isEditing}
              />
            </Grid>
          </>
        )}

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(observation, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            helperText="Additional notes about this observation"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default ObservationFormView;
