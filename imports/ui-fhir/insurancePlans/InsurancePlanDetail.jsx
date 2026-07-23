// /imports/ui-fhir/insurancePlans/InsurancePlanDetail.jsx

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
  MenuItem,
  Grid
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Meteor } from 'meteor/meteor';

const statusOptions = [
  { code: 'draft', display: 'Draft' },
  { code: 'active', display: 'Active' },
  { code: 'retired', display: 'Retired' },
  { code: 'unknown', display: 'Unknown' }
];

function InsurancePlanDetail(props) {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id || null;

  const isNewInsurancePlan = !id || id === 'new';
  const isExistingInsurancePlan = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [insurancePlan, setInsurancePlan] = useState({
    resourceType: "InsurancePlan",
    status: "draft",
    name: "",
    alias: [],
    type: [{
      text: ""
    }],
    period: {
      start: "",
      end: ""
    },
    ownedBy: {
      reference: "",
      display: ""
    },
    administeredBy: {
      reference: "",
      display: ""
    },
    coverageArea: [],
    network: [],
    endpoint: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Subscribe to insurance plans so data is available locally
  const isSubscriptionReady = useTracker(function(){
    return Meteor.subscribe('autopublish.InsurancePlans', {}, { limit: 1000 }).ready();
  }, []);

  // Set default editing state
  useEffect(function() {
    if (isNewInsurancePlan) {
      setIsEditing(true);
    }
  }, [id]);

  // Load insurance plan data when subscription is ready
  useEffect(function() {
    if (isExistingInsurancePlan && isSubscriptionReady) {
      let existingInsurancePlan = InsurancePlans.findOne({ _id: id });

      if (existingInsurancePlan) {
        setInsurancePlan(existingInsurancePlan);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.rpc('insurancePlans.get', { insurancePlanId: id });
            if (result) {
              setInsurancePlan(result);
            }
          } catch (err) {
            console.error('[InsurancePlanDetail] Error loading insurance plan via method:', err);
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
    const updatedInsurancePlan = { ...insurancePlan };
    set(updatedInsurancePlan, path, value);
    setInsurancePlan(updatedInsurancePlan);
  }

  // Handle save
  async function handleSave() {
    console.log('[InsurancePlanDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingInsurancePlan) {
        await Meteor.rpc('insurancePlans.update', { insurancePlanId: id, insurancePlanData: insurancePlan });
        console.log('[InsurancePlanDetail] Insurance plan updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.rpc('insurancePlans.create', insurancePlan);
        console.log('[InsurancePlanDetail] Insurance plan created with ID:', newId);
        navigate('/insurance-plans');
      }
    } catch (err) {
      console.error('[InsurancePlanDetail] Error saving insurance plan:', err);
      setError(err.message || err.reason || 'Failed to save insurance plan');
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingInsurancePlan) {
      setIsEditing(false);
      setError(null);
      // Reload the record to discard changes
      const existingInsurancePlan = InsurancePlans.findOne({ _id: id });
      if (existingInsurancePlan) {
        setInsurancePlan(existingInsurancePlan);
      }
    } else {
      navigate('/insurance-plans');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingInsurancePlan) return;

    if (window.confirm('Are you sure you want to delete this insurance plan?')) {
      setLoading(true);
      try {
        await Meteor.rpc('insurancePlans.remove', { insurancePlanId: id });
        console.log('[InsurancePlanDetail] Insurance plan deleted successfully');
        navigate('/insurance-plans');
      } catch (err) {
        console.error('[InsurancePlanDetail] Error deleting insurance plan:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Insurance Plan';
  if (isExistingInsurancePlan) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Lock / Unlock toggle */}
        {!isNewInsurancePlan && (
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
        {!isNewInsurancePlan && (
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

  // Alias is a FHIR string[] — edit as a comma-separated line
  const aliasValue = Array.isArray(get(insurancePlan, 'alias')) ?
    get(insurancePlan, 'alias', []).join(', ') :
    get(insurancePlan, 'alias', '');

  return (
    <Container id="insurancePlanDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
                value={get(insurancePlan, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                id="statusSelect"
                select
                fullWidth
                label="Status"
                value={get(insurancePlan, 'status', 'draft')}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={!isEditing}
              >
                {statusOptions.map(function(option){
                  return (
                    <MenuItem key={option.code} value={option.code}>
                      {option.display}
                    </MenuItem>
                  );
                })}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="aliasInput"
                fullWidth
                label="Alias (comma separated)"
                value={aliasValue}
                onChange={(e) => handleChange('alias', e.target.value.split(',').map(function(s){ return s.trim(); }).filter(Boolean))}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="typeInput"
                fullWidth
                label="Type"
                value={get(insurancePlan, 'type.0.text', '')}
                onChange={(e) => handleChange('type.0.text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodStartInput"
                fullWidth
                type="date"
                label="Period Start"
                InputLabelProps={{ shrink: true }}
                value={get(insurancePlan, 'period.start', '')}
                onChange={(e) => handleChange('period.start', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodEndInput"
                fullWidth
                type="date"
                label="Period End"
                InputLabelProps={{ shrink: true }}
                value={get(insurancePlan, 'period.end', '')}
                onChange={(e) => handleChange('period.end', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="ownedByInput"
                fullWidth
                label="Owned By (Organization)"
                value={get(insurancePlan, 'ownedBy.display', '')}
                onChange={(e) => handleChange('ownedBy.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="administeredByInput"
                fullWidth
                label="Administered By (Organization)"
                value={get(insurancePlan, 'administeredBy.display', '')}
                onChange={(e) => handleChange('administeredBy.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="coverageAreaInput"
                fullWidth
                label="Coverage Area (Location)"
                value={get(insurancePlan, 'coverageArea.0.display', '')}
                onChange={(e) => handleChange('coverageArea.0.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="networkInput"
                fullWidth
                label="Network (Organization)"
                value={get(insurancePlan, 'network.0.display', '')}
                onChange={(e) => handleChange('network.0.display', e.target.value)}
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
                id="saveInsurancePlanButton"
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

export default InsurancePlanDetail;
