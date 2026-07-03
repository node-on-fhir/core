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
  Grid,
  TextField,
  Typography,
  Box
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

function InsurancePlanDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const isNewInsurancePlan = !id || id === 'new';
  const isExistingInsurancePlan = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [insurancePlan, setInsurancePlan] = useState({
    resourceType: "InsurancePlan",
    name: "",
    status: "active",
    alias: [""],
    identifier: [{
      system: "",
      value: ""
    }],
    type: [{
      coding: [{ system: "", code: "", display: "" }],
      text: ""
    }],
    ownedBy: {
      reference: "",
      display: ""
    },
    administratedBy: {
      reference: "",
      display: ""
    },
    coverageArea: [{
      reference: "",
      display: ""
    }],
    endpoint: []
  });

  // Initialise from fhirResource prop when in embedded mode
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      setInsurancePlan(function(prev) {
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

  // Subscribe to insurance plans so data is available locally
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('autopublish.InsurancePlans', {}, { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('insurancePlans.all').ready();
    }
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
      let existing = InsurancePlans.findOne({ _id: id });

      if (existing) {
        setInsurancePlan(existing);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('insurancePlans.get', id);
            if (result) {
              setInsurancePlan(result);
            }
          } catch (err) {
            console.error('[InsurancePlanDetail] Error loading via method:', err);
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
    const updated = { ...insurancePlan };
    set(updated, path, value);
    setInsurancePlan(updated);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updated);
    }
  }

  // Handle save
  async function handleSave() {
    console.log('[InsurancePlanDetail] handleSave called');
    setLoading(true);
    setError(null);

    try {
      if (isExistingInsurancePlan) {
        await Meteor.callAsync('insurancePlans.update', id, insurancePlan);
        console.log('[InsurancePlanDetail] InsurancePlan updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('insurancePlans.create', insurancePlan);
        console.log('[InsurancePlanDetail] InsurancePlan created with ID:', newId);
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
      const existing = InsurancePlans.findOne({ _id: id });
      if (existing) {
        setInsurancePlan(existing);
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
        await Meteor.callAsync('insurancePlans.remove', id);
        console.log('[InsurancePlanDetail] InsurancePlan deleted successfully');
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
    if (isNewInsurancePlan) return null;
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
              value={get(insurancePlan, 'name', '')}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="statusInput"
              fullWidth
              label="Status"
              value={get(insurancePlan, 'status', '')}
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="typeInput"
              fullWidth
              label="Type"
              value={get(insurancePlan, 'type[0].text', '')}
              onChange={(e) => handleChange('type[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="aliasInput"
              fullWidth
              label="Alias"
              value={get(insurancePlan, 'alias[0]', '')}
              onChange={(e) => handleChange('alias[0]', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="ownedByDisplayInput"
              fullWidth
              label="Owned By (display)"
              value={get(insurancePlan, 'ownedBy.display', '')}
              onChange={(e) => handleChange('ownedBy.display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="ownedByReferenceInput"
              fullWidth
              label="Owned By (reference)"
              value={get(insurancePlan, 'ownedBy.reference', '')}
              onChange={(e) => handleChange('ownedBy.reference', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="administeredByDisplayInput"
              fullWidth
              label="Administered By (display)"
              value={get(insurancePlan, 'administratedBy.display', '')}
              onChange={(e) => handleChange('administratedBy.display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="administeredByReferenceInput"
              fullWidth
              label="Administered By (reference)"
              value={get(insurancePlan, 'administratedBy.reference', '')}
              onChange={(e) => handleChange('administratedBy.reference', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="coverageAreaDisplayInput"
              fullWidth
              label="Coverage Area (display)"
              value={get(insurancePlan, 'coverageArea[0].display', '')}
              onChange={(e) => handleChange('coverageArea[0].display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="coverageAreaReferenceInput"
              fullWidth
              label="Coverage Area (reference)"
              value={get(insurancePlan, 'coverageArea[0].reference', '')}
              onChange={(e) => handleChange('coverageArea[0].reference', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="identifierSystemInput"
              fullWidth
              label="Identifier System"
              value={get(insurancePlan, 'identifier[0].system', '')}
              onChange={(e) => handleChange('identifier[0].system', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="identifierValueInput"
              fullWidth
              label="Identifier Value"
              value={get(insurancePlan, 'identifier[0].value', '')}
              onChange={(e) => handleChange('identifier[0].value', e.target.value)}
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
      </>
    );
  }


  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

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

          {renderFormView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default InsurancePlanDetail;
