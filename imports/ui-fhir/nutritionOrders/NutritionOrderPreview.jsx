// imports/ui-fhir/nutritionOrders/NutritionOrderPreview.jsx

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
// OPTIONS

const statusOptions = [
  { code: 'draft', display: 'Draft' },
  { code: 'active', display: 'Active' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'revoked', display: 'Revoked' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const statusColorMap = {
  'draft': 'default',
  'active': 'success',
  'on-hold': 'warning',
  'revoked': 'error',
  'completed': 'info',
  'entered-in-error': 'error',
  'unknown': 'default'
};

const intentOptions = [
  { code: 'proposal', display: 'Proposal' },
  { code: 'plan', display: 'Plan' },
  { code: 'directive', display: 'Directive' },
  { code: 'order', display: 'Order' },
  { code: 'original-order', display: 'Original Order' },
  { code: 'reflex-order', display: 'Reflex Order' },
  { code: 'filler-order', display: 'Filler Order' },
  { code: 'instance-order', display: 'Instance Order' },
  { code: 'option', display: 'Option' }
];

//===========================================================================
// COMPONENT

function NutritionOrderPreview({ resource, resourceId, embedded }) {
  var nutritionOrder = resource || {};

  var statusValue = get(nutritionOrder, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(o) { return o.code === statusValue; }), 'display', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var intentValue = get(nutritionOrder, 'intent', '');
  var intentLabel = get(intentOptions.find(function(o) { return o.code === intentValue; }), 'display', intentValue);

  var patientDisplay = get(nutritionOrder, 'patient.display', '');
  var patientReference = get(nutritionOrder, 'patient.reference', '');

  var ordererDisplay = get(nutritionOrder, 'orderer.display', '');
  var ordererReference = get(nutritionOrder, 'orderer.reference', '');

  var dateTime = get(nutritionOrder, 'dateTime', '');
  var formattedDateTime = dateTime ? moment(dateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  // Oral diet
  var dietType = get(nutritionOrder, 'oralDiet.type[0].text', '') || get(nutritionOrder, 'oralDiet.type[0].coding[0].display', '');
  var textureModifier = get(nutritionOrder, 'oralDiet.texture[0].modifier.coding[0].display', '');
  var fluidConsistency = get(nutritionOrder, 'oralDiet.fluidConsistencyType[0].coding[0].display', '');
  var frequency = get(nutritionOrder, 'oralDiet.schedule[0].repeat.frequency', '');
  var startDate = get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.start', '');
  var endDate = get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.end', '');
  var formattedStart = startDate ? moment(startDate).format('MMM D, YYYY') : '';
  var formattedEnd = endDate ? moment(endDate).format('MMM D, YYYY') : '';
  var instruction = get(nutritionOrder, 'oralDiet.instruction', '');

  // Supplement
  var supplementType = get(nutritionOrder, 'supplement[0].type[0].text', '') || get(nutritionOrder, 'supplement[0].type[0].coding[0].display', '');
  var supplementProductName = get(nutritionOrder, 'supplement[0].productName', '');
  var supplementInstruction = get(nutritionOrder, 'supplement[0].instruction', '');

  // Enteral formula
  var formulaType = get(nutritionOrder, 'enteralFormula.baseFormulaType[0].text', '') || get(nutritionOrder, 'enteralFormula.baseFormulaType[0].coding[0].display', '');
  var formulaProductName = get(nutritionOrder, 'enteralFormula.baseFormulaProductName', '');

  // Additional info
  var allergyIntolerance = get(nutritionOrder, 'allergyIntolerance[0]', '');
  var foodPreference = get(nutritionOrder, 'foodPreferenceModifier[0].text', '');
  var excludeFood = get(nutritionOrder, 'excludeFoodModifier[0].text', '');
  var noteText = get(nutritionOrder, 'note[0].text', '');

  // Build subtitle
  var subtitleParts = [];
  if (intentLabel) subtitleParts.push(intentLabel);
  if (dietType) subtitleParts.push(dietType);

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Nutrition Order
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {subtitleParts.length > 0 && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitleParts.join(' - ')}
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {patientReference}
                </Typography>
              )}
            </>
          )}
          {(ordererDisplay || ordererReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Orderer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {ordererDisplay || 'Unspecified'}
              </Typography>
              {ordererReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {ordererReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedDateTime && (
            <>
              <Typography variant="overline" color="text.secondary">
                Order Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedDateTime}
              </Typography>
            </>
          )}
          {intentLabel && (
            <>
              <Typography variant="overline" color="text.secondary">
                Intent
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {intentLabel}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Oral Diet section */}
      {(dietType || textureModifier || fluidConsistency || instruction) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Oral Diet
            </Typography>
            {dietType && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {dietType}
              </Typography>
            )}
            {textureModifier && (
              <Typography variant="body2" color="text.secondary">
                Texture: {textureModifier}
              </Typography>
            )}
            {fluidConsistency && (
              <Typography variant="body2" color="text.secondary">
                Fluid Consistency: {fluidConsistency}
              </Typography>
            )}
            {frequency && (
              <Typography variant="body2" color="text.secondary">
                Frequency: {frequency} times per day
              </Typography>
            )}
            {(formattedStart || formattedEnd) && (
              <Typography variant="body2" color="text.secondary">
                Period: {formattedStart}{formattedEnd ? ' to ' + formattedEnd : ''}
              </Typography>
            )}
            {instruction && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {instruction}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Supplement section */}
      {(supplementType || supplementProductName || supplementInstruction) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Supplement
            </Typography>
            {supplementType && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {supplementType}
              </Typography>
            )}
            {supplementProductName && (
              <Typography variant="body2" color="text.secondary">
                Product: {supplementProductName}
              </Typography>
            )}
            {supplementInstruction && (
              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                {supplementInstruction}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Enteral Formula section */}
      {(formulaType || formulaProductName) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Enteral Formula
            </Typography>
            {formulaType && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formulaType}
              </Typography>
            )}
            {formulaProductName && (
              <Typography variant="body2" color="text.secondary">
                Product: {formulaProductName}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Additional Info */}
      {(allergyIntolerance || foodPreference || excludeFood) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Additional Information
            </Typography>
            {allergyIntolerance && (
              <Typography variant="body2" color="text.secondary">
                Allergy/Intolerance: {allergyIntolerance}
              </Typography>
            )}
            {foodPreference && (
              <Typography variant="body2" color="text.secondary">
                Food Preference: {foodPreference}
              </Typography>
            )}
            {excludeFood && (
              <Typography variant="body2" color="text.secondary">
                Excluded Foods: {excludeFood}
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
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            NutritionOrder ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default NutritionOrderPreview;
