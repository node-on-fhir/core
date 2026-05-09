// imports/ui-fhir/artifactAssessments/ArtifactAssessmentPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const clinicalStatusColorMap = {
  'active': 'error',
  'recurrence': 'warning',
  'inactive': 'default',
  'remission': 'info',
  'resolved': 'success'
};

const verificationStatusColorMap = {
  'provisional': 'warning',
  'differential': 'warning',
  'confirmed': 'success',
  'refuted': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

function ArtifactAssessmentPreview({ resource, resourceId, embedded }){
  const snomedCode = get(resource, 'code.coding.0.code', '');
  const snomedDisplay = get(resource, 'code.coding.0.display', '');
  const clinicalStatus = get(resource, 'clinicalStatus', '');
  const verificationStatus = get(resource, 'verificationStatus', '');
  const patientDisplay = get(resource, 'patient.display', '');
  const patientReference = get(resource, 'patient.reference', '');
  const asserterDisplay = get(resource, 'asserter.display', '');
  const onsetDateTime = get(resource, 'onsetDateTime', '');

  // Build subtitle from code
  let subtitleParts = [];
  if (snomedCode) {
    subtitleParts.push('SNOMED ' + snomedCode);
  }
  if (snomedDisplay) {
    subtitleParts.push(snomedDisplay);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const formattedOnset = onsetDateTime ? moment(onsetDateTime).format('MMMM D, YYYY [at] h:mm A') : '';
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
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {patientDisplay || 'Unspecified'}
          </Typography>
          {patientReference && (
            <Typography variant="caption" color="text.secondary">
              {patientReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Asserter
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {asserterDisplay || 'Unspecified'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1 }}>
        {clinicalStatus && (
          <Chip
            label={'Clinical: ' + clinicalStatus}
            color={get(clinicalStatusColorMap, clinicalStatus, 'default')}
            size="small"
          />
        )}
        {verificationStatus && (
          <Chip
            label={'Verification: ' + verificationStatus}
            color={get(verificationStatusColorMap, verificationStatus, 'default')}
            size="small"
          />
        )}
      </Box>

      <Divider />

      {/* Onset */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Onset Date/Time
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {formattedOnset || 'No onset date recorded.'}
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

export default ArtifactAssessmentPreview;
