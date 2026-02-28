// /imports/ui-fhir/allergyIntolerances/AllergyIntoleranceDetail.jsx

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
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import AllergyIntoleranceFormView from './AllergyIntoleranceFormView';
import AllergyIntolerancePreview from './AllergyIntolerancePreview';

function AllergyIntoleranceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to allergy intolerances and track subscription status
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.AllergyIntolerances', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('allergyintolerances.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [allergyIntolerance, setAllergyIntolerance] = useState({
    resourceType: "AllergyIntolerance",
    clinicalStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
        code: "active",
        display: "Active"
      }]
    },
    verificationStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
        code: "unconfirmed",
        display: "Unconfirmed"
      }]
    },
    type: "allergy",
    category: ["food"],
    criticality: "low",
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    patient: {
      reference: "",
      display: ""
    },
    onsetDateTime: moment().format('YYYY-MM-DD'),
    recorder: {
      reference: "",
      display: ""
    },
    asserter: {
      reference: "",
      display: ""
    },
    reaction: [{
      manifestation: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      severity: "mild"
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
      setAllergyIntolerance(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(allergyIntolerance);
    }
  }, [allergyIntolerance]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';

  // Set patient name and recorder on component mount for new allergy intolerances ONLY
  useEffect(function() {
    // IMPORTANT: Only run this for NEW records, not existing ones
    if (!id || id === 'new') {
      // Enable editing for new allergy intolerances
      setIsEditing(true);

      // For new allergy intolerances, set the patient name
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id for reference, NOT MongoDB _id
        const fhirId = get(selectedPatient, 'id');
        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
        } else {
          // Fallback to _id if no FHIR id
          patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
        }
      } else if (currentUser) {
        // Only use current user as fallback if they have a patient record
        const userPatientId = get(currentUser, 'profile.patientId');
        if (userPatientId) {
          const userPatient = Patients.findOne({_id: userPatientId});
          if (userPatient) {
            patientName = get(userPatient, 'name[0].text', '') ||
                         `${get(userPatient, 'name[0].given[0]', '')} ${get(userPatient, 'name[0].family', '')}`.trim();
            patientReference = `Patient/${get(userPatient, 'id', userPatientId)}`;
          }
        }
      }

      // Set recorder to current user
      let recorderName = '';
      let recorderReference = '';

      if (currentUser) {
        recorderName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        recorderReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setAllergyIntolerance(prev => ({
        ...prev,
        patient: {
          reference: patientReference,
          display: patientName
        },
        recorder: {
          reference: recorderReference,
          display: recorderName
        }
      }));
    }
    // Note: Don't set isEditing(false) here for existing records
    // Let the second useEffect handle loading existing records
  }, [id, selectedPatient, currentUser]);

  // Load allergy intolerance if viewing existing record
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load even if subscription says not ready - data might be there from page subscription
      const existingAllergy = AllergyIntolerances.findOne({_id: id});

      if (existingAllergy) {
        setAllergyIntolerance(existingAllergy);
        setIsEditing(false);
      } else {
        // Try finding by id field instead
        const allergyById = AllergyIntolerances.findOne({id: id});
        if (allergyById) {
          setAllergyIntolerance(allergyById);
          setIsEditing(false);
        } else {
          // Set to read-only mode anyway
          setIsEditing(false);
        }
      }
    }
  }, [id]);

  // Handle input changes
  const handleChange = (path, value) => {
    pendingUpdate.current = true;
    setAllergyIntolerance(prev => {
      const updated = {...prev};
      set(updated, path, value);
      return updated;
    });
  };

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    try {
      // Ensure patient reference is set from session if not already set
      let patientRef = get(allergyIntolerance, 'patient');
      if (!patientRef || !patientRef.reference) {
        const sessionPatient = Session.get('selectedPatient');
        if (sessionPatient) {
          // Use FHIR id for reference, NOT MongoDB _id
          const fhirId = get(sessionPatient, 'id');
          const patientIdToUse = fhirId || get(sessionPatient, '_id', '');

          patientRef = {
            reference: `Patient/${patientIdToUse}`,
            display: get(sessionPatient, 'name[0].text', '') ||
                    `${get(sessionPatient, 'name[0].given[0]', '')} ${get(sessionPatient, 'name[0].family', '')}`.trim()
          };
        }
      }

      // Debug patient reference
      console.log('Patient reference being saved:', patientRef);
      console.log('Session patient:', Session.get('selectedPatient'));
      console.log('Session patient ID:', Session.get('selectedPatientId'));

      let dataToSave = {
        resourceType: "AllergyIntolerance",
        clinicalStatus: get(allergyIntolerance, 'clinicalStatus'),
        verificationStatus: get(allergyIntolerance, 'verificationStatus'),
        type: get(allergyIntolerance, 'type'),
        category: get(allergyIntolerance, 'category'),
        criticality: get(allergyIntolerance, 'criticality'),
        code: get(allergyIntolerance, 'code'),
        patient: patientRef,
        onsetDateTime: get(allergyIntolerance, 'onsetDateTime'),
        recorder: get(allergyIntolerance, 'recorder'),
        asserter: get(allergyIntolerance, 'asserter'),
        reaction: get(allergyIntolerance, 'reaction'),
        note: get(allergyIntolerance, 'note')
      };

      console.log('Saving allergy intolerance with data:', JSON.stringify(dataToSave, null, 2));

      if(id && id !== 'new'){
        await Meteor.callAsync('updateAllergyIntolerance', id, dataToSave);
        setIsEditing(false); // Stay on page, switch to read mode
      } else {
        const newId = await Meteor.callAsync('createAllergyIntolerance', dataToSave);
        navigate('/allergy-intolerances'); // Navigate to list after create
      }
    } catch(error) {
      console.error('Error saving allergy intolerance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this allergy intolerance?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeAllergyIntolerance', id);
        navigate('/allergy-intolerances');
      } catch(error) {
        console.error('Error deleting allergy intolerance:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel/back
  function handleCancelButton() {
    if (isEditing && id && id !== 'new') {
      // Cancel editing, revert to read-only mode
      const existingAllergy = AllergyIntolerances.findOne({_id: id});
      if (existingAllergy) {
        setAllergyIntolerance(existingAllergy);
      }
      setIsEditing(false);
    } else {
      // Go back to list
      navigate('/allergy-intolerances');
    }
  }

  // Handle patient search
  function handleSearchUser() {
    console.log('Patient search not yet implemented');
    // TODO: Implement patient search dialog
  }

  // Build the header title
  let headerTitle = 'New Allergy/Intolerance';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
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
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle - only for existing records */}
        {!isNewRecord && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - only for existing records, gated on edit mode */}
        {!isNewRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDeleteButton}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <AllergyIntoleranceFormView
          resource={allergyIntolerance}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveAllergyIntoleranceButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Save')}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <AllergyIntolerancePreview
        resource={allergyIntolerance}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="allergyIntoleranceDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default AllergyIntoleranceDetail;
