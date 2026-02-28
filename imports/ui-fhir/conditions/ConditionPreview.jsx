// imports/ui-fhir/conditions/ConditionPreview.jsx

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
  { code: 'active', display: 'Active' },
  { code: 'recurrence', display: 'Recurrence' },
  { code: 'relapse', display: 'Relapse' },
  { code: 'inactive', display: 'Inactive' },
  { code: 'remission', display: 'Remission' },
  { code: 'resolved', display: 'Resolved' }
];

const clinicalStatusColorMap = {
  'active': 'error',
  'recurrence': 'warning',
  'relapse': 'warning',
  'inactive': 'default',
  'remission': 'info',
  'resolved': 'success'
};

const verificationStatusOptions = [
  { code: 'unconfirmed', display: 'Unconfirmed' },
  { code: 'provisional', display: 'Provisional' },
  { code: 'differential', display: 'Differential' },
  { code: 'confirmed', display: 'Confirmed' },
  { code: 'refuted', display: 'Refuted' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function ConditionPreview({ resource, resourceId, embedded }) {
  var condition = resource || {};
  var isExistingRecord = !!resourceId;

  var conditionName = get(condition, 'code.coding[0].display', '') || get(condition, 'code.text', 'Unnamed Condition');
  var snomedCode = get(condition, 'code.coding[0].code', '');

  var clinicalStatusCode = get(condition, 'clinicalStatus.coding[0].code', 'active');
  var clinicalStatusLabel = get(clinicalStatusOptions.find(function(opt) { return opt.code === clinicalStatusCode; }), 'display', clinicalStatusCode);
  var clinicalStatusColor = get(clinicalStatusColorMap, clinicalStatusCode, 'default');

  var verificationStatusCode = get(condition, 'verificationStatus.coding[0].code', '');
  var verificationStatusLabel = get(verificationStatusOptions.find(function(opt) { return opt.code === verificationStatusCode; }), 'display', verificationStatusCode);

  var categoryDisplay = get(condition, 'category[0].coding[0].display', '') || get(condition, 'category[0].text', '');

  var patientDisplay = get(condition, 'subject.display', '');
  var patientReference = get(condition, 'subject.reference', '');

  var asserterDisplay = get(condition, 'asserter.display', '');
  var asserterReference = get(condition, 'asserter.reference', '');

  var onsetDateTime = get(condition, 'onsetDateTime', '');
  var formattedOnset = onsetDateTime ? moment(onsetDateTime).format('MMMM D, YYYY') : '';

  var recordedDate = get(condition, 'recordedDate', '');
  var formattedRecorded = recordedDate ? moment(recordedDate).format('MMMM D, YYYY') : '';

  var noteText = get(condition, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Condition name + clinical status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {conditionName}
        </Typography>
        <Chip label={clinicalStatusLabel} color={clinicalStatusColor} size="small" />
      </Box>

      {snomedCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          SNOMED: {snomedCode}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Onset Date right */}
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

      {/* Verification Status */}
      {verificationStatusCode && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Verification Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={verificationStatusLabel} variant="outlined" size="small" />
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Category */}
      {categoryDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {categoryDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Asserter */}
      {(asserterDisplay || asserterReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Asserter
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {asserterDisplay || 'Unspecified'}
            </Typography>
            {asserterReference && (
              <Typography variant="caption" color="text.secondary">
                {asserterReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Recorded Date */}
      {formattedRecorded && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Recorded Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedRecorded}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Notes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {noteText || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Condition ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ConditionPreview;
