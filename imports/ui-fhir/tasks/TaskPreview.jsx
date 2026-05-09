// /imports/ui-fhir/tasks/TaskPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusColorMap = {
  'draft': 'default',
  'requested': 'info',
  'received': 'info',
  'accepted': 'info',
  'rejected': 'error',
  'ready': 'info',
  'cancelled': 'error',
  'in-progress': 'warning',
  'on-hold': 'warning',
  'failed': 'error',
  'completed': 'success',
  'entered-in-error': 'error'
};

const priorityColorMap = {
  'routine': 'default',
  'urgent': 'warning',
  'asap': 'warning',
  'stat': 'error'
};

const priorityLabelMap = {
  'routine': 'Routine',
  'urgent': 'Urgent',
  'asap': 'ASAP',
  'stat': 'Stat'
};

function TaskPreview({ resource, resourceId, embedded }){
  const status = get(resource, 'status', '');
  const statusColor = get(statusColorMap, status, 'default');

  const intent = get(resource, 'intent', '');
  const priority = get(resource, 'priority', '');
  const priorityLabel = get(priorityLabelMap, priority, priority);
  const priorityColor = get(priorityColorMap, priority, 'default');

  const codeDisplay = get(resource, 'code.text', '') || get(resource, 'code.coding[0].display', '');
  const codeCode = get(resource, 'code.coding[0].code', '');
  const description = get(resource, 'description', '');

  const forDisplay = get(resource, 'for.display', '');
  const forReference = get(resource, 'for.reference', '');
  const requesterDisplay = get(resource, 'requester.display', '');
  const ownerDisplay = get(resource, 'owner.display', '');

  const authoredOn = get(resource, 'authoredOn', '');
  const formattedAuthoredOn = authoredOn ? moment(authoredOn).format('MMMM D, YYYY [at] h:mm A') : '';

  const lastModified = get(resource, 'lastModified', '');
  const formattedLastModified = lastModified ? moment(lastModified).format('MMMM D, YYYY [at] h:mm A') : '';

  const executionStart = get(resource, 'executionPeriod.start', '');
  const formattedExecStart = executionStart ? moment(executionStart).format('MMMM D, YYYY [at] h:mm A') : '';
  const executionEnd = get(resource, 'executionPeriod.end', '');
  const formattedExecEnd = executionEnd ? moment(executionEnd).format('MMMM D, YYYY [at] h:mm A') : '';

  const businessStatusText = get(resource, 'businessStatus.text', '') || get(resource, 'businessStatus.coding[0].display', '');
  const notes = get(resource, 'note[0].text', '');

  // Build subtitle from code
  let subtitleParts = [];
  if (codeDisplay) {
    subtitleParts.push(codeDisplay);
  } else if (codeCode) {
    subtitleParts.push('Code: ' + codeCode);
  }
  if (intent) {
    subtitleParts.push(intent);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingTask = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient and Authored On */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {forDisplay || 'Unspecified'}
          </Typography>
          {forReference && (
            <Typography variant="caption" color="text.secondary">
              {forReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Authored On
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedAuthoredOn || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status and Priority */}
      <Box sx={{ py: 2, display: 'flex', gap: 1 }}>
        <Chip label={status} color={statusColor} size="small" />
        {priority && (
          <Chip label={priorityLabel} color={priorityColor} size="small" variant="outlined" />
        )}
        {businessStatusText && (
          <Chip label={businessStatusText} size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Requester and Owner */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Requester
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {requesterDisplay || 'Not specified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Owner
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {ownerDisplay || 'Not specified'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Execution Period */}
      {(formattedExecStart || formattedExecEnd) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Execution Start
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedExecStart || 'Not set'}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="overline" color="text.secondary">
                Execution End
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedExecEnd || 'Not set'}
              </Typography>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Last Modified */}
      {formattedLastModified && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Last Modified
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedLastModified}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Description */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Description
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Notes */}
      {notes && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notes
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}
            >
              {notes}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with task ID */}
      {isExistingTask && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Task ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default TaskPreview;
