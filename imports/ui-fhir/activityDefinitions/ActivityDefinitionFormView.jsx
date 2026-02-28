// /imports/ui-fhir/activityDefinitions/ActivityDefinitionFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack
} from '@mui/material';

import { get } from 'lodash';

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'unknown', label: 'Unknown' }
];

const kindOptions = [
  { value: '', label: 'None' },
  { value: 'ServiceRequest', label: 'Service Request' },
  { value: 'MedicationRequest', label: 'Medication Request' },
  { value: 'Task', label: 'Task' },
  { value: 'Appointment', label: 'Appointment' },
  { value: 'CommunicationRequest', label: 'Communication Request' },
  { value: 'DeviceRequest', label: 'Device Request' },
  { value: 'NutritionOrder', label: 'Nutrition Order' },
  { value: 'SupplyRequest', label: 'Supply Request' },
  { value: 'VisionPrescription', label: 'Vision Prescription' }
];

const intentOptions = [
  { value: '', label: 'None' },
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

function ActivityDefinitionFormView({ resource, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      {/* Identity Section */}
      <Typography variant="h6">Identity</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="nameInput"
          fullWidth
          label="Name (Computer-Friendly)"
          value={get(resource, 'name', '')}
          onChange={(e) => onChange('name', e.target.value)}
          helperText="A machine-friendly name for this activity definition"
          disabled={!isEditing}
        />

        <TextField
          id="titleInput"
          fullWidth
          label="Title (Human-Friendly)"
          value={get(resource, 'title', '')}
          onChange={(e) => onChange('title', e.target.value)}
          helperText="A human-friendly name for this activity definition"
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="statusSelect"
            value={get(resource, 'status', 'draft')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          id="versionInput"
          fullWidth
          label="Version"
          value={get(resource, 'version', '')}
          onChange={(e) => onChange('version', e.target.value)}
          helperText="Business version identifier"
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="descriptionInput"
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={get(resource, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        helperText="Natural language description of the activity definition"
        disabled={!isEditing}
      />

      {/* Activity Type Section */}
      <Typography variant="h6" sx={{ mt: 2 }}>Activity Type</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Kind</InputLabel>
          <Select
            id="kindSelect"
            value={get(resource, 'kind', '')}
            onChange={(e) => onChange('kind', e.target.value)}
            label="Kind"
          >
            {kindOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Intent</InputLabel>
          <Select
            id="intentSelect"
            value={get(resource, 'intent', '')}
            onChange={(e) => onChange('intent', e.target.value)}
            label="Intent"
          >
            {intentOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Priority</InputLabel>
          <Select
            id="prioritySelect"
            value={get(resource, 'priority', 'routine')}
            onChange={(e) => onChange('priority', e.target.value)}
            label="Priority"
          >
            {priorityOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {/* Publisher Section */}
      <Typography variant="h6" sx={{ mt: 2 }}>Publisher Information</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="publisherInput"
          fullWidth
          label="Publisher"
          value={get(resource, 'publisher', '')}
          onChange={(e) => onChange('publisher', e.target.value)}
          helperText="Name of the publisher (organization or individual)"
          disabled={!isEditing}
        />

        <TextField
          id="urlInput"
          fullWidth
          label="Canonical URL"
          value={get(resource, 'url', '')}
          onChange={(e) => onChange('url', e.target.value)}
          helperText="Canonical identifier for this activity definition"
          disabled={!isEditing}
        />
      </Stack>

      {/* Purpose and Usage */}
      <Typography variant="h6" sx={{ mt: 2 }}>Purpose and Usage</Typography>

      <TextField
        id="purposeInput"
        fullWidth
        multiline
        rows={2}
        label="Purpose"
        value={get(resource, 'purpose', '')}
        onChange={(e) => onChange('purpose', e.target.value)}
        helperText="Why this activity definition is defined"
        disabled={!isEditing}
      />

      <TextField
        id="usageInput"
        fullWidth
        multiline
        rows={2}
        label="Usage"
        value={get(resource, 'usage', '')}
        onChange={(e) => onChange('usage', e.target.value)}
        helperText="Describes the clinical usage of the activity definition"
        disabled={!isEditing}
      />

      {/* Dates */}
      <Typography variant="h6" sx={{ mt: 2 }}>Review Dates</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="approvalDateInput"
          fullWidth
          type="date"
          label="Approval Date"
          value={get(resource, 'approvalDate', '')}
          onChange={(e) => onChange('approvalDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="lastReviewDateInput"
          fullWidth
          type="date"
          label="Last Review Date"
          value={get(resource, 'lastReviewDate', '')}
          onChange={(e) => onChange('lastReviewDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        id="copyrightInput"
        fullWidth
        multiline
        rows={2}
        label="Copyright"
        value={get(resource, 'copyright', '')}
        onChange={(e) => onChange('copyright', e.target.value)}
        helperText="Use and/or publishing restrictions"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default ActivityDefinitionFormView;
