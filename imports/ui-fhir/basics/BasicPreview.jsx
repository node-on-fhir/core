// imports/ui-fhir/basics/BasicPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'draft': 'warning',
  'unknown': 'default'
};

function BasicPreview({ resource, resourceId, embedded }){
  const title = get(resource, 'title', '');
  const publisher = get(resource, 'publisher', '');
  const version = get(resource, 'version', '');
  const identifier = get(resource, 'identifier.0.value', '');
  const status = get(resource, 'status', '');
  const description = get(resource, 'description', '');

  // Build subtitle from version and identifier
  let subtitleParts = [];
  if (version) {
    subtitleParts.push('v' + version);
  }
  if (identifier) {
    subtitleParts.push(identifier);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExisting = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title as heading */}
      {title && (
        <Typography variant="h5" sx={{ mb: 1 }}>
          {title}
        </Typography>
      )}

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
            Publisher
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {publisher || 'Unspecified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Version
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {version || 'N/A'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        {status && (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={get(statusColorMap, status, 'default')}
            size="small"
          />
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
            minHeight: '200px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {isExisting && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Resource ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default BasicPreview;
