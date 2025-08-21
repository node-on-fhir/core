// /imports/practitioner/PractitionerCard.jsx

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
  Badge as BadgeIcon,
  LocalHospital as LocalHospitalIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Language as LanguageIcon,
  School as SchoolIcon,
  VerifiedUser as VerifiedIcon,
  Work as WorkIcon,
  AccountBalance as LicenseIcon
} from '@mui/icons-material';

function PractitionerCard({
  id, 
  identifier, 
  active, 
  familyName, 
  givenName, 
  fullName, 
  email, 
  avatar,
  practitioner, 
  practitionerRole,
  showBarcode = false, 
  showDetails = true, 
  showSummary = false, 
  showName = true,
  showLicenses = true,
  showAvatar = true,
  showHeader = true,
  showActiveStatus = true,
  showLanguages = true,
  avatarUrlHostname = '',
  cardMediaWidth = '300px',
  ...props
}){
  console.log('PractitionerCard v0.1.0');
  const theme = useTheme();

  // Extract comprehensive FHIR Practitioner data
  let practitionerData = {
    id: '',
    fullName: '',
    familyName: '',
    givenName: '',
    middleName: '',
    prefix: '',
    suffix: '',
    identifier: '',
    identifiers: [],
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
    qualifications: [],
    languages: [],
    active: true,
    telecom: [],
    specialties: [],
    organization: '',
    role: ''
  };

  if(practitioner){
    // Basic demographics
    practitionerData.id = get(practitioner, 'id', '');
    practitionerData.active = get(practitioner, 'active', true);
    practitionerData.gender = get(practitioner, 'gender', '');

    // Name extraction
    const nameArray = get(practitioner, 'name', []);
    if(nameArray.length > 0){
      const primaryName = nameArray[0];
      practitionerData.prefix = get(primaryName, 'prefix[0]', '');
      practitionerData.givenName = get(primaryName, 'given[0]', '');
      practitionerData.middleName = get(primaryName, 'given[1]', '');
      practitionerData.familyName = get(primaryName, 'family', '');
      practitionerData.suffix = get(primaryName, 'suffix[0]', '');
      practitionerData.fullName = get(primaryName, 'text', '');
      
      // Construct full name if not provided
      if(!practitionerData.fullName){
        let nameParts = [];
        if(practitionerData.prefix) nameParts.push(practitionerData.prefix);
        if(practitionerData.givenName) nameParts.push(practitionerData.givenName);
        if(practitionerData.middleName) nameParts.push(practitionerData.middleName);
        if(practitionerData.familyName) nameParts.push(practitionerData.familyName);
        if(practitionerData.suffix) nameParts.push(practitionerData.suffix);
        practitionerData.fullName = nameParts.join(' ');
      }
    }

    // Identifiers (licenses, certifications, etc.)
    const identifierArray = get(practitioner, 'identifier', []);
    practitionerData.identifiers = identifierArray;
    if(identifierArray.length > 0){
      practitionerData.identifier = get(identifierArray[0], 'value', '');
    }

    // Qualifications
    const qualificationArray = get(practitioner, 'qualification', []);
    practitionerData.qualifications = qualificationArray.map(qual => ({
      code: get(qual, 'code.text', get(qual, 'code.coding[0].display', '')),
      issuer: get(qual, 'issuer.display', ''),
      period: {
        start: get(qual, 'period.start', ''),
        end: get(qual, 'period.end', '')
      },
      identifier: get(qual, 'identifier[0].value', '')
    }));

    // Communication languages
    const communicationArray = get(practitioner, 'communication', []);
    practitionerData.languages = communicationArray.map(comm => 
      get(comm, 'coding[0].display', get(comm, 'text', ''))
    );

    // Contact information
    const telecomArray = get(practitioner, 'telecom', []);
    practitionerData.telecom = telecomArray;
    
    telecomArray.forEach(contact => {
      if(contact.system === 'email' && !practitionerData.email){
        practitionerData.email = contact.value;
      }
      if(contact.system === 'phone' && !practitionerData.phone){
        practitionerData.phone = contact.value;
      }
    });

    // Address
    const addressArray = get(practitioner, 'address', []);
    if(addressArray.length > 0){
      const primaryAddress = addressArray[0];
      practitionerData.address = {
        line: get(primaryAddress, 'line', []),
        city: get(primaryAddress, 'city', ''),
        state: get(primaryAddress, 'state', ''),
        postalCode: get(primaryAddress, 'postalCode', ''),
        country: get(primaryAddress, 'country', '')
      };
    }

    // Photo
    const photoArray = get(practitioner, 'photo', []);
    if(photoArray.length > 0){
      practitionerData.avatar = avatarUrlHostname + get(photoArray[0], 'url', '');
    }
  }

  // Add practitioner role information if provided
  if(practitionerRole){
    practitionerData.role = get(practitionerRole, 'code[0].text', get(practitionerRole, 'code[0].coding[0].display', ''));
    practitionerData.specialties = get(practitionerRole, 'specialty', []).map(spec => 
      get(spec, 'text', get(spec, 'coding[0].display', ''))
    );
    practitionerData.organization = get(practitionerRole, 'organization.display', '');
  }

  // Override with direct props if provided
  if(id) practitionerData.id = id;
  if(fullName) practitionerData.fullName = fullName;
  if(familyName) practitionerData.familyName = familyName;
  if(givenName) practitionerData.givenName = givenName;
  if(email) practitionerData.email = email;
  if(avatar) practitionerData.avatar = avatar;
  if(identifier) practitionerData.identifier = identifier;
  if(typeof active !== 'undefined') practitionerData.active = active;

  return (
    <Card 
      sx={{ 
        maxWidth: '100%',
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
        boxShadow: theme.shadows[2],
        '&:hover': {
          boxShadow: theme.shadows[4]
        }
      }}
      {...props}
    >
      {showHeader && (
        <CardHeader
          avatar={showAvatar ? (
            <Avatar
              sx={{ 
                width: 80, 
                height: 80,
                backgroundColor: theme.palette.primary.main,
                fontSize: '2rem'
              }}
              src={practitionerData.avatar}
            >
              {practitionerData.avatar ? null : (practitionerData.givenName?.[0] || '') + (practitionerData.familyName?.[0] || '')}
            </Avatar>
          ) : null}
          title={showName ? (
            <Box>
              <Typography variant="h6" component="div">
                {practitionerData.fullName}
              </Typography>
              {practitionerData.role && (
                <Typography variant="subtitle2" color="text.secondary">
                  {practitionerData.role}
                </Typography>
              )}
            </Box>
          ) : null}
          subheader={
            <Box sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1}>
                {showActiveStatus && practitionerData.active && (
                  <Chip
                    icon={<VerifiedIcon />}
                    label="Active"
                    color="success"
                    size="small"
                  />
                )}
                {practitionerData.specialties.map((specialty, index) => (
                  <Chip
                    key={index}
                    label={specialty}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Box>
          }
        />
      )}
      
      <CardContent>
        {showDetails && (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {/* Contact Information Column */}
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                Contact Information
              </Typography>
              <Stack spacing={1.5}>
                {practitionerData.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2" noWrap>{practitionerData.email}</Typography>
                  </Box>
                )}
                
                {practitionerData.phone && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    <Typography variant="body2">{practitionerData.phone}</Typography>
                  </Box>
                )}
                
                {practitionerData.organization && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
                    <Typography variant="body2">{practitionerData.organization}</Typography>
                  </Box>
                )}
                
                {(practitionerData.address.city || practitionerData.address.state) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {[
                        practitionerData.address.city,
                        practitionerData.address.state,
                        practitionerData.address.postalCode
                      ].filter(Boolean).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Qualifications Column */}
            {showLicenses && practitionerData.qualifications.length > 0 && (
              <Box sx={{ flex: '1 1 350px', minWidth: 0 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold', mb: 2 }}>
                  <LicenseIcon fontSize="small" />
                  Professional Licenses & Certifications
                </Typography>
                <Stack spacing={1}>
                  {practitionerData.qualifications.map((qual, index) => (
                    <Box key={index} sx={{ 
                      pl: 3, 
                      py: 1, 
                      borderLeft: '3px solid',
                      borderLeftColor: 'primary.light',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      borderRadius: '0 4px 4px 0'
                    }}>
                      <Typography variant="body2" fontWeight="medium">
                        {qual.code}
                      </Typography>
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        {qual.identifier && (
                          <Typography variant="caption" color="text.secondary">
                            License #: {qual.identifier}
                          </Typography>
                        )}
                        {qual.period.start && (
                          <Typography variant="caption" color="text.secondary">
                            Valid: {moment(qual.period.start).format('MMM YYYY')}
                            {qual.period.end && ` - ${moment(qual.period.end).format('MMM YYYY')}`}
                          </Typography>
                        )}
                      </Stack>
                      {qual.issuer && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Issued by: {qual.issuer}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Additional Info Column */}
            {((showLanguages && practitionerData.languages.length > 0) || practitionerData.identifiers.length > 0) && (
              <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
                {/* Languages */}
                {showLanguages && practitionerData.languages.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold', mb: 2 }}>
                      <LanguageIcon fontSize="small" />
                      Languages
                    </Typography>
                    <Box sx={{ pl: 3 }}>
                      <Typography variant="body2">
                        {practitionerData.languages.join(', ')}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Identifiers */}
                {practitionerData.identifiers.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 'bold', mb: 2 }}>
                      <BadgeIcon fontSize="small" />
                      Identifiers
                    </Typography>
                    <Stack spacing={0.5} sx={{ pl: 3 }}>
                      {practitionerData.identifiers.map((id, index) => (
                        <Typography key={index} variant="caption" color="text.secondary">
                          {get(id, 'type.text', get(id, 'type.coding[0].display', 'ID'))}: {id.value}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {showSummary && (
          <Box>
            <Typography variant="body2" color="text.secondary">
              {practitionerData.role && `${practitionerData.role} • `}
              {practitionerData.organization && `${practitionerData.organization} • `}
              {practitionerData.specialties.length > 0 && practitionerData.specialties.join(', ')}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

PractitionerCard.propTypes = {
  id: PropTypes.string,
  identifier: PropTypes.string,
  active: PropTypes.bool,
  familyName: PropTypes.string,
  givenName: PropTypes.string,
  fullName: PropTypes.string,
  email: PropTypes.string,
  practitioner: PropTypes.object,
  practitionerRole: PropTypes.object,
  showBarcode: PropTypes.bool,
  showDetails: PropTypes.bool,
  showSummary: PropTypes.bool,
  showName: PropTypes.bool,
  showLicenses: PropTypes.bool,
  avatarUrlHostname: PropTypes.string,
  cardMediaWidth: PropTypes.string
};

export default PractitionerCard;