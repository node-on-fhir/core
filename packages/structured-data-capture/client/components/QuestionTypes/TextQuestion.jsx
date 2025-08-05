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
    helperText
  } = props;

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
      />
      {showCounter && (
        <Typography 
          variant="caption" 
          color={currentLength > maxLength ? 'error' : 'textSecondary'}
          sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
        >
          {currentLength} / {maxLength}
        </Typography>
      )}
    </Box>
  );
}