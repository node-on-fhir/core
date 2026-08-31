// imports/ui-fhir/compositions/CompositionPreview.jsx

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
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'entered-in-error': 'error'
};

// Section narratives may come from external systems — never inject the XHTML.
// Extract plain text instead (tags stripped, basic entities decoded); the
// pdf-parser generated sections are plain OCR text anyway.
export function narrativeToPlainText(xhtml) {
  if (typeof xhtml !== 'string' || !xhtml) { return ''; }
  return xhtml
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();
}

//===========================================================================
// COMPONENT

function CompositionPreview({ resource, resourceId, embedded }) {
  var composition = resource || {};
  var isExistingRecord = !!resourceId;

  var title = get(composition, 'title', 'Untitled Composition');
  var statusValue = get(composition, 'status', 'preliminary');
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(composition, 'subject.display', '');
  var patientReference = get(composition, 'subject.reference', '');

  var compositionDate = get(composition, 'date', '');
  var formattedDate = compositionDate ? moment(compositionDate).format('MMMM D, YYYY') : '';

  var categoryDisplay = get(composition, 'category[0].display', '') || get(composition, 'category[0].text', '');

  var encounterDisplay = get(composition, 'encounter.display', '');
  var encounterReference = get(composition, 'encounter.reference', '');

  var authorDisplay = get(composition, 'author[0].display', '');
  var authorReference = get(composition, 'author[0].reference', '');

  var typeDisplay = get(composition, 'type.coding[0].display', '') || get(composition, 'type.text', '');
  var typeCode = get(composition, 'type.coding[0].code', '') || get(composition, 'type.coding.0.code', '');

  var sections = get(composition, 'section', []) || [];

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        <Chip label={statusValue} color={statusColor} size="small" />
      </Box>

      {typeDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Subject
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
                Date
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip section */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Status
        </Typography>
        <Chip label={statusValue} color={statusColor} size="small" />
      </Box>

      <Divider />

      {/* Category */}
      {categoryDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {categoryDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Author */}
      {(authorDisplay || authorReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Author
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {authorDisplay || 'Unspecified'}
            </Typography>
            {authorReference && (
              <Typography variant="caption" color="text.secondary">
                {authorReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Encounter */}
      {(encounterDisplay || encounterReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Encounter
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {encounterDisplay || 'Unspecified'}
            </Typography>
            {encounterReference && (
              <Typography variant="caption" color="text.secondary">
                {encounterReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Section narratives — e.g. the generated text from PDF parsing.
          Rendered as extracted plain text (never raw XHTML injection). */}
      {sections.length > 0 && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Document Content
            </Typography>
            {sections.map(function(section, index) {
              var sectionText = narrativeToPlainText(get(section, 'text.div', ''));
              return (
                <Box key={index} sx={{ mb: 2 }}>
                  {get(section, 'title') && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {get(section, 'title')}
                    </Typography>
                  )}
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 1,
                    fontSize: '0.85rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    overflowWrap: 'break-word'
                  }}>
                    {sectionText || <em>No narrative text</em>}
                  </Box>
                </Box>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Composition ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CompositionPreview;
