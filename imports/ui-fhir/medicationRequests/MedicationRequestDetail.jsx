// /imports/ui-fhir/medicationRequests/MedicationRequestDetail.jsx

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
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MedicationRequestFormView from './MedicationRequestFormView';
import MedicationRequestPreview from './MedicationRequestPreview';

//===========================================================================
// COMPONENT

function MedicationRequestDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [medicationRequest, setMedicationRequest] = useState({
    resourceType: "MedicationRequest",
    status: "active",
    intent: "order",
    subject: {
      reference: "",
      display: ""
    },
    authoredOn: moment().format('YYYY-MM-DD'),
    requester: {
      reference: "",
      display: ""
    },
    medicationCodeableConcept: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    priority: "routine",
    dosageInstruction: [{
      text: "",
      timing: {
        repeat: {
          frequency: 1,
          period: 1,
          periodUnit: "d"
        }
      },
      route: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      doseAndRate: [{
        doseQuantity: {
          value: null,
          unit: "",
          system: "http://unitsofmeasure.org",
          code: ""
        }
      }]
    }],
    dispenseRequest: {
      validityPeriod: {
        start: moment().format('YYYY-MM-DD'),
        end: moment().add(30, 'days').format('YYYY-MM-DD')
      },
      quantity: {
        value: null,
        unit: ""
      }
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMedicationRequest(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || isNewRecord);

  // Set patient name and requester on component mount for new requests
  useEffect(function() {
    if (isNewRecord) {
      // Enable editing for new requests
      setIsEditing(true);

      // For new requests, set the patient name
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, '_id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      // Set requester to current user
      let requesterName = '';
      let requesterReference = '';

      if (currentUser) {
        requesterName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        requesterReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setMedicationRequest(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          requester: {
            reference: requesterReference,
            display: requesterName
          }
        };
      });
    }
  }, [id, selectedPatient, currentUser]);

  // Load medication request if editing
  useEffect(function() {
    async function loadMedicationRequest() {
      if (isExistingRecord) {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('medicationRequests.get', id);
          if (result) {
            setMedicationRequest(result);
            setIsEditing(false);
          }
        } catch (err) {
          console.error('Error loading medication request:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadMedicationRequest();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedicationRequest = cloneDeep(medicationRequest);
    set(updatedMedicationRequest, path, value);
    setMedicationRequest(updatedMedicationRequest);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMedicationRequest);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        // Update existing medication request
        await Meteor.callAsync('medicationRequests.update', id, medicationRequest);
        console.log('Medication request updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication request
        const newId = await Meteor.callAsync('medicationRequests.create', medicationRequest);
        console.log('Medication request created with ID:', newId);
        // Navigate back to medication requests list for new requests
        navigate('/medication-requests');
      }
    } catch (err) {
      console.error('Error saving medication request:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this medication request?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medicationRequests.remove', id);
        console.log('Medication request deleted successfully');
        navigate('/medication-requests');
      } catch (err) {
        console.error('Error deleting medication request:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingRecord) {
      // Reload original data
      async function reloadMedicationRequest() {
        try {
          const result = await Meteor.callAsync('medicationRequests.get', id);
          if (result) {
            setMedicationRequest(result);
          }
        } catch (err) {
          console.error('Error reloading medication request:', err);
        }
      }
      reloadMedicationRequest();
      setIsEditing(false);
    } else {
      navigate('/medication-requests');
    }
  }

  // Build the header title
  let headerTitle = 'New Record';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing records */}
        {isExistingRecord && (
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

        {/* Delete -- only for existing records, gated on edit mode */}
        {isExistingRecord && (
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

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <MedicationRequestFormView
          resource={medicationRequest}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* Inline Save/Cancel bar */}
        {isEditing && !isEmbedded && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveMedicationRequestButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Preview view with formatted read-only display
  function renderPreviewView() {
    return (
      <MedicationRequestPreview
        resource={medicationRequest}
        resourceId={id}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="medicationRequestDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
    </Container>
  );
}

export default MedicationRequestDetail;
