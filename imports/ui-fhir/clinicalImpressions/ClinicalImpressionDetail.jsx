// imports/ui-fhir/clinicalImpressions/ClinicalImpressionDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  TextField,
  Button,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set } from 'lodash';

import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';

export function ClinicalImpressionDetail(props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [clinicalImpression, setClinicalImpression] = useState({
    resourceType: 'ClinicalImpression',
    status: 'in-progress',
    description: '',
    summary: '',
    subject: {},
    assessor: {},
    date: new Date().toISOString().split('T')[0],
    effectiveDateTime: ''
  });
  const [isEditing, setIsEditing] = useState(id === 'new' || !id);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if (autoSubscribeEnabled) {
      handle = Meteor.subscribe('selectedPatient.ClinicalImpressions', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('clinicalimpressions.all');
    }
    return handle.ready();
  }, []);

  // Load clinical impression data
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load from collection first
      const existingClinicalImpression = ClinicalImpressions.findOne({_id: id});

      if (existingClinicalImpression) {
        setClinicalImpression(existingClinicalImpression);
        setIsEditing(false);
      } else {
        // Fallback: try by id field
        const byId = ClinicalImpressions.findOne({id: id});
        if (byId) {
          setClinicalImpression(byId);
          setIsEditing(false);
        }
      }
    } else {
      // New clinical impression - set patient from Session
      const selectedPatient = Session.get('selectedPatient');
      if (selectedPatient) {
        setClinicalImpression(prev => ({
          ...prev,
          subject: {
            reference: 'Patient/' + get(selectedPatient, 'id', selectedPatient._id),
            display: get(selectedPatient, 'name.0.text',
              get(selectedPatient, 'name.0.given.0', '') + ' ' + get(selectedPatient, 'name.0.family', ''))
          }
        }));
      }
      setIsEditing(true);
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    setClinicalImpression(prev => {
      const updated = { ...prev };
      set(updated, path, value);
      return updated;
    });
  }

  function handleSearchPatient() {
    console.log('Patient search clicked');
    // Could open a patient search dialog here
  }

  async function handleSave() {
    setIsLoading(true);

    try {
      const dataToSave = {
        status: get(clinicalImpression, 'status', 'in-progress'),
        description: get(clinicalImpression, 'description', ''),
        summary: get(clinicalImpression, 'summary', ''),
        subject: get(clinicalImpression, 'subject', {}),
        subjectDisplay: get(clinicalImpression, 'subject.display', ''),
        assessor: get(clinicalImpression, 'assessor', {}),
        assessorDisplay: get(clinicalImpression, 'assessor.display', ''),
        date: get(clinicalImpression, 'date', ''),
        effectiveDateTime: get(clinicalImpression, 'effectiveDateTime', '')
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('clinicalImpressions.update', id, dataToSave);
        console.log('Clinical impression updated:', id);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('clinicalImpressions.insert', dataToSave);
        console.log('Clinical impression created:', newId);
        navigate('/clinical-impressions');
      }
    } catch (error) {
      console.error('Error saving clinical impression:', error);
      alert('Error saving clinical impression: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this clinical impression?')) {
      Meteor.call('clinicalImpressions.remove', id, function(error) {
        if (error) {
          console.error('Error deleting clinical impression:', error);
          alert('Error deleting clinical impression: ' + error.message);
        } else {
          console.log('Clinical impression deleted:', id);
          navigate('/clinical-impressions');
        }
      });
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      // Reload from collection
      const existingClinicalImpression = ClinicalImpressions.findOne({_id: id});
      if (existingClinicalImpression) {
        setClinicalImpression(existingClinicalImpression);
      }
      setIsEditing(false);
    } else {
      navigate('/clinical-impressions');
    }
  }

  function handleBack() {
    navigate('/clinical-impressions');
  }

  return (
    <Container id="clinicalImpressionDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Clinical Impression' : 'New Clinical Impression'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {/* Barcode display for existing records */}
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Status */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="statusSelect"
                  value={get(clinicalImpression, 'status', 'in-progress')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="dateInput"
                fullWidth
                label="Date"
                type="date"
                value={get(clinicalImpression, 'date', '').split('T')[0]}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                id="descriptionInput"
                fullWidth
                label="Description"
                value={get(clinicalImpression, 'description', '')}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={2}
                helperText="A summary of the context and/or cause of the assessment"
              />
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <TextField
                id="summaryInput"
                fullWidth
                label="Summary"
                value={get(clinicalImpression, 'summary', '')}
                onChange={(e) => handleChange('summary', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={3}
                helperText="Summary of the assessment"
              />
            </Grid>

            {/* Effective DateTime */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="effectiveDateTimeInput"
                fullWidth
                label="Effective Date/Time"
                type="datetime-local"
                value={get(clinicalImpression, 'effectiveDateTime', '').substring(0, 16)}
                onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
                helperText="When the assessment was made"
              />
            </Grid>

            {/* Assessor Display */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="assessorDisplay"
                fullWidth
                label="Assessor"
                value={get(clinicalImpression, 'assessor.display', '')}
                onChange={(e) => handleChange('assessor.display', e.target.value)}
                disabled={!isEditing}
                helperText="The clinician performing the assessment"
              />
            </Grid>

            {/* Patient / Subject */}
            <Grid item xs={12}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(clinicalImpression, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                disabled={!isEditing}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Search for patient">
                        <IconButton
                          onClick={handleSearchPatient}
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

            {/* Patient Reference (hidden but set) */}
            <Grid item xs={12}>
              <TextField
                id="subjectReference"
                fullWidth
                label="Patient Reference"
                value={get(clinicalImpression, 'subject.reference', '')}
                disabled
                size="small"
                sx={{ display: 'none' }}
              />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button color="error" onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="contained" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                id="saveClinicalImpressionButton"
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (id && id !== 'new' ? 'Update' : 'Save')}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default ClinicalImpressionDetail;
