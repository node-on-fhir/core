// imports/ui-fhir/measures/MeasurePreview.jsx

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

const statusColorMap = {
  'draft': 'warning',
  'active': 'success',
  'retired': 'default',
  'unknown': 'info'
};

const statusLabelMap = {
  'draft': 'Draft',
  'active': 'Active',
  'retired': 'Retired',
  'unknown': 'Unknown'
};

//===========================================================================
// COMPONENT

function MeasurePreview({ resource, resourceId, embedded }) {
  var title = get(resource, 'title', '') || get(resource, 'name', 'Untitled Measure');
  var name = get(resource, 'name', '');
  var status = get(resource, 'status', '');
  var version = get(resource, 'version', '');
  var identifier = get(resource, 'identifier[0].value', '');
  var publisher = get(resource, 'publisher', '');
  var date = get(resource, 'date', '');
  var description = get(resource, 'description', '');
  var purpose = get(resource, 'purpose', '');
  var usage = get(resource, 'usage', '');
  var copyright = get(resource, 'copyright', '');
  var guidance = get(resource, 'guidance', '');
  var improvementNotationCode = get(resource, 'improvementNotation.coding[0].code', '');
  var improvementNotationDisplay = get(resource, 'improvementNotation.coding[0].display', '');
  var rateAggregation = get(resource, 'rateAggregation', '');
  var clinicalRecommendationStatement = get(resource, 'clinicalRecommendationStatement', '');
  var disclaimer = get(resource, 'disclaimer', '');
  var riskAdjustment = get(resource, 'riskAdjustment', '');
  var rationale = get(resource, 'rationale', '');
  var effectivePeriodStart = get(resource, 'effectivePeriod.start', '');
  var effectivePeriodEnd = get(resource, 'effectivePeriod.end', '');
  var lastReviewDate = get(resource, 'lastReviewDate', '');
  var approvalDate = get(resource, 'approvalDate', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
        {title}
      </Typography>

      {name && name !== title && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {name}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {identifier && (
            <>
              <Typography variant="overline" color="text.secondary">
                Identifier
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {identifier}
              </Typography>
            </>
          )}
          {version && (
            <>
              <Typography variant="overline" color="text.secondary">
                Version
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {version}
              </Typography>
            </>
          )}
          {publisher && (
            <>
              <Typography variant="overline" color="text.secondary">
                Publisher
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {publisher}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {date && (
            <>
              <Typography variant="overline" color="text.secondary">
                Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {moment(date).format('MMM D, YYYY')}
              </Typography>
            </>
          )}
          {improvementNotationDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Improvement Notation
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {improvementNotationDisplay}
              </Typography>
            </>
          )}
          {rateAggregation && (
            <>
              <Typography variant="overline" color="text.secondary">
                Rate Aggregation
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {rateAggregation}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ display: 'flex', gap: 1, py: 2 }}>
        {status && (
          <Chip
            label={statusLabelMap[status] || status}
            color={statusColorMap[status] || 'default'}
            size="small"
          />
        )}
        {improvementNotationCode && (
          <Chip
            label={improvementNotationCode === 'increase' ? 'Increase is better' : 'Decrease is better'}
            color="info"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Divider />

      {/* Description */}
      {description && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">
              {description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Purpose */}
      {purpose && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Purpose
            </Typography>
            <Typography variant="body1">
              {purpose}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Usage */}
      {usage && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Usage
            </Typography>
            <Typography variant="body1">
              {usage}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Effective Period */}
      {(effectivePeriodStart || effectivePeriodEnd) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Effective Period
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {effectivePeriodStart ? moment(effectivePeriodStart).format('MMM D, YYYY') : 'N/A'}
              {' - '}
              {effectivePeriodEnd ? moment(effectivePeriodEnd).format('MMM D, YYYY') : 'Ongoing'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Review and Approval Dates */}
      {(lastReviewDate || approvalDate) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2 }}>
            {lastReviewDate && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Last Review Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {moment(lastReviewDate).format('MMM D, YYYY')}
                </Typography>
              </Box>
            )}
            {approvalDate && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="overline" color="text.secondary">
                  Approval Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {moment(approvalDate).format('MMM D, YYYY')}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Clinical Recommendation Statement */}
      {clinicalRecommendationStatement && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Clinical Recommendation Statement
            </Typography>
            <Typography variant="body1">
              {clinicalRecommendationStatement}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Guidance */}
      {guidance && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Guidance
            </Typography>
            <Typography variant="body1">
              {guidance}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Rationale */}
      {rationale && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Rationale
            </Typography>
            <Typography variant="body1">
              {rationale}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Risk Adjustment */}
      {riskAdjustment && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Risk Adjustment
            </Typography>
            <Typography variant="body1">
              {riskAdjustment}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Disclaimer */}
      {disclaimer && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Disclaimer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {disclaimer}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Copyright */}
      {copyright && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Copyright
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {copyright}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with measure ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Measure ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MeasurePreview;
