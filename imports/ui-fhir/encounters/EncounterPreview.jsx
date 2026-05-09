// imports/ui-fhir/encounters/EncounterPreview.jsx

import React from 'react';

import {
  Divider,
  Typography,
  Box,
  Chip
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

const statusOptions = [
  { code: 'planned', display: 'Planned' },
  { code: 'arrived', display: 'Arrived' },
  { code: 'triaged', display: 'Triaged' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'onleave', display: 'On Leave' },
  { code: 'finished', display: 'Finished' },
  { code: 'cancelled', display: 'Cancelled' }
];

function statusColor(status) {
  switch (status) {
    case 'in-progress': return 'info';
    case 'finished': return 'success';
    case 'cancelled': return 'error';
    case 'planned': return 'warning';
    case 'arrived': return 'info';
    case 'triaged': return 'warning';
    case 'onleave': return 'default';
    default: return 'default';
  }
}

function EncounterPreview({ resource, form, resourceId, embedded }) {
  // Use form (state object) if provided, otherwise fall back to resource
  var encounter = form || resource || {};

  var patientDisplay = get(encounter, 'subject.display', '');
  var patientReference = get(encounter, 'subject.reference', '');
  var practitionerDisplay = get(encounter, 'participant[0].individual.display', '');
  var practitionerReference = get(encounter, 'participant[0].individual.reference', '');
  var status = get(encounter, 'status', '');
  var statusDisplay = statusOptions.find(function(o) { return o.code === status; })?.display || status;
  var classCode = get(encounter, 'class.code', '');
  var classDisplay = get(encounter, 'class.display', '');
  var typeCode = get(encounter, 'type[0].coding[0].code', '');
  var typeDisplay = get(encounter, 'type[0].coding[0].display', '');
  var reasonCode = get(encounter, 'reasonCode[0].coding[0].code', '');
  var reasonDisplay = get(encounter, 'reasonCode[0].coding[0].display', '');
  var periodStart = get(encounter, 'period.start', '');
  var periodEnd = get(encounter, 'period.end', '');
  var noteText = get(encounter, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Type + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {typeDisplay || 'Encounter'}
        </Typography>
        <Chip
          label={statusDisplay}
          color={statusColor(status)}
          size="small"
        />
      </Box>

      {classDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {classDisplay}{classCode ? ' (' + classCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient/Practitioner */}
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
            <Typography variant="caption" color="text.secondary">
              {patientReference}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {practitionerDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Practitioner
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {practitionerDisplay}
              </Typography>
            </>
          )}
          {practitionerReference && (
            <Typography variant="caption" color="text.secondary">
              {practitionerReference}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Type & Reason */}
      {(typeCode || reasonDisplay) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            {typeCode && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Type Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {typeCode}
                </Typography>
              </Box>
            )}
            {(reasonDisplay || reasonCode) && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="overline" color="text.secondary">
                  Reason for Visit
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Period */}
      {(periodStart || periodEnd) && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
            {periodStart && (
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Start
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {moment(periodStart).format('MMM DD, YYYY HH:mm')}
                </Typography>
              </Box>
            )}
            {periodEnd && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="overline" color="text.secondary">
                  End
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {moment(periodEnd).format('MMM DD, YYYY HH:mm')}
                </Typography>
              </Box>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Notes */}
      {noteText && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Notes
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
              {noteText}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with encounter ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Encounter ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default EncounterPreview;
