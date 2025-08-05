// /imports/patient/PatientCard.jsx

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
  FamilyRestroom as FamilyIcon
} from '@mui/icons-material';

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
  ...props
}){
  console.log('PatientCard v0.10.60');
  const theme = useTheme();

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
        return { icon: '⚥', color: theme.palette.grey[600] };
    }
  };

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
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
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
  cardMediaWidth: PropTypes.string
};

export default PatientCard;