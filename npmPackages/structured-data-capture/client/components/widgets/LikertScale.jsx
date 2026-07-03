// npmPackages/structured-data-capture/client/components/widgets/LikertScale.jsx
//
// LikertScale — a pure, FHIR-agnostic horizontal "radio rail" selector.
//
// Renders a row of radio dots on a connecting line with labels beneath each dot
// (the traditional Likert layout). Built on MUI RadioGroup so keyboard
// navigation, focus rings and ARIA semantics come for free. Knows nothing about
// FHIR — it takes a plain `options` array and a `value`/`onChange` pair, so it is
// reusable anywhere in the app, not just inside the questionnaire renderer.
//
// On narrow viewports (xs) it gracefully collapses to a conventional vertical
// radio list, which keeps long option labels (e.g. the 0-10 pain scale) readable.

import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { get, isArray } from 'lodash';

export function LikertScale(props) {
  const {
    options = [],
    value,
    onChange,
    readOnly = false,
    error = false,
    helperText,
    name
  } = props;

  const theme = useTheme();
  const isStacked = useMediaQuery(theme.breakpoints.down('sm'));

  if (!isArray(options) || options.length === 0) {
    return null;
  }

  // RadioGroup compares string values; coerce so codes/numbers both match.
  const selectedValue = value === null || value === undefined ? '' : String(value);

  const handleChange = function(event) {
    if (readOnly) return;
    onChange(event.target.value);
  };

  // Vertical center of the ~40px-tall Radio control row — where the rail sits.
  const RAIL_TOP = 20;

  return (
    <FormControl
      error={error}
      disabled={readOnly}
      component="fieldset"
      sx={{ width: '100%' }}
    >
      <RadioGroup
        row={!isStacked}
        name={name}
        value={selectedValue}
        onChange={handleChange}
        sx={{
          position: 'relative',
          flexWrap: 'nowrap',
          flexDirection: isStacked ? 'column' : 'row',
          alignItems: isStacked ? 'flex-start' : 'stretch',
          width: '100%'
        }}
      >
        {/* Connecting rail line behind the dots (horizontal layout only). The
            line is inset by half a cell so it spans dot-center to dot-center. */}
        {!isStacked && (
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: RAIL_TOP,
              left: `${50 / options.length}%`,
              right: `${50 / options.length}%`,
              height: 0,
              borderTop: '2px solid',
              borderColor: 'divider',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}

        {options.map(function(option) {
          const optionValue = String(get(option, 'value', ''));
          const label = get(option, 'label', optionValue);
          const isSelected = optionValue === selectedValue;

          return (
            <FormControlLabel
              key={optionValue}
              value={optionValue}
              labelPlacement={isStacked ? 'end' : 'bottom'}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: 'text.secondary',
                    '&.Mui-checked': { color: 'primary.main' }
                  }}
                />
              }
              label={
                <Typography
                  variant="caption"
                  sx={{
                    color: isSelected ? 'text.primary' : 'text.secondary',
                    fontWeight: isSelected ? 600 : 400,
                    textAlign: isStacked ? 'left' : 'center',
                    lineHeight: 1.2,
                    display: 'block'
                  }}
                >
                  {label}
                </Typography>
              }
              sx={{
                position: 'relative',
                zIndex: 1,
                flex: isStacked ? 'unset' : 1,
                m: 0,
                mb: isStacked ? 0.5 : 0,
                // Tint the dot's surroundings with the page surface so the rail
                // line reads as passing *behind* the dot, not through the label.
                '& .MuiRadio-root': { backgroundColor: 'background.paper' }
              }}
            />
          );
        })}
      </RadioGroup>

      {helperText && (
        <FormHelperText sx={{ color: error ? 'error.main' : 'text.secondary' }}>
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
}

export default LikertScale;
