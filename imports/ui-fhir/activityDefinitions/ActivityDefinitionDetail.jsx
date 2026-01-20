// /imports/ui-fhir/activityDefinitions/ActivityDefinitionDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardActions,
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
  Stack
} from '@mui/material';

import { get, set } from 'lodash';
import moment from 'moment';

import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { Meteor } from 'meteor/meteor';

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
  const navigate = useNavigate();
  const { id } = useParams();

  // Subscribe to ActivityDefinition data using ID-based query
  const isSubscriptionReady = useTracker(function(){
    if (id && id !== 'new') {
      const query = {
        $or: [
          {'_id': id},
          {'id': id}
        ]
      };
      console.log('[ActivityDefinitionDetail] Subscribing with ID query:', query);
      const handle = Meteor.subscribe('autopublish.ActivityDefinitions', query, {});
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
        await Meteor.callAsync('activityDefinitions.update', id, activityDefinition);
        console.log('ActivityDefinition updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('activityDefinitions.create', activityDefinition);
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
        await Meteor.callAsync('activityDefinitions.remove', id);
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

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'retired', label: 'Retired' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const kindOptions = [
    { value: '', label: 'None' },
    { value: 'ServiceRequest', label: 'Service Request' },
    { value: 'MedicationRequest', label: 'Medication Request' },
    { value: 'Task', label: 'Task' },
    { value: 'Appointment', label: 'Appointment' },
    { value: 'CommunicationRequest', label: 'Communication Request' },
    { value: 'DeviceRequest', label: 'Device Request' },
    { value: 'NutritionOrder', label: 'Nutrition Order' },
    { value: 'SupplyRequest', label: 'Supply Request' },
    { value: 'VisionPrescription', label: 'Vision Prescription' }
  ];

  const intentOptions = [
    { value: '', label: 'None' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'plan', label: 'Plan' },
    { value: 'directive', label: 'Directive' },
    { value: 'order', label: 'Order' },
    { value: 'original-order', label: 'Original Order' },
    { value: 'reflex-order', label: 'Reflex Order' },
    { value: 'filler-order', label: 'Filler Order' },
    { value: 'instance-order', label: 'Instance Order' },
    { value: 'option', label: 'Option' }
  ];

  const priorityOptions = [
    { value: 'routine', label: 'Routine' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'asap', label: 'ASAP' },
    { value: 'stat', label: 'STAT' }
  ];

  return (
    <Container id="activityDefinitionDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Activity Definition' : 'New Activity Definition'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {/* System ID Barcode */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>
                {get(activityDefinition, '_id') || id}
              </span>
            </Box>
          )}

          <Stack spacing={3}>
            {/* Identity Section */}
            <Typography variant="h6">Identity</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="nameInput"
                fullWidth
                label="Name (Computer-Friendly)"
                value={get(activityDefinition, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                helperText="A machine-friendly name for this activity definition"
                disabled={!isEditing}
              />

              <TextField
                id="titleInput"
                fullWidth
                label="Title (Human-Friendly)"
                value={get(activityDefinition, 'title', '')}
                onChange={(e) => handleChange('title', e.target.value)}
                helperText="A human-friendly name for this activity definition"
                disabled={!isEditing}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="statusSelect"
                  value={get(activityDefinition, 'status', 'draft')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  {statusOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                id="versionInput"
                fullWidth
                label="Version"
                value={get(activityDefinition, 'version', '')}
                onChange={(e) => handleChange('version', e.target.value)}
                helperText="Business version identifier"
                disabled={!isEditing}
              />
            </Stack>

            <TextField
              id="descriptionInput"
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={get(activityDefinition, 'description', '')}
              onChange={(e) => handleChange('description', e.target.value)}
              helperText="Natural language description of the activity definition"
              disabled={!isEditing}
            />

            {/* Activity Type Section */}
            <Typography variant="h6" sx={{ mt: 2 }}>Activity Type</Typography>

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Kind</InputLabel>
                <Select
                  id="kindSelect"
                  value={get(activityDefinition, 'kind', '')}
                  onChange={(e) => handleChange('kind', e.target.value)}
                  label="Kind"
                >
                  {kindOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Intent</InputLabel>
                <Select
                  id="intentSelect"
                  value={get(activityDefinition, 'intent', '')}
                  onChange={(e) => handleChange('intent', e.target.value)}
                  label="Intent"
                >
                  {intentOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Priority</InputLabel>
                <Select
                  id="prioritySelect"
                  value={get(activityDefinition, 'priority', 'routine')}
                  onChange={(e) => handleChange('priority', e.target.value)}
                  label="Priority"
                >
                  {priorityOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Publisher Section */}
            <Typography variant="h6" sx={{ mt: 2 }}>Publisher Information</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="publisherInput"
                fullWidth
                label="Publisher"
                value={get(activityDefinition, 'publisher', '')}
                onChange={(e) => handleChange('publisher', e.target.value)}
                helperText="Name of the publisher (organization or individual)"
                disabled={!isEditing}
              />

              <TextField
                id="urlInput"
                fullWidth
                label="Canonical URL"
                value={get(activityDefinition, 'url', '')}
                onChange={(e) => handleChange('url', e.target.value)}
                helperText="Canonical identifier for this activity definition"
                disabled={!isEditing}
              />
            </Stack>

            {/* Purpose and Usage */}
            <Typography variant="h6" sx={{ mt: 2 }}>Purpose and Usage</Typography>

            <TextField
              id="purposeInput"
              fullWidth
              multiline
              rows={2}
              label="Purpose"
              value={get(activityDefinition, 'purpose', '')}
              onChange={(e) => handleChange('purpose', e.target.value)}
              helperText="Why this activity definition is defined"
              disabled={!isEditing}
            />

            <TextField
              id="usageInput"
              fullWidth
              multiline
              rows={2}
              label="Usage"
              value={get(activityDefinition, 'usage', '')}
              onChange={(e) => handleChange('usage', e.target.value)}
              helperText="Describes the clinical usage of the activity definition"
              disabled={!isEditing}
            />

            {/* Dates */}
            <Typography variant="h6" sx={{ mt: 2 }}>Review Dates</Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                id="approvalDateInput"
                fullWidth
                type="date"
                label="Approval Date"
                value={get(activityDefinition, 'approvalDate', '')}
                onChange={(e) => handleChange('approvalDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />

              <TextField
                id="lastReviewDateInput"
                fullWidth
                type="date"
                label="Last Review Date"
                value={get(activityDefinition, 'lastReviewDate', '')}
                onChange={(e) => handleChange('lastReviewDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                disabled={!isEditing}
              />
            </Stack>

            <TextField
              id="copyrightInput"
              fullWidth
              multiline
              rows={2}
              label="Copyright"
              value={get(activityDefinition, 'copyright', '')}
              onChange={(e) => handleChange('copyright', e.target.value)}
              helperText="Use and/or publishing restrictions"
              disabled={!isEditing}
            />
          </Stack>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button
                onClick={() => navigate('/activity-definitions')}
              >
                Back
              </Button>
              <Button
                id="deleteActivityDefinitionButton"
                onClick={handleDelete}
                color="error"
                disabled={loading}
              >
                Delete
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button
                onClick={handleCancel}
                disabled={loading}
              >
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
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ActivityDefinitionDetail;
