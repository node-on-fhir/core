// imports/ui-fhir/medias/MediaPreview.jsx

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
  'preparation': 'warning',
  'in-progress': 'info',
  'not-done': 'default',
  'on-hold': 'warning',
  'stopped': 'error',
  'completed': 'success',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function MediaPreview({ resource, resourceId, embedded }) {
  var media = resource || {};
  var isExistingRecord = !!resourceId;

  // Core fields
  var contentTitle = get(media, 'content.title', '');
  var typeDisplay = get(media, 'type.coding[0].display', '') || get(media, 'type.text', '');
  var typeCode = get(media, 'type.coding[0].code', '');
  var statusValue = get(media, 'status', 'unknown');
  var statusColor = get(statusColorMap, statusValue, 'default');

  // Subject
  var subjectDisplay = get(media, 'subject.display', '');
  var subjectReference = get(media, 'subject.reference', '');

  // Dates
  var createdDate = get(media, 'created', '');
  var formattedCreated = createdDate ? moment(createdDate).format('MMMM D, YYYY') : '';
  var issuedDate = get(media, 'issued', '');
  var formattedIssued = issuedDate ? moment(issuedDate).format('MMMM D, YYYY') : '';

  // Modality and View
  var modalityDisplay = get(media, 'modality.coding[0].display', '') || get(media, 'modality.text', '');
  var modalityCode = get(media, 'modality.coding[0].code', '');
  var viewDisplay = get(media, 'view.coding[0].display', '') || get(media, 'view.text', '');
  var viewCode = get(media, 'view.coding[0].code', '');

  // Operator
  var operatorDisplay = get(media, 'operator[0].display', '');
  var operatorReference = get(media, 'operator[0].reference', '');

  // Body Site
  var bodySiteDisplay = get(media, 'bodySite.text', '') || get(media, 'bodySite.coding[0].display', '');

  // Reason
  var reasonDisplay = get(media, 'reasonCode[0].text', '') || get(media, 'reasonCode[0].coding[0].display', '');

  // Device
  var deviceName = get(media, 'deviceName', '');
  var deviceReference = get(media, 'device.reference', '');

  // Dimensions
  var height = get(media, 'height', '');
  var width = get(media, 'width', '');
  var frames = get(media, 'frames', '');
  var duration = get(media, 'duration', '');

  // Content
  var contentType = get(media, 'content.contentType', '');
  var contentUrl = get(media, 'content.url', '');
  var contentSize = get(media, 'content.size', '');

  // Notes
  var noteText = get(media, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 0.5 }}>
        {contentTitle || typeDisplay || 'Media'}
      </Typography>
      {typeCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          Type: {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Subject left, Date right */}
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
                <Typography variant="caption" color="text.secondary">
                  {subjectReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedCreated && (
            <>
              <Typography variant="overline" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedCreated}
              </Typography>
            </>
          )}
          {formattedIssued && (
            <>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Issued
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedIssued}
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

      {/* Modality */}
      {(modalityDisplay || modalityCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Modality
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {modalityDisplay}{modalityCode ? ' (' + modalityCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* View */}
      {(viewDisplay || viewCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              View
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {viewDisplay}{viewCode ? ' (' + viewCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Operator */}
      {(operatorDisplay || operatorReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Operator
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {operatorDisplay || 'Unspecified'}
            </Typography>
            {operatorReference && (
              <Typography variant="caption" color="text.secondary">
                {operatorReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Body Site */}
      {bodySiteDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Body Site
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {bodySiteDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      {reasonDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Device */}
      {(deviceName || deviceReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Device
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {deviceName || 'Unspecified'}
            </Typography>
            {deviceReference && (
              <Typography variant="caption" color="text.secondary">
                {deviceReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Dimensions */}
      {(height || width || frames || duration) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Dimensions
            </Typography>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {height && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Height</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{height}px</Typography>
                </Box>
              )}
              {width && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Width</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{width}px</Typography>
                </Box>
              )}
              {frames && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Frames</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{frames}</Typography>
                </Box>
              )}
              {duration && (
                <Box>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{duration}s</Typography>
                </Box>
              )}
            </Box>
          </Box>
          <Divider />
        </>
      )}

      {/* Content */}
      {(contentType || contentUrl || contentSize) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Content
            </Typography>
            {contentType && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Content Type</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{contentType}</Typography>
              </Box>
            )}
            {contentUrl && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">URL</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, wordBreak: 'break-all' }}>{contentUrl}</Typography>
              </Box>
            )}
            {contentSize && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Size</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{contentSize} bytes</Typography>
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
            Media ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MediaPreview;
