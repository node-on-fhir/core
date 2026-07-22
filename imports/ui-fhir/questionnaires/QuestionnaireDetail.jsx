// /imports/ui-fhir/questionnaires/QuestionnaireDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Typography,
  Box,
  Tooltip
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

import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';

import QuestionnaireFormView from './QuestionnaireFormView';
import QuestionnairePreview from './QuestionnairePreview';

function QuestionnaireDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewQuestionnaire = !id || id === 'new';
  const isExistingQuestionnaire = id && id !== 'new';

  // Subscribe to questionnaires data
  const subscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Questionnaires', Session.get('selectedPatientId'), {});
    } else {
      return Meteor.subscribe('questionnaires.all');
    }
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [questionnaire, setQuestionnaire] = useState({
    resourceType: "Questionnaire",
    title: "",
    name: "",
    publisher: "",
    status: "active",
    version: "1.0.0",
    description: "",
    purpose: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    subjectType: ["Patient"],
    code: [{
      system: "http://loinc.org",
      code: "",
      display: ""
    }],
    contact: [],
    copyright: "",
    date: moment().format('YYYY-MM-DD'),
    experimental: false,
    item: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setQuestionnaire(function(prev) {
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

  // Set initial state on component mount
  useEffect(function() {
    if (isNewQuestionnaire) {
      setIsEditing(true);

      var publisherName = '';
      if (currentUser) {
        publisherName = get(currentUser, 'profile.organization', '') ||
                       get(currentUser, 'profile.name.text', '') ||
                       (get(currentUser, 'profile.name.given[0]', '') + ' ' + get(currentUser, 'profile.name.family', '')).trim() ||
                       get(currentUser, 'username', '');
      }

      setQuestionnaire(function(prev) {
        return { ...prev, publisher: publisherName };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load questionnaire if editing
  useEffect(function() {
    async function loadQuestionnaire() {
      if (isExistingQuestionnaire) {
        setLoading(true);
        try {
          console.log('[QuestionnaireDetail] Loading questionnaire with ID:', id);
          var result = await Meteor.rpc('questionnaires.get', { questionnaireId: id });
          if (result) {
            console.log('[QuestionnaireDetail] Loaded questionnaire:', result);
            setQuestionnaire(result);
            setError(null);
          }
        } catch (err) {
          console.error('[QuestionnaireDetail] Error loading questionnaire:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadQuestionnaire();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    pendingUpdate.current = true;
    setQuestionnaire(function(prevQuestionnaire) {
      var updatedQuestionnaire = JSON.parse(JSON.stringify(prevQuestionnaire));
      set(updatedQuestionnaire, path, value);
      return updatedQuestionnaire;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(questionnaire);
    }
  }, [questionnaire]);

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingQuestionnaire) {
        await Meteor.rpc('questionnaires.update', { questionnaireId: id, questionnaireData: questionnaire });
        console.log('[QuestionnaireDetail] Questionnaire updated successfully');
        setIsEditing(false);
        navigate('/questionnaires');
      } else {
        var newId = await Meteor.rpc('questionnaires.create', questionnaire);
        console.log('[QuestionnaireDetail] Questionnaire created with ID:', newId);
        if (newId) {
          navigate('/questionnaires');
          return;
        }
      }
    } catch (err) {
      console.error('[QuestionnaireDetail] Error saving questionnaire:', err);
      setError(err.error || err.message || 'Failed to save questionnaire');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingQuestionnaire) return;

    if (window.confirm('Are you sure you want to delete this questionnaire?')) {
      setLoading(true);
      try {
        await Meteor.rpc('questionnaires.remove', { questionnaireId: id });
        console.log('[QuestionnaireDetail] Questionnaire deleted successfully');
        navigate('/questionnaires');
      } catch (err) {
        console.error('[QuestionnaireDetail] Error deleting questionnaire:', err);
        setError(err.error || err.message || 'Failed to delete questionnaire');
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingQuestionnaire) {
      setIsEditing(false);
      setError(null);
      // Reload the original data
      async function reloadQuestionnaire() {
        try {
          var result = await Meteor.rpc('questionnaires.get', { questionnaireId: id });
          if (result) {
            setQuestionnaire(result);
          }
        } catch (err) {
          console.error('[QuestionnaireDetail] Error reloading questionnaire:', err);
        }
      }
      reloadQuestionnaire();
    } else {
      navigate('/questionnaires');
    }
  }

  // Build the header title
  let headerTitle = 'New Questionnaire';
  if (isExistingQuestionnaire) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewQuestionnaire && (
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
        {!isNewQuestionnaire && (
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
        {!isNewQuestionnaire && (
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
        {!isNewQuestionnaire && (
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
        <QuestionnaireFormView
          resource={questionnaire}
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
              id="saveQuestionnaireButton"
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
      <QuestionnairePreview
        resource={questionnaire}
        resourceId={isExistingQuestionnaire ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="questionnaireDetailPage" maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Card>
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

export default QuestionnaireDetail;
