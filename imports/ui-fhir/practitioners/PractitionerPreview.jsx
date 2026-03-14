// imports/ui-fhir/practitioners/PractitionerPreview.jsx

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

function PractitionerPreview({ resource, resourceId, embedded }) {
  var practitioner = resource || {};

  var prefix = get(practitioner, 'name[0].prefix[0]', '');
  var givenName = get(practitioner, 'name[0].given[0]', '');
  var familyName = get(practitioner, 'name[0].family', '');
  var suffix = get(practitioner, 'name[0].suffix[0]', '');
  var fullName = [prefix, givenName, familyName, suffix].filter(Boolean).join(' ');

  var activeStatus = get(practitioner, 'active', true);
  var gender = get(practitioner, 'gender', '');
  var birthDate = get(practitioner, 'birthDate', '');
  var formattedBirthDate = birthDate ? moment(birthDate).format('MMMM D, YYYY') : '';

  var phone = get(practitioner, 'telecom[0].value', '');
  var email = get(practitioner, 'telecom[1].value', '');

  var addressLine = get(practitioner, 'address[0].line[0]', '');
  var city = get(practitioner, 'address[0].city', '');
  var state = get(practitioner, 'address[0].state', '');
  var postalCode = get(practitioner, 'address[0].postalCode', '');
  var country = get(practitioner, 'address[0].country', '');
  var addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
  var fullAddress = addressParts.join(', ');

  var npi = get(practitioner, 'identifier[0].value', '');
  var qualificationCode = get(practitioner, 'qualification[0].code.coding[0].code', '');
  var qualificationDisplay = get(practitioner, 'qualification[0].code.text', '') ||
                              get(practitioner, 'qualification[0].code.coding[0].display', '');
  var licenseNumber = get(practitioner, 'qualification[0].identifier[0].value', '');
  var licenseStart = get(practitioner, 'qualification[0].period.start', '');
  var licenseEnd = get(practitioner, 'qualification[0].period.end', '');

  var specialtyCode = get(practitioner, 'practitionerRole[0].specialty[0].coding[0].code', '');
  var specialtyDisplay = get(practitioner, 'practitionerRole[0].specialty[0].coding[0].display', '');

  var language = get(practitioner, 'communication[0].coding[0].display', '');

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
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Practitioner ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default PractitionerPreview;
