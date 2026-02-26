// /imports/ui-fhir/encounters/EncounterDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Divider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  Alert,
  Dialog
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Direct imports - avoid Meteor.startup timing issues
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

const statusOptions = [
  { code: 'planned', display: 'Planned' },
  { code: 'arrived', display: 'Arrived' },
  { code: 'triaged', display: 'Triaged' },
  { code: 'in-progress', display: 'In Progress' },
  { code: 'onleave', display: 'On Leave' },
  { code: 'finished', display: 'Finished' },
  { code: 'cancelled', display: 'Cancelled' }
];

const classOptions = [
  { code: 'AMB', display: 'Ambulatory' },
  { code: 'EMER', display: 'Emergency' },
  { code: 'FLD', display: 'Field' },
  { code: 'HH', display: 'Home Health' },
  { code: 'IMP', display: 'Inpatient Encounter' },
  { code: 'ACUTE', display: 'Inpatient Acute' },
  { code: 'NONAC', display: 'Inpatient Non-Acute' },
  { code: 'PRENC', display: 'Pre-Admission' },
  { code: 'SS', display: 'Short Stay' },
  { code: 'VR', display: 'Virtual' },
  { code: 'OTHER', display: 'Other' }
];

function statusColor(status) {
  switch (status) {
    case 'in-progress': return 'info';
    case 'finished': return 'success';
    case 'cancelled': return 'error';
    case 'planned': return 'warning';
    case 'arrived': return 'info';
    case 'triaged': return 'warning';
    case 'onleave': return 'default';
    default: return 'default';
  }
}

function EncounterDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewEncounter = !id || id === 'new';
  const isExistingEncounter = id && id !== 'new';

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
  const [encounter, setEncounter] = useState({
    resourceType: "Encounter",
    status: "in-progress",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: "AMB",
      display: "Ambulatory"
    },
    type: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }],
      text: ""
    }],
    subject: {
      reference: "",
      display: ""
    },
    participant: [{
      type: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
          code: "PPRF",
          display: "Primary performer"
        }]
      }],
      individual: {
        reference: "",
        display: ""
      }
    }],
    period: {
      start: moment().format('YYYY-MM-DDTHH:mm:ss'),
      end: moment().add(30, 'minutes').format('YYYY-MM-DDTHH:mm:ss')
    },
    reasonCode: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
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
      setEncounter(function(prev) {
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
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Subscribe to encounters so data is available locally
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Encounters', Session.get('selectedPatientId'), { limit: 1000 }).ready();
    } else {
      return Meteor.subscribe('encounters.all').ready();
    }
  }, []);

  // Set initial state and practitioner on component mount
  useEffect(function() {
    if (isEmbedded) return; // Resource comes from props in embedded mode
    if (isNewEncounter) {
      // Enable editing for new encounters
      setIsEditing(true);

      // For new encounters, set patient from session if available
      let patientName = '';
      let patientReference = '';

      if (selectedPatient && selectedPatientId) {
        // Handle both FHIR and flat patient structures
        if (typeof selectedPatient.name === 'string') {
          patientName = selectedPatient.name;
        } else if (selectedPatient.name && Array.isArray(selectedPatient.name)) {
          patientName = FhirUtilities.pluckName(selectedPatient);
        }
        // Use FHIR id for patient reference, not MongoDB _id
        const fhirId = get(selectedPatient, 'id', selectedPatientId);
        patientReference = `Patient/${fhirId}`;
      }

      // Set practitioner to current user
      let practitionerName = '';
      let practitionerReference = '';

      if (currentUser) {
        practitionerName = get(currentUser, 'profile.name.text', '') ||
                      `${get(currentUser, 'profile.name.given[0]', '')} ${get(currentUser, 'profile.name.family', '')}`.trim() ||
                      get(currentUser, 'username', '');
        practitionerReference = `Practitioner/${get(currentUser, '_id', '')}`;
      }

      setEncounter(prev => ({
        ...prev,
        subject: {
          reference: patientReference,
          display: patientName
        },
        participant: [{
          ...prev.participant[0],
          individual: {
            reference: practitionerReference,
            display: practitionerName
          }
        }]
      }));
    }
  }, [id, currentUser, selectedPatient, selectedPatientId]);

  // Load encounter data when subscription is ready
  useEffect(function() {
    if (isExistingEncounter && isSubscriptionReady) {
      let existingEncounter = Encounters.findOne({ _id: id });

      if (existingEncounter) {
        setEncounter(existingEncounter);
        setIsEditing(false);
      } else {
        // Fallback: try loading via method for ObjectID records
        async function loadViaMethod() {
          try {
            const result = await Meteor.callAsync('encounters.get', id);
            if (result) {
              setEncounter(result);
            }
          } catch (err) {
            console.error('[EncounterDetail] Error loading encounter via method:', err);
            setError(err.message);
          }
        }
        loadViaMethod();
        setIsEditing(false);
      }
    }
  }, [id, isSubscriptionReady]);

  // Handle field changes
  function handleChange(path, value) {
    pendingUpdate.current = true;
    setEncounter(prevEncounter => {
      const updatedEncounter = JSON.parse(JSON.stringify(prevEncounter)); // Deep clone
      set(updatedEncounter, path, value);
      return updatedEncounter;
    });
  }

  // onResourceChange useEffect: notify parent when state changes in embedded mode
  useEffect(function() {
    if (isEmbedded && pendingUpdate.current && props.onResourceChange) {
      pendingUpdate.current = false;
      props.onResourceChange(encounter);
    }
  }, [encounter]);


  // Handle search for users/patients
  function handleSearchUser() {
    setPatientSearchOpen(true);
  }

  // Handle patient selection from search dialog
  function handlePatientSelect(patientId, patient) {
    try {
      if (patient) {
        // Extract patient name - handle both FHIR structure and flat structure
        let patientName = '';

        if (typeof patient.name === 'string') {
          patientName = patient.name;
        } else if (patient.name && Array.isArray(patient.name)) {
          patientName = FhirUtilities.pluckName(patient);
        } else {
          patientName = patient.id || patientId;
        }

        // Use FHIR id for patient reference, not MongoDB _id
        const fhirId = get(patient, 'id', patientId);

        // Update both fields at once to ensure consistency
        setEncounter(prevEncounter => {
          const updated = JSON.parse(JSON.stringify(prevEncounter));
          set(updated, 'subject.reference', `Patient/${fhirId}`);
          set(updated, 'subject.display', patientName);
          return updated;
        });
      } else {
        // If patient object not provided, try to find it
        if (Patients) {
          const foundPatient = Patients.findOne({_id: patientId});
          if (foundPatient) {
            const patientName = FhirUtilities.pluckName(foundPatient);
            const fhirId = get(foundPatient, 'id', patientId);
            handleChange('subject.reference', `Patient/${fhirId}`);
            handleChange('subject.display', patientName);
          } else {
            handleChange('subject.reference', `Patient/${patientId}`);
            handleChange('subject.display', 'Patient ' + patientId);
          }
        } else {
          handleChange('subject.reference', `Patient/${patientId}`);
          handleChange('subject.display', 'Patient ' + patientId);
        }
      }
    } catch (err) {
      console.error('[EncounterDetail] Error handling patient selection:', err);
      setError('Failed to select patient');
    }

    setPatientSearchOpen(false);
  }

  // Handle save
  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (isExistingEncounter) {
        await Meteor.callAsync('encounters.update', id, encounter);
        console.log('[EncounterDetail] Encounter updated successfully');
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('encounters.create', encounter);
        console.log('[EncounterDetail] Encounter created with ID:', newId);
        navigate('/encounters');
      }
    } catch (err) {
      console.error('[EncounterDetail] Error saving encounter:', err);
      setError(err.message || err.reason || 'Failed to save encounter');
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingEncounter) return;

    if (window.confirm('Are you sure you want to delete this encounter?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('encounters.remove', id);
        console.log('[EncounterDetail] Encounter deleted successfully');
        navigate('/encounters');
      } catch (err) {
        console.error('[EncounterDetail] Error deleting encounter:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingEncounter) {
      setIsEditing(false);
      setError(null);
      // Reload from local collection first, method fallback
      const existingEncounter = Encounters.findOne({ _id: id });
      if (existingEncounter) {
        setEncounter(existingEncounter);
      } else {
        async function reloadEncounter() {
          try {
            const result = await Meteor.callAsync('encounters.get', id);
            if (result) {
              setEncounter(result);
            }
          } catch (err) {
            console.error('[EncounterDetail] Error reloading encounter:', err);
          }
        }
        reloadEncounter();
      }
    } else {
      navigate('/encounters');
    }
  }

  // Build the header title
  let headerTitle = 'New Encounter';
  if (isExistingEncounter) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new encounters */}
        {!isNewEncounter && (
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

        {/* Form toggle — hidden for new encounters */}
        {!isNewEncounter && (
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
        {!isNewEncounter && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — gated on edit mode */}
        {!isNewEncounter && (
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
        <Stack spacing={3}>
          <Typography variant="h6">Patient & Practitioner</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="subjectDisplay"
              fullWidth
              label="Patient Name"
              value={get(encounter, 'subject.display', '')}
              onChange={(e) => handleChange('subject.display', e.target.value)}
              helperText={get(encounter, 'subject.reference', '') || 'Patient reference will be assigned'}
              disabled={!isEditing}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Search for patient">
                      <IconButton
                        onClick={handleSearchUser}
                        edge="end"
                        disabled={!isEditing}
                      >
                        <SearchIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              id="practitionerDisplay"
              fullWidth
              label="Practitioner Name"
              value={get(encounter, 'participant[0].individual.display', '')}
              onChange={(e) => handleChange('participant[0].individual.display', e.target.value)}
              helperText={get(encounter, 'participant[0].individual.reference', '') || 'Practitioner reference will be assigned'}
              disabled={!isEditing}
            />
          </Stack>

          <Typography variant="h6">Encounter Type</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="encounterType"
              fullWidth
              label="Type Code (SNOMED)"
              value={get(encounter, 'type[0].coding[0].code', '')}
              onChange={(e) => handleChange('type[0].coding[0].code', e.target.value)}
              helperText="SNOMED CT code for encounter type"
              disabled={!isEditing}
              sx={{ flex: 1 }}
            />

            <TextField
              id="encounterTypeDisplay"
              fullWidth
              label="Type Description"
              value={get(encounter, 'type[0].coding[0].display', '')}
              onChange={(e) => handleChange('type[0].coding[0].display', e.target.value)}
              helperText="Human-readable encounter type"
              disabled={!isEditing}
              sx={{ flex: 2 }}
            />
          </Stack>

          <Typography variant="h6">Status & Classification</Typography>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id="status"
                value={get(encounter, 'status', 'in-progress')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Class</InputLabel>
              <Select
                id="classCode"
                value={get(encounter, 'class.code', 'AMB')}
                onChange={(e) => {
                  const option = classOptions.find(o => o.code === e.target.value);
                  handleChange('class.code', option.code);
                  handleChange('class.display', option.display);
                }}
                label="Class"
              >
                {classOptions.map(option => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.display}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Typography variant="h6">Reason for Visit</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="reasonCode"
              fullWidth
              label="Reason Code (SNOMED)"
              value={get(encounter, 'reasonCode[0].coding[0].code', '')}
              onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
              helperText="SNOMED CT code for visit reason"
              disabled={!isEditing}
              sx={{ flex: 1 }}
            />

            <TextField
              id="reasonDisplay"
              fullWidth
              label="Reason for Visit"
              value={get(encounter, 'reasonCode[0].coding[0].display', '')}
              onChange={(e) => handleChange('reasonCode[0].coding[0].display', e.target.value)}
              helperText="Human-readable reason for visit"
              disabled={!isEditing}
              sx={{ flex: 2 }}
            />
          </Stack>

          <Typography variant="h6">Period</Typography>

          <Stack direction="row" spacing={2}>
            <TextField
              id="startDateTime"
              fullWidth
              type="datetime-local"
              label="Start Date/Time"
              value={moment(get(encounter, 'period.start', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('period.start', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />

            <TextField
              id="endDateTime"
              fullWidth
              type="datetime-local"
              label="End Date/Time"
              value={moment(get(encounter, 'period.end', '')).format('YYYY-MM-DDTHH:mm')}
              onChange={(e) => handleChange('period.end', moment(e.target.value).format('YYYY-MM-DDTHH:mm:ss'))}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>

          <Typography variant="h6">Notes</Typography>

          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(encounter, 'note[0].text', '')}
            onChange={(e) => handleChange('note[0].text', e.target.value)}
            helperText="Additional notes about the encounter"
            disabled={!isEditing}
          />
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveEncounterButton"
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
    const patientDisplay = get(encounter, 'subject.display', '');
    const patientReference = get(encounter, 'subject.reference', '');
    const practitionerDisplay = get(encounter, 'participant[0].individual.display', '');
    const practitionerReference = get(encounter, 'participant[0].individual.reference', '');
    const status = get(encounter, 'status', '');
    const statusDisplay = statusOptions.find(o => o.code === status)?.display || status;
    const classCode = get(encounter, 'class.code', '');
    const classDisplay = get(encounter, 'class.display', '');
    const typeCode = get(encounter, 'type[0].coding[0].code', '');
    const typeDisplay = get(encounter, 'type[0].coding[0].display', '');
    const reasonCode = get(encounter, 'reasonCode[0].coding[0].code', '');
    const reasonDisplay = get(encounter, 'reasonCode[0].coding[0].display', '');
    const periodStart = get(encounter, 'period.start', '');
    const periodEnd = get(encounter, 'period.end', '');
    const noteText = get(encounter, 'note[0].text', '');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Type + status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {typeDisplay || 'Encounter'}
          </Typography>
          <Chip
            label={statusDisplay}
            color={statusColor(status)}
            size="small"
          />
        </Box>

        {classDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {classDisplay}{classCode ? ' (' + classCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata: Patient/Practitioner */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {patientDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {patientDisplay}
                </Typography>
              </>
            )}
            {patientReference && (
              <Typography variant="caption" color="text.secondary">
                {patientReference}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {practitionerDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Practitioner
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {practitionerDisplay}
                </Typography>
              </>
            )}
            {practitionerReference && (
              <Typography variant="caption" color="text.secondary">
                {practitionerReference}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Type & Reason */}
        {(typeCode || reasonDisplay) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
              {typeCode && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Type Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {typeCode}
                  </Typography>
                </Box>
              )}
              {(reasonDisplay || reasonCode) && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary">
                    Reason for Visit
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Period */}
        {(periodStart || periodEnd) && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
              {periodStart && (
                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Start
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {moment(periodStart).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                </Box>
              )}
              {periodEnd && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="overline" color="text.secondary">
                    End
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {moment(periodEnd).format('MMM DD, YYYY HH:mm')}
                  </Typography>
                </Box>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Notes */}
        {noteText && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Notes
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>
                {noteText}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Footer with encounter ID */}
        {isExistingEncounter && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Encounter ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id="encounterDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

      {/* Patient Search Dialog */}
      <Dialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <PatientSearchDialog
          onSelect={handlePatientSelect}
          defaultSearchTerm={get(encounter, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default EncounterDetail;
