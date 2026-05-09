// imports/ui-fhir/bodyStructures/BodyStructureFormView.jsx

import React from 'react';

import {
  TextField,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  Tooltip,
  Typography,
  IconButton,
  Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

function BodyStructureFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }) {
  var bodyStructure = resource || form || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Body Structure Information</Typography>

      {/* Active Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            id="activeCheckbox"
            checked={get(bodyStructure, 'active', true)}
            onChange={(e) => onChange('active', e.target.checked)}
            disabled={!isEditing}
          />
        }
        label="Active"
      />

      {/* Description */}
      <TextField
        id="descriptionInput"
        fullWidth
        label="Description"
        value={get(bodyStructure, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={2}
      />

      <Typography variant="h6">Morphology & Location</Typography>

      <Stack direction="row" spacing={2}>
        {/* Morphology */}
        <TextField
          id="morphologyInput"
          fullWidth
          label="Morphology"
          value={get(bodyStructure, 'morphology.text', get(bodyStructure, 'morphology.coding.0.display', ''))}
          onChange={(e) => onChange('morphology', {
            coding: [{
              system: 'http://snomed.info/sct',
              display: e.target.value
            }],
            text: e.target.value
          })}
          disabled={!isEditing}
          helperText="What type of structure (e.g., Normal anatomical structure)"
        />

        {/* Structure */}
        <TextField
          id="structureInput"
          fullWidth
          label="Body Structure Location"
          value={get(bodyStructure, 'includedStructure.0.structure.text',
            get(bodyStructure, 'includedStructure.0.structure.coding.0.display', ''))}
          onChange={(e) => onChange('includedStructure', [{
            structure: {
              coding: [{
                system: 'http://snomed.info/sct',
                display: e.target.value
              }],
              text: e.target.value
            }
          }])}
          disabled={!isEditing}
          helperText="Where on the body (e.g., Left upper arm)"
        />
      </Stack>

      <Typography variant="h6">Patient Association</Typography>

      {/* Patient */}
      <TextField
        id="patientDisplay"
        fullWidth
        label="Patient"
        value={get(bodyStructure, 'patient.display', '')}
        onChange={(e) => onChange('patient.display', e.target.value)}
        disabled={!isEditing}
        helperText={get(bodyStructure, 'patient.reference', '') || 'Patient reference will be assigned'}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton
                  onClick={onSearchPatient}
                  edge="end"
                  disabled={!isEditing}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
    </Stack>
  );
}

export default BodyStructureFormView;
