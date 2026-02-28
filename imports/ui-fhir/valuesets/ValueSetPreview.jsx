// imports/ui-fhir/valuesets/ValueSetPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

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

function ValueSetPreview({ resource, resourceId, embedded }) {
  var valueSet = resource || {};
  var isExistingRecord = !!resourceId;

  var title = get(valueSet, 'title', '') || get(valueSet, 'name', 'Unnamed Value Set');
  var name = get(valueSet, 'name', '');
  var version = get(valueSet, 'version', '');
  var statusValue = get(valueSet, 'status', 'unknown');
  var statusColor = get(statusColorMap, statusValue, 'default');

  var publisher = get(valueSet, 'publisher', '');
  var url = get(valueSet, 'url', '');
  var description = get(valueSet, 'description', '');
  var copyright = get(valueSet, 'copyright', '');

  var dateValue = get(valueSet, 'date', '');
  var formattedDate = dateValue ? moment(dateValue).format('YYYY-MM-DD') : '';

  var composeIncludes = get(valueSet, 'compose.include', []);

  // Render compose includes as tables
  function renderComposeIncludes() {
    if (!Array.isArray(composeIncludes) || composeIncludes.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No concepts defined.
        </Typography>
      );
    }

    return composeIncludes.map(function(includeSystem, systemIndex) {
      var system = get(includeSystem, 'system', '');
      var concepts = get(includeSystem, 'concept', []);

      return (
        <Box key={systemIndex} sx={{ mb: 3 }}>
          {system && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, wordBreak: 'break-all' }}>
              System: {system}
            </Typography>
          )}

          {Array.isArray(concepts) && concepts.length > 0 && (
            <Table size="small" sx={{ border: 1, borderColor: 'divider' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 600, width: '30%' }}>Code</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Display</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {concepts.map(function(concept, conceptIndex) {
                  return (
                    <TableRow key={conceptIndex}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {get(concept, 'code', '')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {get(concept, 'display', '')}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {(!Array.isArray(concepts) || concepts.length === 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              All codes from this system are included.
            </Typography>
          )}
        </Box>
      );
    });
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
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

      {/* Status + Date row */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Status
          </Typography>
          <Chip label={statusValue} color={statusColor} size="small" />
        </Box>
        {formattedDate && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedDate}
            </Typography>
          </Box>
        )}
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
            minHeight: '60px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Copyright */}
      {copyright && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Copyright
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {copyright}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Compose (Included Systems and Concepts) */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          Included Concepts
        </Typography>
        {renderComposeIncludes()}
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            ValueSet ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ValueSetPreview;
