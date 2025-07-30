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
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { get, set, has, cloneDeep } from 'lodash';
import moment from 'moment';

import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

//===========================================================================
// COMPONENT

export function ProcedureDetail(props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();

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

  const handleSave = () => {
    const dataToSave = cloneDeep(procedure);
    
    // Ensure we have required fields
    if (!dataToSave.meta) {
      dataToSave.meta = {};
    }
    dataToSave.meta.lastUpdated = new Date();
    
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

      Meteor.call('createProcedure', dataToSave, (error, result) => {
        if (error) {
          console.error('Create error:', error);
        } else {
          console.log('Procedure created:', result);
          navigate('/procedures');
        }
      });
    } else {
      // Update existing procedure
      Meteor.call('updateProcedure', id, dataToSave, (error, result) => {
        if (error) {
          console.error('Update error:', error);
        } else {
          console.log('Procedure updated:', result);
          navigate('/procedures');
        }
      });
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this procedure?')) {
      Meteor.call('removeProcedure', id, (error, result) => {
        if (error) {
          console.error('Delete error:', error);
        } else {
          console.log('Procedure deleted');
          navigate('/procedures');
        }
      });
    }
  };

  const handleSearchUser = () => {
    console.log('Search user clicked');
    // TODO: Implement patient search dialog
  };

  const renderHeader = () => {
    let headerText = id === 'new' ? 'New Procedure' : 'Procedure Details';
    
    return (
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Typography variant="h4">
              {headerText}
            </Typography>
          </Grid>
          <Grid item>
            {!isEditing ? (
              <Button
                startIcon={<LockOpenIcon />}
                onClick={() => setIsEditing(true)}
                variant="outlined"
              >
                Edit
              </Button>
            ) : (
              <Button
                startIcon={<LockIcon />}
                onClick={() => setIsEditing(false)}
                variant="outlined"
              >
                Lock
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box id="procedureDetailPage">
        {renderHeader()}
        
        <Card>
          <CardContent>
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
                    <MenuItem value="not-done">Not Done</MenuItem>
                    <MenuItem value="on-hold">On Hold</MenuItem>
                    <MenuItem value="stopped">Stopped</MenuItem>
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
                  value={get(procedure, 'performedDateTime', '').substring(0, 16)}
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
                >
                  Save
                </Button>
              </>
            )}
            {!isEditing && id !== 'new' && (
              <Button
                onClick={handleDelete}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
            )}
          </CardActions>
        </Card>
      </Box>
    </Container>
  );
}

export default ProcedureDetail;