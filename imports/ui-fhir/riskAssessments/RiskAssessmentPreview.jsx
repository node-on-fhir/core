// imports/ui-fhir/riskAssessments/RiskAssessmentPreview.jsx

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
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'default',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

function RiskAssessmentPreview({ resource, form, resourceId, embedded }){
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const formattedDate = form.date ? moment(form.date).format('MMMM D, YYYY') : '';
  const subjectReference = get(resource, 'subject.reference', '');
  const formattedOccurrence = form.occurrenceDateTime ? moment(form.occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  // Build subtitle from assessment type and method
  let subtitleParts = [];
  if (form.codeText) {
    subtitleParts.push(form.codeText);
  }
  if (form.methodText) {
    subtitleParts.push(form.methodText);
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
            {form.subjectDisplay || 'Unspecified'}
          </Typography>
          {subjectReference && (
            <Typography variant="caption" color="text.secondary">
              {subjectReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Assessment Date
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedDate || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status and Performer */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
        {form.performerDisplay && (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="text.secondary">
              Performer
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {form.performerDisplay}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Occurrence */}
      {formattedOccurrence && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Occurrence
            </Typography>
            <Typography variant="body1">
              {formattedOccurrence}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Prediction */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Prediction
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {form.prediction || 'No prediction provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Mitigation */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Mitigation
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {form.mitigation || 'No mitigation provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {isExistingReport && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Risk Assessment ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default RiskAssessmentPreview;
