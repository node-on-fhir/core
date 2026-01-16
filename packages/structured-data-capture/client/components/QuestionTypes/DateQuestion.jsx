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
    helperText
  } = props;

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
    />
  );
}