// /imports/ui-fhir/patients/PatientDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

function PatientDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [patient, setPatient] = useState({
    resourceType: "Patient",
    id: id || Random.id(),
    active: true,
    name: [{
      use: "official",
      family: "",
      given: [""],
      text: ""
    }],
    telecom: [
      {
        system: "phone",
        value: "",
        use: "mobile"
      },
      {
        system: "email",
        value: "",
        use: "home"
      }
    ],
    gender: "",
    birthDate: "",
    address: [{
      use: "home",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: "USA"
    }],
    identifier: [{
      system: "http://hospital.example.org/identifiers/mrn",
      value: ""
    }],
    maritalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
        code: "",
        display: ""
      }]
    },
    communication: [{
      language: {
        coding: [{
          system: "urn:ietf:bcp:47",
          code: "en-US",
          display: "English (United States)"
        }]
      },
      preferred: true
    }],
    extension: [
      {
        url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        valueCode: ""
      },
      {
        url: "http://hl7.org/fhir/StructureDefinition/patient-karyotype",
        valueCodeableConcept: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }]
        }
      }
    ]
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  // Load existing patient if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      const existingPatient = Patients.findOne({
        $or: [
          { id: id },
          { _id: id }
        ]
      });
      
      if (existingPatient) {
        setPatient(existingPatient);
      }
    } else if (!id || id === 'new') {
      // For new patients, set defaults from current user
      const newPatient = { ...patient };
      
      // Pre-fill with user's information if available
      if (currentUser) {
        // Set name from user
        if (get(currentUser, 'fullLegalName')) {
          const nameParts = currentUser.fullLegalName.split(' ');
          set(newPatient, 'name[0].given', nameParts.slice(0, -1));
          set(newPatient, 'name[0].family', nameParts[nameParts.length - 1]);
          set(newPatient, 'name[0].text', currentUser.fullLegalName);
        }
        
        // Set email from user
        if (get(currentUser, 'emails[0].address')) {
          const emailIndex = newPatient.telecom.findIndex(t => t.system === 'email');
          if (emailIndex >= 0) {
            newPatient.telecom[emailIndex].value = currentUser.emails[0].address;
          }
        }
        
        // Set patient ID if available
        if (get(currentUser, 'patientId')) {
          newPatient.id = currentUser.patientId;
        }
      }
      
      setPatient(newPatient);
    }
  }, [id, currentUser]);

  // Handle form field changes
  const handleChange = (path, value) => {
    const updatedPatient = { ...patient };
    set(updatedPatient, path, value);
    
    // Update display text for name
    if (path.includes('name[0]')) {
      const given = get(updatedPatient, 'name[0].given', []).join(' ');
      const family = get(updatedPatient, 'name[0].family', '');
      set(updatedPatient, 'name[0].text', `${given} ${family}`.trim());
    }
    
    setPatient(updatedPatient);
  };

  // Handle adding a new telecom entry
  const handleAddTelecom = () => {
    const updatedPatient = { ...patient };
    if (!updatedPatient.telecom) {
      updatedPatient.telecom = [];
    }
    updatedPatient.telecom.push({
      system: 'phone',
      value: '',
      use: 'home'
    });
    setPatient(updatedPatient);
  };

  // Handle removing a telecom entry
  const handleRemoveTelecom = (index) => {
    const updatedPatient = { ...patient };
    if (updatedPatient.telecom && updatedPatient.telecom.length > index) {
      updatedPatient.telecom.splice(index, 1);
      setPatient(updatedPatient);
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      let result;
      
      if (id && id !== 'new') {
        // Update existing patient
        const patientId = patient._id || patient.id;
        result = await Meteor.callAsync('patients.update', 
          { $or: [{ id: patientId }, { _id: patientId }] },
          { $set: patient }
        );
      } else {
        // Create new patient
        result = await Meteor.callAsync('patients.insert', patient);
        
        // If this is the current user's patient, update the user record
        if (currentUser && !currentUser.patientId) {
          await Meteor.callAsync('users.linkPatient', patient.id);
        }
      }
      
      setSuccessMessage('Patient saved successfully');
      
      // Navigate back to profile or patients list
      setTimeout(() => {
        if (currentUser && patient.id === currentUser.patientId) {
          navigate('/my-profile');
        } else {
          navigate('/patients');
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error saving patient:', error);
      setErrors({ save: error.message || 'Failed to save patient' });
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const maritalStatusOptions = [
    { value: 'S', label: 'Single' },
    { value: 'M', label: 'Married' },
    { value: 'D', label: 'Divorced' },
    { value: 'W', label: 'Widowed' },
    { value: 'P', label: 'Domestic Partner' },
    { value: 'U', label: 'Unknown' }
  ];

  const sexAtBirthOptions = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'UNK', label: 'Unknown' },
    { value: 'ASKU', label: 'Choose Not to Disclose' }
  ];

  const karyotypeOptions = [
    { value: '734002005', label: 'XX (Typical Female)' },
    { value: '734003000', label: 'XY (Typical Male)' },
    { value: '80427008', label: 'X0 (Turner Syndrome)' },
    { value: '41979000', label: 'XXY (Klinefelter Syndrome)' },
    { value: '20704005', label: 'XYY (Jacob\'s Syndrome)' },
    { value: '30699003', label: 'XXX (Triple X Syndrome)' },
    { value: '261665006', label: 'Unknown' },
    { value: 'OTH', label: 'Other' }
  ];

  const languageOptions = [
    { code: 'en', display: 'English' },
    { code: 'en-US', display: 'English (United States)' },
    { code: 'es', display: 'Spanish' },
    { code: 'es-MX', display: 'Spanish (Mexico)' },
    { code: 'fr', display: 'French' },
    { code: 'fr-CA', display: 'French (Canada)' },
    { code: 'de', display: 'German' },
    { code: 'it', display: 'Italian' },
    { code: 'pt', display: 'Portuguese' },
    { code: 'pt-BR', display: 'Portuguese (Brazil)' },
    { code: 'zh', display: 'Chinese' },
    { code: 'zh-CN', display: 'Chinese (Simplified)' },
    { code: 'zh-TW', display: 'Chinese (Traditional)' },
    { code: 'ja', display: 'Japanese' },
    { code: 'ko', display: 'Korean' },
    { code: 'ar', display: 'Arabic' },
    { code: 'hi', display: 'Hindi' },
    { code: 'ru', display: 'Russian' },
    { code: 'vi', display: 'Vietnamese' },
    { code: 'tl', display: 'Tagalog' },
    { code: 'pl', display: 'Polish' },
    { code: 'uk', display: 'Ukrainian' },
    { code: 'he', display: 'Hebrew' },
    { code: 'fa', display: 'Persian/Farsi' }
  ];

  const telecomSystemOptions = [
    { value: 'phone', label: 'Phone' },
    { value: 'fax', label: 'Fax' },
    { value: 'email', label: 'Email' },
    { value: 'pager', label: 'Pager' },
    { value: 'url', label: 'URL' },
    { value: 'sms', label: 'SMS' },
    { value: 'other', label: 'Other' }
  ];

  const telecomUseOptions = [
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' },
    { value: 'temp', label: 'Temporary' },
    { value: 'old', label: 'Old' },
    { value: 'mobile', label: 'Mobile' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Container id="patientDetailPage" maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardHeader
            avatar={<PersonIcon />}
            title={id && id !== 'new' ? 'Edit Patient' : 'Create New Patient'}
            subheader={`Patient ID: ${patient.id}`}
          />
          
          <CardContent>
            <Stack spacing={3}>
              {/* Name Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Name</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="givenNameInput"
                      fullWidth
                      label="Given Name(s)"
                      value={get(patient, 'name[0].given[0]', '')}
                      onChange={(e) => handleChange('name[0].given[0]', e.target.value)}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="familyNameInput"
                      fullWidth
                      label="Family Name"
                      value={get(patient, 'name[0].family', '')}
                      onChange={(e) => handleChange('name[0].family', e.target.value)}
                      required
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Identifier Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Identifier</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      id="identifierInput"
                      fullWidth
                      label="Medical Record Number"
                      value={get(patient, 'identifier[0].value', '')}
                      onChange={(e) => {
                        const updated = { ...patient };
                        if (!updated.identifier) {
                          updated.identifier = [{
                            system: 'http://hospital.example.org/identifiers/mrn',
                            value: ''
                          }];
                        }
                        set(updated, 'identifier[0].value', e.target.value);
                        setPatient(updated);
                      }}
                      helperText="Medical record number or other identifier"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Demographics Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Demographics</Typography>
                <Grid container spacing={2}>
                  {/* Row 1: Birth Date | Birth Sex */}
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Birth Date"
                      value={patient.birthDate ? moment(patient.birthDate) : null}
                      onChange={(newValue) => handleChange('birthDate', newValue ? newValue.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { id: 'birthDateInput', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Birth Sex</InputLabel>
                      <Select
                        value={(() => {
                          const ext = (patient.extension || []).find(e => 
                            e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex'
                          );
                          return ext?.valueCode || '';
                        })()}
                        onChange={(e) => {
                          const updatedPatient = { ...patient };
                          if (!updatedPatient.extension) {
                            updatedPatient.extension = [];
                          }
                          
                          // Find or create the birth sex extension
                          const birthSexIndex = updatedPatient.extension.findIndex(ext => 
                            ext.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex'
                          );
                          
                          if (birthSexIndex >= 0) {
                            updatedPatient.extension[birthSexIndex].valueCode = e.target.value;
                          } else {
                            updatedPatient.extension.push({
                              url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
                              valueCode: e.target.value
                            });
                          }
                          
                          setPatient(updatedPatient);
                        }}
                        label="Birth Sex"
                      >
                        {sexAtBirthOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Row 2: Language | Karyotype */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Language</InputLabel>
                      <Select
                        value={get(patient, 'communication[0].language.coding[0].code', '')}
                        onChange={(e) => {
                          const selected = languageOptions.find(opt => opt.code === e.target.value);
                          handleChange('communication[0].language.coding[0].code', e.target.value);
                          handleChange('communication[0].language.coding[0].display', selected?.display || '');
                        }}
                        label="Language"
                      >
                        {languageOptions.map(option => (
                          <MenuItem key={option.code} value={option.code}>
                            {option.display}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Karyotype</InputLabel>
                      <Select
                        value={(() => {
                          const ext = (patient.extension || []).find(e => 
                            e.url === 'http://hl7.org/fhir/StructureDefinition/patient-karyotype'
                          );
                          return ext?.valueCodeableConcept?.coding?.[0]?.code || '';
                        })()}
                        onChange={(e) => {
                          const selected = karyotypeOptions.find(opt => opt.value === e.target.value);
                          const updatedPatient = { ...patient };
                          if (!updatedPatient.extension) {
                            updatedPatient.extension = [];
                          }
                          
                          // Find or create the karyotype extension
                          const karyotypeIndex = updatedPatient.extension.findIndex(ext => 
                            ext.url === 'http://hl7.org/fhir/StructureDefinition/patient-karyotype'
                          );
                          
                          const karyotypeExtension = {
                            url: 'http://hl7.org/fhir/StructureDefinition/patient-karyotype',
                            valueCodeableConcept: {
                              coding: [{
                                system: 'http://snomed.info/sct',
                                code: e.target.value,
                                display: selected?.label || ''
                              }]
                            }
                          };
                          
                          if (karyotypeIndex >= 0) {
                            updatedPatient.extension[karyotypeIndex] = karyotypeExtension;
                          } else {
                            updatedPatient.extension.push(karyotypeExtension);
                          }
                          
                          setPatient(updatedPatient);
                        }}
                        label="Karyotype"
                      >
                        {karyotypeOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Row 3: Marital Status | Gender */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Marital Status</InputLabel>
                      <Select
                        value={get(patient, 'maritalStatus.coding[0].code', '')}
                        onChange={(e) => {
                          const selected = maritalStatusOptions.find(opt => opt.value === e.target.value);
                          handleChange('maritalStatus.coding[0].code', e.target.value);
                          handleChange('maritalStatus.coding[0].display', selected?.label || '');
                        }}
                        label="Marital Status"
                      >
                        {maritalStatusOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        id="genderSelect"
                        value={patient.gender || ''}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        label="Gender"
                      >
                        {genderOptions.map(option => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* Contact Information */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddTelecom}
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    Add Contact
                  </Button>
                </Typography>
                
                {(patient.telecom || []).map((telecom, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>System</InputLabel>
                        <Select
                          value={telecom.system || 'phone'}
                          onChange={(e) => handleChange(`telecom[${index}].system`, e.target.value)}
                          label="System"
                        >
                          {telecomSystemOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <TextField
                        id={(() => {
                          // Provide specific IDs for the first phone and email fields
                          if(index === 0 && telecom.system === 'phone') return 'phoneInput';
                          if(index === 0 && telecom.system === 'email') return 'emailInput';
                          if(index === 1 && telecom.system === 'email') return 'emailInput';
                          return `telecom${index}Input`;
                        })()}
                        fullWidth
                        label={(() => {
                          switch(telecom.system) {
                            case 'email': return 'Email Address';
                            case 'url': return 'Website URL';
                            case 'fax': return 'Fax Number';
                            case 'pager': return 'Pager Number';
                            case 'sms': return 'SMS Number';
                            default: return 'Phone Number';
                          }
                        })()}
                        type={telecom.system === 'email' ? 'email' : telecom.system === 'url' ? 'url' : 'text'}
                        value={telecom.value || ''}
                        onChange={(e) => handleChange(`telecom[${index}].value`, e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {(() => {
                                switch(telecom.system) {
                                  case 'email': return '📧';
                                  case 'url': return '🌐';
                                  case 'fax': return '📠';
                                  case 'pager': return '📟';
                                  case 'sms': return '💬';
                                  default: return '📱';
                                }
                              })()}
                            </InputAdornment>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <FormControl fullWidth>
                        <InputLabel>Use</InputLabel>
                        <Select
                          value={telecom.use || 'home'}
                          onChange={(e) => handleChange(`telecom[${index}].use`, e.target.value)}
                          label="Use"
                        >
                          {telecomUseOptions.map(option => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <IconButton
                        onClick={() => handleRemoveTelecom(index)}
                        disabled={patient.telecom.length <= 1}
                        color="error"
                        sx={{ mt: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}
                
                {(!patient.telecom || patient.telecom.length === 0) && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No contact information added. Click "Add Contact" to add phone, email, or other contact methods.
                  </Typography>
                )}
              </Box>

              {/* Address */}
              <Box>
                <Typography variant="h6" gutterBottom>Address</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      id="addressLineInput"
                      fullWidth
                      label="Street Address"
                      value={get(patient, 'address[0].line[0]', '')}
                      onChange={(e) => handleChange('address[0].line[0]', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      id="cityInput"
                      fullWidth
                      label="City"
                      value={get(patient, 'address[0].city', '')}
                      onChange={(e) => handleChange('address[0].city', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      id="stateInput"
                      fullWidth
                      label="State"
                      value={get(patient, 'address[0].state', '')}
                      onChange={(e) => handleChange('address[0].state', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      id="postalCodeInput"
                      fullWidth
                      label="ZIP Code"
                      value={get(patient, 'address[0].postalCode', '')}
                      onChange={(e) => handleChange('address[0].postalCode', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      id="countryInput"
                      fullWidth
                      label="Country"
                      value={get(patient, 'address[0].country', '')}
                      onChange={(e) => handleChange('address[0].country', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Error/Success Messages */}
              {errors.save && (
                <Typography color="error" variant="body2">
                  {errors.save}
                </Typography>
              )}
              {successMessage && (
                <Typography color="success.main" variant="body2">
                  {successMessage}
                </Typography>
              )}
            </Stack>
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'flex-end', px: 3, pb: 2 }}>
            <Button
              startIcon={<CancelIcon />}
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              id="savePatientButton"
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!get(patient, 'name[0].family') || !get(patient, 'name[0].given[0]')}
            >
              Save Patient
            </Button>
          </CardActions>
        </Card>
      </Container>
    </LocalizationProvider>
  );
}

export default PatientDetail;