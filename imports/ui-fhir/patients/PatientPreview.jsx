// imports/ui-fhir/patients/PatientPreview.jsx

import React from 'react';

import {
  Chip,
  Divider,
  Typography,
  Box,
  Stack
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

var genderLabels = {
  'male': 'Male',
  'female': 'Female',
  'other': 'Other',
  'unknown': 'Unknown'
};

var maritalStatusLabels = {
  'S': 'Single',
  'M': 'Married',
  'D': 'Divorced',
  'W': 'Widowed',
  'P': 'Domestic Partner',
  'U': 'Unknown'
};

var sexAtBirthLabels = {
  'M': 'Male',
  'F': 'Female',
  'UNK': 'Unknown',
  'ASKU': 'Choose Not to Disclose'
};

function PatientPreview({ resource, resourceId, embedded }) {
  var patient = resource || {};

  // Name
  var givenName = get(patient, 'name[0].given[0]', '');
  var familyName = get(patient, 'name[0].family', '');
  var fullName = get(patient, 'name[0].text', '') || [givenName, familyName].filter(Boolean).join(' ');

  // Demographics
  var gender = get(patient, 'gender', '');
  var genderLabel = get(genderLabels, gender, gender);
  var birthDate = get(patient, 'birthDate', '');
  var formattedBirthDate = birthDate ? moment(birthDate).format('MMMM D, YYYY') : '';

  // Calculate age
  var age = '';
  if (birthDate) {
    age = moment().diff(moment(birthDate), 'years') + ' years';
  }

  // Active status
  var isActive = get(patient, 'active', true);

  // Identifier (MRN)
  var mrn = get(patient, 'identifier[0].value', '');

  // Birth Sex extension
  var birthSexValue = '';
  var birthSexExt = (patient.extension || []).find(function(e) {
    return e.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex';
  });
  if (birthSexExt) {
    birthSexValue = birthSexExt.valueCode || '';
  }
  var birthSexLabel = get(sexAtBirthLabels, birthSexValue, birthSexValue);

  // Karyotype extension
  var karyotypeDisplay = '';
  var karyotypeExt = (patient.extension || []).find(function(e) {
    return e.url === 'http://hl7.org/fhir/StructureDefinition/patient-karyotype';
  });
  if (karyotypeExt && karyotypeExt.valueCodeableConcept && karyotypeExt.valueCodeableConcept.coding && karyotypeExt.valueCodeableConcept.coding[0]) {
    karyotypeDisplay = karyotypeExt.valueCodeableConcept.coding[0].display || '';
  }

  // Marital Status
  var maritalStatusCode = get(patient, 'maritalStatus.coding[0].code', '');
  var maritalStatusLabel = get(maritalStatusLabels, maritalStatusCode, '') || get(patient, 'maritalStatus.coding[0].display', '');

  // Language
  var language = get(patient, 'communication[0].language.coding[0].display', '') || get(patient, 'communication[0].language.coding[0].code', '');

  // Contact information
  var telecoms = get(patient, 'telecom', []);
  var phone = '';
  var email = '';
  telecoms.forEach(function(t) {
    if (t.system === 'phone' && !phone) phone = t.value || '';
    if (t.system === 'email' && !email) email = t.value || '';
  });

  // Address
  var addressLine = get(patient, 'address[0].line[0]', '');
  var city = get(patient, 'address[0].city', '');
  var state = get(patient, 'address[0].state', '');
  var postalCode = get(patient, 'address[0].postalCode', '');
  var country = get(patient, 'address[0].country', '');
  var addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
  var fullAddress = addressParts.join(', ');

  var isExistingPatient = resourceId && resourceId !== 'new';

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Patient name + active status chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {fullName || 'Unnamed Patient'}
        </Typography>
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {/* Subtitle: age, gender */}
      {(age || genderLabel) && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {[genderLabel, age].filter(Boolean).join(' \u2022 ')}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata: demographics */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {formattedBirthDate && (
            <>
              <Typography variant="overline" color="text.secondary">
                Date of Birth
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {formattedBirthDate}
              </Typography>
            </>
          )}
          {birthSexLabel && (
            <>
              <Typography variant="overline" color="text.secondary">
                Birth Sex
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {birthSexLabel}
              </Typography>
            </>
          )}
          {maritalStatusLabel && (
            <>
              <Typography variant="overline" color="text.secondary">
                Marital Status
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {maritalStatusLabel}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {mrn && (
            <>
              <Typography variant="overline" color="text.secondary">
                MRN
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {mrn}
              </Typography>
            </>
          )}
          {karyotypeDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Karyotype
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {karyotypeDisplay}
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
      </Box>

      <Divider />

      {/* Status chip section */}
      <Box sx={{ py: 2 }}>
        <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Status
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'default'}
            size="small"
          />
          {gender && (
            <Chip
              label={genderLabel}
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
      </Box>

      <Divider />

      {/* Contact Information */}
      {(phone || email || telecoms.length > 0) && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Contact Information
            </Typography>
            <Stack direction="row" spacing={4} sx={{ flexWrap: 'wrap' }}>
              {telecoms.map(function(t, idx) {
                if (!t.value) return null;
                var label = t.system || 'contact';
                var useLabel = t.use ? ' (' + t.use + ')' : '';
                return (
                  <Box key={idx} sx={{ mb: 1 }}>
                    <Typography variant="overline" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {label}{useLabel}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {t.value}
                    </Typography>
                  </Box>
                );
              })}
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
              {addressLine && (
                <>{addressLine}<br /></>
              )}
              {[city, state, postalCode].filter(Boolean).join(', ')}
              {country && (
                <><br />{country}</>
              )}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with patient ID */}
      {isExistingPatient && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Patient ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PatientPreview;
