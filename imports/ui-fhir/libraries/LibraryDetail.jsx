// imports/ui-fhir/libraries/LibraryDetail.jsx

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

import LibraryFormView from './LibraryFormView';
import LibraryPreview from './LibraryPreview';

function LibraryDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const [libraryId, setLibraryId] = useState(false);
  const [library, setLibrary] = useState({
    resourceType: 'Library',
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
  var isExistingRecord = libraryId && libraryId !== 'new';

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setLibrary(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // Subscribe to libraries
  var isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    var handle = Meteor.subscribe('autopublish.Libraries', {}, { limit: 1000 });
    return handle.ready();
  }, []);

  // Load record or initialize new one
  useEffect(function() {
    if (id && id !== 'new') {
      setLibraryId(id);
      setIsEditing(false);

      // Try to find the record in local collection
      if (typeof Libraries !== 'undefined') {
        var existing = Libraries.findOne({ _id: id }) || Libraries.findOne({ id: id });
        if (existing) {
          setLibrary(existing);
        }
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    var updated = Object.assign({}, library);
    set(updated, path, value);
    setLibrary(updated);

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
      var dataToSave = Object.assign({}, library);
      delete dataToSave._id;

      console.log('Saving Library:', dataToSave);

      if (libraryId && libraryId !== 'new') {
        await Meteor.callAsync('updateLibrary', libraryId, dataToSave);
        console.log('Library updated successfully');
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('createLibrary', dataToSave);
        console.log('Library created with ID:', newId);
        navigate('/libraries');
      }
    } catch (err) {
      console.error('Error saving library:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancelButton() {
    if (libraryId && libraryId !== 'new') {
      setIsEditing(false);
      setError(null);
      // Reload original data
      if (typeof Libraries !== 'undefined') {
        var existing = Libraries.findOne({ _id: libraryId });
        if (existing) {
          setLibrary(existing);
        }
      }
    } else {
      navigate('/libraries');
    }
  }

  // Handle delete
  async function handleDeleteButton() {
    if (!libraryId || libraryId === 'new') return;

    if (window.confirm('Are you sure you want to delete this library?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeLibrary', libraryId);
        console.log('Library deleted successfully');
        navigate('/libraries');
      } catch (err) {
        console.error('Error deleting library:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  var headerTitle = 'New Library';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{libraryId}</span>;
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
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete -- only for existing records, gated on edit mode */}
        {!isNewRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDeleteButton}
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
  function renderFormView() {
    return (
      <>
        <LibraryFormView
          resource={library}
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
              id="saveLibraryButton"
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
      <LibraryPreview
        resource={library}
        resourceId={libraryId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="libraryDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default LibraryDetail;
