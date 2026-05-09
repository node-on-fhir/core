// imports/ui-fhir/evidences/EvidencePreview.jsx

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

const clinicalStatusColorMap = {
  'active': 'success',
  'recurrence': 'warning',
  'inactive': 'default',
  'remission': 'info',
  'resolved': 'success'
};

const verificationStatusColorMap = {
  'provisional': 'warning',
  'differential': 'info',
  'confirmed': 'success',
  'refuted': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function EvidencePreview({ resource, resourceId, embedded }) {
  var evidence = resource || {};
  var isExistingRecord = !!resourceId;

  var snomedDisplay = get(evidence, 'code.coding[0].display', '') || 'Unnamed Evidence';
  var snomedCode = get(evidence, 'code.coding[0].code', '');

  var clinicalStatus = get(evidence, 'clinicalStatus', '');
  var clinicalStatusColor = get(clinicalStatusColorMap, clinicalStatus, 'default');

  var verificationStatus = get(evidence, 'verificationStatus', '');
  var verificationStatusColor = get(verificationStatusColorMap, verificationStatus, 'default');

  var patientDisplay = get(evidence, 'patient.display', '');
  var asserterDisplay = get(evidence, 'asserter.display', '');

  var onsetDateTime = get(evidence, 'onsetDateTime', '');
  var formattedOnsetDate = onsetDateTime ? moment(onsetDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  var evidenceDisplay = get(evidence, 'evidence[0].detail[0].display', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
        {snomedDisplay}
      </Typography>

      {snomedCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          SNOMED Code: {snomedCode}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Asserter right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {patientDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patientDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {asserterDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Asserter
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {asserterDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {clinicalStatus && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Clinical Status
            </Typography>
            <Chip
              label={clinicalStatus.charAt(0).toUpperCase() + clinicalStatus.slice(1)}
              color={clinicalStatusColor}
              size="small"
            />
          </Box>
        )}
        {verificationStatus && (
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Verification Status
            </Typography>
            <Chip
              label={verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
              color={verificationStatusColor}
              size="small"
            />
          </Box>
        )}
      </Box>

      <Divider />

      {/* Onset Date */}
      {formattedOnsetDate && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Onset Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedOnsetDate}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Evidence */}
      {evidenceDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Supporting Evidence
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {evidenceDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Evidence ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EvidencePreview;
