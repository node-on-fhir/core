// /imports/ui-fhir/activityDefinitions/ActivityDefinitionDetail.jsx

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

import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { Meteor } from 'meteor/meteor';

import ActivityDefinitionFormView from './ActivityDefinitionFormView';
import ActivityDefinitionPreview from './ActivityDefinitionPreview';

/**
 * ActivityDefinitionDetail - FHIR R4 ActivityDefinition Detail Component
 *
 * ActivityDefinition is a PATIENT-AGNOSTIC resource that defines reusable
 * clinical activities, protocols, and order sets. It can be used to create
 * ServiceRequests, MedicationRequests, Tasks, or Appointments.
 *
 * Key fields:
 * - status (required): draft, active, retired, unknown
 * - name: Computer-friendly name
 * - title: Human-friendly name
 * - description: Description of the activity
 * - kind: What type of resource this creates (ServiceRequest, MedicationRequest, Task, Appointment)
 * - intent: proposal, plan, directive, order, etc.
 * - priority: routine, urgent, asap, stat
 */
function ActivityDefinitionDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  // Subscribe to ActivityDefinition data using ID-based query
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      const query = {
        $or: [
          {'_id': id},
          {'id': id}
        ]
      };
      console.log('[ActivityDefinitionDetail] Subscribing with ID query:', query);
      const handle = Meteor.subscribe('autopublish.ActivityDefinitions', {}, {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 ActivityDefinition structure
  const [activityDefinition, setActivityDefinition] = useState({
    resourceType: "ActivityDefinition",
    status: "draft",
    name: "",
    title: "",
    description: "",
    kind: "",
    intent: "",
    priority: "routine",
    publisher: "",
    purpose: "",
    usage: "",
    copyright: "",
    approvalDate: "",
    lastReviewDate: "",
    experimental: false,
    version: "",
    url: ""
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setActivityDefinition(function(prev) {
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

  // Set default values on component mount for new activity definitions
  useEffect(function() {
    if (!id || id === 'new') {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  // Load activity definition when subscription is ready
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      console.log('[ActivityDefinitionDetail] Subscription ready, loading from collection');
      const existingActivityDefinition = ActivityDefinitions.findOne({_id: id});

      if (existingActivityDefinition) {
        console.log('[ActivityDefinitionDetail] Loaded:', {
          _id: existingActivityDefinition._id,
          name: get(existingActivityDefinition, 'name'),
          title: get(existingActivityDefinition, 'title'),
          status: get(existingActivityDefinition, 'status')
        });
        setActivityDefinition(existingActivityDefinition);
        setIsEditing(false);
      } else {
        // Try by id field
        const byId = ActivityDefinitions.findOne({id: id});
        if (byId) {
          setActivityDefinition(byId);
          setIsEditing(false);
        } else {
          console.warn('[ActivityDefinitionDetail] Not found in collection:', id);
          setError('Activity Definition not found');
        }
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updated = { ...activityDefinition };
    set(updated, path, value);
    setActivityDefinition(updated);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updated);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[ActivityDefinitionDetail] Saving:', {
      name: get(activityDefinition, 'name'),
      title: get(activityDefinition, 'title'),
      status: get(activityDefinition, 'status'),
      kind: get(activityDefinition, 'kind')
    });

    try {
      if (id && id !== 'new') {
        await Meteor.rpc('activityDefinitions.update', { activityDefinitionId: id, activityDefinitionData: activityDefinition });
        console.log('ActivityDefinition updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('activityDefinitions.create', activityDefinition);
        console.log('ActivityDefinition created with ID:', newId);
        navigate('/activity-definitions');
      }
    } catch (err) {
      console.error('Error saving activity definition:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!id || id === 'new') return;

    if (window.confirm('Are you sure you want to delete this activity definition?')) {
      setLoading(true);
      try {
        await Meteor.rpc('activityDefinitions.remove', { activityDefinitionId: id });
        console.log('ActivityDefinition deleted successfully');
        navigate('/activity-definitions');
      } catch (err) {
        console.error('Error deleting activity definition:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (id && id !== 'new') {
      setIsEditing(false);
      const existing = ActivityDefinitions.findOne({_id: id});
      if (existing) {
        setActivityDefinition(existing);
      }
    } else {
      navigate('/activity-definitions');
    }
  }

  // Build the header title
  let headerTitle = 'New Activity Definition';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new records */}
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

        {/* Form toggle - hidden for new records (always form) */}
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

        {/* Edit toggle — only for existing records */}
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

        {/* Delete — only for existing records */}
        {!isNewRecord && (
          <Button
              id="deleteActivityDefinitionButton"
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
  function renderFormView(){
    return (
      <>
        <ActivityDefinitionFormView
          resource={activityDefinition}
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
              id="saveActivityDefinitionButton"
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
  function renderPreviewView(){
    return (
      <ActivityDefinitionPreview
        resource={activityDefinition}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="activityDefinitionDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ActivityDefinitionDetail;
