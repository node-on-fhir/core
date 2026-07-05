// imports/ui-fhir/claims/ClaimDetail.jsx

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
  Tooltip,
  Alert
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { get, set, cloneDeep } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import ClaimFormView from './ClaimFormView';
import ClaimPreview from './ClaimPreview';

//===========================================================================
// COMPONENT

function ClaimDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  // Initialize state with proper FHIR R4 structure
  const [claim, setClaim] = useState({
    resourceType: "Claim",
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
      coding: [
        {
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }
      ]
    },
    clinicalStatus: "active",
    verificationStatus: "confirmed",
    evidence: [],
    onsetDateTime: null
  });

  // Initialise from fhirResource prop when in embedded mode
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      setClaim(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(isEmbedded || isNewRecord);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Load existing claim data
  useEffect(function() {
    if (isNewRecord) {
      setIsEditing(true);
      // Set patient from Session if available
      if (selectedPatient) {
        var patientFhirId = get(selectedPatient, 'id');
        var patientDisplay = get(selectedPatient, 'name[0].text', '') ||
          (get(selectedPatient, 'name[0].given[0]', '') + ' ' + get(selectedPatient, 'name[0].family', '')).trim();

        setClaim(function(prev) {
          return {
            ...prev,
            patient: {
              reference: 'Patient/' + patientFhirId,
              display: patientDisplay
            }
          };
        });
      }
    } else if (isExistingRecord) {
      // Try to load from props first (legacy class component pattern)
      if (props.claim) {
        setClaim(props.claim);
        setIsEditing(false);
      }
    }
  }, [id, selectedPatient]);

  function handleChange(path, value) {
    pendingUpdate.current = true;
    var updated = cloneDeep(claim);
    set(updated, path, value);
    setClaim(updated);
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(claim);
    }
  }, [claim]);

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      var dataToSave = cloneDeep(claim);
      delete dataToSave._id;

      console.log('Saving claim:', dataToSave);

      if (isExistingRecord) {
        var mongoId = get(claim, '_id') || id;
        await Meteor.callAsync('updateClaim', mongoId, dataToSave);
        console.log('Claim updated successfully');
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('createClaim', dataToSave);
        console.log('Claim created with ID:', newId);
        navigate('/claims');
      }
    } catch (err) {
      console.error('Error saving claim:', err);
      setError(err.message || 'Failed to save claim');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this claim?')) {
      setLoading(true);
      setError(null);

      try {
        var mongoId = get(claim, '_id') || id;
        console.log('[handleDelete] Deleting claim with _id:', mongoId);
        await Meteor.callAsync('removeClaim', mongoId);
        navigate('/claims');
      } catch (err) {
        console.error('Error deleting claim:', err);
        setError(err.message || 'Failed to delete claim');
        setLoading(false);
      }
    }
  }

  function handleCancel() {
    if (isExistingRecord) {
      setIsEditing(false);
      // Reload from props if available
      if (props.claim) {
        setClaim(props.claim);
      }
    } else {
      navigate('/claims');
    }
  }

  // Build the header title
  let headerTitle = 'New Record';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Preview">
            <IconButton
              onClick={function() { setSearchParams({ view: 'page' }); }}
              sx={{
                color: viewMode === 'page' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Preview"
            >
              <ArticleIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Form toggle -- hidden for new records */}
        {isExistingRecord && (
          <Tooltip title="Form">
            <IconButton
              onClick={function() { setSearchParams({ view: 'form' }); }}
              sx={{
                color: viewMode === 'form' ? 'primary.main' : 'text.secondary'
              }}
              aria-label="Form"
            >
              <EditNoteIcon />
            </IconButton>
          </Tooltip>
        )}

        {/* Lock / Unlock toggle -- only for existing records */}
        {isExistingRecord && (
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
        {isExistingRecord && (
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

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <ClaimFormView
          resource={claim}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* Inline Save/Cancel bar */}
        {isEditing && !isEmbedded && (
          <Box sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            mt: 3,
            pt: 2,
            borderTop: 1,
            borderColor: 'divider'
          }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveClaimButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Preview view with formatted read-only display
  function renderPreviewView() {
    return (
      <ClaimPreview
        resource={claim}
        resourceId={id}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="claimDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ClaimDetail;
