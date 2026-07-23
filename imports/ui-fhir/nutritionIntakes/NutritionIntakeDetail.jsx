// /imports/ui-fhir/nutritionIntakes/NutritionIntakeDetail.jsx

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

import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import NutritionIntakeFormView from './NutritionIntakeFormView';
import NutritionIntakePreview from './NutritionIntakePreview';

function NutritionIntakeDetail(props) {
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

  // Subscribe to nutrition intakes
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.NutritionIntakes', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('nutritionIntakes.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R5 structure for NutritionIntake
  const [nutritionIntake, setNutritionIntake] = useState({
    resourceType: "NutritionIntake",
    status: "completed",
    subject: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    },
    occurrenceDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    recorded: moment().format('YYYY-MM-DDTHH:mm:ss'),
    reportedBoolean: true,
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    consumedItem: [{
      type: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/diet",
          code: "food",
          display: "Food"
        }],
        text: "Food"
      },
      nutritionProduct: {
        concept: {
          coding: [{
            system: "http://snomed.info/sct",
            code: "",
            display: ""
          }],
          text: ""
        }
      },
      amount: {
        value: null,
        unit: "serving",
        system: "http://unitsofmeasure.org",
        code: "{serving}"
      },
      notConsumed: false,
      notConsumedReason: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }
    }],
    ingredientLabel: [{
      nutrient: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      },
      amount: {
        value: null,
        unit: "g",
        system: "http://unitsofmeasure.org",
        code: "g"
      }
    }],
    performer: [{
      actor: {
        reference: "",
        display: ""
      }
    }],
    location: {
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
      setNutritionIntake(function(prev) {
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
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';

  // Set patient name on component mount for new nutrition intakes
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new nutrition intakes
      setIsEditing(true);

      // For new nutrition intakes, set the patient name
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        // Prefer selected patient
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        patientReference = `Patient/${get(selectedPatient, 'id', '')}`;
      } else if (currentUser) {
        // Fall back to current user
        patientName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        patientReference = `Patient/${get(currentUser, 'profile.patientId', '')}`;
      }

      // Set performer to current user
      let performerName = '';
      let performerReference = '';

      if (currentUser) {
        performerName = get(currentUser, 'profile.name.text', '') ||
                     `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                     get(currentUser, 'username', '');
        performerReference = `Practitioner/${get(currentUser, 'id', get(currentUser, '_id', ''))}`;
      }

      setNutritionIntake(function(prev) {
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
    } else {
      // Viewing existing nutrition intake - start in read-only mode
      setIsEditing(false);
    }
  }, [id]);

  // Load nutrition intake if editing
  useEffect(function() {
    async function loadNutritionIntake() {
      if (id && id !== 'new' && isSubscriptionReady) {
        setLoading(true);
        try {
          // First try to find in local collection
          const existingIntake = NutritionIntakes.findOne({_id: id});
          if (existingIntake) {
            setNutritionIntake(existingIntake);
          } else {
            // Fall back to method call
            const result = await Meteor.rpc('nutritionIntakes.get', { nutritionIntakeId: id });
            if (result) {
              setNutritionIntake(result);
            }
          }
        } catch (err) {
          console.error('Error loading nutrition intake:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadNutritionIntake();
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedNutritionIntake = { ...nutritionIntake };
    set(updatedNutritionIntake, path, value);
    setNutritionIntake(updatedNutritionIntake);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedNutritionIntake);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (id && id !== 'new') {
        // Update existing nutrition intake
        await Meteor.rpc('nutritionIntakes.update', { nutritionIntakeId: id, nutritionIntakeData: nutritionIntake });
        console.log('Nutrition intake updated successfully');

        // Reload the updated data from server
        const updatedIntake = await Meteor.rpc('nutritionIntakes.get', { nutritionIntakeId: id });
        if (updatedIntake) {
          setNutritionIntake(updatedIntake);
        }

        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new nutrition intake
        const newId = await Meteor.rpc('nutritionIntakes.create', nutritionIntake);
        console.log('Nutrition intake created with ID:', newId);
        // Navigate back to nutrition intakes list for new nutrition intakes
        navigate('/nutrition-intakes');
      }
    } catch (err) {
      console.error('Error saving nutrition intake:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this nutrition intake?')) {
      setLoading(true);
      try {
        await Meteor.rpc('nutritionIntakes.remove', { nutritionIntakeId: id });
        console.log('Nutrition intake deleted successfully');
        navigate('/nutrition-intakes');
      } catch (err) {
        console.error('Error deleting nutrition intake:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (id && id !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      setError(null);
      async function reloadNutritionIntake() {
        try {
          const result = await Meteor.rpc('nutritionIntakes.get', { nutritionIntakeId: id });
          if (result) {
            setNutritionIntake(result);
          }
        } catch (err) {
          console.error('Error reloading nutrition intake:', err);
        }
      }
      reloadNutritionIntake();
    } else {
      navigate('/nutrition-intakes');
    }
  }

  // Build the header title
  var headerTitle = 'New Nutrition Intake';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
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
              id="editNutritionIntakeButton"
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
              id="deleteNutritionIntakeButton"
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
        <NutritionIntakeFormView
          resource={nutritionIntake}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              id="saveNutritionIntakeButton"
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
      <NutritionIntakePreview
        resource={nutritionIntake}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="nutritionIntakeDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default NutritionIntakeDetail;
