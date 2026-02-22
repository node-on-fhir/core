// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/appointments/AppointmentDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Container,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';

import { get, set, has, cloneDeep } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

export function AppointmentDetail(props){
  const navigate = useNavigate();
  const { id } = useParams();
  const appointmentId = id;
  
  // Initialize with subject and participant slot for patient
  const [appointment, setAppointment] = useState({
    resourceType: 'Appointment',
    status: 'proposed',
    subject: {
      reference: '',
      display: ''
    },
    participant: [{
      actor: {
        reference: '',
        display: ''
      },
      status: 'needs-action'
    }]
  });
  const [isEditing, setIsEditing] = useState(!appointmentId || appointmentId === 'new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Subscribe to appointments and track subscription status
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Appointments', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('appointments.all');
    }
    return handle.ready();
  }, []);

  // Track selected patient reactively
  const selectedPatient = useTracker(() => Session.get('selectedPatient'), []);
  const selectedPatientId = useTracker(() => Session.get('selectedPatientId'), []);
  
  // Debug what we're getting from Session
  console.log('AppointmentDetail - selectedPatient from Session:', selectedPatient);
  console.log('AppointmentDetail - selectedPatientId from Session:', selectedPatientId);

  // Fetch existing appointment
  useEffect(() => {
    if (appointmentId && appointmentId !== 'new') {
      const existingAppointment = Appointments.findOne({ _id: appointmentId });
      if (existingAppointment) {
        setAppointment(existingAppointment);
        setIsEditing(false);
      }
    } else {
      // Set default patient if selected
      const selectedPatientId = Session.get('selectedPatientId');
      const selectedPatient = Session.get('selectedPatient');
      
      if (selectedPatient && selectedPatientId) {
        // Use FHIR id for the reference, not MongoDB _id
        const fhirId = get(selectedPatient, 'id', selectedPatientId);
        
        setAppointment(prev => ({
          ...prev,
          subject: {
            reference: `Patient/${fhirId}`,
            display: get(selectedPatient, 'name[0].text', '')
          },
          participant: [{
            ...prev.participant[0],
            actor: {
              reference: `Patient/${fhirId}`,
              display: get(selectedPatient, 'name[0].text', '')
            }
          }]
        }));
      }
    }
  }, [appointmentId]);

  // Handlers
  function handleChange(path, value) {
    const updatedAppointment = cloneDeep(appointment);
    set(updatedAppointment, path, value);
    
    // Keep subject and participant in sync
    if (path === 'subject.display') {
      // Update the first participant's display too
      const patientParticipant = updatedAppointment.participant.find(p => 
        get(p, 'actor.reference', '').startsWith('Patient/') || get(p, 'actor.reference', '') === ''
      );
      if (patientParticipant) {
        set(patientParticipant, 'actor.display', value);
      }
    } else if (path === 'subject.reference') {
      // Update the first participant's reference too
      const patientParticipant = updatedAppointment.participant.find(p => 
        get(p, 'actor.reference', '').startsWith('Patient/') || get(p, 'actor.reference', '') === ''
      );
      if (patientParticipant) {
        set(patientParticipant, 'actor.reference', value);
      }
    }
    
    setAppointment(updatedAppointment);
  }

  function handleEditClick() {
    setIsEditing(true);
  }

  function handleCancelClick() {
    if (appointmentId === 'new') {
      navigate('/appointments');
    } else {
      // Reload original data
      const originalAppointment = Appointments.findOne({_id: appointmentId});
      if (originalAppointment) {
        setAppointment(originalAppointment);
      }
      setIsEditing(false);
    }
  }

  async function handleSaveButton(){
    setLoading(true);
    try {
      // Prepare the data for saving
      let dataToSave = {
        status: get(appointment, 'status', 'proposed'),
        description: get(appointment, 'description', ''),
        comment: get(appointment, 'comment', ''),
        patientInstruction: get(appointment, 'patientInstruction', ''),
        priority: parseInt(get(appointment, 'priority', 5)),
        minutesDuration: parseInt(get(appointment, 'minutesDuration', 30))
      };

      // Handle start and end dates
      if(get(appointment, 'start')){
        dataToSave.start = moment(get(appointment, 'start')).toDate();
      }
      if(get(appointment, 'end')){
        dataToSave.end = moment(get(appointment, 'end')).toDate();
      }
      if(get(appointment, 'created')){
        dataToSave.created = moment(get(appointment, 'created')).toDate();
      }

      // Handle appointment type
      if(get(appointment, 'appointmentType.text') || get(appointment, 'appointmentType.coding[0].code')){
        dataToSave.appointmentType = {
          coding: [{
            system: 'http://snomed.info/sct',
            code: get(appointment, 'appointmentType.coding[0].code', ''),
            display: get(appointment, 'appointmentType.coding[0].display', get(appointment, 'appointmentType.text', ''))
          }],
          text: get(appointment, 'appointmentType.text', '')
        };
      }

      // Handle reason
      if(get(appointment, 'reasonCode[0].text') || get(appointment, 'reasonCode[0].coding[0].code')){
        dataToSave.reasonCode = [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: get(appointment, 'reasonCode[0].coding[0].code', ''),
            display: get(appointment, 'reasonCode[0].coding[0].display', get(appointment, 'reasonCode[0].text', ''))
          }],
          text: get(appointment, 'reasonCode[0].text', '')
        }];
      }

      // Handle service category
      if(get(appointment, 'serviceCategory[0].text')){
        dataToSave.serviceCategory = [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/service-category',
            display: get(appointment, 'serviceCategory[0].text', '')
          }],
          text: get(appointment, 'serviceCategory[0].text', '')
        }];
      }

      // Handle service type
      if(get(appointment, 'serviceType[0].text')){
        dataToSave.serviceType = [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/service-type',
            display: get(appointment, 'serviceType[0].text', '')
          }],
          text: get(appointment, 'serviceType[0].text', '')
        }];
      }

      // Handle specialty
      if(get(appointment, 'specialty[0].text')){
        dataToSave.specialty = [{
          coding: [{
            system: 'http://snomed.info/sct',
            display: get(appointment, 'specialty[0].text', '')
          }],
          text: get(appointment, 'specialty[0].text', '')
        }];
      }

      // Handle subject (for consistency with other resources)
      if(get(appointment, 'subject.reference') || get(appointment, 'subject.display')){
        dataToSave.subject = get(appointment, 'subject');
      }

      // Handle participants
      dataToSave.participant = get(appointment, 'participant', []);

      // Handle notes
      if(get(appointment, 'note[0].text')){
        dataToSave.note = [{
          text: get(appointment, 'note[0].text', ''),
          time: new Date()
        }];
      }

      console.log('Saving appointment data:', dataToSave);

      if(appointmentId && appointmentId !== 'new'){
        await Meteor.callAsync('updateAppointment', appointmentId, dataToSave);
        setIsEditing(false); // Stay on page, switch to read mode
      } else {
        const id = await Meteor.callAsync('createAppointment', dataToSave);
        navigate('/appointments'); // Navigate to list after create
      }
    } catch(error) {
      console.error('Error saving appointment:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteButton(){
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeAppointment', appointmentId);
        navigate('/appointments');
      } catch(error) {
        console.error('Error deleting appointment:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  function handleSearchUser(){
    setSearchDialogOpen(true);
    // Load all patients for search
    const patients = Patients.find({}).fetch();
    setSearchResults(patients);
  }

  function handleSelectPatient(patient){
    // Update the appointment with selected patient
    const updatedAppointment = cloneDeep(appointment);
    
    // Use FHIR id for the reference
    const fhirId = get(patient, 'id');
    const mongoId = get(patient, '_id');
    const patientId = fhirId || mongoId;
    const patientName = get(patient, 'name[0].text', '');
    const patientRef = `Patient/${patientId}`;
    
    // Update subject (for consistency with other resources)
    updatedAppointment.subject = {
      reference: patientRef,
      display: patientName
    };
    
    // Also update participant for FHIR R4 compliance
    // Find or create patient participant
    let patientParticipant = updatedAppointment.participant.find(p => 
      get(p, 'actor.reference', '').startsWith('Patient/')
    );
    
    if(!patientParticipant){
      patientParticipant = {
        actor: {},
        status: 'needs-action'
      };
      updatedAppointment.participant.push(patientParticipant);
    }
    
    patientParticipant.actor = {
      reference: patientRef,
      display: patientName
    };
    
    setAppointment(updatedAppointment);
    setSearchDialogOpen(false);
  }

  function handleAddPractitioner(){
    const updatedAppointment = cloneDeep(appointment);
    if(!updatedAppointment.participant){
      updatedAppointment.participant = [];
    }
    updatedAppointment.participant.push({
      type: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
          code: 'PPRF',
          display: 'primary performer'
        }]
      }],
      actor: {
        reference: '',
        display: ''
      },
      status: 'accepted'
    });
    setAppointment(updatedAppointment);
  }

  function handleAddLocation(){
    const updatedAppointment = cloneDeep(appointment);
    if(!updatedAppointment.participant){
      updatedAppointment.participant = [];
    }
    updatedAppointment.participant.push({
      actor: {
        reference: '',
        display: ''
      },
      status: 'accepted'
    });
    setAppointment(updatedAppointment);
  }


  return (
    <Container id='appointmentDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={appointmentId && appointmentId !== 'new' ? 'Edit Appointment' : 'New Appointment'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {(appointmentId && appointmentId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{appointmentId}</span>
            </Box>
          )}
          
          <Grid container spacing={3}>
            {/* Row 1: Status and Priority */}
            <Grid item xs={12} md={6}>
              <TextField
                id="statusSelect"
                select
                fullWidth
                label="Status"
                value={get(appointment, 'status', '')}
                onChange={(e) => handleChange('status', e.target.value)}
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
                value={get(appointment, 'priority', 5)}
                onChange={(e) => handleChange('priority', parseInt(e.target.value))}
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
                value={get(appointment, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                helperText={get(appointment, 'subject.reference', '') || 'Patient reference will be assigned'}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton
                          onClick={handleSearchUser}
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
                value={get(appointment, 'appointmentType.text', '')}
                onChange={(e) => handleChange('appointmentType.text', e.target.value)}
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
                value={moment(get(appointment, 'start', new Date())).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('start', moment(e.target.value).toISOString())}
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
                value={moment(get(appointment, 'end', new Date())).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('end', moment(e.target.value).toISOString())}
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
                value={get(appointment, 'minutesDuration', 30)}
                onChange={(e) => handleChange('minutesDuration', parseInt(e.target.value))}
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
                value={moment(get(appointment, 'created', new Date())).format('YYYY-MM-DDTHH:mm')}
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
                value={get(appointment, 'reasonCode[0].text', '')}
                onChange={(e) => handleChange('reasonCode[0].text', e.target.value)}
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
                value={get(appointment, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
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
                value={get(appointment, 'comment', '')}
                onChange={(e) => handleChange('comment', e.target.value)}
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
                value={get(appointment, 'patientInstruction', '')}
                onChange={(e) => handleChange('patientInstruction', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Row 10: Service Category */}
            <Grid item xs={12} md={6}>
              <TextField
                id="serviceCategoryInput"
                fullWidth
                label="Service Category"
                value={get(appointment, 'serviceCategory[0].text', '')}
                onChange={(e) => handleChange('serviceCategory[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Row 11: Service Type */}
            <Grid item xs={12} md={6}>
              <TextField
                id="serviceTypeInput"
                fullWidth
                label="Service Type"
                value={get(appointment, 'serviceType[0].text', '')}
                onChange={(e) => handleChange('serviceType[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Row 12: Specialty */}
            <Grid item xs={12}>
              <TextField
                id="specialtyInput"
                fullWidth
                label="Specialty"
                value={get(appointment, 'specialty[0].text', '')}
                onChange={(e) => handleChange('specialty[0].text', e.target.value)}
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
                value={get(appointment, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>

            {/* Participants Section */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Participants</Typography>
              {get(appointment, 'participant', []).map((participant, index) => {
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
                          onChange={(e) => handleChange(`participant[${index}].actor.display`, e.target.value)}
                          disabled={!isEditing}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Reference"
                          value={get(participant, 'actor.reference', '')}
                          onChange={(e) => handleChange(`participant[${index}].actor.reference`, e.target.value)}
                          disabled={!isEditing}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                );
              })}
              {isEditing && (
                <Box sx={{ mt: 1 }}>
                  <Button onClick={handleAddPractitioner} sx={{ mr: 1 }}>Add Practitioner</Button>
                  <Button onClick={handleAddLocation}>Add Location</Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/appointments')}
              >
                Back
              </Button>
              {appointmentId !== 'new' && (
                <Button
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteButton}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                color="primary"
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelClick}
              >
                Cancel
              </Button>
              <Button
                id="saveAppointmentButton"
                color="primary"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveButton}
                disabled={loading}
              >
                {appointmentId === 'new' ? 'Save' : 'Update'} Appointment
              </Button>
            </>
          )}
        </CardActions>
      </Card>

      {/* Patient Search Dialog */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Search for Patient</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Search by name"
            fullWidth
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {searchResults
              .filter(patient => {
                if(!searchFilter) return true;
                const name = get(patient, 'name[0].text', '').toLowerCase();
                return name.includes(searchFilter.toLowerCase());
              })
              .map(patient => (
                <Box
                  key={patient._id}
                  sx={{
                    p: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <Typography>{get(patient, 'name[0].text', 'Unnamed Patient')}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {get(patient, 'id', patient._id)}
                  </Typography>
                </Box>
              ))
            }
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AppointmentDetail;