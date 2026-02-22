// /imports/ui-fhir/imagingStudies/ImagingStudyDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Stack,
  InputAdornment,
  Tooltip
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { get, set } from 'lodash';
import moment from 'moment';

import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'available', label: 'Available' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'info',
  'available': 'success',
  'cancelled': 'default',
  'entered-in-error': 'error',
  'unknown': 'warning'
};

const modalityOptions = [
  { value: 'AR', label: 'Autorefraction' },
  { value: 'BMD', label: 'Bone Mineral Densitometry' },
  { value: 'CR', label: 'Computed Radiography' },
  { value: 'CT', label: 'Computed Tomography' },
  { value: 'DX', label: 'Digital Radiography' },
  { value: 'ECG', label: 'Electrocardiography' },
  { value: 'EPS', label: 'Cardiac Electrophysiology' },
  { value: 'ES', label: 'Endoscopy' },
  { value: 'MG', label: 'Mammography' },
  { value: 'MR', label: 'Magnetic Resonance' },
  { value: 'NM', label: 'Nuclear Medicine' },
  { value: 'OPT', label: 'Ophthalmic Tomography' },
  { value: 'PT', label: 'Positron Emission Tomography' },
  { value: 'PX', label: 'Panoramic X-Ray' },
  { value: 'RF', label: 'Radiofluoroscopy' },
  { value: 'US', label: 'Ultrasound' },
  { value: 'XA', label: 'X-Ray Angiography' }
];

function ImagingStudyDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const imagingStudyId = id;
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewStudy = !imagingStudyId || imagingStudyId === 'new';
  const isExistingStudy = imagingStudyId && imagingStudyId !== 'new';

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);

  // Subscribe to imaging studies
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.ImagingStudies', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('imagingStudies.all');
    }
    return handle.ready();
  }, []);

  // Initialize state with proper FHIR R4 structure
  const [imagingStudy, setImagingStudy] = useState({
    resourceType: "ImagingStudy",
    status: "available",
    subject: {
      reference: "",
      display: ""
    },
    started: moment().format('YYYY-MM-DDTHH:mm'),
    modality: [{
      system: "http://dicom.nema.org/resources/ontology/DCM",
      code: "",
      display: ""
    }],
    description: "",
    numberOfSeries: 1,
    numberOfInstances: 1,
    procedureCode: [{
      coding: [{
        system: "http://loinc.org",
        code: "",
        display: ""
      }],
      text: ""
    }],
    referrer: {
      reference: "",
      display: ""
    },
    location: {
      reference: "",
      display: ""
    },
    encounter: {
      reference: "",
      display: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Set patient on component mount for new imaging studies
  useEffect(function() {
    if (isNewStudy) {
      // Enable editing for new imaging studies
      setIsEditing(true);

      // For new imaging studies, set the patient
      let patientName = '';
      let patientReference = '';

      if (selectedPatient) {
        patientName = get(selectedPatient, 'name[0].text', '') ||
                     `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}`.trim();
        // Use FHIR id, not MongoDB _id
        patientReference = `Patient/${get(selectedPatient, 'id', '')}`;
      }

      setImagingStudy(function(prev) {
        return {
          ...prev,
          subject: {
            reference: patientReference,
            display: patientName
          }
        };
      });
    }
  }, [imagingStudyId, selectedPatient]);

  // Load imaging study if editing existing one
  useEffect(function() {
    if (isExistingStudy) {
      // Load immediately if data exists - don't wait for subscription
      const existingStudy = ImagingStudies.findOne({_id: imagingStudyId});

      if (existingStudy) {
        setImagingStudy(existingStudy);
        setIsEditing(false);
      } else {
        // Fallback: try finding by id field
        const studyById = ImagingStudies.findOne({id: imagingStudyId});
        if (studyById) {
          setImagingStudy(studyById);
          setIsEditing(false);
        }
      }
    }
  }, [imagingStudyId]);

  // Handle field changes
  function handleChange(path, value) {
    const updatedImagingStudy = { ...imagingStudy };
    set(updatedImagingStudy, path, value);
    setImagingStudy(updatedImagingStudy);
  }

  // Handle search for patient
  function handleSearchUser() {
    console.log('[ImagingStudyDetail] Search for patient clicked');
  }

  // Handle save
  async function handleSaveButton() {
    setLoading(true);
    setError(null);

    try {
      // Prepare data for save
      let dataToSave = {
        status: get(imagingStudy, 'status', 'available'),
        description: get(imagingStudy, 'description', ''),
        started: get(imagingStudy, 'started', ''),
        subject: get(imagingStudy, 'subject', {}),
        modality: get(imagingStudy, 'modality[0].code', ''),
        modalityDisplay: get(imagingStudy, 'modality[0].display', ''),
        numberOfSeries: parseInt(get(imagingStudy, 'numberOfSeries', 1)) || 1,
        numberOfInstances: parseInt(get(imagingStudy, 'numberOfInstances', 1)) || 1
      };

      // Add procedure code if present
      if(get(imagingStudy, 'procedureCode[0].coding[0].code')){
        dataToSave.procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code');
        dataToSave.procedureCodeDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display') ||
                                          get(imagingStudy, 'procedureCode[0].text', '');
      }

      // Add referrer if present
      if(get(imagingStudy, 'referrer.display')){
        dataToSave.referrer = imagingStudy.referrer;
      }

      // Add interpreter if present
      if(get(imagingStudy, 'interpreter[0].display')){
        dataToSave.interpreter = get(imagingStudy, 'interpreter[0].display');
        dataToSave.interpreterReference = get(imagingStudy, 'interpreter[0].reference', '');
      }

      // Add encounter if present
      if(get(imagingStudy, 'encounter.reference')){
        dataToSave.encounter = imagingStudy.encounter;
      }

      // Add location if present
      if(get(imagingStudy, 'location.display')){
        dataToSave.location = imagingStudy.location;
      }

      // Add reason code if present
      if(get(imagingStudy, 'reasonCode[0].coding[0].code')){
        dataToSave.reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code');
        dataToSave.reasonCodeDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display') ||
                                       get(imagingStudy, 'reasonCode[0].text', '');
      }

      // Add endpoint if present
      if(get(imagingStudy, 'endpoint[0].display')){
        dataToSave.endpoint = get(imagingStudy, 'endpoint[0].display');
      }

      // Add notes if present
      if(get(imagingStudy, 'note[0].text')){
        dataToSave.notes = get(imagingStudy, 'note[0].text');
      }

      console.log('[ImagingStudyDetail] Saving imaging study with data:', JSON.stringify(dataToSave, null, 2));

      if (isExistingStudy) {
        // Update existing
        await Meteor.callAsync('updateImagingStudy', imagingStudyId, dataToSave);
        console.log('[ImagingStudyDetail] Imaging study updated successfully');
        // Stay on page but exit edit mode
        setIsEditing(false);
      } else {
        // Create new
        const newId = await Meteor.callAsync('createImagingStudy', dataToSave);
        console.log('[ImagingStudyDetail] Imaging study created with ID:', newId);
        // Navigate back to list after creating
        navigate('/imaging-studies');
      }
    } catch (err) {
      console.error('[ImagingStudyDetail] Error saving imaging study:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!isExistingStudy) return;

    if (window.confirm('Are you sure you want to delete this imaging study?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeImagingStudy', imagingStudyId);
        console.log('[ImagingStudyDetail] Imaging study deleted successfully');
        navigate('/imaging-studies');
      } catch (err) {
        console.error('[ImagingStudyDetail] Error deleting imaging study:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Handle cancel
  function handleCancel() {
    if (isExistingStudy) {
      setIsEditing(false);
      setError(null);
      // Reload the study to discard changes
      const existingStudy = ImagingStudies.findOne({_id: imagingStudyId});
      if (existingStudy) {
        setImagingStudy(existingStudy);
      } else {
        const studyById = ImagingStudies.findOne({id: imagingStudyId});
        if (studyById) {
          setImagingStudy(studyById);
        }
      }
    } else {
      navigate('/imaging-studies');
    }
  }

  // Build the header title
  let headerTitle = 'New Imaging Study';
  if (isExistingStudy) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{imagingStudyId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new studies */}
        {!isNewStudy && (
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

        {/* Form toggle — hidden for new studies (always form) */}
        {!isNewStudy && (
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

        {/* Lock / Unlock toggle — only for existing studies */}
        {!isNewStudy && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={function() { setIsEditing(!isEditing); }}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing studies */}
        {!isNewStudy && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              sx={{ color: 'error.main' }}
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
          <Typography variant="h6">Patient</Typography>

          {/* Patient Field */}
          <TextField
            id="subjectDisplay"
            fullWidth
            label="Patient"
            value={get(imagingStudy, 'subject.display', '')}
            onChange={function(e) { handleChange('subject.display', e.target.value); }}
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

          <Divider />
          <Typography variant="h6">Study Details</Typography>

          {/* Description */}
          <TextField
            id="descriptionInput"
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={get(imagingStudy, 'description', '')}
            onChange={function(e) { handleChange('description', e.target.value); }}
            helperText="Brief description of the imaging study"
            disabled={!isEditing}
          />

          {/* Started Date/Time */}
          <TextField
            id="startedInput"
            fullWidth
            label="Started Date/Time"
            type="datetime-local"
            value={moment(get(imagingStudy, 'started', '')).format('YYYY-MM-DDTHH:mm')}
            onChange={function(e) { handleChange('started', e.target.value); }}
            disabled={!isEditing}
            InputLabelProps={{
              shrink: true,
            }}
          />

          {/* Series and Instances */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="numberOfSeriesInput"
              fullWidth
              label="Number of Series"
              type="number"
              value={get(imagingStudy, 'numberOfSeries', 1)}
              onChange={function(e) { handleChange('numberOfSeries', parseInt(e.target.value) || 1); }}
              disabled={!isEditing}
              inputProps={{ min: 1 }}
            />
            <TextField
              id="numberOfInstancesInput"
              fullWidth
              label="Number of Instances"
              type="number"
              value={get(imagingStudy, 'numberOfInstances', 1)}
              onChange={function(e) { handleChange('numberOfInstances', parseInt(e.target.value) || 1); }}
              disabled={!isEditing}
              inputProps={{ min: 1 }}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Procedure</Typography>

          {/* Procedure Code */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="procedureCodeInput"
              fullWidth
              label="Procedure Code"
              value={get(imagingStudy, 'procedureCode[0].coding[0].code', '')}
              onChange={function(e) { handleChange('procedureCode[0].coding[0].code', e.target.value); }}
              helperText="LOINC code"
              disabled={!isEditing}
            />
            <TextField
              id="procedureDisplayInput"
              fullWidth
              label="Procedure Display"
              value={get(imagingStudy, 'procedureCode[0].coding[0].display', '') ||
                     get(imagingStudy, 'procedureCode[0].text', '')}
              onChange={function(e) {
                handleChange('procedureCode[0].coding[0].display', e.target.value);
                handleChange('procedureCode[0].text', e.target.value);
              }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Clinical Context</Typography>

          {/* Referrer and Interpreter */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="referrerInput"
              fullWidth
              label="Referrer"
              value={get(imagingStudy, 'referrer.display', '')}
              onChange={function(e) { handleChange('referrer.display', e.target.value); }}
              helperText="Practitioner who referred the patient"
              disabled={!isEditing}
            />
            <TextField
              id="interpreterInput"
              fullWidth
              label="Interpreter"
              value={get(imagingStudy, 'interpreter[0].display', '')}
              onChange={function(e) { handleChange('interpreter[0].display', e.target.value); }}
              helperText="Practitioner who interpreted the images"
              disabled={!isEditing}
            />
          </Stack>

          {/* Reason Code */}
          <Stack direction="row" spacing={2}>
            <TextField
              id="reasonCodeInput"
              fullWidth
              label="Reason Code"
              value={get(imagingStudy, 'reasonCode[0].coding[0].code', '')}
              onChange={function(e) { handleChange('reasonCode[0].coding[0].code', e.target.value); }}
              helperText="SNOMED code"
              disabled={!isEditing}
            />
            <TextField
              id="reasonCodeDisplayInput"
              fullWidth
              label="Reason Display"
              value={get(imagingStudy, 'reasonCode[0].coding[0].display', '') ||
                     get(imagingStudy, 'reasonCode[0].text', '')}
              onChange={function(e) {
                handleChange('reasonCode[0].coding[0].display', e.target.value);
                handleChange('reasonCode[0].text', e.target.value);
              }}
              disabled={!isEditing}
            />
          </Stack>

          <Divider />
          <Typography variant="h6">Status & Imaging</Typography>

          {/* Status and Modality */}
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                id="statusSelect"
                value={get(imagingStudy, 'status', 'available')}
                label="Status"
                onChange={function(e) { handleChange('status', e.target.value); }}
              >
                {statusOptions.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="modality-label">Modality</InputLabel>
              <Select
                labelId="modality-label"
                id="modalitySelect"
                value={get(imagingStudy, 'modality[0].code', '')}
                label="Modality"
                onChange={function(e) {
                  const selected = modalityOptions.find(function(opt){ return opt.value === e.target.value; });
                  handleChange('modality[0].code', e.target.value);
                  handleChange('modality[0].display', selected ? selected.label : e.target.value);
                }}
              >
                {modalityOptions.map(function(option) {
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Stack>

          {/* Endpoint */}
          <TextField
            id="endpointInput"
            fullWidth
            label="Endpoint"
            value={get(imagingStudy, 'endpoint[0].display', '')}
            onChange={function(e) { handleChange('endpoint[0].display', e.target.value); }}
            helperText="Where the images can be accessed"
            disabled={!isEditing}
          />

          {/* Location */}
          <TextField
            id="locationInput"
            fullWidth
            label="Location"
            value={get(imagingStudy, 'location.display', '')}
            onChange={function(e) { handleChange('location.display', e.target.value); }}
            helperText="Where the imaging was performed"
            disabled={!isEditing}
          />

          <Divider />
          <Typography variant="h6">Notes</Typography>

          {/* Notes */}
          <TextField
            id="notesTextarea"
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={get(imagingStudy, 'note[0].text', '')}
            onChange={function(e) { handleChange('note[0].text', e.target.value); }}
            helperText="Additional notes about the imaging study"
            disabled={!isEditing}
          />
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              id="saveImagingStudyButton"
              onClick={handleSaveButton}
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
    const description = get(imagingStudy, 'description', 'Untitled Imaging Study');
    const statusValue = get(imagingStudy, 'status', 'unknown');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');
    const modalityDisplay = get(imagingStudy, 'modality[0].display', '');
    const modalityCode = get(imagingStudy, 'modality[0].code', '');
    const startedDate = get(imagingStudy, 'started', '');
    const formattedStarted = startedDate ? moment(startedDate).format('MMMM D, YYYY [at] h:mm A') : '';
    const patientDisplay = get(imagingStudy, 'subject.display', '');
    const patientReference = get(imagingStudy, 'subject.reference', '');
    const referrerDisplay = get(imagingStudy, 'referrer.display', '');
    const locationDisplay = get(imagingStudy, 'location.display', '');
    const numberOfSeries = get(imagingStudy, 'numberOfSeries', '');
    const numberOfInstances = get(imagingStudy, 'numberOfInstances', '');
    const procedureCode = get(imagingStudy, 'procedureCode[0].coding[0].code', '');
    const procedureDisplay = get(imagingStudy, 'procedureCode[0].coding[0].display', '') ||
                             get(imagingStudy, 'procedureCode[0].text', '');
    const interpreterDisplay = get(imagingStudy, 'interpreter[0].display', '');
    const endpointDisplay = get(imagingStudy, 'endpoint[0].display', '');
    const reasonCode = get(imagingStudy, 'reasonCode[0].coding[0].code', '');
    const reasonDisplay = get(imagingStudy, 'reasonCode[0].coding[0].display', '') ||
                          get(imagingStudy, 'reasonCode[0].text', '');
    const noteText = get(imagingStudy, 'note[0].text', '');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Title (description) + Status Chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {description}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        {/* Subtitle: modality display + code */}
        {modalityDisplay && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {modalityDisplay}{modalityCode ? ' (' + modalityCode + ')' : ''}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata: Patient/Referrer (left), Started/Location (right) */}
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
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {patientReference}
              </Typography>
            )}
            {referrerDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Referrer
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {referrerDisplay}
                </Typography>
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {formattedStarted && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Started
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {formattedStarted}
                </Typography>
              </>
            )}
            {locationDisplay && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Location
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {locationDisplay}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider />

        {/* Series / Instances / Procedure section */}
        {(numberOfSeries || numberOfInstances || procedureDisplay) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {numberOfSeries && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Series
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {numberOfSeries}
                    </Typography>
                  </Box>
                )}
                {numberOfInstances && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Instances
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {numberOfInstances}
                    </Typography>
                  </Box>
                )}
                {procedureDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Procedure
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {procedureDisplay}{procedureCode ? ' (' + procedureCode + ')' : ''}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Interpreter / Endpoint section */}
        {(interpreterDisplay || endpointDisplay) && (
          <>
            <Box sx={{ py: 2 }}>
              <Stack direction="row" spacing={4}>
                {interpreterDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Interpreter
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {interpreterDisplay}
                    </Typography>
                  </Box>
                )}
                {endpointDisplay && (
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Endpoint
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {endpointDisplay}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
            <Divider />
          </>
        )}

        {/* Reason section */}
        {(reasonDisplay || reasonCode) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Reason
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {reasonDisplay}{reasonCode ? ' (' + reasonCode + ')' : ''}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Notes section */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Notes
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '100px'
            }}
          >
            {noteText || 'No notes provided.'}
          </Typography>
        </Box>

        <Divider />

        {/* Footer with study ID */}
        {isExistingStudy && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Imaging Study ID: {imagingStudyId}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Container id="imagingStudyDetailPage" maxWidth="md" sx={{ py: 4 }}>
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

export default ImagingStudyDetail;
