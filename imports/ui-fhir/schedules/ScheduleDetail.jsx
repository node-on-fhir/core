// /imports/ui-fhir/schedules/ScheduleDetail.jsx

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
  Dialog,
  FormControlLabel,
  Switch
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

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// Direct import to avoid timing issues
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';

function ScheduleDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Subscribe to schedules data
  const subscriptionReady = useTracker(() => {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    
    if(autoPublishEnabled) {
      // Schedules are not patient-specific
      return true;
    }
    
    const schedulesHandle = Meteor.subscribe('schedules', {});
    return schedulesHandle.ready();
  }, []);

  // Get current user from session/tracker
  const currentUser = useTracker(function() {
    return Meteor.user();
  }, []);
  
  // Initialize state with proper FHIR R4 structure
  const [schedule, setSchedule] = useState({
    resourceType: "Schedule",
    active: true,
    identifier: [{
      system: "",
      value: ""
    }],
    serviceCategory: [{
      coding: [{
        system: "http://example.org/service-category",
        code: "",
        display: ""
      }]
    }],
    serviceType: [{
      coding: [{
        system: "http://example.org/service-type",
        code: "",
        display: ""
      }]
    }],
    specialty: [{
      coding: [{
        system: "http://snomed.info/sct",
        code: "",
        display: ""
      }]
    }],
    actor: [{
      reference: "",
      display: ""
    }],
    planningHorizon: {
      start: moment().format('YYYY-MM-DD'),
      end: moment().add(1, 'month').format('YYYY-MM-DD')
    },
    comment: "",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(id === 'new');
  const [forceUpdate, setForceUpdate] = useState(0); // Force re-render counter
  
  // Load schedule if id is provided
  useEffect(() => {
    if (id && id !== 'new' && subscriptionReady) {
      const foundSchedule = Schedules.findOne({_id: id});
      if (foundSchedule) {
        console.log('Found schedule:', foundSchedule);
        setSchedule(foundSchedule);
        setIsEditing(false); // Start in view mode for existing
      } else {
        console.warn('Schedule not found with id:', id);
      }
    } else if (id === 'new') {
      setIsEditing(true); // Start in edit mode for new
      
      // Note: Unlike procedures which auto-populate the patient,
      // schedules don't auto-populate the actor field.
      // The test will set the actor manually.
    }
  }, [id, subscriptionReady]);

  // Form field handlers
  const handleFieldChange = (field, value) => {
    setSchedule(prev => {
      const updated = {...prev};
      set(updated, field, value);
      return updated;
    });
  };

  const handleSave = () => {
    setLoading(true);
    setError(null);

    try {
      if (id) {
        // Update existing schedule
        Meteor.call('updateSchedule', id, schedule, (error, result) => {
          setLoading(false);
          if (error) {
            console.error('Error updating schedule:', error);
            setError(error.message);
          } else {
            console.log('Schedule updated successfully');
            navigate('/schedules');
          }
        });
      } else {
        // Create new schedule
        console.log('Attempting to save schedule:', JSON.stringify(schedule, null, 2));
        
        // Store in window for test debugging
        window.lastScheduleSaveAttempt = {
          schedule: schedule,
          timestamp: new Date().toISOString()
        };
        
        Meteor.call('createSchedule', schedule, (error, result) => {
          setLoading(false);
          
          // Store result for debugging
          window.lastScheduleSaveResult = {
            error: error,
            result: result,
            timestamp: new Date().toISOString()
          };
          
          if (error) {
            console.error('Error creating schedule:', error);
            console.error('Error details:', error.details);
            console.error('Error reason:', error.reason);
            setError(error.message || error.reason || 'Unknown error');
          } else {
            console.log('Schedule created successfully:', result);
            navigate('/schedules');
          }
        });
      }
    } catch (error) {
      setLoading(false);
      setError(error.message);
      console.error('Error saving schedule:', error);
    }
  };

  const handleDelete = () => {
    if (id && window.confirm('Are you sure you want to delete this schedule?')) {
      setLoading(true);
      Meteor.call('removeSchedule', id, (error, result) => {
        setLoading(false);
        if (error) {
          console.error('Error deleting schedule:', error);
          setError(error.message);
        } else {
          console.log('Schedule deleted successfully');
          navigate('/schedules');
        }
      });
    }
  };

  return (
    <Container id="scheduleDetailPage" maxWidth="md" style={{ paddingTop: '20px', paddingBottom: '80px' }}>
      <Card>
        <CardHeader 
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h5">
                {id ? 'Edit Schedule' : 'New Schedule'}
              </Typography>
              <Box>
                <Tooltip title="System ID">
                  <Chip
                    icon={<QrCodeIcon />}
                    label={id || 'New'}
                    size="small"
                    variant="outlined"
                  />
                </Tooltip>
              </Box>
            </Box>
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" style={{ marginBottom: '20px' }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    id="activeCheckbox"
                    checked={get(schedule, 'active', true)}
                    onChange={(e) => handleFieldChange('active', e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="identifierInput"
                label="Identifier"
                fullWidth
                value={get(schedule, 'identifier[0].value', '')}
                onChange={(e) => handleFieldChange('identifier[0].value', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="identifierSystem"
                label="Identifier System"
                fullWidth
                value={get(schedule, 'identifier[0].system', '')}
                onChange={(e) => handleFieldChange('identifier[0].system', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="serviceCategoryInput"
                label="Service Category Code"
                fullWidth
                value={get(schedule, 'serviceCategory[0].coding[0].code', '')}
                onChange={(e) => handleFieldChange('serviceCategory[0].coding[0].code', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="serviceCategoryDisplayInput"
                label="Service Category Display"
                fullWidth
                value={get(schedule, 'serviceCategory[0].coding[0].display', '')}
                onChange={(e) => handleFieldChange('serviceCategory[0].coding[0].display', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="serviceTypeInput"
                label="Service Type Code"
                fullWidth
                value={get(schedule, 'serviceType[0].coding[0].code', '')}
                onChange={(e) => handleFieldChange('serviceType[0].coding[0].code', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="serviceTypeDisplayInput"
                label="Service Type Display"
                fullWidth
                value={get(schedule, 'serviceType[0].coding[0].display', '')}
                onChange={(e) => handleFieldChange('serviceType[0].coding[0].display', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="specialtyInput"
                label="Specialty Code"
                fullWidth
                value={get(schedule, 'specialty[0].coding[0].code', '')}
                onChange={(e) => handleFieldChange('specialty[0].coding[0].code', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="specialtyDisplayInput"
                label="Specialty Display"
                fullWidth
                value={get(schedule, 'specialty[0].coding[0].display', '')}
                onChange={(e) => handleFieldChange('specialty[0].coding[0].display', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="actorInput"
                label="Actor"
                fullWidth
                value={get(schedule, 'actor[0].display', '')}
                onChange={(e) => handleFieldChange('actor[0].display', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="actorReferenceInput"
                label="Actor Reference"
                fullWidth
                value={get(schedule, 'actor[0].reference', '')}
                onChange={(e) => handleFieldChange('actor[0].reference', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="actorDisplayInput"
                label="Actor Display"
                fullWidth
                value={get(schedule, 'actor[0].display', '')}
                onChange={(e) => handleFieldChange('actor[0].display', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="planningHorizonStartInput"
                label="Planning Horizon Start"
                type="date"
                fullWidth
                value={get(schedule, 'planningHorizon.start', '')}
                onChange={(e) => handleFieldChange('planningHorizon.start', e.target.value)}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="planningHorizonEndInput"
                label="Planning Horizon End"
                type="date"
                fullWidth
                value={get(schedule, 'planningHorizon.end', '')}
                onChange={(e) => handleFieldChange('planningHorizon.end', e.target.value)}
                variant="outlined"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="commentTextarea"
                label="Comment"
                fullWidth
                multiline
                rows={2}
                value={get(schedule, 'comment', '')}
                onChange={(e) => handleFieldChange('comment', e.target.value)}
                variant="outlined"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="notesTextarea"
                label="Notes (Custom Field)"
                fullWidth
                multiline
                rows={3}
                value={get(schedule, 'notes', '')}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions>
          <Button 
            onClick={() => navigate('/schedules')}
            disabled={loading}
          >
            Cancel
          </Button>
          {id && (
            <Button 
              onClick={handleDelete}
              color="error"
              disabled={loading}
            >
              Delete
            </Button>
          )}
          <Button 
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
}

export default ScheduleDetail;