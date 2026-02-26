// /imports/ui-fhir/practitioners/PractitionerDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  FormControlLabel,
  Switch,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const genderOptions = [
  { code: 'male', display: 'Male' },
  { code: 'female', display: 'Female' },
  { code: 'other', display: 'Other' },
  { code: 'unknown', display: 'Unknown' }
];

const qualificationOptions = [
  // Medical
  { code: 'MD', display: 'Doctor of Medicine' },
  { code: 'DO', display: 'Doctor of Osteopathic Medicine' },
  { code: 'RN', display: 'Registered Nurse' },
  { code: 'NP', display: 'Nurse Practitioner' },
  { code: 'PA', display: 'Physician Assistant' },
  { code: 'PharmD', display: 'Doctor of Pharmacy' },
  { code: 'PhD', display: 'Doctor of Philosophy' },
  { code: 'DDS', display: 'Doctor of Dental Surgery' },
  { code: 'PT', display: 'Physical Therapist' },
  { code: 'OT', display: 'Occupational Therapist' },
  // Transportation
  { code: 'CDL', display: 'Commercial Driver\'s License' },
  { code: 'ATP', display: 'Airline Transport Pilot License' },
  { code: 'CPL', display: 'Commercial Pilot License' },
  { code: 'PPL', display: 'Private Pilot License' },
  // Other Professional
  { code: 'PE', display: 'Professional Engineer' },
  { code: 'CPA', display: 'Certified Public Accountant' },
  { code: 'PMP', display: 'Project Management Professional' },
  { code: 'CERT', display: 'Professional Certification' },
  { code: 'OTHER', display: 'Other Professional License' }
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

function PractitionerDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const practitionerId = id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewPractitioner = !practitionerId || practitionerId === 'new';
  const isExistingPractitioner = practitionerId && practitionerId !== 'new';

  // Parse URL parameters for save/cancel destinations
  const saveDestination = searchParams.get('save');
  const cancelDestination = searchParams.get('cancel');

  // Subscribe to practitioners
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Practitioners', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('practitioners.all');
    }
    return handle.ready();
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
    }],
    practitionerRole: [{
      specialty: [{
        coding: [{
          system: "http://nucc.org/provider-taxonomy",
          code: "",
          display: ""
        }],
        text: ""
      }]
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setPractitioner(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);

  // Set editing mode for new practitioners
  useEffect(function() {
    if (isNewPractitioner) {
      setIsEditing(true);
    }
  }, [practitionerId]);

  // Load practitioner from local collection when subscription is ready
  useEffect(function() {
    if (isExistingPractitioner) {
      // Try loading from local collection
      const existingPractitioner = Practitioners.findOne({ _id: practitionerId });

      if (existingPractitioner) {
        setPractitioner(existingPractitioner);
        setIsEditing(false);
      } else {
        // Fallback: try finding by FHIR id field
        const practitionerById = Practitioners.findOne({ id: practitionerId });
        if (practitionerById) {
          setPractitioner(practitionerById);
          setIsEditing(false);
        }
      }
    }
  }, [practitionerId, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedPractitioner = { ...practitioner };
    set(updatedPractitioner, path, value);
    setPractitioner(updatedPractitioner);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedPractitioner);
    }
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      let resultId;

      if (isExistingPractitioner) {
        // Update existing practitioner
        await Meteor.callAsync('practitioners.update', practitionerId, practitioner);
        console.log('[PractitionerDetail] Practitioner updated successfully');
        resultId = practitionerId;
        // Stay on page but exit edit mode
        setIsEditing(false);
      } else {
        // Create new practitioner
        resultId = await Meteor.callAsync('practitioners.create', practitioner);
        console.log('[PractitionerDetail] Practitioner created with ID:', resultId);
      }

      // If coming from my-profile, link the practitioner to the user
      if (saveDestination === 'my-profile' && resultId) {
        try {
          await Meteor.callAsync('users.linkPractitionerId', resultId);
          console.log('[PractitionerDetail] Practitioner linked to user profile');
          navigate('/my-profile');
          return;
        } catch (linkError) {
          console.error('[PractitionerDetail] Error linking practitioner to user:', linkError);
          setError('Practitioner saved but could not link to your profile: ' + linkError.message);
        }
      }

      // Navigate based on save destination or default
      if (saveDestination) {
        navigate('/' + saveDestination);
      } else if (isNewPractitioner) {
        navigate('/practitioners');
      }
    } catch (err) {
      console.error('[PractitionerDetail] Error saving practitioner:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingPractitioner) return;

    if (window.confirm('Are you sure you want to delete this practitioner?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('practitioners.remove', practitionerId);
        console.log('[PractitionerDetail] Practitioner deleted successfully');
        navigate('/practitioners');
      } catch (err) {
        console.error('[PractitionerDetail] Error deleting practitioner:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (cancelDestination) {
      navigate('/' + cancelDestination);
    } else if (isExistingPractitioner) {
      setIsEditing(false);
      setError(null);
      // Reload practitioner from collection to discard changes
      const existingPractitioner = Practitioners.findOne({ _id: practitionerId });
      if (existingPractitioner) {
        setPractitioner(existingPractitioner);
      } else {
        const practitionerById = Practitioners.findOne({ id: practitionerId });
        if (practitionerById) {
          setPractitioner(practitionerById);
        }
      }
    } else {
      navigate('/practitioners');
    }
  }

  // Build the header title
  let headerTitle = 'New Practitioner';
  if (isExistingPractitioner) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{practitionerId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new practitioners */}
        {!isNewPractitioner && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new practitioners (always form) */}
        {!isNewPractitioner && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle — only for existing practitioners */}
        {!isNewPractitioner && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing practitioners */}
        {!isNewPractitioner && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <Stack spacing={3}>
          <FormControlLabel
            control={
              <Switch
                id="activeSwitch"
                checked={get(practitioner, 'active', true)}
                onChange={function(e) { handleChange('active', e.target.checked); }}
                disabled={!isEditing}
              />
            }
            label="Active"
          />

          <Divider />
          <Typography variant="h6">Name</Typography>

          <TextField
            fullWidth
            label="Prefix"
            value={get(practitioner, 'name[0].prefix[0]', '')}
            onChange={function(e) { handleChange('name[0].prefix[0]', e.target.value); }}
            helperText="e.g., Dr., Prof."
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              id="givenNameInput"
              fullWidth
              label="First Name"
              value={get(practitioner, 'name[0].given[0]', '')}
              onChange={function(e) { handleChange('name[0].given[0]', e.target.value); }}
              required
              disabled={!isEditing}
            />

            <TextField
              id="familyNameInput"
              fullWidth
              label="Last Name"
              value={get(practitioner, 'name[0].family', '')}
              onChange={function(e) { handleChange('name[0].family', e.target.value); }}
              required
              disabled={!isEditing}
            />
          </Stack>

          <TextField
            fullWidth
            label="Suffix"
            value={get(practitioner, 'name[0].suffix[0]', '')}
            onChange={function(e) { handleChange('name[0].suffix[0]', e.target.value); }}
            helperText="e.g., Jr., Sr., III"
            disabled={!isEditing}
          />

          <Divider />
          <Typography variant="h6">Contact Information</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="phoneInput"
              fullWidth
              label="Phone Number"
              value={get(practitioner, 'telecom[0].value', '')}
              onChange={function(e) { handleChange('telecom[0].value', e.target.value); }}
              helperText="Work phone number"
              disabled={!isEditing}
            />

            <TextField
              id="emailInput"
              fullWidth
              label="Email Address"
              value={get(practitioner, 'telecom[1].value', '')}
              onChange={function(e) { handleChange('telecom[1].value', e.target.value); }}
              type="email"
              helperText="Work email address"
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Address</Typography>

          <TextField
            id="addressLineInput"
            fullWidth
            label="Address Line"
            value={get(practitioner, 'address[0].line[0]', '')}
            onChange={function(e) { handleChange('address[0].line[0]', e.target.value); }}
            helperText="Street address"
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              id="cityInput"
              fullWidth
              label="City"
              value={get(practitioner, 'address[0].city', '')}
              onChange={function(e) { handleChange('address[0].city', e.target.value); }}
              disabled={!isEditing}
            />

            <TextField
              id="stateInput"
              fullWidth
              label="State"
              value={get(practitioner, 'address[0].state', '')}
              onChange={function(e) { handleChange('address[0].state', e.target.value); }}
              disabled={!isEditing}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              id="postalCodeInput"
              fullWidth
              label="Postal Code"
              value={get(practitioner, 'address[0].postalCode', '')}
              onChange={function(e) { handleChange('address[0].postalCode', e.target.value); }}
              disabled={!isEditing}
            />

            <TextField
              id="countryInput"
              fullWidth
              label="Country"
              value={get(practitioner, 'address[0].country', 'USA')}
              onChange={function(e) { handleChange('address[0].country', e.target.value); }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Demographics</Typography>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={get(practitioner, 'gender', '')}
                onChange={function(e) { handleChange('gender', e.target.value); }}
                label="Gender"
              >
                <MenuItem value="">
                  <em>Not specified</em>
                </MenuItem>
                {genderOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="date"
              label="Birth Date"
              value={get(practitioner, 'birthDate', '')}
              onChange={function(e) { handleChange('birthDate', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Professional Information</Typography>

          <TextField
            id="npiInput"
            fullWidth
            label="NPI Number"
            value={get(practitioner, 'identifier[0].value', '')}
            onChange={function(e) { handleChange('identifier[0].value', e.target.value); }}
            helperText="National Provider Identifier"
            disabled={!isEditing}
          />

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Qualification</InputLabel>
              <Select
                id="qualificationInput"
                value={get(practitioner, 'qualification[0].code.coding[0].code', '')}
                onChange={function(e) {
                  const option = qualificationOptions.find(function(o) { return o.code === e.target.value; });
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
                {qualificationOptions.map(function(option) {
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="License Number"
              value={get(practitioner, 'qualification[0].identifier[0].value', '')}
              onChange={function(e) { handleChange('qualification[0].identifier[0].value', e.target.value); }}
              helperText="Professional license number"
              disabled={!isEditing}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              type="date"
              label="License Valid From"
              value={get(practitioner, 'qualification[0].period.start', '')}
              onChange={function(e) { handleChange('qualification[0].period.start', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />

            <TextField
              fullWidth
              type="date"
              label="License Valid To"
              value={get(practitioner, 'qualification[0].period.end', '')}
              onChange={function(e) { handleChange('qualification[0].period.end', e.target.value); }}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Specialty</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="specialtyCodeInput"
              fullWidth
              label="Specialty Code"
              value={get(practitioner, 'practitionerRole[0].specialty[0].coding[0].code', '')}
              onChange={function(e) { handleChange('practitionerRole[0].specialty[0].coding[0].code', e.target.value); }}
              helperText="Medical specialty code"
              disabled={!isEditing}
            />

            <TextField
              id="specialtyDisplayInput"
              fullWidth
              label="Specialty Display"
              value={get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '')}
              onChange={function(e) { handleChange('practitionerRole[0].specialty[0].coding[0].display', e.target.value); }}
              helperText="Medical specialty description"
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Language</Typography>

          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Primary Language</InputLabel>
            <Select
              value={get(practitioner, 'communication[0].coding[0].code', 'en')}
              onChange={function(e) {
                const option = languageOptions.find(function(o) { return o.code === e.target.value; });
                if (option) {
                  handleChange('communication[0].coding[0].code', option.code);
                  handleChange('communication[0].coding[0].display', option.display);
                }
              }}
              label="Primary Language"
            >
              {languageOptions.map(function(option) {
                return (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="savePractitionerButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    const prefix = get(practitioner, 'name[0].prefix[0]', '');
    const givenName = get(practitioner, 'name[0].given[0]', '');
    const familyName = get(practitioner, 'name[0].family', '');
    const suffix = get(practitioner, 'name[0].suffix[0]', '');
    const fullName = [prefix, givenName, familyName, suffix].filter(Boolean).join(' ');

    const activeStatus = get(practitioner, 'active', true);
    const gender = get(practitioner, 'gender', '');
    const birthDate = get(practitioner, 'birthDate', '');
    const formattedBirthDate = birthDate ? moment(birthDate).format('MMMM D, YYYY') : '';

    const phone = get(practitioner, 'telecom[0].value', '');
    const email = get(practitioner, 'telecom[1].value', '');

    const addressLine = get(practitioner, 'address[0].line[0]', '');
    const city = get(practitioner, 'address[0].city', '');
    const state = get(practitioner, 'address[0].state', '');
    const postalCode = get(practitioner, 'address[0].postalCode', '');
    const country = get(practitioner, 'address[0].country', '');
    const addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    const npi = get(practitioner, 'identifier[0].value', '');
    const qualificationCode = get(practitioner, 'qualification[0].code.coding[0].code', '');
    const qualificationDisplay = get(practitioner, 'qualification[0].code.text', '') ||
                                  get(practitioner, 'qualification[0].code.coding[0].display', '');
    const licenseNumber = get(practitioner, 'qualification[0].identifier[0].value', '');
    const licenseStart = get(practitioner, 'qualification[0].period.start', '');
    const licenseEnd = get(practitioner, 'qualification[0].period.end', '');

    const specialtyCode = get(practitioner, 'practitionerRole[0].specialty[0].coding[0].code', '');
    const specialtyDisplay = get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '');

    const language = get(practitioner, 'communication[0].coding[0].display', '');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Name + Status Chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {fullName || 'Unnamed Practitioner'}
          </Typography>
          <Chip
            label={activeStatus ? 'Active' : 'Inactive'}
            color={activeStatus ? 'success' : 'default'}
            size="small"
          />
        </Box>

        {/* Subtitle: qualification */}
        {qualificationDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {qualificationDisplay}{qualificationCode ? ' (' + qualificationCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {npi && (
              <>
                <Typography variant="overline" color="text.secondary">
                  NPI
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {npi}
                </Typography>
              </>
            )}
            {specialtyDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Specialty
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {specialtyDisplay}{specialtyCode ? ' (' + specialtyCode + ')' : ''}
                </Typography>
              </>
            )}
            {language && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Language
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {language}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {gender && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, textTransform: 'capitalize' }}>
                  {gender}
                </Typography>
              </>
            )}
            {formattedBirthDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Birth Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedBirthDate}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Contact Information */}
        {(phone || email) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {phone && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Phone
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {phone}
                    </Typography>
                  </Box>
                )}
                {email && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {email}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Address */}
        {fullAddress && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Address
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {fullAddress}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* License Information */}
        {(licenseNumber || licenseStart || licenseEnd) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {licenseNumber && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      License Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {licenseNumber}
                    </Typography>
                  </Box>
                )}
                {licenseStart && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Valid From
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {moment(licenseStart).format('MMMM D, YYYY')}
                    </Typography>
                  </Box>
                )}
                {licenseEnd && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Valid To
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {moment(licenseEnd).format('MMMM D, YYYY')}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Footer with practitioner ID */}
        {isExistingPractitioner && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Practitioner ID: {practitionerId}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="practitionerDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PractitionerDetail;
