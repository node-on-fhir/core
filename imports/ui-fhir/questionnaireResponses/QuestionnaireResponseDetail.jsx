// /imports/ui-fhir/questionnaireResponses/QuestionnaireResponseDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { get, set, has, cloneDeep } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Collections are initialized globally
let QuestionnaireResponses;
let Questionnaires;

Meteor.startup(function(){
  QuestionnaireResponses = Meteor.Collections.QuestionnaireResponses;
  Questionnaires = Meteor.Collections.Questionnaires;
});

function QuestionnaireResponseDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  console.log('QuestionnaireResponseDetail mounted with id:', id);
  console.log('Type of id:', typeof id);
  console.log('id === "new":', id === 'new');
  console.log('id is undefined:', id === undefined);
  console.log('pathname:', window.location.pathname);
  
  // Check if we're creating a new response
  const isNew = !id || window.location.pathname.endsWith('/new');
  console.log('isNew:', isNew);
  
  // State
  const [questionnaireResponse, setQuestionnaireResponse] = useState({
    resourceType: 'QuestionnaireResponse',
    questionnaire: '',
    status: 'in-progress',
    authored: moment().format('YYYY-MM-DDTHH:mm:ss')
  });

  const [isEditing, setIsEditing] = useState(isNew);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Subscribe to data
  useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    if(autoPublishEnabled){
      return Meteor.subscribe('autopublish.QuestionnaireResponses', {}, {});
    } else {
      return Meteor.subscribe('questionnaireresponses.all');
    }
  }, []);

  // Get selected patient from session
  const selectedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  // Load questionnaire response if editing
  useEffect(function() {
    async function loadQuestionnaireResponse() {
      console.log('loadQuestionnaireResponse called with id:', id, 'isNew:', isNew);
      console.log('QuestionnaireResponses collection available:', !!QuestionnaireResponses);
      
      if (id && !isNew) {
        try {
          setLoading(true);
          
          // First, try to get from local collection if available
          if (QuestionnaireResponses) {
            let localResponse = QuestionnaireResponses.findOne(id) || 
                                QuestionnaireResponses.findOne({_id: id}) || 
                                QuestionnaireResponses.findOne({id: id});
            if (localResponse) {
              console.log('Found questionnaire response in local collection:', localResponse);
              
              // Extract questionnaireDisplay from extension if present
              if (localResponse.extension && Array.isArray(localResponse.extension)) {
                const displayExtension = localResponse.extension.find(ext => 
                  ext.url === 'http://example.org/fhir/StructureDefinition/questionnaire-display'
                );
                if (displayExtension && displayExtension.valueString) {
                  localResponse.questionnaireDisplay = displayExtension.valueString;
                }
              }
              
              setQuestionnaireResponse(localResponse);
              setLoading(false);
              return;
            }
          }
          
          // If not found locally, call the method
          console.log('Calling method to get questionnaire response...');
          const response = await Meteor.callAsync('questionnaireResponses.get', id);
          if (response) {
            // Extract questionnaireDisplay from extension if present
            if (response.extension && Array.isArray(response.extension)) {
              const displayExtension = response.extension.find(ext => 
                ext.url === 'http://example.org/fhir/StructureDefinition/questionnaire-display'
              );
              if (displayExtension && displayExtension.valueString) {
                response.questionnaireDisplay = displayExtension.valueString;
              }
            }
            setQuestionnaireResponse(response);
          } else {
            setError('Questionnaire response not found');
          }
        } catch (err) {
          console.error('Error loading questionnaire response:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    }
    loadQuestionnaireResponse();
  }, [id, isNew, QuestionnaireResponses]);

  // Set patient info when selected patient changes
  useEffect(function() {
    if (selectedPatient && isEditing) {
      handleChange('subject.reference', `Patient/${selectedPatient._id}`);
      handleChange('subject.display', FhirUtilities.pluckName(selectedPatient));
    }
  }, [selectedPatient, isEditing]);

  // Set author info for new records
  useEffect(function() {
    if (isNew && Meteor.user()) {
      const user = Meteor.user();
      const authorName = get(user, 'profile.name.text', user.username || 'Unknown User');
      handleChange('author.display', authorName);
      handleChange('author.reference', `Practitioner/${user._id}`);
    }
  }, [id]);

  function handleChange(path, value) {
    const updatedResponse = cloneDeep(questionnaireResponse);
    set(updatedResponse, path, value);
    setQuestionnaireResponse(updatedResponse);
  }

  function handleSearchUser() {
    setShowPatientSearch(true);
  }

  function handleSelectPatient(patient) {
    if (patient) {
      handleChange('subject.reference', `Patient/${patient._id}`);
      handleChange('subject.display', FhirUtilities.pluckName(patient));
    }
    setShowPatientSearch(false);
  }

  async function handleSave() {
    console.log('handleSave called');
    console.log('Current ID:', id);
    console.log('Is new:', isNew);
    
    try {
      setLoading(true);
      setError('');

      // Log the current form data
      console.log('Current questionnaireResponse state:', questionnaireResponse);
      
      // Create a minimal valid QuestionnaireResponse
      const responseToSave = {
        resourceType: 'QuestionnaireResponse',
        status: get(questionnaireResponse, 'status', 'in-progress'),
        authored: get(questionnaireResponse, 'authored') ? moment(get(questionnaireResponse, 'authored')).toISOString() : moment().toISOString()
      };

      // Add questionnaire if present
      const questionnaire = get(questionnaireResponse, 'questionnaire', '').trim();
      if (questionnaire) {
        responseToSave.questionnaire = questionnaire;
      }
      
      // Add questionnaire display as extension
      const questionnaireDisplay = get(questionnaireResponse, 'questionnaireDisplay', '').trim();
      if (questionnaireDisplay) {
        responseToSave.extension = responseToSave.extension || [];
        responseToSave.extension.push({
          url: 'http://example.org/fhir/StructureDefinition/questionnaire-display',
          valueString: questionnaireDisplay
        });
      }
      
      // Only include nested objects if they have actual data
      if (get(questionnaireResponse, 'subject.reference') || get(questionnaireResponse, 'subject.display')) {
        responseToSave.subject = {
          reference: get(questionnaireResponse, 'subject.reference', ''),
          display: get(questionnaireResponse, 'subject.display', '')
        };
      }
      
      if (get(questionnaireResponse, 'author.reference') || get(questionnaireResponse, 'author.display')) {
        responseToSave.author = {
          reference: get(questionnaireResponse, 'author.reference', ''),
          display: get(questionnaireResponse, 'author.display', '')
        };
      }
      
      if (get(questionnaireResponse, 'source.reference') || get(questionnaireResponse, 'source.display')) {
        responseToSave.source = {
          reference: get(questionnaireResponse, 'source.reference', ''),
          display: get(questionnaireResponse, 'source.display', '')
        };
      }
      
      // Handle identifier array properly
      const identifierValue = get(questionnaireResponse, 'identifier[0].value', '');
      if (identifierValue) {
        responseToSave.identifier = [{
          system: 'http://example.org/identifier',
          value: identifierValue
        }];
      }
      
      // Handle basedOn array
      const basedOnRef = get(questionnaireResponse, 'basedOn[0].reference', '');
      if (basedOnRef) {
        responseToSave.basedOn = [{
          reference: basedOnRef
        }];
      }
      
      // Handle partOf array
      const partOfRef = get(questionnaireResponse, 'partOf[0].reference', '');
      if (partOfRef) {
        responseToSave.partOf = [{
          reference: partOfRef
        }];
      }
      
      // Handle reasonCode array
      const reasonCode = get(questionnaireResponse, 'reasonCode[0].coding[0].code', '');
      const reasonDisplay = get(questionnaireResponse, 'reasonCode[0].coding[0].display', '');
      if (reasonCode || reasonDisplay) {
        responseToSave.reasonCode = [{
          coding: [{
            system: 'http://snomed.info/sct',
            code: reasonCode,
            display: reasonDisplay
          }]
        }];
      }
      
      // Handle note array
      const noteText = get(questionnaireResponse, 'note[0].text', '');
      if (noteText) {
        responseToSave.note = [{
          text: noteText,
          time: new Date().toISOString()
        }];
      }

      if (isNew) {
        // Create new questionnaire response
        console.log('Attempting to save questionnaire response:', JSON.stringify(responseToSave, null, 2));
        
        // First check if the method exists with minimal data
        try {
          const testData = { resourceType: 'QuestionnaireResponse', status: 'in-progress' };
          console.log('Testing method with minimal data:', testData);
          const testResult = await Meteor.callAsync('questionnaireResponses.create', testData);
          console.log('Method test succeeded with ID:', testResult);
        } catch (testErr) {
          console.error('Method test failed:', testErr);
          console.error('Error details:', testErr.details || testErr.error || testErr.message);
        }
        
        const newId = await Meteor.callAsync('questionnaireResponses.create', responseToSave);
        console.log('Created questionnaire response with ID:', newId);
        navigate('/questionnaire-responses');
      } else {
        // Update existing questionnaire response
        await Meteor.callAsync('questionnaireResponses.update', id, responseToSave);
        console.log('Updated questionnaire response:', id);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error saving questionnaire response:', err);
      console.error('Error details:', err.details || err.error || err);
      setError(err.message || err.reason || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    try {
      setLoading(true);
      await Meteor.callAsync('questionnaireResponses.remove', id);
      navigate('/questionnaire-responses');
    } catch (err) {
      console.error('Error deleting questionnaire response:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  }

  function renderHeader() {
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4" component="h1">
              {isNew ? 'New Questionnaire Response' : 'Questionnaire Response Details'}
            </Typography>
          </Grid>
          {!isNew && (
            <>
              <Grid item>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {moment(get(questionnaireResponse, 'meta.lastUpdated')).format('MMM DD, YYYY')}
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Chip 
                  label={`v${get(questionnaireResponse, 'meta.versionId', '1')}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Grid>
              <Grid item>
                <Tooltip title={isEditing ? "Lock to prevent editing" : "Unlock to edit"}>
                  <IconButton onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? <LockOpenIcon /> : <LockIcon />}
                  </IconButton>
                </Tooltip>
              </Grid>
            </>
          )}
        </Grid>
        {id !== 'new' && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" className="barcode helveticas">
              {id}
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Container id="questionnaireResponseDetailPage" maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {renderHeader()}

      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                id="identifier"
                fullWidth
                label="Identifier"
                value={get(questionnaireResponse, 'identifier[0].value', '')}
                onChange={(e) => handleChange('identifier[0].value', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl id="status" fullWidth margin="normal" disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={get(questionnaireResponse, 'status', 'in-progress')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="amended">Amended</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="stopped">Stopped</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Subject/Patient */}
            <Grid item xs={12} md={6}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(questionnaireResponse, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputProps={{
                  endAdornment: isEditing && (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton onClick={handleSearchUser} edge="end">
                          <SearchIcon />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Author */}
            <Grid item xs={12} md={6}>
              <TextField
                id="authorDisplay"
                fullWidth
                label="Author"
                value={get(questionnaireResponse, 'author.display', '')}
                onChange={(e) => handleChange('author.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            {/* Questionnaire Reference */}
            <Grid item xs={12} md={6}>
              <TextField
                id="questionnaire"
                fullWidth
                label="Questionnaire Reference"
                value={get(questionnaireResponse, 'questionnaire', '')}
                onChange={(e) => handleChange('questionnaire', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                helperText="Format: Questionnaire/id"
              />
            </Grid>

            {/* Questionnaire Display */}
            <Grid item xs={12} md={6}>
              <TextField
                id="questionnaireDisplay"
                fullWidth
                label="Questionnaire Display"
                value={get(questionnaireResponse, 'questionnaireDisplay', '')}
                onChange={(e) => handleChange('questionnaireDisplay', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            {/* Authored Date */}
            <Grid item xs={12} md={6}>
              <TextField
                id="authored"
                fullWidth
                label="Authored"
                type="datetime-local"
                value={moment(get(questionnaireResponse, 'authored', '')).format('YYYY-MM-DDTHH:mm')}
                onChange={(e) => handleChange('authored', moment(e.target.value).toISOString())}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            {/* Source */}
            <Grid item xs={12} md={6}>
              <TextField
                id="source"
                fullWidth
                label="Source"
                value={get(questionnaireResponse, 'source.display', '')}
                onChange={(e) => handleChange('source.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                helperText="Who answered the questions"
              />
            </Grid>

            {/* Based On */}
            <Grid item xs={12} md={6}>
              <TextField
                id="basedOn"
                fullWidth
                label="Based On"
                value={get(questionnaireResponse, 'basedOn[0].reference', '')}
                onChange={(e) => handleChange('basedOn[0].reference', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                helperText="ServiceRequest or CarePlan reference"
              />
            </Grid>

            {/* Part Of */}
            <Grid item xs={12} md={6}>
              <TextField
                id="partOf"
                fullWidth
                label="Part Of"
                value={get(questionnaireResponse, 'partOf[0].reference', '')}
                onChange={(e) => handleChange('partOf[0].reference', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                helperText="Encounter or Procedure reference"
              />
            </Grid>

            {/* Reason Code */}
            <Grid item xs={12} md={6}>
              <TextField
                id="reasonCode"
                fullWidth
                label="Reason Code"
                value={get(questionnaireResponse, 'reasonCode[0].coding[0].code', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                helperText="SNOMED CT code"
              />
            </Grid>

            {/* Reason Display */}
            <Grid item xs={12} md={6}>
              <TextField
                id="reasonDisplay"
                fullWidth
                label="Reason Display"
                value={get(questionnaireResponse, 'reasonCode[0].coding[0].display', '')}
                onChange={(e) => handleChange('reasonCode[0].coding[0].display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
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
                value={get(questionnaireResponse, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>
          </Grid>
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && !isNew ? (
            <>
              <Button onClick={() => navigate('/questionnaire-responses')}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (isNew) {
                    navigate('/questionnaire-responses');
                  } else {
                    setIsEditing(false);
                    // Reload original data
                    window.location.reload();
                  }
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              {!isNew && (
                <Button
                  color="error"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                id="saveQuestionnaireResponseButton"
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>

      {/* Patient Search Dialog */}
      <PatientSearchDialog
        open={showPatientSearch}
        onClose={() => setShowPatientSearch(false)}
        onSelect={handleSelectPatient}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Questionnaire Response</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this questionnaire response? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default QuestionnaireResponseDetail;