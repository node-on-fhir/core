// imports/ui-fhir/riskAssessments/RiskAssessmentFormView.jsx

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

function RiskAssessmentFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Grid container spacing={3}>
      {/* Status */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="statusSelect"
            value={get(form, 'status', 'preliminary')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Grid>

      {/* Date */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="dateInput"
          fullWidth
          label="Date"
          type="date"
          value={get(form, 'date', '')}
          onChange={(e) => onChange('date', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Code (Type of Assessment) */}
      <Grid item xs={12}>
        <TextField
          id="codeInput"
          fullWidth
          label="Assessment Type"
          value={get(form, 'codeText', '')}
          onChange={(e) => onChange('codeText', e.target.value)}
          disabled={!isEditing}
          helperText="Type of risk assessment (e.g., Cardiovascular risk assessment)"
        />
      </Grid>

      {/* Method */}
      <Grid item xs={12}>
        <TextField
          id="methodInput"
          fullWidth
          label="Method"
          value={get(form, 'methodText', '')}
          onChange={(e) => onChange('methodText', e.target.value)}
          disabled={!isEditing}
          helperText="Algorithm or methodology used (e.g., Framingham Risk Score)"
        />
      </Grid>

      {/* Prediction */}
      <Grid item xs={12}>
        <TextField
          id="predictionInput"
          fullWidth
          label="Prediction"
          value={get(form, 'prediction', '')}
          onChange={(e) => onChange('prediction', e.target.value)}
          disabled={!isEditing}
          multiline
          rows={2}
          helperText="Predicted outcome of the assessment"
        />
      </Grid>

      {/* Mitigation */}
      <Grid item xs={12}>
        <TextField
          id="mitigationInput"
          fullWidth
          label="Mitigation"
          value={get(form, 'mitigation', '')}
          onChange={(e) => onChange('mitigation', e.target.value)}
          disabled={!isEditing}
          multiline
          rows={2}
          helperText="How to reduce the risk"
        />
      </Grid>

      {/* Occurrence DateTime */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="occurrenceDateTimeInput"
          fullWidth
          label="Occurrence Date/Time"
          type="datetime-local"
          value={get(form, 'occurrenceDateTime', '')}
          onChange={(e) => onChange('occurrenceDateTime', e.target.value)}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
          helperText="When the assessment was performed"
        />
      </Grid>

      {/* Performer Display */}
      <Grid item xs={12} sm={6}>
        <TextField
          id="performerDisplay"
          fullWidth
          label="Performer"
          value={get(form, 'performerDisplay', '')}
          onChange={(e) => onChange('performerDisplay', e.target.value)}
          disabled={!isEditing}
          helperText="Who performed the assessment"
        />
      </Grid>

      {/* Patient / Subject */}
      <Grid item xs={12}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={get(form, 'subjectDisplay', '')}
          disabled
          helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
        />
      </Grid>
    </Grid>
  );
}

export default RiskAssessmentFormView;
