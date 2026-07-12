// imports/ui-fhir/medications/MedicationFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

//===========================================================================
// COMPONENT

function MedicationFormView({ resource, isEditing, onChange, isEmbedded }) {
  var medication = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Stack spacing={3}>
        {/* Medication Name */}
        <TextField
          fullWidth
          label="Medication Name"
          value={get(medication, 'code.text', '')}
          onChange={function(e) { handleChange('code.text', e.target.value); }}
          helperText="Common name for the medication"
          disabled={!isEditing}
        />

        {/* RxNorm Code + Display Name */}
        <Stack direction="row" spacing={2}>
          <TextField
            id="codeCode"
            fullWidth
            label="RxNorm Code"
            value={get(medication, 'code.coding[0].code', '')}
            onChange={function(e) { handleChange('code.coding[0].code', e.target.value); }}
            helperText="RxNorm medication code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup RxNorm codes">
                    <IconButton
                      onClick={function() { window.open('https://mor.nlm.nih.gov/RxNav/', '_blank'); }}
                      edge="end"
                      disabled={!isEditing}
                      aria-label="Lookup RxNorm codes"
                    >
                      <SearchIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            id="codeDisplay"
            fullWidth
            label="Display Name"
            value={get(medication, 'code.coding[0].display', '')}
            onChange={function(e) { handleChange('code.coding[0].display', e.target.value); }}
            helperText="Formal medication name"
            disabled={!isEditing}
          />
        </Stack>

        {/* Status, Form Code, Form Display, Manufacturer */}
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(medication, 'status', 'active')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>

          <TextField
            id="formCode"
            fullWidth
            label="Form Code"
            value={get(medication, 'form.coding[0].code', '')}
            onChange={function(e) { handleChange('form.coding[0].code', e.target.value); }}
            helperText="SNOMED code"
            disabled={!isEditing}
          />

          <TextField
            id="formDisplay"
            fullWidth
            label="Form"
            value={get(medication, 'form.coding[0].display', '') || get(medication, 'form.text', '')}
            onChange={function(e) {
              handleChange('form.coding[0].display', e.target.value);
              handleChange('form.text', e.target.value);
            }}
            helperText="e.g., tablet, capsule, liquid"
            disabled={!isEditing}
          />

          <TextField
            id="manufacturerDisplay"
            fullWidth
            label="Manufacturer"
            value={get(medication, 'manufacturer.display', '')}
            onChange={function(e) { handleChange('manufacturer.display', e.target.value); }}
            helperText="Pharmaceutical company"
            disabled={!isEditing}
          />
        </Stack>

        {/* Ingredients Section */}
        <Typography variant="h6" sx={{ mt: 2 }}>Ingredients</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="ingredientCode"
            fullWidth
            label="Ingredient Code"
            value={get(medication, 'ingredient[0].itemCodeableConcept.coding[0].code', '')}
            onChange={function(e) { handleChange('ingredient[0].itemCodeableConcept.coding[0].code', e.target.value); }}
            helperText="SNOMED code"
            disabled={!isEditing}
          />

          <TextField
            id="ingredientDisplay"
            fullWidth
            label="Ingredient Display"
            value={get(medication, 'ingredient[0].itemCodeableConcept.coding[0].display', '')}
            onChange={function(e) { handleChange('ingredient[0].itemCodeableConcept.coding[0].display', e.target.value); }}
            helperText="Active ingredient name"
            disabled={!isEditing}
          />
        </Stack>

        <Stack direction="row" spacing={2}>
          <TextField
            id="ingredientStrength"
            fullWidth
            label="Ingredient Strength"
            value={get(medication, 'ingredient[0].strength.numerator.value', '')}
            onChange={function(e) { handleChange('ingredient[0].strength.numerator.value', e.target.value); }}
            helperText="Numeric value"
            disabled={!isEditing}
          />

          <TextField
            id="ingredientStrengthUnit"
            fullWidth
            label="Strength Unit"
            value={get(medication, 'ingredient[0].strength.numerator.unit', '')}
            onChange={function(e) { handleChange('ingredient[0].strength.numerator.unit', e.target.value); }}
            helperText="e.g., mg, ml, units"
            disabled={!isEditing}
          />
        </Stack>

        {/* Batch Information Section */}
        <Typography variant="h6" sx={{ mt: 2 }}>Batch Information</Typography>

        <Stack direction="row" spacing={2}>
          <TextField
            id="batchNumber"
            fullWidth
            label="Lot Number"
            value={get(medication, 'batch.lotNumber', '')}
            onChange={function(e) { handleChange('batch.lotNumber', e.target.value); }}
            disabled={!isEditing}
          />

          <TextField
            id="expirationDate"
            fullWidth
            type="date"
            label="Expiration Date"
            value={moment(get(medication, 'batch.expirationDate', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('batch.expirationDate', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Stack>

        {/* Notes */}
        <TextField
          id="notesTextarea"
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(medication, 'note[0].text', '')}
          onChange={function(e) { handleChange('note[0].text', e.target.value); }}
          helperText="Additional notes or comments"
          disabled={!isEditing}
        />
      </Stack>
    </Box>
  );
}

export default MedicationFormView;
