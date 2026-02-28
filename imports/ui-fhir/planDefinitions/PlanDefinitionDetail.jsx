// /imports/ui-fhir/planDefinitions/PlanDefinitionDetail.jsx

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

import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PlanDefinitionFormView from './PlanDefinitionFormView';
import PlanDefinitionPreview from './PlanDefinitionPreview';

function PlanDefinitionDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewPlanDefinition = !id || id === 'new';
  const isExistingPlanDefinition = id && id !== 'new';

  // Get current user from session
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to PlanDefinitions
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.PlanDefinitions', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('planDefinitions');
    }
    return handle.ready();
  }, []);

  // Initialize state with comprehensive FHIR R4 structure
  const [planDefinition, setPlanDefinition] = useState({
    resourceType: "PlanDefinition",
    id: "",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/PlanDefinition"],
      versionId: "1",
      lastUpdated: moment().format()
    },
    url: "",
    identifier: [],
    version: "1.0.0",
    name: "",
    title: "",
    subtitle: "",
    type: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/plan-definition-type",
        code: "clinical-protocol",
        display: "Clinical Protocol"
      }]
    },
    status: "draft",
    experimental: false,
    subjectCodeableConcept: {
      coding: [{
        system: "http://hl7.org/fhir/resource-types",
        code: "Patient",
        display: "Patient"
      }]
    },
    date: moment().format('YYYY-MM-DD'),
    publisher: "",
    contact: [],
    description: "",
    useContext: [],
    jurisdiction: [],
    purpose: "",
    usage: "",
    copyright: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    topic: [],
    author: [],
    editor: [],
    reviewer: [],
    endorser: [],
    relatedArtifact: [],
    library: [],
    goal: [],
    action: [],
    note: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setPlanDefinition(function(prev) {
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

  // Set default values on component mount for new plan definitions
  useEffect(function() {
    if (isNewPlanDefinition) {
      setIsEditing(true);
      if (currentUser) {
        const updatedPlan = { ...planDefinition };
        set(updatedPlan, 'author', [{
          name: get(currentUser, 'profile.name', currentUser.username || 'Unknown'),
          telecom: [{
            system: 'email',
            value: get(currentUser, 'emails[0].address', '')
          }]
        }]);
        set(updatedPlan, 'publisher', get(currentUser, 'profile.organization', 'Honeycomb Health'));
        setPlanDefinition(updatedPlan);
      }
    } else {
      setIsEditing(false);
    }
  }, [id, currentUser]);

  // Load plan definition if editing
  useEffect(function() {
    if (isExistingPlanDefinition) {
      const existingPlanDefinition = PlanDefinitions.findOne({_id: id}) || PlanDefinitions.findOne({id: id});
      if (existingPlanDefinition) {
        setPlanDefinition(existingPlanDefinition);
        setIsEditing(false);
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    console.log('handleChange called with path:', path, 'value:', value);
    const updatedPlanDefinition = { ...planDefinition };
    set(updatedPlanDefinition, path, value);
    setPlanDefinition(updatedPlanDefinition);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedPlanDefinition);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (!planDefinition.id) {
        planDefinition.id = planDefinition.name || 'plan-' + Date.now();
      }

      planDefinition.meta.lastUpdated = moment().format();

      if (isExistingPlanDefinition) {
        await Meteor.callAsync('updatePlanDefinition', id, planDefinition);
        console.log('[PlanDefinitionDetail] Plan definition updated successfully');
        setIsEditing(false);
      } else {
        console.log('[PlanDefinitionDetail] Creating plan definition');
        const newId = await Meteor.callAsync('createPlanDefinition', planDefinition);
        console.log('[PlanDefinitionDetail] Plan definition created with ID:', newId);
        navigate('/plan-definitions/' + newId);
      }
    } catch (err) {
      console.error('[PlanDefinitionDetail] Error saving plan definition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingPlanDefinition) {
      setIsEditing(false);
      setError(null);
      const existingPlanDefinition = PlanDefinitions.findOne({_id: id});
      if (existingPlanDefinition) {
        setPlanDefinition(existingPlanDefinition);
      }
    } else {
      navigate('/plan-definitions');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingPlanDefinition) return;

    if (window.confirm('Are you sure you want to delete this plan definition?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removePlanDefinition', id);
        console.log('[PlanDefinitionDetail] Plan definition deleted successfully');
        navigate('/plan-definitions');
      } catch (err) {
        console.error('[PlanDefinitionDetail] Error deleting plan definition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Plan Definition';
  if (isExistingPlanDefinition) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewPlanDefinition && (
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

        {/* Form toggle */}
        {!isNewPlanDefinition && (
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

        {/* Lock / Unlock toggle */}
        {!isNewPlanDefinition && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete */}
        {!isNewPlanDefinition && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <PlanDefinitionFormView
          resource={planDefinition}
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
              id="savePlanDefinitionButton"
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
      <PlanDefinitionPreview
        resource={planDefinition}
        resourceId={isExistingPlanDefinition ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="planDefinitionDetailPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(null); }}>
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

export default PlanDefinitionDetail;
