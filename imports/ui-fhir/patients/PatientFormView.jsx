// imports/ui-fhir/patients/PatientFormView.jsx

import React from 'react';

import { Meteor } from 'meteor/meteor';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Typography,
  Button,
  Grid,
  Box,
  Stack
} from '@mui/material';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';
import moment from 'moment';

var genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'unknown', label: 'Unknown' }
];

var maritalStatusOptions = [
  { value: 'S', label: 'Single' },
  { value: 'M', label: 'Married' },
  { value: 'D', label: 'Divorced' },
  { value: 'W', label: 'Widowed' },
  { value: 'P', label: 'Domestic Partner' },
  { value: 'U', label: 'Unknown' }
];

var sexAtBirthOptions = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'UNK', label: 'Unknown' },
  { value: 'ASKU', label: 'Choose Not to Disclose' }
];

// US Core race/ethnicity (CDCREC / OMB categories). Recording these is an
// opt-in, settings-gated feature — several countries legally forbid collecting
// race/ethnicity, so the fields render only when
// settings.public.modules.patientDemographics.raceEthnicity is true.
var CDCREC_SYSTEM = 'urn:oid:2.16.840.1.113883.6.238';
var NULLFLAVOR_SYSTEM = 'http://terminology.hl7.org/CodeSystem/v3-NullFlavor';
var US_CORE_RACE_URL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
var US_CORE_ETHNICITY_URL = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity';

var raceOptions = [
  { code: '1002-5', display: 'American Indian or Alaska Native', system: CDCREC_SYSTEM },
  { code: '2028-9', display: 'Asian', system: CDCREC_SYSTEM },
  { code: '2054-5', display: 'Black or African American', system: CDCREC_SYSTEM },
  { code: '2076-8', display: 'Native Hawaiian or Other Pacific Islander', system: CDCREC_SYSTEM },
  { code: '2106-3', display: 'White', system: CDCREC_SYSTEM },
  { code: 'ASKU', display: 'Declined to specify', system: NULLFLAVOR_SYSTEM }
];

var ethnicityOptions = [
  { code: '2135-2', display: 'Hispanic or Latino', system: CDCREC_SYSTEM },
  { code: '2186-5', display: 'Not Hispanic or Latino', system: CDCREC_SYSTEM },
  { code: 'ASKU', display: 'Declined to specify', system: NULLFLAVOR_SYSTEM }
];

var karyotypeOptions = [
  { value: '734002005', label: 'XX (Typical Female)' },
  { value: '734003000', label: 'XY (Typical Male)' },
  { value: '80427008', label: 'X0 (Turner Syndrome)' },
  { value: '41979000', label: 'XXY (Klinefelter Syndrome)' },
  { value: '20704005', label: 'XYY (Jacob\'s Syndrome)' },
  { value: '30699003', label: 'XXX (Triple X Syndrome)' },
  { value: '261665006', label: 'Unknown' },
  { value: 'OTH', label: 'Other' }
];

var languageOptions = [
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

var telecomSystemOptions = [
  { value: 'phone', label: 'Phone' },
  { value: 'fax', label: 'Fax' },
  { value: 'email', label: 'Email' },
  { value: 'pager', label: 'Pager' },
  { value: 'url', label: 'URL' },
  { value: 'sms', label: 'SMS' },
  { value: 'other', label: 'Other' }
];

var telecomUseOptions = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'temp', label: 'Temporary' },
  { value: 'old', label: 'Old' },
  { value: 'mobile', label: 'Mobile' }
];

function PatientFormView({ resource, isEditing, onChange, isEmbedded, onAddTelecom, onRemoveTelecom, onBirthSexChange, onKaryotypeChange, onRaceChange, onEthnicityChange, onSetPatient }) {
  var patient = resource || {};

  // Settings gate — race/ethnicity collection is opt-in (forbidden in some
  // jurisdictions). Absent setting ⇒ off. See international-deployment note above.
  var raceEthnicityEnabled = get(Meteor, 'settings.public.modules.patientDemographics.raceEthnicity', false);

  // Helper to get the birth sex extension value
  function getBirthSexValue() {
    var ext = (patient.extension || []).find(function(e) {
      return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex';
    });
    return ext ? ext.valueCode || '' : '';
  }

  // Helpers to read US Core race/ethnicity complex extensions → array of OMB codes
  function getComplexExtensionCodes(url) {
    var ext = (patient.extension || []).find(function(e) { return e.url === url; });
    if (!ext || !Array.isArray(ext.extension)) { return []; }
    return ext.extension
      .filter(function(se) { return se.url === 'ombCategory' && se.valueCoding && se.valueCoding.code; })
      .map(function(se) { return se.valueCoding.code; });
  }
  function getRaceValues() { return getComplexExtensionCodes(US_CORE_RACE_URL); }
  function getEthnicityValues() { return getComplexExtensionCodes(US_CORE_ETHNICITY_URL); }

  // Helper to get the karyotype extension value
  function getKaryotypeValue() {
    var ext = (patient.extension || []).find(function(e) {
      return e.url === 'http://hl7.org/fhir/StructureDefinition/patient-karyotype';
    });
    return ext && ext.valueCodeableConcept && ext.valueCodeableConcept.coding && ext.valueCodeableConcept.coding[0]
      ? ext.valueCodeableConcept.coding[0].code || ''
      : '';
  }

  // Helper to get telecom label
  function getTelecomLabel(system) {
    switch(system) {
      case 'email': return 'Email Address';
      case 'url': return 'Website URL';
      case 'fax': return 'Fax Number';
      case 'pager': return 'Pager Number';
      case 'sms': return 'SMS Number';
      default: return 'Phone Number';
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Stack spacing={3}>
        {/* Name Section */}
        <Box>
          <Typography variant="h6" gutterBottom>Name</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="givenNameInput"
                data-testid="patient-firstname-field"
                fullWidth
                label="Given Name(s)"
                value={get(patient, 'name[0].given[0]', '')}
                onChange={function(e) { onChange('name[0].given[0]', e.target.value); }}
                required
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="familyNameInput"
                data-testid="patient-lastname-field"
                fullWidth
                label="Family Name"
                value={get(patient, 'name[0].family', '')}
                onChange={function(e) { onChange('name[0].family', e.target.value); }}
                required
                disabled={!isEditing}
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
                data-testid="patient-mrn-field"
                fullWidth
                label="Medical Record Number"
                value={get(patient, 'identifier[0].value', '')}
                onChange={function(e) { onChange('identifier[0].value', e.target.value); }}
                helperText="Medical record number or other identifier"
                disabled={!isEditing}
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
                onChange={function(newValue) { onChange('birthDate', newValue ? newValue.format('YYYY-MM-DD') : ''); }}
                disabled={!isEditing}
                slotProps={{ textField: { id: 'birthDateInput', 'data-testid': 'patient-birthdate-field', fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Birth Sex</InputLabel>
                <Select
                  data-testid="patient-birthsex-select"
                  value={getBirthSexValue()}
                  onChange={function(e) {
                    if (onBirthSexChange) {
                      onBirthSexChange(e.target.value);
                    }
                  }}
                  label="Birth Sex"
                >
                  {sexAtBirthOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Row 2: Language | Karyotype */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Language</InputLabel>
                <Select
                  data-testid="patient-language-select"
                  value={get(patient, 'communication[0].language.coding[0].code', '')}
                  onChange={function(e) {
                    var selected = languageOptions.find(function(opt) { return opt.code === e.target.value; });
                    onChange('communication[0].language.coding[0].code', e.target.value);
                    onChange('communication[0].language.coding[0].display', selected ? selected.display : '');
                  }}
                  label="Language"
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Karyotype</InputLabel>
                <Select
                  data-testid="patient-karyotype-select"
                  value={getKaryotypeValue()}
                  onChange={function(e) {
                    if (onKaryotypeChange) {
                      onKaryotypeChange(e.target.value);
                    }
                  }}
                  label="Karyotype"
                >
                  {karyotypeOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>

            {/* Race | Ethnicity (US Core CDCREC) — settings-gated, opt-in.
                Hidden entirely where race/ethnicity collection is disabled. */}
            {raceEthnicityEnabled && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel id="patient-race-label">Race</InputLabel>
                  <Select
                    labelId="patient-race-label"
                    data-testid="patient-race-select"
                    multiple
                    value={getRaceValues()}
                    onChange={function(e) {
                      var codes = e.target.value;
                      var selected = codes.map(function(c) {
                        return raceOptions.find(function(o) { return o.code === c; }) || { code: c, display: c, system: CDCREC_SYSTEM };
                      });
                      if (onRaceChange) { onRaceChange(selected); }
                    }}
                    renderValue={function(selected) {
                      return selected.map(function(c) {
                        var o = raceOptions.find(function(x) { return x.code === c; });
                        return o ? o.display : c;
                      }).join(', ');
                    }}
                    label="Race"
                  >
                    {raceOptions.map(function(option) {
                      return (
                        <MenuItem key={option.code} value={option.code}>
                          {option.display}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {raceEthnicityEnabled && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!isEditing}>
                  <InputLabel id="patient-ethnicity-label">Ethnicity</InputLabel>
                  <Select
                    labelId="patient-ethnicity-label"
                    data-testid="patient-ethnicity-select"
                    multiple
                    value={getEthnicityValues()}
                    onChange={function(e) {
                      var codes = e.target.value;
                      var selected = codes.map(function(c) {
                        return ethnicityOptions.find(function(o) { return o.code === c; }) || { code: c, display: c, system: CDCREC_SYSTEM };
                      });
                      if (onEthnicityChange) { onEthnicityChange(selected); }
                    }}
                    renderValue={function(selected) {
                      return selected.map(function(c) {
                        var o = ethnicityOptions.find(function(x) { return x.code === c; });
                        return o ? o.display : c;
                      }).join(', ');
                    }}
                    label="Ethnicity"
                  >
                    {ethnicityOptions.map(function(option) {
                      return (
                        <MenuItem key={option.code} value={option.code}>
                          {option.display}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Row 3: Marital Status | Gender */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Marital Status</InputLabel>
                <Select
                  data-testid="patient-maritalstatus-select"
                  value={get(patient, 'maritalStatus.coding[0].code', '')}
                  onChange={function(e) {
                    var selected = maritalStatusOptions.find(function(opt) { return opt.value === e.target.value; });
                    onChange('maritalStatus.coding[0].code', e.target.value);
                    onChange('maritalStatus.coding[0].display', selected ? selected.label : '');
                  }}
                  label="Marital Status"
                >
                  {maritalStatusOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Gender</InputLabel>
                <Select
                  id="genderSelect"
                  data-testid="patient-gender-select"
                  value={patient.gender || ''}
                  onChange={function(e) { onChange('gender', e.target.value); }}
                  label="Gender"
                >
                  {genderOptions.map(function(option) {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Contact Information */}
        <Box>
          <Typography variant="h6" gutterBottom>
            Contact Information
            {isEditing && onAddTelecom && (
              <Button
                startIcon={<AddIcon />}
                onClick={onAddTelecom}
                size="small"
                sx={{ ml: 2 }}
                data-testid="add-telecom-button"
              >
                Add Contact
              </Button>
            )}
          </Typography>

          {(patient.telecom || []).map(function(telecom, index) {
            return (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>System</InputLabel>
                    <Select
                      data-testid={'patient-telecom-system-' + index}
                      value={telecom.system || 'phone'}
                      onChange={function(e) { onChange('telecom[' + index + '].system', e.target.value); }}
                      label="System"
                    >
                      {telecomSystemOptions.map(function(option) {
                        return (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    id={
                      (index === 0 && telecom.system === 'phone') ? 'phoneInput' :
                      (index === 0 && telecom.system === 'email') ? 'emailInput' :
                      (index === 1 && telecom.system === 'email') ? 'emailInput' :
                      'telecom' + index + 'Input'
                    }
                    data-testid={'patient-telecom-value-' + index}
                    fullWidth
                    label={getTelecomLabel(telecom.system)}
                    type={telecom.system === 'email' ? 'email' : telecom.system === 'url' ? 'url' : 'text'}
                    value={telecom.value || ''}
                    onChange={function(e) { onChange('telecom[' + index + '].value', e.target.value); }}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth disabled={!isEditing}>
                    <InputLabel>Use</InputLabel>
                    <Select
                      data-testid={'patient-telecom-use-' + index}
                      value={telecom.use || 'home'}
                      onChange={function(e) { onChange('telecom[' + index + '].use', e.target.value); }}
                      label="Use"
                    >
                      {telecomUseOptions.map(function(option) {
                        return (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton
                    data-testid={'patient-telecom-delete-' + index}
                    onClick={function() { if (onRemoveTelecom) { onRemoveTelecom(index); } }}
                    disabled={!isEditing || (patient.telecom || []).length <= 1}
                    color="error"
                    sx={{ mt: 1 }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            );
          })}

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
                data-testid="patient-address-line"
                fullWidth
                label="Street Address"
                value={get(patient, 'address[0].line[0]', '')}
                onChange={function(e) { onChange('address[0].line[0]', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="cityInput"
                data-testid="patient-address-city"
                fullWidth
                label="City"
                value={get(patient, 'address[0].city', '')}
                onChange={function(e) { onChange('address[0].city', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                id="stateInput"
                data-testid="patient-address-state"
                fullWidth
                label="State"
                value={get(patient, 'address[0].state', '')}
                onChange={function(e) { onChange('address[0].state', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                id="postalCodeInput"
                data-testid="patient-address-postalcode"
                fullWidth
                label="ZIP Code"
                value={get(patient, 'address[0].postalCode', '')}
                onChange={function(e) { onChange('address[0].postalCode', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="countryInput"
                data-testid="patient-address-country"
                fullWidth
                label="Country"
                value={get(patient, 'address[0].country', '')}
                onChange={function(e) { onChange('address[0].country', e.target.value); }}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </LocalizationProvider>
  );
}

export default PatientFormView;
