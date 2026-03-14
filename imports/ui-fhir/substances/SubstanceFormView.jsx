// imports/ui-fhir/substances/SubstanceFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Stack,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const categoryOptions = [
  { value: 'allergen', label: 'Allergen' },
  { value: 'biological', label: 'Biological Substance' },
  { value: 'body', label: 'Body Substance' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'food', label: 'Dietary Substance' },
  { value: 'drug', label: 'Drug or Medicament' },
  { value: 'material', label: 'Material' }
];

function SubstanceFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Stack spacing={3}>
      <TextField
        id="codeText"
        fullWidth
        label="Substance Name"
        value={get(form, 'codeText', '')}
        onChange={(e) => onChange('codeText', e.target.value)}
        helperText="Common name for the substance"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="codeCode"
          fullWidth
          label="SNOMED Code"
          value={get(form, 'codeCode', '')}
          onChange={(e) => onChange('codeCode', e.target.value)}
          helperText="SNOMED CT code"
          disabled={!isEditing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Lookup SNOMED codes">
                  <IconButton
                    onClick={function(){ window.open('https://browser.ihtsdotools.org/', '_blank'); }}
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

        <TextField
          id="codeDisplay"
          fullWidth
          label="Display Name"
          value={get(form, 'codeDisplay', '')}
          onChange={(e) => onChange('codeDisplay', e.target.value)}
          helperText="Formal substance name"
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
            value={get(form, 'status', 'active')}
            onChange={(e) => onChange('status', e.target.value)}
            label="Status"
          >
            {statusOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Category</InputLabel>
          <Select
            id="categorySelect"
            value={get(form, 'categoryCode', '')}
            onChange={(e) => {
              var selectedOption = categoryOptions.find(function(opt){ return opt.value === e.target.value; });
              onChange('categoryCode', e.target.value);
              onChange('categoryDisplay', selectedOption ? selectedOption.label : '');
            }}
            label="Category"
          >
            {categoryOptions.map(function(option){
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <TextField
        id="description"
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={get(form, 'description', '')}
        onChange={(e) => onChange('description', e.target.value)}
        helperText="Textual description of the substance"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }} color="text.primary">Instance Information</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="instanceIdentifier"
          fullWidth
          label="Instance Identifier"
          value={get(form, 'instanceIdentifier', '')}
          onChange={(e) => onChange('instanceIdentifier', e.target.value)}
          helperText="Lot number or batch identifier"
          disabled={!isEditing}
        />

        <TextField
          id="instanceExpiry"
          fullWidth
          type="date"
          label="Expiry Date"
          value={get(form, 'instanceExpiry', '')}
          onChange={(e) => onChange('instanceExpiry', e.target.value)}
          InputLabelProps={{ shrink: true }}
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="instanceQuantityValue"
          fullWidth
          label="Quantity Value"
          type="number"
          value={get(form, 'instanceQuantityValue', '')}
          onChange={(e) => onChange('instanceQuantityValue', e.target.value)}
          helperText="Amount available"
          disabled={!isEditing}
        />

        <TextField
          id="instanceQuantityUnit"
          fullWidth
          label="Quantity Unit"
          value={get(form, 'instanceQuantityUnit', '')}
          onChange={(e) => onChange('instanceQuantityUnit', e.target.value)}
          helperText="e.g., mg, ml, g"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6" sx={{ mt: 2 }} color="text.primary">Ingredient Information</Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          id="ingredientCode"
          fullWidth
          label="Ingredient Code"
          value={get(form, 'ingredientCode', '')}
          onChange={(e) => onChange('ingredientCode', e.target.value)}
          helperText="SNOMED code for ingredient"
          disabled={!isEditing}
        />

        <TextField
          id="ingredientDisplay"
          fullWidth
          label="Ingredient Name"
          value={get(form, 'ingredientDisplay', '')}
          onChange={(e) => onChange('ingredientDisplay', e.target.value)}
          helperText="Name of ingredient substance"
          disabled={!isEditing}
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          id="ingredientNumeratorValue"
          fullWidth
          label="Ratio Numerator"
          type="number"
          value={get(form, 'ingredientNumeratorValue', '')}
          onChange={(e) => onChange('ingredientNumeratorValue', e.target.value)}
          helperText="Amount of ingredient"
          disabled={!isEditing}
        />

        <TextField
          id="ingredientNumeratorUnit"
          fullWidth
          label="Numerator Unit"
          value={get(form, 'ingredientNumeratorUnit', '')}
          onChange={(e) => onChange('ingredientNumeratorUnit', e.target.value)}
          helperText="e.g., mg"
          disabled={!isEditing}
        />

        <TextField
          id="ingredientDenominatorValue"
          fullWidth
          label="Ratio Denominator"
          type="number"
          value={get(form, 'ingredientDenominatorValue', '')}
          onChange={(e) => onChange('ingredientDenominatorValue', e.target.value)}
          helperText="Per this amount"
          disabled={!isEditing}
        />

        <TextField
          id="ingredientDenominatorUnit"
          fullWidth
          label="Denominator Unit"
          value={get(form, 'ingredientDenominatorUnit', '')}
          onChange={(e) => onChange('ingredientDenominatorUnit', e.target.value)}
          helperText="e.g., ml, tablet"
          disabled={!isEditing}
        />
      </Stack>
    </Stack>
  );
}

export default SubstanceFormView;
