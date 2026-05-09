// imports/ui-fhir/documentReferences/DocumentReferencePreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { code: 'current', display: 'Current' },
  { code: 'superseded', display: 'Superseded' },
  { code: 'entered-in-error', display: 'Entered in Error' }
];

const statusColorMap = {
  'current': 'success',
  'superseded': 'default',
  'entered-in-error': 'error'
};

function tryDecodeBase64(value) {
  if (!value) return '';
  try {
    return atob(value);
  } catch (e) {
    console.warn('[DocumentReferencePreview] Could not base64 decode attachment.data:', e.message);
    return value;
  }
}

function DocumentReferencePreview({ resource, resourceId, embedded }) {
  var documentReference = resource || {};
  var id = resourceId || get(documentReference, '_id', '');
  var isExistingDocument = id && id !== 'new';

  var documentTitle = get(documentReference, 'content[0].attachment.title', '') || 'Untitled Document';
  var statusValue = get(documentReference, 'status', 'current');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.code === statusValue; }), 'display', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');
  var docStatusValue = get(documentReference, 'docStatus', '');
  var typeDisplay = get(documentReference, 'type.text', '') || get(documentReference, 'type.coding[0].display', '');
  var typeCode = get(documentReference, 'type.coding[0].code', '');
  var categoryDisplay = get(documentReference, 'category[0].coding[0].display', '');
  var description = get(documentReference, 'description', '');
  var documentDate = get(documentReference, 'date', '');
  var subjectDisplay = get(documentReference, 'subject.display', '');
  var subjectReference = get(documentReference, 'subject.reference', '');
  var authorDisplay = get(documentReference, 'author[0].display', '');
  var authorReference = get(documentReference, 'author[0].reference', '');
  var contentType = get(documentReference, 'content[0].attachment.contentType', '');
  var contentUrl = get(documentReference, 'content[0].attachment.url', '');
  var contentSize = get(documentReference, 'content[0].attachment.size', '');
  var custodianDisplay = get(documentReference, 'custodian.display', '');
  var noteTextRaw = get(documentReference, 'content[0].attachment.data', '');
  var noteText = tryDecodeBase64(noteTextRaw);

  var formattedDate = documentDate ? moment(documentDate).format('MMMM D, YYYY [at] h:mm A') : '';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Document title + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {documentTitle}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {typeDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {categoryDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {categoryDisplay}
              </Typography>
            </>
          )}
          {docStatusValue && (
            <>
              <Typography variant="overline" color="text.secondary">
                Document Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {docStatusValue}
              </Typography>
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

      {/* Subject + Author section */}
      {(subjectDisplay || authorDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {subjectDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Patient
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {subjectDisplay}
                  </Typography>
                  {subjectReference && (
                    <Typography variant="caption" color="text.secondary">
                      {subjectReference}
                    </Typography>
                  )}
                </Box>
              )}
              {authorDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Author
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {authorDisplay}
                  </Typography>
                  {authorReference && (
                    <Typography variant="caption" color="text.secondary">
                      {authorReference}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Content details */}
      {(contentUrl || contentType || contentSize) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {contentType && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Content Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {contentType}
                  </Typography>
                </Box>
              )}
              {contentSize && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Size
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {contentSize} bytes
                  </Typography>
                </Box>
              )}
            </Stack>
            {contentUrl && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="overline" color="text.secondary">
                  URL
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>
                  {contentUrl}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Custodian */}
      {custodianDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Custodian
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {custodianDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Description / Notes */}
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

      {noteText && (
        <>
          <Divider />
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
              {noteText}
            </Typography>
          </Box>
        </>
      )}

      <Divider />

      {/* Footer with document ID */}
      {isExistingDocument && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Document Reference ID: {id}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default DocumentReferencePreview;
