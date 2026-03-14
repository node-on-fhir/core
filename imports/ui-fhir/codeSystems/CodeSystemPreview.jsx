// imports/ui-fhir/codeSystems/CodeSystemPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const statusColorMap = {
  'draft': 'warning',
  'active': 'success',
  'retired': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function CodeSystemPreview({ resource, resourceId, embedded }) {
  var codeSystem = resource || {};
  var isExistingRecord = !!resourceId;

  var title = get(codeSystem, 'title', '') || get(codeSystem, 'name', 'Unnamed Code System');
  var name = get(codeSystem, 'name', '');
  var version = get(codeSystem, 'version', '');
  var statusValue = get(codeSystem, 'status', 'unknown');
  var statusColor = get(statusColorMap, statusValue, 'default');

  var publisher = get(codeSystem, 'publisher', '');
  var url = get(codeSystem, 'url', '');
  var content = get(codeSystem, 'content', '');
  var description = get(codeSystem, 'description', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + subtitle */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        {title}
      </Typography>

      {version && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          Version {version}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Name left, Publisher right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {name && (
            <>
              <Typography variant="overline" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {name}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {publisher && (
            <>
              <Typography variant="overline" color="text.secondary">
                Publisher
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {publisher}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Status
        </Typography>
        <Chip label={statusValue} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* URL */}
      {url && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              URL
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
              {url}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Content */}
      {content && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Content
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {content}
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

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            CodeSystem ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CodeSystemPreview;
