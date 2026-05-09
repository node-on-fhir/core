// imports/ui-fhir/immunizations/ImmunizationPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// STATUS HELPERS

var statusColorMap = {
  'completed': 'success',
  'entered-in-error': 'error',
  'not-done': 'default'
};

var statusLabelMap = {
  'completed': 'Completed',
  'entered-in-error': 'Entered in Error',
  'not-done': 'Not Done'
};

//===========================================================================
// COMPONENT

function ImmunizationPreview({ resource, resourceId, embedded }) {
  var immunization = resource || {};
  var isExistingRecord = !!resourceId;

  var vaccineName = get(immunization, 'vaccineCode.text', '') ||
                    get(immunization, 'vaccineCode.coding[0].display', 'Unnamed Immunization');
  var vaccineCode = get(immunization, 'vaccineCode.coding[0].code', '');
  var statusValue = get(immunization, 'status', 'completed');
  var statusLabel = get(statusLabelMap, statusValue, statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(immunization, 'patient.display', '');
  var patientReference = get(immunization, 'patient.reference', '');
  var occurrenceDateTime = get(immunization, 'occurrenceDateTime', '');
  var formattedDate = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  var primarySource = get(immunization, 'primarySource', true);
  var lotNumber = get(immunization, 'lotNumber', '');
  var expirationDate = get(immunization, 'expirationDate', '');
  var formattedExpiration = expirationDate ? moment(expirationDate).format('MMMM D, YYYY') : '';

  var manufacturerDisplay = get(immunization, 'manufacturer.display', '');
  var siteDisplay = get(immunization, 'site.text', '') || get(immunization, 'site.coding[0].display', '');
  var routeDisplay = get(immunization, 'route.text', '') || get(immunization, 'route.coding[0].display', '');
  var doseValue = get(immunization, 'doseQuantity.value', '');
  var doseUnit = get(immunization, 'doseQuantity.unit', '');

  var performerDisplay = get(immunization, 'performer[0].actor.display', '');
  var performerReference = get(immunization, 'performer[0].actor.reference', '');
  var noteText = get(immunization, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Vaccine name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {vaccineName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {vaccineCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          CVX Code: {vaccineCode}
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

      {/* Vaccine Details */}
      {(manufacturerDisplay || lotNumber || formattedExpiration) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Vaccine Details
            </Typography>
            {manufacturerDisplay && (
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                Manufacturer: {manufacturerDisplay}
              </Typography>
            )}
            {lotNumber && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Lot Number: {lotNumber}
              </Typography>
            )}
            {formattedExpiration && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Expiration: {formattedExpiration}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Primary Source: {primarySource ? 'Yes' : 'No'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Administration Details */}
      {(siteDisplay || routeDisplay || doseValue) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Administration
            </Typography>
            {siteDisplay && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Site: {siteDisplay}
              </Typography>
            )}
            {routeDisplay && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Route: {routeDisplay}
              </Typography>
            )}
            {(doseValue !== '' && doseValue !== null && doseValue !== undefined) && (
              <Typography variant="body1" sx={{ mb: 0.5 }}>
                Dose: {doseValue} {doseUnit}
              </Typography>
            )}
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
            Immunization ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ImmunizationPreview;
