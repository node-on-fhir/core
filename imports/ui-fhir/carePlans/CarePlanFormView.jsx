// imports/ui-fhir/carePlans/CarePlanFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  IconButton,
  Stack,
  Box,
  Paper,
  Button,
  Grid,
  Divider
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';
import moment from 'moment';

var statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

var intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'order', label: 'Order' },
  { value: 'option', label: 'Option' }
];

function CarePlanFormView({
  resource,
  form,
  isEditing,
  onChange,
  isEmbedded,
  onSearchPatient,
  onActivityChange,
  onAddActivity,
  onRemoveActivity
}) {
  var carePlan = resource || form || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Care Plan Information</Typography>

      {/* Patient and Author */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={get(carePlan, 'subject.display', '')}
          onChange={(e) => onChange('subject.display', e.target.value)}
          helperText={get(carePlan, 'subject.reference', '') || 'Patient reference will be assigned'}
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
          id="authorDisplay"
          fullWidth
          label="Author"
          value={get(carePlan, 'author[0].display', '')}
          onChange={(e) => onChange('author[0].display', e.target.value)}
          helperText={get(carePlan, 'author[0].reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />
      </Stack>

      {/* Title */}
      <TextField
        id="title"
        fullWidth
        label="Title"
        value={get(carePlan, 'title', '')}
        onChange={(e) => onChange('title', e.target.value)}
        disabled={!isEditing}
      />

      {/* Status and Intent */}
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
            value={get(carePlan, 'status', 'active')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
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
          <InputLabel>Intent</InputLabel>
          <Select
            id="intent"
            value={get(carePlan, 'intent', 'plan')}
            onChange={(e) => onChange('intent', e.target.value)}
            label="Intent"
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
      </Stack>

      {/* Category Code and Display */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="categoryCode"
          fullWidth
          label="Category Code (SNOMED)"
          value={get(carePlan, 'category[0].coding[0].code', '')}
          onChange={(e) => onChange('category[0].coding[0].code', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="categoryDisplay"
          fullWidth
          label="Category Display"
          value={get(carePlan, 'category[0].coding[0].display', '')}
          onChange={(e) => onChange('category[0].coding[0].display', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      {/* Description */}
      <TextField
        id="description"
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={get(carePlan, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        disabled={!isEditing}
      />

      <Typography variant="h6">Period</Typography>

      {/* Start and End Dates */}
      <Stack direction="row" spacing={2}>
        <TextField
          id="periodStart"
          fullWidth
          type="date"
          label="Start Date"
          value={moment(get(carePlan, 'period.start', '')).format('YYYY-MM-DD')}
          onChange={(e) => onChange('period.start', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          id="periodEnd"
          fullWidth
          type="date"
          label="End Date"
          value={moment(get(carePlan, 'period.end', '')).format('YYYY-MM-DD')}
          onChange={(e) => onChange('period.end', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      {/* Notes */}
      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(carePlan, 'note[0].text', '')}
        onChange={(e) => onChange('note[0].text', e.target.value)}
        helperText="Additional notes about the care plan"
        disabled={!isEditing}
      />

      {/* Activities Section */}
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Activities</Typography>
        {isEditing && onAddActivity && (
          <Button
            startIcon={<AddIcon />}
            onClick={onAddActivity}
            variant="outlined"
            size="small"
          >
            Add Activity
          </Button>
        )}
      </Box>

      {(!carePlan.activity || carePlan.activity.length === 0) ? (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No activities defined yet. {isEditing ? 'Click "Add Activity" to create one.' : ''}
        </Typography>
      ) : (
        <Stack spacing={2}>
          {carePlan.activity.map(function(activity, index) {
            return (
              <Paper key={index} sx={{ p: 2 }} variant="outlined">
                <Grid container spacing={2}>
                  {/* Activity Header with Remove Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        Activity {index + 1}
                      </Typography>
                      {isEditing && onRemoveActivity && (
                        <IconButton
                          size="small"
                          onClick={() => onRemoveActivity(index)}
                          color="error"
                          aria-label="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  {/* Description */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={get(activity, 'detail.description', '')}
                      onChange={(e) => onActivityChange(index, 'detail.description', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  {/* Code and Display */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="SNOMED Code"
                      value={get(activity, 'detail.code.coding[0].code', '')}
                      onChange={(e) => onActivityChange(index, 'detail.code.coding[0].code', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Code Display"
                      value={get(activity, 'detail.code.coding[0].display', '')}
                      onChange={(e) => onActivityChange(index, 'detail.code.coding[0].display', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  {/* Status */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={get(activity, 'detail.status', 'not-started')}
                        onChange={(e) => onActivityChange(index, 'detail.status', e.target.value)}
                        label="Status"
                        disabled={!isEditing}
                      >
                        <MenuItem value="not-started">Not Started</MenuItem>
                        <MenuItem value="scheduled">Scheduled</MenuItem>
                        <MenuItem value="in-progress">In Progress</MenuItem>
                        <MenuItem value="on-hold">On Hold</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                        <MenuItem value="stopped">Stopped</MenuItem>
                        <MenuItem value="unknown">Unknown</MenuItem>
                        <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Kind */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Kind</InputLabel>
                      <Select
                        value={get(activity, 'detail.kind', 'Task')}
                        onChange={(e) => onActivityChange(index, 'detail.kind', e.target.value)}
                        label="Kind"
                        disabled={!isEditing}
                      >
                        <MenuItem value="Appointment">Appointment</MenuItem>
                        <MenuItem value="CommunicationRequest">Communication Request</MenuItem>
                        <MenuItem value="DeviceRequest">Device Request</MenuItem>
                        <MenuItem value="MedicationRequest">Medication Request</MenuItem>
                        <MenuItem value="NutritionOrder">Nutrition Order</MenuItem>
                        <MenuItem value="Task">Task</MenuItem>
                        <MenuItem value="ServiceRequest">Service Request</MenuItem>
                        <MenuItem value="VisionPrescription">Vision Prescription</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Reason Reference */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Reason Reference"
                      value={get(activity, 'detail.reasonReference[0].reference', '')}
                      onChange={(e) => onActivityChange(index, 'detail.reasonReference[0].reference', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                      helperText="e.g., Condition/123"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Reason Display"
                      value={get(activity, 'detail.reasonReference[0].display', '')}
                      onChange={(e) => onActivityChange(index, 'detail.reasonReference[0].display', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>

                  {/* Location */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location Reference"
                      value={get(activity, 'detail.location.reference', '')}
                      onChange={(e) => onActivityChange(index, 'detail.location.reference', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                      helperText="e.g., Location/456"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location Display"
                      value={get(activity, 'detail.location.display', '')}
                      onChange={(e) => onActivityChange(index, 'detail.location.display', e.target.value)}
                      disabled={!isEditing}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}

export default CarePlanFormView;
