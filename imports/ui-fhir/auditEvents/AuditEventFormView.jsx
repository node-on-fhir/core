// imports/ui-fhir/auditEvents/AuditEventFormView.jsx

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

const actionOptions = [
  { value: 'C', label: 'Create (C)' },
  { value: 'R', label: 'Read (R)' },
  { value: 'U', label: 'Update (U)' },
  { value: 'D', label: 'Delete (D)' },
  { value: 'E', label: 'Execute (E)' }
];

const outcomeOptions = [
  { value: '0', label: 'Success (0)' },
  { value: '4', label: 'Minor Failure (4)' },
  { value: '8', label: 'Serious Failure (8)' },
  { value: '12', label: 'Major Failure (12)' }
];

function AuditEventFormView({ resource, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <Typography variant="h6" gutterBottom>Event Type</Typography>
      <Divider />

      <Stack direction="row" spacing={2}>
        <TextField
          id="typeCodeInput"
          fullWidth
          label="Type Code"
          value={get(resource, 'type.code', '')}
          onChange={(e) => onChange('type.code', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="typeDisplayInput"
          fullWidth
          label="Type Display"
          value={get(resource, 'type.display', '')}
          onChange={(e) => onChange('type.display', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="action-label">Action</InputLabel>
          <Select
            id="actionSelect"
            labelId="action-label"
            value={get(resource, 'action', '')}
            onChange={(e) => onChange('action', e.target.value)}
            label="Action"
          >
            {actionOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="outcome-label">Outcome</InputLabel>
          <Select
            id="outcomeSelect"
            labelId="outcome-label"
            value={get(resource, 'outcome', '')}
            onChange={(e) => onChange('outcome', e.target.value)}
            label="Outcome"
          >
            {outcomeOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <TextField
        id="outcomeDescInput"
        fullWidth
        label="Outcome Description"
        value={get(resource, 'outcomeDesc', '')}
        onChange={(e) => onChange('outcomeDesc', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={2}
      />

      <TextField
        id="recordedInput"
        fullWidth
        label="Recorded Date/Time"
        type="datetime-local"
        value={get(resource, 'recorded', '').substring(0, 16)}
        onChange={(e) => onChange('recorded', new Date(e.target.value).toISOString())}
        disabled={!isEditing}
        InputLabelProps={{ shrink: true }}
      />

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Agent</Typography>
      <Divider />

      <TextField
        id="agentWhoDisplayInput"
        fullWidth
        label="Agent (Who)"
        value={get(resource, 'agent.0.who.display', '')}
        onChange={(e) => onChange('agent.0.who.display', e.target.value)}
        disabled={!isEditing}
        helperText="The actor involved in the event"
      />

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Source</Typography>
      <Divider />

      <TextField
        id="sourceObserverDisplayInput"
        fullWidth
        label="Source Observer"
        value={get(resource, 'source.observer.display', '')}
        onChange={(e) => onChange('source.observer.display', e.target.value)}
        disabled={!isEditing}
        helperText="The system reporting the event"
      />

      <TextField
        id="sourceSiteInput"
        fullWidth
        label="Source Site"
        value={get(resource, 'source.site', '')}
        onChange={(e) => onChange('source.site', e.target.value)}
        disabled={!isEditing}
      />

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Entity</Typography>
      <Divider />

      <TextField
        id="entityWhatReferenceInput"
        fullWidth
        label="Entity Reference"
        value={get(resource, 'entity.0.what.reference', '')}
        onChange={(e) => onChange('entity.0.what.reference', e.target.value)}
        disabled={!isEditing}
        helperText="Reference to the data/object accessed (e.g., Patient/123)"
      />

      <TextField
        id="entityWhatDisplayInput"
        fullWidth
        label="Entity Display"
        value={get(resource, 'entity.0.what.display', '')}
        onChange={(e) => onChange('entity.0.what.display', e.target.value)}
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default AuditEventFormView;
