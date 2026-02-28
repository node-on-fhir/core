// imports/ui-fhir/goals/GoalPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const lifecycleStatusColorMap = {
  'proposed': 'info',
  'planned': 'info',
  'accepted': 'info',
  'active': 'success',
  'on-hold': 'warning',
  'completed': 'success',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'rejected': 'error'
};

const achievementStatusColorMap = {
  'in-progress': 'info',
  'improving': 'success',
  'worsening': 'error',
  'no-change': 'default',
  'achieved': 'success',
  'sustaining': 'success',
  'not-achieved': 'error',
  'no-progress': 'warning',
  'not-attainable': 'error'
};

const priorityColorMap = {
  'high-priority': 'error',
  'medium-priority': 'warning',
  'low-priority': 'info'
};

//===========================================================================
// COMPONENT

function GoalPreview({ resource, resourceId, embedded }) {
  var goal = resource || {};
  var isExistingRecord = !!resourceId;

  var descriptionText = get(goal, 'description.text', 'Untitled Goal');

  var lifecycleStatus = get(goal, 'lifecycleStatus', '');
  var lifecycleStatusLabel = lifecycleStatus ? lifecycleStatus.charAt(0).toUpperCase() + lifecycleStatus.slice(1).replace(/-/g, ' ') : '';
  var lifecycleStatusColor = get(lifecycleStatusColorMap, lifecycleStatus, 'default');

  var achievementCode = get(goal, 'achievementStatus.coding[0].code', '');
  var achievementDisplay = get(goal, 'achievementStatus.coding[0].display', '') || achievementCode;
  var achievementColor = get(achievementStatusColorMap, achievementCode, 'default');

  var priorityCode = get(goal, 'priority.coding[0].code', '');
  var priorityDisplay = get(goal, 'priority.coding[0].display', '') || priorityCode;
  var priorityColor = get(priorityColorMap, priorityCode, 'default');

  var patientDisplay = get(goal, 'subject.display', '');
  var patientReference = get(goal, 'subject.reference', '');

  var expressedByDisplay = get(goal, 'expressedBy.display', '');
  var expressedByReference = get(goal, 'expressedBy.reference', '');

  var startDate = get(goal, 'startDate', '');
  var formattedStartDate = startDate ? moment(startDate).format('MMMM D, YYYY') : '';

  var targetDueDate = get(goal, 'target[0].dueDate', '');
  var formattedDueDate = targetDueDate ? moment(targetDueDate).format('MMMM D, YYYY') : '';

  var statusDate = get(goal, 'statusDate', '');
  var formattedStatusDate = statusDate ? moment(statusDate).format('MMMM D, YYYY') : '';

  var noteText = get(goal, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + lifecycle status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500, flex: 1, mr: 2 }}>
          {descriptionText}
        </Typography>
        {lifecycleStatusLabel && (
          <Chip label={lifecycleStatusLabel} color={lifecycleStatusColor} size="small" />
        )}
      </Box>

      {priorityDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Priority: {priorityDisplay}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Expressed By right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay || 'Unspecified'}
              </Typography>
              {patientReference && (
                <Typography variant="caption" color="text.secondary">
                  {patientReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(expressedByDisplay || expressedByReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Expressed By
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {expressedByDisplay || 'Unspecified'}
              </Typography>
              {expressedByReference && (
                <Typography variant="caption" color="text.secondary">
                  {expressedByReference}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chips: Achievement + Priority */}
      <Box sx={{ py: 2, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {achievementDisplay && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Achievement Status
            </Typography>
            <Chip label={achievementDisplay} color={achievementColor} size="small" />
          </Box>
        )}
        {priorityDisplay && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Priority
            </Typography>
            <Chip label={priorityDisplay} color={priorityColor} size="small" />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Dates */}
      <Box sx={{ py: 2, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {formattedStartDate && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Start Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedStartDate}
            </Typography>
          </Box>
        )}
        {formattedDueDate && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Target Due Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedDueDate}
            </Typography>
          </Box>
        )}
        {formattedStatusDate && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Status Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedStatusDate}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Notes */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Notes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {noteText || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Goal ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default GoalPreview;
