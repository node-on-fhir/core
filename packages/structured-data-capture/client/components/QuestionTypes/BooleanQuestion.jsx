// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/BooleanQuestion.jsx

import React from 'react';
import { 
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Switch,
  FormHelperText
} from '@mui/material';
import { get } from 'lodash';

export function BooleanQuestion(props) {
  const {
    item,
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText
  } = props;

  // Check for specific control type
  const controlExtension = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  );
  const controlType = get(controlExtension, 'valueCodeableConcept.coding[0].code');

  const handleChange = function(event) {
    if (readOnly) return;
    const newValue = event.target.value === 'true' || event.target.checked;
    onChange(newValue);
  };

  // Render as switch if specified
  if (controlType === 'toggle' || controlType === 'switch') {
    return (
      <FormControl error={error} disabled={readOnly}>
        <FormControlLabel
          control={
            <Switch
              checked={value === true}
              onChange={handleChange}
              color="primary"
            />
          }
          label={value ? 'Yes' : 'No'}
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Default to radio buttons
  return (
    <FormControl error={error} disabled={readOnly}>
      <RadioGroup
        value={value === true ? 'true' : value === false ? 'false' : ''}
        onChange={handleChange}
        row
      >
        <FormControlLabel 
          value="true" 
          control={<Radio />} 
          label="Yes" 
        />
        <FormControlLabel 
          value="false" 
          control={<Radio />} 
          label="No" 
        />
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}