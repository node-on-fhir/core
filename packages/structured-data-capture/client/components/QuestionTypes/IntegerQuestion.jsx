// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/IntegerQuestion.jsx

import React from 'react';
import { 
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import { get } from 'lodash';

export function IntegerQuestion(props) {
  const {
    item,
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText,
    // Dark mode theming props
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Theme-aware colors
  const disabledColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  // Get constraints
  const minValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/minValue'
  )?.valueInteger;
  
  const maxValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue'
  )?.valueInteger;

  // Check for slider control
  const controlExtension = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  );
  const controlType = get(controlExtension, 'valueCodeableConcept.coding[0].code');
  const showSpinner = controlType === 'spinner';

  const handleChange = function(event) {
    if (readOnly) return;
    
    const newValue = event.target.value;
    if (newValue === '') {
      onChange(null);
      return;
    }
    
    const parsed = parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      // Apply constraints
      let constrainedValue = parsed;
      if (minValue !== undefined && parsed < minValue) {
        constrainedValue = minValue;
      }
      if (maxValue !== undefined && parsed > maxValue) {
        constrainedValue = maxValue;
      }
      onChange(constrainedValue);
    }
  };

  const handleIncrement = function() {
    if (readOnly) return;
    const currentValue = value || 0;
    const newValue = currentValue + 1;
    if (maxValue === undefined || newValue <= maxValue) {
      onChange(newValue);
    }
  };

  const handleDecrement = function() {
    if (readOnly) return;
    const currentValue = value || 0;
    const newValue = currentValue - 1;
    if (minValue === undefined || newValue >= minValue) {
      onChange(newValue);
    }
  };

  return (
    <TextField
      fullWidth
      type="number"
      value={value ?? ''}
      onChange={handleChange}
      disabled={readOnly}
      error={error}
      helperText={helperText}
      inputProps={{
        min: minValue,
        max: maxValue,
        step: 1
      }}
      InputProps={{
        endAdornment: showSpinner && !readOnly && (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={handleDecrement}
              disabled={minValue !== undefined && value <= minValue}
              sx={{ color: secondaryTextColor, '&.Mui-disabled': { color: disabledColor } }}
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleIncrement}
              disabled={maxValue !== undefined && value >= maxValue}
              sx={{ color: secondaryTextColor, '&.Mui-disabled': { color: disabledColor } }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        )
      }}
      size="small"
      variant="outlined"
      sx={{
        '& .MuiInputBase-input': { color: cardTextColor },
        '& .MuiInputBase-input.Mui-disabled': {
          color: disabledColor,
          WebkitTextFillColor: disabledColor
        },
        '& .MuiInputLabel-root': { color: secondaryTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
        '& .MuiFormHelperText-root': { color: secondaryTextColor }
      }}
    />
  );
}