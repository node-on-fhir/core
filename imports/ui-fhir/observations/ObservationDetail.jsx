// /imports/ui-fhir/observations/ObservationDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Grid,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Divider,
  Dialog
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';

import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ObservationFormView from './ObservationFormView';
import ObservationPreview from './ObservationPreview';

//===========================================================================
// STATUS OPTIONS

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'info',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

const categoryOptions = [
  { code: 'vital-signs', display: 'Vital Signs' },
  { code: 'laboratory', display: 'Laboratory' },
  { code: 'imaging', display: 'Imaging' },
  { code: 'procedure', display: 'Procedure' },
  { code: 'survey', display: 'Survey' },
  { code: 'exam', display: 'Exam' },
  { code: 'therapy', display: 'Therapy' },
  { code: 'activity', display: 'Activity' }
];

//===========================================================================
// COMPONENT

function ObservationDetail(props) {
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
  const [observation, setObservation] = useState({
    resourceType: 'Observation',
    status: 'preliminary',
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/observation-category",
        code: "vital-signs",
        display: "Vital Signs"
      }],
      text: "Vital Signs"
    }],
    code: {
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    effectiveDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    issued: moment().format('YYYY-MM-DDTHH:mm:ss'),
    performer: [{
      reference: "",
      display: ""
    }],
    valueQuantity: {
      value: "",
      unit: "",
      system: "http://unitsofmeasure.org",
      code: ""
    },
    valueString: "",
    device: {
      reference: "",
      display: ""
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
      setObservation(function(prev) {
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

  // Subscribe to observations for direct URL navigation
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Observations', Session.get('selectedPatientId'), {}).ready();
    } else {
      return Meteor.subscribe('observations.all').ready();
    }
  }, []);

  // Set patient name and performer on component mount for new observations
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

      let performerName = '';
      let performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                       `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                       get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setObservation(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          performer: [{
            reference: performerReference,
            display: performerName
          }]
        };
      });
    }
  }, [id, selectedPatient, currentUser]);

  // Load observation when subscription is ready
  useEffect(function() {
    if (isExistingRecord && isSubscriptionReady) {
      const existingObservation = Observations.findOne({ _id: id });
      if (existingObservation) {
        setObservation(existingObservation);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('observations.get', id);
            if (result) {
              setObservation(result);
              setIsEditing(false);
            }
          } catch (err) {
            console.error('Error loading observation:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes using cloneDeep for nested FHIR structures
  function handleChange(path, value) {
    const updatedObservation = cloneDeep(observation);
    set(updatedObservation, path, value);
    setObservation(updatedObservation);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedObservation);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingRecord) {
        await Meteor.callAsync('observations.update', id, observation);
        console.log('Observation updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('observations.create', observation);
        console.log('Observation created with ID:', newId);
        navigate('/observations');
      }
    } catch (err) {
      console.error('Error saving observation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this observation?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('observations.remove', id);
        console.log('Observation deleted successfully');
        navigate('/observations');
      } catch (err) {
        console.error('Error deleting observation:', err);
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
      const existingObservation = Observations.findOne({ _id: id });
      if (existingObservation) {
        setObservation(existingObservation);
      }
      setIsEditing(false);
    } else {
      navigate('/observations');
    }
  }

  // Determine current value type
  function getValueType() {
    if (get(observation, 'valueQuantity.value') !== null && get(observation, 'valueQuantity.value') !== undefined && get(observation, 'valueQuantity.value') !== '') return 'valueQuantity';
    if (get(observation, 'valueCodeableConcept.coding[0].code')) return 'valueCodeableConcept';
    if (get(observation, 'valueString')) return 'valueString';
    if (get(observation, 'valueBoolean') !== null && get(observation, 'valueBoolean') !== undefined) return 'valueBoolean';
    if (get(observation, 'valueInteger') !== null && get(observation, 'valueInteger') !== undefined) return 'valueInteger';
    if (get(observation, 'valueRange.low.value') || get(observation, 'valueRange.high.value')) return 'valueRange';
    if (get(observation, 'valueRatio.numerator.value') || get(observation, 'valueRatio.denominator.value')) return 'valueRatio';
    if (get(observation, 'valueSampledData')) return 'valueSampledData';
    if (get(observation, 'valueTime')) return 'valueTime';
    if (get(observation, 'valueDateTime')) return 'valueDateTime';
    if (get(observation, 'valuePeriod.start') || get(observation, 'valuePeriod.end')) return 'valuePeriod';
    if (get(observation, 'valueAttachment')) return 'valueAttachment';
    return 'valueQuantity';
  }

  const [valueType, setValueType] = useState(getValueType());

  // Clear all value fields
  function clearAllValues() {
    const updates = {
      'valueQuantity.value': '',
      'valueQuantity.unit': '',
      'valueQuantity.code': '',
      'valueCodeableConcept': null,
      'valueString': '',
      'valueBoolean': null,
      'valueInteger': '',
      'valueRange': null,
      'valueRatio': null,
      'valueSampledData': '',
      'valueTime': '',
      'valueDateTime': '',
      'valuePeriod': null,
      'valueAttachment': null
    };
    Object.entries(updates).forEach(function([key, value]) {
      handleChange(key, value);
    });
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
        {/* Preview toggle — hidden for new records */}
        {isExistingRecord && (
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

        {/* Form toggle — hidden for new records */}
        {isExistingRecord && (
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

        {/* Edit toggle — only for existing records */}
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

        {/* Delete — only for existing records */}
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
        <ObservationFormView
          resource={observation}
          form={{
            valueType: valueType,
            onValueTypeChange: setValueType,
            onClearAllValues: clearAllValues,
            showPatientInputs: props.showPatientInputs,
            showDeviceInputs: props.showDeviceInputs
          }}
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
              id="saveObservationButton"
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
      <ObservationPreview
        resource={observation}
        form={{}}
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
    <Container id="observationDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

ObservationDetail.propTypes = {
  showPatientInputs: PropTypes.bool,
  showDeviceInputs: PropTypes.bool
};

export default ObservationDetail;
