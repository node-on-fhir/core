// /imports/ui-fhir/procedures/ProcedureDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Container,
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  Card,
  CardHeader,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Tooltip,
  Chip,
  Alert,
  Divider,
  Dialog
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';

// Import the collections directly - avoids timing issues
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';

//===========================================================================
// STATUS OPTIONS

const statusOptions = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'aborted', label: 'Aborted' },
  { value: 'completed', label: 'Completed' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'preparation': 'info',
  'in-progress': 'warning',
  'suspended': 'default',
  'aborted': 'error',
  'completed': 'success',
  'entered-in-error': 'error',
  'unknown': 'default'
};

//===========================================================================
// COMPONENT

function ProcedureDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const isNewRecord = !id || id === 'new';
  const isExistingRecord = id && id !== 'new';

  console.log('ProcedureDetail component rendered with id:', id);

  const [procedure, setProcedure] = useState({
    resourceType: 'Procedure',
    status: 'completed',
    subject: {},
    performer: [{
      actor: {}
    }],
    performedDateTime: moment().format('YYYY-MM-DDTHH:mm:ss'),
    code: {
      coding: [{}]
    },
    category: {
      coding: [{}]
    },
    bodySite: [{
      coding: [{}]
    }],
    reasonCode: [{
      coding: [{}]
    }],
    location: {},
    note: [{}]
  });

  const [isEditing, setIsEditing] = useState(isNewRecord);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Subscribe to procedures
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    if(autoSubscribeEnabled){
      return Meteor.subscribe('selectedPatient.Procedures', Session.get('selectedPatientId'), {}).ready();
    } else {
      return Meteor.subscribe('procedures.all').ready();
    }
  }, []);

  // Fetch existing procedure
  useEffect(() => {
    if (isExistingRecord && isSubscriptionReady) {
      const existingProcedure = Procedures.findOne({ _id: id });
      if (existingProcedure) {
        setProcedure(existingProcedure);
        setIsEditing(false);
      }
    } else if (isNewRecord) {
      setIsEditing(true);

      // Set default patient if selected
      const selectedPatientId = Session.get('selectedPatientId');
      const selectedPatient = Session.get('selectedPatient');

      if (selectedPatient && selectedPatientId) {
        setProcedure(prev => ({
          ...prev,
          subject: {
            reference: `Patient/${selectedPatientId}`,
            display: get(selectedPatient, 'name[0].text', '')
          }
        }));
      }
    }
  }, [id, isSubscriptionReady]);

  const handleChange = (path, value) => {
    const newProcedure = cloneDeep(procedure);
    set(newProcedure, path, value);
    setProcedure(newProcedure);
  };

  const handleSave = async () => {
    console.log('=== ProcedureDetail handleSave called ===');
    console.log('Original procedure data:', procedure);

    const dataToSave = cloneDeep(procedure);

    // Ensure we have required fields
    if (!dataToSave.meta) {
      dataToSave.meta = {};
    }
    dataToSave.meta.lastUpdated = new Date();

    // Convert performedDateTime string to Date object if present
    if (dataToSave.performedDateTime && typeof dataToSave.performedDateTime === 'string') {
      dataToSave.performedDateTime = new Date(dataToSave.performedDateTime);
    }

    // Ensure performer has reference if display is set
    if (get(dataToSave, 'performer[0].actor.display') && !get(dataToSave, 'performer[0].actor.reference')) {
      set(dataToSave, 'performer[0].actor.reference', `Practitioner/${Random.id()}`);
    }

    if (isNewRecord) {
      // Create new procedure
      dataToSave._id = Random.id();
      if (!dataToSave.meta.versionId) {
        dataToSave.meta.versionId = '1';
      }

      console.log('Creating new procedure with data:', dataToSave);

      setLoading(true);
      setError(null);

      try {
        const result = await Meteor.callAsync('createProcedure', dataToSave);
        console.log('Procedure created successfully with result:', result);
        navigate('/procedures');
      } catch (error) {
        console.error('Create error:', error);
        if (error.error === 'validation-error') {
          setError('Validation Error: ' + error.reason);
        } else if (error.error === 'not-authorized') {
          setError('Authorization Error: You must be logged in to create procedures');
        } else {
          setError('Error creating procedure: ' + (error.reason || error.message || 'Unknown error'));
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Update existing procedure
      setLoading(true);
      setError(null);

      try {
        const result = await Meteor.callAsync('updateProcedure', id, dataToSave);
        console.log('Procedure updated successfully:', result);
        setIsEditing(false);
      } catch (error) {
        console.error('Update error:', error);
        setError('Error updating procedure: ' + (error.reason || error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (isExistingRecord) {
      // Reload original data
      const existingProcedure = Procedures.findOne({ _id: id });
      if (existingProcedure) {
        setProcedure(existingProcedure);
      }
      setIsEditing(false);
    } else {
      navigate('/procedures');
    }
  };

  const handleDelete = async () => {
    if (isNewRecord) return;

    if (window.confirm('Are you sure you want to delete this procedure?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeProcedure', id);
        console.log('Procedure deleted');
        navigate('/procedures');
      } catch (error) {
        console.error('Delete error:', error);
        setError('Error deleting procedure: ' + (error.reason || error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSearchUser = () => {
    console.log('Search user clicked');
    setPatientSearchOpen(true);
  };

  const handlePatientSelect = (patientId, patient) => {
    console.log('Patient selected:', patientId, patient);
    setProcedure(prev => ({
      ...prev,
      subject: {
        reference: `Patient/${patientId}`,
        display: get(patient, 'name[0].text', get(patient, 'name', ''))
      }
    }));
    setPatientSearchOpen(false);
  };

  // Build the header title
  let headerTitle = 'New Record';
  if (isExistingRecord) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{id}</span>;
  }

  // Header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new records */}
        {isExistingRecord && (
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

        {/* Form toggle — hidden for new records */}
        {isExistingRecord && (
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

        {/* Lock / Unlock toggle — only for existing records */}
        {isExistingRecord && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing records, gated on edit mode */}
        {isExistingRecord && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDelete}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Form view with all editable fields
  function renderFormView() {
    return (
      <Box>
        <Grid container spacing={3}>
          {/* Patient Field */}
          <Grid item xs={12} md={6}>
            <TextField
              id="subjectDisplay"
              fullWidth
              label="Patient"
              value={get(procedure, 'subject.display', '')}
              onChange={(e) => handleChange('subject.display', e.target.value)}
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
          </Grid>

          {/* Performer Field */}
          <Grid item xs={12} md={6}>
            <TextField
              id="performerDisplay"
              fullWidth
              label="Performer"
              value={get(procedure, 'performer[0].actor.display', '')}
              onChange={(e) => handleChange('performer[0].actor.display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Status */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                id="status"
                labelId="status-label"
                value={get(procedure, 'status', '')}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map(function(option) {
                  return <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>

          {/* Performed Date/Time */}
          <Grid item xs={12} md={6}>
            <TextField
              id="performedDateTime"
              fullWidth
              label="Performed Date/Time"
              type="datetime-local"
              value={get(procedure, 'performedDateTime', '') ? String(get(procedure, 'performedDateTime', '')).substring(0, 16) : ''}
              onChange={(e) => handleChange('performedDateTime', e.target.value)}
              disabled={!isEditing}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>

          {/* Code */}
          <Grid item xs={12} md={6}>
            <TextField
              id="codeCode"
              fullWidth
              label="Procedure Code"
              value={get(procedure, 'code.coding[0].code', '')}
              onChange={(e) => handleChange('code.coding[0].code', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Code Display */}
          <Grid item xs={12} md={6}>
            <TextField
              id="codeDisplay"
              fullWidth
              label="Procedure Name"
              value={get(procedure, 'code.coding[0].display', '')}
              onChange={(e) => handleChange('code.coding[0].display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Category Code */}
          <Grid item xs={12} md={6}>
            <TextField
              id="categoryCode"
              fullWidth
              label="Category Code"
              value={get(procedure, 'category.coding[0].code', '')}
              onChange={(e) => handleChange('category.coding[0].code', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Category Display */}
          <Grid item xs={12} md={6}>
            <TextField
              id="categoryDisplay"
              fullWidth
              label="Category"
              value={get(procedure, 'category.coding[0].display', '')}
              onChange={(e) => handleChange('category.coding[0].display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Body Site Code */}
          <Grid item xs={12} md={6}>
            <TextField
              id="bodySiteCode"
              fullWidth
              label="Body Site Code"
              value={get(procedure, 'bodySite[0].coding[0].code', '')}
              onChange={(e) => handleChange('bodySite[0].coding[0].code', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Body Site Display */}
          <Grid item xs={12} md={6}>
            <TextField
              id="bodySiteDisplay"
              fullWidth
              label="Body Site"
              value={get(procedure, 'bodySite[0].coding[0].display', '')}
              onChange={(e) => handleChange('bodySite[0].coding[0].display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Outcome */}
          <Grid item xs={12} md={6}>
            <TextField
              id="outcome"
              fullWidth
              label="Outcome"
              value={get(procedure, 'outcome.text', '')}
              onChange={(e) => handleChange('outcome.text', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={6}>
            <TextField
              id="locationDisplay"
              fullWidth
              label="Location"
              value={get(procedure, 'location.display', '')}
              onChange={(e) => handleChange('location.display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Reason Code */}
          <Grid item xs={12} md={6}>
            <TextField
              id="reasonCode"
              fullWidth
              label="Reason Code"
              value={get(procedure, 'reasonCode[0].coding[0].code', '')}
              onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Reason Display */}
          <Grid item xs={12} md={6}>
            <TextField
              id="reasonDisplay"
              fullWidth
              label="Reason"
              value={get(procedure, 'reasonCode[0].coding[0].display', '')}
              onChange={(e) => handleChange('reasonCode[0].coding[0].display', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              id="notesTextarea"
              fullWidth
              multiline
              rows={4}
              label="Notes"
              value={get(procedure, 'note[0].text', '')}
              onChange={(e) => handleChange('note[0].text', e.target.value)}
              disabled={!isEditing}
            />
          </Grid>
        </Grid>

        {/* Inline Save/Cancel bar */}
        {isEditing && (
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
              id="saveProcedureButton"
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
    const procedureName = get(procedure, 'code.coding[0].display', '') || get(procedure, 'code.text', 'Unnamed Procedure');
    const procedureCode = get(procedure, 'code.coding[0].code', '');
    const statusValue = get(procedure, 'status', 'unknown');
    const statusLabel = get(statusOptions.find(function(opt) { return opt.value === statusValue; }), 'label', statusValue);
    const statusColor = get(statusColorMap, statusValue, 'default');

    const patientDisplay = get(procedure, 'subject.display', '');
    const patientReference = get(procedure, 'subject.reference', '');
    const performedDate = get(procedure, 'performedDateTime', '');
    const formattedDate = performedDate ? moment(performedDate).format('MMMM D, YYYY [at] h:mm A') : '';

    const performerDisplay = get(procedure, 'performer[0].actor.display', '');
    const performerReference = get(procedure, 'performer[0].actor.reference', '');

    const categoryDisplay = get(procedure, 'category.coding[0].display', '');
    const categoryCode = get(procedure, 'category.coding[0].code', '');

    const bodySiteDisplay = get(procedure, 'bodySite[0].coding[0].display', '');
    const bodySiteCode = get(procedure, 'bodySite[0].coding[0].code', '');

    const reasonDisplay = get(procedure, 'reasonCode[0].coding[0].display', '');
    const reasonCode = get(procedure, 'reasonCode[0].coding[0].code', '');

    const outcomeText = get(procedure, 'outcome.text', '');
    const locationDisplay = get(procedure, 'location.display', '');
    const noteText = get(procedure, 'note[0].text', '');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {/* Procedure name + status chip */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 500 }}>
            {procedureName}
          </Typography>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        {procedureCode && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Code: {procedureCode}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata: Patient left, Date right */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            {(patientDisplay || patientReference) && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Patient
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                  {patientDisplay || 'Unspecified'}
                </Typography>
                {patientReference && (
                  <Typography variant="caption" color="text.secondary">
                    {patientReference}
                  </Typography>
                )}
              </>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            {formattedDate && (
              <>
                <Typography variant="overline" color="text.secondary">
                  Performed
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formattedDate}
                </Typography>
              </>
            )}
            {locationDisplay && (
              <>
                <Typography variant="overline" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
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

        {/* Performer */}
        {(performerDisplay || performerReference) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Performer
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {performerDisplay || 'Unspecified'}
              </Typography>
              {performerReference && (
                <Typography variant="caption" color="text.secondary">
                  {performerReference}
                </Typography>
              )}
            </Box>
            <Divider />
          </>
        )}

        {/* Category */}
        {(categoryDisplay || categoryCode) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {categoryDisplay}{categoryCode ? ' (' + categoryCode + ')' : ''}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Body Site */}
        {(bodySiteDisplay || bodySiteCode) && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Body Site
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {bodySiteDisplay}{bodySiteCode ? ' (' + bodySiteCode + ')' : ''}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Reason */}
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

        {/* Outcome */}
        {outcomeText && (
          <>
            <Box sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Outcome
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {outcomeText}
              </Typography>
            </Box>
            <Divider />
          </>
        )}

        {/* Notes */}
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

        {/* Footer with record ID */}
        {isExistingRecord && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Procedure ID: {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Container id="procedureDetailPage" maxWidth="md" sx={{ py: 4 }}>
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
          defaultSearchTerm={get(procedure, 'subject.display', '')}
        />
      </Dialog>
    </Container>
  );
}

export default ProcedureDetail;
