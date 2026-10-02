// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/BooleanQuestion.jsx

import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
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
    helperText,
    // Dark mode theming props
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Theme-aware colors
  const disabledColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

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
          sx={{
            '& .MuiFormControlLabel-label': { color: cardTextColor },
            '& .MuiFormControlLabel-label.Mui-disabled': { color: disabledColor }
          }}
        />
        {helperText && <FormHelperText sx={{ color: secondaryTextColor }}>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Default: console YES/NO segment. Re-clicking the selected chip clears.
  return (
    <FormControl error={error} disabled={readOnly}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <button
          type="button"
          className={'sdc-chip-btn' + (value === true ? ' sdc-chip-btn--on' : '')}
          disabled={readOnly}
          aria-pressed={value === true}
          onClick={function() { onChange(value === true ? undefined : true); }}
        >
          Yes
        </button>
        <button
          type="button"
          className={'sdc-chip-btn' + (value === false ? ' sdc-chip-btn--on' : '')}
          disabled={readOnly}
          aria-pressed={value === false}
          onClick={function() { onChange(value === false ? undefined : false); }}
        >
          No
        </button>
      </Box>
      {helperText && <FormHelperText sx={{ color: secondaryTextColor }}>{helperText}</FormHelperText>}
    </FormControl>
  );
}