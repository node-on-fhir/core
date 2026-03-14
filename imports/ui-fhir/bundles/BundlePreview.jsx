// imports/ui-fhir/bundles/BundlePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

var typeColorMap = {
  'document': 'primary',
  'message': 'info',
  'transaction': 'warning',
  'transaction-response': 'warning',
  'batch': 'secondary',
  'batch-response': 'secondary',
  'history': 'default',
  'searchset': 'success',
  'collection': 'default'
};

function BundlePreview({ resource, form, resourceId, embedded }) {
  var bundle = resource || form || {};

  var bundleType = get(bundle, 'type', 'unknown');
  var typeColor = get(typeColorMap, bundleType, 'default');
  var identifier = get(bundle, 'identifier.value', '');
  var identifierSystem = get(bundle, 'identifier.system', '');
  var timestamp = get(bundle, 'timestamp', '');
  var total = get(bundle, 'total', '');
  var entries = get(bundle, 'entry', []);
  var entryCount = entries.length;

  var formattedTimestamp = timestamp ? moment(timestamp).format('MMMM D, YYYY HH:mm:ss') : '';

  var isExistingBundle = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + type chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Bundle
        </Typography>
        <Chip label={bundleType} color={typeColor} size="small" />
      </Box>

      {identifier && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {identifier}{identifierSystem ? ' (' + identifierSystem + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Type
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            {bundleType || 'Not specified'}
          </Typography>

          {total !== '' && (
            <>
              <Typography variant="overline" color="text.secondary">
                Total
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {total}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedTimestamp && (
            <>
              <Typography variant="overline" color="text.secondary">
                Timestamp
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedTimestamp}
              </Typography>
            </>
          )}
          <Typography variant="overline" color="text.secondary">
            Entry Count
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {entryCount}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Type chip section */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Bundle Type
        </Typography>
        <Box sx={{ mt: 0.5 }}>
          <Chip label={bundleType} color={typeColor} size="small" />
        </Box>
      </Box>

      <Divider />

      {/* Entries summary */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Entries
        </Typography>
        {entryCount > 0 ? (
          <Stack spacing={1}>
            {entries.slice(0, 20).map(function(entry, index) {
              var resourceType = get(entry, 'resource.resourceType', 'Unknown');
              var resourceId = get(entry, 'resource.id', '');
              var fullUrl = get(entry, 'fullUrl', '');
              return (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={resourceType} size="small" variant="outlined" />
                  <Typography variant="body2" color="text.secondary">
                    {resourceId || fullUrl || '(no id)'}
                  </Typography>
                </Box>
              );
            })}
            {entryCount > 20 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                ... and {entryCount - 20} more entries
              </Typography>
            )}
          </Stack>
        ) : (
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            No entries in this bundle.
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Footer with ID */}
      {isExistingBundle && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Bundle ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default BundlePreview;
