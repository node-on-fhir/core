// imports/ui-fhir/medicationAdministrations/MedicationAdministrationPreview.jsx

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
  { value: 'not-done', label: 'Not Done' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'in-progress': 'info',
  'not-done': 'default',
  'on-hold': 'warning',
  'completed': 'success',
  'entered-in-error': 'error',
  'stopped': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function MedicationAdministrationPreview({ resource, resourceId, embedded }) {
  var medicationAdministration = resource || {};
  var isExistingRecord = !!resourceId;

  var medicationName = get(medicationAdministration, 'medicationCodeableConcept.text', '') ||
    get(medicationAdministration, 'medicationCodeableConcept.coding[0].display', 'Unnamed Medication');
  var medicationCode = get(medicationAdministration, 'medicationCodeableConcept.coding[0].code', '');

  var statusValue = get(medicationAdministration, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(medicationAdministration, 'subject.display', '');
  var patientReference = get(medicationAdministration, 'subject.reference', '');

  var effectiveDate = get(medicationAdministration, 'effectiveDateTime', '');
  var formattedDate = effectiveDate ? moment(effectiveDate).format('MMMM D, YYYY [at] h:mm A') : '';

  var categoryCode = get(medicationAdministration, 'category.coding[0].code', '');
  var categoryDisplay = get(medicationAdministration, 'category.coding[0].display', '') || categoryCode;

  var performerDisplay = get(medicationAdministration, 'performer[0].actor.display', '');
  var performerReference = get(medicationAdministration, 'performer[0].actor.reference', '');

  var dosageText = get(medicationAdministration, 'dosage.text', '');
  var doseValue = get(medicationAdministration, 'dosage.dose.value', '');
  var doseUnit = get(medicationAdministration, 'dosage.dose.unit', '');
  var routeDisplay = get(medicationAdministration, 'dosage.route.coding[0].display', '');

  // Build dosage summary
  var dosageSummary = '';
  if (doseValue !== '' && doseValue !== null && doseValue !== undefined) {
    dosageSummary = doseValue + ' ' + doseUnit;
    if (routeDisplay) {
      dosageSummary = dosageSummary + ' via ' + routeDisplay;
    }
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + subtitle */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Medication Administration
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
          {formattedDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Administration Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
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

      {/* Performer */}
      {(performerDisplay || performerReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Administered By
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {performerDisplay || 'Unspecified'}
            </Typography>
            {performerReference && (
              <Typography variant="caption" color="text.secondary">
                {performerReference}
              </Typography>
            )}
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
            MedicationAdministration ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MedicationAdministrationPreview;
