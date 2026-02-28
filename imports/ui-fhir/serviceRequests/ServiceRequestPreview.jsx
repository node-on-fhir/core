// imports/ui-fhir/serviceRequests/ServiceRequestPreview.jsx

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
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'revoked', label: 'Revoked' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'draft': 'default',
  'active': 'success',
  'on-hold': 'warning',
  'revoked': 'error',
  'completed': 'info',
  'entered-in-error': 'error',
  'unknown': 'default'
};

const intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'directive', label: 'Directive' },
  { value: 'order', label: 'Order' },
  { value: 'original-order', label: 'Original Order' },
  { value: 'reflex-order', label: 'Reflex Order' },
  { value: 'filler-order', label: 'Filler Order' },
  { value: 'instance-order', label: 'Instance Order' },
  { value: 'option', label: 'Option' }
];

const priorityOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'asap', label: 'ASAP' },
  { value: 'stat', label: 'STAT' }
];

function ServiceRequestPreview({ resource, resourceId, embedded }) {
  const codeDisplay = get(resource, 'code.text', '') ||
                      get(resource, 'code.coding[0].display', 'Untitled Service Request');
  const statusValue = get(resource, 'status', 'unknown');
  const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  const statusColor = get(statusColorMap, statusValue, 'default');
  const intentValue = get(resource, 'intent', '');
  const intentLabel = get(intentOptions.find(function(opt) { return opt.value === intentValue; }), 'label', intentValue);
  const priorityValue = get(resource, 'priority', '');
  const priorityLabel = get(priorityOptions.find(function(opt) { return opt.value === priorityValue; }), 'label', priorityValue);
  const patientDisplay = get(resource, 'subject.display', '');
  const patientReference = get(resource, 'subject.reference', '');
  const requesterDisplay = get(resource, 'requester.display', '');
  const performerDisplay = get(resource, 'performer[0].display', '');
  const locationDisplay = get(resource, 'locationReference[0].display', '');
  const authoredOn = get(resource, 'authoredOn', '');
  const formattedAuthoredOn = authoredOn ? moment(authoredOn).format('MMMM D, YYYY [at] h:mm A') : '';
  const occurrenceDateTime = get(resource, 'occurrenceDateTime', '');
  const formattedOccurrence = occurrenceDateTime ? moment(occurrenceDateTime).format('MMMM D, YYYY [at] h:mm A') : '';
  const categoryDisplay = get(resource, 'category[0].text', '') ||
                           get(resource, 'category[0].coding[0].display', '');
  const reasonDisplay = get(resource, 'reasonCode[0].text', '') ||
                        get(resource, 'reasonCode[0].coding[0].display', '');
  const reasonCode = get(resource, 'reasonCode[0].coding[0].code', '');
  const bodySite = get(resource, 'bodySite[0].text', '');
  const noteText = get(resource, 'note[0].text', '');
  const patientInstruction = get(resource, 'patientInstruction', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Title (code display) + Status Chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {codeDisplay}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {/* Subtitle: intent + priority */}
      {(intentLabel || priorityLabel) && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {intentLabel}{priorityLabel ? ' \u2022 ' + priorityLabel : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient/Requester (left), Date/Priority (right) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {patientDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Patient
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {patientDisplay}
              </Typography>
            </>
          )}
          {patientReference && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {patientReference}
            </Typography>
          )}
          {requesterDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Requester
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {requesterDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {formattedAuthoredOn && (
            <>
              <Typography variant="overline" color="text.secondary">
                Authored On
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedAuthoredOn}
              </Typography>
            </>
          )}
          {formattedOccurrence && (
            <>
              <Typography variant="overline" color="text.secondary">
                Occurrence
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedOccurrence}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Category, Performer, Location */}
      {(categoryDisplay || performerDisplay || locationDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Stack direction="row" spacing={4}>
              {categoryDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {categoryDisplay}
                  </Typography>
                </Box>
              )}
              {performerDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Performer
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {performerDisplay}
                  </Typography>
                </Box>
              )}
              {locationDisplay && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {locationDisplay}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
          <Divider />
        </>
      )}

      {/* Reason section */}
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

      {/* Body Site section */}
      {bodySite && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Body Site
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {bodySite}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Patient Instructions section */}
      {patientInstruction && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Patient Instructions
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
              {patientInstruction}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Notes section */}
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

      {/* Footer with ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Service Request ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ServiceRequestPreview;
