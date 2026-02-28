// /imports/ui-fhir/medicationAdministrations/MedicationAdministrationDetail.jsx

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

import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MedicationAdministrationFormView from './MedicationAdministrationFormView';
import MedicationAdministrationPreview from './MedicationAdministrationPreview';

//===========================================================================
// COMPONENT

function MedicationAdministrationDetail(props) {
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
  const [medicationAdministration, setMedicationAdministration] = useState({
    resourceType: "MedicationAdministration",
    status: "completed",
    subject: {
      reference: "",
      display: ""
    },
    effectiveDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    medicationCodeableConcept: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    dosage: {
      text: "",
      route: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      dose: {
        value: null,
        unit: "",
        system: "http://unitsofmeasure.org",
        code: ""
      }
    }
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMedicationAdministration(function(prev) {
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

  // Set patient name and performer on component mount for new administrations
  useEffect(function() {
    if (isNewRecord) {
      // Enable editing for new administrations
      setIsEditing(true);

      // For new administrations, set the patient name
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id for patient reference (not MongoDB _id)
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        // You might need to look up the Patient resource for the current user
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      // Set performer to current user
      let performerName = '';
      let performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setMedicationAdministration(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          performer: [{
            actor: {
              reference: performerReference,
              display: performerName
            }
          }]
        };
      });
    }
  }, [id, selectedPatient, currentUser]);

  // Load medication administration if editing
  useEffect(function() {
    async function loadMedicationAdministration() {
      if (isExistingRecord) {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('medicationAdministrations.get', id);
          if (result) {
            setMedicationAdministration(result);
            setIsEditing(false);
          }
        } catch (err) {
          console.error('Error loading medication administration:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadMedicationAdministration();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedicationAdministration = cloneDeep(medicationAdministration);
    set(updatedMedicationAdministration, path, value);
    setMedicationAdministration(updatedMedicationAdministration);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMedicationAdministration);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        // Update existing medication administration
        await Meteor.callAsync('medicationAdministrations.update', id, medicationAdministration);
        console.log('Medication administration updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication administration
        const newId = await Meteor.callAsync('medicationAdministrations.create', medicationAdministration);
        console.log('Medication administration created with ID:', newId);
        // Navigate back to medication administrations list for new administrations
        navigate('/medication-administrations');
      }
    } catch (err) {
      console.error('Error saving medication administration:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this medication administration?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medicationAdministrations.remove', id);
        console.log('Medication administration deleted successfully');
        navigate('/medication-administrations');
      } catch (err) {
        console.error('Error deleting medication administration:', err);
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
      async function reloadMedicationAdministration() {
        try {
          const result = await Meteor.callAsync('medicationAdministrations.get', id);
          if (result) {
            setMedicationAdministration(result);
          }
        } catch (err) {
          console.error('Error reloading medication administration:', err);
        }
      }
      reloadMedicationAdministration();
      setIsEditing(false);
    } else {
      navigate('/medication-administrations');
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
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete -- only for existing records, gated on edit mode */}
        {isExistingRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <MedicationAdministrationFormView
          resource={medicationAdministration}
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
              id="saveMedicationAdministrationButton"
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
      <MedicationAdministrationPreview
        resource={medicationAdministration}
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
    <Container id="medicationAdministrationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default MedicationAdministrationDetail;
