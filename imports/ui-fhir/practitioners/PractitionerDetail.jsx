// /imports/ui-fhir/practitioners/PractitionerDetail.jsx

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
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function PractitionerDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [practitioner, setPractitioner] = useState({
    resourceType: "Practitioner",
    active: true,
    name: [{
      use: "official",
      family: "",
      given: [""],
      prefix: [""],
      suffix: [""]
    }],
    telecom: [{
      system: "phone",
      value: "",
      use: "work"
    }, {
      system: "email",
      value: "",
      use: "work"
    }],
    address: [{
      use: "work",
      type: "both",
      line: [""],
      city: "",
      state: "",
      postalCode: "",
      country: "USA"
    }],
    gender: "",
    birthDate: "",
    photo: [],
    identifier: [{
      system: "http://hl7.org/fhir/sid/us-npi",
      value: ""
    }],
    qualification: [{
      identifier: [{
        system: "",
        value: ""
      }],
      code: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v2-0360",
          code: "",
          display: ""
        }],
        text: ""
      },
      period: {
        start: "",
        end: ""
      },
      issuer: {
        reference: "",
        display: ""
      }
    }],
    communication: [{
      coding: [{
        system: "urn:ietf:bcp:47",
        code: "en",
        display: "English"
      }]
    }]
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set default values on component mount for new practitioners
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new practitioners
      setIsEditing(true);
      
      // For new practitioners, set some defaults from current user if available
      if (currentUser) {
        const userName = get(currentUser, 'profile.name', {});
        setPractitioner(prev => ({
          ...prev,
          name: [{
            use: "official",
            family: get(userName, 'family', ''),
            given: [get(userName, 'given[0]', '')],
            prefix: get(userName, 'prefix', ['']),
            suffix: get(userName, 'suffix', [''])
          }]
        }));
      }
    } else {
      // Viewing existing practitioner - start in read-only mode
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load practitioner if editing
  useEffect(function() {
    async function loadPractitioner() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('practitioners.findOne', id);
          if (result) {
            setPractitioner(result);
          }
        } catch (err) {
          console.error('Error loading practitioner:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadPractitioner();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedPractitioner = { ...practitioner };
    set(updatedPractitioner, path, value);
    setPractitioner(updatedPractitioner);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);
    
    try {
      if (id && id !== 'new') {
        // Update existing practitioner
        await Meteor.callAsync('practitioners.update', id, practitioner);
        console.log('Practitioner updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new practitioner
        const newId = await Meteor.callAsync('practitioners.create', practitioner);
        console.log('Practitioner created with ID:', newId);
        // Navigate back to practitioners list for new practitioners
        navigate('/practitioners');
      }
    } catch (err) {
      console.error('Error saving practitioner:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;
    
    if (window.confirm('Are you sure you want to delete this practitioner?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('practitioners.remove', id);
        console.log('Practitioner deleted successfully');
        navigate('/practitioners');
      } catch (err) {
        console.error('Error deleting practitioner:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    navigate('/practitioners');
  }

  const genderOptions = [
    { code: 'male', display: 'Male' },
    { code: 'female', display: 'Female' },
    { code: 'other', display: 'Other' },
    { code: 'unknown', display: 'Unknown' }
  ];

  const qualificationOptions = [
    { code: 'MD', display: 'Doctor of Medicine' },
    { code: 'DO', display: 'Doctor of Osteopathic Medicine' },
    { code: 'RN', display: 'Registered Nurse' },
    { code: 'NP', display: 'Nurse Practitioner' },
    { code: 'PA', display: 'Physician Assistant' },
    { code: 'PharmD', display: 'Doctor of Pharmacy' },
    { code: 'PhD', display: 'Doctor of Philosophy' },
    { code: 'DDS', display: 'Doctor of Dental Surgery' },
    { code: 'PT', display: 'Physical Therapist' },
    { code: 'OT', display: 'Occupational Therapist' }
  ];

  const languageOptions = [
    { code: 'en', display: 'English' },
    { code: 'es', display: 'Spanish' },
    { code: 'fr', display: 'French' },
    { code: 'de', display: 'German' },
    { code: 'it', display: 'Italian' },
    { code: 'pt', display: 'Portuguese' },
    { code: 'zh', display: 'Chinese' },
    { code: 'ja', display: 'Japanese' },
    { code: 'ko', display: 'Korean' },
    { code: 'ar', display: 'Arabic' },
    { code: 'hi', display: 'Hindi' },
    { code: 'ru', display: 'Russian' }
  ];

  return (
    <Container id="practitionerDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={id && id !== 'new' ? 'Edit Practitioner' : 'New Practitioner'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}
          
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  id="activeSwitch"
                  checked={get(practitioner, 'active', true)}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="Active"
            />
            
            <Typography variant="h6">Name</Typography>
            
            <TextField
              fullWidth
              label="Prefix"
              value={get(practitioner, 'name[0].prefix[0]', '')}
              onChange={(e) => handleChange('name[0].prefix[0]', e.target.value)}
              helperText="e.g., Dr., Prof."
              disabled={!isEditing}
            />
            
            <TextField
              id="givenNameInput"
              fullWidth
              label="First Name"
              value={get(practitioner, 'name[0].given[0]', '')}
              onChange={(e) => handleChange('name[0].given[0]', e.target.value)}
              required
              disabled={!isEditing}
            />
            
            <TextField
              id="familyNameInput"
              fullWidth
              label="Last Name"
              value={get(practitioner, 'name[0].family', '')}
              onChange={(e) => handleChange('name[0].family', e.target.value)}
              required
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              label="Suffix"
              value={get(practitioner, 'name[0].suffix[0]', '')}
              onChange={(e) => handleChange('name[0].suffix[0]', e.target.value)}
              helperText="e.g., Jr., Sr., III"
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Contact Information</Typography>
            
            <TextField
              id="phoneInput"
              fullWidth
              label="Phone Number"
              value={get(practitioner, 'telecom[0].value', '')}
              onChange={(e) => handleChange('telecom[0].value', e.target.value)}
              helperText="Work phone number"
              disabled={!isEditing}
            />
            
            <TextField
              id="emailInput"
              fullWidth
              label="Email Address"
              value={get(practitioner, 'telecom[1].value', '')}
              onChange={(e) => handleChange('telecom[1].value', e.target.value)}
              type="email"
              helperText="Work email address"
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Address</Typography>
            
            <TextField
              id="addressLineInput"
              fullWidth
              label="Address Line"
              value={get(practitioner, 'address[0].line[0]', '')}
              onChange={(e) => handleChange('address[0].line[0]', e.target.value)}
              helperText="Street address"
              disabled={!isEditing}
            />
            
            <TextField
              id="cityInput"
              fullWidth
              label="City"
              value={get(practitioner, 'address[0].city', '')}
              onChange={(e) => handleChange('address[0].city', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="stateInput"
              fullWidth
              label="State"
              value={get(practitioner, 'address[0].state', '')}
              onChange={(e) => handleChange('address[0].state', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="postalCodeInput"
              fullWidth
              label="Postal Code"
              value={get(practitioner, 'address[0].postalCode', '')}
              onChange={(e) => handleChange('address[0].postalCode', e.target.value)}
              disabled={!isEditing}
            />
            
            <TextField
              id="countryInput"
              fullWidth
              label="Country"
              value={get(practitioner, 'address[0].country', 'USA')}
              onChange={(e) => handleChange('address[0].country', e.target.value)}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Demographics</Typography>
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={get(practitioner, 'gender', '')}
                onChange={(e) => handleChange('gender', e.target.value)}
                label="Gender"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {genderOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              type="date"
              label="Birth Date"
              value={get(practitioner, 'birthDate', '')}
              onChange={(e) => handleChange('birthDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Professional Information</Typography>
            
            <TextField
              id="npiInput"
              fullWidth
              label="NPI Number"
              value={get(practitioner, 'identifier[0].value', '')}
              onChange={(e) => handleChange('identifier[0].value', e.target.value)}
              helperText="National Provider Identifier"
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Qualification</InputLabel>
              <Select
                id="qualificationInput"
                value={get(practitioner, 'qualification[0].code.coding[0].code', '')}
                onChange={(e) => {
                  const option = qualificationOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('qualification[0].code.coding[0].code', option.code);
                    handleChange('qualification[0].code.coding[0].display', option.display);
                    handleChange('qualification[0].code.text', option.display);
                  }
                }}
                label="Qualification"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {qualificationOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="License Number"
              value={get(practitioner, 'qualification[0].identifier[0].value', '')}
              onChange={(e) => handleChange('qualification[0].identifier[0].value', e.target.value)}
              helperText="Professional license number"
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="License Valid From"
              value={get(practitioner, 'qualification[0].period.start', '')}
              onChange={(e) => handleChange('qualification[0].period.start', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <TextField
              fullWidth
              type="date"
              label="License Valid To"
              value={get(practitioner, 'qualification[0].period.end', '')}
              onChange={(e) => handleChange('qualification[0].period.end', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
            
            <Typography variant="h6">Specialty</Typography>
            
            <TextField
              id="specialtyCodeInput"
              fullWidth
              label="Specialty Code"
              value={get(practitioner, 'practitionerRole[0].specialty[0].coding[0].code', '')}
              onChange={(e) => handleChange('practitionerRole[0].specialty[0].coding[0].code', e.target.value)}
              helperText="Medical specialty code"
              disabled={!isEditing}
            />
            
            <TextField
              id="specialtyDisplayInput"
              fullWidth
              label="Specialty Display"
              value={get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '')}
              onChange={(e) => handleChange('practitionerRole[0].specialty[0].coding[0].display', e.target.value)}
              helperText="Medical specialty description"
              disabled={!isEditing}
            />
            
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Primary Language</InputLabel>
              <Select
                value={get(practitioner, 'communication[0].coding[0].code', 'en')}
                onChange={(e) => {
                  const option = languageOptions.find(o => o.code === e.target.value);
                  if (option) {
                    handleChange('communication[0].coding[0].code', option.code);
                    handleChange('communication[0].coding[0].display', option.display);
                  }
                }}
                label="Primary Language"
              >
                {languageOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/practitioners')}
              >
                Back
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                onClick={() => {
                  if (id && id !== 'new') {
                    // Cancel editing and reload original data
                    setIsEditing(false);
                    // Reload the practitioner to discard changes
                    async function reloadPractitioner() {
                      try {
                        const result = await Meteor.callAsync('practitioners.findOne', id);
                        if (result) {
                          setPractitioner(result);
                        }
                      } catch (err) {
                        console.error('Error reloading practitioner:', err);
                      }
                    }
                    reloadPractitioner();
                  } else {
                    // For new practitioners, go back
                    navigate('/practitioners');
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {id && id !== 'new' && (
                <Button 
                  onClick={handleDelete}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button 
                id="savePractitionerButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default PractitionerDetail;