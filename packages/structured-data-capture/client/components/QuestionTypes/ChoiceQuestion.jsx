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
    helperText,
    // Dark mode theming props
    isDark = false,
    cardTextColor = 'rgba(0, 0, 0, 0.87)',
    borderColor = 'rgba(0, 0, 0, 0.23)'
  } = props;

  // Theme-aware colors
  const disabledColor = isDark ? 'rgba(255, 255, 255, 0.38)' : 'rgba(0, 0, 0, 0.38)';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const checkboxColor = isDark ? '#90caf9' : '#1976d2';

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
            sx={{
              '& .MuiInputBase-input': { color: cardTextColor },
              '& .MuiInputBase-input.Mui-disabled': { color: disabledColor, WebkitTextFillColor: disabledColor },
              '& .MuiInputLabel-root': { color: secondaryTextColor },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
              '& .MuiFormHelperText-root': { color: secondaryTextColor }
            }}
          />
        )}
        isOptionEqualToValue={(option, value) =>
          option.code === (typeof value === 'string' ? value : get(value, 'code'))
        }
        sx={{
          '& .MuiChip-root': { color: cardTextColor, borderColor: borderColor }
        }}
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
                    sx={{ color: secondaryTextColor, '&.Mui-checked': { color: checkboxColor } }}
                  />
                }
                label={option.display}
                sx={{
                  '& .MuiFormControlLabel-label': { color: cardTextColor },
                  '& .MuiFormControlLabel-label.Mui-disabled': { color: disabledColor }
                }}
              />
            );
          })}
        </FormGroup>
        {helperText && <FormHelperText sx={{ color: secondaryTextColor }}>{helperText}</FormHelperText>}
      </FormControl>
    );
  }

  // Render dropdown for medium option sets
  if (options.length > 5 || controlType === 'drop-down') {
    const currentCode = getCurrentCodes();

    return (
      <FormControl
        fullWidth
        error={error}
        disabled={readOnly}
        size="small"
        sx={{
          '& .MuiInputLabel-root': { color: secondaryTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
        }}
      >
        <InputLabel>{get(item, 'text')}</InputLabel>
        <Select
          value={currentCode}
          onChange={handleSingleChange}
          input={<OutlinedInput label={get(item, 'text')} />}
          sx={{
            color: cardTextColor,
            '& .MuiSelect-icon': { color: secondaryTextColor }
          }}
        >
          <MenuItem value="" sx={{ color: cardTextColor }}>
            <em>None</em>
          </MenuItem>
          {options.map(function(option) {
            return (
              <MenuItem key={option.code} value={option.code} sx={{ color: cardTextColor }}>
                {option.display}
              </MenuItem>
            );
          })}
          {isOpenChoice && (
            <>
              <MenuItem value="__custom__" sx={{ color: cardTextColor }}>
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
                    sx={{
                      '& .MuiInputBase-input': { color: cardTextColor },
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Select>
        {helperText && <FormHelperText sx={{ color: secondaryTextColor }}>{helperText}</FormHelperText>}
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
              control={<Radio sx={{ color: secondaryTextColor, '&.Mui-checked': { color: checkboxColor } }} />}
              label={option.display}
              sx={{
                '& .MuiFormControlLabel-label': { color: cardTextColor },
                '& .MuiFormControlLabel-label.Mui-disabled': { color: disabledColor }
              }}
            />
          );
        })}
        {isOpenChoice && (
          <>
            <FormControlLabel
              value="__custom__"
              control={<Radio sx={{ color: secondaryTextColor, '&.Mui-checked': { color: checkboxColor } }} />}
              label="Other"
              sx={{
                '& .MuiFormControlLabel-label': { color: cardTextColor },
                '& .MuiFormControlLabel-label.Mui-disabled': { color: disabledColor }
              }}
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
                  sx={{
                    '& .MuiInputBase-input': { color: cardTextColor },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </RadioGroup>
      {helperText && <FormHelperText sx={{ color: secondaryTextColor }}>{helperText}</FormHelperText>}
    </FormControl>
  );
}