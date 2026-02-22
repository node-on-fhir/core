// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui-fhir/careTeams/CareTeamDetail.jsx

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
  InputAdornment,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { get, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import PatientSearchDialog from '/imports/components/PatientSearchDialog';
import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Import collections directly
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

function CareTeamDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to care teams data
  const isSubscriptionReady = useTracker(function(){
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize isEditing based on whether we're creating new or viewing existing
  const [isEditing, setIsEditing] = useState(!id || id === 'new');
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  
  // Set default values on component mount for new care teams
  useEffect(function() {
    console.log('CareTeamDetail useEffect - id:', id, 'isEditing:', isEditing);
    if (!id || id === 'new') {
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
    } else if (id && isSubscriptionReady) {
      // Load existing care team
      const existingCareTeam = CareTeams.findOne({_id: id}) || CareTeams.findOne({id: id});
      if (existingCareTeam) {
        setCareTeam(existingCareTeam);
        setIsEditing(false); // Default to read mode for existing records
      }
    }
  }, [id, selectedPatient, isSubscriptionReady]);
  
  const careTeamId = id && id !== 'new' ? id : null;
  
  function handleChange(path, value) {
    setCareTeam(prev => {
      const updated = {...prev};
      set(updated, path, value);
      return updated;
    });
  }
  
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
    if (window.confirm('Are you sure you want to delete this care team?')) {
      setLoading(true);
      setError(null);

      try {
        // Use MongoDB _id from the loaded care team object, not the URL param
        // The URL param might be the FHIR id, but delete requires MongoDB _id
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
  
  function handleEditButton() {
    setIsEditing(true);
  }
  
  function handleBackButton() {
    navigate('/care-teams');
  }
  
  function handleSearchUser() {
    setPatientSearchOpen(true);
  }
  
  function handlePatientSelect(patient) {
    const patientFhirId = get(patient, 'id');
    const patientDisplay = FhirUtilities.pluckName(patient);
    
    handleChange('subject', {
      reference: `Patient/${patientFhirId}`,
      display: patientDisplay
    });
    setPatientSearchOpen(false);
  }
  
  return (
    <Container id="careTeamDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={careTeamId ? 'Edit Care Team' : 'New Care Team'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          action={
            careTeamId && (
              <IconButton
                color="inherit"
                onClick={isEditing ? handleCancelButton : handleEditButton}
                sx={{ color: 'inherit' }}
              >
                {isEditing ? <LockOpenIcon /> : <LockIcon />}
              </IconButton>
            )
          }
        />
        <CardContent>
          {(careTeamId && careTeamId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{careTeamId}</span>
            </Box>
          )}
          
          {error && (
            <Box sx={{ mb: 2 }}>
              <Typography color="error">{error}</Typography>
            </Box>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                id="subjectInput"
                fullWidth
                label="Patient"
                value={get(careTeam, 'subject.display', '')}
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
            
            <Grid item xs={12} md={8}>
              <TextField
                id="nameInput"
                fullWidth
                label="Care Team Name"
                value={get(careTeam, 'name', '')}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={!isEditing}>
                <InputLabel>Status</InputLabel>
                <Select
                  id="statusInput"
                  value={get(careTeam, 'status', 'active')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  label="Status"
                >
                  <MenuItem value="proposed">Proposed</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="categoryCodeInput"
                fullWidth
                label="Category Code"
                value={get(careTeam, 'category[0].coding[0].code', '')}
                onChange={(e) => handleChange('category[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
                placeholder="135411"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="categoryDisplayInput"
                fullWidth
                label="Category Display"
                value={get(careTeam, 'category[0].coding[0].display', '') || get(careTeam, 'category[0].text', '')}
                onChange={(e) => {
                  handleChange('category[0].coding[0].display', e.target.value);
                  handleChange('category[0].text', e.target.value);
                }}
                disabled={!isEditing}
                placeholder="Home health"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="periodStartInput"
                fullWidth
                label="Period Start"
                type="date"
                value={moment(get(careTeam, 'period.start')).format('YYYY-MM-DD')}
                onChange={(e) => handleChange('period.start', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="periodEndInput"
                fullWidth
                label="Period End"
                type="date"
                value={get(careTeam, 'period.end') ? moment(get(careTeam, 'period.end')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('period.end', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>Participants</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="participantRoleCodeInput"
                fullWidth
                label="Participant Role Code"
                value={get(careTeam, 'participant[0].role[0].coding[0].code', '')}
                onChange={(e) => handleChange('participant[0].role[0].coding[0].code', e.target.value)}
                disabled={!isEditing}
                placeholder="768730001"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="participantRoleDisplayInput"
                fullWidth
                label="Participant Role Display"
                value={get(careTeam, 'participant[0].role[0].coding[0].display', '') || get(careTeam, 'participant[0].role[0].text', '')}
                onChange={(e) => {
                  handleChange('participant[0].role[0].coding[0].display', e.target.value);
                  handleChange('participant[0].role[0].text', e.target.value);
                }}
                disabled={!isEditing}
                placeholder="Care coordinator"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="participantMemberInput"
                fullWidth
                label="Participant Member"
                value={get(careTeam, 'participant[0].member.display', '')}
                onChange={(e) => handleChange('participant[0].member.display', e.target.value)}
                disabled={!isEditing}
                placeholder="Dr. Smith"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="participantPeriodStartInput"
                fullWidth
                label="Participant Period Start"
                type="date"
                value={get(careTeam, 'participant[0].period.start') ? moment(get(careTeam, 'participant[0].period.start')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('participant[0].period.start', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                id="participantPeriodEndInput"
                fullWidth
                label="Participant Period End"
                type="date"
                value={get(careTeam, 'participant[0].period.end') ? moment(get(careTeam, 'participant[0].period.end')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('participant[0].period.end', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="managingOrganizationInput"
                fullWidth
                label="Managing Organization"
                value={get(careTeam, 'managingOrganization[0].display', '')}
                onChange={(e) => handleChange('managingOrganization[0].display', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                id="noteInput"
                fullWidth
                multiline
                rows={4}
                label="Notes"
                value={get(careTeam, 'note[0].text', '')}
                onChange={(e) => handleChange('note[0].text', e.target.value)}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {isEditing ? (
            <>
              <Button onClick={handleCancelButton}>Cancel</Button>
              <Button
                id="saveCareTeamButton"
                variant="contained"
                color="primary"
                onClick={handleSaveButton}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleBackButton}>Back</Button>
              {careTeamId && (
                <Button
                  color="error"
                  onClick={handleDeleteButton}
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleEditButton}
              >
                Edit
              </Button>
            </>
          )}
        </CardActions>
      </Card>
      
      <PatientSearchDialog
        open={patientSearchOpen}
        onClose={() => setPatientSearchOpen(false)}
        onSelectPatient={handlePatientSelect}
      />
    </Container>
  );
}

export default CareTeamDetail;