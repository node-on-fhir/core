// /imports/ui-fhir/researchSubjects/ResearchSubjectFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

const statusOptions = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'follow-up', label: 'Follow-up' },
  { value: 'ineligible', label: 'Ineligible' },
  { value: 'not-registered', label: 'Not Registered' },
  { value: 'off-study', label: 'Off Study' },
  { value: 'on-study', label: 'On Study' },
  { value: 'on-study-intervention', label: 'On Study Intervention' },
  { value: 'on-study-observation', label: 'On Study Observation' },
  { value: 'pending-on-study', label: 'Pending On Study' },
  { value: 'potential-candidate', label: 'Potential Candidate' },
  { value: 'screening', label: 'Screening' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

function ResearchSubjectFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }){
  return (
    <Stack spacing={3}>
      <TextField
        id="subjectDisplay"
        fullWidth
        label="Subject/Patient"
        value={form.subject}
        onChange={(e) => onChange('subject', e.target.value)}
        disabled={!isEditing}
        helperText={get(resource, 'subject.reference', '') || 'The patient enrolled in this study'}
        InputProps={{
          endAdornment: isEditing && onSearchPatient && (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton onClick={onSearchPatient} edge="end">
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          )
        }}
      />

      <TextField
        id="studyDisplay"
        fullWidth
        label="Research Study"
        value={form.study}
        onChange={(e) => onChange('study', e.target.value)}
        disabled={!isEditing}
        helperText={get(resource, 'study.reference', '') || 'The research study this subject is enrolled in'}
      />

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
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
          id="periodStart"
          fullWidth
          type="date"
          label="Period Start"
          value={form.periodStart}
          onChange={(e) => onChange('periodStart', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="periodEnd"
          fullWidth
          type="date"
          label="Period End"
          value={form.periodEnd}
          onChange={(e) => onChange('periodEnd', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="assignedArm"
          fullWidth
          label="Assigned Arm"
          value={form.assignedArm}
          onChange={(e) => onChange('assignedArm', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="actualArm"
          fullWidth
          label="Actual Arm"
          value={form.actualArm}
          onChange={(e) => onChange('actualArm', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="consentDisplay"
          fullWidth
          label="Consent"
          value={form.consent}
          onChange={(e) => onChange('consent', e.target.value)}
          disabled={!isEditing}
          helperText={get(resource, 'consent.reference', '')}
        />
      </Stack>
    </Stack>
  );
}

export default ResearchSubjectFormView;
