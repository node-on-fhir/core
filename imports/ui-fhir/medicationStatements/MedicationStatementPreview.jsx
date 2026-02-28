// imports/ui-fhir/medicationStatements/MedicationStatementPreview.jsx

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
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'intended', label: 'Intended' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'unknown', label: 'Unknown' },
  { value: 'not-taken', label: 'Not Taken' }
];

const statusColorMap = {
  'active': 'success',
  'completed': 'info',
  'entered-in-error': 'error',
  'intended': 'default',
  'stopped': 'error',
  'on-hold': 'warning',
  'unknown': 'default',
  'not-taken': 'warning'
};

//===========================================================================
// COMPONENT

function MedicationStatementPreview({ resource, resourceId, embedded }) {
  var medicationStatement = resource || {};
  var isExistingRecord = !!resourceId;

  var medicationName = get(medicationStatement, 'medicationCodeableConcept.text', '') ||
    get(medicationStatement, 'medicationCodeableConcept.coding[0].display', 'Unnamed Medication');
  var medicationCode = get(medicationStatement, 'medicationCodeableConcept.coding[0].code', '');

  var statusValue = get(medicationStatement, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var categoryCode = get(medicationStatement, 'category.coding[0].code', '');
  var categoryDisplay = get(medicationStatement, 'category.coding[0].display', '') || categoryCode;

  var patientDisplay = get(medicationStatement, 'subject.display', '');
  var patientReference = get(medicationStatement, 'subject.reference', '');

  var effectiveDate = get(medicationStatement, 'effectiveDateTime', '');
  var formattedEffectiveDate = effectiveDate ? moment(effectiveDate).format('MMMM D, YYYY') : '';

  var dateAsserted = get(medicationStatement, 'dateAsserted', '');
  var formattedDateAsserted = dateAsserted ? moment(dateAsserted).format('MMMM D, YYYY') : '';

  var informationSourceDisplay = get(medicationStatement, 'informationSource.display', '');
  var informationSourceReference = get(medicationStatement, 'informationSource.reference', '');

  var reasonText = get(medicationStatement, 'reasonCode[0].text', '');
  var reasonCode = get(medicationStatement, 'reasonCode[0].coding[0].code', '');

  var dosageText = get(medicationStatement, 'dosage[0].text', '');
  var doseValue = get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.value', '');
  var doseUnit = get(medicationStatement, 'dosage[0].doseAndRate[0].doseQuantity.unit', '');
  var frequency = get(medicationStatement, 'dosage[0].timing.repeat.frequency', '');
  var period = get(medicationStatement, 'dosage[0].timing.repeat.period', '');
  var periodUnit = get(medicationStatement, 'dosage[0].timing.repeat.periodUnit', '');
  var routeDisplay = get(medicationStatement, 'dosage[0].route.coding[0].display', '');

  // Build dosage summary
  var dosageSummary = '';
  if (doseValue !== '' && doseValue !== null && doseValue !== undefined) {
    dosageSummary = doseValue + ' ' + doseUnit;
    if (routeDisplay) {
      dosageSummary = dosageSummary + ' via ' + routeDisplay;
    }
    if (frequency && period && periodUnit) {
      dosageSummary = dosageSummary + ', ' + frequency + 'x per ' + period + ' ' + periodUnit;
    }
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + subtitle */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Medication Statement
      </Typography>

      <Divider />

      {/* Two-column metadata: Patient left, Date right */}
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
          {formattedEffectiveDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Effective Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedEffectiveDate}
              </Typography>
            </>
          )}
          {formattedDateAsserted && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Date Asserted
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDateAsserted}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Status
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Medication */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary">
          Medication
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {medicationName}
        </Typography>
        {medicationCode && (
          <Typography variant="caption" color="text.secondary">
            RxNorm: {medicationCode}
          </Typography>
        )}
      </Box>

      <Divider />

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

      {/* Information Source */}
      {(informationSourceDisplay || informationSourceReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Information Source
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {informationSourceDisplay || 'Unspecified'}
            </Typography>
            {informationSourceReference && (
              <Typography variant="caption" color="text.secondary">
                {informationSourceReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      {(reasonText || reasonCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reason for Taking
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonText}{reasonCode ? ' (' + reasonCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Dosage */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Dosage
        </Typography>
        {dosageSummary && (
          <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
            {dosageSummary}
          </Typography>
        )}
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {dosageText || 'No dosage instructions provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            MedicationStatement ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MedicationStatementPreview;
