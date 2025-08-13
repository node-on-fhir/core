// /imports/ui-fhir/researchSubjects/ResearchSubjectDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import { 
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
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
  Paper,
  Alert,
  Grid,
  Dialog
} from '@mui/material';

import QrCodeIcon from '@mui/icons-material/QrCode';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import the collection directly
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';

// Get the Patients collection 
let Patients;
Meteor.startup(function(){
  if (Meteor.Collections?.Patients) {
    Patients = Meteor.Collections.Patients;
  }
});

function ResearchSubjectDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to research subjects and patients data
  const subscriptionReady = useTracker(() => {
    const researchSubjectsHandle = Meteor.subscribe('autopublish.ResearchSubjects');
    const patientsHandle = Meteor.subscribe('patients.all');
    return researchSubjectsHandle.ready() && patientsHandle.ready();
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
  const [researchSubject, setResearchSubject] = useState({
    resourceType: "ResearchSubject",
    identifier: [],
    status: "on-study",
    period: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'year').format('YYYY-MM-DD')
    },
    study: {
      reference: "",
      display: ""
    },
    subject: {
      reference: "",
      display: ""
    },
    assignedArm: "",
    actualArm: "",
    consent: {
      reference: "",
      display: ""
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(!id || id === 'new');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  
  // Load existing research subject if editing
  useEffect(() => {
    if (id && id !== 'new' && ResearchSubjects) {
      setLoading(true);
      const existingSubject = ResearchSubjects.findOne(id);
      
      if (existingSubject) {
        console.log('Loading existing research subject:', existingSubject);
        setResearchSubject(existingSubject);
        setIsEditing(false);
      } else {
        console.log('Research subject not found:', id);
        setError('Research subject not found');
      }
      setLoading(false);
    } else if (id === 'new') {
      // For new research subjects, set the selected patient if available
      if (selectedPatient && selectedPatientId) {
        setResearchSubject(prev => ({
          ...prev,
          subject: {
            reference: `Patient/${selectedPatientId}`,
            display: get(selectedPatient, 'name[0].text', '')
          }
        }));
      }
      setIsEditing(true);
    }
  }, [id, selectedPatient, selectedPatientId, subscriptionReady]);

  // Handle form field changes
  const handleChange = (field, value) => {
    console.log('handleChange', field, value);
    let newSubject = Object.assign({}, researchSubject);
    
    // Special handling for nested fields to ensure parent objects exist
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = newSubject;
      
      // Create parent objects if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
    }
    
    set(newSubject, field, value);
    setResearchSubject(newSubject);
  };

  // Handle save
  const handleSave = async () => {
    console.log('handleSave called with id:', id, 'id === "new":', id === 'new', 'typeof id:', typeof id);
    setError(null);

    // Client-side validation
    console.log('Validating research subject before save:', {
      study: researchSubject.study,
      subject: researchSubject.subject,
      status: researchSubject.status
    });
    
    if (!researchSubject.study?.display?.trim()) {
      setError('Please enter a Research Study reference');
      return;
    }
    
    if (!researchSubject.subject?.display?.trim() && !researchSubject.subject?.reference) {
      setError('Please select a Patient/Subject');
      return;
    }
    
    if (!researchSubject.status) {
      setError('Please select a Status');
      return;
    }

    setLoading(true);

    try {
      let dataToSave = Object.assign({}, researchSubject);
      
      // Clean up data before saving
      delete dataToSave._id;
      
      // Ensure subject reference is set
      if (!dataToSave.subject?.reference) {
        if (selectedPatientId) {
          dataToSave.subject = {
            reference: `Patient/${selectedPatientId}`,
            display: get(selectedPatient, 'name[0].text', '')
          };
        } else if (dataToSave.subject?.display) {
          // If we have a display name but no reference, create a placeholder reference
          // This is mainly for testing purposes
          const patientId = dataToSave.subject.display.replace(/[^a-zA-Z0-9]/g, '-');
          dataToSave.subject.reference = `Patient/${patientId}`;
        }
      }
      
      // Ensure study reference is set
      if (dataToSave.study && dataToSave.study.display && !dataToSave.study.reference) {
        // Generate a reference from the display text if no reference exists
        const studyId = dataToSave.study.display.replace(/[^a-zA-Z0-9]/g, '-');
        dataToSave.study.reference = `ResearchStudy/${studyId}`;
      }

      console.log('Saving research subject:', dataToSave);
      console.log('subject object:', dataToSave.subject);
      console.log('study object:', dataToSave.study);
      
      if (!id || id === 'new') {
        // Create new research subject using async/await
        try {
          const result = await Meteor.callAsync('researchSubjects.create', {
            researchSubject: dataToSave
          });
          console.log('Created research subject:', result);
          setLoading(false);
          
          // Add a small delay before navigation to ensure save completes
          setTimeout(() => {
            navigate('/research-subjects');
          }, 500);
        } catch (error) {
          console.error('Create error:', error);
          setLoading(false);
          setError(error.reason || 'Failed to create research subject');
        }
      } else {
        // Update existing research subject using async/await
        try {
          const result = await Meteor.callAsync('researchSubjects.update', {
            _id: id,
            researchSubject: dataToSave
          });
          console.log('Updated research subject');
          setLoading(false);
          setIsEditing(false);
          
          // Add a small delay before navigation
          setTimeout(() => {
            navigate('/research-subjects');
          }, 500);
        } catch (error) {
          console.error('Update error:', error);
          setLoading(false);
          setError(error.reason || 'Failed to update research subject');
        }
      }
    } catch (err) {
      setLoading(false);
      setError(err.message);
      console.error('Save error:', err);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (id && id !== 'new') {
      if (window.confirm('Are you sure you want to delete this research subject?')) {
        setLoading(true);
        
        try {
          await Meteor.callAsync('researchSubjects.remove', {
            _id: id
          });
          console.log('Deleted research subject');
          setLoading(false);
          
          // Add a small delay before navigation
          setTimeout(() => {
            navigate('/research-subjects');
          }, 500);
        } catch (error) {
          console.error('Delete error:', error);
          setLoading(false);
          setError(error.reason || 'Failed to delete research subject');
        }
      }
    }
  };

  const handlePatientSelect = (patient) => {
    console.log('Selected patient:', patient);
    handleChange('subject', {
      reference: `Patient/${patient._id}`,
      display: get(patient, 'name[0].text', '')
    });
    setPatientSearchOpen(false);
  };

  const handleSearchUser = () => {
    setPatientSearchOpen(true);
  };

  // Get display text for status
  const getStatusDisplay = (status) => {
    const statusMap = {
      'candidate': 'Candidate',
      'eligible': 'Eligible',
      'follow-up': 'Follow-up',
      'ineligible': 'Ineligible',
      'not-registered': 'Not Registered',
      'off-study': 'Off Study',
      'on-study': 'On Study',
      'on-study-intervention': 'On Study Intervention',
      'on-study-observation': 'On Study Observation',
      'pending-on-study': 'Pending On Study',
      'potential-candidate': 'Potential Candidate',
      'screening': 'Screening',
      'withdrawn': 'Withdrawn'
    };
    return statusMap[status] || status;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card 
        id="researchSubjectDetailPage"
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <CardHeader 
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h5" component="h2">
                {id === 'new' ? 'New Research Subject' : 'Research Subject Details'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {!isEditing && id !== 'new' && (
                  <Tooltip title="Edit">
                    <IconButton onClick={() => setIsEditing(true)}>
                      <LockIcon />
                    </IconButton>
                  </Tooltip>
                )}
                {isEditing && id !== 'new' && (
                  <Tooltip title="Cancel Edit">
                    <IconButton onClick={() => setIsEditing(false)}>
                      <LockOpenIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          }
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'grey.50'
          }}
        />
        
        <CardContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Subject/Patient *"
                placeholder="Search for patient"
                helperText="Required: The patient enrolled in this study"
                value={get(researchSubject, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                disabled={!isEditing}
                required
                error={!!error && error.includes('Patient')}
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
            
            <Grid item xs={12}>
              <TextField
                id="studyDisplay"
                fullWidth
                label="Research Study *"
                placeholder="Enter study name or identifier"
                helperText="Required: The research study this subject is enrolled in"
                value={get(researchSubject, 'study.display', '')}
                onChange={(e) => handleChange('study.display', e.target.value)}
                disabled={!isEditing}
                required
                error={!!error && error.includes('Study')}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={get(researchSubject, 'status', 'on-study')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="candidate">Candidate</MenuItem>
                  <MenuItem value="eligible">Eligible</MenuItem>
                  <MenuItem value="follow-up">Follow-up</MenuItem>
                  <MenuItem value="ineligible">Ineligible</MenuItem>
                  <MenuItem value="not-registered">Not Registered</MenuItem>
                  <MenuItem value="off-study">Off Study</MenuItem>
                  <MenuItem value="on-study">On Study</MenuItem>
                  <MenuItem value="on-study-intervention">On Study Intervention</MenuItem>
                  <MenuItem value="on-study-observation">On Study Observation</MenuItem>
                  <MenuItem value="pending-on-study">Pending On Study</MenuItem>
                  <MenuItem value="potential-candidate">Potential Candidate</MenuItem>
                  <MenuItem value="screening">Screening</MenuItem>
                  <MenuItem value="withdrawn">Withdrawn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodStart"
                fullWidth
                label="Period Start"
                type="date"
                value={get(researchSubject, 'period.start', '')}
                onChange={(e) => handleChange('period.start', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="periodEnd"
                fullWidth
                label="Period End"
                type="date"
                value={get(researchSubject, 'period.end', '')}
                onChange={(e) => handleChange('period.end', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="assignedArm"
                fullWidth
                label="Assigned Arm"
                value={get(researchSubject, 'assignedArm', '')}
                onChange={(e) => handleChange('assignedArm', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                id="actualArm"
                fullWidth
                label="Actual Arm"
                value={get(researchSubject, 'actualArm', '')}
                onChange={(e) => handleChange('actualArm', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="consentDisplay"
                fullWidth
                label="Consent"
                value={get(researchSubject, 'consent.display', '')}
                onChange={(e) => handleChange('consent.display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', px: 3, py: 2, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => navigate('/research-subjects')}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          {isEditing && (
            <>
              {id !== 'new' && (
                <Button 
                  color="error" 
                  onClick={handleDelete}
                  disabled={loading}
                  sx={{ textTransform: 'none' }}
                >
                  Delete
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={handleSave}
                disabled={loading}
                id="saveResearchSubjectButton"
                sx={{ textTransform: 'none' }}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
      
      <PatientSearchDialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelect={handlePatientSelect}
      />
    </Container>
  );
}

export default ResearchSubjectDetail;