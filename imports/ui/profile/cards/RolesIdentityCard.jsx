// imports/ui/profile/cards/RolesIdentityCard.jsx
//
// Roles & identity: role chips in the header, barcode + mono id per identity,
// Practitioner/PractitionerRole ids only when present. The "Are you a
// clinician?" add-row expands into the existing practitioner link/create flow
// (no self-service role grant — linking a license sets profile.isPractitioner).

import React from 'react';
import { Box, Button } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

import ProfileBarcode from '../ProfileBarcode.jsx';
import { ProfileCardHeader, AddRow, Kicker, MonoCopyValue, AccentChip } from '../ProfilePrimitives.jsx';

export function userHasClinicianRole(user) {
  const roles = get(user, 'roles', []) || [];
  return roles.includes('clinician')
    || roles.includes('healthcare-practitioner')
    || Boolean(get(user, 'profile.isPractitioner'))
    || Boolean(get(user, 'practitionerId'));
}

function IdentityCell({ label, value, barcodeWidth = 160 }) {
  if (!value) { return null; }
  return (
    <Box sx={{ minWidth: 0 }}>
      <Kicker sx={{ display: 'block', mb: 0.5 }}>{label}</Kicker>
      <ProfileBarcode value={value} width={barcodeWidth} height={14} color="var(--pf-ink-dim)" />
      <Box sx={{ display: 'block', mt: 0.25 }}>
        <MonoCopyValue value={value} />
      </Box>
    </Box>
  );
}

export default function RolesIdentityCard({ user, onCreatePractitioner, onLinkLicense }) {
  const roles = get(user, 'roles', []) || [];
  const showAddRoleRow = !userHasClinicianRole(user);

  return (
    <Box className="pf-card" id="rolesIdentityCard">
      <ProfileCardHeader
        icon={<BadgeIcon />}
        title="Roles & identity"
        chips={
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {roles.map(function(role) { return <AccentChip key={role} label={role} />; })}
          </Box>
        }
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', p: '10px 14px 0' }}>
        <IdentityCell label="User ID" value={get(user, '_id')} barcodeWidth={160} />
        <IdentityCell label="Patient ID" value={get(user, 'patientId')} barcodeWidth={220} />
        <IdentityCell label="Practitioner ID" value={get(user, 'practitionerId')} barcodeWidth={160} />
        <IdentityCell label="PractitionerRole ID" value={get(user, 'practitionerRoleId')} barcodeWidth={160} />
      </Box>
      <Box sx={{ p: '6px 14px 14px' }}>
        {showAddRoleRow && (
          <AddRow
            id="addClinicianRoleRow"
            icon={<MedicalServicesIcon />}
            label="Are you a clinician? Add the role to link a professional license"
            rightText="Add role →"
          >
            <Box sx={{ display: 'flex', gap: 1, px: 1.75, pb: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={onCreatePractitioner}
                sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-accent)', borderColor: 'var(--pf-accent)' }}
              >
                Create practitioner record
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={onLinkLicense}
                sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-ink-mid)', borderColor: 'var(--pf-line)' }}
              >
                Link existing license
              </Button>
            </Box>
          </AddRow>
        )}
      </Box>
    </Box>
  );
}
