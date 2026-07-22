// imports/ui-fhir/evidences/EvidenceDetail.jsx

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

import EvidenceFormView from './EvidenceFormView';
import EvidencePreview from './EvidencePreview';

// Direct import
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';

function EvidenceDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const [evidence, setEvidence] = useState({
    resourceType: "Evidence",
    patient: {
      reference: "",
      display: ""
    },
    asserter: {
      reference: "",
      display: ""
    },
    dateRecorded: null,
    code: {
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    },
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    evidence: [],
    onsetDateTime: null
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setEvidence(function(prev) {
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

  const isNewEvidence = !id || id === 'new';
  const isExistingEvidence = id && id !== 'new';

  // Subscribe to evidences
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if (autoSubscribeEnabled) {
      return Meteor.subscribe('autopublish.Evidences', {}, { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('evidences.all').ready();
    }
  }, []);

  // Load evidence data when subscription is ready
  useEffect(function() {
    if (id && id !== 'new' && isSubscriptionReady) {
      let existingEvidence = Evidences.findOne({ _id: id });

      if (!existingEvidence) {
        async function loadViaMethod() {
          try {
            // rpc-migration: ddp-straggler
            const result = await Meteor.callAsync('evidences.findOne', id);
            if (result) {
              setEvidence(result);
            }
          } catch (err) {
            console.error('[EvidenceDetail] Error loading evidence via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
      } else {
        setEvidence(existingEvidence);
      }

      setIsEditing(false);
    } else if (!id || id === 'new') {
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedEvidence = { ...evidence };
    set(updatedEvidence, path, value);
    setEvidence(updatedEvidence);

    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedEvidence);
    }
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingEvidence) {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('evidences.update', id, evidence);
        console.log('[EvidenceDetail] Evidence updated successfully');
        setIsEditing(false);
      } else {
        // rpc-migration: ddp-straggler
        const newId = await Meteor.callAsync('evidences.create', evidence);
        console.log('[EvidenceDetail] Evidence created with ID:', newId);
        navigate('/evidences');
      }
    } catch (err) {
      console.error('[EvidenceDetail] Error saving evidence:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingEvidence) {
      setIsEditing(false);
      setError(null);
      const existingEvidence = Evidences.findOne({ _id: id });
      if (existingEvidence) {
        setEvidence(existingEvidence);
      } else {
        async function reloadEvidence() {
          try {
            // rpc-migration: ddp-straggler
            const result = await Meteor.callAsync('evidences.findOne', id);
            if (result) {
              setEvidence(result);
            }
          } catch (err) {
            console.error('[EvidenceDetail] Error reloading evidence:', err);
          }
        }
        reloadEvidence();
      }
    } else {
      navigate('/evidences');
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingEvidence) return;

    if (window.confirm('Are you sure you want to delete this evidence?')) {
      setLoading(true);
      try {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('evidences.remove', id);
        console.log('[EvidenceDetail] Evidence deleted successfully');
        navigate('/evidences');
      } catch (err) {
        console.error('[EvidenceDetail] Error deleting evidence:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Evidence';
  if (isExistingEvidence) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewEvidence && (
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
        {!isNewEvidence && (
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
        {!isNewEvidence && (
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
        {!isNewEvidence && (
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
  function renderFormView() {
    return (
      <>
        <EvidenceFormView
          resource={evidence}
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
              id="saveEvidenceButton"
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
    return <EvidencePreview resource={evidence} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="evidenceDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default EvidenceDetail;
