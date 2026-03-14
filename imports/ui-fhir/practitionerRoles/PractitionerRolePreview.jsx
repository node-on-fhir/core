// imports/ui-fhir/practitionerRoles/PractitionerRolePreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function PractitionerRolePreview({ resource, resourceId, embedded }) {
  var practitionerDisplay = get(resource, 'practitioner.display', '');
  var practitionerReference = get(resource, 'practitioner.reference', '');
  var organizationDisplay = get(resource, 'organization.display', '');
  var organizationReference = get(resource, 'organization.reference', '');
  var isActive = get(resource, 'active', true);
  var roleCode = get(resource, 'code[0].coding[0].code', '');
  var roleDisplay = get(resource, 'code[0].text', get(resource, 'code[0].coding[0].display', ''));
  var specialtyCode = get(resource, 'specialty[0].coding[0].code', '');
  var specialtyDisplay = get(resource, 'specialty[0].text', get(resource, 'specialty[0].coding[0].display', ''));
  var phone = '';
  var email = '';
  var telecom = get(resource, 'telecom', []);
  for (var i = 0; i < telecom.length; i++) {
    if (telecom[i].system === 'phone' && !phone) {
      phone = telecom[i].value || '';
    }
    if (telecom[i].system === 'email' && !email) {
      email = telecom[i].value || '';
    }
  }
  var periodStart = get(resource, 'period.start', '');
  var periodEnd = get(resource, 'period.end', '');
  var availabilityExceptions = get(resource, 'availabilityExceptions', '');

  // Build the subtitle
  var subtitleParts = [];
  if (roleDisplay) {
    subtitleParts.push(roleDisplay);
  } else if (roleCode) {
    subtitleParts.push(roleCode);
  }
  if (specialtyDisplay) {
    subtitleParts.push(specialtyDisplay);
  } else if (specialtyCode) {
    subtitleParts.push(specialtyCode);
  }
  var subtitle = subtitleParts.join(' - ');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Practitioner name + active chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {practitionerDisplay || 'Unnamed Practitioner Role'}
        </Typography>
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {/* Subtitle: role / specialty */}
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {practitionerReference && (
            <>
              <Typography variant="overline" color="text.secondary">
                Practitioner Reference
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {practitionerReference}
              </Typography>
            </>
          )}
          {organizationDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Organization
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {organizationDisplay}
              </Typography>
            </>
          )}
          {organizationReference && (
            <>
              <Typography variant="overline" color="text.secondary">
                Organization Reference
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {organizationReference}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {phone && (
            <>
              <Typography variant="overline" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {phone}
              </Typography>
            </>
          )}
          {email && (
            <>
              <Typography variant="overline" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {email}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chip */}
      <Box sx={{ py: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
        {roleCode && (
          <Chip label={roleCode} size="small" variant="outlined" />
        )}
        {specialtyCode && (
          <Chip label={specialtyCode} size="small" variant="outlined" />
        )}
      </Box>

      <Divider />

      {/* Period */}
      {(periodStart || periodEnd) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Period
            </Typography>
            <Typography variant="body1">
              {periodStart || '(no start)'} to {periodEnd || '(no end)'}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Availability Exceptions */}
      {availabilityExceptions && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Availability Exceptions
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {availabilityExceptions}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with resource ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            PractitionerRole ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PractitionerRolePreview;
