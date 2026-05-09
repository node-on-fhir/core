// imports/ui-fhir/medicationRequests/MedicationRequestPreview.jsx

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
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'draft', label: 'Draft' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'active': 'success',
  'on-hold': 'warning',
  'cancelled': 'error',
  'completed': 'info',
  'entered-in-error': 'error',
  'stopped': 'error',
  'draft': 'default',
  'unknown': 'default'
};

const intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'order', label: 'Order' },
  { value: 'original-order', label: 'Original Order' },
  { value: 'reflex-order', label: 'Reflex Order' },
  { value: 'filler-order', label: 'Filler Order' },
  { value: 'instance-order', label: 'Instance Order' },
  { value: 'option', label: 'Option' }
];

const priorityOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'asap', label: 'ASAP' },
  { value: 'stat', label: 'STAT' }
];

//===========================================================================
// COMPONENT

function MedicationRequestPreview({ resource, resourceId, embedded }) {
  var medicationRequest = resource || {};
  var isExistingRecord = !!resourceId;

  var medicationName = get(medicationRequest, 'medicationCodeableConcept.text', '') ||
    get(medicationRequest, 'medicationCodeableConcept.coding[0].display', 'Unnamed Medication');
  var medicationCode = get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '');

  var statusValue = get(medicationRequest, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var intentValue = get(medicationRequest, 'intent', 'order');
  var intentLabel = get(intentOptions.find(function(opt) { return opt.value === intentValue; }), 'label', intentValue);

  var priorityValue = get(medicationRequest, 'priority', 'routine');
  var priorityLabel = get(priorityOptions.find(function(opt) { return opt.value === priorityValue; }), 'label', priorityValue);

  var patientDisplay = get(medicationRequest, 'subject.display', '');
  var patientReference = get(medicationRequest, 'subject.reference', '');

  var authoredOn = get(medicationRequest, 'authoredOn', '');
  var formattedAuthoredOn = authoredOn ? moment(authoredOn).format('MMMM D, YYYY') : '';

  var requesterDisplay = get(medicationRequest, 'requester.display', '');
  var requesterReference = get(medicationRequest, 'requester.reference', '');

  var dosageText = get(medicationRequest, 'dosageInstruction[0].text', '');
  var doseValue = get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', '');
  var doseUnit = get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', '');
  var routeDisplay = get(medicationRequest, 'dosageInstruction[0].route.coding[0].display', '');
  var frequency = get(medicationRequest, 'dosageInstruction[0].timing.repeat.frequency', '');
  var period = get(medicationRequest, 'dosageInstruction[0].timing.repeat.period', '');
  var periodUnit = get(medicationRequest, 'dosageInstruction[0].timing.repeat.periodUnit', '');
  var timingText = get(medicationRequest, 'dosageInstruction[0].timing.code.text', '');

  var dispenseQuantity = get(medicationRequest, 'dispenseRequest.quantity.value', '');
  var dispenseUnit = get(medicationRequest, 'dispenseRequest.quantity.unit', '');
  var numberOfRepeats = get(medicationRequest, 'dispenseRequest.numberOfRepeatsAllowed', '');
  var validFrom = get(medicationRequest, 'dispenseRequest.validityPeriod.start', '');
  var validUntil = get(medicationRequest, 'dispenseRequest.validityPeriod.end', '');

  var reasonText = get(medicationRequest, 'reasonCode[0].text', '') || get(medicationRequest, 'reasonCode[0].coding[0].display', '');
  var reasonCode = get(medicationRequest, 'reasonCode[0].coding[0].code', '');

  var noteText = get(medicationRequest, 'note[0].text', '');

  // Build dosage summary
  var dosageSummary = '';
  if (doseValue !== '' && doseValue !== null && doseValue !== undefined) {
    dosageSummary = doseValue + ' ' + doseUnit;
    if (routeDisplay) {
      dosageSummary = dosageSummary + ' via ' + routeDisplay;
    }
    if (timingText) {
      dosageSummary = dosageSummary + ', ' + timingText;
    } else if (frequency && period && periodUnit) {
      dosageSummary = dosageSummary + ', ' + frequency + 'x per ' + period + ' ' + periodUnit;
    }
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + subtitle */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
        Medication Request
      </Typography>

      <Divider />

      {/* Two-column metadata: Patient left, Authored On right */}
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
          {formattedAuthoredOn && (
            <>
              <Typography variant="overline" color="text.secondary">
                Authored On
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedAuthoredOn}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status + Intent + Priority chips */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Status
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>
        <Box sx={{ ml: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Intent
          </Typography>
          <Chip label={intentLabel} size="small" variant="outlined" />
        </Box>
        <Box sx={{ ml: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Priority
          </Typography>
          <Chip label={priorityLabel} size="small" variant="outlined" />
        </Box>
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

      {/* Requester */}
      {(requesterDisplay || requesterReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Requester
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {requesterDisplay || 'Unspecified'}
            </Typography>
            {requesterReference && (
              <Typography variant="caption" color="text.secondary">
                {requesterReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Dosage */}
      {(dosageSummary || dosageText) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Dosage Instructions
            </Typography>
            {dosageSummary && (
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {dosageSummary}
              </Typography>
            )}
            {dosageText && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {dosageText}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Dispense Request */}
      {(dispenseQuantity || numberOfRepeats || validFrom) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Dispense Request
            </Typography>
            {(dispenseQuantity !== '' && dispenseQuantity !== null && dispenseQuantity !== undefined) && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Quantity: {dispenseQuantity} {dispenseUnit}
              </Typography>
            )}
            {(numberOfRepeats !== '' && numberOfRepeats !== null && numberOfRepeats !== undefined) && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Refills Allowed: {numberOfRepeats}
              </Typography>
            )}
            {(validFrom || validUntil) && (
              <Typography variant="body1">
                Validity: {validFrom ? moment(validFrom).format('MMM D, YYYY') : '?'} - {validUntil ? moment(validUntil).format('MMM D, YYYY') : '?'}
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
              Reason
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonText}{reasonCode ? ' (' + reasonCode + ')' : ''}
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
            minHeight: '60px'
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
            MedicationRequest ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MedicationRequestPreview;
