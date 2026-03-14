// imports/ui-fhir/procedures/ProcedureFormView.jsx

import React from 'react';

import {
  Grid,
  TextField,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';

//===========================================================================
// STATUS OPTIONS

const statusOptions = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'aborted', label: 'Aborted' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

//===========================================================================
// COMPONENT

function ProcedureFormView({ resource, form, isEditing, onChange, isEmbedded, onSearchPatient }) {
  // Use form state if provided, otherwise fall back to resource
  const procedure = form || resource || {};

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Patient Field */}
        <Grid item xs={12} md={6}>
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(procedure, 'subject.display', '')}
            onChange={(e) => onChange('subject.display', e.target.value)}
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
        </Grid>

        {/* Performer Field */}
        <Grid item xs={12} md={6}>
          <TextField
            id="performerDisplay"
            fullWidth
            label="Performer"
            value={get(procedure, 'performer[0].actor.display', '')}
            onChange={(e) => onChange('performer[0].actor.display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Status */}
        <Grid item xs={12} md={6}>
          <FormControl fullWidth disabled={!isEditing}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              id="status"
              labelId="status-label"
              value={get(procedure, 'status', '')}
              onChange={(e) => onChange('status', e.target.value)}
              label="Status"
            >
              {statusOptions.map(function(option) {
                return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
              })}
            </Select>
          </FormControl>
        </Grid>

        {/* Performed Date/Time */}
        <Grid item xs={12} md={6}>
          <TextField
            id="performedDateTime"
            fullWidth
            label="Performed Date/Time"
            type="datetime-local"
            value={get(procedure, 'performedDateTime', '') ? String(get(procedure, 'performedDateTime', '')).substring(0, 16) : ''}
            onChange={(e) => onChange('performedDateTime', e.target.value)}
            disabled={!isEditing}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        {/* Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="codeCode"
            fullWidth
            label="Procedure Code"
            value={get(procedure, 'code.coding[0].code', '')}
            onChange={(e) => onChange('code.coding[0].code', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Code Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="codeDisplay"
            fullWidth
            label="Procedure Name"
            value={get(procedure, 'code.coding[0].display', '')}
            onChange={(e) => onChange('code.coding[0].display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Category Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="categoryCode"
            fullWidth
            label="Category Code"
            value={get(procedure, 'category.coding[0].code', '')}
            onChange={(e) => onChange('category.coding[0].code', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Category Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="categoryDisplay"
            fullWidth
            label="Category"
            value={get(procedure, 'category.coding[0].display', '')}
            onChange={(e) => onChange('category.coding[0].display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Body Site Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="bodySiteCode"
            fullWidth
            label="Body Site Code"
            value={get(procedure, 'bodySite[0].coding[0].code', '')}
            onChange={(e) => onChange('bodySite[0].coding[0].code', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Body Site Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="bodySiteDisplay"
            fullWidth
            label="Body Site"
            value={get(procedure, 'bodySite[0].coding[0].display', '')}
            onChange={(e) => onChange('bodySite[0].coding[0].display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Outcome */}
        <Grid item xs={12} md={6}>
          <TextField
            id="outcome"
            fullWidth
            label="Outcome"
            value={get(procedure, 'outcome.text', '')}
            onChange={(e) => onChange('outcome.text', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Location */}
        <Grid item xs={12} md={6}>
          <TextField
            id="locationDisplay"
            fullWidth
            label="Location"
            value={get(procedure, 'location.display', '')}
            onChange={(e) => onChange('location.display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Reason Code */}
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonCode"
            fullWidth
            label="Reason Code"
            value={get(procedure, 'reasonCode[0].coding[0].code', '')}
            onChange={(e) => onChange('reasonCode[0].coding[0].code', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Reason Display */}
        <Grid item xs={12} md={6}>
          <TextField
            id="reasonDisplay"
            fullWidth
            label="Reason"
            value={get(procedure, 'reasonCode[0].coding[0].display', '')}
            onChange={(e) => onChange('reasonCode[0].coding[0].display', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>

        {/* Notes */}
        <Grid item xs={12}>
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={4}
            label="Notes"
            value={get(procedure, 'note[0].text', '')}
            onChange={(e) => onChange('note[0].text', e.target.value)}
            disabled={!isEditing}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProcedureFormView;
