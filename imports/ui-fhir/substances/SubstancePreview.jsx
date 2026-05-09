// imports/ui-fhir/substances/SubstancePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusColorMap = {
  'active': 'success',
  'inactive': 'default',
  'entered-in-error': 'error'
};

const statusLabelMap = {
  'active': 'Active',
  'inactive': 'Inactive',
  'entered-in-error': 'Entered in Error'
};

function SubstancePreview({ resource, form, resourceId, embedded }){
  const statusLabel = get(statusLabelMap, form.status, form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const formattedExpiry = form.instanceExpiry ? moment(form.instanceExpiry).format('MMMM D, YYYY') : '';

  // Build subtitle from code and category
  let subtitleParts = [];
  if (form.codeText) {
    subtitleParts.push(form.codeText);
  }
  if (form.categoryDisplay) {
    subtitleParts.push(form.categoryDisplay);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingSubstance = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            SNOMED Code
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.codeCode || 'Not coded'}
          </Typography>
          {form.codeDisplay && (
            <Typography variant="caption" color="text.secondary">
              {form.codeDisplay}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Category
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.categoryDisplay || 'Uncategorized'}
          </Typography>
          {form.categoryCode && (
            <Typography variant="caption" color="text.secondary">
              {form.categoryCode}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Description */}
      {form.description && (
        <>
          <Box sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Description
            </Typography>
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8
              }}
            >
              {form.description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Instance Information */}
      {(form.instanceIdentifier || form.instanceExpiry || form.instanceQuantityValue) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Instance Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                {form.instanceIdentifier && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Lot / Batch
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {form.instanceIdentifier}
                    </Typography>
                  </>
                )}
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                {formattedExpiry && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Expiry
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formattedExpiry}
                    </Typography>
                  </>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {form.instanceQuantityValue && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {form.instanceQuantityValue} {form.instanceQuantityUnit || ''}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Ingredient Information */}
      {(form.ingredientCode || form.ingredientDisplay) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Ingredient
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {form.ingredientDisplay || form.ingredientCode || 'Unknown'}
                </Typography>
                {form.ingredientCode && form.ingredientDisplay && (
                  <Typography variant="caption" color="text.secondary">
                    Code: {form.ingredientCode}
                  </Typography>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                {(form.ingredientNumeratorValue || form.ingredientDenominatorValue) && (
                  <>
                    <Typography variant="caption" color="text.secondary">
                      Ratio
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {form.ingredientNumeratorValue || '?'} {form.ingredientNumeratorUnit || ''}
                      {' / '}
                      {form.ingredientDenominatorValue || '?'} {form.ingredientDenominatorUnit || ''}
                    </Typography>
                  </>
                )}
              </Box>
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {isExistingSubstance && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Substance ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default SubstancePreview;
