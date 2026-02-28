// /imports/ui-fhir/appointments/AppointmentPreview.jsx

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
  'proposed': 'default',
  'pending': 'warning',
  'booked': 'info',
  'arrived': 'info',
  'fulfilled': 'success',
  'cancelled': 'error',
  'noshow': 'error',
  'entered-in-error': 'error',
  'checked-in': 'info',
  'waitlist': 'warning'
};

function AppointmentPreview({ resource, resourceId, embedded }){
  const status = get(resource, 'status', '');
  const statusColor = get(statusColorMap, status, 'default');

  // Build subtitle from appointment type and service type
  let subtitleParts = [];
  if (get(resource, 'appointmentType.text')) {
    subtitleParts.push(get(resource, 'appointmentType.text'));
  }
  if (get(resource, 'serviceType[0].text')) {
    subtitleParts.push(get(resource, 'serviceType[0].text'));
  }
  const subtitle = subtitleParts.join(' \u2014 ');

  const startFormatted = get(resource, 'start') ? moment(get(resource, 'start')).format('MMMM D, YYYY h:mm A') : '';
  const endFormatted = get(resource, 'end') ? moment(get(resource, 'end')).format('MMMM D, YYYY h:mm A') : '';

  // Collect non-patient participants
  const participants = get(resource, 'participant', []).filter(function(p){
    return !get(p, 'actor.reference', '').startsWith('Patient/');
  });

  const isExisting = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Subtitle */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient and Start Time */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Patient
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'subject.display', '') || 'Unspecified'}
          </Typography>
          {get(resource, 'subject.reference') && (
            <Typography variant="caption" color="text.secondary">
              {get(resource, 'subject.reference')}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Start
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {startFormatted || 'Not scheduled'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {status && (
          <Chip label={'Status: ' + status} color={statusColor} size="small" />
        )}
        {get(resource, 'priority') !== undefined && (
          <Chip label={'Priority: ' + get(resource, 'priority')} color="default" size="small" variant="outlined" />
        )}
        {get(resource, 'minutesDuration') && (
          <Chip label={get(resource, 'minutesDuration') + ' min'} color="default" size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Schedule details */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Start Time
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {startFormatted || 'Not set'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            End Time
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {endFormatted || 'Not set'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Reason */}
      {get(resource, 'reasonCode[0].text') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Reason
            </Typography>
            <Typography variant="body1">
              {get(resource, 'reasonCode[0].text')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Description */}
      {get(resource, 'description') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Description
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'description')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Comment */}
      {get(resource, 'comment') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Comment
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'comment')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Patient Instructions */}
      {get(resource, 'patientInstruction') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Patient Instructions
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'patientInstruction')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Service details */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Service Category
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'serviceCategory[0].text', '') || 'Unspecified'}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="overline" color="text.secondary">
            Specialty
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {get(resource, 'specialty[0].text', '') || 'Unspecified'}
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* Participants */}
      {participants.length > 0 && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Participants
            </Typography>
            {participants.map(function(participant, index){
              const actorDisplay = get(participant, 'actor.display', '');
              const actorReference = get(participant, 'actor.reference', '');
              return (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {actorDisplay || actorReference || 'Unknown participant'}
                  </Typography>
                  {actorReference && actorDisplay && (
                    <Typography variant="caption" color="text.secondary">
                      {actorReference}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      {get(resource, 'note[0].text') && (
        <>
          <Box sx={{ py: 2.5 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Notes
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {get(resource, 'note[0].text')}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with ID */}
      {isExisting && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Appointment ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default AppointmentPreview;
