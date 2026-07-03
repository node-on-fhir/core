// /imports/ui-fhir/medias/MediaDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Alert
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

import MediaFormView from './MediaFormView';
import MediaPreview from './MediaPreview';

const log = (Meteor.Logger ? Meteor.Logger.for('MediaDetail') : console);

// Get the Patients collection
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

// Get the Medias collection from Meteor.Collections
let Medias;
Meteor.startup(function(){
  Medias = Meteor.Collections.Medias;
});

function MediaDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to medias and patients data
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.Medias', {}, {});
    } else {
      handle = Meteor.subscribe('medias.all');
    }
    return handle.ready();
  }, []);

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
  const [media, setMedia] = useState({
    resourceType: "Media",
    status: "completed",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/media-type",
        code: "photo",
        display: "Photo"
      }],
      text: "Photo"
    },
    modality: {
      coding: [{
        system: "http://dicom.nema.org/resources/ontology/DCM",
        code: "",
        display: ""
      }],
      text: ""
    },
    view: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    operator: [{
      reference: "",
      display: ""
    }],
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    bodySite: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    deviceName: "",
    device: {
      reference: "",
      display: ""
    },
    height: null,
    width: null,
    frames: null,
    duration: null,
    content: {
      contentType: "image/jpeg",
      url: "",
      size: null,
      title: ""
    },
    created: moment().format('YYYY-MM-DD'),
    issued: moment().format('YYYY-MM-DD'),
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
      setMedia(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || id === 'new');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [mediaId, setMediaId] = useState(false);

  const isNewMedia = !id || id === 'new';
  const isExistingMedia = mediaId && mediaId !== 'new';

  // Load media if editing
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new medias
      setIsEditing(true);

      // For new medias, set patient from session if available
      let patientName = '';
      let patientReference = '';

      if (selectedPatient || selectedPatientId) {
        // Handle both FHIR and flat patient structures
        if (selectedPatient) {
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
            patientName = FhirUtilities.pluckName(selectedPatient);
          }
        }

        // Use FHIR id for reference
        let fhirId = get(selectedPatient, 'id');
        if (!fhirId && selectedPatientId) {
          fhirId = selectedPatientId;
        }
        if (!fhirId && selectedPatient && selectedPatient._id) {
          // Fallback to MongoDB _id if no FHIR id
          fhirId = typeof selectedPatient._id === 'object' && selectedPatient._id._str
            ? selectedPatient._id._str
            : String(selectedPatient._id);
        }

        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
          log.debug('Setting patient reference:', { patientReference });
          log.debug('Patient FHIR id:', { fhirId });
          log.phi('Patient name:', { patientName }, { action: 'read' });
        }
      }

      // Set operator to current user
      let operatorName = '';
      let operatorReference = '';

      if (currentUser) {
        operatorName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        operatorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setMedia(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        operator: [{
          reference: operatorReference,
          display: operatorName
        }]
      }));
    } else if (id && isSubscriptionReady) {
      // Load existing media
      const existingMedia = Medias.findOne({_id: id});
      if (existingMedia) {
        setMedia(existingMedia);
        setMediaId(id);
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady, currentUser, selectedPatient, selectedPatientId]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    pendingUpdate.current = true;
    setMedia(prevMedia => {
      const updatedMedia = JSON.parse(JSON.stringify(prevMedia)); // Deep clone
      set(updatedMedia, path, value);
      console.log('Updated media:', updatedMedia);
      return updatedMedia;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(media);
    }
  }, [media]);


  // Handle search for users/patients
  function handleSearchUser() {
    console.log('Opening patient search dialog...'); // phi-audit: ok
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    console.log('=== handlePatientSelect called ==='); // phi-audit: ok
    log.debug('Selected patient ID:', { patientId });
    log.phi('Selected patient object:', patient, { action: 'read' });

    try {
      if (patient) {
        // Extract patient name - handle both FHIR structure and flat structure
        let patientName = '';

        // Check if it's a flat structure (from PatientsTable)
        if (typeof patient.name === 'string') {
          patientName = patient.name;
          log.phi('Using flat structure name:', { patientName }, { action: 'read' });
        } else if (patient.name && Array.isArray(patient.name)) {
          // FHIR structure
          patientName = FhirUtilities.pluckName(patient);
          log.phi('Using FHIR structure name:', { patientName }, { action: 'read' });
        } else {
          // Fallback - try to construct from other fields
          patientName = patient.id || patientId;
        }

        log.phi('Final patient name:', { patientName }, { action: 'read' });

        // Update the media with selected patient
        console.log('Updating media subject...');
        setMedia(prevMedia => {
          const updated = JSON.parse(JSON.stringify(prevMedia));

          // Use FHIR id for reference
          let fhirId = patient.id;
          if (!fhirId && patientId) {
            fhirId = patientId;
          }
          if (!fhirId && patient._id) {
            fhirId = typeof patient._id === 'object' && patient._id._str
              ? patient._id._str
              : String(patient._id);
          }
          console.log('Using FHIR ID for reference:', fhirId);

          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          console.log('Updated media in setState:', updated);
          console.log('Subject after update:', updated.subject);
          return updated;
        });

        // Force a re-render to ensure UI updates
        setForceUpdate(prev => prev + 1);

        // Close the dialog after a small delay to ensure state update completes
        setTimeout(() => {
          setPatientSearchOpen(false);
        }, 100);
      }
    } catch (error) {
      log.error('Error handling patient selection', { error: error.message });
      setError('Failed to select patient');
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    // Debug log the media being saved
    console.log('=== handleSave called ===');
    console.log('Media to save:', JSON.stringify(media, null, 2));
    console.log('Subject display:', get(media, 'subject.display'));
    console.log('Subject reference:', get(media, 'subject.reference'));

    try {
      if (id && id !== 'new') {
        // Update existing media
        await Meteor.callAsync('updateMedia', id, media);
        console.log('Media updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new media
        const newId = await Meteor.callAsync('createMedia', media);
        console.log('Media created with ID:', newId);
        // Navigate back to medias list for new medias
        navigate('/medias');
      }
    } catch (err) {
      console.error('Error saving media:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    // In test environments, window.confirm might not work with Nightwatch's acceptAlert
    // So we add a small delay to ensure the alert is properly created
    const confirmed = window.confirm('Are you sure you want to delete this media?');

    if (confirmed) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeMedia', id);
        navigate('/medias');
      } catch (err) {
        console.error('Error deleting media:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }

  // Handle navigation
  function handleCancel() {
    if (id && id !== 'new') {
      // If editing existing media, just exit edit mode
      setIsEditing(false);
      // Reload the original data
      if (isSubscriptionReady) {
        const originalMedia = Medias.findOne({_id: id});
        if (originalMedia) {
          setMedia(originalMedia);
        }
      }
    } else {
      // If creating new media, navigate back to list
      navigate('/medias');
    }
  }

  // Build the header title
  let headerTitle = 'New Media';
  if (isExistingMedia) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{mediaId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new media */}
        {!isNewMedia && (
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

        {/* Form toggle -- hidden for new media (always form) */}
        {!isNewMedia && (
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

        {/* Lock / Unlock toggle -- only for existing media */}
        {!isNewMedia && (
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

        {/* Delete -- only for existing media, gated on edit mode */}
        {!isNewMedia && (
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
        <MediaFormView
          resource={media}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveMediaButton"
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
      <MediaPreview
        resource={media}
        resourceId={mediaId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='mediaDetailPage' maxWidth="md" sx={{ py: 4 }}>
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

      <PatientSearchDialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default MediaDetail;
