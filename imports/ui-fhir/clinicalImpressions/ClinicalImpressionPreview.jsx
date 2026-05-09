// imports/ui-fhir/clinicalImpressions/ClinicalImpressionPreview.jsx

import React from 'react';
import {
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const statusColorMap = {
  'in-progress': 'warning',
  'completed': 'success',
  'entered-in-error': 'error'
};

//===========================================================================
// COMPONENT

function ClinicalImpressionPreview({ resource, resourceId, embedded }) {
  var clinicalImpression = resource || {};
  var isExistingRecord = !!resourceId;

  var description = get(clinicalImpression, 'description', '') || 'No description provided';
  var summary = get(clinicalImpression, 'summary', '');

  var statusValue = get(clinicalImpression, 'status', 'in-progress');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(clinicalImpression, 'subject.display', '');
  var patientReference = get(clinicalImpression, 'subject.reference', '');

  var assessorDisplay = get(clinicalImpression, 'assessor.display', '');
  var assessorReference = get(clinicalImpression, 'assessor.reference', '');

  var dateValue = get(clinicalImpression, 'date', '');
  var formattedDate = dateValue ? moment(dateValue).format('MMMM D, YYYY') : '';

  var effectiveDateTime = get(clinicalImpression, 'effectiveDateTime', '');
  var formattedEffective = effectiveDateTime ? moment(effectiveDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Description + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Clinical Impression
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {formattedDate && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Date: {formattedDate}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Assessor right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay || 'Unspecified'}
              </Typography>
              {patientReference && (
                <Typography variant="caption" color="text.secondary">
                  {patientReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(assessorDisplay || assessorReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Assessor
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {assessorDisplay || 'Unspecified'}
              </Typography>
              {assessorReference && (
                <Typography variant="caption" color="text.secondary">
                  {assessorReference}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Effective DateTime */}
      {formattedEffective && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Effective Date/Time
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedEffective}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Description */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Description
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8
          }}
        >
          {description}
        </Typography>
      </Box>

      <Divider />

      {/* Summary */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Summary
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {summary || 'No summary provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            ClinicalImpression ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ClinicalImpressionPreview;
