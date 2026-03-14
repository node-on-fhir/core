// imports/ui-fhir/practitionerRoles/PractitionerRoleFormView.jsx

import React from 'react';

import {
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';

function PractitionerRoleFormView({ resource, isEditing, onChange, isEmbedded }) {
  return (
    <Stack spacing={3}>
      {/* Active Status */}
      <FormControlLabel
        control={
          <Switch
            id="activeSwitch"
            checked={get(resource, 'active', true)}
            onChange={function(e) { onChange('active', e.target.checked); }}
            disabled={!isEditing}
          />
        }
        label="Active"
      />

      <Divider>
        <Typography variant="subtitle2" color="textSecondary">
          Practitioner & Organization
        </Typography>
      </Divider>

      <Grid container spacing={3}>
        {/* Practitioner */}
        <Grid item xs={12} md={6}>
          <TextField
            id="practitionerDisplayInput"
            fullWidth
            label="Practitioner"
            value={get(resource, 'practitioner.display', '')}
            onChange={function(e) { onChange('practitioner.display', e.target.value); }}
            disabled={!isEditing}
            helperText="Display name of the practitioner"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="practitionerReferenceInput"
            fullWidth
            label="Practitioner Reference"
            value={get(resource, 'practitioner.reference', '')}
            onChange={function(e) { onChange('practitioner.reference', e.target.value); }}
            disabled={!isEditing}
            helperText="e.g., Practitioner/123"
          />
        </Grid>

        {/* Organization */}
        <Grid item xs={12} md={6}>
          <TextField
            id="organizationDisplayInput"
            fullWidth
            label="Organization"
            value={get(resource, 'organization.display', '')}
            onChange={function(e) { onChange('organization.display', e.target.value); }}
            disabled={!isEditing}
            helperText="Display name of the organization"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="organizationReferenceInput"
            fullWidth
            label="Organization Reference"
            value={get(resource, 'organization.reference', '')}
            onChange={function(e) { onChange('organization.reference', e.target.value); }}
            disabled={!isEditing}
            helperText="e.g., Organization/456"
          />
        </Grid>
      </Grid>

      <Divider>
        <Typography variant="subtitle2" color="textSecondary">
          Role & Specialty
        </Typography>
      </Divider>

      <Grid container spacing={3}>
        {/* Role/Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="roleCodeInput"
            fullWidth
            label="Role Code"
            value={get(resource, 'code[0].coding[0].code', '')}
            onChange={function(e) { onChange('code[0].coding[0].code', e.target.value); }}
            disabled={!isEditing}
            helperText="e.g., doctor, nurse, pharmacist"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="roleDisplayInput"
            fullWidth
            label="Role Display"
            value={get(resource, 'code[0].text', get(resource, 'code[0].coding[0].display', ''))}
            onChange={function(e) { onChange('code[0].text', e.target.value); }}
            disabled={!isEditing}
            helperText="Human-readable role name"
          />
        </Grid>

        {/* Specialty */}
        <Grid item xs={12} md={6}>
          <TextField
            id="specialtyCodeInput"
            fullWidth
            label="Specialty Code"
            value={get(resource, 'specialty[0].coding[0].code', '')}
            onChange={function(e) { onChange('specialty[0].coding[0].code', e.target.value); }}
            disabled={!isEditing}
            helperText="e.g., 394814009 (General Practice)"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="specialtyDisplayInput"
            fullWidth
            label="Specialty Display"
            value={get(resource, 'specialty[0].text', get(resource, 'specialty[0].coding[0].display', ''))}
            onChange={function(e) { onChange('specialty[0].text', e.target.value); }}
            disabled={!isEditing}
            helperText="Human-readable specialty name"
          />
        </Grid>
      </Grid>

      <Divider>
        <Typography variant="subtitle2" color="textSecondary">
          Contact Information
        </Typography>
      </Divider>

      <Grid container spacing={3}>
        {/* Phone */}
        <Grid item xs={12} md={6}>
          <TextField
            id="phoneInput"
            fullWidth
            label="Phone"
            value={get(resource, 'telecom[0].value', '')}
            onChange={function(e) { onChange('telecom[0].value', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Email */}
        <Grid item xs={12} md={6}>
          <TextField
            id="emailInput"
            fullWidth
            label="Email"
            value={get(resource, 'telecom[1].value', '')}
            onChange={function(e) { onChange('telecom[1].value', e.target.value); }}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>

      <Divider>
        <Typography variant="subtitle2" color="textSecondary">
          Period
        </Typography>
      </Divider>

      <Grid container spacing={3}>
        {/* Period Start */}
        <Grid item xs={12} md={6}>
          <TextField
            id="periodStartInput"
            fullWidth
            label="Period Start"
            type="date"
            value={get(resource, 'period.start', '')}
            onChange={function(e) { onChange('period.start', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        {/* Period End */}
        <Grid item xs={12} md={6}>
          <TextField
            id="periodEndInput"
            fullWidth
            label="Period End"
            type="date"
            value={get(resource, 'period.end', '')}
            onChange={function(e) { onChange('period.end', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>

      {/* Availability Exceptions */}
      <TextField
        id="availabilityExceptionsInput"
        fullWidth
        multiline
        rows={3}
        label="Availability Exceptions"
        value={get(resource, 'availabilityExceptions', '')}
        onChange={function(e) { onChange('availabilityExceptions', e.target.value); }}
        disabled={!isEditing}
        helperText="Description of availability exceptions"
      />
    </Stack>
  );
}

export default PractitionerRoleFormView;
