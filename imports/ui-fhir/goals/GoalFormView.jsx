// imports/ui-fhir/goals/GoalFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const lifecycleStatusOptions = [
  'proposed', 'planned', 'accepted', 'active', 'on-hold', 'completed', 'cancelled', 'entered-in-error', 'rejected'
];

const achievementStatusOptions = [
  { code: 'in-progress', display: 'In Progress' },
  { code: 'improving', display: 'Improving' },
  { code: 'worsening', display: 'Worsening' },
  { code: 'no-change', display: 'No Change' },
  { code: 'achieved', display: 'Achieved' },
  { code: 'sustaining', display: 'Sustaining' },
  { code: 'not-achieved', display: 'Not Achieved' },
  { code: 'no-progress', display: 'No Progress' },
  { code: 'not-attainable', display: 'Not Attainable' }
];

const priorityOptions = [
  { code: 'high-priority', display: 'High Priority' },
  { code: 'medium-priority', display: 'Medium Priority' },
  { code: 'low-priority', display: 'Low Priority' }
];

//===========================================================================
// COMPONENT

function GoalFormView({ resource, isEditing, onChange, isEmbedded }) {
  var goal = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Patient Name */}
        <TextField
          fullWidth
          label="Patient Name"
          value={get(goal, 'subject.display', '')}
          helperText={get(goal, 'subject.reference', '') || 'Patient reference will be assigned'}
          disabled
        />

        {/* Expressed By */}
        <TextField
          fullWidth
          label="Expressed By"
          value={get(goal, 'expressedBy.display', '')}
          onChange={function(e) { handleChange('expressedBy.display', e.target.value); }}
          helperText={get(goal, 'expressedBy.reference', '') || 'Practitioner reference will be assigned'}
          disabled={!isEditing}
        />

        {/* Goal Description */}
        <TextField
          fullWidth
          label="Goal Description"
          value={get(goal, 'description.text', '')}
          onChange={function(e) { handleChange('description.text', e.target.value); }}
          helperText="What is the patient trying to achieve?"
          multiline
          rows={3}
          disabled={!isEditing}
        />

        {/* Lifecycle Status */}
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Lifecycle Status</InputLabel>
          <Select
            value={get(goal, 'lifecycleStatus', 'proposed')}
            onChange={function(e) { handleChange('lifecycleStatus', e.target.value); }}
            label="Lifecycle Status"
          >
            {lifecycleStatusOptions.map(function(status) {
              return (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, ' ')}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Achievement Status */}
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Achievement Status</InputLabel>
          <Select
            value={get(goal, 'achievementStatus.coding[0].code', 'in-progress')}
            onChange={function(e) {
              var option = achievementStatusOptions.find(function(o) { return o.code === e.target.value; });
              handleChange('achievementStatus.coding[0].code', option.code);
              handleChange('achievementStatus.coding[0].display', option.display);
            }}
            label="Achievement Status"
          >
            {achievementStatusOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Priority */}
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={get(goal, 'priority.coding[0].code', 'medium-priority')}
            onChange={function(e) {
              var option = priorityOptions.find(function(o) { return o.code === e.target.value; });
              handleChange('priority.coding[0].code', option.code);
              handleChange('priority.coding[0].display', option.display);
            }}
            label="Priority"
          >
            {priorityOptions.map(function(option) {
              return (
                <MenuItem key={option.code} value={option.code}>
                  {option.display}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        {/* Start Date */}
        <TextField
          fullWidth
          type="date"
          label="Start Date"
          value={get(goal, 'startDate', '') ? moment(get(goal, 'startDate', '')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('startDate', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        {/* Target Due Date */}
        <TextField
          fullWidth
          type="date"
          label="Target Due Date"
          value={get(goal, 'target[0].dueDate', '') ? moment(get(goal, 'target[0].dueDate', '')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('target[0].dueDate', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        {/* Status Date */}
        <TextField
          fullWidth
          type="date"
          label="Status Date"
          value={get(goal, 'statusDate', '') ? moment(get(goal, 'statusDate', '')).format('YYYY-MM-DD') : ''}
          onChange={function(e) { handleChange('statusDate', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(goal, 'note[0].text', '')}
          onChange={function(e) { handleChange('note[0].text', e.target.value); }}
          helperText="Additional notes about this goal"
          disabled={!isEditing}
        />
      </Stack>
    </Box>
  );
}

export default GoalFormView;
