// /imports/ui-fhir/tasks/TaskFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box
} from '@mui/material';

import { get } from 'lodash';

const statusOptions = [
  'draft', 'requested', 'received', 'accepted', 'rejected',
  'ready', 'cancelled', 'in-progress', 'on-hold', 'failed',
  'completed', 'entered-in-error'
];

const priorityOptions = ['routine', 'urgent', 'asap', 'stat'];

const intentOptions = [
  'unknown', 'proposal', 'plan', 'order', 'original-order',
  'reflex-order', 'filler-order', 'instance-order', 'option'
];

function TaskFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <>
      <TextField
        id="forDisplay"
        fullWidth
        label="Patient"
        value={get(form, 'forDisplay', '')}
        disabled
        margin="normal"
        helperText={get(resource, 'for.reference', '') || 'Patient reference will be assigned'}
      />

      <TextField
        id="requesterDisplay"
        fullWidth
        label="Requester"
        value={get(form, 'requesterDisplay', '')}
        onChange={(e) => onChange('requesterDisplay', e.target.value)}
        disabled={!isEditing}
        margin="normal"
      />

      <TextField
        id="ownerDisplay"
        fullWidth
        label="Owner"
        value={get(form, 'ownerDisplay', '')}
        onChange={(e) => onChange('ownerDisplay', e.target.value)}
        disabled={!isEditing}
        margin="normal"
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          id="codeCode"
          fullWidth
          label="Code"
          value={get(form, 'codeCode', '')}
          onChange={(e) => onChange('codeCode', e.target.value)}
          disabled={!isEditing}
          margin="normal"
        />
        <TextField
          id="codeDisplay"
          fullWidth
          label="Code Display"
          value={get(form, 'codeDisplay', '')}
          onChange={(e) => onChange('codeDisplay', e.target.value)}
          disabled={!isEditing}
          margin="normal"
        />
      </Box>

      <FormControl fullWidth margin="normal">
        <InputLabel id="status-label">Status</InputLabel>
        <Select
          labelId="status-label"
          id="status"
          value={get(form, 'status', 'requested')}
          onChange={(e) => onChange('status', e.target.value)}
          disabled={!isEditing}
          label="Status"
        >
          {statusOptions.map(function(option){
            return <MenuItem key={option} value={option}>{option}</MenuItem>;
          })}
        </Select>
      </FormControl>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="intent-label">Intent</InputLabel>
          <Select
            labelId="intent-label"
            id="intent"
            value={get(form, 'intent', 'order')}
            onChange={(e) => onChange('intent', e.target.value)}
            disabled={!isEditing}
            label="Intent"
          >
            {intentOptions.map(function(option){
              return <MenuItem key={option} value={option}>{option}</MenuItem>;
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth margin="normal">
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            id="priority"
            value={get(form, 'priority', 'routine')}
            onChange={(e) => onChange('priority', e.target.value)}
            disabled={!isEditing}
            label="Priority"
          >
            {priorityOptions.map(function(option){
              return <MenuItem key={option} value={option}>{option}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      <TextField
        id="description"
        fullWidth
        label="Description"
        value={get(form, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={3}
        margin="normal"
      />

      <TextField
        id="authoredOn"
        fullWidth
        label="Authored On"
        type="datetime-local"
        value={get(form, 'authoredOn', '')}
        onChange={(e) => onChange('authoredOn', e.target.value)}
        disabled={!isEditing}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        id="lastModified"
        fullWidth
        label="Last Modified"
        type="datetime-local"
        value={get(form, 'lastModified', '')}
        onChange={(e) => onChange('lastModified', e.target.value)}
        disabled={!isEditing}
        margin="normal"
        InputLabelProps={{ shrink: true }}
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          id="businessStatusCode"
          fullWidth
          label="Business Status Code"
          value={get(form, 'businessStatusCode', '')}
          onChange={(e) => onChange('businessStatusCode', e.target.value)}
          disabled={!isEditing}
          margin="normal"
        />
        <TextField
          id="businessStatusDisplay"
          fullWidth
          label="Business Status Display"
          value={get(form, 'businessStatusDisplay', '')}
          onChange={(e) => onChange('businessStatusDisplay', e.target.value)}
          disabled={!isEditing}
          margin="normal"
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          id="executionPeriodStart"
          fullWidth
          label="Execution Start"
          type="datetime-local"
          value={get(form, 'executionPeriodStart', '')}
          onChange={(e) => onChange('executionPeriodStart', e.target.value)}
          disabled={!isEditing}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          id="executionPeriodEnd"
          fullWidth
          label="Execution End"
          type="datetime-local"
          value={get(form, 'executionPeriodEnd', '')}
          onChange={(e) => onChange('executionPeriodEnd', e.target.value)}
          disabled={!isEditing}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <TextField
        id="notesTextarea"
        fullWidth
        label="Notes"
        value={get(form, 'notes', '')}
        onChange={(e) => onChange('notes', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={3}
        margin="normal"
      />
    </>
  );
}

export default TaskFormView;
