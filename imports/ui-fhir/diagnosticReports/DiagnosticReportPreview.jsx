// /imports/ui-fhir/diagnosticReports/DiagnosticReportPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'partial', label: 'Partial' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'appended', label: 'Appended' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'default',
  'partial': 'warning',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'appended': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

function DiagnosticReportPreview({ resource, form, resourceId, embedded }){
  // Derive display values from current form state (live preview of edits)
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const formattedDate = form.effectiveDateTime ? moment(form.effectiveDateTime).format('MMMM D, YYYY') : '';
  const subjectReference = get(resource, 'subject.reference', '');

  // Build subtitle from category and code
  let subtitleParts = [];
  if (form.category) {
    subtitleParts.push(form.category);
  }
  if (form.code) {
    subtitleParts.push('LOINC ' + form.code);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingReport = resourceId && resourceId !== 'new';

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
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.subject || 'Unspecified'}
          </Typography>
          {subjectReference && (
            <Typography variant="caption" color="text.secondary">
              {subjectReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Report Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedDate || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Conclusion */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Conclusion
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '200px'
          }}
        >
          {form.conclusion || 'No conclusion provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with report ID */}
      {isExistingReport && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Report ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DiagnosticReportPreview;
