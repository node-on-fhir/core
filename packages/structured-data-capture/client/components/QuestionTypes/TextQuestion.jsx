// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/TextQuestion.jsx

import React from 'react';
import { 
  TextField,
  Box,
  Typography
} from '@mui/material';
import { get } from 'lodash';

export function TextQuestion(props) {
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

  const maxLength = get(item, 'maxLength');
  const placeholder = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-placeholder'
  )?.valueString;

  // Get min rows from extension
  const minRows = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-minRows'
  )?.valueInteger || 3;

  const handleChange = function(event) {
    if (readOnly) return;
    onChange(event.target.value);
  };

  const currentLength = (value || '').length;
  const showCounter = maxLength && currentLength > maxLength * 0.8;

  return (
    <Box>
      <TextField
        fullWidth
        multiline
        minRows={minRows}
        maxRows={10}
        value={value || ''}
        onChange={handleChange}
        disabled={readOnly}
        error={error}
        helperText={helperText}
        placeholder={placeholder}
        inputProps={{
          maxLength: maxLength
        }}
        variant="outlined"
        sx={{
          '& .MuiInputBase-input': { color: cardTextColor },
          '& .MuiInputBase-input.Mui-disabled': {
            color: disabledColor,
            WebkitTextFillColor: disabledColor
          },
          '& .MuiInputLabel-root': { color: secondaryTextColor },
          '& .MuiOutlinedInput-notchedOutline': { borderColor: borderColor },
          '& .MuiFormHelperText-root': { color: secondaryTextColor },
          '& .MuiInputBase-input::placeholder': { color: secondaryTextColor, opacity: 1 }
        }}
      />
      {showCounter && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            display: 'block',
            textAlign: 'right',
            color: currentLength > maxLength ? (isDark ? '#f44336' : '#d32f2f') : secondaryTextColor
          }}
        >
          {currentLength} / {maxLength}
        </Typography>
      )}
    </Box>
  );
}