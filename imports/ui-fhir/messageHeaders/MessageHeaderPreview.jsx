// imports/ui-fhir/messageHeaders/MessageHeaderPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const responseCodeOptions = [
  { value: 'ok', display: 'OK' },
  { value: 'transient-error', display: 'Transient Error' },
  { value: 'fatal-error', display: 'Fatal Error' }
];

const responseCodeColorMap = {
  'ok': 'success',
  'transient-error': 'warning',
  'fatal-error': 'error'
};

//===========================================================================
// COMPONENT

function MessageHeaderPreview({ resource, resourceId, embedded }) {
  var messageHeader = resource || {};

  var eventDisplay = get(messageHeader, 'eventCoding.display', '') || get(messageHeader, 'eventCoding.code', 'No Event Type');
  var eventCode = get(messageHeader, 'eventCoding.code', '');
  var eventUri = get(messageHeader, 'eventUri', '');

  var destinationName = get(messageHeader, 'destination[0].name', '');
  var destinationEndpoint = get(messageHeader, 'destination[0].endpoint', '');
  var destinationTargetRef = get(messageHeader, 'destination[0].target.reference', '');
  var destinationTargetDisplay = get(messageHeader, 'destination[0].target.display', '');

  var senderDisplay = get(messageHeader, 'sender.display', '');
  var senderReference = get(messageHeader, 'sender.reference', '');

  var sourceName = get(messageHeader, 'source.name', '');
  var sourceEndpoint = get(messageHeader, 'source.endpoint', '');
  var sourceSoftware = get(messageHeader, 'source.software', '');
  var sourceVersion = get(messageHeader, 'source.version', '');

  var reasonDisplay = get(messageHeader, 'reason.coding[0].display', '') || get(messageHeader, 'reason.text', '');
  var reasonCode = get(messageHeader, 'reason.coding[0].code', '');

  var responseIdentifier = get(messageHeader, 'response.identifier', '');
  var responseCode = get(messageHeader, 'response.code', '');
  var responseLabel = get(responseCodeOptions.find(function(o) { return o.value === responseCode; }), 'display', responseCode);
  var responseColor = get(responseCodeColorMap, responseCode, 'default');

  var focusReference = get(messageHeader, 'focus[0].reference', '');
  var focusDisplay = get(messageHeader, 'focus[0].display', '');

  var definition = get(messageHeader, 'definition', '');
  var noteText = get(messageHeader, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Event type + response code chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {eventDisplay}
        </Typography>
        {responseCode && (
          <Chip
            label={responseLabel}
            color={responseColor}
            size="small"
          />
        )}
      </Box>

      {eventCode && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Code: {eventCode}
          {eventUri ? ' | URI: ' + eventUri : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Sender left, Source right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(senderDisplay || senderReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Sender
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {senderDisplay || 'Unspecified'}
              </Typography>
              {senderReference && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  {senderReference}
                </Typography>
              )}
            </>
          )}
          {reasonDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Reason
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {sourceName && (
            <>
              <Typography variant="overline" color="text.secondary">
                Source
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {sourceName}
              </Typography>
            </>
          )}
          {(sourceSoftware || sourceVersion) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Software
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {sourceSoftware}{sourceVersion ? ' v' + sourceVersion : ''}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Destination section */}
      {(destinationName || destinationEndpoint) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Destination
            </Typography>
            {destinationName && (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {destinationName}
              </Typography>
            )}
            {destinationEndpoint && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Endpoint: {destinationEndpoint}
              </Typography>
            )}
            {(destinationTargetDisplay || destinationTargetRef) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Target: {destinationTargetDisplay || destinationTargetRef}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Source endpoint */}
      {sourceEndpoint && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Source Endpoint
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {sourceEndpoint}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Response section */}
      {responseIdentifier && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Response Identifier
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {responseIdentifier}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Focus section */}
      {(focusDisplay || focusReference) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Focus
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {focusDisplay || focusReference}
            </Typography>
            {focusDisplay && focusReference && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {focusReference}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Definition */}
      {definition && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Definition
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {definition}
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
            MessageHeader ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default MessageHeaderPreview;
