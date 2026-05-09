// imports/ui-fhir/nutritionIntakes/NutritionIntakeFormView.jsx

import React from 'react';

import {
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { code: 'preparation', display: 'Preparation' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'not-done', display: 'Not Done' },
  { code: 'on-hold', display: 'On Hold' },
  { code: 'stopped', display: 'Stopped' },
  { code: 'completed', display: 'Completed' },
  { code: 'entered-in-error', display: 'Entered in Error' },
  { code: 'unknown', display: 'Unknown' }
];

const consumedItemTypeOptions = [
  { code: 'food', display: 'Food' },
  { code: 'fluid', display: 'Fluid' },
  { code: 'supplement', display: 'Supplement' },
  { code: 'enteral', display: 'Enteral' }
];

//===========================================================================
// COMPONENT

function NutritionIntakeFormView({ resource, isEditing, onChange, isEmbedded }) {
  var nutritionIntake = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Stack spacing={3}>
      <TextField
        id="subjectDisplay"
        fullWidth
        label="Subject (Patient) Name"
        value={get(nutritionIntake, 'subject.display', '')}
        helperText={get(nutritionIntake, 'subject.reference', '') || 'Subject reference will be assigned'}
        disabled
      />

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel id="statusSelectLabel">Status</InputLabel>
        <Select
          id="statusSelect"
          labelId="statusSelectLabel"
          value={get(nutritionIntake, 'status', 'completed')}
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

      <TextField
        id="occurrenceDateTimeInput"
        fullWidth
        type="datetime-local"
        label="Occurrence Date/Time"
        value={moment(get(nutritionIntake, 'occurrenceDateTime', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={function(e) { handleChange('occurrenceDateTime', e.target.value); }}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <TextField
        id="recordedDateTimeInput"
        fullWidth
        type="datetime-local"
        label="Recorded Date/Time"
        value={moment(get(nutritionIntake, 'recorded', '')).format('YYYY-MM-DDTHH:mm')}
        onChange={function(e) { handleChange('recorded', e.target.value); }}
        InputLabelProps={{ shrink: true }}
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Overall Code
      </Typography>

      <TextField
        id="codeDisplayInput"
        fullWidth
        label="Code Display"
        value={get(nutritionIntake, 'code.text', '')}
        onChange={function(e) {
          handleChange('code.text', e.target.value);
          handleChange('code.coding[0].display', e.target.value);
        }}
        helperText="Overall type of nutrition intake"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Consumed Item
      </Typography>

      <FormControl fullWidth disabled={!isEditing}>
        <InputLabel id="consumedItemTypeSelectLabel">Consumed Item Type</InputLabel>
        <Select
          id="consumedItemTypeSelect"
          labelId="consumedItemTypeSelectLabel"
          value={get(nutritionIntake, 'consumedItem[0].type.coding[0].code', 'food')}
          onChange={function(e) {
            var option = consumedItemTypeOptions.find(function(o) { return o.code === e.target.value; });
            if (option) {
              handleChange('consumedItem[0].type.coding[0].code', option.code);
              handleChange('consumedItem[0].type.coding[0].display', option.display);
              handleChange('consumedItem[0].type.text', option.display);
            }
          }}
          label="Consumed Item Type"
        >
          {consumedItemTypeOptions.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      <TextField
        id="nutritionProductInput"
        fullWidth
        label="Nutrition Product"
        value={get(nutritionIntake, 'consumedItem[0].nutritionProduct.concept.text', '')}
        onChange={function(e) {
          handleChange('consumedItem[0].nutritionProduct.concept.text', e.target.value);
          handleChange('consumedItem[0].nutritionProduct.concept.coding[0].display', e.target.value);
        }}
        helperText="Name or description of the food/fluid consumed"
        disabled={!isEditing}
      />

      <TextField
        id="amountValueInput"
        fullWidth
        type="number"
        label="Amount"
        value={get(nutritionIntake, 'consumedItem[0].amount.value', '') || ''}
        onChange={function(e) { handleChange('consumedItem[0].amount.value', e.target.value ? parseFloat(e.target.value) : null); }}
        disabled={!isEditing}
      />

      <TextField
        id="amountUnitInput"
        fullWidth
        label="Amount Unit"
        value={get(nutritionIntake, 'consumedItem[0].amount.unit', 'serving')}
        onChange={function(e) { handleChange('consumedItem[0].amount.unit', e.target.value); }}
        helperText="e.g., serving, cup, mL, oz"
        disabled={!isEditing}
      />

      <FormControlLabel
        control={
          <Switch
            checked={get(nutritionIntake, 'consumedItem[0].notConsumed', false)}
            onChange={function(e) { handleChange('consumedItem[0].notConsumed', e.target.checked); }}
            disabled={!isEditing}
          />
        }
        label="Not Consumed"
      />

      {get(nutritionIntake, 'consumedItem[0].notConsumed', false) && (
        <TextField
          id="notConsumedReasonInput"
          fullWidth
          label="Not Consumed Reason"
          value={get(nutritionIntake, 'consumedItem[0].notConsumedReason.text', '')}
          onChange={function(e) {
            handleChange('consumedItem[0].notConsumedReason.text', e.target.value);
            handleChange('consumedItem[0].notConsumedReason.coding[0].display', e.target.value);
          }}
          disabled={!isEditing}
        />
      )}

      <Typography variant="h6" sx={{ mt: 2 }}>
        Ingredient Label (Optional)
      </Typography>

      <TextField
        id="nutrientInput"
        fullWidth
        label="Nutrient"
        value={get(nutritionIntake, 'ingredientLabel[0].nutrient.text', '')}
        onChange={function(e) {
          handleChange('ingredientLabel[0].nutrient.text', e.target.value);
          handleChange('ingredientLabel[0].nutrient.coding[0].display', e.target.value);
        }}
        helperText="e.g., Calories, Protein, Carbohydrates"
        disabled={!isEditing}
      />

      <TextField
        id="nutrientAmountInput"
        fullWidth
        type="number"
        label="Nutrient Amount"
        value={get(nutritionIntake, 'ingredientLabel[0].amount.value', '') || ''}
        onChange={function(e) { handleChange('ingredientLabel[0].amount.value', e.target.value ? parseFloat(e.target.value) : null); }}
        disabled={!isEditing}
      />

      <TextField
        id="nutrientUnitInput"
        fullWidth
        label="Nutrient Unit"
        value={get(nutritionIntake, 'ingredientLabel[0].amount.unit', 'g')}
        onChange={function(e) { handleChange('ingredientLabel[0].amount.unit', e.target.value); }}
        helperText="e.g., g, mg, kcal"
        disabled={!isEditing}
      />

      <Typography variant="h6" sx={{ mt: 2 }}>
        Additional Information
      </Typography>

      <TextField
        id="performerDisplay"
        fullWidth
        label="Performer Name"
        value={get(nutritionIntake, 'performer[0].actor.display', '')}
        onChange={function(e) { handleChange('performer[0].actor.display', e.target.value); }}
        helperText={get(nutritionIntake, 'performer[0].actor.reference', '') || 'Who performed the intake'}
        disabled={!isEditing}
      />

      <TextField
        id="locationDisplay"
        fullWidth
        label="Location"
        value={get(nutritionIntake, 'location.display', '')}
        onChange={function(e) { handleChange('location.display', e.target.value); }}
        helperText="Where the intake occurred"
        disabled={!isEditing}
      />

      <TextField
        id="notesInput"
        fullWidth
        multiline
        rows={3}
        label="Notes"
        value={get(nutritionIntake, 'note[0].text', '')}
        onChange={function(e) { handleChange('note[0].text', e.target.value); }}
        helperText="Additional notes about the nutrition intake"
        disabled={!isEditing}
      />
    </Stack>
  );
}

export default NutritionIntakeFormView;
