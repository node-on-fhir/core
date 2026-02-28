// imports/ui-fhir/artifactAssessments/ArtifactAssessmentFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  Divider
} from '@mui/material';

import { get } from 'lodash';

const clinicalStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'recurrence', label: 'Recurrence' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'remission', label: 'Remission' },
  { value: 'resolved', label: 'Resolved' }
];

const verificationStatusOptions = [
  { value: 'provisional', label: 'Provisional' },
  { value: 'differential', label: 'Differential' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'refuted', label: 'Refuted' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

function ArtifactAssessmentFormView({ resource, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>Patient & Asserter</Typography>
      <Divider />

      <Stack direction="row" spacing={2}>
        <TextField
          id="patientDisplayInput"
          fullWidth
          label="Patient"
          value={get(resource, 'patient.display', '')}
          onChange={(e) => onChange('patient.display', e.target.value)}
          disabled={!isEditing}
          helperText={get(resource, 'patient.reference', '') || 'Patient reference'}
        />

        <TextField
          id="asserterDisplayInput"
          fullWidth
          label="Asserter"
          value={get(resource, 'asserter.display', '')}
          onChange={(e) => onChange('asserter.display', e.target.value)}
          disabled={!isEditing}
          helperText="The person who asserted this assessment"
        />
      </Stack>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Code</Typography>
      <Divider />

      <Stack direction="row" spacing={2}>
        <TextField
          id="snomedCodeInput"
          fullWidth
          label="SNOMED Code"
          value={get(resource, 'code.coding.0.code', '')}
          onChange={(e) => onChange('code.coding.0.code', e.target.value)}
          disabled={!isEditing}
          helperText="e.g., 307343001"
        />

        <TextField
          id="snomedDisplayInput"
          fullWidth
          label="SNOMED Display"
          value={get(resource, 'code.coding.0.display', '')}
          onChange={(e) => onChange('code.coding.0.display', e.target.value)}
          disabled={!isEditing}
          helperText="e.g., Acquired hemoglobin H disease (disorder)"
        />
      </Stack>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Status</Typography>
      <Divider />

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Clinical Status</InputLabel>
          <Select
            id="clinicalStatusSelect"
            value={get(resource, 'clinicalStatus', '')}
            onChange={(e) => onChange('clinicalStatus', e.target.value)}
            label="Clinical Status"
          >
            {clinicalStatusOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Verification Status</InputLabel>
          <Select
            id="verificationStatusSelect"
            value={get(resource, 'verificationStatus', '')}
            onChange={(e) => onChange('verificationStatus', e.target.value)}
            label="Verification Status"
          >
            {verificationStatusOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Dates</Typography>
      <Divider />

      <TextField
        id="onsetDateTimeInput"
        fullWidth
        type="datetime-local"
        label="Onset Date/Time"
        value={get(resource, 'onsetDateTime', '').substring(0, 16)}
        onChange={(e) => onChange('onsetDateTime', e.target.value ? new Date(e.target.value).toISOString() : '')}
        disabled={!isEditing}
        InputLabelProps={{ shrink: true }}
      />
    </Stack>
  );
}

export default ArtifactAssessmentFormView;
