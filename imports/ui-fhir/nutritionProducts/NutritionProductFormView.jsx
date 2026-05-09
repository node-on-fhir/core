// imports/ui-fhir/nutritionProducts/NutritionProductFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Tooltip,
  Typography,
  IconButton,
  Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'entered-in-error', label: 'Entered in Error' }
];

const categoryOptions = [
  { value: 'enteral-formula', label: 'Enteral Formula' },
  { value: 'infant-formula', label: 'Infant Formula' },
  { value: 'oral-supplement', label: 'Oral Supplement' },
  { value: 'parenteral-nutrition', label: 'Parenteral Nutrition' },
  { value: 'food', label: 'Food' }
];

function NutritionProductFormView({ resource, isEditing, onChange, isEmbedded }) {
  var nutritionProduct = resource || {};

  return (
    <Stack spacing={3}>
      <Typography variant="h6">Product Information</Typography>

      <TextField
        id="codeText"
        fullWidth
        label="Product Name"
        value={get(nutritionProduct, 'code.text', '')}
        onChange={function(e) { onChange('code.text', e.target.value); }}
        helperText="Common name for the nutrition product"
        disabled={!isEditing}
      />

      <Stack direction="row" spacing={2}>
        <TextField
          id="codeCode"
          fullWidth
          label="SNOMED CT Code"
          value={get(nutritionProduct, 'code.coding[0].code', '')}
          onChange={function(e) { onChange('code.coding[0].code', e.target.value); }}
          helperText="SNOMED CT nutrition product code"
          disabled={!isEditing}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Lookup SNOMED CT codes">
                  <IconButton
                    onClick={function() { window.open('https://browser.ihtsdotools.org/', '_blank'); }}
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
          value={get(nutritionProduct, 'code.coding[0].display', '')}
          onChange={function(e) { onChange('code.coding[0].display', e.target.value); }}
          helperText="Formal product name"
          disabled={!isEditing}
        />
      </Stack>

      <Typography variant="h6">Status & Category</Typography>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth disabled={!isEditing}>
          <InputLabel>Status</InputLabel>
          <Select
            id="status"
            value={get(nutritionProduct, 'status', 'active')}
            onChange={function(e) { onChange('status', e.target.value); }}
            label="Status"
          >
            {statusOptions.map(function(option) {
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
            id="category"
            value={get(nutritionProduct, 'category[0].coding[0].code', '')}
            onChange={function(e) {
              onChange('category[0].coding[0].code', e.target.value);
              var selectedCategory = categoryOptions.find(function(opt) { return opt.value === e.target.value; });
              if (selectedCategory) {
                onChange('category[0].coding[0].display', selectedCategory.label);
                onChange('category[0].text', selectedCategory.label);
              }
            }}
            label="Category"
          >
            {categoryOptions.map(function(option) {
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="h6">Manufacturer</Typography>

      <TextField
        id="manufacturerDisplay"
        fullWidth
        label="Manufacturer"
        value={get(nutritionProduct, 'manufacturer[0].display', '')}
        onChange={function(e) { onChange('manufacturer[0].display', e.target.value); }}
        helperText="Company that produces this product"
        disabled={!isEditing}
      />

      <Typography variant="h6">Description & Notes</Typography>

      <TextField
        id="description"
        fullWidth
        multiline
        rows={3}
        label="Description"
        value={get(nutritionProduct, 'productCharacteristic[0].valueString', '')}
        onChange={function(e) { onChange('productCharacteristic[0].valueString', e.target.value); }}
        helperText="Detailed description of the product"
        disabled={!isEditing}
      />

      <TextField
        id="notesTextarea"
        fullWidth
        multiline
        rows={2}
        label="Notes"
        value={get(nutritionProduct, 'note[0].text', '')}
        onChange={function(e) { onChange('note[0].text', e.target.value); }}
        helperText="Additional notes or comments"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default NutritionProductFormView;
