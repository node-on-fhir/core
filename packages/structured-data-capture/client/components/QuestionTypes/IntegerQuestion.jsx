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
    helperText
  } = props;

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
            >
              <RemoveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleIncrement}
              disabled={maxValue !== undefined && value >= maxValue}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        )
      }}
      size="small"
      variant="outlined"
    />
  );
}