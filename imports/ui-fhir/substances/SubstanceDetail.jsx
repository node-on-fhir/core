// /imports/ui-fhir/substances/SubstanceDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Substances } from '/imports/lib/schemas/SimpleSchemas/Substances';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import SubstanceFormView from './SubstanceFormView';
import SubstancePreview from './SubstancePreview';

function SubstanceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const [substanceId, setSubstanceId] = useState(false);

  // Subscribe to substance data
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    if (id && id !== 'new') {
      console.log('[SubstanceDetail] Subscribing for substance:', id);
      var handle = Meteor.subscribe('selectedPatient.Substances', Session.get('selectedPatientId'), {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [substance, setSubstance] = useState({
    resourceType: "Substance",
    status: "active",
    category: [{
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/substance-category",
        code: "",
        display: ""
      }],
      text: ""
    }],
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    },
    description: "",
    instance: [{
      identifier: {
        system: "",
        value: ""
      },
      expiry: moment().add(1, 'year').format('YYYY-MM-DD'),
      quantity: {
        value: "",
        unit: ""
      }
    }],
    ingredient: [{
      quantity: {
        numerator: {
          value: "",
          unit: ""
        },
        denominator: {
          value: "",
          unit: ""
        }
      },
      substanceCodeableConcept: {
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }
    }]
  });

  const [form, setForm] = useState({
    status: 'active',
    codeText: '',
    codeCode: '',
    codeDisplay: '',
    categoryCode: '',
    categoryDisplay: '',
    description: '',
    instanceIdentifier: '',
    instanceExpiry: moment().add(1, 'year').format('YYYY-MM-DD'),
    instanceQuantityValue: '',
    instanceQuantityUnit: '',
    ingredientCode: '',
    ingredientDisplay: '',
    ingredientNumeratorValue: '',
    ingredientNumeratorUnit: '',
    ingredientDenominatorValue: '',
    ingredientDenominatorUnit: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setSubstance(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(substance);
    }
  }, [substance]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewSubstance = !id || id === 'new';
  const isExistingSubstance = substanceId && substanceId !== 'new';

  // Helper to extract form from a substance resource
  function extractFormFromSubstance(substanceResource) {
    return {
      status: get(substanceResource, 'status', 'active'),
      codeText: get(substanceResource, 'code.text', ''),
      codeCode: get(substanceResource, 'code.coding[0].code', ''),
      codeDisplay: get(substanceResource, 'code.coding[0].display', ''),
      categoryCode: get(substanceResource, 'category[0].coding[0].code', ''),
      categoryDisplay: get(substanceResource, 'category[0].coding[0].display', get(substanceResource, 'category[0].text', '')),
      description: get(substanceResource, 'description', ''),
      instanceIdentifier: get(substanceResource, 'instance[0].identifier.value', ''),
      instanceExpiry: moment(get(substanceResource, 'instance[0].expiry', '')).format('YYYY-MM-DD'),
      instanceQuantityValue: get(substanceResource, 'instance[0].quantity.value', ''),
      instanceQuantityUnit: get(substanceResource, 'instance[0].quantity.unit', ''),
      ingredientCode: get(substanceResource, 'ingredient[0].substanceCodeableConcept.coding[0].code', ''),
      ingredientDisplay: get(substanceResource, 'ingredient[0].substanceCodeableConcept.coding[0].display', ''),
      ingredientNumeratorValue: get(substanceResource, 'ingredient[0].quantity.numerator.value', ''),
      ingredientNumeratorUnit: get(substanceResource, 'ingredient[0].quantity.numerator.unit', ''),
      ingredientDenominatorValue: get(substanceResource, 'ingredient[0].quantity.denominator.value', ''),
      ingredientDenominatorUnit: get(substanceResource, 'ingredient[0].quantity.denominator.unit', '')
    };
  }

  // Set editing mode based on id
  useEffect(function() {
    if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id]);

  // Load substance with polling retry when subscription data may be delayed
  useEffect(function() {
    var cancelled = false;
    var retryCount = 0;
    var maxRetries = 5;
    var retryDelay = 500;

    function tryLoadSubstance() {
      if (cancelled) return;
      if (!id || id === 'new') return;

      console.log('[SubstanceDetail] Attempting to load substance:', id, 'attempt:', retryCount + 1);

      // Try to find in client collection
      var existingSubstance = Substances.findOne({_id: id});

      // Fallback: try finding by id field (FHIR identifier)
      if (!existingSubstance) {
        existingSubstance = Substances.findOne({id: id});
      }

      if (existingSubstance) {
        console.log('[SubstanceDetail] Loaded substance:', {
          _id: existingSubstance._id,
          codeText: get(existingSubstance, 'code.text'),
          status: get(existingSubstance, 'status')
        });
        setSubstance(existingSubstance);
        setSubstanceId(existingSubstance._id);
        setForm(extractFormFromSubstance(existingSubstance));
        setIsEditing(false);
        setError(null);
        return;
      }

      // If subscription is ready but data still not found, retry a few times
      if (isSubscriptionReady && retryCount < maxRetries) {
        retryCount++;
        console.log('[SubstanceDetail] Subscription ready but data not found, retrying in', retryDelay, 'ms...');
        setTimeout(tryLoadSubstance, retryDelay);
        return;
      }

      // After retries exhausted, fetch directly from server
      if (isSubscriptionReady) {
        console.log('[SubstanceDetail] Not found after', maxRetries, 'retries, fetching from server via method');
        Meteor.call('substances.get', id, function(methodError, serverSubstance) {
          if (cancelled) return;
          if (methodError) {
            console.error('[SubstanceDetail] Error fetching from server:', methodError);
            setError('Substance not found: ' + methodError.message);
          } else if (serverSubstance) {
            console.log('[SubstanceDetail] Loaded substance from server:', {
              _id: serverSubstance._id,
              codeText: get(serverSubstance, 'code.text'),
              status: get(serverSubstance, 'status')
            });
            setSubstance(serverSubstance);
            setSubstanceId(serverSubstance._id);
            setForm(extractFormFromSubstance(serverSubstance));
            setIsEditing(false);
            setError(null);
          } else {
            console.warn('[SubstanceDetail] Substance not found on server:', id);
            setError('Substance not found');
          }
        });
      }
    }

    tryLoadSubstance();

    return function() {
      cancelled = true;
    };
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(name, value) {
    pendingUpdate.current = true;
    var newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);

    // Also update the resource object
    setSubstance(function(prev) {
      var updated = Object.assign({}, prev);
      if (name === 'status') { set(updated, 'status', value); }
      if (name === 'codeText') { set(updated, 'code.text', value); }
      if (name === 'codeCode') { set(updated, 'code.coding[0].code', value); }
      if (name === 'codeDisplay') { set(updated, 'code.coding[0].display', value); }
      if (name === 'categoryCode') { set(updated, 'category[0].coding[0].code', value); }
      if (name === 'categoryDisplay') {
        set(updated, 'category[0].coding[0].display', value);
        set(updated, 'category[0].text', value);
      }
      if (name === 'description') { set(updated, 'description', value); }
      if (name === 'instanceIdentifier') { set(updated, 'instance[0].identifier.value', value); }
      if (name === 'instanceExpiry') { set(updated, 'instance[0].expiry', value); }
      if (name === 'instanceQuantityValue') { set(updated, 'instance[0].quantity.value', value); }
      if (name === 'instanceQuantityUnit') { set(updated, 'instance[0].quantity.unit', value); }
      if (name === 'ingredientCode') { set(updated, 'ingredient[0].substanceCodeableConcept.coding[0].code', value); }
      if (name === 'ingredientDisplay') { set(updated, 'ingredient[0].substanceCodeableConcept.coding[0].display', value); }
      if (name === 'ingredientNumeratorValue') { set(updated, 'ingredient[0].quantity.numerator.value', value); }
      if (name === 'ingredientNumeratorUnit') { set(updated, 'ingredient[0].quantity.numerator.unit', value); }
      if (name === 'ingredientDenominatorValue') { set(updated, 'ingredient[0].quantity.denominator.value', value); }
      if (name === 'ingredientDenominatorUnit') { set(updated, 'ingredient[0].quantity.denominator.unit', value); }
      return updated;
    });
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[SubstanceDetail] Saving substance:', {
      codeText: get(substance, 'code.text'),
      codeCode: get(substance, 'code.coding[0].code'),
      status: get(substance, 'status')
    });

    try {
      if (substanceId && substanceId !== 'new') {
        await Meteor.callAsync('substances.update', substanceId, substance);
        console.log('Substance updated successfully');
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('substances.create', substance);
        console.log('Substance created with ID:', newId);
        navigate('/substances');
      }
    } catch (err) {
      console.error('Error saving substance:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!substanceId || substanceId === 'new') return;

    if (window.confirm('Are you sure you want to delete this substance?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('substances.remove', substanceId);
        console.log('Substance deleted successfully');
        navigate('/substances');
      } catch (err) {
        console.error('Error deleting substance:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (substanceId && substanceId !== 'new') {
      setIsEditing(false);
      setError(null);
      var existingSubstance = Substances.findOne({_id: substanceId});
      if (existingSubstance) {
        setSubstance(existingSubstance);
        setForm(extractFormFromSubstance(existingSubstance));
      }
    } else {
      navigate('/substances');
    }
  }

  // Build the header title
  var headerTitle = 'New Substance';
  if (isExistingSubstance) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{substanceId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new substances */}
        {!isNewSubstance && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function(){ setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new substances (always form) */}
        {!isNewSubstance && (
          <Tooltip title="Form">
            <IconButton
              onClick={function(){ setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing substances */}
        {!isNewSubstance && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function(){ setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete -- only for existing substances, gated on edit mode */}
        {!isNewSubstance && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
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
  function renderFormView(){
    return (
      <>
        <SubstanceFormView
          resource={substance}
          form={form}
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
              id="saveSubstanceButton"
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
      <SubstancePreview
        resource={substance}
        form={form}
        resourceId={substanceId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="substanceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default SubstanceDetail;
