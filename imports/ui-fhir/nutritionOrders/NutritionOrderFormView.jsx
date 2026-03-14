// imports/ui-fhir/nutritionOrders/NutritionOrderFormView.jsx

import React from 'react';

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { code: 'draft', display: 'Draft' },
  { code: 'active', display: 'Active' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'revoked', display: 'Revoked' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const intentOptions = [
  { code: 'proposal', display: 'Proposal' },
  { code: 'plan', display: 'Plan' },
  { code: 'directive', display: 'Directive' },
  { code: 'order', display: 'Order' },
  { code: 'original-order', display: 'Original Order' },
  { code: 'reflex-order', display: 'Reflex Order' },
  { code: 'filler-order', display: 'Filler Order' },
  { code: 'instance-order', display: 'Instance Order' },
  { code: 'option', display: 'Option' }
];

const dietTypeOptions = [
  { code: '422972009', display: 'Advance diet as tolerated' },
  { code: '33489005', display: 'Clear liquid diet' },
  { code: '422853006', display: 'Diabetic diet' },
  { code: '435801000124105', display: 'Full liquid diet' },
  { code: '160675004', display: 'General diet' },
  { code: '38226001', display: 'Low fat diet' },
  { code: '182955004', display: 'Low protein diet' },
  { code: '386619000', display: 'Low sodium diet' },
  { code: '182954000', display: 'Mechanical soft diet' },
  { code: '229912004', display: 'NPO (Nothing by mouth)' },
  { code: '229913009', display: 'Pureed diet' },
  { code: '223456000', display: 'Soft diet' }
];

const textureOptions = [
  { code: '228055009', display: 'Liquidized food' },
  { code: '439091000124107', display: 'Easy to chew food' },
  { code: '228059003', display: 'Soft food' },
  { code: '441761000124103', display: 'Minced food' },
  { code: '441751000124100', display: 'Chopped food' }
];

const fluidConsistencyOptions = [
  { code: '439081000124108', display: 'Thin liquid' },
  { code: '439111000124108', display: 'Nectar thick liquid' },
  { code: '439101000124109', display: 'Honey thick liquid' },
  { code: '439091000124107', display: 'Pudding thick liquid' }
];

//===========================================================================
// COMPONENT

function NutritionOrderFormView({ resource, isEditing, onChange, isEmbedded }) {
  var nutritionOrder = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Stack spacing={3}>
      <TextField
        id="patientDisplay"
        fullWidth
        label="Patient Name"
        value={get(nutritionOrder, 'patient.display', '')}
        helperText={get(nutritionOrder, 'patient.reference', '') || 'Patient reference will be assigned'}
        disabled
      />

      <TextField
        id="ordererDisplay"
        fullWidth
        label="Orderer Name"
        value={get(nutritionOrder, 'orderer.display', '')}
        onChange={function(e) { handleChange('orderer.display', e.target.value); }}
        helperText={get(nutritionOrder, 'orderer.reference', '') || 'Orderer reference will be assigned'}
        disabled={!isEditing}
      />

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel id="statusSelectLabel">Status</InputLabel>
        <Select
          id="statusSelect"
          labelId="statusSelectLabel"
          value={get(nutritionOrder, 'status', 'active')}
          onChange={function(e) { handleChange('status', e.target.value); }}
          label="Status"
        >
          {statusOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel id="intentSelectLabel">Intent</InputLabel>
        <Select
          id="intentSelect"
          labelId="intentSelectLabel"
          value={get(nutritionOrder, 'intent', 'order')}
          onChange={function(e) { handleChange('intent', e.target.value); }}
          label="Intent"
        >
          {intentOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        id="dateTimeInput"
        fullWidth
        type="datetime-local"
        label="Order Date/Time"
        value={moment(get(nutritionOrder, 'dateTime', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={function(e) { handleChange('dateTime', e.target.value); }}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Oral Diet
      </Typography>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel id="dietTypeSelectLabel">Diet Type</InputLabel>
        <Select
          id="dietTypeSelect"
          labelId="dietTypeSelectLabel"
          value={get(nutritionOrder, 'oralDiet.type[0].coding[0].code', '')}
          onChange={function(e) {
            var option = dietTypeOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              handleChange('oralDiet.type[0].coding[0].code', option.code);
              handleChange('oralDiet.type[0].coding[0].display', option.display);
              handleChange('oralDiet.type[0].text', option.display);
            }
          }}
          label="Diet Type"
        >
          {dietTypeOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Texture Modifier</InputLabel>
        <Select
          value={get(nutritionOrder, 'oralDiet.texture[0].modifier.coding[0].code', '')}
          onChange={function(e) {
            var option = textureOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              handleChange('oralDiet.texture[0].modifier.coding[0].code', option.code);
              handleChange('oralDiet.texture[0].modifier.coding[0].display', option.display);
            }
          }}
          label="Texture Modifier"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {textureOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel>Fluid Consistency</InputLabel>
        <Select
          value={get(nutritionOrder, 'oralDiet.fluidConsistencyType[0].coding[0].code', '')}
          onChange={function(e) {
            var option = fluidConsistencyOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              handleChange('oralDiet.fluidConsistencyType[0].coding[0].code', option.code);
              handleChange('oralDiet.fluidConsistencyType[0].coding[0].display', option.display);
            }
          }}
          label="Fluid Consistency"
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {fluidConsistencyOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        type="number"
        label="Frequency (times per day)"
        value={get(nutritionOrder, 'oralDiet.schedule[0].repeat.frequency', 3)}
        onChange={function(e) { handleChange('oralDiet.schedule[0].repeat.frequency', parseInt(e.target.value)); }}
        InputProps={{ inputProps: { min: 1, max: 10 } }}
        disabled={!isEditing}
      />

      <TextField
        fullWidth
        type="date"
        label="Start Date"
        value={moment(get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.start', '')).format('YYYY-MM-DD')}
        onChange={function(e) { handleChange('oralDiet.schedule[0].repeat.boundsPeriod.start', e.target.value); }}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <TextField
        fullWidth
        type="date"
        label="End Date"
        value={moment(get(nutritionOrder, 'oralDiet.schedule[0].repeat.boundsPeriod.end', '')).format('YYYY-MM-DD')}
        onChange={function(e) { handleChange('oralDiet.schedule[0].repeat.boundsPeriod.end', e.target.value); }}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <TextField
        id="instructionsInput"
        fullWidth
        multiline
        rows={3}
        label="Instructions"
        value={get(nutritionOrder, 'oralDiet.instruction', '')}
        onChange={function(e) { handleChange('oralDiet.instruction', e.target.value); }}
        helperText="Special instructions for the diet"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Supplement
      </Typography>

      <TextField
        id="supplementTypeInput"
        fullWidth
        label="Supplement Type"
        value={get(nutritionOrder, 'supplement[0].type[0].text', '')}
        onChange={function(e) {
          handleChange('supplement[0].type[0].text', e.target.value);
          handleChange('supplement[0].type[0].coding[0].display', e.target.value);
        }}
        disabled={!isEditing}
      />

      <TextField
        id="supplementProductNameInput"
        fullWidth
        label="Product Name"
        value={get(nutritionOrder, 'supplement[0].productName', '')}
        onChange={function(e) { handleChange('supplement[0].productName', e.target.value); }}
        disabled={!isEditing}
      />

      <TextField
        id="supplementInstructionInput"
        fullWidth
        multiline
        rows={2}
        label="Supplement Instructions"
        value={get(nutritionOrder, 'supplement[0].instruction', '')}
        onChange={function(e) { handleChange('supplement[0].instruction', e.target.value); }}
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Enteral Formula
      </Typography>

      <TextField
        id="enteralFormulaTypeInput"
        fullWidth
        label="Formula Type"
        value={get(nutritionOrder, 'enteralFormula.baseFormulaType[0].text', '')}
        onChange={function(e) {
          handleChange('enteralFormula.baseFormulaType[0].text', e.target.value);
          handleChange('enteralFormula.baseFormulaType[0].coding[0].display', e.target.value);
        }}
        disabled={!isEditing}
      />

      <TextField
        id="enteralFormulaProductNameInput"
        fullWidth
        label="Formula Product Name"
        value={get(nutritionOrder, 'enteralFormula.baseFormulaProductName', '')}
        onChange={function(e) { handleChange('enteralFormula.baseFormulaProductName', e.target.value); }}
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Additional Information
      </Typography>

      <TextField
        id="allergyIntoleranceInput"
        fullWidth
        label="Allergy/Intolerance"
        value={get(nutritionOrder, 'allergyIntolerance[0]', '')}
        onChange={function(e) { handleChange('allergyIntolerance[0]', e.target.value); }}
        helperText="Known allergies or intolerances"
        disabled={!isEditing}
      />

      <TextField
        id="foodPreferenceModifierInput"
        fullWidth
        label="Food Preference Modifier"
        value={get(nutritionOrder, 'foodPreferenceModifier[0].text', '')}
        onChange={function(e) {
          handleChange('foodPreferenceModifier[0].text', e.target.value);
          handleChange('foodPreferenceModifier[0].coding[0].display', e.target.value);
        }}
        helperText="e.g., Vegetarian, Kosher, Halal"
        disabled={!isEditing}
      />

      <TextField
        id="excludeFoodModifierInput"
        fullWidth
        label="Exclude Food Modifier"
        value={get(nutritionOrder, 'excludeFoodModifier[0].text', '')}
        onChange={function(e) {
          handleChange('excludeFoodModifier[0].text', e.target.value);
          handleChange('excludeFoodModifier[0].coding[0].display', e.target.value);
        }}
        helperText="Foods to exclude from the diet"
        disabled={!isEditing}
      />

      <TextField
        id="notesInput"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(nutritionOrder, 'note[0].text', '')}
        onChange={function(e) { handleChange('note[0].text', e.target.value); }}
        helperText="Additional notes about the nutrition order"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default NutritionOrderFormView;
