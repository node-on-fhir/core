// imports/ui-fhir/familyMemberHistories/FamilyMemberHistoryDetail.jsx

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

import PatientSearchDialog from '/imports/components/PatientSearchDialog';

import FamilyMemberHistoryFormView from './FamilyMemberHistoryFormView';
import FamilyMemberHistoryPreview from './FamilyMemberHistoryPreview';

// Direct imports
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';

//=============================================================================================================================================
// COMPONENT

function FamilyMemberHistoryDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  // Subscribe to data
  const subscriptionReady = useTracker(function() {
    if (isEmbedded) return true;
    var familyMemberHistoriesHandle = Meteor.subscribe('familyMemberHistories.all');
    var patientsHandle = Meteor.subscribe('patients.search', {});
    return familyMemberHistoriesHandle.ready() && patientsHandle.ready();
  }, []);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  // State
  const [familyMemberHistory, setFamilyMemberHistory] = useState({
    resourceType: "FamilyMemberHistory",
    status: "partial",
    patient: {
      reference: "",
      display: ""
    },
    relationship: {
      coding: [{
        system: "http://terminology.hl7.org/CodeSystem/v3-RoleCode",
        code: "",
        display: ""
      }],
      text: ""
    },
    name: "",
    bornDate: "",
    ageAge: {
      value: null,
      unit: "years"
    },
    deceasedBoolean: false,
    deceasedAge: {
      value: null,
      unit: "years"
    },
    condition: []
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setFamilyMemberHistory(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [isEditing, setIsEditing] = useState(isEmbedded || id === 'new');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchUserDialogOpen, setSearchUserDialogOpen] = useState(false);

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  // Load existing record on mount
  useEffect(function() {
    if (id && id !== 'new' && subscriptionReady) {
      var existingFamilyMemberHistory = FamilyMemberHistories.findOne({ _id: id });
      if (existingFamilyMemberHistory) {
        setFamilyMemberHistory(existingFamilyMemberHistory);
        setIsEditing(false);
      }
    }
  }, [id, subscriptionReady]);

  // Set patient reference from session
  useEffect(function() {
    if (selectedPatient && id === 'new') {
      setFamilyMemberHistory(function(prev) {
        return {
          ...prev,
          patient: {
            reference: 'Patient/' + get(selectedPatient, 'id', ''),
            display: get(selectedPatient, 'name.0.text', '') ||
                     (get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
          }
        };
      });
    }
  }, [selectedPatient, id]);

  // Handlers
  function handleChange(path, value) {
    pendingUpdate.current = true;
    setFamilyMemberHistory(function(prev) {
      var updated = { ...prev };
      set(updated, path, value);
      return updated;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(familyMemberHistory);
    }
  }, [familyMemberHistory]);

  function handleSearchUser() {
    setSearchUserDialogOpen(true);
  }

  function handlePatientSelect(patient) {
    setFamilyMemberHistory(function(prev) {
      return {
        ...prev,
        patient: {
          reference: 'Patient/' + get(patient, 'id', ''),
          display: get(patient, 'name.0.text', '') ||
                   (get(patient, 'name.0.given.0', '') + ' ' + get(patient, 'name.0.family', ''))
        }
      };
    });
    setSearchUserDialogOpen(false);
  }

  async function handleSaveButton() {
    setIsLoading(true);
    setError(null);

    try {
      var dataToSave = { ...familyMemberHistory };

      // Ensure required fields
      if (!dataToSave.status) dataToSave.status = "partial";
      if (!dataToSave.patient.reference && selectedPatient) {
        dataToSave.patient = {
          reference: 'Patient/' + get(selectedPatient, 'id', ''),
          display: get(selectedPatient, 'name.0.text', '') ||
                   (get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
        };
      }

      if (isExistingRecord) {
        await Meteor.rpc('familyMemberHistories.update', { familyMemberHistoryId: id, familyMemberHistoryData: dataToSave });
        setIsEditing(false);
      } else {
        var newId = await Meteor.rpc('familyMemberHistories.create', dataToSave);
        navigate('/family-member-histories');
      }
    } catch (err) {
      console.error('[FamilyMemberHistoryDetail] Error saving family member history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this family member history?')) {
      try {
        await Meteor.rpc('familyMemberHistories.remove', { familyMemberHistoryId: id });
        navigate('/family-member-histories');
      } catch (err) {
        console.error('[FamilyMemberHistoryDetail] Error deleting family member history:', err);
        setError(err.message);
      }
    }
  }

  function handleCancelButton() {
    if (isNewRecord) {
      navigate('/family-member-histories');
    } else {
      // Reload original data
      var originalFamilyMemberHistory = FamilyMemberHistories.findOne({ _id: id });
      if (originalFamilyMemberHistory) {
        setFamilyMemberHistory(originalFamilyMemberHistory);
      }
      setIsEditing(false);
    }
  }

  // Build the header title
  var headerTitle = 'New Family Member History';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle */}
        {!isNewRecord && (
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
        {!isNewRecord && (
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
        <FamilyMemberHistoryFormView
          resource={familyMemberHistory}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
          onSearchPatient={handleSearchUser}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveFamilyMemberHistoryButton"
              onClick={handleSaveButton}
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
    return <FamilyMemberHistoryPreview resource={familyMemberHistory} resourceId={id} />;
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="familyMemberHistoryDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={searchUserDialogOpen}
        onClose={function() { setSearchUserDialogOpen(false); }}
        onPatientSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default FamilyMemberHistoryDetail;
