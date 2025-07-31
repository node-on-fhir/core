// /imports/ui-fhir/procedures/ProcedureDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Tooltip,
  Stack,
  Chip,
  Alert,
  Paper,
  Dialog
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import QrCodeIcon from '@mui/icons-material/QrCode';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, has, cloneDeep } from 'lodash';
import moment from 'moment';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collections directly - avoids timing issues
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//===========================================================================
// COMPONENT

function ProcedureDetail(props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  
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

  const [isEditing, setIsEditing] = useState(!id || id === 'new');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);

  // Fetch existing procedure
  useEffect(() => {
    if (id && id !== 'new') {
      const existingProcedure = Procedures.findOne({ _id: id });
      if (existingProcedure) {
        setProcedure(existingProcedure);
        setIsEditing(false);
      }
    } else {
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

      // Don't set default performer for new procedures - let the form handle it
      // The test expects to be able to set a custom performer name
    }
  }, [id]);

  // Subscribe to procedures
  useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.Procedures', {}, {});
    } else {
      return Meteor.subscribe('procedures.all');
    }
  }, []);

  const handleChange = (path, value) => {
    const newProcedure = cloneDeep(procedure);
    set(newProcedure, path, value);
    setProcedure(newProcedure);
  };

  const handleSave = async () => {
    console.log('=== ProcedureDetail handleSave called ===');
    console.log('Original procedure data:', procedure);
    console.log('Procedure status:', get(procedure, 'status'));
    console.log('Procedure code:', get(procedure, 'code'));
    console.log('Procedure subject:', get(procedure, 'subject'));
    
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

    if (!id || id === 'new') {
      // Create new procedure
      dataToSave._id = Random.id();
      if (!dataToSave.meta.versionId) {
        dataToSave.meta.versionId = '1';
      }

      console.log('Creating new procedure with data:', dataToSave);
      console.log('DataToSave has resourceType:', dataToSave.resourceType);
      console.log('DataToSave has status:', dataToSave.status);
      console.log('DataToSave has code:', dataToSave.code);
      console.log('DataToSave has subject:', dataToSave.subject);
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await Meteor.callAsync('createProcedure', dataToSave);
        console.log('Procedure created successfully with result:', result);
        console.log('Navigating to /procedures');
        navigate('/procedures');
      } catch (error) {
        console.error('Create error:', error);
        console.error('Error details:', error.details);
        console.error('Error reason:', error.reason);
        console.error('Error message:', error.message);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Show user-friendly error message
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
        console.error('Full error object:', JSON.stringify(error, null, 2));
        setError('Error updating procedure: ' + (error.reason || error.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!id || id === 'new') return;
    
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

  return (
    <Container id="procedureDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" className={id && id !== 'new' ? "barcode helveticas" : ""}>
                {id && id !== 'new' ? id : 'New Record'}
              </Typography>
              {id && id !== 'new' && (
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Lock/Edit icon */}
                  <Tooltip title={isEditing ? 'Edit Mode' : 'View Mode'}>
                    <IconButton 
                      size="small" 
                      sx={{ color: 'inherit' }}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? <LockOpenIcon /> : <LockIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  {/* ID/QR Code icon */}
                  <Tooltip title="Resource ID">
                    <IconButton size="small" sx={{ color: 'inherit' }}>
                      <QrCodeIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Version */}
                  <Chip 
                    label={`v${get(procedure, 'meta.versionId', '1')}`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(255,255,255,0.3)' }}
                  />
                  
                  {/* Last Updated */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AccessTimeIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption">
                      {moment(get(procedure, 'meta.lastUpdated', new Date())).fromNow()}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          }
          subheader={id === 'new' ? 'Create a new procedure' : `Procedure performed on ${moment(get(procedure, 'performedDateTime', '')).format('MMM DD, YYYY')}`}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': {
              color: 'primary.contrastText',
              opacity: 0.8
            }
          }}
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
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
                    <MenuItem value="preparation">Preparation</MenuItem>
                    <MenuItem value="in-progress">In Progress</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="aborted">Aborted</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                    <MenuItem value="unknown">Unknown</MenuItem>
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
          </CardContent>
          
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {isEditing && (
              <>
                <Button
                  onClick={() => navigate('/procedures')}
                  startIcon={<CancelIcon />}
                >
                  Cancel
                </Button>
                <Button
                  id="saveProcedureButton"
                  onClick={handleSave}
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
            {!isEditing && id !== 'new' && (
              <>
                <Button
                  onClick={() => navigate('/procedures')}
                  startIcon={<CancelIcon />}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                  startIcon={<LockOpenIcon />}
                  variant="outlined"
                >
                  Edit
                </Button>
                <Button
                  onClick={handleDelete}
                  color="error"
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              </>
            )}
          </CardActions>
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