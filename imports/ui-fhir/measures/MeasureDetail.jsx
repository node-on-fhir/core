// /imports/ui-fhir/measures/MeasureDetail.jsx

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

import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import MeasureFormView from './MeasureFormView';
import MeasurePreview from './MeasurePreview';

function MeasureDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewMeasure = !id || id === 'new';
  const isExistingMeasure = id && id !== 'new';

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to Measures
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.Measures', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('measures.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [measure, setMeasure] = useState({
    resourceType: "Measure",
    identifier: [{
      system: "http://example.org/measure-identifiers",
      value: ""
    }],
    version: "1.0.0",
    name: "",
    title: "",
    status: "draft",
    experimental: false,
    date: moment().format('YYYY-MM-DD'),
    publisher: "",
    description: "",
    purpose: "",
    usage: "",
    copyright: "",
    approvalDate: "",
    lastReviewDate: "",
    effectivePeriod: {
      start: "",
      end: ""
    },
    author: [{
      name: "",
      reference: ""
    }],
    scoring: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/measure-scoring",
        code: "proportion",
        display: "Proportion"
      }]
    },
    improvementNotation: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/measure-improvement-notation",
        code: "increase",
        display: "Increased score indicates improvement"
      }]
    },
    guidance: "",
    rateAggregation: "",
    clinicalRecommendationStatement: "",
    disclaimer: "",
    riskAdjustment: "",
    rationale: ""
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMeasure(function(prev) {
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

  // Set author on component mount for new measures
  useEffect(function() {
    if (isNewMeasure) {
      // Enable editing for new measures
      setIsEditing(true);

      // Set author to current user
      let authorName = '';
      let authorReference = '';

      if (currentUser) {
        authorName = get(currentUser, 'profile.name.text', '') ||
                    `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                    get(currentUser, 'username', '');
        authorReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setMeasure(prev => ({
        ...prev,
        publisher: authorName,
        author: [{
          name: authorName,
          reference: authorReference
        }]
      }));
    }
  }, [id, currentUser]);

  // Load measure if editing existing
  useEffect(function() {
    if (isExistingMeasure) {
      const existingMeasure = Measures.findOne({_id: id}) || Measures.findOne({id: id});
      if (existingMeasure) {
        setMeasure(existingMeasure);
        setIsEditing(false);
      }
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedMeasure = { ...measure };
    set(updatedMeasure, path, value);
    setMeasure(updatedMeasure);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedMeasure);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        identifier: get(measure, 'identifier[0].value', ''),
        version: get(measure, 'version', ''),
        name: get(measure, 'name', ''),
        title: get(measure, 'title', ''),
        status: get(measure, 'status', ''),
        description: get(measure, 'description', ''),
        purpose: get(measure, 'purpose', ''),
        usage: get(measure, 'usage', ''),
        copyright: get(measure, 'copyright', ''),
        approvalDate: get(measure, 'approvalDate', ''),
        lastReviewDate: get(measure, 'lastReviewDate', ''),
        effectivePeriodStart: get(measure, 'effectivePeriod.start', ''),
        effectivePeriodEnd: get(measure, 'effectivePeriod.end', ''),
        guidance: get(measure, 'guidance', ''),
        improvementNotation: get(measure, 'improvementNotation.coding[0].code', ''),
        rateAggregation: get(measure, 'rateAggregation', ''),
        clinicalRecommendationStatement: get(measure, 'clinicalRecommendationStatement', ''),
        disclaimer: get(measure, 'disclaimer', ''),
        riskAdjustment: get(measure, 'riskAdjustment', ''),
        rationale: get(measure, 'rationale', '')
      };

      if (isExistingMeasure) {
        // Update existing measure
        await Meteor.callAsync('updateMeasure', id, dataToSave);
        console.log('[MeasureDetail] Measure updated successfully');
        // Exit edit mode after successful save
        setIsEditing(false);
      } else {
        // Create new measure
        const newId = await Meteor.callAsync('createMeasure', dataToSave);
        console.log('[MeasureDetail] Measure created with ID:', newId);
        // Navigate back to measures list for new measures
        navigate('/measures');
      }
    } catch (err) {
      console.error('[MeasureDetail] Error saving measure:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingMeasure) return;

    if (window.confirm('Are you sure you want to delete this measure?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeMeasure', id);
        console.log('[MeasureDetail] Measure deleted successfully');
        navigate('/measures');
      } catch (err) {
        console.error('[MeasureDetail] Error deleting measure:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingMeasure) {
      setIsEditing(false);
      setError(null);
      // Reload the measure to discard changes
      const existingMeasure = Measures.findOne({_id: id}) || Measures.findOne({id: id});
      if (existingMeasure) {
        setMeasure(existingMeasure);
      }
    } else {
      navigate('/measures');
    }
  }

  // Build the header title
  let headerTitle = 'New Measure';
  if (isExistingMeasure) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new measures */}
        {!isNewMeasure && (
          <Tooltip title="Preview">
            <IconButton
              onClick={() => setSearchParams({ view: 'page' })}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle - hidden for new measures */}
        {!isNewMeasure && (
          <Tooltip title="Form">
            <IconButton
              onClick={() => setSearchParams({ view: 'form' })}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewMeasure && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - always available for existing measures */}
        {!isNewMeasure && (
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
        <MeasureFormView
          resource={measure}
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
              id="saveMeasureButton"
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
      <MeasurePreview
        resource={measure}
        resourceId={isExistingMeasure ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="measureDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default MeasureDetail;
