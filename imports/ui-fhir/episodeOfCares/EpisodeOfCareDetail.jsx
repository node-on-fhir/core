// /imports/ui-fhir/episodeOfCares/EpisodeOfCareDetail.jsx

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
  Alert,
  Dialog,
  IconButton,
  Tooltip
} from '@mui/material';

import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import SubjectSearchDialog from '/imports/components/SubjectSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

import EpisodeOfCareFormView from './EpisodeOfCareFormView';

// Get the Patients collection
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

const log = (Meteor.Logger ? Meteor.Logger.for('EpisodeOfCareDetail') : console);

function EpisodeOfCareDetail(props) {
  var _rawNavigate = useNavigate();
  var navigate = _rawNavigate;
  var _params = useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();

  const isNewEpisodeOfCare = !id || id === 'new';
  const isExistingEpisodeOfCare = id && id !== 'new';

  // Get selected patient from session
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
  const [episodeOfCare, setEpisodeOfCare] = useState({
    resourceType: "EpisodeOfCare",
    status: "planned",
    type: [{
      text: ""
    }],
    patient: {
      reference: "",
      display: ""
    },
    managingOrganization: {
      reference: "",
      display: ""
    },
    careManager: {
      reference: "",
      display: ""
    },
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: ""
    },
    diagnosis: [],
    statusHistory: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Set initial state on component mount
  useEffect(function() {
    if (isNewEpisodeOfCare) {
      setIsEditing(true);

      // For new episodes, set patient from session if available
      let patientName = '';
      let patientReference = '';

      if (selectedPatient || selectedPatientId) {
        if (selectedPatient) {
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
            patientName = FhirUtilities.pluckName(selectedPatient);
          }
        }

        let fhirId = get(selectedPatient, 'id');
        if (!fhirId && selectedPatientId) {
          fhirId = selectedPatientId;
        }
        if (!fhirId && selectedPatient && selectedPatient._id) {
          fhirId = typeof selectedPatient._id === 'object' && selectedPatient._id._str
            ? selectedPatient._id._str
            : String(selectedPatient._id);
        }

        if (fhirId) {
          patientReference = `Patient/${fhirId}`;
        }
      }

      // Set care manager to current user
      let careManagerName = '';
      let careManagerReference = '';

      if (currentUser) {
        careManagerName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        careManagerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setEpisodeOfCare(function(prev) {
        return {
          ...prev,
          patient: {
            reference: patientReference,
            display: patientName
          },
          careManager: {
            reference: careManagerReference,
            display: careManagerName
          }
        };
      });
    } else {
      setIsEditing(false);
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load episode of care if editing existing
  useEffect(function() {
    async function loadEpisodeOfCare() {
      if (isExistingEpisodeOfCare) {
        setLoading(true);
        try {
          const result = await Meteor.callAsync('episodeOfCares.get', id);
          if (result) {
            setEpisodeOfCare(result);
            setError(null);
          }
        } catch (err) {
          console.error('[EpisodeOfCareDetail] Error loading:', err);
          setError(err.error || err.message);
        } finally {
          setLoading(false);
        }
      }
    }

    loadEpisodeOfCare();
  }, [id]);

  // Handle field changes
  function handleChange(path, value) {
    setEpisodeOfCare(function(prevEpisodeOfCare) {
      const updated = JSON.parse(JSON.stringify(prevEpisodeOfCare));
      set(updated, path, value);
      return updated;
    });
  }

  // Handle search for patients
  function handleSearchUser() {
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    try {
      if (patient) {
        let patientName = '';

        if (typeof patient.name === 'string') {
          patientName = patient.name;
        } else if (patient.name && Array.isArray(patient.name)) {
          patientName = FhirUtilities.pluckName(patient);
        } else {
          patientName = patient.id || patientId;
        }

        setEpisodeOfCare(function(prevEpisodeOfCare) {
          const updated = JSON.parse(JSON.stringify(prevEpisodeOfCare));

          let fhirId = patient.id;
          if (!fhirId && patientId) {
            fhirId = patientId;
          }
          if (!fhirId && patient._id) {
            fhirId = typeof patient._id === 'object' && patient._id._str
              ? patient._id._str
              : String(patient._id);
          }

          set(updated, 'patient.reference', `Patient/${fhirId}`);
          set(updated, 'patient.display', patientName);
          return updated;
        });

        setTimeout(function() {
          setPatientSearchOpen(false);
        }, 100);
        return;
      } else {
        if (Patients) {
          const foundPatient = Patients.findOne({_id: patientId});
          if (foundPatient) {
            const patientName = FhirUtilities.pluckName(foundPatient);
            handleChange('patient.reference', `Patient/${patientId}`);
            handleChange('patient.display', patientName);
          } else {
            handleChange('patient.reference', `Patient/${patientId}`);
            handleChange('patient.display', 'Patient ' + patientId);
          }
        } else {
          handleChange('patient.reference', `Patient/${patientId}`);
          handleChange('patient.display', 'Patient ' + patientId);
        }
      }
    } catch (error) {
      log.error('Error handling patient selection', { error: error.message });
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle group selection from search dialog
  function handleGroupSelect(groupId, group) {
    var groupName = get(group, 'name', 'Group ' + groupId);
    var fhirId = get(group, 'id', groupId);

    setEpisodeOfCare(function(prev) {
      var updated = JSON.parse(JSON.stringify(prev));
      set(updated, 'patient.reference', 'Group/' + fhirId);
      set(updated, 'patient.display', groupName);
      return updated;
    });

    setTimeout(function() { setPatientSearchOpen(false); }, 100);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingEpisodeOfCare) {
        await Meteor.callAsync('episodeOfCares.update', id, episodeOfCare);
        console.log('[EpisodeOfCareDetail] Updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('episodeOfCares.create', episodeOfCare);
        console.log('[EpisodeOfCareDetail] Created with ID:', newId);
        navigate('/episode-of-cares');
      }
    } catch (err) {
      console.error('[EpisodeOfCareDetail] Error saving:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (isNewEpisodeOfCare) return;

    if (window.confirm('Are you sure you want to delete this episode of care?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('episodeOfCares.remove', id);
        console.log('[EpisodeOfCareDetail] Deleted successfully');
        navigate('/episode-of-cares');
      } catch (err) {
        console.error('[EpisodeOfCareDetail] Error deleting:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingEpisodeOfCare) {
      setIsEditing(false);
      setError(null);
      async function reloadEpisodeOfCare() {
        try {
          const result = await Meteor.callAsync('episodeOfCares.get', id);
          if (result) {
            setEpisodeOfCare(result);
          }
        } catch (err) {
          console.error('[EpisodeOfCareDetail] Error reloading:', err);
        }
      }
      reloadEpisodeOfCare();
    } else {
      navigate('/episode-of-cares');
    }
  }

  // Build the header title
  let headerTitle = 'New Episode of Care';
  if (isExistingEpisodeOfCare) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Edit toggle — only for existing records */}
        {!isNewEpisodeOfCare && (
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

        {/* Delete — only for existing records */}
        {!isNewEpisodeOfCare && (
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

  return (
    <Container id="episodeOfCareDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

          <EpisodeOfCareFormView
            resource={episodeOfCare}
            isEditing={isEditing}
            onChange={handleChange}
            onSearchPatient={handleSearchUser}
          />

          {/* In-form Save/Cancel bar when editing */}
          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button id="cancelButton" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                id="saveEpisodeOfCareButton"
                onClick={handleSave}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Subject Search Dialog (Patient or Group) */}
      <Dialog
        open={patientSearchOpen}
        onClose={function() { setPatientSearchOpen(false); }}
        maxWidth="md"
        fullWidth
      >
        <SubjectSearchDialog
          onPatientSelect={handlePatientSelect}
          onGroupSelect={handleGroupSelect}
          defaultSearchTerm={get(episodeOfCare, 'patient.display', '')}
          defaultMode={get(episodeOfCare, 'patient.reference', '').startsWith('Group/') ? 'group' : 'patient'}
        />
      </Dialog>
    </Container>
  );
}

export default EpisodeOfCareDetail;
