// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/ChoiceQuestion.jsx

import React, { useState } from 'react';
import { 
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  Chip,
  Box,
  TextField,
  Autocomplete
} from '@mui/material';
import { get, isArray } from 'lodash';

export function ChoiceQuestion(props) {
  const {
    item,
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText
  } = props;

  const type = get(item, 'type');
  const repeats = get(item, 'repeats', false);
  const answerOption = get(item, 'answerOption', []);
  const isOpenChoice = type === 'open-choice';
  
  const [customValue, setCustomValue] = useState('');

  // Get control type from extension
  const controlExtension = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl'
  );
  const controlType = get(controlExtension, 'valueCodeableConcept.coding[0].code');

  // Extract options
  const options = answerOption.map(function(option) {
    const coding = get(option, 'valueCoding', {});
    return {
      code: get(coding, 'code', ''),
      display: get(coding, 'display', get(coding, 'code', '')),
      system: get(coding, 'system', '')
    };
  });

  // Handle single choice change
  const handleSingleChange = function(event) {
    if (readOnly) return;
    const newValue = event.target.value;
    
    if (newValue === '__custom__' && isOpenChoice) {
      onChange(customValue);
    } else {
      const selectedOption = options.find(opt => opt.code === newValue);
      onChange(selectedOption || newValue);
    }
  };

  // Handle multiple choice change
  const handleMultipleChange = function(event, optionCode) {
    if (readOnly) return;
    
    const currentValues = isArray(value) ? value : value ? [value] : [];
    const option = options.find(opt => opt.code === optionCode);
    
    if (event.target.checked) {
      onChange([...currentValues, option]);
    } else {
      onChange(currentValues.filter(v => get(v, 'code') !== optionCode));
    }
  };

  // Handle autocomplete change
  const handleAutocompleteChange = function(event, newValue) {
    if (readOnly) return;
    
    if (repeats) {
      onChange(newValue);
    } else {
      onChange(newValue?.[0] || null);
    }
  };

  // Get current value(s) as code(s)
  const getCurrentCodes = function() {
    if (!value) return repeats ? [] : '';
    
    if (repeats) {
      return isArray(value) ? 
        value.map(v => typeof v === 'string' ? v : get(v, 'code', '')) : 
        [typeof value === 'string' ? value : get(value, 'code', '')];
    } else {
      return typeof value === 'string' ? value : get(value, 'code', '');
    }
  };

  // Render autocomplete for large option sets
  if (options.length > 10 || controlType === 'autocomplete') {
    return (
      <Autocomplete
        multiple={repeats}
        options={options}
        getOptionLabel={(option) => option.display}
        value={repeats ? 
          (isArray(value) ? value : value ? [value] : []) : 
          value
        }
        onChange={handleAutocompleteChange}
        disabled={readOnly}
        renderInput={(params) => (
          <TextField
            {...params}
            error={error}
            helperText={helperText}
            placeholder="Select option(s)"
          />
        )}
        isOptionEqualToValue={(option, value) => 
          option.code === (typeof value === 'string' ? value : get(value, 'code'))
        }
      />
    );
  }

  // Render checkboxes for multiple choice
  if (repeats) {
    const currentCodes = getCurrentCodes();
    
    return (
      <FormControl error={error} disabled={readOnly}>
        <FormGroup>
          {options.map(function(option) {
            return (
              <FormControlLabel
                key={option.code}
                control={
                  <Checkbox
                    checked={currentCodes.includes(option.code)}
                    onChange={(e) => handleMultipleChange(e, option.code)}
                  />
                }
                label={option.display}
              />
            );
          })}
        </FormGroup>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Render dropdown for medium option sets
  if (options.length > 5 || controlType === 'drop-down') {
    const currentCode = getCurrentCodes();
    
    return (
      <FormControl fullWidth error={error} disabled={readOnly} size="small">
        <InputLabel>{get(item, 'text')}</InputLabel>
        <Select
          value={currentCode}
          onChange={handleSingleChange}
          input={<OutlinedInput label={get(item, 'text')} />}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {options.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code}>
                {option.display}
              </MenuItem>
            );
          })}
          {isOpenChoice && (
            <>
              <MenuItem value="__custom__">
                <em>Other...</em>
              </MenuItem>
              {currentCode === '__custom__' && (
                <Box sx={{ p: 2 }}>
                  <TextField
                    fullWidth
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter custom value"
                    size="small"
                  />
                </Box>
              )}
            </>
          )}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Default to radio buttons
  const currentCode = getCurrentCodes();
  
  return (
    <FormControl error={error} disabled={readOnly}>
      <RadioGroup
        value={currentCode}
        onChange={handleSingleChange}
      >
        {options.map(function(option) {
          return (
            <FormControlLabel
              key={option.code}
              value={option.code}
              control={<Radio />}
              label={option.display}
            />
          );
        })}
        {isOpenChoice && (
          <>
            <FormControlLabel
              value="__custom__"
              control={<Radio />}
              label="Other"
            />
            {currentCode === '__custom__' && (
              <Box sx={{ ml: 4, mt: 1 }}>
                <TextField
                  fullWidth
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    onChange(e.target.value);
                  }}
                  placeholder="Please specify"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </RadioGroup>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
    </FormControl>
  );
}