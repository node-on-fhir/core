// /imports/ui-fhir/encounters/EncounterDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert,
  Dialog
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

import EncounterFormView from './EncounterFormView';
import EncounterPreview from './EncounterPreview';

// Direct imports - avoid Meteor.startup timing issues
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

const log = (Meteor.Logger ? Meteor.Logger.for('EncounterDetail') : console);

function EncounterDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewEncounter = !id || id === 'new';
  const isExistingEncounter = id && id !== 'new';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [encounter, setEncounter] = useState({
    resourceType: "Encounter",
    status: "in-progress",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "Ambulatory"
    },
    type: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    subject: {
      reference: "",
      display: ""
    },
    participant: [{
      type: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
          code: "PPRF",
          display: "Primary performer"
        }]
      }],
      individual: {
        reference: "",
        display: ""
      }
    }],
    period: {
      start: moment().format('YYYY-MM-DDTHH:mm:ss'),
      end: moment().add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
    },
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setEncounter(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Subscribe to encounters so data is available locally
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Encounters', Session.get('selectedPatientId'), { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('encounters.all').ready();
    }
  }, []);

  // Set initial state and practitioner on component mount
  useEffect(function() {
    if (isEmbedded) return; // Resource comes from props in embedded mode
    if (isNewEncounter) {
      // Enable editing for new encounters
      setIsEditing(true);

      // For new encounters, set patient from session if available
      let patientName = '';
      let patientReference = '';

      if (selectedPatient && selectedPatientId) {
        // Handle both FHIR and flat patient structures
        if (typeof selectedPatient.name === 'string') {
          patientName = selectedPatient.name;
        } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
          patientName = FhirUtilities.pluckName(selectedPatient);
        }
        // Use FHIR id for patient reference, not MongoDB _id
        const fhirId = get(selectedPatient, 'id', selectedPatientId);
        patientReference = `Patient/${fhirId}`;
      }

      // Set practitioner to current user
      let practitionerName = '';
      let practitionerReference = '';

      if (currentUser) {
        practitionerName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        practitionerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setEncounter(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        participant: [{
          ...prev.participant[0],
          individual: {
            reference: practitionerReference,
            display: practitionerName
          }
        }]
      }));
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load encounter data when subscription is ready
  useEffect(function() {
    if (isExistingEncounter && isSubscriptionReady) {
      let existingEncounter = Encounters.findOne({ _id: id });

      if (existingEncounter) {
        setEncounter(existingEncounter);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('encounters.get', id);
            if (result) {
              setEncounter(result);
            }
          } catch (err) {
            console.error('[EncounterDetail] Error loading encounter via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    pendingUpdate.current = true;
    setEncounter(prevEncounter => {
      const updatedEncounter = JSON.parse(JSON.stringify(prevEncounter)); // Deep clone
      set(updatedEncounter, path, value);
      return updatedEncounter;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(encounter);
    }
  }, [encounter]);


  // Handle search for users/patients
  function handleSearchUser() {
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    try {
      if (patient) {
        // Extract patient name - handle both FHIR structure and flat structure
        let patientName = '';

        if (typeof patient.name === 'string') {
          patientName = patient.name;
        } else if (patient.name && Array.isArray(patient.name)) {
          patientName = FhirUtilities.pluckName(patient);
        } else {
          patientName = patient.id || patientId;
        }

        // Use FHIR id for patient reference, not MongoDB _id
        const fhirId = get(patient, 'id', patientId);

        // Update both fields at once to ensure consistency
        setEncounter(prevEncounter => {
          const updated = JSON.parse(JSON.stringify(prevEncounter));
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          return updated;
        });
      } else {
        // If patient object not provided, try to find it
        if (Patients) {
          const foundPatient = Patients.findOne({_id: patientId});
          if (foundPatient) {
            const patientName = FhirUtilities.pluckName(foundPatient);
            const fhirId = get(foundPatient, 'id', patientId);
            handleChange('subject.reference', `Patient/${fhirId}`);
            handleChange('subject.display', patientName);
          } else {
            handleChange('subject.reference', `Patient/${patientId}`);
            handleChange('subject.display', 'Patient ' + patientId);
          }
        } else {
          handleChange('subject.reference', `Patient/${patientId}`);
          handleChange('subject.display', 'Patient ' + patientId);
        }
      }
    } catch (err) {
      log.phi('Error handling patient selection:', { err }, { action: 'read' });
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingEncounter) {
        await Meteor.callAsync('encounters.update', id, encounter);
        console.log('[EncounterDetail] Encounter updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('encounters.create', encounter);
        console.log('[EncounterDetail] Encounter created with ID:', newId);
        navigate('/encounters');
      }
    } catch (err) {
      console.error('[EncounterDetail] Error saving encounter:', err);
      setError(err.message || err.reason || 'Failed to save encounter');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingEncounter) return;

    if (window.confirm('Are you sure you want to delete this encounter?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('encounters.remove', id);
        console.log('[EncounterDetail] Encounter deleted successfully');
        navigate('/encounters');
      } catch (err) {
        console.error('[EncounterDetail] Error deleting encounter:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingEncounter) {
      setIsEditing(false);
      setError(null);
      // Reload from local collection first, method fallback
      const existingEncounter = Encounters.findOne({ _id: id });
      if (existingEncounter) {
        setEncounter(existingEncounter);
      } else {
        async function reloadEncounter() {
          try {
            const result = await Meteor.callAsync('encounters.get', id);
            if (result) {
              setEncounter(result);
            }
          } catch (err) {
            console.error('[EncounterDetail] Error reloading encounter:', err);
          }
        }
        reloadEncounter();
      }
    } else {
      navigate('/encounters');
    }
  }

  // Build the header title
  let headerTitle = 'New Encounter';
  if (isExistingEncounter) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new encounters */}
        {!isNewEncounter && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle — hidden for new encounters */}
        {!isNewEncounter && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewEncounter && (
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

        {/* Delete — gated on edit mode */}
        {!isNewEncounter && (
          <Button
              id="deleteButton"
              onClick={handleDelete}
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
  function renderFormView() {
    return (
      <>
        <EncounterFormView
          resource={encounter}
          form={encounter}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveEncounterButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return (
      <EncounterPreview
        resource={encounter}
        form={encounter}
        resourceId={isExistingEncounter ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="encounterDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>

      {/* Patient Search Dialog */}
      <Dialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog
          onSelect={handlePatientSelect}
          defaultSearchTerm={get(encounter, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default EncounterDetail;
