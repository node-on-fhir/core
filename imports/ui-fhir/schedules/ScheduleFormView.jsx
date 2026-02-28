// imports/ui-fhir/schedules/ScheduleFormView.jsx

import React from 'react';

import {
  TextField,
  Grid,
  FormControlLabel,
  Switch
} from '@mui/material';

import { get } from 'lodash';

function ScheduleFormView({ resource, form, isEditing, onChange, isEmbedded }){
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              id="activeCheckbox"
              checked={get(form, 'active', true)}
              onChange={(e) => onChange('active', e.target.checked)}
              disabled={!isEditing}
            />
          }
          label="Active"
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="identifierInput"
          label="Identifier"
          fullWidth
          value={get(form, 'identifierValue', '')}
          onChange={(e) => onChange('identifierValue', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="identifierSystem"
          label="Identifier System"
          fullWidth
          value={get(form, 'identifierSystem', '')}
          onChange={(e) => onChange('identifierSystem', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="serviceCategoryInput"
          label="Service Category Code"
          fullWidth
          value={get(form, 'serviceCategoryCode', '')}
          onChange={(e) => onChange('serviceCategoryCode', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="serviceCategoryDisplayInput"
          label="Service Category Display"
          fullWidth
          value={get(form, 'serviceCategoryDisplay', '')}
          onChange={(e) => onChange('serviceCategoryDisplay', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="serviceTypeInput"
          label="Service Type Code"
          fullWidth
          value={get(form, 'serviceTypeCode', '')}
          onChange={(e) => onChange('serviceTypeCode', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="serviceTypeDisplayInput"
          label="Service Type Display"
          fullWidth
          value={get(form, 'serviceTypeDisplay', '')}
          onChange={(e) => onChange('serviceTypeDisplay', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="specialtyInput"
          label="Specialty Code"
          fullWidth
          value={get(form, 'specialtyCode', '')}
          onChange={(e) => onChange('specialtyCode', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="specialtyDisplayInput"
          label="Specialty Display"
          fullWidth
          value={get(form, 'specialtyDisplay', '')}
          onChange={(e) => onChange('specialtyDisplay', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="actorDisplayInput"
          label="Actor Display"
          fullWidth
          value={get(form, 'actorDisplay', '')}
          onChange={(e) => onChange('actorDisplay', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="actorReferenceInput"
          label="Actor Reference"
          fullWidth
          value={get(form, 'actorReference', '')}
          onChange={(e) => onChange('actorReference', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="planningHorizonStartInput"
          label="Planning Horizon Start"
          type="date"
          fullWidth
          value={get(form, 'planningHorizonStart', '')}
          onChange={(e) => onChange('planningHorizonStart', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          id="planningHorizonEndInput"
          label="Planning Horizon End"
          type="date"
          fullWidth
          value={get(form, 'planningHorizonEnd', '')}
          onChange={(e) => onChange('planningHorizonEnd', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="commentTextarea"
          label="Comment"
          fullWidth
          multiline
          rows={2}
          value={get(form, 'comment', '')}
          onChange={(e) => onChange('comment', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          id="notesTextarea"
          label="Notes (Custom Field)"
          fullWidth
          multiline
          rows={3}
          value={get(form, 'notes', '')}
          onChange={(e) => onChange('notes', e.target.value)}
          variant="outlined"
          disabled={!isEditing}
        />
      </Grid>
    </Grid>
  );
}

export default ScheduleFormView;
