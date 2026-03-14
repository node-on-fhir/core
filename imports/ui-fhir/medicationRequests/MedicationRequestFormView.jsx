// imports/ui-fhir/medicationRequests/MedicationRequestFormView.jsx

import React from 'react';
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Grid,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

//===========================================================================
// OPTIONS

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'stopped', label: 'Stopped' },
  { value: 'draft', label: 'Draft' },
  { value: 'unknown', label: 'Unknown' }
];

const intentOptions = [
  { value: 'proposal', label: 'Proposal' },
  { value: 'plan', label: 'Plan' },
  { value: 'order', label: 'Order' },
  { value: 'original-order', label: 'Original Order' },
  { value: 'reflex-order', label: 'Reflex Order' },
  { value: 'filler-order', label: 'Filler Order' },
  { value: 'instance-order', label: 'Instance Order' },
  { value: 'option', label: 'Option' }
];

const priorityOptions = [
  { value: 'routine', label: 'Routine' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'asap', label: 'ASAP' },
  { value: 'stat', label: 'STAT' }
];

const periodUnitOptions = [
  { value: 's', label: 'Second' },
  { value: 'min', label: 'Minute' },
  { value: 'h', label: 'Hour' },
  { value: 'd', label: 'Day' },
  { value: 'wk', label: 'Week' },
  { value: 'mo', label: 'Month' },
  { value: 'a', label: 'Year' }
];

//===========================================================================
// COMPONENT

function MedicationRequestFormView({ resource, isEditing, onChange, isEmbedded }) {
  var medicationRequest = resource || {};

  function handleChange(path, value) {
    if (typeof onChange === 'function') {
      onChange(path, value);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient */}
        <Grid item xs={12}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(medicationRequest, 'subject.display', '')}
            helperText={get(medicationRequest, 'subject.reference', '') || 'Patient reference will be assigned'}
            disabled
          />
        </Grid>

        {/* Medication Name + Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationDisplay"
            fullWidth
            label="Medication Name"
            value={get(medicationRequest, 'medicationCodeableConcept.text', '') ||
                   get(medicationRequest, 'medicationCodeableConcept.coding[0].display', '')}
            onChange={function(e) { handleChange('medicationCodeableConcept.text', e.target.value); }}
            helperText="Name of the medication"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="medicationCode"
            fullWidth
            label="Medication Code"
            value={get(medicationRequest, 'medicationCodeableConcept.coding[0].code', '')}
            onChange={function(e) { handleChange('medicationCodeableConcept.coding[0].code', e.target.value); }}
            helperText="RxNorm code"
            disabled={!isEditing}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Lookup RxNorm codes">
                    <IconButton
                      onClick={function() { window.open('https://mor.nlm.nih.gov/RxNav/', '_blank'); }}
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
        </Grid>

        {/* Status + Intent + Priority + Authored On */}
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Status</InputLabel>
            <Select
              id="status"
              value={get(medicationRequest, 'status', 'active')}
              onChange={function(e) { handleChange('status', e.target.value); }}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Intent</InputLabel>
            <Select
              id="intent"
              value={get(medicationRequest, 'intent', 'order')}
              onChange={function(e) { handleChange('intent', e.target.value); }}
              label="Intent"
            >
              {intentOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Priority</InputLabel>
            <Select
              id="priority"
              value={get(medicationRequest, 'priority', 'routine')}
              onChange={function(e) { handleChange('priority', e.target.value); }}
              label="Priority"
            >
              {priorityOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            id="authoredOn"
            fullWidth
            type="date"
            label="Authored On"
            value={moment(get(medicationRequest, 'authoredOn', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('authoredOn', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Requester */}
        <Grid item xs={12}>
          <TextField
            id="requesterDisplay"
            fullWidth
            label="Requester"
            value={get(medicationRequest, 'requester.display', '')}
            onChange={function(e) { handleChange('requester.display', e.target.value); }}
            helperText={get(medicationRequest, 'requester.reference', '') || 'Practitioner reference will be assigned'}
            disabled={!isEditing}
          />
        </Grid>

        {/* Dosage Instructions Header */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Dosage Instructions</Typography>
        </Grid>

        {/* Dosage Instructions Text */}
        <Grid item xs={12}>
          <TextField
            id="dosageInstruction"
            fullWidth
            multiline
            rows={2}
            label="Dosage Instructions Text"
            value={get(medicationRequest, 'dosageInstruction[0].text', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].text', e.target.value); }}
            helperText="e.g., Take 2 tablets by mouth every 6 hours"
            disabled={!isEditing}
          />
        </Grid>

        {/* Dose Amount + Unit */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="number"
            label="Dose Amount"
            value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.value', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.value', parseFloat(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Dose Unit"
            value={get(medicationRequest, 'dosageInstruction[0].doseAndRate[0].doseQuantity.unit', '')}
            onChange={function(e) {
              handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.unit', e.target.value);
              handleChange('dosageInstruction[0].doseAndRate[0].doseQuantity.code', e.target.value);
            }}
            helperText="e.g., mg, mL, tablets"
            disabled={!isEditing}
          />
        </Grid>

        {/* Frequency + Period + Period Unit + Timing */}
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Frequency"
            value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.frequency', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].timing.repeat.frequency', parseInt(e.target.value) || null); }}
            helperText="Times per period"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            type="number"
            label="Period"
            value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.period', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].timing.repeat.period', parseInt(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel>Period Unit</InputLabel>
            <Select
              value={get(medicationRequest, 'dosageInstruction[0].timing.repeat.periodUnit', 'd')}
              onChange={function(e) { handleChange('dosageInstruction[0].timing.repeat.periodUnit', e.target.value); }}
              label="Period Unit"
            >
              {periodUnitOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField
            id="dosageTiming"
            fullWidth
            label="Timing"
            value={get(medicationRequest, 'dosageInstruction[0].timing.code.text', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].timing.code.text', e.target.value); }}
            helperText="e.g., 1/d, BID, TID"
            disabled={!isEditing}
          />
        </Grid>

        {/* Route Code + Route Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="dosageRouteCode"
            fullWidth
            label="Route Code"
            value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].code', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].route.coding[0].code', e.target.value); }}
            helperText="SNOMED code"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="dosageRouteDisplay"
            fullWidth
            label="Route Display"
            value={get(medicationRequest, 'dosageInstruction[0].route.coding[0].display', '')}
            onChange={function(e) { handleChange('dosageInstruction[0].route.coding[0].display', e.target.value); }}
            helperText="e.g., oral, IV, IM"
            disabled={!isEditing}
          />
        </Grid>

        {/* Dispense Request Header */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Dispense Request</Typography>
        </Grid>

        {/* Dispense Quantity + Unit + Repeats */}
        <Grid item xs={12} md={4}>
          <TextField
            id="dispenseQuantity"
            fullWidth
            type="number"
            label="Dispense Quantity"
            value={get(medicationRequest, 'dispenseRequest.quantity.value', '')}
            onChange={function(e) { handleChange('dispenseRequest.quantity.value', parseFloat(e.target.value) || null); }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="dispenseUnit"
            fullWidth
            label="Dispense Unit"
            value={get(medicationRequest, 'dispenseRequest.quantity.unit', '')}
            onChange={function(e) { handleChange('dispenseRequest.quantity.unit', e.target.value); }}
            helperText="e.g., tablets, mL"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            id="numberOfRepeats"
            fullWidth
            type="number"
            label="Number of Repeats"
            value={get(medicationRequest, 'dispenseRequest.numberOfRepeatsAllowed', '')}
            onChange={function(e) { handleChange('dispenseRequest.numberOfRepeatsAllowed', parseInt(e.target.value) || null); }}
            helperText="Number of refills allowed"
            disabled={!isEditing}
          />
        </Grid>

        {/* Validity Period */}
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Valid From"
            value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.start', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('dispenseRequest.validityPeriod.start', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            type="date"
            label="Valid Until"
            value={moment(get(medicationRequest, 'dispenseRequest.validityPeriod.end', '')).format('YYYY-MM-DD')}
            onChange={function(e) { handleChange('dispenseRequest.validityPeriod.end', e.target.value); }}
            InputLabelProps={{ shrink: true }}
            disabled={!isEditing}
          />
        </Grid>

        {/* Clinical Information Header */}
        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mt: 1 }}>Clinical Information</Typography>
        </Grid>

        {/* Reason Code + Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonCode"
            fullWidth
            label="Reason Code"
            value={get(medicationRequest, 'reasonCode[0].coding[0].code', '')}
            onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
            helperText="SNOMED code for condition"
            disabled={!isEditing}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonDisplay"
            fullWidth
            label="Reason Display"
            value={get(medicationRequest, 'reasonCode[0].text', '') || get(medicationRequest, 'reasonCode[0].coding[0].display', '')}
            onChange={function(e) { handleChange('reasonCode[0].text', e.target.value); }}
            helperText="e.g., Hypertension, Diabetes"
            disabled={!isEditing}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(medicationRequest, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            helperText="Additional notes or instructions"
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default MedicationRequestFormView;
