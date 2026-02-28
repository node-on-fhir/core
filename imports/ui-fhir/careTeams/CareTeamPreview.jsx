// imports/ui-fhir/careTeams/CareTeamPreview.jsx

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
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const statusColorMap = {
  'proposed': 'info',
  'active': 'success',
  'suspended': 'warning',
  'inactive': 'default',
  'entered-in-error': 'error'
};

//===========================================================================
// COMPONENT

function CareTeamPreview({ resource, resourceId, embedded }) {
  var careTeam = resource || {};
  var isExistingRecord = !!resourceId;

  var teamName = get(careTeam, 'name', 'Unnamed Care Team');
  var statusValue = get(careTeam, 'status', 'active');
  var statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
  var statusColor = get(statusColorMap, statusValue, 'default');

  var patientDisplay = get(careTeam, 'subject.display', '');
  var patientReference = get(careTeam, 'subject.reference', '');

  var categoryDisplay = get(careTeam, 'category[0].coding[0].display', '') || get(careTeam, 'category[0].text', '');
  var categoryCode = get(careTeam, 'category[0].coding[0].code', '');

  var periodStart = get(careTeam, 'period.start', '');
  var periodEnd = get(careTeam, 'period.end', '');
  var formattedStart = periodStart ? moment(periodStart).format('MMMM D, YYYY') : '';
  var formattedEnd = periodEnd ? moment(periodEnd).format('MMMM D, YYYY') : '';

  var participantMember = get(careTeam, 'participant[0].member.display', '');
  var participantRoleDisplay = get(careTeam, 'participant[0].role[0].coding[0].display', '') || get(careTeam, 'participant[0].role[0].text', '');
  var participantRoleCode = get(careTeam, 'participant[0].role[0].coding[0].code', '');
  var participantPeriodStart = get(careTeam, 'participant[0].period.start', '');
  var participantPeriodEnd = get(careTeam, 'participant[0].period.end', '');
  var formattedParticipantStart = participantPeriodStart ? moment(participantPeriodStart).format('MMMM D, YYYY') : '';
  var formattedParticipantEnd = participantPeriodEnd ? moment(participantPeriodEnd).format('MMMM D, YYYY') : '';

  var managingOrgDisplay = get(careTeam, 'managingOrganization[0].display', '');

  var noteText = get(careTeam, 'note[0].text', '');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Team name + status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {teamName}
        </Typography>
        <Chip label={statusLabel} color={statusColor} size="small" />
      </Box>

      {(categoryDisplay || categoryCode) && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: Patient left, Period right */}
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
          {(formattedStart || formattedEnd) && (
            <>
              <Typography variant="overline" color="text.secondary">
                Period
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {formattedStart}{formattedStart && formattedEnd ? ' - ' : ''}{formattedEnd}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Participant */}
      {(participantMember || participantRoleDisplay) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Participant
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {participantMember || 'Unspecified'}
            </Typography>
            {participantRoleDisplay && (
              <Typography variant="body2" color="text.secondary">
                Role: {participantRoleDisplay}{participantRoleCode ? ' (' + participantRoleCode + ')' : ''}
              </Typography>
            )}
            {(formattedParticipantStart || formattedParticipantEnd) && (
              <Typography variant="caption" color="text.secondary">
                {formattedParticipantStart}{formattedParticipantStart && formattedParticipantEnd ? ' - ' : ''}{formattedParticipantEnd}
              </Typography>
            )}
          </Box>
          <Divider />
        </>
      )}

      {/* Managing Organization */}
      {managingOrgDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Managing Organization
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {managingOrgDisplay}
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
      {isExistingRecord && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            CareTeam ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default CareTeamPreview;
