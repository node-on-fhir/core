// imports/ui-fhir/serviceRequests/ServiceRequestFormView.jsx

import React from 'react';

import {
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  InputAdornment,
  Tooltip,
  FormControlLabel,
  Switch
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'directive', label: 'Directive' },
  { value: 'order', label: 'Order' },
  { value: 'original-order', label: 'Original Order' },
  { value: 'reflex-order', label: 'Reflex Order' },
  { value: 'filler-order', label: 'Filler Order' },
  { value: 'instance-order', label: 'Instance Order' },
  { value: 'option', label: 'Option' }
];

const priorityOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'asap', label: 'ASAP' },
  { value: 'stat', label: 'STAT' }
];

function ServiceRequestFormView({ resource, isEditing, onChange, isEmbedded }) {

  function handleSearchUser() {
    console.log('[ServiceRequestFormView] Search for patient clicked'); // phi-audit: ok
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Patient</Typography>

      {/* Patient Field */}
      <TextField
        id="subjectDisplay"
        fullWidth
        label="Patient"
        value={get(resource, 'subject.display', '')}
        onChange={function(e) { onChange('subject.display', e.target.value); }}
        helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
        disabled={!isEditing}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton
                  onClick={handleSearchUser}
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

      <Divider />
      <Typography variant="h6">Service Details</Typography>

      {/* Service Code + Display */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="codeCode"
          fullWidth
          label="Service Code"
          value={get(resource, 'code.coding[0].code', '')}
          onChange={function(e) { onChange('code.coding[0].code', e.target.value); }}
          helperText="SNOMED CT code"
          disabled={!isEditing}
        />
        <TextField
          id="codeDisplay"
          fullWidth
          label="Service Description"
          value={get(resource, 'code.coding[0].display', '')}
          onChange={function(e) {
            onChange('code.coding[0].display', e.target.value);
            onChange('code.text', e.target.value);
          }}
          helperText="Human-readable description"
          disabled={!isEditing}
        />
      </Stack>

      {/* Category */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="categoryCode"
          fullWidth
          label="Category Code"
          value={get(resource, 'category[0].coding[0].code', '')}
          onChange={function(e) { onChange('category[0].coding[0].code', e.target.value); }}
          helperText="SNOMED CT code for category"
          disabled={!isEditing}
        />
        <TextField
          id="categoryDisplay"
          fullWidth
          label="Category Description"
          value={get(resource, 'category[0].coding[0].display', '')}
          onChange={function(e) {
            onChange('category[0].coding[0].display', e.target.value);
            onChange('category[0].text', e.target.value);
          }}
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Status & Intent</Typography>

      {/* Status, Intent, Priority */}
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            id="statusSelect"
            value={get(resource, 'status', 'active')}
            label="Status"
            onChange={function(e) { onChange('status', e.target.value); }}
          >
            {statusOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="intent-label">Intent</InputLabel>
          <Select
            labelId="intent-label"
            id="intentSelect"
            value={get(resource, 'intent', 'order')}
            label="Intent"
            onChange={function(e) { onChange('intent', e.target.value); }}
          >
            {intentOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel id="priority-label">Priority</InputLabel>
          <Select
            labelId="priority-label"
            id="prioritySelect"
            value={get(resource, 'priority', 'routine')}
            label="Priority"
            onChange={function(e) { onChange('priority', e.target.value); }}
          >
            {priorityOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      {/* Do Not Perform + As Needed */}
      <Stack direction="row" spacing={4}>
        <FormControlLabel
          control={
            <Switch
              checked={get(resource, 'doNotPerform', false)}
              onChange={function(e) { onChange('doNotPerform', e.target.checked); }}
              disabled={!isEditing}
            />
          }
          label="Do Not Perform"
        />
        <FormControlLabel
          control={
            <Switch
              checked={get(resource, 'asNeededBoolean', false)}
              onChange={function(e) { onChange('asNeededBoolean', e.target.checked); }}
              disabled={!isEditing}
            />
          }
          label="As Needed"
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Scheduling</Typography>

      {/* Occurrence DateTime + Authored On */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="occurrenceDateTime"
          fullWidth
          type="datetime-local"
          label="Occurrence Date/Time"
          value={moment(get(resource, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
          onChange={function(e) { onChange('occurrenceDateTime', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
        <TextField
          id="authoredOn"
          fullWidth
          type="datetime-local"
          label="Authored On"
          value={moment(get(resource, 'authoredOn', '')).format('YYYY-MM-DDTHH:mm')}
          onChange={function(e) { onChange('authoredOn', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">People</Typography>

      {/* Requester */}
      <TextField
        id="requesterDisplay"
        fullWidth
        label="Requester"
        value={get(resource, 'requester.display', '')}
        onChange={function(e) { onChange('requester.display', e.target.value); }}
        helperText={get(resource, 'requester.reference', '')}
        disabled={!isEditing}
      />

      {/* Performer + Location */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="performerDisplay"
          fullWidth
          label="Performer"
          value={get(resource, 'performer[0].display', '')}
          onChange={function(e) { onChange('performer[0].display', e.target.value); }}
          helperText="Who should perform this service"
          disabled={!isEditing}
        />
        <TextField
          id="locationDisplay"
          fullWidth
          label="Location"
          value={get(resource, 'locationReference[0].display', '')}
          onChange={function(e) { onChange('locationReference[0].display', e.target.value); }}
          helperText="Where the service should be performed"
          disabled={!isEditing}
        />
      </Stack>

      <Divider />
      <Typography variant="h6">Clinical</Typography>

      {/* Reason Code */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="reasonCode"
          fullWidth
          label="Reason Code"
          value={get(resource, 'reasonCode[0].coding[0].code', '')}
          onChange={function(e) { onChange('reasonCode[0].coding[0].code', e.target.value); }}
          helperText="SNOMED CT code for the reason"
          disabled={!isEditing}
        />
        <TextField
          id="reasonDisplay"
          fullWidth
          label="Reason Description"
          value={get(resource, 'reasonCode[0].text', '')}
          onChange={function(e) {
            onChange('reasonCode[0].coding[0].display', e.target.value);
            onChange('reasonCode[0].text', e.target.value);
          }}
          helperText="Why this service is being requested"
          disabled={!isEditing}
        />
      </Stack>

      {/* Body Site */}
      <TextField
        id="bodySite"
        fullWidth
        label="Body Site"
        value={get(resource, 'bodySite[0].text', '')}
        onChange={function(e) { onChange('bodySite[0].text', e.target.value); }}
        helperText="Anatomical location for the service"
        disabled={!isEditing}
      />

      <Divider />
      <Typography variant="h6">Instructions & Notes</Typography>

      {/* Patient Instructions */}
      <TextField
        id="patientInstruction"
        fullWidth
        multiline
        rows={2}
        label="Patient Instructions"
        value={get(resource, 'patientInstruction', '')}
        onChange={function(e) { onChange('patientInstruction', e.target.value); }}
        helperText="Instructions for the patient"
        disabled={!isEditing}
      />

      {/* Notes */}
      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(resource, 'note[0].text', '')}
        onChange={function(e) { onChange('note[0].text', e.target.value); }}
        helperText="Additional notes about the service request"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default ServiceRequestFormView;
