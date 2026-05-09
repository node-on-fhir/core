// imports/ui-fhir/communications/CommunicationPreview.jsx

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

const statusOptions = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'not-done', label: 'Not Done' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
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

function CommunicationPreview({ resource, resourceId, embedded }) {
  var communication = resource || {};
  var isExistingRecord = !!resourceId;

  var statusValue = get(communication, 'status', 'unknown');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(communication, 'subject.display', '');
  var patientReference = get(communication, 'subject.reference', '');

  var senderDisplay = get(communication, 'sender.display', '');
  var senderReference = get(communication, 'sender.reference', '');

  var recipientDisplay = get(communication, 'recipient.0.display', '');
  var recipientReference = get(communication, 'recipient.0.reference', '');

  var sentDate = get(communication, 'sent', '');
  var formattedSentDate = sentDate ? moment(sentDate).format('MMMM D, YYYY [at] h:mm A') : '';

  var categoryDisplay = get(communication, 'category.0.coding.0.display', '') || get(communication, 'category.0.text', '');
  var categoryCode = get(communication, 'category.0.coding.0.code', '');

  var topicDisplay = get(communication, 'topic.0.coding.0.display', '') || get(communication, 'topic.0.text', '');
  var topicCode = get(communication, 'topic.0.coding.0.code', '');

  var mediumDisplay = get(communication, 'medium.0.coding.0.display', '') || get(communication, 'medium.0.text', '');

  var reasonDisplay = get(communication, 'reasonCode.0.coding.0.display', '') || get(communication, 'reasonCode.0.text', '');
  var reasonCode = get(communication, 'reasonCode.0.coding.0.code', '');

  var payloadContent = get(communication, 'payload.0.contentString', '');
  var noteText = get(communication, 'note.0.text', '');

  // Build subtitle from category or topic
  var subtitle = categoryDisplay || topicDisplay || '';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title + subtitle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          Communication
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Sent Date right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(patientDisplay || patientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
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
          {formattedSentDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Sent
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedSentDate}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Sender and Recipient */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {(senderDisplay || senderReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Sender
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {senderDisplay || 'Unspecified'}
              </Typography>
              {senderReference && (
                <Typography variant="caption" color="text.secondary">
                  {senderReference}
                </Typography>
              )}
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {(recipientDisplay || recipientReference) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Recipient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {recipientDisplay || 'Unspecified'}
              </Typography>
              {recipientReference && (
                <Typography variant="caption" color="text.secondary">
                  {recipientReference}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Category */}
      {(categoryDisplay || categoryCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Category
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Topic */}
      {(topicDisplay || topicCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Topic
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {topicDisplay}{topicCode ? ' (' + topicCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Medium */}
      {mediumDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Medium
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {mediumDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason */}
      {(reasonDisplay || reasonCode) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Reason
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Message Content */}
      <Box sx={{ py: 3 }}>
        <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Message Content
        </Typography>
        <Typography
          variant="body1"
          sx={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            minHeight: '100px'
          }}
        >
          {payloadContent || 'No message content.'}
        </Typography>
      </Box>

      <Divider />

      {/* Notes */}
      {noteText && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Additional Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {noteText}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with record ID */}
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Communication ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CommunicationPreview;
