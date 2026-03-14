// imports/ui-fhir/medications/MedicationPreview.jsx

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

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'entered-in-error': 'error'
};

//===========================================================================
// COMPONENT

function MedicationPreview({ resource, resourceId, embedded }) {
  var medication = resource || {};
  var isExistingRecord = !!resourceId;

  // Core fields
  var medicationName = get(medication, 'code.text', '') || get(medication, 'code.coding[0].display', 'Unnamed Medication');
  var rxnormCode = get(medication, 'code.coding[0].code', '');
  var rxnormDisplay = get(medication, 'code.coding[0].display', '');
  var statusValue = get(medication, 'status', 'active');
  var statusColor = get(statusColorMap, statusValue, 'default');

  // Form
  var formDisplay = get(medication, 'form.coding[0].display', '') || get(medication, 'form.text', '');
  var formCode = get(medication, 'form.coding[0].code', '');

  // Manufacturer
  var manufacturerDisplay = get(medication, 'manufacturer.display', '');
  var manufacturerReference = get(medication, 'manufacturer.reference', '');

  // Ingredients
  var ingredientDisplay = get(medication, 'ingredient[0].itemCodeableConcept.coding[0].display', '');
  var ingredientCode = get(medication, 'ingredient[0].itemCodeableConcept.coding[0].code', '');
  var ingredientStrength = get(medication, 'ingredient[0].strength.numerator.value', '');
  var ingredientUnit = get(medication, 'ingredient[0].strength.numerator.unit', '');

  // Batch
  var lotNumber = get(medication, 'batch.lotNumber', '');
  var expirationDate = get(medication, 'batch.expirationDate', '');
  var formattedExpiration = expirationDate ? moment(expirationDate).format('MMMM D, YYYY') : '';

  // Notes
  var noteText = get(medication, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + code subtitle */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        {medicationName}
      </Typography>
      {rxnormCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          RxNorm: {rxnormCode}{rxnormDisplay && rxnormDisplay !== medicationName ? ' - ' + rxnormDisplay : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Manufacturer left, Form right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(manufacturerDisplay || manufacturerReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Manufacturer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {manufacturerDisplay || 'Unspecified'}
              </Typography>
              {manufacturerReference && (
                <Typography variant="caption" color="text.secondary">
                  {manufacturerReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(formDisplay || formCode) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Form
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formDisplay}{formCode ? ' (' + formCode + ')' : ''}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2 }}>
        <Chip label={'Status: ' + statusValue} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Ingredients */}
      {(ingredientDisplay || ingredientCode || ingredientStrength) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Ingredients
            </Typography>
            {(ingredientDisplay || ingredientCode) && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ingredientDisplay || ingredientCode}
                </Typography>
                {ingredientCode && ingredientDisplay && (
                  <Typography variant="caption" color="text.secondary">
                    Code: {ingredientCode}
                  </Typography>
                )}
              </Box>
            )}
            {(ingredientStrength || ingredientUnit) && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Strength</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {ingredientStrength} {ingredientUnit}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Batch Information */}
      {(lotNumber || formattedExpiration) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Batch Information
            </Typography>
            {lotNumber && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Lot Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{lotNumber}</Typography>
              </Box>
            )}
            {formattedExpiration && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Expiration Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{formattedExpiration}</Typography>
              </Box>
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
            Medication ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MedicationPreview;
