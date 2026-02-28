// /imports/ui-fhir/allergyIntolerances/AllergyIntoleranceFormView.jsx

import React from 'react';

import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

function AllergyIntoleranceFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient }){
  return (
    <Stack spacing={3}>
      {/* Patient field with search */}
      <TextField
        id="patientDisplay"
        fullWidth
        label="Patient"
        value={get(resource, 'patient.display', '')}
        onChange={(e) => onChange('patient.display', e.target.value)}
        disabled={!isEditing}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Search for patient">
                <IconButton
                  onClick={onSearchPatient}
                  edge="end"
                  disabled={!isEditing}
                >
                  <SearchIcon />
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />

      {/* Code fields */}
      <TextField
        id="codeInput"
        fullWidth
        label="Code"
        placeholder="e.g., 91935009"
        value={get(resource, 'code.coding[0].code', '')}
        onChange={(e) => onChange('code.coding[0].code', e.target.value)}
        disabled={!isEditing}
        helperText="SNOMED CT code for the allergen"
      />

      <TextField
        id="codeDisplayInput"
        fullWidth
        label="Code Display"
        placeholder="e.g., Allergy to peanuts"
        value={get(resource, 'code.coding[0].display', '')}
        onChange={(e) => onChange('code.coding[0].display', e.target.value)}
        disabled={!isEditing}
        helperText="Human readable name for the allergen"
      />

      {/* Status fields */}
      <FormControl fullWidth>
        <InputLabel>Clinical Status</InputLabel>
        <Select
          id="clinicalStatusSelect"
          label="Clinical Status"
          value={get(resource, 'clinicalStatus.coding[0].code', 'active')}
          onChange={(e) => {
            const code = e.target.value;
            const display = code.charAt(0).toUpperCase() + code.slice(1);
            onChange('clinicalStatus', {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
                code: code,
                display: display
              }]
            });
          }}
          disabled={!isEditing}
        >
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Verification Status</InputLabel>
        <Select
          id="verificationStatusSelect"
          label="Verification Status"
          value={get(resource, 'verificationStatus.coding[0].code', 'unconfirmed')}
          onChange={(e) => {
            const code = e.target.value;
            const displayMap = {
              'unconfirmed': 'Unconfirmed',
              'confirmed': 'Confirmed',
              'refuted': 'Refuted',
              'entered-in-error': 'Entered in Error'
            };
            onChange('verificationStatus', {
              coding: [{
                system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
                code: code,
                display: displayMap[code]
              }]
            });
          }}
          disabled={!isEditing}
        >
          <MenuItem value="unconfirmed">Unconfirmed</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="refuted">Refuted</MenuItem>
          <MenuItem value="entered-in-error">Entered in Error</MenuItem>
        </Select>
      </FormControl>

      {/* Type and Category */}
      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          id="typeSelect"
          label="Type"
          value={get(resource, 'type', 'allergy')}
          onChange={(e) => onChange('type', e.target.value)}
          disabled={!isEditing}
        >
          <MenuItem value="allergy">Allergy</MenuItem>
          <MenuItem value="intolerance">Intolerance</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          id="categorySelect"
          label="Category"
          value={get(resource, 'category[0]', 'food')}
          onChange={(e) => onChange('category', [e.target.value])}
          disabled={!isEditing}
        >
          <MenuItem value="food">Food</MenuItem>
          <MenuItem value="medication">Medication</MenuItem>
          <MenuItem value="environment">Environment</MenuItem>
          <MenuItem value="biologic">Biologic</MenuItem>
        </Select>
      </FormControl>

      {/* Criticality */}
      <FormControl fullWidth>
        <InputLabel>Criticality</InputLabel>
        <Select
          id="criticalitySelect"
          label="Criticality"
          value={get(resource, 'criticality', 'low')}
          onChange={(e) => onChange('criticality', e.target.value)}
          disabled={!isEditing}
        >
          <MenuItem value="low">Low</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="unable-to-assess">Unable to Assess</MenuItem>
        </Select>
      </FormControl>

      {/* Reaction */}
      <TextField
        id="reactionInput"
        fullWidth
        label="Reaction"
        placeholder="e.g., Hives, Anaphylaxis, Rash"
        value={get(resource, 'reaction[0].manifestation[0].text', '')}
        onChange={(e) => onChange('reaction[0].manifestation[0].text', e.target.value)}
        disabled={!isEditing}
        multiline
        rows={2}
      />

      {/* Severity */}
      <FormControl fullWidth>
        <InputLabel>Reaction Severity</InputLabel>
        <Select
          id="reactionSeveritySelect"
          label="Reaction Severity"
          value={get(resource, 'reaction[0].severity', 'mild')}
          onChange={(e) => onChange('reaction[0].severity', e.target.value)}
          disabled={!isEditing}
        >
          <MenuItem value="mild">Mild</MenuItem>
          <MenuItem value="moderate">Moderate</MenuItem>
          <MenuItem value="severe">Severe</MenuItem>
        </Select>
      </FormControl>

      {/* Onset Date */}
      <TextField
        id="onsetDateTimeInput"
        fullWidth
        label="Onset Date"
        type="date"
        value={moment(get(resource, 'onsetDateTime', '')).format('YYYY-MM-DD')}
        onChange={(e) => onChange('onsetDateTime', e.target.value)}
        disabled={!isEditing}
        InputLabelProps={{
          shrink: true,
        }}
      />

      {/* Recorder */}
      <TextField
        id="recorderInput"
        fullWidth
        label="Recorded By"
        value={get(resource, 'recorder.display', '')}
        onChange={(e) => onChange('recorder.display', e.target.value)}
        disabled={!isEditing}
        helperText="The person who recorded this allergy"
      />

      {/* Asserter */}
      <TextField
        id="asserterInput"
        fullWidth
        label="Asserted By"
        value={get(resource, 'asserter.display', '')}
        onChange={(e) => onChange('asserter.display', e.target.value)}
        disabled={!isEditing}
        helperText="The person who asserted this allergy"
      />

      {/* Notes */}
      <TextField
        id="notesTextarea"
        fullWidth
        label="Notes"
        multiline
        rows={3}
        value={get(resource, 'note[0].text', '')}
        onChange={(e) => onChange('note[0].text', e.target.value)}
        disabled={!isEditing}
        helperText="Additional notes about this allergy"
      />
    </Stack>
  );
}

export default AllergyIntoleranceFormView;
