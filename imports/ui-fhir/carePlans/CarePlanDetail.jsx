// /imports/ui-fhir/carePlans/CarePlanDetail.jsx

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

import CarePlanFormView from './CarePlanFormView';
import CarePlanPreview from './CarePlanPreview';

const log = (Meteor.Logger ? Meteor.Logger.for('CarePlanDetail') : console);

// Get the Patients collection
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

// Get the CarePlans collection from Meteor.Collections
let CarePlans;
Meteor.startup(function(){
  CarePlans = Meteor.Collections.CarePlans;
});

function CarePlanDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  // Subscribe to care plans and patients data
  const subscriptionReady = useTracker(() => {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    const carePlansHandle = Meteor.subscribe('careplans.all');
    const patientsHandle = Meteor.subscribe('patients.search', {});
    return carePlansHandle.ready() && patientsHandle.ready();
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
  const [carePlan, setCarePlan] = useState({
    resourceType: "CarePlan",
    status: "active",
    intent: "plan",
    subject: {
      reference: "",
      display: ""
    },
    author: [],
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    title: "",
    description: "",
    category: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "734163000",
        display: "Care plan"
      }],
      text: "Care plan"
    }],
    note: [{
      text: ""
    }],
    activity: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setCarePlan(function(prev) {
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

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  // Debug effect to monitor care plan changes
  useEffect(() => {
    console.log('CarePlan state changed:', carePlan);
  }, [carePlan]);

  // Set initial state and author on component mount
  useEffect(function() {
    console.log('=== Initial setup effect running ===');

    if (!id || id === 'new') {
      // Enable editing for new care plans
      setIsEditing(true);

      // For new care plans, set patient from session if available
      let patientName = '';
      let patientReference = '';

      if (selectedPatient && selectedPatientId) {
        if (typeof selectedPatient.name === 'string') {
          patientName = selectedPatient.name;
        } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
          patientName = FhirUtilities.pluckName(selectedPatient);
        }
        patientReference = `Patient/${get(selectedPatient, 'id')}`;
      }

      // Set author to current user
      let authorName = '';
      let authorReference = '';

      if (currentUser) {
        const profileNameText = get(currentUser, 'profile.name.text', '');
        const profileNameParts = `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim();
        const username = get(currentUser, 'username', '');

        authorName = profileNameText || profileNameParts || username;
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      } else {
        return;
      }

      setCarePlan(prev => {
        const hasExistingAuthor = prev.author && prev.author.length > 0 && prev.author[0].display;

        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          author: hasExistingAuthor ? prev.author : [{
            reference: authorReference,
            display: authorName
          }]
        };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load care plan if editing
  useEffect(function() {
    if (id && id !== 'new' && CarePlans) {
      const result = CarePlans.findOne({_id: id});

      if (result) {
        console.log('CarePlanDetail: Loaded care plan:', result);

        // Handle legacy care plans where author might be an object instead of an array
        if (result.author && !Array.isArray(result.author)) {
          result.author = [result.author];
        }

        setCarePlan(result);
        setError(null);
      } else {
        const carePlanById = CarePlans.findOne({id: id});
        if (carePlanById) {
          if (carePlanById.author && !Array.isArray(carePlanById.author)) {
            carePlanById.author = [carePlanById.author];
          }

          setCarePlan(carePlanById);
          setError(null);
        }
      }
    }
  }, [id]);

  // Handle field changes
  function handleAddActivity() {
    const newActivity = {
      detail: {
        kind: "Task",
        code: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }],
          text: ""
        },
        status: "not-started",
        description: "",
        reasonReference: [{
          reference: "",
          display: ""
        }],
        location: {
          reference: "",
          display: ""
        }
      }
    };

    setCarePlan(prev => ({
      ...prev,
      activity: [...(prev.activity || []), newActivity]
    }));
  }

  function handleRemoveActivity(index) {
    setCarePlan(prev => ({
      ...prev,
      activity: prev.activity.filter((_, i) => i !== index)
    }));
  }

  function handleActivityChange(index, path, value) {
    setCarePlan(prev => {
      const updatedActivities = [...prev.activity];
      set(updatedActivities[index], path, value);
      return {
        ...prev,
        activity: updatedActivities
      };
    });
  }

  function handleChange(path, value) {
    pendingUpdate.current = true;
    setCarePlan(prevCarePlan => {
      const updatedCarePlan = JSON.parse(JSON.stringify(prevCarePlan)); // Deep clone
      set(updatedCarePlan, path, value);
      return updatedCarePlan;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(carePlan);
    }
  }, [carePlan]);


  // Handle search for users/patients
  function handleSearchUser() {
    console.log('Opening patient search dialog...'); // phi-audit: ok
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    try {
      if (patient) {
        let patientName = '';

        if (typeof patient.name === 'string') {
          patientName = patient.name;
        } else if (patient.name && Array.isArray(patient.name)) {
          patientName = FhirUtilities.pluckName(patient);
        } else {
          patientName = patient.id || patientId;
        }

        const fhirId = get(patient, 'id');
        setCarePlan(prevCarePlan => {
          const updated = JSON.parse(JSON.stringify(prevCarePlan));
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          return updated;
        });
      } else {
        if (Patients) {
          const foundPatient = Patients.findOne({_id: patientId});
          if (foundPatient) {
            const patientName = FhirUtilities.pluckName(foundPatient);
            const fhirId = get(foundPatient, 'id');
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
      log.error('Error handling patient selection', { error: err.message });
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        await Meteor.rpc('carePlans.update', { carePlanId: id, carePlanData: carePlan });
        console.log('Care plan updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('carePlans.create', carePlan);
        console.log('Care plan created with ID:', newId);
        navigate('/careplans');
      }
    } catch (err) {
      console.error('Error saving care plan:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingRecord) return;

    if (window.confirm('Are you sure you want to delete this care plan?')) {
      setLoading(true);
      try {
        await Meteor.rpc('carePlans.remove', { carePlanId: id });
        console.log('Care plan deleted successfully');
        navigate('/careplans');
      } catch (err) {
        console.error('Error deleting care plan:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingRecord) {
      setIsEditing(false);
      setError(null);
      if (CarePlans) {
        const original = CarePlans.findOne({_id: id});
        if (original) {
          setCarePlan(original);
        }
      }
    } else {
      navigate('/careplans');
    }
  }

  // Build header title
  var headerTitle = 'New Care Plan';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
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

        {/* Form toggle */}
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

        {/* Lock / Unlock toggle */}
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

        {/* Delete */}
        {!isNewRecord && (
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
        <CarePlanFormView
          resource={carePlan}
          form={carePlan}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
          onActivityChange={handleActivityChange}
          onAddActivity={handleAddActivity}
          onRemoveActivity={handleRemoveActivity}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveCarePlanButton"
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
    return <CarePlanPreview resource={carePlan} form={carePlan} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="carePlanDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
          defaultSearchTerm={get(carePlan, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default CarePlanDetail;
