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
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Grid
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { Meteor } from 'meteor/meteor';

function HealthcareServiceDetail(props) {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || null;

  const isNewHealthcareService = !id || id === 'new';
  const isExistingHealthcareService = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [healthcareService, setHealthcareService] = useState({
    resourceType: "HealthcareService",
    active: true,
    name: "",
    comment: "",
    category: [{
      text: ""
    }],
    type: [{
      text: ""
    }],
    specialty: [{
      text: ""
    }],
    providedBy: {
      reference: "",
      display: ""
    },
    location: {
      reference: "",
      display: ""
    },
    telecom: [
      {
        system: "phone",
        value: "",
        use: "work"
      },
      {
        system: "email",
        value: "",
        use: "work"
      }
    ],
    endpoint: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Subscribe to healthcare services so data is available locally
  const isSubscriptionReady = useTracker(function(){
    return Meteor.subscribe('autopublish.HealthcareServices', {}, { limit: 1000 }).ready();
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
      let existingHealthcareService = HealthcareServices.findOne({ _id: id });

      if (existingHealthcareService) {
        setHealthcareService(existingHealthcareService);
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
            console.error('[HealthcareServiceDetail] Error loading healthcare service via method:', err);
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
    const updatedHealthcareService = { ...healthcareService };
    set(updatedHealthcareService, path, value);
    setHealthcareService(updatedHealthcareService);
  }

  // Handle save
  async function handleSave() {
    console.log('[HealthcareServiceDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingHealthcareService) {
        await Meteor.callAsync('healthcareServices.update', id, healthcareService);
        console.log('[HealthcareServiceDetail] Healthcare service updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('healthcareServices.create', healthcareService);
        console.log('[HealthcareServiceDetail] Healthcare service created with ID:', newId);
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
      // Reload the record to discard changes
      const existingHealthcareService = HealthcareServices.findOne({ _id: id });
      if (existingHealthcareService) {
        setHealthcareService(existingHealthcareService);
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
        console.log('[HealthcareServiceDetail] Healthcare service deleted successfully');
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
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Lock / Unlock toggle */}
        {!isNewHealthcareService && (
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
        {!isNewHealthcareService && (
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

  // Resolve phone / email indexes from telecom (defensively)
  const telecom = get(healthcareService, 'telecom', []);
  let phoneIndex = telecom.findIndex(function(t){ return get(t, 'system') === 'phone'; });
  let emailIndex = telecom.findIndex(function(t){ return get(t, 'system') === 'email'; });

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

          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="nameInput"
                fullWidth
                label="Name"
                value={get(healthcareService, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    id="activeSwitch"
                    checked={Boolean(get(healthcareService, 'active', true))}
                    onChange={(e) => handleChange('active', e.target.checked)}
                    disabled={!isEditing}
                  />
                }
                label="Active"
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="categoryInput"
                fullWidth
                label="Category"
                value={get(healthcareService, 'category.0.text', '')}
                onChange={(e) => handleChange('category.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="typeInput"
                fullWidth
                label="Type"
                value={get(healthcareService, 'type.0.text', '')}
                onChange={(e) => handleChange('type.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="specialtyInput"
                fullWidth
                label="Specialty"
                value={get(healthcareService, 'specialty.0.text', '')}
                onChange={(e) => handleChange('specialty.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="providedByInput"
                fullWidth
                label="Provided By (Organization)"
                value={get(healthcareService, 'providedBy.display', '')}
                onChange={(e) => handleChange('providedBy.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="locationInput"
                fullWidth
                label="Location"
                value={get(healthcareService, 'location.display', '')}
                onChange={(e) => handleChange('location.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                id="phoneInput"
                fullWidth
                label="Phone"
                value={phoneIndex >= 0 ? get(healthcareService, 'telecom.' + phoneIndex + '.value', '') : ''}
                onChange={(e) => handleChange('telecom.' + (phoneIndex >= 0 ? phoneIndex : 0) + '.value', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                id="emailInput"
                fullWidth
                label="Email"
                value={emailIndex >= 0 ? get(healthcareService, 'telecom.' + emailIndex + '.value', '') : ''}
                onChange={(e) => handleChange('telecom.' + (emailIndex >= 0 ? emailIndex : 1) + '.value', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="commentInput"
                fullWidth
                multiline
                minRows={3}
                label="Comment"
                value={get(healthcareService, 'comment', '')}
                onChange={(e) => handleChange('comment', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>

          {/* In-form Save/Cancel bar when editing */}
          {isEditing && (
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
        </CardContent>
      </Card>
    </Container>
  );
}

export default HealthcareServiceDetail;
