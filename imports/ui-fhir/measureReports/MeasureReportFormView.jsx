// imports/ui-fhir/measureReports/MeasureReportFormView.jsx

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
  Divider
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'complete', label: 'Complete' },
  { value: 'pending', label: 'Pending' },
  { value: 'error', label: 'Error' }
];

const typeOptions = [
  { value: 'individual', label: 'Individual' },
  { value: 'subject-list', label: 'Subject List' },
  { value: 'summary', label: 'Summary' },
  { value: 'data-exchange', label: 'Data Exchange' }
];

const improvementNotationOptions = [
  { value: '', label: 'None' },
  { value: 'increase', label: 'Increase' },
  { value: 'decrease', label: 'Decrease' }
];

//===========================================================================
// COMPONENT

function MeasureReportFormView({ resource, isEditing, onChange, isEmbedded }) {
  var measureReport = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Identifier */}
        <Grid item xs={12} md={6}>
          <TextField
            id="identifierInput"
            fullWidth
            label="Identifier"
            value={get(measureReport, 'identifier[0].value', '')}
            onChange={function(e) { handleChange('identifier[0].value', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth margin="normal" disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="statusSelect"
              value={get(measureReport, 'status', 'complete')}
              label="Status"
              onChange={function(e) { handleChange('status', e.target.value); }}
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Type */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth margin="normal" disabled={!isEditing}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              labelId="type-label"
              id="typeSelect"
              value={get(measureReport, 'type', 'individual')}
              label="Type"
              onChange={function(e) { handleChange('type', e.target.value); }}
            >
              {typeOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Subject */}
        <Grid item xs={12} md={6}>
          <TextField
            id="subjectInput"
            fullWidth
            label="Subject"
            value={get(measureReport, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
            helperText={get(measureReport, 'subject.reference', '') || 'Patient reference'}
          />
        </Grid>

        {/* Measure Reference */}
        <Grid item xs={12} md={6}>
          <TextField
            id="measureReferenceInput"
            fullWidth
            label="Measure Reference"
            value={get(measureReport, 'measure', '')}
            onChange={function(e) { handleChange('measure', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Date */}
        <Grid item xs={12} md={4}>
          <TextField
            id="dateInput"
            fullWidth
            label="Date"
            type="date"
            value={get(measureReport, 'date') && moment(get(measureReport, 'date')).isValid() ? moment(get(measureReport, 'date')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('date', new Date(e.target.value)); }}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Period Start */}
        <Grid item xs={12} md={4}>
          <TextField
            id="periodStartInput"
            fullWidth
            label="Period Start"
            type="date"
            value={get(measureReport, 'period.start') && moment(get(measureReport, 'period.start')).isValid() ? moment(get(measureReport, 'period.start')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('period.start', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Period End */}
        <Grid item xs={12} md={4}>
          <TextField
            id="periodEndInput"
            fullWidth
            label="Period End"
            type="date"
            value={get(measureReport, 'period.end') && moment(get(measureReport, 'period.end')).isValid() ? moment(get(measureReport, 'period.end')).format('YYYY-MM-DD') : ''}
            onChange={function(e) { handleChange('period.end', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Reporter */}
        <Grid item xs={12} md={6}>
          <TextField
            id="reporterInput"
            fullWidth
            label="Reporter"
            value={get(measureReport, 'reporter.display', '')}
            onChange={function(e) { handleChange('reporter.display', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Improvement Notation */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal" disabled={!isEditing}>
            <InputLabel id="improvement-notation-label">Improvement Notation</InputLabel>
            <Select
              labelId="improvement-notation-label"
              id="improvementNotationSelect"
              value={get(measureReport, 'improvementNotation.text', '')}
              label="Improvement Notation"
              onChange={function(e) { handleChange('improvementNotation.text', e.target.value); }}
            >
              {improvementNotationOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Group Information Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Group Information</Typography>
        </Grid>

        {/* Group Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="groupCodeInput"
            fullWidth
            label="Group Code"
            value={get(measureReport, 'group[0].code.text', '')}
            onChange={function(e) { handleChange('group[0].code.text', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Group Description */}
        <Grid item xs={12} md={6}>
          <TextField
            id="groupDescriptionTextarea"
            fullWidth
            label="Group Description"
            value={get(measureReport, 'group[0].code.text', '')}
            onChange={function(e) { handleChange('group[0].code.text', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
            multiline
            rows={2}
          />
        </Grid>

        {/* Population Code */}
        <Grid item xs={12} md={4}>
          <TextField
            id="populationCodeInput"
            fullWidth
            label="Population Code"
            value={get(measureReport, 'group[0].population[0].code.text', '')}
            onChange={function(e) { handleChange('group[0].population[0].code.text', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Population Count */}
        <Grid item xs={12} md={4}>
          <TextField
            id="populationCountInput"
            fullWidth
            label="Population Count"
            type="number"
            value={get(measureReport, 'group[0].population[0].count', 0)}
            onChange={function(e) { handleChange('group[0].population[0].count', parseInt(e.target.value)); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Measure Score */}
        <Grid item xs={12} md={4}>
          <TextField
            id="measureScoreValueInput"
            fullWidth
            label="Measure Score"
            type="number"
            inputProps={{ step: 0.01 }}
            value={get(measureReport, 'group[0].measureScore.value', 0)}
            onChange={function(e) { handleChange('group[0].measureScore.value', parseFloat(e.target.value)); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Stratifier Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="stratifierCodeInput"
            fullWidth
            label="Stratifier Code"
            value={get(measureReport, 'group[0].stratifier[0].code[0].text', '')}
            onChange={function(e) { handleChange('group[0].stratifier[0].code[0].text', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Stratifier Value */}
        <Grid item xs={12} md={6}>
          <TextField
            id="stratifierValueInput"
            fullWidth
            label="Stratifier Value"
            value={get(measureReport, 'group[0].stratifier[0].stratum[0].value.text', '')}
            onChange={function(e) { handleChange('group[0].stratifier[0].stratum[0].value.text', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        {/* Measure URL */}
        <Grid item xs={12}>
          <TextField
            id="measureUrlInput"
            fullWidth
            label="Measure URL"
            value={get(measureReport, 'measure', '')}
            onChange={function(e) { handleChange('measure', e.target.value); }}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MeasureReportFormView;
