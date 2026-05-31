// imports/ui-fhir/operationOutcomes/OperationOutcomePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';

const severityColorMap = {
  'fatal': 'error',
  'error': 'error',
  'warning': 'warning',
  'information': 'info'
};

const severityLabels = {
  'fatal': 'Fatal',
  'error': 'Error',
  'warning': 'Warning',
  'information': 'Information'
};

const issueCodeLabels = {
  'invalid': 'Invalid Content',
  'structure': 'Structural Issue',
  'required': 'Required Element Missing',
  'value': 'Element Value Invalid',
  'invariant': 'Validation Rule Failed',
  'security': 'Security Problem',
  'login': 'Login Required',
  'unknown': 'Unknown User',
  'expired': 'Session Expired',
  'forbidden': 'Forbidden',
  'suppressed': 'Information Suppressed',
  'processing': 'Processing Failure',
  'not-supported': 'Content Not Supported',
  'duplicate': 'Duplicate',
  'not-found': 'Not Found',
  'too-long': 'Content Too Long',
  'code-invalid': 'Invalid Code',
  'extension': 'Unacceptable Extension',
  'too-costly': 'Operation Too Costly',
  'business-rule': 'Business Rule Violation',
  'conflict': 'Edit Version Conflict',
  'transient': 'Transient Issue',
  'lock-error': 'Lock Error',
  'no-store': 'No Store Available',
  'exception': 'Exception',
  'timeout': 'Timeout',
  'throttled': 'Throttled',
  'informational': 'Informational Note'
};

function OperationOutcomePreview({ resource, resourceId, embedded }) {
  var operationOutcome = resource || {};

  var severity = get(operationOutcome, 'issue[0].severity', '');
  var severityLabel = get(severityLabels, severity, severity);
  var severityColor = get(severityColorMap, severity, 'default');

  var issueCode = get(operationOutcome, 'issue[0].code', '');
  var issueCodeLabel = get(issueCodeLabels, issueCode, issueCode);

  var diagnostics = get(operationOutcome, 'issue[0].diagnostics', '');
  var detailsText = get(operationOutcome, 'issue[0].details.text', '');
  var detailsCode = get(operationOutcome, 'issue[0].details.coding[0].code', '');
  var detailsDisplay = get(operationOutcome, 'issue[0].details.coding[0].display', '');

  var expression = get(operationOutcome, 'issue[0].expression[0]', '');
  var location = get(operationOutcome, 'issue[0].location[0]', '');

  var issueCount = get(operationOutcome, 'issue', []).length;

  var isExistingOutcome = resourceId && resourceId !== 'new';

  // Build a subtitle from the issue code
  var subtitle = issueCodeLabel || 'Unknown Issue';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + severity chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          OperationOutcome
        </Typography>
        {severity && (
          <Chip label={severityLabel} color={severityColor} size="small" />
        )}
      </Box>

      {/* Subtitle: issue code label */}
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
        {subtitle}{issueCount > 1 ? ' (+' + (issueCount - 1) + ' more issues)' : ''}
      </Typography>

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {issueCode && (
            <>
              <Typography variant="overline" color="text.secondary">
                Issue Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {issueCode}
              </Typography>
            </>
          )}
          {detailsCode && (
            <>
              <Typography variant="overline" color="text.secondary">
                Details Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {detailsCode}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {severity && (
            <>
              <Typography variant="overline" color="text.secondary">
                Severity
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, textTransform: 'capitalize' }}>
                {severity}
              </Typography>
            </>
          )}
          {detailsDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Details
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {detailsDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip section */}
      {severity && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Severity
            </Typography>
            <Chip label={severityLabel} color={severityColor} size="small" />
          </Box>
          <Divider />
        </>
      )}

      {/* Diagnostics content */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Diagnostics
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px',
            fontFamily: diagnostics ? 'monospace' : 'inherit'
          }}
        >
          {diagnostics || 'No diagnostic information provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Details text */}
      {detailsText && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Details
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {detailsText}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Expression / Location */}
      {(expression || location) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {expression && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    FHIRPath Expression
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {expression}
                  </Typography>
                </Box>
              )}
              {location && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Location (XPath)
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {location}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with outcome ID */}
      {isExistingOutcome && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            OperationOutcome ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default OperationOutcomePreview;
