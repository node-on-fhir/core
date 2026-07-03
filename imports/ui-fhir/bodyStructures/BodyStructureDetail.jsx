// imports/ui-fhir/bodyStructures/BodyStructureDetail.jsx

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
  Typography,
  IconButton,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';

import BodyStructureFormView from './BodyStructureFormView';
import BodyStructurePreview from './BodyStructurePreview';

export function BodyStructureDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const [bodyStructure, setBodyStructure] = useState({
    resourceType: 'BodyStructure',
    active: true,
    description: '',
    morphology: {},
    includedStructure: [],
    patient: {}
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setBodyStructure(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded || id === 'new' || !id);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.BodyStructures', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('bodystructures.all');
    }
    return handle.ready();
  }, []);

  // Load body structure data
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load from collection first
      const existingBodyStructure = BodyStructures.findOne({_id: id});

      if (existingBodyStructure) {
        setBodyStructure(existingBodyStructure);
        setIsEditing(false);
      } else {
        // Fallback: try by id field
        const byId = BodyStructures.findOne({id: id});
        if (byId) {
          setBodyStructure(byId);
          setIsEditing(false);
        }
      }
    } else {
      // New body structure - set patient from Session
      const selectedPatient = Session.get('selectedPatient');
      if (selectedPatient) {
        setBodyStructure(prev => ({
          ...prev,
          patient: {
            reference: 'Patient/' + get(selectedPatient, 'id', selectedPatient._id),
            display: get(selectedPatient, 'name.0.text',
              get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
          }
        }));
      }
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    pendingUpdate.current = true;
    setBodyStructure(prev => {
      const updated = { ...prev };
      set(updated, path, value);
      return updated;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(bodyStructure);
    }
  }, [bodyStructure]);


  function handleSearchPatient() {
    console.log('[BodyStructureDetail] Patient search clicked'); // phi-audit: ok
    // Could open a patient search dialog here
  }

  async function handleSave() {
    setIsLoading(true);
    setError(null);

    try {
      const dataToSave = {
        active: get(bodyStructure, 'active', true),
        description: get(bodyStructure, 'description', ''),
        morphology: get(bodyStructure, 'morphology.text', ''),
        morphologyCode: get(bodyStructure, 'morphology.coding.0.code', ''),
        structure: get(bodyStructure, 'includedStructure.0.structure.text', ''),
        structureCode: get(bodyStructure, 'includedStructure.0.structure.coding.0.code', ''),
        patient: get(bodyStructure, 'patient', {}),
        patientDisplay: get(bodyStructure, 'patient.display', ''),
        image: get(bodyStructure, 'image', null)
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('bodyStructures.update', id, dataToSave);
        console.log('[BodyStructureDetail] Body structure updated:', id);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('bodyStructures.insert', dataToSave);
        console.log('[BodyStructureDetail] Body structure created:', newId);
        navigate('/body-structures');
      }
    } catch (err) {
      console.error('[BodyStructureDetail] Error saving body structure:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this body structure?')) {
      Meteor.call('bodyStructures.remove', id, function(err) {
        if (err) {
          console.error('[BodyStructureDetail] Error deleting body structure:', err);
          setError(err.message);
        } else {
          console.log('[BodyStructureDetail] Body structure deleted:', id);
          navigate('/body-structures');
        }
      });
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      // Reload from collection
      const existingBodyStructure = BodyStructures.findOne({_id: id});
      if (existingBodyStructure) {
        setBodyStructure(existingBodyStructure);
      }
      setIsEditing(false);
      setError(null);
    } else {
      navigate('/body-structures');
    }
  }

  // Build header title
  let headerTitle = 'New Body Structure';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build header action buttons
  function renderHeaderActions() {
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
  function renderFormView() {
    return (
      <>
        <BodyStructureFormView
          resource={bodyStructure}
          form={bodyStructure}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchPatient}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveBodyStructureButton"
              onClick={handleSave}
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return <BodyStructurePreview resource={bodyStructure} form={bodyStructure} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="bodyStructureDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default BodyStructureDetail;
