// imports/ui-fhir/encounters/EncounterFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { code: 'planned', display: 'Planned' },
  { code: 'arrived', display: 'Arrived' },
  { code: 'triaged', display: 'Triaged' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'onleave', display: 'On Leave' },
  { code: 'finished', display: 'Finished' },
  { code: 'cancelled', display: 'Cancelled' }
];

const classOptions = [
  { code: 'AMB', display: 'Ambulatory' },
  { code: 'EMER', display: 'Emergency' },
  { code: 'FLD', display: 'Field' },
  { code: 'HH', display: 'Home Health' },
  { code: 'IMP', display: 'Inpatient Encounter' },
  { code: 'ACUTE', display: 'Inpatient Acute' },
  { code: 'NONAC', display: 'Inpatient Non-Acute' },
  { code: 'PRENC', display: 'Pre-Admission' },
  { code: 'SS', display: 'Short Stay' },
  { code: 'VR', display: 'Virtual' },
  { code: 'OTHER', display: 'Other' }
];

function EncounterFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }) {
  // Use form (state object) if provided, otherwise fall back to resource
  var encounter = form || resource || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Patient & Practitioner</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient Name"
          value={get(encounter, 'subject.display', '')}
          onChange={(e) => onChange('subject.display', e.target.value)}
          helperText={get(encounter, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled={!isEditing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Search for patient">
                  <IconButton
                    onClick={onSearchPatient}
                    edge="end"
                    disabled={!isEditing}
                    aria-label="Search for patient"
                  >
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          id="practitionerDisplay"
          fullWidth
          label="Practitioner Name"
          value={get(encounter, 'participant[0].individual.display', '')}
          onChange={(e) => onChange('participant[0].individual.display', e.target.value)}
          helperText={get(encounter, 'participant[0].individual.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Encounter Type</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="encounterType"
          fullWidth
          label="Type Code (SNOMED)"
          value={get(encounter, 'type[0].coding[0].code', '')}
          onChange={(e) => onChange('type[0].coding[0].code', e.target.value)}
          helperText="SNOMED CT code for encounter type"
          disabled={!isEditing}
          sx={{ flex: 1 }}
        />

        <TextField
          id="encounterTypeDisplay"
          fullWidth
          label="Type Description"
          value={get(encounter, 'type[0].coding[0].display', '')}
          onChange={(e) => onChange('type[0].coding[0].display', e.target.value)}
          helperText="Human-readable encounter type"
          disabled={!isEditing}
          sx={{ flex: 2 }}
        />
      </Stack>

      <Typography variant="h6">Status & Classification</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
            value={get(encounter, 'status', 'in-progress')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Class</InputLabel>
          <Select
            id="classCode"
            value={get(encounter, 'class.code', 'AMB')}
            onChange={(e) => {
              const option = classOptions.find(o => o.code === e.target.value);
              onChange('class.code', option.code);
              onChange('class.display', option.display);
            }}
            label="Class"
          >
            {classOptions.map(option => (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6">Reason for Visit</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="reasonCode"
          fullWidth
          label="Reason Code (SNOMED)"
          value={get(encounter, 'reasonCode[0].coding[0].code', '')}
          onChange={(e) => onChange('reasonCode[0].coding[0].code', e.target.value)}
          helperText="SNOMED CT code for visit reason"
          disabled={!isEditing}
          sx={{ flex: 1 }}
        />

        <TextField
          id="reasonDisplay"
          fullWidth
          label="Reason for Visit"
          value={get(encounter, 'reasonCode[0].coding[0].display', '')}
          onChange={(e) => onChange('reasonCode[0].coding[0].display', e.target.value)}
          helperText="Human-readable reason for visit"
          disabled={!isEditing}
          sx={{ flex: 2 }}
        />
      </Stack>

      <Typography variant="h6">Period</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="startDateTime"
          fullWidth
          type="datetime-local"
          label="Start Date/Time"
          value={moment(get(encounter, 'period.start', '')).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => onChange('period.start', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="endDateTime"
          fullWidth
          type="datetime-local"
          label="End Date/Time"
          value={moment(get(encounter, 'period.end', '')).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => onChange('period.end', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Notes</Typography>

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(encounter, 'note[0].text', '')}
        onChange={(e) => onChange('note[0].text', e.target.value)}
        helperText="Additional notes about the encounter"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default EncounterFormView;
