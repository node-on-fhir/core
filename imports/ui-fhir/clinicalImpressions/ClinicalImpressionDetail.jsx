// imports/ui-fhir/clinicalImpressions/ClinicalImpressionDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
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

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set, cloneDeep } from 'lodash';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';

import ClinicalImpressionFormView from './ClinicalImpressionFormView';
import ClinicalImpressionPreview from './ClinicalImpressionPreview';

//===========================================================================
// COMPONENT

export function ClinicalImpressionDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  const [clinicalImpression, setClinicalImpression] = useState({
    resourceType: 'ClinicalImpression',
    status: 'in-progress',
    description: '',
    summary: '',
    subject: {},
    assessor: {},
    date: new Date().toISOString().split('T')[0],
    effectiveDateTime: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setClinicalImpression(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded || isNewRecord);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.ClinicalImpressions', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('clinicalimpressions.all');
    }
    return handle.ready();
  }, []);

  // Load clinical impression data
  useEffect(function() {
    if (isExistingRecord) {
      // Try to load from collection first
      var existingClinicalImpression = ClinicalImpressions.findOne({_id: id});

      if (existingClinicalImpression) {
        setClinicalImpression(existingClinicalImpression);
        setIsEditing(false);
      } else {
        // Fallback: try by id field
        var byId = ClinicalImpressions.findOne({id: id});
        if (byId) {
          setClinicalImpression(byId);
          setIsEditing(false);
        }
      }
    } else {
      // New clinical impression - set patient from Session
      var selectedPatient = Session.get('selectedPatient');
      if (selectedPatient) {
        setClinicalImpression(function(prev) {
          return {
            ...prev,
            subject: {
              reference: 'Patient/' + get(selectedPatient, 'id', selectedPatient._id),
              display: get(selectedPatient, 'name.0.text',
                get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
            }
          };
        });
      }
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    pendingUpdate.current = true;
    var updated = cloneDeep(clinicalImpression);
    set(updated, path, value);
    setClinicalImpression(updated);
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(clinicalImpression);
    }
  }, [clinicalImpression]);

  async function handleSave() {
    setIsLoading(true);
    setError(null);

    try {
      var dataToSave = {
        status: get(clinicalImpression, 'status', 'in-progress'),
        description: get(clinicalImpression, 'description', ''),
        summary: get(clinicalImpression, 'summary', ''),
        subject: get(clinicalImpression, 'subject', {}),
        subjectDisplay: get(clinicalImpression, 'subject.display', ''),
        assessor: get(clinicalImpression, 'assessor', {}),
        assessorDisplay: get(clinicalImpression, 'assessor.display', ''),
        date: get(clinicalImpression, 'date', ''),
        effectiveDateTime: get(clinicalImpression, 'effectiveDateTime', '')
      };

      if (isExistingRecord) {
        await Meteor.callAsync('clinicalImpressions.update', id, dataToSave);
        console.log('Clinical impression updated:', id);
        setIsEditing(false);
      } else {
        var newId = await Meteor.callAsync('clinicalImpressions.insert', dataToSave);
        console.log('Clinical impression created:', newId);
        navigate('/clinical-impressions');
      }
    } catch (err) {
      console.error('Error saving clinical impression:', err);
      setError(err.message || 'Error saving clinical impression');
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this clinical impression?')) {
      setIsLoading(true);
      setError(null);

      Meteor.call('clinicalImpressions.remove', id, function(err) {
        if (err) {
          console.error('Error deleting clinical impression:', err);
          setError(err.message || 'Error deleting clinical impression');
          setIsLoading(false);
        } else {
          console.log('Clinical impression deleted:', id);
          navigate('/clinical-impressions');
        }
      });
    }
  }

  function handleCancel() {
    if (isExistingRecord) {
      // Reload from collection
      var existingClinicalImpression = ClinicalImpressions.findOne({_id: id});
      if (existingClinicalImpression) {
        setClinicalImpression(existingClinicalImpression);
      }
      setIsEditing(false);
    } else {
      navigate('/clinical-impressions');
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
        <ClinicalImpressionFormView
          resource={clinicalImpression}
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
              id="saveClinicalImpressionButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </Box>
    );
  }

  // Preview view with formatted read-only display
  function renderPreviewView() {
    return (
      <ClinicalImpressionPreview
        resource={clinicalImpression}
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
    <Container id="clinicalImpressionDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ClinicalImpressionDetail;
