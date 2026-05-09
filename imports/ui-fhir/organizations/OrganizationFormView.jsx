// imports/ui-fhir/organizations/OrganizationFormView.jsx

import React from 'react';

import {
  Box,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function OrganizationFormView({ resource, isEditing, onChange, isEmbedded }) {
  return (
    <Stack spacing={3}>
      <Typography variant="h6">Organization Information</Typography>

      <TextField
        id="nameInput"
        fullWidth
        label="Name"
        value={get(resource, 'name', '')}
        onChange={(e) => onChange('name', e.target.value)}
        helperText="Name of the organization"
        disabled={!isEditing}
      />

      <TextField
        id="identifierInput"
        fullWidth
        label="Identifier"
        value={get(resource, 'identifier[0].value', '')}
        onChange={(e) => onChange('identifier[0].value', e.target.value)}
        helperText="Unique identifier for the organization"
        disabled={!isEditing}
      />

      <FormControlLabel
        control={
          <Switch
            id="activeSwitch"
            checked={get(resource, 'active', true)}
            onChange={(e) => onChange('active', e.target.checked)}
            disabled={!isEditing}
          />
        }
        label="Active"
      />

      <Typography variant="h6">Type</Typography>

      <TextField
        id="typeCodeInput"
        fullWidth
        label="Type Code"
        value={get(resource, 'type[0].coding[0].code', '')}
        onChange={(e) => onChange('type[0].coding[0].code', e.target.value)}
        helperText="Organization type code (e.g., prov, dept, team)"
        disabled={!isEditing}
      />

      <TextField
        id="typeDisplayInput"
        fullWidth
        label="Type Display"
        value={get(resource, 'type[0].coding[0].display', '')}
        onChange={(e) => onChange('type[0].coding[0].display', e.target.value)}
        helperText="Human-readable organization type"
        disabled={!isEditing}
      />

      <Typography variant="h6">Contact Information</Typography>

      <TextField
        id="phoneInput"
        fullWidth
        label="Phone"
        value={get(resource, 'telecom[0].value', '')}
        onChange={(e) => onChange('telecom[0].value', e.target.value)}
        helperText="Contact phone number"
        disabled={!isEditing}
      />

      <TextField
        id="emailInput"
        fullWidth
        label="Email"
        value={get(resource, 'telecom[1].value', '')}
        onChange={(e) => onChange('telecom[1].value', e.target.value)}
        helperText="Contact email address"
        disabled={!isEditing}
      />

      <Typography variant="h6">Address</Typography>

      <TextField
        id="addressLineInput"
        fullWidth
        label="Address Line"
        value={get(resource, 'address[0].line[0]', '')}
        onChange={(e) => onChange('address[0].line[0]', e.target.value)}
        helperText="Street address"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="cityInput"
          fullWidth
          label="City"
          value={get(resource, 'address[0].city', '')}
          onChange={(e) => onChange('address[0].city', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="stateInput"
          fullWidth
          label="State"
          value={get(resource, 'address[0].state', '')}
          onChange={(e) => onChange('address[0].state', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="postalCodeInput"
          fullWidth
          label="Postal Code"
          value={get(resource, 'address[0].postalCode', '')}
          onChange={(e) => onChange('address[0].postalCode', e.target.value)}
          disabled={!isEditing}
        />

        <TextField
          id="countryInput"
          fullWidth
          label="Country"
          value={get(resource, 'address[0].country', '')}
          onChange={(e) => onChange('address[0].country', e.target.value)}
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Parent Organization</Typography>

      <TextField
        id="partOfInput"
        fullWidth
        label="Part Of"
        value={get(resource, 'partOf.display', '')}
        onChange={(e) => onChange('partOf.display', e.target.value)}
        helperText="Parent organization this one is part of"
        disabled={!isEditing}
      />

      <Box sx={{ mt: 2 }}>
        <Link href="https://www.hl7.org/fhir/valueset-organization-type.html" target="_blank" rel="noopener">
          Organization Type Codes
        </Link>
      </Box>
    </Stack>
  );
}

export default OrganizationFormView;
