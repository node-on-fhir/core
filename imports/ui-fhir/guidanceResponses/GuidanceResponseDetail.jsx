// imports/ui-fhir/guidanceResponses/GuidanceResponseDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

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

import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';

import GuidanceResponseFormView from './GuidanceResponseFormView';
import GuidanceResponsePreview from './GuidanceResponsePreview';

function GuidanceResponseDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const [guidanceResponseId, setGuidanceResponseId] = useState(false);
  const [guidanceResponse, setGuidanceResponse] = useState({
    resourceType: 'GuidanceResponse',
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
    clinicalStatus: '',
    verificationStatus: '',
    onsetDateTime: null
  });
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  var viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  var isNewRecord = !id || id === 'new';
  var isExistingRecord = guidanceResponseId && guidanceResponseId !== 'new';

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setGuidanceResponse(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // Subscribe to guidance responses
  var isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    var handle = Meteor.subscribe('autopublish.GuidanceResponses', {}, { limit: 1000 });
    return handle.ready();
  }, []);

  // Load record or initialize new one
  useEffect(function() {
    if (id && id !== 'new') {
      setGuidanceResponseId(id);
      setIsEditing(false);

      // Try to find the record in local collection
      if (typeof GuidanceResponses !== 'undefined') {
        var existing = GuidanceResponses.findOne({ _id: id }) || GuidanceResponses.findOne({ id: id });
        if (existing) {
          setGuidanceResponse(existing);
        }
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    var updated = Object.assign({}, guidanceResponse);
    set(updated, path, value);
    setGuidanceResponse(updated);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updated);
    }
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      var dataToSave = Object.assign({}, guidanceResponse);
      delete dataToSave._id;

      console.log('Saving GuidanceResponse:', dataToSave);

      if (guidanceResponseId && guidanceResponseId !== 'new') {
        await Meteor.callAsync('updateGuidanceResponse', guidanceResponseId, dataToSave);
        console.log('GuidanceResponse updated successfully');
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('createGuidanceResponse', dataToSave);
        console.log('GuidanceResponse created with ID:', newId);
        navigate('/guidance-responses');
      }
    } catch (err) {
      console.error('Error saving guidance response:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancelButton() {
    if (guidanceResponseId && guidanceResponseId !== 'new') {
      setIsEditing(false);
      setError(null);
      // Reload original data
      if (typeof GuidanceResponses !== 'undefined') {
        var existing = GuidanceResponses.findOne({ _id: guidanceResponseId });
        if (existing) {
          setGuidanceResponse(existing);
        }
      }
    } else {
      navigate('/guidance-responses');
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!guidanceResponseId || guidanceResponseId === 'new') return;

    if (window.confirm('Are you sure you want to delete this guidance response?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeGuidanceResponse', guidanceResponseId);
        console.log('GuidanceResponse deleted successfully');
        navigate('/guidance-responses');
      } catch (err) {
        console.error('Error deleting guidance response:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  var headerTitle = 'New Guidance Response';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{guidanceResponseId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {!isNewRecord && (
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

        {/* Form toggle -- hidden for new records (always form) */}
        {!isNewRecord && (
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

        {/* Lock / Unlock toggle -- only for existing records */}
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

        {/* Delete -- only for existing records, gated on edit mode */}
        {!isNewRecord && (
          <Button
              id="deleteButton"
              onClick={handleDeleteButton}
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
  function renderFormView() {
    return (
      <>
        <GuidanceResponseFormView
          resource={guidanceResponse}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveGuidanceResponseButton"
              onClick={handleSaveButton}
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
      <GuidanceResponsePreview
        resource={guidanceResponse}
        resourceId={guidanceResponseId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="guidanceResponseDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default GuidanceResponseDetail;
