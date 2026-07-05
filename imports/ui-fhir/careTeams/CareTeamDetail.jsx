// imports/ui-fhir/careTeams/CareTeamDetail.jsx

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
  Alert,
  Grid
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import collections directly
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';

import CareTeamFormView from './CareTeamFormView';
import CareTeamPreview from './CareTeamPreview';

//===========================================================================
// COMPONENT

function CareTeamDetail(props) {
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

  // Subscribe to care teams data
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.CareTeams', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('careteams.all');
    }
    return handle.ready();
  }, []);

  // Get selected patient and current user from session/tracker
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const selectedPatientId = useTracker(function() {
    return Session.get('selectedPatientId');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [careTeam, setCareTeam] = useState({
    resourceType: "CareTeam",
    identifier: [{
      value: ""
    }],
    status: "active",
    category: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    name: "",
    subject: {
      reference: "",
      display: ""
    },
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: ""
    },
    participant: [{
      role: [{
        coding: [{
          system: "http://snomed.info/sct",
          code: "",
          display: ""
        }],
        text: ""
      }],
      member: {
        reference: "",
        display: ""
      },
      period: {
        start: moment().format('YYYY-MM-DD'),
        end: ""
      }
    }],
    managingOrganization: [{
      reference: "",
      display: ""
    }],
    note: [{
      text: ""
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  var pendingUpdate = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setCareTeam(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize isEditing based on whether we're creating new or viewing existing
  const [isEditing, setIsEditing] = useState(isEmbedded || isNewRecord);

  // Set default values on component mount for new care teams
  useEffect(function() {
    console.log('CareTeamDetail useEffect - id:', id, 'isEditing:', isEditing);
    if (isNewRecord) {
      // Set patient reference if we have a selected patient
      if (selectedPatient) {
        const patientFhirId = get(selectedPatient, 'id');
        const patientDisplay = FhirUtilities.pluckName(selectedPatient);

        setCareTeam(prev => ({
          ...prev,
          subject: {
            reference: `Patient/${patientFhirId}`,
            display: patientDisplay
          }
        }));
      }

      setIsEditing(true);
    } else if (id) {
      // Load existing care team
      const existingCareTeam = CareTeams.findOne({_id: id}) || CareTeams.findOne({id: id});
      if (existingCareTeam) {
        setCareTeam(existingCareTeam);
        setIsEditing(false); // Default to read mode for existing records
      }
    }
  }, [id]);

  const careTeamId = isExistingRecord ? id : null;

  function handleChange(path, value) {
    pendingUpdate.current = true;
    var updated = cloneDeep(careTeam);
    set(updated, path, value);
    setCareTeam(updated);
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(careTeam);
    }
  }, [careTeam]);


  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      const dataToSave = {
        resourceType: careTeam.resourceType,
        status: careTeam.status || 'active',
        name: careTeam.name,
        subject: careTeam.subject,
        period: careTeam.period,
        managingOrganization: careTeam.managingOrganization?.filter(org => org.display) || []
      };

      // Category
      if (get(careTeam, 'category[0].coding[0].code')) {
        dataToSave.category = careTeam.category;
      } else if (get(careTeam, 'category[0].text')) {
        dataToSave.category = [{
          text: get(careTeam, 'category[0].text')
        }];
      }

      // Participants
      if (careTeam.participant && careTeam.participant.length > 0) {
        dataToSave.participant = careTeam.participant
          .filter(p => get(p, 'member.display'))
          .map(p => {
            const participant = {
              member: p.member
            };
            if (get(p, 'role[0].coding[0].code') || get(p, 'role[0].text')) {
              participant.role = p.role;
            }
            if (p.period && (p.period.start || p.period.end)) {
              participant.period = p.period;
            }
            return participant;
          });
      }

      // Notes
      if (get(careTeam, 'note[0].text')) {
        dataToSave.note = careTeam.note.filter(n => n.text);
      }

      console.log('Saving care team:', dataToSave);

      if (careTeamId) {
        await Meteor.callAsync('updateCareTeam', careTeamId, dataToSave);
        setIsEditing(false); // Switch to read mode after save
      } else {
        const newId = await Meteor.callAsync('createCareTeam', dataToSave);
        navigate('/care-teams');
      }
    } catch (err) {
      console.error('Error saving care team:', err);
      setError(err.message || 'Failed to save care team');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteButton() {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this care team?')) {
      setLoading(true);
      setError(null);

      try {
        // Use MongoDB _id from the loaded care team object, not the URL param
        let mongoId = get(careTeam, '_id');

        // If _id not in state, look it up from the collection
        if (!mongoId) {
          console.log('[handleDeleteButton] _id not in state, looking up from collection with id:', id);
          const record = CareTeams.findOne({_id: id}) || CareTeams.findOne({id: id});
          if (record) {
            mongoId = record._id;
            console.log('[handleDeleteButton] Found MongoDB _id:', mongoId);
          }
        }

        if (!mongoId) {
          throw new Error('Care team _id not found - record may not be loaded yet');
        }

        console.log('[handleDeleteButton] Deleting care team with _id:', mongoId);
        await Meteor.callAsync('removeCareTeam', mongoId);
        navigate('/care-teams');
      } catch (err) {
        console.error('Error deleting care team:', err);
        setError(err.message || 'Failed to delete care team');
        setLoading(false);
      }
    }
  }

  function handleCancelButton() {
    if (careTeamId) {
      setIsEditing(false);
      // Reload the original data
      const existingCareTeam = CareTeams.findOne({_id: careTeamId}) || CareTeams.findOne({id: careTeamId});
      if (existingCareTeam) {
        setCareTeam(existingCareTeam);
      }
    } else {
      navigate('/care-teams');
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

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <CareTeamFormView
          resource={careTeam}
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
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveCareTeamButton"
              onClick={handleSaveButton}
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
      <CareTeamPreview
        resource={careTeam}
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
    <Container id="careTeamDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default CareTeamDetail;
