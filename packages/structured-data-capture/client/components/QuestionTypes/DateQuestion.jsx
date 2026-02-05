// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/DateQuestion.jsx

import React from 'react';
import { TextField } from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';

export function DateQuestion(props) {
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
  
  // Determine input type and format
  let inputType = 'date';
  let valueFormat = 'YYYY-MM-DD';
  let displayFormat = 'YYYY-MM-DD';
  
  switch (type) {
    case 'dateTime':
      inputType = 'datetime-local';
      valueFormat = 'YYYY-MM-DDTHH:mm';
      displayFormat = 'YYYY-MM-DDTHH:mm';
      break;
    case 'time':
      inputType = 'time';
      valueFormat = 'HH:mm';
      displayFormat = 'HH:mm';
      break;
  }

  // Format value for input
  const formattedValue = value ? moment(value).format(valueFormat) : '';

  // Get min/max constraints
  const minValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/minValue'
  )?.valueDate;
  
  const maxValue = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/maxValue'
  )?.valueDate;

  const handleChange = function(event) {
    if (readOnly) return;
    
    const newValue = event.target.value;
    if (!newValue) {
      onChange(null);
      return;
    }

    // Convert to FHIR format
    let fhirValue;
    switch (type) {
      case 'dateTime':
        fhirValue = moment(newValue).format('YYYY-MM-DDTHH:mm:ss[Z]');
        break;
      case 'time':
        fhirValue = newValue + ':00'; // Add seconds
        break;
      default:
        fhirValue = newValue;
    }
    
    onChange(fhirValue);
  };

  return (
    <TextField
      fullWidth
      type={inputType}
      value={formattedValue}
      onChange={handleChange}
      disabled={readOnly}
      error={error}
      helperText={helperText}
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        min: minValue ? moment(minValue).format(valueFormat) : undefined,
        max: maxValue ? moment(maxValue).format(valueFormat) : undefined
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