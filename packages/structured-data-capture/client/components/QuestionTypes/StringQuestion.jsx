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
    helperText
  } = props;

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
          <InputAdornment position="start">
            {inputIcon}
          </InputAdornment>
        )
      }}
      size="small"
      variant="outlined"
    />
  );
}