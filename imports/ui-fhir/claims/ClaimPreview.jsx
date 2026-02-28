// imports/ui-fhir/claims/ClaimPreview.jsx

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

const clinicalStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'recurrence', label: 'Recurrence' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'remission', label: 'Remission' },
  { value: 'resolved', label: 'Resolved' }
];

const verificationStatusOptions = [
  { value: 'provisional', label: 'Provisional' },
  { value: 'differential', label: 'Differential' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'refuted', label: 'Refuted' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

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

function ClaimPreview({ resource, resourceId, embedded }) {
  var claim = resource || {};
  var isExistingRecord = !!resourceId;

  var snomedDisplay = get(claim, 'code.coding[0].display', '') || 'Unnamed Claim';
  var snomedCode = get(claim, 'code.coding[0].code', '');

  var clinicalStatusValue = get(claim, 'clinicalStatus', '');
  var clinicalStatusLabel = get(clinicalStatusOptions.find(function(opt) { return opt.value === clinicalStatusValue; }), 'label', clinicalStatusValue);
  var clinicalStatusColor = get(clinicalStatusColorMap, clinicalStatusValue, 'default');

  var verificationStatusValue = get(claim, 'verificationStatus', '');
  var verificationStatusLabel = get(verificationStatusOptions.find(function(opt) { return opt.value === verificationStatusValue; }), 'label', verificationStatusValue);
  var verificationStatusColor = get(verificationStatusColorMap, verificationStatusValue, 'default');

  var patientDisplay = get(claim, 'patient.display', '');
  var asserterDisplay = get(claim, 'asserter.display', '');

  var onsetDateTime = get(claim, 'onsetDateTime', '');
  var formattedOnset = onsetDateTime ? moment(onsetDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  var evidenceDisplay = get(claim, 'evidence[0].detail[0].display', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Code display + status chips */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {snomedDisplay}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {clinicalStatusLabel && (
            <Chip label={clinicalStatusLabel} color={clinicalStatusColor} size="small" />
          )}
          {verificationStatusLabel && (
            <Chip label={verificationStatusLabel} color={verificationStatusColor} size="small" variant="outlined" />
          )}
        </Box>
      </Box>

      {snomedCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          SNOMED Code: {snomedCode}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Onset right */}
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
          {formattedOnset && (
            <>
              <Typography variant="overline" color="text.secondary">
                Onset Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedOnset}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Asserter */}
      {asserterDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Asserter
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {asserterDisplay}
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
              Evidence
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
            Claim ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ClaimPreview;
