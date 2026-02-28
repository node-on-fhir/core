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

function ConditionPreview({ resource, resourceId, embedded, isDark }) {
  var condition = resource || {};
  var isExistingRecord = !!resourceId;

  var textColor = isDark ? 'rgba(255, 255, 255, 0.87)' : undefined;
  var secondaryColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary';

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
        <Typography variant="h5" sx={{ fontWeight: 500, color: textColor }}>
          {conditionName}
        </Typography>
        <Chip label={clinicalStatusLabel} color={clinicalStatusColor} size="small" />
      </Box>

      {snomedCode && (
        <Typography variant="subtitle1" sx={{ color: secondaryColor, mb: 3 }}>
          SNOMED: {snomedCode}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Onset Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" sx={{ color: secondaryColor }}>
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: textColor }}>
                {patientDisplay || 'Unspecified'}
              </Typography>
              {patientReference && (
                <Typography variant="caption" sx={{ color: secondaryColor }}>
                  {patientReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedOnset && (
            <>
              <Typography variant="overline" sx={{ color: secondaryColor }}>
                Onset Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, color: textColor }}>
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
            <Typography variant="overline" sx={{ color: secondaryColor }}>
              Verification Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip label={verificationStatusLabel} variant="outlined" size="small" sx={{ color: textColor, borderColor: isDark ? 'rgba(255, 255, 255, 0.23)' : undefined }} />
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Category */}
      {categoryDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" sx={{ color: secondaryColor }}>
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: textColor }}>
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
            <Typography variant="overline" sx={{ color: secondaryColor }}>
              Asserter
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: textColor }}>
              {asserterDisplay || 'Unspecified'}
            </Typography>
            {asserterReference && (
              <Typography variant="caption" sx={{ color: secondaryColor }}>
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
            <Typography variant="overline" sx={{ color: secondaryColor }}>
              Recorded Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, color: textColor }}>
              {formattedRecorded}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" sx={{ color: secondaryColor, mb: 1, display: 'block' }}>
          Notes
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px',
            color: textColor
          }}
        >
          {noteText || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" sx={{ color: secondaryColor }}>
            Condition ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ConditionPreview;
