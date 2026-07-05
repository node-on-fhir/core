// /imports/ui-fhir/medications/MedicationDetail.jsx

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

import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MedicationFormView from './MedicationFormView';
import MedicationPreview from './MedicationPreview';

function MedicationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to medication data using ID-based query (optimized)
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      const handle = Meteor.subscribe('autopublish.Medications', {}, {});
      return handle.ready();
    }
    return true; // No subscription needed for new medications
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [medication, setMedication] = useState({
    resourceType: "Medication",
    code: {
      coding: [{
        system: "http://www.nlm.nih.gov/research/umls/rxnorm",
        code: "",
        display: ""
      }],
      text: ""
    },
    status: "active",
    manufacturer: {
      reference: "",
      display: ""
    },
    form: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    ingredient: [{
      itemCodeableConcept: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }]
      },
      strength: {
        numerator: {
          value: "",
          unit: ""
        }
      }
    }],
    batch: {
      lotNumber: "",
      expirationDate: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMedication(function(prev) {
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
  const [medicationId, setMedicationId] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewMedication = !id || id === 'new';
  const isExistingMedication = medicationId && medicationId !== 'new';

  // Set default values on component mount for new medications
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new medications
      setIsEditing(true);
    } else {
      // Viewing existing medication - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load medication when subscription is ready
  useEffect(function() {
    if (id && id !== 'new') {
      console.log('[MedicationDetail] Loading medication from collection');
      // Load from client collection (populated by subscription)
      const existingMedication = Medications.findOne({_id: id}) || Medications.findOne({id: id});

      if (existingMedication) {
        console.log('[MedicationDetail] Loaded medication:', {
          _id: existingMedication._id,
          codeText: get(existingMedication, 'code.text'),
          codeCode: get(existingMedication, 'code.coding[0].code'),
          manufacturer: get(existingMedication, 'manufacturer.display')
        });
        setMedication(existingMedication);
        setMedicationId(id);
        setIsEditing(false); // Start in view mode for existing medications
      } else {
        console.warn('[MedicationDetail] Medication not found in collection:', id);
        setError('Medication not found');
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedication = { ...medication };
    set(updatedMedication, path, value);
    setMedication(updatedMedication);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMedication);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    // Diagnostic logging
    console.log('[MedicationDetail] Saving medication:', {
      codeText: get(medication, 'code.text'),
      codeCode: get(medication, 'code.coding[0].code'),
      codeDisplay: get(medication, 'code.coding[0].display'),
      manufacturer: get(medication, 'manufacturer.display'),
      fullMedication: medication
    });

    try {
      if (id && id !== 'new') {
        // Update existing medication
        await Meteor.callAsync('medications.update', id, medication);
        console.log('Medication updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new medication
        const newId = await Meteor.callAsync('medications.create', medication);
        console.log('Medication created with ID:', newId);
        // Navigate back to medications list for new medications
        navigate('/medications');
      }
    } catch (err) {
      console.error('Error saving medication:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this medication?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medications.remove', id);
        console.log('Medication deleted successfully');
        navigate('/medications');
      } catch (err) {
        console.error('Error deleting medication:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (id && id !== 'new') {
      // Cancel editing and reload original data from collection
      setIsEditing(false);
      const existingMedication = Medications.findOne({_id: id});
      if (existingMedication) {
        setMedication(existingMedication);
      }
    } else {
      navigate('/medications');
    }
  }

  // Build the header title
  let headerTitle = 'New Medication';
  if (isExistingMedication) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{medicationId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new medications */}
        {!isNewMedication && (
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

        {/* Form toggle -- hidden for new medications (always form) */}
        {!isNewMedication && (
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

        {/* Lock / Unlock toggle -- only for existing medications */}
        {!isNewMedication && (
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

        {/* Delete -- only for existing medications, gated on edit mode */}
        {!isNewMedication && (
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
        <MedicationFormView
          resource={medication}
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
              id="saveMedicationButton"
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
      <MedicationPreview
        resource={medication}
        resourceId={medicationId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="medicationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
    </Container>
  );
}

export default MedicationDetail;
