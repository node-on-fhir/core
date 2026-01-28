// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/structured-data-capture/client/components/QuestionTypes/StringQuestion.jsx

import React from 'react';
import { 
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Link as LinkIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { get } from 'lodash';

export function StringQuestion(props) {
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
  const maxLength = get(item, 'maxLength');
  const placeholder = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/questionnaire-placeholder'
  )?.valueString;

  // Determine input type and icon based on question type or regex
  let inputType = 'text';
  let inputIcon = null;
  
  const regex = get(item, 'extension', []).find(e => 
    e.url === 'http://hl7.org/fhir/StructureDefinition/regex'
  )?.valueString;

  if (type === 'url' || regex?.includes('https?://')) {
    inputType = 'url';
    inputIcon = <LinkIcon />;
  } else if (regex?.includes('@')) {
    inputType = 'email';
    inputIcon = <EmailIcon />;
  } else if (regex?.includes('\\d{3}-\\d{3}-\\d{4}')) {
    inputType = 'tel';
    inputIcon = <PhoneIcon />;
  }

  const handleChange = function(event) {
    if (readOnly) return;
    onChange(event.target.value);
  };

  return (
    <TextField
      fullWidth
      type={inputType}
      value={value || ''}
      onChange={handleChange}
      disabled={readOnly}
      error={error}
      helperText={helperText}
      placeholder={placeholder}
      inputProps={{
        maxLength: maxLength
      }}
      InputProps={{
        startAdornment: inputIcon && (
          <InputAdornment position="start" sx={{ color: secondaryTextColor }}>
            {inputIcon}
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
        '& .MuiFormHelperText-root': { color: secondaryTextColor },
        '& .MuiInputBase-input::placeholder': { color: secondaryTextColor, opacity: 1 }
      }}
    />
  );
}