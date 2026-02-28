// imports/ui-fhir/basics/BasicDetail.jsx

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

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

import BasicFormView from './BasicFormView';
import BasicPreview from './BasicPreview';

function BasicDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [basic, setBasic] = useState({
    resourceType: 'Basic',
    title: '',
    publisher: '',
    version: '',
    status: '',
    description: '',
    identifier: [{
      value: ''
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setBasic(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // Also accept legacy 'basic' prop for backwards compatibility
  useEffect(function() {
    if (props.basic && !isEmbedded) {
      setBasic(props.basic);
    }
  }, [props.basic]);

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
      handle = Meteor.subscribe('autopublish.Basics', {}, {});
    } else {
      handle = Meteor.subscribe('autopublish.Basics', {}, {});
    }
    return handle.ready();
  }, []);

  useEffect(function() {
    if (id && id !== 'new') {
      let Basics = get(Meteor, 'Collections.Basics');
      if (Basics) {
        let existing = Basics.findOne({ _id: id });
        if (!existing) {
          existing = Basics.findOne({ id: id });
        }
        if (existing) {
          setBasic(existing);
          setIsEditing(false);
        }
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    const updated = Object.assign({}, basic);
    set(updated, path, value);
    setBasic(updated);

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
        title: basic.title,
        publisher: basic.publisher,
        version: basic.version,
        status: basic.status,
        description: basic.description,
        identifier: basic.identifier
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('basics.update', id, dataToSave);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('basics.insert', dataToSave);
        navigate('/basics');
      }
    } catch (err) {
      console.error('[BasicDetail] Error saving:', err);
      setError(err.message || 'Failed to save basic resource');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('basics.remove', id);
        navigate('/basics');
      } catch (err) {
        console.error('[BasicDetail] Error deleting:', err);
        setError(err.message || 'Failed to delete basic resource');
      } finally {
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      let Basics = get(Meteor, 'Collections.Basics');
      if (Basics) {
        const existing = Basics.findOne({ _id: id });
        if (existing) {
          setBasic(existing);
        }
      }
      setIsEditing(false);
    } else {
      navigate('/basics');
    }
  }

  // Build the header title
  let headerTitle = 'New Basic Resource';
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
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle */}
        {!isNewRecord && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete */}
        {!isNewRecord && (
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
        <BasicFormView
          resource={basic}
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
              id="saveBasicButton"
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
      <BasicPreview
        resource={basic}
        resourceId={id}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="basicDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default BasicDetail;
