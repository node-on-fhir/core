// /imports/ui-fhir/healthcareServices/HealthcareServiceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  TextField,
  Typography,
  Box,
  FormControlLabel,
  Checkbox
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function HealthcareServiceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const isNewHealthcareService = !id || id === 'new';
  const isExistingHealthcareService = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [healthcareService, setHealthcareService] = useState({
    resourceType: "HealthcareService",
    name: "",
    active: true,
    comment: "",
    identifier: [{
      system: "",
      value: ""
    }],
    category: [{
      coding: [{ system: "", code: "", display: "" }],
      text: ""
    }],
    type: [{
      coding: [{ system: "", code: "", display: "" }],
      text: ""
    }],
    providedBy: {
      reference: "",
      display: ""
    },
    telecom: [
      { system: "phone", value: "", use: "work" },
      { system: "email", value: "", use: "work" }
    ],
    endpoint: []
  });

  // Initialise from fhirResource prop when in embedded mode
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      setHealthcareService(function(prev) {
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

  // Subscribe to healthcare services so data is available locally
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('autopublish.HealthcareServices', {}, { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('healthcareServices.all').ready();
    }
  }, []);

  // Set default editing state
  useEffect(function() {
    if (isNewHealthcareService) {
      setIsEditing(true);
    }
  }, [id]);

  // Load healthcare service data when subscription is ready
  useEffect(function() {
    if (isExistingHealthcareService && isSubscriptionReady) {
      let existing = HealthcareServices.findOne({ _id: id });

      if (existing) {
        setHealthcareService(existing);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('healthcareServices.get', id);
            if (result) {
              setHealthcareService(result);
            }
          } catch (err) {
            console.error('[HealthcareServiceDetail] Error loading via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updated = { ...healthcareService };
    set(updated, path, value);
    setHealthcareService(updated);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updated);
    }
  }

  // Handle save
  async function handleSave() {
    console.log('[HealthcareServiceDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingHealthcareService) {
        await Meteor.callAsync('healthcareServices.update', id, healthcareService);
        console.log('[HealthcareServiceDetail] HealthcareService updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('healthcareServices.create', healthcareService);
        console.log('[HealthcareServiceDetail] HealthcareService created with ID:', newId);
        navigate('/healthcare-services');
      }
    } catch (err) {
      console.error('[HealthcareServiceDetail] Error saving healthcare service:', err);
      setError(err.message || err.reason || 'Failed to save healthcare service');
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingHealthcareService) {
      setIsEditing(false);
      setError(null);
      const existing = HealthcareServices.findOne({ _id: id });
      if (existing) {
        setHealthcareService(existing);
      }
    } else {
      navigate('/healthcare-services');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingHealthcareService) return;

    if (window.confirm('Are you sure you want to delete this healthcare service?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('healthcareServices.remove', id);
        console.log('[HealthcareServiceDetail] HealthcareService deleted successfully');
        navigate('/healthcare-services');
      } catch (err) {
        console.error('[HealthcareServiceDetail] Error deleting healthcare service:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Healthcare Service';
  if (isExistingHealthcareService) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    if (isNewHealthcareService) return null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Button
          id="editButton"
          onClick={function() { setIsEditing(!isEditing); }}
          variant="outlined"
          size="small"
          startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
        >
          {isEditing ? 'Editing' : 'Edit'}
        </Button>
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
      </Box>
    );
  }

  // Render the form
  function renderFormView() {
    return (
      <>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="nameInput"
              fullWidth
              label="Name"
              value={get(healthcareService, 'name', '')}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  id="activeCheckbox"
                  checked={get(healthcareService, 'active', false)}
                  onChange={(e) => handleChange('active', e.target.checked)}
                  disabled={!isEditing}
                />
              }
              label="Active"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="categoryInput"
              fullWidth
              label="Category"
              value={get(healthcareService, 'category[0].text', '')}
              onChange={(e) => handleChange('category[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="typeInput"
              fullWidth
              label="Type"
              value={get(healthcareService, 'type[0].text', '')}
              onChange={(e) => handleChange('type[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="providedByDisplayInput"
              fullWidth
              label="Provided By (display)"
              value={get(healthcareService, 'providedBy.display', '')}
              onChange={(e) => handleChange('providedBy.display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="providedByReferenceInput"
              fullWidth
              label="Provided By (reference)"
              value={get(healthcareService, 'providedBy.reference', '')}
              onChange={(e) => handleChange('providedBy.reference', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="phoneInput"
              fullWidth
              label="Phone"
              value={get(healthcareService, 'telecom[0].value', '')}
              onChange={(e) => handleChange('telecom[0].value', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="emailInput"
              fullWidth
              label="Email"
              value={get(healthcareService, 'telecom[1].value', '')}
              onChange={(e) => handleChange('telecom[1].value', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="identifierSystemInput"
              fullWidth
              label="Identifier System"
              value={get(healthcareService, 'identifier[0].system', '')}
              onChange={(e) => handleChange('identifier[0].system', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="identifierValueInput"
              fullWidth
              label="Identifier Value"
              value={get(healthcareService, 'identifier[0].value', '')}
              onChange={(e) => handleChange('identifier[0].value', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="commentInput"
              fullWidth
              multiline
              minRows={2}
              label="Comment"
              value={get(healthcareService, 'comment', '')}
              onChange={(e) => handleChange('comment', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
        </Grid>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveHealthcareServiceButton"
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


  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="healthcareServiceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

          {renderFormView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default HealthcareServiceDetail;
