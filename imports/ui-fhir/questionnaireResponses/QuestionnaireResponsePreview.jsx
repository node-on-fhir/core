// /imports/ui-fhir/questionnaireResponses/QuestionnaireResponsePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'amended', label: 'Amended' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' }
];

const statusColorMap = {
  'in-progress': 'warning',
  'completed': 'success',
  'amended': 'info',
  'entered-in-error': 'error',
  'stopped': 'default'
};

function QuestionnaireResponsePreview({ resource, form, resourceId, embedded }){
  const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
  const statusColor = get(statusColorMap, form.status, 'default');
  const formattedDate = form.authored ? moment(form.authored).format('MMMM D, YYYY [at] h:mm A') : '';
  const subjectReference = get(resource, 'subject.reference', '');
  const authorReference = get(resource, 'author.reference', '');

  // Build subtitle from questionnaire display and reference
  let subtitleParts = [];
  if (form.questionnaireDisplay) {
    subtitleParts.push(form.questionnaireDisplay);
  }
  if (form.questionnaire) {
    subtitleParts.push(form.questionnaire);
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const isExistingResponse = resourceId && resourceId !== 'new';

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
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.subject || 'Unspecified'}
          </Typography>
          {subjectReference && (
            <Typography variant="caption" color="text.secondary">
              {subjectReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Authored
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {formattedDate || 'No date'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Author and Source */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Author
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.author || 'Unspecified'}
          </Typography>
          {authorReference && (
            <Typography variant="caption" color="text.secondary">
              {authorReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Source
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {form.source || 'Not specified'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status */}
      <Box sx={{ py: 2 }}>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* References */}
      {(form.basedOn || form.partOf) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            {form.basedOn && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Based On
                </Typography>
                <Typography variant="body1">
                  {form.basedOn}
                </Typography>
              </Box>
            )}
            {form.partOf && (
              <Box sx={{ textAlign: form.basedOn ? 'right' : 'left' }}>
                <Typography variant="overline" color="text.secondary">
                  Part Of
                </Typography>
                <Typography variant="body1">
                  {form.partOf}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      {(form.reasonCode || form.reasonDisplay) && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
              Reason
            </Typography>
            <Typography variant="body1">
              {form.reasonDisplay || form.reasonCode}
              {form.reasonCode && form.reasonDisplay && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  ({form.reasonCode})
                </Typography>
              )}
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
          {form.notes || 'No notes provided.'}
        </Typography>
      </Box>

      <Divider />

      {/* Footer with resource ID */}
      {isExistingResponse && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            QuestionnaireResponse ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default QuestionnaireResponsePreview;
