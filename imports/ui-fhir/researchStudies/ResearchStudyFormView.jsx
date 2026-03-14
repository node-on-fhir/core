// /imports/ui-fhir/researchStudies/ResearchStudyFormView.jsx

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
  { value: 'active', label: 'Active' },
  { value: 'administratively-completed', label: 'Administratively Completed' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed-to-accrual', label: 'Closed to Accrual' },
  { value: 'closed-to-accrual-and-intervention', label: 'Closed to Accrual and Intervention' },
  { value: 'completed', label: 'Completed' },
  { value: 'disapproved', label: 'Disapproved' },
  { value: 'in-review', label: 'In Review' },
  { value: 'temporarily-closed-to-accrual', label: 'Temporarily Closed to Accrual' },
  { value: 'temporarily-closed-to-accrual-and-intervention', label: 'Temporarily Closed to Accrual and Intervention' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

const phaseOptions = [
  { value: 'n-a', label: 'N/A' },
  { value: 'early-phase-1', label: 'Early Phase 1' },
  { value: 'phase-1', label: 'Phase 1' },
  { value: 'phase-1-phase-2', label: 'Phase 1/Phase 2' },
  { value: 'phase-2', label: 'Phase 2' },
  { value: 'phase-2-phase-3', label: 'Phase 2/Phase 3' },
  { value: 'phase-3', label: 'Phase 3' },
  { value: 'phase-4', label: 'Phase 4' }
];

const categoryOptions = [
  { value: 'interventional', label: 'Interventional' },
  { value: 'observational', label: 'Observational' },
  { value: 'expanded-access', label: 'Expanded Access' }
];

const focusTypeOptions = [
  { value: 'http://snomed.info/sct', label: 'SNOMED CT' },
  { value: 'http://www.nlm.nih.gov/research/umls/rxnorm', label: 'RxNorm' },
  { value: 'http://loinc.org', label: 'LOINC' },
  { value: 'medication', label: 'Medication' },
  { value: 'device', label: 'Device' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'condition', label: 'Condition' }
];

function ResearchStudyFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <TextField
        id="title"
        fullWidth
        label="Title"
        value={form.title}
        onChange={(e) => onChange('title', e.target.value)}
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="principalInvestigatorDisplay"
          fullWidth
          label="Principal Investigator"
          value={form.principalInvestigator}
          onChange={(e) => onChange('principalInvestigator', e.target.value)}
          disabled={!isEditing}
          helperText={get(resource, 'principalInvestigator.reference', '')}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Search for investigator">
                  <IconButton edge="end" disabled={!isEditing}>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            )
          }}
        />

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
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Phase</InputLabel>
          <Select
            id="phase"
            value={form.phase}
            onChange={(e) => onChange('phase', e.target.value)}
            label="Phase"
          >
            {phaseOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Category</InputLabel>
          <Select
            id="category"
            value={form.category}
            onChange={(e) => onChange('category', e.target.value)}
            label="Category"
          >
            {categoryOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Focus Type</InputLabel>
          <Select
            id="focusType"
            value={form.focusType}
            onChange={(e) => onChange('focusType', e.target.value)}
            label="Focus Type"
          >
            {focusTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          id="focusCode"
          fullWidth
          label="Focus Code"
          value={form.focusCode}
          onChange={(e) => onChange('focusCode', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="focusDisplay"
          fullWidth
          label="Focus Display"
          value={form.focusDisplay}
          onChange={(e) => onChange('focusDisplay', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="descriptionTextarea"
        fullWidth
        multiline
        rows={4}
        label="Description"
        value={form.description}
        onChange={(e) => onChange('description', e.target.value)}
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
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
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="enrollmentTarget"
          fullWidth
          type="number"
          label="Enrollment Target"
          value={form.enrollmentTarget}
          onChange={(e) => onChange('enrollmentTarget', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="enrollmentActual"
          fullWidth
          type="number"
          label="Enrollment Actual"
          value={form.enrollmentActual}
          onChange={(e) => onChange('enrollmentActual', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={form.notes}
        onChange={(e) => onChange('notes', e.target.value)}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default ResearchStudyFormView;
