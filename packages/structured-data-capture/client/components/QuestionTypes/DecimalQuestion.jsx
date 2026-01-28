// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/DecimalQuestion.jsx

import React from 'react';
import { 
  TextField,
  InputAdornment,
  Slider,
  Box,
  Typography
} from '@mui/material';
import { get } from 'lodash';

export function DecimalQuestion(props) {
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

  const type = get(item, 'type');
  
  // Get constraints
  const minValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/minValue'
  )?.valueDecimal ?? 0;
  
  const maxValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue'
  )?.valueDecimal ?? 100;

  // Get decimal places
  const decimalPlaces = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/maxDecimalPlaces'
  )?.valueInteger ?? 2;

  // Check for slider control
  const controlExtension = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  );
  const controlType = get(controlExtension, 'valueCodeableConcept.coding[0].code');
  const isSlider = controlType === 'slider';

  // Get unit for quantity type
  const unit = type === 'quantity' ? get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-unit'
  )?.valueCoding?.display : null;

  const handleChange = function(event) {
    if (readOnly) return;
    
    const newValue = event.target.value;
    if (newValue === '') {
      onChange(null);
      return;
    }
    
    const parsed = parseFloat(newValue);
    if (!isNaN(parsed)) {
      // Apply constraints and decimal places
      let constrainedValue = parsed;
      if (minValue !== undefined && parsed < minValue) {
        constrainedValue = minValue;
      }
      if (maxValue !== undefined && parsed > maxValue) {
        constrainedValue = maxValue;
      }
      
      // Round to specified decimal places
      constrainedValue = Math.round(constrainedValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
      
      if (type === 'quantity') {
        onChange({
          value: constrainedValue,
          unit: unit || '',
          system: 'http://unitsofmeasure.org',
          code: unit || ''
        });
      } else {
        onChange(constrainedValue);
      }
    }
  };

  const handleSliderChange = function(event, newValue) {
    if (readOnly) return;
    
    if (type === 'quantity') {
      onChange({
        value: newValue,
        unit: unit || '',
        system: 'http://unitsofmeasure.org',
        code: unit || ''
      });
    } else {
      onChange(newValue);
    }
  };

  // Extract value for display
  const displayValue = type === 'quantity' ? get(value, 'value', '') : (value ?? '');

  if (isSlider && minValue !== undefined && maxValue !== undefined) {
    return (
      <Box sx={{ px: 2 }}>
        <Typography variant="body2" sx={{ color: secondaryTextColor }}>
          {displayValue || minValue} {unit}
        </Typography>
        <Slider
          value={displayValue || minValue}
          onChange={handleSliderChange}
          min={minValue}
          max={maxValue}
          step={Math.pow(10, -decimalPlaces)}
          disabled={readOnly}
          valueLabelDisplay="auto"
          marks={[
            { value: minValue, label: minValue },
            { value: maxValue, label: maxValue }
          ]}
          sx={{
            '& .MuiSlider-markLabel': { color: secondaryTextColor },
            '& .MuiSlider-thumb.Mui-disabled': { color: disabledColor },
            '& .MuiSlider-track.Mui-disabled': { color: disabledColor }
          }}
        />
        {error && helperText && (
          <Typography variant="caption" sx={{ color: isDark ? '#f44336' : '#d32f2f' }}>
            {helperText}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <TextField
      fullWidth
      type="number"
      value={displayValue}
      onChange={handleChange}
      disabled={readOnly}
      error={error}
      helperText={helperText}
      inputProps={{
        min: minValue,
        max: maxValue,
        step: Math.pow(10, -decimalPlaces)
      }}
      InputProps={{
        endAdornment: unit && (
          <InputAdornment position="end" sx={{ color: secondaryTextColor }}>{unit}</InputAdornment>
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