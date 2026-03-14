// imports/ui-fhir/organizations/OrganizationPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function OrganizationPreview({ resource, resourceId, embedded }) {
  const orgName = get(resource, 'name', 'Unnamed Organization');
  const isActive = get(resource, 'active', true);
  const typeCode = get(resource, 'type[0].coding[0].code', '');
  const typeDisplay = get(resource, 'type[0].coding[0].display', '');
  const identifier = get(resource, 'identifier[0].value', '');
  const phone = get(resource, 'telecom[0].value', '');
  const email = get(resource, 'telecom[1].value', '');
  const addressLine = get(resource, 'address[0].line[0]', '');
  const city = get(resource, 'address[0].city', '');
  const state = get(resource, 'address[0].state', '');
  const postalCode = get(resource, 'address[0].postalCode', '');
  const country = get(resource, 'address[0].country', '');
  const partOfDisplay = get(resource, 'partOf.display', '');

  // Build formatted address
  const addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
  const formattedAddress = addressParts.join(', ');

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Organization name + active chip */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 500 }}>
          {orgName}
        </Typography>
        <Chip
          label={isActive ? 'Active' : 'Inactive'}
          color={isActive ? 'success' : 'default'}
          size="small"
        />
      </Box>

      {typeDisplay && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {typeDisplay}{typeCode ? ' (' + typeCode + ')' : ''}
        </Typography>
      )}

      <Divider />

      {/* Two-column metadata */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
        <Box>
          {identifier && (
            <>
              <Typography variant="overline" color="text.secondary">
                Identifier
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {identifier}
              </Typography>
            </>
          )}
          {partOfDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Part Of
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {partOfDisplay}
              </Typography>
            </>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {phone && (
            <>
              <Typography variant="overline" color="text.secondary">
                Phone
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {phone}
              </Typography>
            </>
          )}
          {email && (
            <>
              <Typography variant="overline" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {email}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Address section */}
      {formattedAddress && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Address
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {addressLine && <>{addressLine}<br /></>}
              {[city, state, postalCode].filter(Boolean).join(', ')}
              {country && <><br />{country}</>}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with organization ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Organization ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default OrganizationPreview;
