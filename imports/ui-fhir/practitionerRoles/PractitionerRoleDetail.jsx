// /imports/ui-fhir/practitionerRoles/PractitionerRoleDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Typography,
  Box,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';

import { get, set } from 'lodash';

import PractitionerRoleFormView from './PractitionerRoleFormView';
import PractitionerRolePreview from './PractitionerRolePreview';


//=============================================================================================================================================
// MAIN COMPONENT

function PractitionerRoleDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewPractitionerRole = !id || id === 'new';
  const isExistingPractitionerRole = id && id !== 'new';

  // State
  const [practitionerRole, setPractitionerRole] = useState({
    resourceType: 'PractitionerRole',
    active: true,
    practitioner: { reference: '', display: '' },
    organization: { reference: '', display: '' },
    code: [{
      coding: [{ system: '', code: '', display: '' }],
      text: ''
    }],
    specialty: [{
      coding: [{ system: '', code: '', display: '' }],
      text: ''
    }],
    location: [],
    healthcareService: [],
    telecom: [
      { system: 'phone', value: '', use: 'work' },
      { system: 'email', value: '', use: 'work' }
    ],
    period: { start: '', end: '' },
    availabilityExceptions: ''
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setPractitionerRole(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  // onResourceChange: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(practitionerRole);
    }
  }, [practitionerRole]);

  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to necessary collections
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.PractitionerRoles', {}, {});
    } else {
      handle = Meteor.subscribe('practitionerRoles.all');
    }
    return handle.ready();
  }, []);

  // Load existing practitioner role if editing
  useEffect(function() {
    if (isExistingPractitionerRole) {
      const existingRole = PractitionerRoles.findOne({ _id: id }) || PractitionerRoles.findOne({ id: id });
      if (existingRole) {
        setPractitionerRole(existingRole);
        setIsEditing(false);
      }
    } else if (isNewPractitionerRole) {
      setIsEditing(true);
    }
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    pendingUpdate.current = true;
    var updatedRole = { ...practitionerRole };
    set(updatedRole, path, value);
    setPractitionerRole(updatedRole);

    if (props.onResourceChange) {
      props.onResourceChange(updatedRole);
    }
  }

  function handleSave() {
    setIsLoading(true);
    setError(null);

    var dataToSave = practitionerRole;

    if (isExistingPractitionerRole) {
      Meteor.call('practitionerRoles.update', id, dataToSave, function(error, result) {
        setIsLoading(false);
        if (error) {
          console.error('[PractitionerRoleDetail] Error updating practitioner role:', error);
          setError(error.message);
        } else {
          console.log('[PractitionerRoleDetail] PractitionerRole updated successfully');
          setIsEditing(false);
          var updatedRole = PractitionerRoles.findOne({ _id: id });
          if (updatedRole) {
            setPractitionerRole(updatedRole);
          }
        }
      });
    } else {
      Meteor.call('practitionerRoles.create', dataToSave, function(error, result) {
        setIsLoading(false);
        if (error) {
          console.error('[PractitionerRoleDetail] Error creating practitioner role:', error);
          setError(error.message);
        } else {
          console.log('[PractitionerRoleDetail] PractitionerRole created successfully:', result);
          navigate('/practitioner-roles');
        }
      });
    }
  }

  function handleDelete() {
    if (!isExistingPractitionerRole) return;

    if (window.confirm('Are you sure you want to delete this practitioner role?')) {
      setIsLoading(true);
      Meteor.call('practitionerRoles.remove', id, function(error, result) {
        setIsLoading(false);
        if (error) {
          console.error('[PractitionerRoleDetail] Error deleting practitioner role:', error);
          setError(error.message);
        } else {
          console.log('[PractitionerRoleDetail] PractitionerRole deleted successfully');
          navigate('/practitioner-roles');
        }
      });
    }
  }

  function handleCancel() {
    if (isExistingPractitionerRole) {
      setIsEditing(false);
      setError(null);
      var existingRole = PractitionerRoles.findOne({ _id: id });
      if (existingRole) {
        setPractitionerRole(existingRole);
      }
    } else {
      navigate('/practitioner-roles');
    }
  }

  // Build the header title
  let headerTitle = 'New Practitioner Role';
  if (isExistingPractitionerRole) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewPractitionerRole && (
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

        {/* Form toggle */}
        {!isNewPractitionerRole && (
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

        {/* Lock / Unlock toggle */}
        {!isNewPractitionerRole && (
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
        {!isNewPractitionerRole && (
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
        <PractitionerRoleFormView
          resource={practitionerRole}
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
              id="savePractitionerRoleButton"
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
    return (
      <PractitionerRolePreview
        resource={practitionerRole}
        resourceId={isExistingPractitionerRole ? id : null}
        embedded={isEmbedded}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="practitionerRoleDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default PractitionerRoleDetail;
