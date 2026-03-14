// /imports/ui-fhir/questionnaireResponses/QuestionnaireResponseFormView.jsx

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
import moment from 'moment';

const statusOptions = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'amended', label: 'Amended' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' }
];

function QuestionnaireResponseFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }){
  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2}>
        <TextField
          id="identifier"
          fullWidth
          label="Identifier"
          value={form.identifier}
          onChange={(e) => onChange('identifier', e.target.value)}
          disabled={!isEditing}
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
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={form.subject}
          onChange={(e) => onChange('subject', e.target.value)}
          disabled={!isEditing}
          helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
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
          id="authorDisplay"
          fullWidth
          label="Author"
          value={form.author}
          onChange={(e) => onChange('author', e.target.value)}
          disabled={!isEditing}
          helperText={get(resource, 'author.reference', '')}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="questionnaire"
          fullWidth
          label="Questionnaire Reference"
          value={form.questionnaire}
          onChange={(e) => onChange('questionnaire', e.target.value)}
          disabled={!isEditing}
          helperText="Format: Questionnaire/id"
        />

        <TextField
          id="questionnaireDisplay"
          fullWidth
          label="Questionnaire Display"
          value={form.questionnaireDisplay}
          onChange={(e) => onChange('questionnaireDisplay', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="authored"
          fullWidth
          type="datetime-local"
          label="Authored"
          value={form.authored}
          onChange={(e) => onChange('authored', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="source"
          fullWidth
          label="Source"
          value={form.source}
          onChange={(e) => onChange('source', e.target.value)}
          disabled={!isEditing}
          helperText="Who answered the questions"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="basedOn"
          fullWidth
          label="Based On"
          value={form.basedOn}
          onChange={(e) => onChange('basedOn', e.target.value)}
          disabled={!isEditing}
          helperText="ServiceRequest or CarePlan reference"
        />

        <TextField
          id="partOf"
          fullWidth
          label="Part Of"
          value={form.partOf}
          onChange={(e) => onChange('partOf', e.target.value)}
          disabled={!isEditing}
          helperText="Encounter or Procedure reference"
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="reasonCode"
          fullWidth
          label="Reason Code"
          value={form.reasonCode}
          onChange={(e) => onChange('reasonCode', e.target.value)}
          disabled={!isEditing}
          helperText="SNOMED CT code"
        />

        <TextField
          id="reasonDisplay"
          fullWidth
          label="Reason Display"
          value={form.reasonDisplay}
          onChange={(e) => onChange('reasonDisplay', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={form.notes}
        onChange={(e) => onChange('notes', e.target.value)}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default QuestionnaireResponseFormView;
