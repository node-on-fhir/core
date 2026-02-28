// /imports/ui-fhir/activityDefinitions/ActivityDefinitionPreview.jsx

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
  'draft': 'warning',
  'active': 'success',
  'retired': 'default',
  'unknown': 'default'
};

const priorityColorMap = {
  'routine': 'default',
  'urgent': 'warning',
  'asap': 'warning',
  'stat': 'error'
};

function ActivityDefinitionPreview({ resource, resourceId, embedded }){
  const status = get(resource, 'status', '');
  const statusColor = get(statusColorMap, status, 'default');
  const priority = get(resource, 'priority', '');
  const priorityColor = get(priorityColorMap, priority, 'default');

  // Build subtitle from kind and intent
  let subtitleParts = [];
  if (get(resource, 'kind')) {
    subtitleParts.push(get(resource, 'kind'));
  }
  if (get(resource, 'intent')) {
    subtitleParts.push(get(resource, 'intent'));
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExisting = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Subtitle */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Name / Title and Version */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Title
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'title', '') || 'Untitled'}
          </Typography>
          {get(resource, 'name') && (
            <Typography variant="caption" color="text.secondary">
              Name: {get(resource, 'name')}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Version
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'version', '') || 'No version'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status and Priority chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {status && (
          <Chip label={'Status: ' + status} color={statusColor} size="small" />
        )}
        {priority && (
          <Chip label={'Priority: ' + priority} color={priorityColor} size="small" />
        )}
      </Box>

      <Divider />

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
            minHeight: '80px'
          }}
        >
          {get(resource, 'description', '') || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Publisher Information */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Publisher
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'publisher', '') || 'Unspecified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Canonical URL
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
            {get(resource, 'url', '') || 'None'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Purpose */}
      {get(resource, 'purpose') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Purpose
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'purpose')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Usage */}
      {get(resource, 'usage') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Usage
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'usage')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Review Dates */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Approval Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'approvalDate') ? moment(get(resource, 'approvalDate')).format('MMMM D, YYYY') : 'Not set'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Last Review Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'lastReviewDate') ? moment(get(resource, 'lastReviewDate')).format('MMMM D, YYYY') : 'Not set'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Copyright */}
      {get(resource, 'copyright') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Copyright
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'copyright')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with ID */}
      {isExisting && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Activity Definition ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ActivityDefinitionPreview;
