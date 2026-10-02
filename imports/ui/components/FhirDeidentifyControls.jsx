// imports/ui/components/FhirDeidentifyControls.jsx
//
// Shared pre-import de-identification controls for parsed FHIR resources —
// the FHIR-resource sibling of imports/ui/DICOM/components/DicomDeidentifyControls.jsx,
// following the same idiom: pure controlled component, state lives in the
// parent as one bag (DEFAULT_FHIR_DEID_CONTROLS), processing itself happens
// in imports/lib/FhirDeidentify.js. Used by data-importer's Apple Health
// panel; intended for the PDF / Data / Social-Media importers as well.

import React from 'react';
import {
  Box,
  Switch,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Typography
} from '@mui/material';

import { DEFAULT_FHIR_DEID_CONTROLS } from '/imports/lib/FhirDeidentify';

// One random, non-zero day offset per import session (±365), generated when
// the operator turns shift mode on and cleared when they turn it off — every
// record in the import shifts by the same amount so intervals are preserved.
function generateShiftDays() {
  const magnitude = 1 + Math.floor(Math.random() * 365);
  return Math.random() < 0.5 ? -magnitude : magnitude;
}

// Optional prop `selectedPatientDisplay`: when provided (importers that carry
// a patient context, e.g. genome-central's import panel), the anonymous
// checkbox becomes an explicit "Assign to" radio pair — selected patient
// (named) vs anonymous patient — still driven by the same
// assignAnonymousPatient flag in the controls bag. When absent, the original
// single checkbox renders (Apple Health panel et al unchanged).
function FhirDeidentifyControls({ value, onChange, disabled, selectedPatientDisplay }) {
  const controls = value || DEFAULT_FHIR_DEID_CONTROLS;

  const update = function(patch) {
    if (onChange) {
      onChange({ ...controls, ...patch });
    }
  };

  const handleDateHandlingChange = function(event) {
    const dateHandling = event.target.value;
    update({
      dateHandling: dateHandling,
      dateShiftDays: dateHandling === 'shiftRandom'
        ? (typeof controls.dateShiftDays === 'number' ? controls.dateShiftDays : generateShiftDays())
        : null
    });
  };

  return (
    <Box id="fhirDeidentifyControls" sx={{ mt: 2 }}>
      <FormControlLabel
        control={
          <Switch
            id="fhirDeidentifySwitch"
            checked={!!controls.deidentifyEnabled}
            onChange={function(event) { update({ deidentifyEnabled: event.target.checked }); }}
            disabled={disabled}
          />
        }
        label="De-identify before import"
      />

      <Collapse in={!!controls.deidentifyEnabled}>
        {typeof selectedPatientDisplay === 'string' ? (
          <FormControl sx={{ mb: 0.5 }}>
            <FormLabel id="deidAssignPatientLabel" sx={{ fontSize: '0.8rem' }}>Assign imported data to</FormLabel>
            <RadioGroup
              aria-labelledby="deidAssignPatientLabel"
              value={controls.assignAnonymousPatient ? 'anonymous' : 'selected'}
              onChange={function(event) {
                update({ assignAnonymousPatient: event.target.value === 'anonymous' });
              }}
            >
              <FormControlLabel
                value="selected"
                control={<Radio id="deidAssignSelectedRadio" size="small" disabled={disabled} />}
                label={'Selected patient' + (selectedPatientDisplay ? ' — ' + selectedPatientDisplay : '')}
              />
              <FormControlLabel
                value="anonymous"
                control={<Radio id="deidAssignAnonymousRadio" size="small" disabled={disabled} />}
                label="Anonymous patient"
              />
            </RadioGroup>
          </FormControl>
        ) : (
          <FormControlLabel
            control={
              <Checkbox
                id="deidAssignAnonymousCheckbox"
                checked={!!controls.assignAnonymousPatient}
                onChange={function(event) { update({ assignAnonymousPatient: event.target.checked }); }}
                disabled={disabled}
              />
            }
            label="Assign to anonymous patient"
          />
        )}
        {controls.assignAnonymousPatient && (
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>
            Imported records will reference the shared Anonymous Patient record
            instead of the selected patient.
          </Typography>
        )}

        <FormControlLabel
          control={
            <Checkbox
              id="deidStripDemographicsCheckbox"
              checked={!!controls.stripDemographics}
              onChange={function(event) { update({ stripDemographics: event.target.checked }); }}
              disabled={disabled}
            />
          }
          label="Strip demographics and device metadata"
        />

        <FormControl fullWidth size="small" sx={{ mt: 1.5, mb: 1 }}>
          <InputLabel id="deidDateHandlingLabel">Date handling</InputLabel>
          <Select
            labelId="deidDateHandlingLabel"
            id="deidDateHandlingSelect"
            value={controls.dateHandling || 'none'}
            onChange={handleDateHandlingChange}
            label="Date handling"
            disabled={disabled}
          >
            <MenuItem value="none">Keep original timestamps</MenuItem>
            <MenuItem value="truncateToDate">Truncate to date (drop time of day)</MenuItem>
            <MenuItem value="shiftRandom">Shift all dates by a random offset</MenuItem>
          </Select>
        </FormControl>
        {controls.dateHandling === 'shiftRandom' && (
          <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mb: 0.5 }}>
            A single random offset is applied to every record in this import,
            so intervals between records are preserved.
          </Typography>
        )}

        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', mt: 1 }}>
          Runs entirely in your browser — identified data is transformed before
          anything is imported.
        </Typography>
      </Collapse>
    </Box>
  );
}

export default FhirDeidentifyControls;
