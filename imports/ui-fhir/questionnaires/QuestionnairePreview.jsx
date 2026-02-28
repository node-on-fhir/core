// imports/ui-fhir/questionnaires/QuestionnairePreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function QuestionnairePreview({ resource, resourceId, embedded }) {
  var title = get(resource, 'title', 'Untitled Questionnaire');
  var name = get(resource, 'name', '');
  var version = get(resource, 'version', '');
  var status = get(resource, 'status', 'active');
  var publisher = get(resource, 'publisher', '');
  var description = get(resource, 'description', '');
  var purpose = get(resource, 'purpose', '');
  var date = get(resource, 'date', '');
  var approvalDate = get(resource, 'approvalDate', '');
  var lastReviewDate = get(resource, 'lastReviewDate', '');
  var effectivePeriodStart = get(resource, 'effectivePeriod.start', '');
  var effectivePeriodEnd = get(resource, 'effectivePeriod.end', '');
  var subjectType = get(resource, 'subjectType[0]', '');
  var codeCode = get(resource, 'code[0].code', '');
  var codeDisplay = get(resource, 'code[0].display', '');
  var copyright = get(resource, 'copyright', '');
  var itemCount = get(resource, 'item', []).length;

  var statusColorMap = {
    'draft': 'warning',
    'active': 'success',
    'retired': 'default',
    'unknown': 'default'
  };

  // Build subtitle from code
  var subtitle = '';
  if (codeDisplay) {
    subtitle = codeDisplay;
    if (codeCode) {
      subtitle += ' (' + codeCode + ')';
    }
  } else if (codeCode) {
    subtitle = codeCode;
  }

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        {title}
      </Typography>

      {/* Subtitle: code display */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {name && (
            <>
              <Typography variant="overline" color="text.secondary">
                Computer Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {name}
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
                {date}
              </Typography>
            </>
          )}
          {approvalDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Approval Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {approvalDate}
              </Typography>
            </>
          )}
          {lastReviewDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Last Review Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {lastReviewDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          label={status.charAt(0).toUpperCase() + status.slice(1)}
          color={statusColorMap[status] || 'default'}
          size="small"
        />
        {subjectType && (
          <Chip label={'Subject: ' + subjectType} size="small" variant="outlined" />
        )}
        {itemCount > 0 && (
          <Chip label={itemCount + ' item(s)'} size="small" variant="outlined" />
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
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
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
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {purpose}
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
            <Typography variant="body1">
              {effectivePeriodStart || '(no start)'} to {effectivePeriodEnd || '(no end)'}
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
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {copyright}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Questionnaire ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default QuestionnairePreview;
