// /imports/ui-fhir/appointments/AppointmentDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Card,
  CardContent,
  CardHeader,
  Container,
  Button,
  Box,
  Typography,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import AppointmentFormView from './AppointmentFormView';
import AppointmentPreview from './AppointmentPreview';

const log = (Meteor.Logger ? Meteor.Logger.for('AppointmentDetail') : console);

export function AppointmentDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
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

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setAppointment(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded || !appointmentId || appointmentId === 'new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !appointmentId || appointmentId === 'new';

  // Subscribe to appointments and track subscription status
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
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
  log.phi('AppointmentDetail - selectedPatient from Session:', selectedPatient, { action: 'read' });
  log.debug('AppointmentDetail - selectedPatientId from Session:', { selectedPatientId });

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

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedAppointment);
    }
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
        await Meteor.rpc('appointments.update', { appointmentId: appointmentId, appointmentData: dataToSave });
        setIsEditing(false); // Stay on page, switch to read mode
      } else {
        const id = await Meteor.rpc('appointments.create', dataToSave);
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
        await Meteor.rpc('appointments.remove', { appointmentId: appointmentId });
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

  // Build the header title
  let headerTitle = 'New Appointment';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{appointmentId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new records */}
        {!isNewRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new records (always form) */}
        {!isNewRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Edit toggle — only for existing records */}
        {!isNewRecord && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete — only for existing records */}
        {!isNewRecord && (
          <Button
              id="deleteButton"
              onClick={handleDeleteButton}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <AppointmentFormView
          resource={appointment}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
          onAddPractitioner={handleAddPractitioner}
          onAddLocation={handleAddLocation}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button
              id="saveAppointmentButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isNewRecord ? 'Save' : 'Update')} Appointment
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <AppointmentPreview
        resource={appointment}
        resourceId={appointmentId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='appointmentDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
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
