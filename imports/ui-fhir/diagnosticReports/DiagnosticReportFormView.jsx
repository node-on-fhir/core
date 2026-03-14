// /imports/ui-fhir/diagnosticReports/DiagnosticReportFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack
} from '@mui/material';

import { get } from 'lodash';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'partial', label: 'Partial' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'appended', label: 'Appended' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

function DiagnosticReportFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <TextField
        id='subjectInput'
        fullWidth
        label='Patient'
        value={form.subject}
        disabled
        helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id='codeInput'
          fullWidth
          label='LOINC Code'
          value={form.code}
          onChange={(e) => onChange('code', e.target.value)}
          helperText="Enter LOINC code (e.g., 24323-8)"
          disabled={!isEditing}
        />

        <TextField
          id='categoryInput'
          fullWidth
          label='Category'
          value={form.category}
          onChange={(e) => onChange('category', e.target.value)}
          helperText="e.g., LAB, RAD, SP, CP"
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id='statusSelect'
            value={form.status}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          id='effectiveDateTimeInput'
          fullWidth
          type='date'
          label='Effective Date'
          value={form.effectiveDateTime}
          onChange={(e) => onChange('effectiveDateTime', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id='conclusionInput'
        fullWidth
        multiline
        rows={4}
        label='Conclusion'
        value={form.conclusion}
        onChange={(e) => onChange('conclusion', e.target.value)}
        helperText="Summary and interpretation of the diagnostic report"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default DiagnosticReportFormView;
