// imports/ui-fhir/locations/LocationPreview.jsx

import React from 'react';

import {
  Box,
  Chip,
  Divider,
  Typography
} from '@mui/material';

import { get } from 'lodash';

//===========================================================================
// OPTIONS

const statusColorMap = {
  'active': 'success',
  'suspended': 'warning',
  'inactive': 'default'
};

//===========================================================================
// COMPONENT

function LocationPreview({ resource, resourceId, embedded }) {
  var locationName = get(resource, 'name', 'Unnamed Location');
  var status = get(resource, 'status', '');
  var mode = get(resource, 'mode', '');
  var description = get(resource, 'description', '');
  var identifier = get(resource, 'identifier[0].value', '');
  var typeCode = get(resource, 'type.coding[0].code', '');
  var typeDisplay = get(resource, 'type.coding[0].display', '');
  var physicalTypeCode = get(resource, 'physicalType.coding[0].code', '');
  var physicalTypeDisplay = get(resource, 'physicalType.coding[0].display', '');
  var operationalStatus = get(resource, 'operationalStatus.code', '');
  var phone = get(resource, 'telecom[0].value', '');
  var email = get(resource, 'telecom[1].value', '');
  var addressLine = get(resource, 'address.line[0]', '');
  var city = get(resource, 'address.city', '');
  var state = get(resource, 'address.state', '');
  var postalCode = get(resource, 'address.postalCode', '');
  var country = get(resource, 'address.country', '');
  var latitude = get(resource, 'position.latitude', '');
  var longitude = get(resource, 'position.longitude', '');
  var altitude = get(resource, 'position.altitude', '');
  var managingOrgDisplay = get(resource, 'managingOrganization.display', '');
  var partOfDisplay = get(resource, 'partOf.display', '');

  // Build formatted address
  var addressParts = [addressLine, city, state, postalCode, country].filter(Boolean);
  var formattedAddress = addressParts.length > 0;

  // Build position string
  var hasCoordinates = latitude && longitude;

  return (
    <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
      {/* Location name */}
      <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
        {locationName}
      </Typography>

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
          {mode && (
            <>
              <Typography variant="overline" color="text.secondary">
                Mode
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Typography>
            </>
          )}
          {physicalTypeDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Physical Type
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {physicalTypeDisplay}{physicalTypeCode ? ' (' + physicalTypeCode + ')' : ''}
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
              <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                {email}
              </Typography>
            </>
          )}
          {managingOrgDisplay && (
            <>
              <Typography variant="overline" color="text.secondary">
                Managing Organization
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {managingOrgDisplay}
              </Typography>
            </>
          )}
        </Box>
      </Box>

      <Divider />

      {/* Status chips */}
      <Box sx={{ display: 'flex', gap: 1, py: 2 }}>
        {status && (
          <Chip
            label={status.charAt(0).toUpperCase() + status.slice(1)}
            color={statusColorMap[status] || 'default'}
            size="small"
          />
        )}
        {operationalStatus && (
          <Chip
            label={operationalStatus.charAt(0).toUpperCase() + operationalStatus.slice(1)}
            color="info"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Divider />

      {/* Description */}
      {description && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Description
            </Typography>
            <Typography variant="body1">
              {description}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

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

      {/* Position */}
      {hasCoordinates && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Coordinates
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {latitude}, {longitude}{altitude ? ' (alt: ' + altitude + ')' : ''}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Part Of */}
      {partOfDisplay && (
        <>
          <Box sx={{ py: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Part Of
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {partOfDisplay}
            </Typography>
          </Box>
          <Divider />
        </>
      )}

      {/* Footer with location ID */}
      {resourceId && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Location ID: {resourceId}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default LocationPreview;
