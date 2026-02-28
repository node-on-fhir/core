// imports/ui-fhir/observations/ObservationPreview.jsx

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
  { value: 'registered', label: 'Registered' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'info',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function ObservationPreview({ resource, form, resourceId, embedded }) {
  var observation = resource || {};
  var isExistingRecord = !!resourceId;

  var observationName = get(observation, 'code.coding[0].display', '') || get(observation, 'code.text', 'Unnamed Observation');
  var observationCode = get(observation, 'code.coding[0].code', '');
  var statusValue = get(observation, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(observation, 'subject.display', '');
  var patientReference = get(observation, 'subject.reference', '');
  var effectiveDate = get(observation, 'effectiveDateTime', '');
  var formattedDate = effectiveDate ? moment(effectiveDate).format('MMMM D, YYYY [at] h:mm A') : '';

  var categoryDisplay = get(observation, 'category[0].coding[0].display', '') || get(observation, 'category[0].text', '');
  var categoryCode = get(observation, 'category[0].coding[0].code', '');

  var performerDisplay = get(observation, 'performer[0].display', '');
  var performerReference = get(observation, 'performer[0].reference', '');

  var deviceDisplay = get(observation, 'device.display', '');
  var deviceReference = get(observation, 'device.reference', '');

  var noteText = get(observation, 'note[0].text', '');

  // Build value display string
  var valueDisplay = '';
  var quantityValue = get(observation, 'valueQuantity.value', '');
  var quantityUnit = get(observation, 'valueQuantity.unit', '');
  if (quantityValue !== '' && quantityValue !== null && quantityValue !== undefined) {
    valueDisplay = quantityValue + ' ' + quantityUnit;
  } else if (get(observation, 'valueString')) {
    valueDisplay = get(observation, 'valueString');
  } else if (get(observation, 'valueCodeableConcept.coding[0].display')) {
    valueDisplay = get(observation, 'valueCodeableConcept.coding[0].display');
  } else if (get(observation, 'valueBoolean') !== null && get(observation, 'valueBoolean') !== undefined) {
    valueDisplay = String(get(observation, 'valueBoolean'));
  } else if (get(observation, 'valueInteger') !== null && get(observation, 'valueInteger') !== undefined) {
    valueDisplay = String(get(observation, 'valueInteger'));
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Observation name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {observationName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {observationCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Code: {observationCode}
        </Typography>
      )}

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
                Effective Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Category */}
      {(categoryDisplay || categoryCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Value */}
      {valueDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Value
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {valueDisplay}
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
              Performer
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

      {/* Device */}
      {(deviceDisplay || deviceReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Device
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {deviceDisplay || 'Unspecified'}
            </Typography>
            {deviceReference && (
              <Typography variant="caption" color="text.secondary">
                {deviceReference}
              </Typography>
            )}
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
            Observation ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ObservationPreview;
