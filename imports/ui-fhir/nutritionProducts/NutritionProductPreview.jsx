// imports/ui-fhir/nutritionProducts/NutritionProductPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'entered-in-error': 'error'
};

function NutritionProductPreview({ resource, resourceId, embedded }) {
  var nutritionProduct = resource || {};

  var productName = get(nutritionProduct, 'code.text', '') || get(nutritionProduct, 'code.coding[0].display', '') || 'Unnamed Product';
  var snomedCode = get(nutritionProduct, 'code.coding[0].code', '');
  var snomedDisplay = get(nutritionProduct, 'code.coding[0].display', '');

  var statusValue = get(nutritionProduct, 'status', 'active');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var categoryText = get(nutritionProduct, 'category[0].text', '') || get(nutritionProduct, 'category[0].coding[0].display', '');
  var categoryCode = get(nutritionProduct, 'category[0].coding[0].code', '');

  var manufacturer = get(nutritionProduct, 'manufacturer[0].display', '');

  var description = get(nutritionProduct, 'productCharacteristic[0].valueString', '');
  var noteText = get(nutritionProduct, 'note[0].text', '');

  var isExistingProduct = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Product name + subtitle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {productName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {categoryText && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {categoryText}{categoryCode ? ' (' + categoryCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {manufacturer && (
            <>
              <Typography variant="overline" color="text.secondary">
                Manufacturer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {manufacturer}
              </Typography>
            </>
          )}
          {snomedCode && (
            <>
              <Typography variant="overline" color="text.secondary">
                SNOMED CT Code
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {snomedCode}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {snomedDisplay && snomedDisplay !== productName && (
            <>
              <Typography variant="overline" color="text.secondary">
                Display Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {snomedDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip section */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Status
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Description */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Description
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '60px'
          }}
        >
          {description || 'No description provided.'}
        </Typography>
      </Box>

      <Divider />

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

      {/* Footer with product ID */}
      {isExistingProduct && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            NutritionProduct ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default NutritionProductPreview;
