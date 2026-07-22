// imports/ui-fhir/goals/GoalDetail.jsx

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

import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import GoalFormView from './GoalFormView';
import GoalPreview from './GoalPreview';

function GoalDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [goal, setGoal] = useState({
    resourceType: "Goal",
    subject: {
      reference: "",
      display: ""
    },
    expressedBy: {
      reference: "",
      display: ""
    },
    lifecycleStatus: "proposed",
    achievementStatus: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/goal-achievement",
        code: "in-progress",
        display: "In Progress"
      }]
    },
    priority: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/goal-priority",
        code: "medium-priority",
        display: "Medium Priority"
      }]
    },
    description: {
      text: ""
    },
    startDate: moment().format('YYYY-MM-DD'),
    target: [{
      measure: {
        coding: [{
          system: "http://loinc.org",
          code: "",
          display: ""
        }]
      },
      dueDate: moment().add(30, 'days').format('YYYY-MM-DD')
    }],
    statusDate: moment().format('YYYY-MM-DD'),
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setGoal(function(prev) {
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

  const isNewGoal = !id || id === 'new';
  const isExistingGoal = id && id !== 'new';

  // Set patient name and expressedBy on component mount for new goals
  useEffect(function() {
    if (!id || id === 'new') {
      // Enable editing for new goals
      setIsEditing(true);

      var patientName = '';
      var patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim();
        patientReference = 'Patient/' + get(selectedPatient, '_id', '');
      } else if (currentUser) {
        patientName = get(currentUser, 'profile.name.text', '') ||
                     (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                     get(currentUser, 'username', '');
        patientReference = 'Patient/' + get(currentUser, 'profile.patientId', '');
      }

      var expressedByName = '';
      var expressedByReference = '';

      if (currentUser) {
        expressedByName = get(currentUser, 'profile.name.text', '') ||
                         (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                         get(currentUser, 'username', '');
        expressedByReference = 'Practitioner/' + get(currentUser, '_id', '');
      }

      setGoal(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          },
          expressedBy: {
            reference: expressedByReference,
            display: expressedByName
          }
        };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, selectedPatient, currentUser]);

  // Load goal if editing
  useEffect(function() {
    async function loadGoal() {
      if (id && id !== 'new') {
        setLoading(true);
        try {
          // rpc-migration: ddp-straggler
          var result = await Meteor.callAsync('goals.get', id);
          if (result) {
            setGoal(result);
          }
        } catch (err) {
          console.error('[GoalDetail] Error loading goal:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadGoal();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    var updatedGoal = { ...goal };
    set(updatedGoal, path, value);
    setGoal(updatedGoal);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedGoal);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingGoal) {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('goals.update', id, goal);
        console.log('[GoalDetail] Goal updated successfully');
        setIsEditing(false);
      } else {
        // rpc-migration: ddp-straggler
        var newId = await Meteor.callAsync('goals.create', goal);
        console.log('[GoalDetail] Goal created with ID:', newId);
        navigate('/goals');
      }
    } catch (err) {
      console.error('[GoalDetail] Error saving goal:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingGoal) return;

    if (window.confirm('Are you sure you want to delete this goal?')) {
      setLoading(true);
      try {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('goals.remove', id);
        console.log('[GoalDetail] Goal deleted successfully');
        navigate('/goals');
      } catch (err) {
        console.error('[GoalDetail] Error deleting goal:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingGoal) {
      setIsEditing(false);
      setError(null);
      // Reload the goal to discard changes
      async function reloadGoal() {
        try {
          // rpc-migration: ddp-straggler
          var result = await Meteor.callAsync('goals.get', id);
          if (result) {
            setGoal(result);
          }
        } catch (err) {
          console.error('[GoalDetail] Error reloading goal:', err);
        }
      }
      reloadGoal();
    } else {
      navigate('/goals');
    }
  }

  // Build the header title
  var headerTitle = 'New Goal';
  if (isExistingGoal) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewGoal && (
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

        {/* Form toggle */}
        {!isNewGoal && (
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

        {/* Lock / Unlock toggle */}
        {!isNewGoal && (
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
        {!isNewGoal && (
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
        <GoalFormView
          resource={goal}
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
              id="saveGoalButton"
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
    return <GoalPreview resource={goal} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="goalDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default GoalDetail;
