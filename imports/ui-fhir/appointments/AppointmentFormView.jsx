// /imports/ui-fhir/appointments/AppointmentFormView.jsx

import React from 'react';

import {
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';

import { get } from 'lodash';
import moment from 'moment';

function AppointmentFormView({ resource, isEditing, onChange, isEmbedded, onSearchPatient, onAddPractitioner, onAddLocation }){
  return (
    <Grid container spacing={3}>
      {/* Row 1: Status and Priority */}
      <Grid item xs={12} md={6}>
        <TextField
          id="statusSelect"
          select
          fullWidth
          label="Status"
          value={get(resource, 'status', '')}
          onChange={(e) => onChange('status', e.target.value)}
          disabled={!isEditing}
        >
          <MenuItem value="proposed">Proposed</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="booked">Booked</MenuItem>
          <MenuItem value="arrived">Arrived</MenuItem>
          <MenuItem value="fulfilled">Fulfilled</MenuItem>
          <MenuItem value="cancelled">Cancelled</MenuItem>
          <MenuItem value="noshow">No Show</MenuItem>
          <MenuItem value="entered-in-error">Entered in Error</MenuItem>
          <MenuItem value="checked-in">Checked In</MenuItem>
          <MenuItem value="waitlist">Waitlist</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          id="priorityInput"
          fullWidth
          type="number"
          label="Priority"
          value={get(resource, 'priority', 5)}
          onChange={(e) => onChange('priority', parseInt(e.target.value))}
          disabled={!isEditing}
          inputProps={{ min: 0, max: 9 }}
        />
      </Grid>

      {/* Row 2: Patient */}
      <Grid item xs={12}>
        <TextField
          id="subjectDisplay"
          fullWidth
          label="Patient"
          value={get(resource, 'subject.display', '')}
          onChange={(e) => onChange('subject.display', e.target.value)}
          helperText={get(resource, 'subject.reference', '') || 'Patient reference will be assigned'}
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

      {/* Row 3: Appointment Type */}
      <Grid item xs={12}>
        <TextField
          id="appointmentTypeInput"
          fullWidth
          label="Appointment Type"
          value={get(resource, 'appointmentType.text', '')}
          onChange={(e) => onChange('appointmentType.text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 4: Start and End Times */}
      <Grid item xs={12} md={6}>
        <TextField
          id="startInput"
          fullWidth
          label="Start Time"
          type="datetime-local"
          value={moment(get(resource, 'start', new Date())).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => onChange('start', moment(e.target.value).toISOString())}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          id="endInput"
          fullWidth
          label="End Time"
          type="datetime-local"
          value={moment(get(resource, 'end', new Date())).format('YYYY-MM-DDTHH:mm')}
          onChange={(e) => onChange('end', moment(e.target.value).toISOString())}
          disabled={!isEditing}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Row 5: Duration */}
      <Grid item xs={12}>
        <TextField
          id="minutesDurationInput"
          fullWidth
          type="number"
          label="Duration (minutes)"
          value={get(resource, 'minutesDuration', 30)}
          onChange={(e) => onChange('minutesDuration', parseInt(e.target.value))}
          disabled={!isEditing}
          inputProps={{ min: 5 }}
        />
      </Grid>

      {/* Row 5b: Created Date */}
      <Grid item xs={12}>
        <TextField
          id="createdInput"
          fullWidth
          label="Created"
          type="datetime-local"
          value={moment(get(resource, 'created', new Date())).format('YYYY-MM-DDTHH:mm')}
          disabled={true}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      {/* Row 6: Reason */}
      <Grid item xs={12}>
        <TextField
          id="reasonInput"
          fullWidth
          label="Reason"
          value={get(resource, 'reasonCode[0].text', '')}
          onChange={(e) => onChange('reasonCode[0].text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 7: Description */}
      <Grid item xs={12}>
        <TextField
          id="descriptionInput"
          fullWidth
          multiline
          rows={2}
          label="Description"
          value={get(resource, 'description', '')}
          onChange={(e) => onChange('description', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 8: Comment */}
      <Grid item xs={12}>
        <TextField
          id="commentInput"
          fullWidth
          multiline
          rows={2}
          label="Comment"
          value={get(resource, 'comment', '')}
          onChange={(e) => onChange('comment', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 9: Patient Instructions */}
      <Grid item xs={12}>
        <TextField
          id="patientInstructionInput"
          fullWidth
          multiline
          rows={2}
          label="Patient Instructions"
          value={get(resource, 'patientInstruction', '')}
          onChange={(e) => onChange('patientInstruction', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 10: Service Category */}
      <Grid item xs={12} md={6}>
        <TextField
          id="serviceCategoryInput"
          fullWidth
          label="Service Category"
          value={get(resource, 'serviceCategory[0].text', '')}
          onChange={(e) => onChange('serviceCategory[0].text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 11: Service Type */}
      <Grid item xs={12} md={6}>
        <TextField
          id="serviceTypeInput"
          fullWidth
          label="Service Type"
          value={get(resource, 'serviceType[0].text', '')}
          onChange={(e) => onChange('serviceType[0].text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 12: Specialty */}
      <Grid item xs={12}>
        <TextField
          id="specialtyInput"
          fullWidth
          label="Specialty"
          value={get(resource, 'specialty[0].text', '')}
          onChange={(e) => onChange('specialty[0].text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Row 13: Notes */}
      <Grid item xs={12}>
        <TextField
          id="notesInput"
          fullWidth
          multiline
          rows={3}
          label="Notes"
          value={get(resource, 'note[0].text', '')}
          onChange={(e) => onChange('note[0].text', e.target.value)}
          disabled={!isEditing}
        />
      </Grid>

      {/* Participants Section */}
      <Grid item xs={12}>
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Participants</Typography>
        {get(resource, 'participant', []).map((participant, index) => {
          const isPractitioner = get(participant, 'actor.reference', '').startsWith('Practitioner/');
          const isLocation = get(participant, 'actor.reference', '').startsWith('Location/');
          const isPatient = get(participant, 'actor.reference', '').startsWith('Patient/');

          if(isPatient) return null; // Already shown above

          return (
            <Box key={index} sx={{ mb: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={isPractitioner ? 'Practitioner' : isLocation ? 'Location' : 'Participant'}
                    value={get(participant, 'actor.display', '')}
                    onChange={(e) => onChange('participant[' + index + '].actor.display', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Reference"
                    value={get(participant, 'actor.reference', '')}
                    onChange={(e) => onChange('participant[' + index + '].actor.reference', e.target.value)}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>
            </Box>
          );
        })}
        {isEditing && (
          <Box sx={{ mt: 1 }}>
            <Button onClick={onAddPractitioner} sx={{ mr: 1 }}>Add Practitioner</Button>
            <Button onClick={onAddLocation}>Add Location</Button>
          </Box>
        )}
      </Grid>
    </Grid>
  );
}

export default AppointmentFormView;
