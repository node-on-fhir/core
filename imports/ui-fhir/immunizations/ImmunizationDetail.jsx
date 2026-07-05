// imports/ui-fhir/immunizations/ImmunizationDetail.jsx

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

import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ImmunizationFormView from './ImmunizationFormView';
import ImmunizationPreview from './ImmunizationPreview';

function ImmunizationDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var immunizationId = id;

  // Subscribe to immunizations data
  var isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    var autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    var handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.Immunizations', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('immunizations.all');
    }
    return handle.ready();
  }, []);

  // Get selected patient and current user from session/tracker
  var selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  var currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [immunization, setImmunization] = useState({
    resourceType: 'Immunization',
    status: 'completed',
    vaccineCode: {
      coding: [{
        system: 'http://hl7.org/fhir/sid/cvx',
        code: '',
        display: ''
      }],
      text: ''
    },
    patient: {
      reference: '',
      display: ''
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm'),
    primarySource: true,
    lotNumber: '',
    expirationDate: '',
    site: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActSite',
        code: '',
        display: ''
      }],
      text: ''
    },
    route: {
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/v3-RouteOfAdministration',
        code: '',
        display: ''
      }],
      text: ''
    },
    doseQuantity: {
      value: null,
      unit: '',
      system: 'http://unitsofmeasure.org',
      code: ''
    },
    performer: [{
      actor: {
        reference: '',
        display: ''
      }
    }],
    manufacturer: {
      reference: '',
      display: ''
    },
    note: [{
      text: ''
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setImmunization(function(prev) {
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
  const [searchParams, setSearchParams] = useSearchParams();
  var viewMode = searchParams.get('view') || 'form';

  var isNewRecord = !immunizationId || immunizationId === 'new';
  var isExistingRecord = immunizationId && immunizationId !== 'new';

  // Set patient name and performer on component mount for new immunizations
  useEffect(function() {
    if (!immunizationId || immunizationId === 'new') {
      // Enable editing for new immunizations
      setIsEditing(true);

      // For new immunizations, set the patient name
      var patientName = '';
      var patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim();
        patientReference = 'Patient/' + get(selectedPatient, 'id', get(selectedPatient, '_id', ''));
      }

      // Set performer to current user
      var performerName = '';
      var performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                       (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                       get(currentUser, 'username', '');
        performerReference = 'Practitioner/' + get(currentUser, '_id', '');
      }

      setImmunization(function(prev) {
        return Object.assign({}, prev, {
          patient: {
            reference: patientReference,
            display: patientName
          },
          performer: [{
            actor: {
              reference: performerReference,
              display: performerName
            }
          }]
        });
      });
    } else {
      // Viewing existing immunization - start in read-only mode
      setIsEditing(false);
    }
  }, [immunizationId, selectedPatient, currentUser]);

  // Load immunization if editing
  useEffect(function() {
    if (immunizationId && immunizationId !== 'new') {
      // Load immediately if data exists
      var existingImmunization = Immunizations.findOne({ _id: immunizationId });

      if (existingImmunization) {
        setImmunization(existingImmunization);
        setIsEditing(false);
      } else {
        // Fallback: try finding by id field
        var immunizationById = Immunizations.findOne({ id: immunizationId });
        if (immunizationById) {
          setImmunization(immunizationById);
          setIsEditing(false);
        }
      }
    }
  }, [immunizationId]);

  // Handle field changes
  function handleChange(path, value) {
    var updatedImmunization = Object.assign({}, immunization);
    set(updatedImmunization, path, value);

    // Special handling for patient display to ensure reference is set
    if (path === 'patient.display' && selectedPatient) {
      var patientReference = 'Patient/' + get(selectedPatient, 'id', get(selectedPatient, '_id', ''));
      set(updatedImmunization, 'patient.reference', patientReference);
    }

    setImmunization(updatedImmunization);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedImmunization);
    }
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      var dataToSave = {
        resourceType: 'Immunization',
        status: get(immunization, 'status', 'completed'),
        vaccineCode: get(immunization, 'vaccineCode'),
        patient: get(immunization, 'patient'),
        occurrenceDateTime: get(immunization, 'occurrenceDateTime'),
        primarySource: get(immunization, 'primarySource', true),
        lotNumber: get(immunization, 'lotNumber'),
        expirationDate: get(immunization, 'expirationDate'),
        site: get(immunization, 'site'),
        route: get(immunization, 'route'),
        doseQuantity: get(immunization, 'doseQuantity'),
        performer: get(immunization, 'performer'),
        manufacturer: get(immunization, 'manufacturer'),
        note: get(immunization, 'note')
      };

      console.log('ImmunizationDetail - Saving immunization...');

      // Ensure patient reference is set if we have a selected patient
      if ((!dataToSave.patient || !dataToSave.patient.reference || dataToSave.patient.reference === '') && selectedPatient) {
        var patientReference = 'Patient/' + get(selectedPatient, 'id', get(selectedPatient, '_id', ''));
        dataToSave.patient = {
          reference: patientReference,
          display: get(dataToSave, 'patient.display', '') ||
                  get(selectedPatient, 'name[0].text', '') ||
                  (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim()
        };
      }

      // Ensure we have proper CodeableConcepts
      if (dataToSave.vaccineCode && !dataToSave.vaccineCode.coding) {
        dataToSave.vaccineCode = {
          coding: [{
            system: 'http://hl7.org/fhir/sid/cvx',
            code: dataToSave.vaccineCode,
            display: dataToSave.vaccineCode
          }],
          text: dataToSave.vaccineCode
        };
      }

      if (immunizationId && immunizationId !== 'new') {
        // Update existing immunization
        await Meteor.callAsync('updateImmunization', immunizationId, dataToSave);
        console.log('Immunization updated successfully');
        setIsEditing(false);
      } else {
        // Create new immunization
        var newId = await Meteor.callAsync('createImmunization', dataToSave);
        console.log('Immunization created with ID:', newId);
        navigate('/immunizations');
      }
    } catch (err) {
      console.error('Error saving immunization:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!immunizationId || immunizationId === 'new') return;

    if (window.confirm('Are you sure you want to delete this immunization record?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeImmunization', immunizationId);
        console.log('Immunization deleted successfully');
        navigate('/immunizations');
      } catch (err) {
        console.error('Error deleting immunization:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancelButton() {
    if (immunizationId && immunizationId !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      setError(null);
      var existingImmunization = Immunizations.findOne({ _id: immunizationId });
      if (existingImmunization) {
        setImmunization(existingImmunization);
      }
    } else {
      // For new immunizations, go back
      navigate('/immunizations');
    }
  }

  // Build the header title
  var headerTitle = 'New Immunization';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{immunizationId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {!isNewRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new records (always form) */}
        {!isNewRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing records */}
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

        {/* Delete -- only for existing records, gated on edit mode */}
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
  function renderFormView() {
    return (
      <>
        <ImmunizationFormView
          resource={immunization}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveImmunizationButton"
              onClick={handleSaveButton}
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
      <ImmunizationPreview
        resource={immunization}
        resourceId={immunizationId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="immunizationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ImmunizationDetail;
