// /imports/ui-fhir/operationOutcomes/OperationOutcomeDetail.jsx

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

import OperationOutcomeFormView from './OperationOutcomeFormView';
import OperationOutcomePreview from './OperationOutcomePreview';

// Attempt to import collection; may not exist in all configurations
var OperationOutcomes;
try {
  OperationOutcomes = require('/imports/lib/schemas/SimpleSchemas/OperationOutcomes').OperationOutcomes;
} catch (e) {
  console.warn('[OperationOutcomeDetail] OperationOutcomes collection not available');
}

function OperationOutcomeDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  // Subscribe to operation outcome data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    if (id && id !== 'new') {
      const handle = Meteor.subscribe('autopublish.OperationOutcomes', {}, {});
      return handle.ready();
    }
    return true;
  }, [id]);

  // Initialize state with proper FHIR R4 structure
  const [operationOutcome, setOperationOutcome] = useState({
    resourceType: "OperationOutcome",
    issue: [{
      severity: "",
      code: "",
      diagnostics: "",
      details: {
        coding: [{
          system: "",
          code: "",
          display: ""
        }],
        text: ""
      },
      expression: [""],
      location: [""]
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setOperationOutcome(function(prev) {
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

  const isNewOutcome = !id || id === 'new';
  const isExistingOutcome = id && id !== 'new';

  // Set default values on component mount
  useEffect(function() {
    if (!id || id === 'new') {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [id]);

  // Load operation outcome from collection
  useEffect(function() {
    if (id && id !== 'new' && OperationOutcomes) {
      console.log('[OperationOutcomeDetail] Loading operation outcome from collection');
      var existingOutcome = OperationOutcomes.findOne({_id: id});
      if (!existingOutcome) {
        existingOutcome = OperationOutcomes.findOne({id: id});
      }

      if (existingOutcome) {
        console.log('[OperationOutcomeDetail] Loaded operation outcome:', existingOutcome._id);
        setOperationOutcome(existingOutcome);
        setIsEditing(false);
      } else {
        console.warn('[OperationOutcomeDetail] Operation outcome not found:', id);
        setError('Operation outcome not found');
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    var updatedOutcome = { ...operationOutcome };
    set(updatedOutcome, path, value);
    setOperationOutcome(updatedOutcome);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedOutcome);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    console.log('[OperationOutcomeDetail] Saving operation outcome:', operationOutcome);

    try {
      if (isExistingOutcome) {
        await Meteor.callAsync('operationOutcomes.update', id, operationOutcome);
        console.log('[OperationOutcomeDetail] Operation outcome updated successfully');
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('operationOutcomes.create', operationOutcome);
        console.log('[OperationOutcomeDetail] Operation outcome created with ID:', newId);
        navigate('/operation-outcomes');
      }
    } catch (err) {
      console.error('[OperationOutcomeDetail] Error saving operation outcome:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingOutcome) return;

    if (window.confirm('Are you sure you want to delete this operation outcome?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('operationOutcomes.remove', id);
        console.log('[OperationOutcomeDetail] Operation outcome deleted successfully');
        navigate('/operation-outcomes');
      } catch (err) {
        console.error('[OperationOutcomeDetail] Error deleting operation outcome:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingOutcome) {
      setIsEditing(false);
      setError(null);
      if (OperationOutcomes) {
        var existingOutcome = OperationOutcomes.findOne({_id: id});
        if (existingOutcome) {
          setOperationOutcome(existingOutcome);
        }
      }
    } else {
      navigate('/operation-outcomes');
    }
  }

  // Build the header title
  var headerTitle = 'New OperationOutcome';
  if (isExistingOutcome) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle - hidden for new outcomes */}
        {!isNewOutcome && (
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

        {/* Form toggle - hidden for new outcomes (always form) */}
        {!isNewOutcome && (
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

        {/* Lock / Unlock toggle - only for existing outcomes */}
        {!isNewOutcome && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete - only for existing outcomes, gated on edit mode */}
        {!isNewOutcome && (
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
        <OperationOutcomeFormView
          resource={operationOutcome}
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
              id="saveOperationOutcomeButton"
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
    return <OperationOutcomePreview resource={operationOutcome} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="operationOutcomeDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default OperationOutcomeDetail;
