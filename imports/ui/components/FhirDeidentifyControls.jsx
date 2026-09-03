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
  InputLabel,
  MenuItem,
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

function FhirDeidentifyControls({ value, onChange, disabled }) {
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
