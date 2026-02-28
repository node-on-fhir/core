// imports/ui-fhir/auditEvents/AuditEventPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const actionLabelMap = {
  'C': 'Create',
  'R': 'Read',
  'U': 'Update',
  'D': 'Delete',
  'E': 'Execute'
};

const outcomeLabelMap = {
  '0': 'Success',
  '4': 'Minor Failure',
  '8': 'Serious Failure',
  '12': 'Major Failure'
};

const outcomeColorMap = {
  '0': 'success',
  '4': 'warning',
  '8': 'error',
  '12': 'error'
};

function AuditEventPreview({ resource, resourceId, embedded }){
  const typeCode = get(resource, 'type.code', '');
  const typeDisplay = get(resource, 'type.display', '');
  const action = get(resource, 'action', '');
  const outcome = get(resource, 'outcome', '');
  const outcomeDesc = get(resource, 'outcomeDesc', '');
  const recorded = get(resource, 'recorded', '');
  const agentWho = get(resource, 'agent.0.who.display', '');
  const sourceObserver = get(resource, 'source.observer.display', '');
  const sourceSite = get(resource, 'source.site', '');
  const entityReference = get(resource, 'entity.0.what.reference', '');
  const entityDisplay = get(resource, 'entity.0.what.display', '');

  // Build subtitle
  let subtitleParts = [];
  if (typeCode) {
    subtitleParts.push(typeCode);
  }
  if (typeDisplay) {
    subtitleParts.push(typeDisplay);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const formattedRecorded = recorded ? moment(recorded).format('MMMM D, YYYY [at] h:mm A') : '';
  const actionLabel = get(actionLabelMap, action, action);
  const outcomeLabel = get(outcomeLabelMap, outcome, outcome);
  const outcomeColor = get(outcomeColorMap, outcome, 'default');
  const isExisting = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Agent
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {agentWho || 'Unknown'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Recorded
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedRecorded || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1 }}>
        {action && (
          <Chip label={'Action: ' + actionLabel} color="info" size="small" />
        )}
        {outcome && (
          <Chip label={'Outcome: ' + outcomeLabel} color={outcomeColor} size="small" />
        )}
      </Box>

      <Divider />

      {/* Outcome Description */}
      {outcomeDesc && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Outcome Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {outcomeDesc}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Source */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Source
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {sourceObserver || 'Unknown observer'}
        </Typography>
        {sourceSite && (
          <Typography variant="body2" color="text.secondary">
            Site: {sourceSite}
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Entity */}
      {(entityReference || entityDisplay) && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Entity
            </Typography>
            {entityDisplay && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {entityDisplay}
              </Typography>
            )}
            {entityReference && (
              <Typography variant="body2" color="text.secondary">
                {entityReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {isExisting && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Audit Event ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AuditEventPreview;
