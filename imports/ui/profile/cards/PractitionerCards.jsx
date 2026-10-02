// imports/ui/profile/cards/PractitionerCards.jsx
//
// The clinician-side cards for state 1f: PractitionerProfileCard (replaces the
// PatientCard when practitionerId exists and patientId does not),
// ProfessionalLicenseCard (qualifications with expiry progress), and
// PractitionerRoleCard (org + ids as barcodes). Visibility rules live in the
// page; these render whatever data they're given, omitting missing pairs.

import React from 'react';
import { Box, Typography, Button, Avatar, LinearProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import VerifiedIcon from '@mui/icons-material/Verified';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';

import { get } from 'lodash';
import moment from 'moment';

import ProfileBarcode from '../ProfileBarcode.jsx';
import { ProfileCardHeader, AddRow, Kicker, MonoCopyValue, AccentChip, FadingRule, ConfirmDialog } from '../ProfilePrimitives.jsx';

function practitionerDisplayName(practitioner) {
  const name = get(practitioner, 'name[0]', {});
  if (name.text) { return name.text; }
  const parts = [
    get(name, 'prefix[0]'),
    get(name, 'given[0]'),
    Array.isArray(name.family) ? name.family[0] : name.family,
    get(name, 'suffix[0]')
  ].filter(Boolean);
  return parts.join(' ') || 'Practitioner';
}

function findNpi(practitioner) {
  const identifiers = get(practitioner, 'identifier', []) || [];
  const npi = identifiers.find(function(id) {
    return (get(id, 'system', '') || '').includes('us-npi') || (get(id, 'type.coding[0].code') === 'NPI');
  });
  return get(npi, 'value') || get(identifiers, '[0].value') || get(practitioner, 'id');
}

// ── PractitionerProfileCard (1f identity card) ───────────────────────────
export function PractitionerProfileCard({ practitioner, practitionerRole, onEdit, onUnlink, onLinkPatientRecord }) {
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = React.useState(false);
  const npi = findNpi(practitioner);
  const specialty = get(practitionerRole, 'specialty[0].text')
    || get(practitionerRole, 'specialty[0].coding[0].display')
    || get(practitionerRole, 'code[0].text')
    || get(practitionerRole, 'code[0].coding[0].display', '');
  const org = get(practitionerRole, 'organization.display', '');
  const phone = (get(practitioner, 'telecom', []) || []).find(function(t) { return t.system === 'phone' && t.value; });
  const email = (get(practitioner, 'telecom', []) || []).find(function(t) { return t.system === 'email' && t.value; });
  let photoUrl = get(practitioner, 'photo[0].url', '');
  if (!photoUrl && get(practitioner, 'photo[0].data')) {
    photoUrl = `data:${get(practitioner, 'photo[0].contentType', 'image/jpeg')};base64,${get(practitioner, 'photo[0].data')}`;
  }

  return (
    <Box className="pf-card" id="practitionerProfileCard" sx={{ p: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <ProfileBarcode value={npi} width={180} height={22} />
          <Box className="pf-mono" sx={{ color: 'var(--pf-ink-dim)', mt: 0.25 }}>
            NPI {npi}
          </Box>
        </Box>
        <Button
          size="small"
          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
          onClick={onEdit}
          sx={{ fontSize: 12, color: 'var(--pf-accent)', '&:hover': { bgcolor: 'var(--pf-accent-tint)' } }}
        >
          EDIT
        </Button>
        {onUnlink && (
          <Button
            size="small"
            startIcon={<LinkOffIcon sx={{ fontSize: 14 }} />}
            onClick={function() { setUnlinkConfirmOpen(true); }}
            sx={{ fontSize: 12, color: 'var(--pf-ink-mid)', border: '1px solid var(--pf-line)', borderRadius: '8px' }}
          >
            UNLINK
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar src={photoUrl || undefined} sx={{ width: 56, height: 56, bgcolor: 'var(--pf-accent-well)', color: 'var(--pf-accent-hi)' }}>
          {practitionerDisplayName(practitioner)[0]}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" sx={{ fontSize: 19, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--pf-ink)' }}>
            {practitionerDisplayName(practitioner)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, fontSize: 12.5, color: 'var(--pf-ink-mid)', flexWrap: 'wrap' }}>
            {specialty && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <MedicalServicesIcon sx={{ fontSize: 14 }} /> {specialty}
              </Box>
            )}
            {org && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                <BusinessIcon sx={{ fontSize: 14 }} /> {org}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <FadingRule />

      {(phone || email) && (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px' }}>
          {phone && (
            <Box>
              <Kicker icon={<PhoneIcon />}>Phone</Kicker>
              <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{phone.value}</Typography>
            </Box>
          )}
          {email && (
            <Box>
              <Kicker icon={<EmailIcon />}>Email</Kicker>
              <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', overflowWrap: 'anywhere' }}>{email.value}</Typography>
            </Box>
          )}
        </Box>
      )}

      {onLinkPatientRecord && (
        <AddRow
          icon={<LinkIcon />}
          label="You're also a patient here — link your own patient record →"
          onClick={onLinkPatientRecord}
        />
      )}

      <ConfirmDialog
        open={unlinkConfirmOpen}
        title="Unlink practitioner records"
        message="Unlink your practitioner and license records from this account? The records themselves are not deleted."
        confirmLabel="Unlink"
        onConfirm={function() { if (onUnlink) { onUnlink(); } }}
        onClose={function() { setUnlinkConfirmOpen(false); }}
      />
    </Box>
  );
}

// ── ProfessionalLicenseCard ──────────────────────────────────────────────
export function ProfessionalLicenseCard({ practitioner, onCreatePractitioner, onLinkLicense, onAddCredential }) {
  const qualifications = get(practitioner, 'qualification', []) || [];

  if (!practitioner || qualifications.length === 0) {
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }} id="professionalLicenseEmpty">
        <AddRow icon={<AddIcon />} label="Create practitioner record" onClick={onCreatePractitioner} />
        <AddRow icon={<SearchIcon />} label="Link existing license" onClick={onLinkLicense} />
      </Box>
    );
  }

  return (
    <Box className="pf-card" id="professionalLicenseCard">
      <ProfileCardHeader
        icon={<WorkspacePremiumIcon />}
        title="Professional license"
        chips={<AccentChip icon={<VerifiedIcon />} label="verified" />}
      />
      <Box sx={{ p: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {qualifications.map(function(qualification, index) {
          const issuer = get(qualification, 'issuer.display', '');
          const codeText = get(qualification, 'code.text') || get(qualification, 'code.coding[0].display', 'License');
          const identifierValue = get(qualification, 'identifier[0].value', '');
          const periodStart = get(qualification, 'period.start');
          const periodEnd = get(qualification, 'period.end');

          let remainingFraction = null;
          let remainingLabel = '';
          if (periodEnd) {
            const end = moment(periodEnd);
            remainingLabel = end.isBefore(moment())
              ? 'expired'
              : `${end.fromNow(true)} left · renewal reminder on`;
            if (periodStart) {
              const total = end.diff(moment(periodStart));
              const left = end.diff(moment());
              remainingFraction = total > 0 ? Math.max(0, Math.min(1, left / total)) : null;
            }
          }

          return (
            <Box key={index} className={index > 0 ? 'pf-row' : undefined} sx={{ pt: index > 0 ? 1.25 : 0 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <Box>
                  <Kicker sx={{ display: 'block', mb: 0.25 }}>{issuer || codeText}</Kicker>
                  <Box className="pf-mono" sx={{ color: 'var(--pf-ink)' }}>{identifierValue || codeText}</Box>
                </Box>
                {periodEnd && (
                  <Box>
                    <Kicker sx={{ display: 'block', mb: 0.25 }}>
                      Expires {moment(periodEnd).format('MMM D, YYYY')}
                    </Kicker>
                    {remainingFraction !== null && (
                      <LinearProgress
                        variant="determinate"
                        value={remainingFraction * 100}
                        sx={{
                          height: 4, borderRadius: 2,
                          bgcolor: 'var(--pf-track)',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'var(--pf-accent)',
                            boxShadow: '0 0 8px var(--pf-accent-deep)'
                          }
                        }}
                      />
                    )}
                    <Typography sx={{ fontSize: 11.5, color: 'var(--pf-ink-dim)', mt: 0.5 }}>
                      {remainingLabel}
                    </Typography>
                  </Box>
                )}
              </Box>
              {identifierValue && (
                <Box sx={{ mt: 0.75 }}>
                  <ProfileBarcode value={identifierValue} width={280} height={14} color="var(--pf-ink-dim)" />
                </Box>
              )}
            </Box>
          );
        })}
        <AddRow
          icon={<AddIcon />}
          label="Add another credential (board cert, ACLS…)"
          onClick={onAddCredential}
        />
      </Box>
    </Box>
  );
}

// ── PractitionerRoleCard ─────────────────────────────────────────────────
export function PractitionerRoleCard({ user, practitionerRole }) {
  const org = get(practitionerRole, 'organization.display', '');
  const roleText = get(practitionerRole, 'code[0].text') || get(practitionerRole, 'code[0].coding[0].display', '');

  return (
    <Box className="pf-card" id="practitionerRoleCard">
      <ProfileCardHeader icon={<MedicalServicesIcon />} title="Practitioner role" />
      <Box sx={{ p: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(org || roleText) && (
          <Box>
            <Kicker sx={{ display: 'block', mb: 0.25 }}>Organization</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>
              {[org, roleText].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {get(user, 'practitionerId') && (
            <Box>
              <Kicker sx={{ display: 'block', mb: 0.25 }}>Practitioner ID</Kicker>
              <ProfileBarcode value={get(user, 'practitionerId')} width={150} height={14} color="var(--pf-ink-dim)" />
              <Box sx={{ mt: 0.25 }}><MonoCopyValue value={get(user, 'practitionerId')} /></Box>
            </Box>
          )}
          {get(user, 'practitionerRoleId') && (
            <Box>
              <Kicker sx={{ display: 'block', mb: 0.25 }}>PractitionerRole ID</Kicker>
              <ProfileBarcode value={get(user, 'practitionerRoleId')} width={150} height={14} color="var(--pf-ink-dim)" />
              <Box sx={{ mt: 0.25 }}><MonoCopyValue value={get(user, 'practitionerRoleId')} /></Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
