// imports/ui-fhir/nutritionIntakes/NutritionIntakePreview.jsx

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
  { code: 'preparation', display: 'Preparation' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'not-done', display: 'Not Done' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'stopped', display: 'Stopped' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const statusColorMap = {
  'preparation': 'info',
  'in-progress': 'warning',
  'not-done': 'default',
  'on-hold': 'warning',
  'stopped': 'error',
  'completed': 'success',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function NutritionIntakePreview({ resource, resourceId, embedded }) {
  var nutritionIntake = resource || {};

  var codeDisplay = get(nutritionIntake, 'code.text', '') || get(nutritionIntake, 'code.coding[0].display', 'Nutrition Intake');
  var statusValue = get(nutritionIntake, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(o) { return o.code === statusValue; }), 'display', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var subjectDisplay = get(nutritionIntake, 'subject.display', '');
  var subjectReference = get(nutritionIntake, 'subject.reference', '');

  var occurrenceDateTime = get(nutritionIntake, 'occurrenceDateTime', '');
  var formattedOccurrence = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  var recordedDateTime = get(nutritionIntake, 'recorded', '');
  var formattedRecorded = recordedDateTime ? moment(recordedDateTime).format('MMMM D, YYYY [at] h:mm A') : '';

  var consumedItemType = get(nutritionIntake, 'consumedItem[0].type.text', '') || get(nutritionIntake, 'consumedItem[0].type.coding[0].display', '');
  var nutritionProduct = get(nutritionIntake, 'consumedItem[0].nutritionProduct.concept.text', '') || get(nutritionIntake, 'consumedItem[0].nutritionProduct.concept.coding[0].display', '');
  var amountValue = get(nutritionIntake, 'consumedItem[0].amount.value', '');
  var amountUnit = get(nutritionIntake, 'consumedItem[0].amount.unit', '');
  var amountDisplay = (amountValue !== '' && amountValue !== null) ? amountValue + ' ' + amountUnit : '';
  var notConsumed = get(nutritionIntake, 'consumedItem[0].notConsumed', false);
  var notConsumedReason = get(nutritionIntake, 'consumedItem[0].notConsumedReason.text', '');

  var nutrientName = get(nutritionIntake, 'ingredientLabel[0].nutrient.text', '') || get(nutritionIntake, 'ingredientLabel[0].nutrient.coding[0].display', '');
  var nutrientValue = get(nutritionIntake, 'ingredientLabel[0].amount.value', '');
  var nutrientUnit = get(nutritionIntake, 'ingredientLabel[0].amount.unit', '');
  var nutrientDisplay = (nutrientValue !== '' && nutrientValue !== null) ? nutrientValue + ' ' + nutrientUnit : '';

  var performerDisplay = get(nutritionIntake, 'performer[0].actor.display', '');
  var performerReference = get(nutritionIntake, 'performer[0].actor.reference', '');

  var locationDisplay = get(nutritionIntake, 'location.display', '');
  var noteText = get(nutritionIntake, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {codeDisplay || nutritionProduct || 'Nutrition Intake'}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {consumedItemType && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {consumedItemType}
          {nutritionProduct ? ' - ' + nutritionProduct : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Dates right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(subjectDisplay || subjectReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {subjectDisplay || 'Unspecified'}
              </Typography>
              {subjectReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {subjectReference}
                </Typography>
              )}
            </>
          )}
          {(performerDisplay || performerReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Performer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {performerDisplay || 'Unspecified'}
              </Typography>
              {performerReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {performerReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedOccurrence && (
            <>
              <Typography variant="overline" color="text.secondary">
                Occurrence
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedOccurrence}
              </Typography>
            </>
          )}
          {formattedRecorded && (
            <>
              <Typography variant="overline" color="text.secondary">
                Recorded
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedRecorded}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Consumed Item details */}
      {(nutritionProduct || amountDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Consumed Item
            </Typography>
            {nutritionProduct && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {nutritionProduct}
              </Typography>
            )}
            {amountDisplay && (
              <Typography variant="body2" color="text.secondary">
                Amount: {amountDisplay}
              </Typography>
            )}
            {notConsumed && (
              <Chip label="Not Consumed" color="warning" size="small" sx={{ mt: 1 }} />
            )}
            {notConsumed && notConsumedReason && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Reason: {notConsumedReason}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Ingredient Label */}
      {(nutrientName || nutrientDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Ingredient Label
            </Typography>
            {nutrientName && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {nutrientName}
              </Typography>
            )}
            {nutrientDisplay && (
              <Typography variant="body2" color="text.secondary">
                Amount: {nutrientDisplay}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Location */}
      {locationDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Location
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {locationDisplay}
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
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            NutritionIntake ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default NutritionIntakePreview;
