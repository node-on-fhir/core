// /imports/ui-fhir/medicationStatements/MedicationStatementDetail.jsx

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

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MedicationStatementFormView from './MedicationStatementFormView';
import MedicationStatementPreview from './MedicationStatementPreview';

//===========================================================================
// COMPONENT

function MedicationStatementDetail(props) {
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
  const [medicationStatement, setMedicationStatement] = useState({
    resourceType: "MedicationStatement",
    status: "active",
    category: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/medication-statement-category",
        code: "inpatient",
        display: "Inpatient"
      }]
    },
    subject: {
      reference: "",
      display: ""
    },
    effectiveDateTime: null,
    dateAsserted: null,
    informationSource: {
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
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    dosage: [{
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
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMedicationStatement(function(prev) {
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

  // Set patient name and information source on component mount for new statements
  useEffect(function() {
    if (isNewRecord) {
      setIsEditing(true);

      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', get(selectedPatient, '_id', ''))}`;
      } else if (currentUser) {
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      let informationSourceName = '';
      let informationSourceReference = '';

      if (currentUser) {
        informationSourceName = get(currentUser, 'profile.name.text', '') ||
                               `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                               get(currentUser, 'username', '');
        informationSourceReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setMedicationStatement(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          informationSource: {
            reference: informationSourceReference,
            display: informationSourceName
          },
          dateAsserted: moment().format('YYYY-MM-DD')
        };
      });
    }
  }, [id, selectedPatient, currentUser]);

  // Load medication statement if editing existing
  useEffect(function() {
    async function loadMedicationStatement() {
      if (isExistingRecord) {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('medicationStatements.get', id);
          if (result) {
            setMedicationStatement(result);
            setIsEditing(false);
          }
        } catch (err) {
          console.error('Error loading medication statement:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadMedicationStatement();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMedicationStatement = cloneDeep(medicationStatement);
    set(updatedMedicationStatement, path, value);
    setMedicationStatement(updatedMedicationStatement);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMedicationStatement);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        await Meteor.callAsync('medicationStatements.update', id, medicationStatement);
        console.log('Medication statement updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('medicationStatements.create', medicationStatement);
        console.log('Medication statement created with ID:', newId);
        navigate('/medication-statements');
      }
    } catch (err) {
      console.error('Error saving medication statement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this medication statement?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('medicationStatements.remove', id);
        console.log('Medication statement deleted successfully');
        navigate('/medication-statements');
      } catch (err) {
        console.error('Error deleting medication statement:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingRecord) {
      async function reloadMedicationStatement() {
        try {
          const result = await Meteor.callAsync('medicationStatements.get', id);
          if (result) {
            setMedicationStatement(result);
          }
        } catch (err) {
          console.error('Error reloading medication statement:', err);
        }
      }
      reloadMedicationStatement();
      setIsEditing(false);
    } else {
      navigate('/medication-statements');
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
        <MedicationStatementFormView
          resource={medicationStatement}
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
              id="saveMedicationStatementButton"
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
      <MedicationStatementPreview
        resource={medicationStatement}
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
    <Container id="medicationStatementDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default MedicationStatementDetail;
