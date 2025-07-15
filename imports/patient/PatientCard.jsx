/**
 * Copyright © 2015-2016 Symptomatic, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */  

import React from 'react';
import PropTypes from 'prop-types';

import { 
  Card,
  CardHeader,  
  CardContent,
  CardMedia,
  Typography, 
  TextField,
  FormControl,
  Input, 
  InputLabel,
  Grid,
  Box,
  Chip,
  Avatar,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';

import _ from 'lodash';
let get = _.get;
let set = _.set;

import moment from 'moment';

import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  Cake as CakeIcon,
  Badge as BadgeIcon,
  LocalHospital as LocalHospitalIcon,
  Language as LanguageIcon,
  FamilyRestroom as FamilyIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  ContactPhone as ContactIcon
} from '@mui/icons-material';




 
function PatientCard({id, identifier, active, familyName, givenName, fullName, email, birthDate, gender, avatar, patient, zDepth, overflowY, showBarcode = false, showDetails = true, showSummary = false, showName = true, avatarUrlHostname = '', cardMediaWidth = '300px', ...props}){

  console.log('PatientCard v0.10.60')
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

  // Create the new snazzy summary header
  let summaryHeader;
  if(showSummary){
    const genderDisplay = getGenderDisplay(patientData.gender);
    
    summaryHeader = (
      <Box sx={{ 
        p: 3, 
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Grid container spacing={3} alignItems="center">
          {/* Avatar and Name Section */}
          <Grid item xs={12} md={patientData.avatar ? 8 : 12}>
            <Box display="flex" alignItems="center" gap={3}>
              {patientData.avatar && (
                <Avatar 
                  src={patientData.avatar} 
                  sx={{ 
                    width: 120, 
                    height: 120,
                    border: `4px solid ${theme.palette.background.paper}`,
                    boxShadow: theme.shadows[3]
                  }}
                />
              )}
              <Box flex={1}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {patientData.prefix && `${patientData.prefix} `}
                  {patientData.fullName || `${patientData.givenName} ${patientData.middleName} ${patientData.familyName}`.trim()}
                  {patientData.suffix && ` ${patientData.suffix}`}
                </Typography>
                
                {/* Primary Demographics Row */}
                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Chip
                    icon={<BadgeIcon />}
                    label={`MRN: ${patientData.identifier}`}
                    variant="outlined"
                    size="medium"
                  />
                  <Chip
                    icon={<CakeIcon />}
                    label={`${moment(patientData.birthDate).format("MMM DD, YYYY")} (${patientData.age}y)`}
                    variant="outlined"
                    size="medium"
                  />
                  <Chip
                    icon={<PersonIcon />}
                    label={
                      <Box component="span" display="flex" alignItems="center" gap={0.5}>
                        <span style={{ color: genderDisplay.color, fontWeight: 'bold' }}>{genderDisplay.icon}</span>
                        {patientData.gender}
                      </Box>
                    }
                    variant="outlined"
                    size="medium"
                  />
                  {patientData.maritalStatus && (
                    <Chip
                      icon={<FamilyIcon />}
                      label={patientData.maritalStatus}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                  {patientData.language && (
                    <Chip
                      icon={<LanguageIcon />}
                      label={patientData.language}
                      variant="outlined"
                      size="medium"
                    />
                  )}
                </Stack>

                {/* Contact Information */}
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {patientData.phone && (
                    <Chip
                      icon={<PhoneIcon />}
                      label={patientData.phone}
                      size="small"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                  )}
                  {patientData.email && (
                    <Chip
                      icon={<EmailIcon />}
                      label={patientData.email}
                      size="small"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                  )}
                  {(patientData.address.city || patientData.address.line.length > 0) && (
                    <Chip
                      icon={<LocationIcon />}
                      label={formatAddress(patientData.address)}
                      size="small"
                      sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </Grid>

          {/* Status Indicators */}
          {patientData.avatar && (
            <Grid item xs={12} md={4}>
              <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                {patientData.active && !patientData.deceased && (
                  <Chip 
                    label="Active" 
                    color="success" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
                {patientData.deceased && (
                  <Chip 
                    label={`Deceased ${patientData.deceasedDateTime ? moment(patientData.deceasedDateTime).format("MMM DD, YYYY") : ''}`} 
                    color="error" 
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                )}
                {patientData.generalPractitioner && (
                  <Typography variant="caption" color="text.secondary">
                    <LocalHospitalIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    GP: {patientData.generalPractitioner}
                  </Typography>
                )}
                {patientData.managingOrganization && (
                  <Typography variant="caption" color="text.secondary">
                    <LocalHospitalIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                    {patientData.managingOrganization}
                  </Typography>
                )}
              </Stack>
            </Grid>
          )}
        </Grid>

        {/* Additional Identifiers if present - filtering out sensitive ones */}
        {patientData.identifiers.length > 1 && (
          <Box mt={2}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {patientData.identifiers.slice(1)
                .filter(id => {
                  // Filter out SSN and Medicare identifiers
                  const system = (id.system || '').toLowerCase();
                  const type = id.type?.coding?.[0]?.code?.toLowerCase() || '';
                  const display = (id.type?.coding?.[0]?.display || '').toLowerCase();
                  
                  return !system.includes('ssn') && 
                         !system.includes('social') &&
                         !system.includes('medicare') &&
                         !type.includes('ss') &&
                         !type.includes('ssn') &&
                         !type.includes('social') &&
                         !type.includes('medicare') &&
                         !display.includes('social') &&
                         !display.includes('medicare') &&
                         !display.includes('ssn');
                })
                .map((id, index) => (
                  <Chip
                    key={index}
                    size="small"
                    variant="outlined"
                    label={`${id.type?.coding?.[0]?.display || id.system || 'ID'}: ${id.value}`}
                    sx={{ fontSize: '0.75rem' }}
                  />
                ))}
            </Stack>
          </Box>
        )}

        {/* Emergency Contacts */}
        {patientData.contact.length > 0 && (
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              <ContactIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
              Emergency Contacts
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {patientData.contact.map((contact, index) => (
                <Chip
                  key={index}
                  size="small"
                  variant="outlined"
                  label={`${contact.relationship?.[0]?.coding?.[0]?.display || 'Contact'}: ${contact.name?.text || contact.name?.given?.[0] || ''} ${contact.telecom?.[0]?.value || ''}`}
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Box>
    );
  }

  // Simplified details section for form fields
  let details;
  if(props.showDetails){
    details = (
      <Box sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              name='given'
              type='text'
              label='Given Name'
              value={patientData.givenName}   
              InputLabelProps={{ shrink: true }}                   
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              name='family'
              type='text'
              label='Family Name'
              value={patientData.familyName}              
              InputLabelProps={{ shrink: true }}          
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              name='birthDate'
              type='date'
              label='Date of Birth' 
              value={patientData.birthDate ? moment(patientData.birthDate).format('YYYY-MM-DD') : ''}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              name='gender'
              type='text'
              label='Gender'
              value={patientData.gender}                  
              InputLabelProps={{ shrink: true }}      
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              name='maritalStatus'
              type='text'
              label='Marital Status'
              value={patientData.maritalStatus}                  
              InputLabelProps={{ shrink: true }}      
              fullWidth
            />
          </Grid>
          {patientData.phone && (
            <Grid item xs={12} md={6}>
              <TextField
                name='phone'
                type='tel'
                label='Phone'
                value={patientData.phone}                  
                InputLabelProps={{ shrink: true }}      
                fullWidth
              />
            </Grid>
          )}
          {patientData.email && (
            <Grid item xs={12} md={6}>
              <TextField
                name='email'
                type='email'
                label='Email'
                value={patientData.email}                  
                InputLabelProps={{ shrink: true }}      
                fullWidth
              />
            </Grid>
          )}
        </Grid>
      </Box>
    );
  }


  // Render card with new layout
  if(showSummary){
    // New snazzy layout when showing summary
    return(
      <div className='patientCard'>
        <Card sx={{ 
          overflow: 'hidden',
          boxShadow: theme.shadows[3],
          '&:hover': {
            boxShadow: theme.shadows[6]
          },
          transition: 'box-shadow 0.3s ease'
        }}>
          {summaryHeader}
          {details && <Divider />}
          {details}
        </Card>
      </div>
    );
  } else {
    // Legacy layout for compatibility
    let barcodeElements;
    let titleStyle = {
      paddingBottom: '0px'
    };
    
    let barcodeStyle = {
      paddingLeft: '16px',
      fontSize: '150%',
      marginTop: '0px',
      marginBottom: '0px',
      fontWeight: 200
    }

    if(showBarcode){
      barcodeElements = <h4 className="barcode barcodes" style={barcodeStyle}>{patientData.id}</h4>
      titleStyle.paddingTop = '0px';
    }

    let nameElements;
    if(showName){
      nameElements = <CardHeader title={patientData.fullName} style={titleStyle} />
    }

    let showMedia = false;
    let mediaElements;
    let avatarHeight = 220;
    if(patientData.avatar){
      if(!showName){
        avatarHeight = avatarHeight - 64;
      }
      if(!showDetails){
        avatarHeight = avatarHeight - 156;
      }
      mediaElements = <CardMedia      
        image={patientData.avatar}      
        style={{height: avatarHeight + 'px', width: cardMediaWidth, backgroundSize: 'cover'}}
      />
    }

    return(
      <div className='patientCard'>
        <Card style={{ display: 'flex', flexGrow: 1 }} >
          { mediaElements }
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            { barcodeElements }
            { nameElements }
            <CardContent>
              { details }
            </CardContent>
          </div>
        </Card>
      </div>
    );
  }
}


PatientCard.propTypes = {
  patient: PropTypes.object,
  multiline: PropTypes.bool,
  id: PropTypes.string,
  fullName: PropTypes.string,
  familyName: PropTypes.string,
  givenName: PropTypes.string,
  email: PropTypes.string,
  birthDate: PropTypes.string,
  gender: PropTypes.string,
  avatar: PropTypes.string,
  hideDetails: PropTypes.bool,  // deprecated
  showBarcode: PropTypes.bool,
  showDetails: PropTypes.bool,
  showSummary: PropTypes.bool,
  showName: PropTypes.bool,
  overflowY: PropTypes.string,
  style: PropTypes.object,
  defaultAvatar: PropTypes.string,
  avatarUrlHostname: PropTypes.string,
  cardMediaWidth: PropTypes.string
};
// PatientCard.defaultProps = {
//   showBarcode: false,
//   showDetails: true,
//   showSummary: false,
//   showName: true,
//   avatarUrlHostname: '',
//   cardMediaWidth: '300px'
// }

export default PatientCard;
