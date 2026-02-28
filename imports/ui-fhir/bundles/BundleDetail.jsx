// imports/ui-fhir/bundles/BundleDetail.jsx

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
import { Session } from 'meteor/session';

import BundleFormView from './BundleFormView';
import BundlePreview from './BundlePreview';

// Get the Bundles collection from Meteor.Collections
let Bundles;
Meteor.startup(function(){
  if (Meteor.Collections && Meteor.Collections.Bundles) {
    Bundles = Meteor.Collections.Bundles;
  }
});

function BundleDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const [bundle, setBundle] = useState({
    resourceType: 'Bundle',
    type: '',
    timestamp: '',
    total: 0,
    identifier: { value: '' },
    entry: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setBundle(function(prev) {
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

  const isNewBundle = !id || id === 'new';
  const isExistingBundle = id && id !== 'new';

  // Subscribe to bundles
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if (autoSubscribeEnabled) {
      return Meteor.subscribe('autopublish.Bundles', {}, { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('bundles.all').ready();
    }
  }, []);

  // Load bundle data
  useEffect(function() {
    if (id && id !== 'new' && Bundles) {
      let existingBundle = Bundles.findOne({ _id: id });

      if (!existingBundle) {
        existingBundle = Bundles.findOne({ id: id });
      }

      if (existingBundle) {
        setBundle(existingBundle);
        setIsEditing(false);
      }
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    pendingUpdate.current = true;
    setBundle(function(prev) {
      var updated = JSON.parse(JSON.stringify(prev));
      set(updated, path, value);
      return updated;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(bundle);
    }
  }, [bundle]);

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingBundle) {
        await Meteor.callAsync('bundles.update', id, bundle);
        console.log('[BundleDetail] Bundle updated:', id);
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('bundles.insert', bundle);
        console.log('[BundleDetail] Bundle created:', newId);
        navigate('/bundles');
      }
    } catch (err) {
      console.error('[BundleDetail] Error saving bundle:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingBundle) {
      setIsEditing(false);
      setError(null);
      if (Bundles) {
        var existingBundle = Bundles.findOne({ _id: id });
        if (existingBundle) {
          setBundle(existingBundle);
        }
      }
    } else {
      navigate('/bundles');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingBundle) return;

    if (window.confirm('Are you sure you want to delete this bundle?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('bundles.remove', id);
        console.log('[BundleDetail] Bundle deleted:', id);
        navigate('/bundles');
      } catch (err) {
        console.error('[BundleDetail] Error deleting bundle:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build header title
  var headerTitle = 'New Bundle';
  if (isExistingBundle) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewBundle && (
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
        {!isNewBundle && (
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
        {!isNewBundle && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete */}
        {!isNewBundle && (
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
  function renderFormView() {
    return (
      <>
        <BundleFormView
          resource={bundle}
          form={bundle}
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
              id="saveBundleButton"
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
    return <BundlePreview resource={bundle} form={bundle} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="bundleDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default BundleDetail;
