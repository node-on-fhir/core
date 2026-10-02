// /imports/patient/PatientCard.jsx
//
// The canonical patient identity card. Two render branches:
//   layout="profile" — the go-forward Nocturne presentation (badge/portrait/
//     stamp variants, photo, conditional edit affordances). Self-sufficient:
//     it carries its own --pf-* vars + card surface styles, so it renders
//     correctly on any page (/my-profile, /patient-chart, …). Editable when
//     the onEdit/onUnlink/onPhotoUpload/onPhotoDelete callbacks are provided;
//     read-only (no affordances rendered) when they are omitted.
//   layout="legacy" (default) — the original card, kept for existing
//     prop-driven consumers (Dashboard sidebar, external callers). Migrate
//     opportunistically; don't mass-rewrite.

import React from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,
  CardContent,
  CardMedia,
  Typography, 
  Box,
  Grid,
  Stack,
  Avatar,
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';

import _ from 'lodash';
let get = _.get;

import moment from 'moment';

import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  Badge as BadgeIcon,
  LocalHospital as LocalHospitalIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  FamilyRestroom as FamilyIcon,
  Edit as EditIcon,
  LinkOff as LinkOffIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Female as FemaleIcon,
  Male as MaleIcon,
  Place as PlaceIcon,
  Print as PrintIcon,
  Business as BusinessIcon
} from '@mui/icons-material';

import { IconButton, Button } from '@mui/material';

import ProfileBarcode from '/imports/ui/profile/ProfileBarcode.jsx';
import { MonoCopyValue, FadingRule, Kicker, ConfirmDialog } from '/imports/ui/profile/ProfilePrimitives.jsx';
import { buildProfileVarMap } from '/imports/ui/profile/profileVars.js';

const AVATAR_VARIANTS = ['badge', 'portrait', 'stamp'];

function PatientCard({
  id,
  identifier,
  active,
  familyName,
  givenName,
  fullName,
  email,
  birthDate,
  gender,
  avatar,
  patient,
  showBarcode = false,
  showDetails = true,
  showSummary = false,
  showName = true,
  avatarUrlHostname = '',
  cardMediaWidth = '300px',
  // ── Profile (Nocturne) layout — design_handoff_my_profile ──────────────
  layout = 'legacy',              // 'legacy' (default, unchanged) | 'profile'
  avatarVariant,                  // 'badge' (default) | 'portrait' | 'stamp'
  onEdit,
  onUnlink,                       // UNLINK button renders only when provided
  onPhotoUpload,
  onPhotoDelete,
  onPrint,                        // stamp variant: print the ID card
  completionScore,                // <50 & no photo → dashed drop-zone
  ...props
}){
  console.debug('PatientCard v0.10.60'); // phi-audit: ok
  const theme = useTheme();
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = React.useState(false);

  // The handoff names the variant prop `avatar`; the legacy API already uses
  // `avatar` for an image URL, so `avatarVariant` wins and the variant names
  // are accepted through `avatar` only as an alias.
  const resolvedAvatarVariant = avatarVariant
    || (AVATAR_VARIANTS.includes(avatar) ? avatar : 'badge');

  // Extract comprehensive FHIR Patient data
  let patientData = {
    id: '',
    fullName: '',
    familyName: '',
    givenName: '',
    middleName: '',
    prefix: '',
    suffix: '',
    identifier: '',
    identifiers: [],
    birthDate: '',
    age: '',
    gender: '',
    avatar: '',
    email: '',
    phone: '',
    address: {
      line: [],
      city: '',
      state: '',
      postalCode: '',
      country: ''
    },
    maritalStatus: '',
    language: '',
    race: '',
    ethnicity: '',
    deceased: false,
    deceasedDateTime: '',
    active: true,
    generalPractitioner: '',
    managingOrganization: '',
    telecom: [],
    contact: []
  };

  if(patient){
    // Basic demographics
    patientData.id = get(patient, 'id', '');
    patientData.fullName = get(patient, 'name[0].text', '');
    patientData.prefix = get(patient, 'name[0].prefix[0]', '');
    patientData.suffix = get(patient, 'name[0].suffix[0]', '');
    
    if(Array.isArray(get(patient, 'name[0].family'))){
      patientData.familyName = get(patient, 'name[0].family[0]', '');        
    } else {
      patientData.familyName = get(patient, 'name[0].family', '');        
    }

    patientData.givenName = get(patient, 'name[0].given[0]', '');
    patientData.middleName = get(patient, 'name[0].given[1]', '');

    // Identifiers
    patientData.identifier = get(patient, 'identifier[0].value', '');
    if(Array.isArray(patient.identifier)){
      patientData.identifiers = patient.identifier;
    }

    // Birth and death info
    patientData.birthDate = get(patient, 'birthDate', '');
    if(patientData.birthDate){
      patientData.age = moment().diff(moment(patientData.birthDate), 'years');
    }
    patientData.deceased = get(patient, 'deceasedBoolean', false);
    patientData.deceasedDateTime = get(patient, 'deceasedDateTime', '');

    // Gender and status
    patientData.gender = get(patient, 'gender', '');
    patientData.active = get(patient, 'active', true);
    patientData.maritalStatus = get(patient, 'maritalStatus.coding[0].display', '') || get(patient, 'maritalStatus.text', '');

    // Communication
    patientData.language = get(patient, 'communication[0].language.coding[0].display', '') || get(patient, 'communication[0].language.text', '');
    
    // Contact info
    if(Array.isArray(patient.telecom)){
      patient.telecom.forEach(telecom => {
        if(telecom.system === 'email' && telecom.value){
          patientData.email = telecom.value;
        }
        if(telecom.system === 'phone' && telecom.value){
          patientData.phone = telecom.value;
        }
      });
      patientData.telecom = patient.telecom;
    }

    // Address
    if(get(patient, 'address[0]')){
      patientData.address.line = get(patient, 'address[0].line', []);
      patientData.address.city = get(patient, 'address[0].city', '');
      patientData.address.state = get(patient, 'address[0].state', '');
      patientData.address.postalCode = get(patient, 'address[0].postalCode', '');
      patientData.address.country = get(patient, 'address[0].country', '');
    }

    // Photo
    if(avatarUrlHostname){
      patientData.avatar = avatarUrlHostname + get(patient, 'photo[0].url', '');
    } else {
      patientData.avatar = get(patient, 'photo[0].url', '');
    }

    // Extensions for US Core
    if(Array.isArray(patient.extension)){
      patient.extension.forEach(ext => {
        if(ext.url && ext.url.includes('race')){
          patientData.race = get(ext, 'valueCodeableConcept.coding[0].display', '');
        }
        if(ext.url && ext.url.includes('ethnicity')){
          patientData.ethnicity = get(ext, 'valueCodeableConcept.coding[0].display', '');
        }
      });
    }

    // Provider info
    patientData.generalPractitioner = get(patient, 'generalPractitioner[0].display', '');
    patientData.managingOrganization = get(patient, 'managingOrganization.display', '');

    // Emergency contacts
    if(Array.isArray(patient.contact)){
      patientData.contact = patient.contact;
    }
  } else {
    // Fallback to props
    patientData.id = id;
    patientData.fullName = fullName;
    patientData.familyName = familyName;
    patientData.givenName = givenName;
    patientData.email = email;
    patientData.birthDate = birthDate;
    patientData.gender = gender;
    patientData.avatar = avatar;
    patientData.identifier = identifier;
  }

  // Format full name if not provided
  if(!patientData.fullName && (patientData.givenName || patientData.familyName)){
    patientData.fullName = `${patientData.prefix ? patientData.prefix + ' ' : ''}${patientData.givenName} ${patientData.middleName ? patientData.middleName + ' ' : ''}${patientData.familyName}${patientData.suffix ? ' ' + patientData.suffix : ''}`.trim();
  }

  // Helper function to format address
  const formatAddress = (address) => {
    let parts = [];
    if(address.line && address.line.length > 0){
      parts.push(address.line.join(' '));
    }
    if(address.city) parts.push(address.city);
    if(address.state) parts.push(address.state);
    if(address.postalCode) parts.push(address.postalCode);
    return parts.join(', ');
  };

  // Helper function to get gender icon and color
  const getGenderDisplay = (gender) => {
    const lowerGender = (gender || '').toLowerCase();
    switch(lowerGender){
      case 'male':
        return { icon: '♂', color: theme.palette.info.main };
      case 'female':
        return { icon: '♀', color: theme.palette.error.main };
      default:
        return { icon: '•', color: theme.palette.grey[600] };
    }
  };

  // ── Profile (Nocturne) layout ──────────────────────────────────────────
  if(layout === 'profile'){
    // Self-sufficiency: carry the Nocturne vars + .pf-card surface styles on
    // the card root, so the profile layout renders correctly on pages that
    // don't inject the .profile-page stylesheet (e.g. /patient-chart).
    // Inside /my-profile this re-declares identical values — harmless.
    const pfCardSx = {
      ...buildProfileVarMap(theme),
      bgcolor: 'var(--pf-surface)',
      borderRadius: '8px',
      boxShadow: '0 0 0 1px var(--pf-ring)',
      overflow: 'hidden'
    };

    let photoUrl = patientData.avatar;
    if(!photoUrl && get(patient, 'photo[0].data')){
      photoUrl = `data:${get(patient, 'photo[0].contentType', 'image/jpeg')};base64,${get(patient, 'photo[0].data')}`;
    }
    const initials = `${(patientData.givenName || '?')[0] || ''}${(patientData.familyName || '')[0] || ''}`.toUpperCase();
    const useDropZone = !photoUrl && typeof completionScore === 'number' && completionScore < 50;

    const monogram = (
      <Box sx={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: 'var(--pf-accent-well)',
        color: 'var(--pf-accent-hi)',
        fontSize: 26, fontWeight: 500
      }}>
        {initials || '?'}
      </Box>
    );

    const dropZone = (
      <Box
        onClick={onPhotoUpload}
        sx={{
          width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
          border: '1px dashed var(--pf-accent-deep)',
          color: 'var(--pf-accent)',
          cursor: onPhotoUpload ? 'pointer' : 'default'
        }}
      >
        <PhotoCameraIcon sx={{ fontSize: 18 }} />
        <Typography sx={{ fontSize: 10 }}>Add photo</Typography>
      </Box>
    );

    const photoOverlayButtons = (
      <Box sx={{
        position: 'absolute', bottom: 6, right: 6,
        display: 'flex', gap: 0.5,
        bgcolor: 'color-mix(in srgb, var(--pf-canvas) 85%, transparent)',
        borderRadius: '6px', p: '2px'
      }}>
        {onPhotoUpload && (
          <IconButton size="small" onClick={onPhotoUpload} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
            <PhotoCameraIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        {photoUrl && onPhotoDelete && (
          <IconButton size="small" onClick={onPhotoDelete} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
            <DeleteIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>
    );

    const editButton = onEdit ? (
      <Button
        id="patientCardEditButton"
        size="small"
        startIcon={<EditIcon sx={{ fontSize: 14 }} />}
        onClick={onEdit}
        sx={{ fontSize: 12, color: 'var(--pf-accent)', minWidth: 0, '&:hover': { bgcolor: 'var(--pf-accent-tint)' } }}
      >
        EDIT
      </Button>
    ) : null;

    const unlinkButton = onUnlink ? (
      <Button
        id="patientCardUnlinkButton"
        size="small"
        startIcon={<LinkOffIcon sx={{ fontSize: 14 }} />}
        onClick={function(){ setUnlinkConfirmOpen(true); }}
        sx={{ fontSize: 12, color: 'var(--pf-ink-mid)', border: '1px solid var(--pf-line)', borderRadius: '8px', '&:hover': { bgcolor: 'var(--pf-accent-tint)' } }}
      >
        UNLINK
      </Button>
    ) : null;

    const barcodeHeader = (
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* The barcode IS the patient id (Code 39 text — tooltip shows it,
              click copies it), so it isn't repeated inline below. */}
          <ProfileBarcode value={patientData.id} width={220} height={22} />
          {patientData.identifier && (
            <Box sx={{ display: 'block' }}>
              <MonoCopyValue value={patientData.identifier} prefix="MRN" head={12} tail={6} />
            </Box>
          )}
        </Box>
        {resolvedAvatarVariant !== 'portrait' && (
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, flexDirection: 'column', alignItems: 'flex-end' }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {editButton}
              {unlinkButton}
            </Box>
            {resolvedAvatarVariant === 'stamp' && onPrint && (
              <IconButton size="small" onClick={onPrint} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
                <PrintIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        )}
      </Box>
    );

    const genderIcon = (patientData.gender || '').toLowerCase() === 'female'
      ? <FemaleIcon sx={{ fontSize: 14 }} />
      : (patientData.gender || '').toLowerCase() === 'male'
        ? <MaleIcon sx={{ fontSize: 14 }} />
        : <PersonIcon sx={{ fontSize: 14 }} />;

    const demographicsRow = (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.75, fontSize: 12.5, color: 'var(--pf-ink-mid)', alignItems: 'center' }}>
        {patientData.birthDate && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <CakeIcon sx={{ fontSize: 14 }} />
            {moment(patientData.birthDate).format('MMM D, YYYY')}{patientData.age !== '' ? ` · ${patientData.age}y` : ''}
          </Box>
        )}
        {patientData.gender && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, textTransform: 'capitalize' }}>
            {genderIcon}
            {patientData.gender}
          </Box>
        )}
        {patientData.maritalStatus && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 14 }} />
            {patientData.maritalStatus}
          </Box>
        )}
        {patientData.language && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <LanguageIcon sx={{ fontSize: 14 }} />
            {patientData.language}
          </Box>
        )}
        {resolvedAvatarVariant === 'portrait' && !photoUrl && onPhotoUpload && (
          <Box component="span" onClick={onPhotoUpload} sx={{ color: 'var(--pf-accent)', cursor: 'pointer', fontSize: 12.5 }}>
            Add a portrait
          </Box>
        )}
      </Box>
    );

    const contactGrid = (patientData.phone || patientData.email || formatAddress(patientData.address)) ? (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.6fr', gap: '10px' }}>
        {patientData.phone && (
          <Box>
            <Kicker icon={<PhoneIcon />}>Phone</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{patientData.phone}</Typography>
          </Box>
        )}
        {patientData.email && (
          <Box>
            <Kicker icon={<EmailIcon />}>Email</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)', overflowWrap: 'anywhere' }}>{patientData.email}</Typography>
          </Box>
        )}
        {formatAddress(patientData.address) && (
          <Box>
            <Kicker icon={<PlaceIcon />}>Address</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{formatAddress(patientData.address)}</Typography>
          </Box>
        )}
      </Box>
    ) : null;

    const providerGrid = (patientData.generalPractitioner || patientData.managingOrganization) ? (
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {patientData.generalPractitioner && (
          <Box>
            <Kicker icon={<LocalHospitalIcon />}>General practitioner</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{patientData.generalPractitioner}</Typography>
          </Box>
        )}
        {patientData.managingOrganization && (
          <Box>
            <Kicker icon={<BusinessIcon />}>Managing organization</Kicker>
            <Typography sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>{patientData.managingOrganization}</Typography>
          </Box>
        )}
      </Box>
    ) : null;

    const nameHeading = (
      <Typography variant="h3" sx={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--pf-ink)', lineHeight: 1.2 }}>
        {patientData.fullName}
      </Typography>
    );

    // Parity with the legacy layout: deceased status + emergency contacts
    const deceasedChip = (patientData.deceased || patientData.deceasedDateTime) ? (
      <Box sx={{ display: 'flex' }}>
        <Chip
          size="small"
          color="error"
          variant="outlined"
          label={'Deceased' + (patientData.deceasedDateTime ? ' · ' + moment(patientData.deceasedDateTime).format('MMM D, YYYY') : '')}
          sx={{ fontSize: 11, height: 20 }}
        />
      </Box>
    ) : null;

    const emergencyContacts = (patientData.contact || []).length > 0 ? (
      <Box>
        <Kicker icon={<PeopleIcon />}>Emergency contacts</Kicker>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
          {(patientData.contact || []).map(function(contact, index){
            const relationship = get(contact, 'relationship[0].coding[0].display', 'Contact');
            const contactName = get(contact, 'name.text') || get(contact, 'name.given[0]', '');
            const telecomValue = get(contact, 'telecom[0].value', '');
            return (
              <Typography key={index} sx={{ fontSize: 13, color: 'var(--pf-ink)' }}>
                <Box component="span" sx={{ color: 'var(--pf-ink-mid)' }}>{relationship}:</Box>
                {' '}{contactName}{telecomValue ? ' — ' + telecomValue : ''}
              </Typography>
            );
          })}
        </Box>
      </Box>
    ) : null;

    const unlinkDialog = (
      <ConfirmDialog
        open={unlinkConfirmOpen}
        title="Unlink patient record"
        message="Unlink this patient record from your account? The record itself is not deleted."
        confirmLabel="Unlink"
        onConfirm={function(){ if(onUnlink){ onUnlink(); } }}
        onClose={function(){ setUnlinkConfirmOpen(false); }}
      />
    );

    // ── stamp (1d): 56×72 thumbnail beside a 30px barcode ────────────────
    if(resolvedAvatarVariant === 'stamp'){
      return (
        <Box className="pf-card pf-card--patient" sx={{ ...pfCardSx, p: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{
              width: 56, height: 72, flexShrink: 0,
              borderRadius: '3px',
              boxShadow: '0 0 0 1px var(--pf-ink-faint)',
              overflow: 'hidden'
            }}>
              {photoUrl ? (
                <Box component="img" src={photoUrl} alt={patientData.fullName} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Box sx={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'repeating-linear-gradient(45deg, var(--pf-well) 0 4px, var(--pf-surface) 4px 8px)',
                  color: 'var(--pf-ink-dim)', fontSize: 9
                }}>
                  PHOTO
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <ProfileBarcode value={patientData.id} width={220} height={30} />
              <Box className="pf-mono" sx={{ color: 'var(--pf-ink-dim)', mt: 0.5 }}>
                {patientData.identifier ? `MRN ${patientData.identifier} · ` : ''}
                {patientData.birthDate ? `DOB ${patientData.birthDate} · ` : ''}
                {patientData.gender ? `SEX ${patientData.gender[0].toUpperCase()}` : ''}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {editButton}
                {unlinkButton}
              </Box>
              {onPrint && (
                <IconButton size="small" onClick={onPrint} sx={{ width: 28, height: 28, color: 'var(--pf-ink-mid)', '&:hover': { bgcolor: 'var(--pf-accent-tint)', color: 'var(--pf-accent)' } }}>
                  <PrintIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          </Box>
          {nameHeading}
          {demographicsRow}
          <FadingRule />
          {contactGrid}
          {providerGrid}
          {unlinkDialog}
        </Box>
      );
    }

    // ── portrait (1c): 190px right column, lighten-blended ───────────────
    if(resolvedAvatarVariant === 'portrait'){
      return (
        <Box className="pf-card pf-card--patient" sx={{ ...pfCardSx, display: 'grid', gridTemplateColumns: photoUrl ? { xs: '1fr', sm: 'minmax(0, 1fr) 190px' } : 'minmax(0, 1fr)' }}>
          <Box sx={{ p: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
            {barcodeHeader}
            {nameHeading}
            {demographicsRow}
            {deceasedChip}
            <FadingRule />
            {contactGrid}
            {providerGrid}
            {emergencyContacts}
          </Box>
          {photoUrl && (
            <Box sx={{ position: 'relative', minHeight: 190 }}>
              <Box component="img" src={photoUrl} alt={patientData.fullName} sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', mixBlendMode: 'lighten'
              }} />
              <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(90deg, var(--pf-surface), transparent 45%)'
              }} />
              <Box sx={{
                position: 'absolute', top: 6, right: 6,
                display: 'flex', gap: 0.5,
                bgcolor: 'color-mix(in srgb, var(--pf-surface) 85%, transparent)',
                borderRadius: '6px', p: '2px'
              }}>
                {editButton}
                {unlinkButton}
              </Box>
            </Box>
          )}
          {unlinkDialog}
        </Box>
      );
    }

    // ── badge (1a, default): 148px photo column | text column ────────────
    return (
      <Box className="pf-card pf-card--patient" sx={{ ...pfCardSx, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '148px minmax(0, 1fr)' } }}>
        <Box className="pf-photo-col" sx={{ position: 'relative', minHeight: 190, bgcolor: 'var(--pf-well)' }}>
          {photoUrl ? (
            <>
              <Box component="img" src={photoUrl} alt={patientData.fullName} sx={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'
              }} />
              {photoOverlayButtons}
            </>
          ) : useDropZone ? dropZone : (
            <>
              {monogram}
              {photoOverlayButtons}
            </>
          )}
        </Box>
        <Box sx={{ p: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          {barcodeHeader}
          {nameHeading}
          {demographicsRow}
          {deceasedChip}
          <FadingRule />
          {contactGrid}
          {providerGrid}
          {emergencyContacts}
        </Box>
        {unlinkDialog}
      </Box>
    );
  }

  // Empty state
  if(!patient && !patientData.fullName && !patientData.identifier){
    return (
      <Card sx={{ minHeight: '200px', mb: 5, opacity: 0.7 }}>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Patient Demographics Unavailable
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please select a patient.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const genderDisplay = getGenderDisplay(patientData.gender);

  return (
    <Card 
      sx={{ 
        width: '100%',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.95) : 'rgba(255, 255, 255, 0.95)',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        mb: 0,
        '&:hover': {
          boxShadow: theme.shadows[3]
        }
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Avatar Section */}
        {patientData.avatar && (
          <CardMedia
            component="img"
            sx={{ 
              width: { xs: '100%', md: cardMediaWidth },
              height: { xs: 200, md: 'auto' },
              objectFit: 'cover'
            }}
            image={patientData.avatar}
            alt={patientData.fullName}
          />
        )}

        {/* Content Section */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {/* Barcode in upper left */}
          <Box 
            sx={{ 
              position: 'absolute',
              top: 6,
              left: 26,
              opacity: 0.8,
              '&:hover': {
                opacity: 1
              }
            }}
          >
            <span className="barcode helveticas" style={{ fontSize: '1.2rem' }}>{patientData.id}</span>
          </Box>

          <CardContent sx={{ p: 3, pt: 6, pb: 0 }}>
            {/* Header Section */}
            <Box mb={3}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.5px',
                  color: theme.palette.text.primary,
                  mb: 1
                }}
              >
                {patientData.fullName}
              </Typography>

              {/* Key Demographics */}
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <CakeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {moment(patientData.birthDate).format('MMM D, YYYY')} ({patientData.age}y)
                  </Typography>
                </Box>

                {patientData.gender && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: genderDisplay.color,
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                      }}
                    >
                      {genderDisplay.icon}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {patientData.gender}
                    </Typography>
                  </Box>
                )}

                {patientData.maritalStatus && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <FamilyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {patientData.maritalStatus}
                    </Typography>
                  </Box>
                )}

                {patientData.language && (
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <LanguageIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {patientData.language}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Status indicators */}
              {patientData.deceased && (
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={`Deceased ${patientData.deceasedDateTime ? moment(patientData.deceasedDateTime).format("MMM DD, YYYY") : ''}`} 
                    color="error" 
                    size="small"
                  />
                </Stack>
              )}
            </Box>

            <Divider sx={{ mb: 1 }} />

            {/* Contact Information */}
            <Grid container spacing={2} sx={{ mb: 0 }}>
              {patientData.phone && (
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Phone</Typography>
                      <Typography variant="body2">{patientData.phone}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {patientData.email && (
                <Grid item xs={12} sm={6} md={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmailIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2">{patientData.email}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {formatAddress(patientData.address) && (
                <Grid item xs={12} sm={12} md={4}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Address</Typography>
                      <Typography variant="body2">{formatAddress(patientData.address)}</Typography>
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Provider Information */}
            {(patientData.generalPractitioner || patientData.managingOrganization) && (
              <>
                <Divider sx={{ my: 1 }} />
                <Grid container spacing={2}>
                  {patientData.generalPractitioner && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalHospitalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">General Practitioner</Typography>
                          <Typography variant="body2">{patientData.generalPractitioner}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {patientData.managingOrganization && (
                    <Grid item xs={12} sm={6}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocalHospitalIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">Managing Organization</Typography>
                          <Typography variant="body2">{patientData.managingOrganization}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </>
            )}


            {/* Emergency Contacts */}
            {patientData.contact.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Emergency Contacts
                  </Typography>
                  <Stack spacing={1}>
                    {patientData.contact.map((contact, index) => (
                      <Typography key={index} variant="body2">
                        <strong>{contact.relationship?.[0]?.coding?.[0]?.display || 'Contact'}:</strong>{' '}
                        {contact.name?.text || contact.name?.given?.[0] || ''}{' '}
                        {contact.telecom?.[0]?.value ? `- ${contact.telecom[0].value}` : ''}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </CardContent>
        </Box>
      </Box>
    </Card>
  );
}

PatientCard.propTypes = {
  id: PropTypes.string,
  identifier: PropTypes.string,
  active: PropTypes.bool,
  familyName: PropTypes.string,
  givenName: PropTypes.string,
  fullName: PropTypes.string,
  email: PropTypes.string,
  birthDate: PropTypes.string,
  gender: PropTypes.string,
  avatar: PropTypes.string,
  patient: PropTypes.object,
  showBarcode: PropTypes.bool,
  showDetails: PropTypes.bool,
  showSummary: PropTypes.bool,
  showName: PropTypes.bool,
  avatarUrlHostname: PropTypes.string,
  cardMediaWidth: PropTypes.string,
  layout: PropTypes.oneOf(['legacy', 'profile']),
  avatarVariant: PropTypes.oneOf(['badge', 'portrait', 'stamp']),
  onEdit: PropTypes.func,
  onUnlink: PropTypes.func,
  onPhotoUpload: PropTypes.func,
  onPhotoDelete: PropTypes.func,
  onPrint: PropTypes.func,
  completionScore: PropTypes.number
};

export default PatientCard;