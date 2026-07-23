// imports/ui-fhir/artifactAssessments/ArtifactAssessmentDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Alert
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ArtifactAssessmentFormView from './ArtifactAssessmentFormView';
import ArtifactAssessmentPreview from './ArtifactAssessmentPreview';

function ArtifactAssessmentDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [artifactAssessment, setArtifactAssessment] = useState({
    resourceType: 'ArtifactAssessment',
    patient: {
      reference: '',
      display: ''
    },
    asserter: {
      reference: '',
      display: ''
    },
    code: {
      coding: [{
        system: 'http://snomed.info/sct',
        code: '',
        display: ''
      }]
    },
    clinicalStatus: 'active',
    verificationStatus: 'confirmed',
    onsetDateTime: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setArtifactAssessment(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewRecord = !id || id === 'new';

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('autopublish.ArtifactAssessments', {}, {});
    } else {
      handle = Meteor.subscribe('autopublish.ArtifactAssessments', {}, {});
    }
    return handle.ready();
  }, []);

  useEffect(function() {
    if (id && id !== 'new') {
      // Try to find by _id first, then fall back to FHIR id
      let ArtifactAssessments = get(Meteor, 'Collections.ArtifactAssessments');
      if (ArtifactAssessments) {
        let existing = ArtifactAssessments.findOne({ _id: id });
        if (!existing) {
          existing = ArtifactAssessments.findOne({ id: id });
        }
        if (existing) {
          setArtifactAssessment(existing);
          setIsEditing(false);
        }
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    const updated = Object.assign({}, artifactAssessment);
    set(updated, path, value);
    setArtifactAssessment(updated);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updated);
    }
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        patient: artifactAssessment.patient,
        asserter: artifactAssessment.asserter,
        code: artifactAssessment.code,
        clinicalStatus: artifactAssessment.clinicalStatus,
        verificationStatus: artifactAssessment.verificationStatus,
        onsetDateTime: artifactAssessment.onsetDateTime
      };

      if (id && id !== 'new') {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('artifactAssessments.update', id, dataToSave);
        setIsEditing(false);
      } else {
        // rpc-migration: ddp-straggler
        const newId = await Meteor.callAsync('artifactAssessments.insert', dataToSave);
        navigate('/artifact-assessments');
      }
    } catch (err) {
      console.error('[ArtifactAssessmentDetail] Error saving:', err);
      setError(err.message || 'Failed to save artifact assessment');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this artifact assessment?')) {
      setLoading(true);
      try {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('artifactAssessments.remove', id);
        navigate('/artifact-assessments');
      } catch (err) {
        console.error('[ArtifactAssessmentDetail] Error deleting:', err);
        setError(err.message || 'Failed to delete artifact assessment');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      let ArtifactAssessments = get(Meteor, 'Collections.ArtifactAssessments');
      if (ArtifactAssessments) {
        const existing = ArtifactAssessments.findOne({ _id: id });
        if (existing) {
          setArtifactAssessment(existing);
        }
      }
      setIsEditing(false);
    } else {
      navigate('/artifact-assessments');
    }
  }

  // Build the header title
  let headerTitle = 'New Artifact Assessment';
  if (!isNewRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
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

        {/* Form toggle */}
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

        {/* Lock / Unlock toggle */}
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

        {/* Delete */}
        {!isNewRecord && (
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
  function renderFormView(){
    return (
      <>
        <ArtifactAssessmentFormView
          resource={artifactAssessment}
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
              id="saveArtifactAssessmentButton"
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
      <ArtifactAssessmentPreview
        resource={artifactAssessment}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="artifactAssessmentDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
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

export default ArtifactAssessmentDetail;
