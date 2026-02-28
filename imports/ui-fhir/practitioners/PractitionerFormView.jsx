// imports/ui-fhir/practitioners/PractitionerFormView.jsx

import React from 'react';

import {
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
  FormControlLabel,
  Switch
} from '@mui/material';

import { get } from 'lodash';

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

function PractitionerFormView({ resource, form, isEditing, onChange, isEmbedded }) {
  // Use form data for field values when available, fall back to resource
  var practitioner = form || resource || {};

  return (
    <Stack spacing={3}>
      <FormControlLabel
        control={
          <Switch
            id="activeSwitch"
            checked={get(practitioner, 'active', true)}
            onChange={function(e) { onChange('active', e.target.checked); }}
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
        onChange={function(e) { onChange('name[0].prefix[0]', e.target.value); }}
        helperText="e.g., Dr., Prof."
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="givenNameInput"
          fullWidth
          label="First Name"
          value={get(practitioner, 'name[0].given[0]', '')}
          onChange={function(e) { onChange('name[0].given[0]', e.target.value); }}
          required
          disabled={!isEditing}
        />

        <TextField
          id="familyNameInput"
          fullWidth
          label="Last Name"
          value={get(practitioner, 'name[0].family', '')}
          onChange={function(e) { onChange('name[0].family', e.target.value); }}
          required
          disabled={!isEditing}
        />
      </Stack>

      <TextField
        fullWidth
        label="Suffix"
        value={get(practitioner, 'name[0].suffix[0]', '')}
        onChange={function(e) { onChange('name[0].suffix[0]', e.target.value); }}
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
          onChange={function(e) { onChange('telecom[0].value', e.target.value); }}
          helperText="Work phone number"
          disabled={!isEditing}
        />

        <TextField
          id="emailInput"
          fullWidth
          label="Email Address"
          value={get(practitioner, 'telecom[1].value', '')}
          onChange={function(e) { onChange('telecom[1].value', e.target.value); }}
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
        onChange={function(e) { onChange('address[0].line[0]', e.target.value); }}
        helperText="Street address"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="cityInput"
          fullWidth
          label="City"
          value={get(practitioner, 'address[0].city', '')}
          onChange={function(e) { onChange('address[0].city', e.target.value); }}
          disabled={!isEditing}
        />

        <TextField
          id="stateInput"
          fullWidth
          label="State"
          value={get(practitioner, 'address[0].state', '')}
          onChange={function(e) { onChange('address[0].state', e.target.value); }}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="postalCodeInput"
          fullWidth
          label="Postal Code"
          value={get(practitioner, 'address[0].postalCode', '')}
          onChange={function(e) { onChange('address[0].postalCode', e.target.value); }}
          disabled={!isEditing}
        />

        <TextField
          id="countryInput"
          fullWidth
          label="Country"
          value={get(practitioner, 'address[0].country', 'USA')}
          onChange={function(e) { onChange('address[0].country', e.target.value); }}
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
            onChange={function(e) { onChange('gender', e.target.value); }}
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
          onChange={function(e) { onChange('birthDate', e.target.value); }}
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
        onChange={function(e) { onChange('identifier[0].value', e.target.value); }}
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
              var option = qualificationOptions.find(function(o) { return o.code === e.target.value; });
              if (option) {
                onChange('qualification[0].code.coding[0].code', option.code);
                onChange('qualification[0].code.coding[0].display', option.display);
                onChange('qualification[0].code.text', option.display);
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
          onChange={function(e) { onChange('qualification[0].identifier[0].value', e.target.value); }}
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
          onChange={function(e) { onChange('qualification[0].period.start', e.target.value); }}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />

        <TextField
          fullWidth
          type="date"
          label="License Valid To"
          value={get(practitioner, 'qualification[0].period.end', '')}
          onChange={function(e) { onChange('qualification[0].period.end', e.target.value); }}
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
          onChange={function(e) { onChange('practitionerRole[0].specialty[0].coding[0].code', e.target.value); }}
          helperText="Medical specialty code"
          disabled={!isEditing}
        />

        <TextField
          id="specialtyDisplayInput"
          fullWidth
          label="Specialty Display"
          value={get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '')}
          onChange={function(e) { onChange('practitionerRole[0].specialty[0].coding[0].display', e.target.value); }}
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
            var option = languageOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              onChange('communication[0].coding[0].code', option.code);
              onChange('communication[0].coding[0].display', option.display);
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
  );
}

export default PractitionerFormView;
