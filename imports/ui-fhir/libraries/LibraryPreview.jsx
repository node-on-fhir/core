// imports/ui-fhir/libraries/LibraryPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// STATUS HELPERS

var clinicalStatusColorMap = {
  'active': 'error',
  'recurrence': 'warning',
  'inactive': 'default',
  'remission': 'info',
  'resolved': 'success'
};

var verificationStatusColorMap = {
  'provisional': 'warning',
  'differential': 'info',
  'confirmed': 'success',
  'refuted': 'default',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function LibraryPreview({ resource, resourceId, embedded }) {
  var library = resource || {};
  var isExistingRecord = !!resourceId;

  var snomedCode = get(library, 'code.coding[0].code', '');
  var snomedDisplay = get(library, 'code.coding[0].display', 'Unnamed Library');
  var clinicalStatus = get(library, 'clinicalStatus', '');
  var verificationStatus = get(library, 'verificationStatus', '');
  var patientDisplay = get(library, 'patient.display', '');
  var asserterDisplay = get(library, 'asserter.display', '');
  var onsetDateTime = get(library, 'onsetDateTime', '');

  var clinicalStatusColor = get(clinicalStatusColorMap, clinicalStatus, 'default');
  var verificationStatusColor = get(verificationStatusColorMap, verificationStatus, 'default');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {snomedDisplay || 'Unnamed Library'}
        </Typography>
      </Box>

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
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay}
              </Typography>
            </>
          )}
          {onsetDateTime && (
            <>
              <Typography variant="overline" color="text.secondary">
                Onset Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {onsetDateTime}
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

      {/* Status Chips */}
      {(clinicalStatus || verificationStatus) && (
        <>
          <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {clinicalStatus && (
              <Chip
                label={'Clinical: ' + clinicalStatus}
                color={clinicalStatusColor}
                size="small"
              />
            )}
            {verificationStatus && (
              <Chip
                label={'Verification: ' + verificationStatus}
                color={verificationStatusColor}
                size="small"
              />
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Content area */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Details
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {snomedDisplay ? snomedDisplay + (snomedCode ? ' (' + snomedCode + ')' : '') : 'No details provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Library ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default LibraryPreview;
