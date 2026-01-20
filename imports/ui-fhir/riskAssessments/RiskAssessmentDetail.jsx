// imports/ui-fhir/riskAssessments/RiskAssessmentDetail.jsx

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

import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';

export function RiskAssessmentDetail(props) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [riskAssessment, setRiskAssessment] = useState({
    resourceType: 'RiskAssessment',
    status: 'preliminary',
    subject: {},
    performer: {},
    date: new Date().toISOString().split('T')[0],
    occurrenceDateTime: '',
    code: {},
    method: {},
    prediction: [],
    mitigation: ''
  });
  const [isEditing, setIsEditing] = useState(id === 'new' || !id);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe and load data
  const isSubscriptionReady = useTracker(function() {
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if (autoPublishEnabled) {
      handle = Meteor.subscribe('autopublish.RiskAssessments', {}, {});
    } else {
      handle = Meteor.subscribe('riskassessments.all');
    }
    return handle.ready();
  }, []);

  // Load risk assessment data
  useEffect(() => {
    if (id && id !== 'new') {
      // Try to load from collection first
      const existingRiskAssessment = RiskAssessments.findOne({_id: id});

      if (existingRiskAssessment) {
        setRiskAssessment(existingRiskAssessment);
        setIsEditing(false);
      } else {
        // Fallback: try by id field
        const byId = RiskAssessments.findOne({id: id});
        if (byId) {
          setRiskAssessment(byId);
          setIsEditing(false);
        }
      }
    } else {
      // New risk assessment - set patient from Session
      const selectedPatient = Session.get('selectedPatient');
      if (selectedPatient) {
        setRiskAssessment(prev => ({
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
    setRiskAssessment(prev => {
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
        status: get(riskAssessment, 'status', 'preliminary'),
        subject: get(riskAssessment, 'subject', {}),
        subjectDisplay: get(riskAssessment, 'subject.display', ''),
        performer: get(riskAssessment, 'performer', {}),
        performerDisplay: get(riskAssessment, 'performer.display', ''),
        date: get(riskAssessment, 'date', ''),
        occurrenceDateTime: get(riskAssessment, 'occurrenceDateTime', ''),
        code: get(riskAssessment, 'code.text', ''),
        codeCode: get(riskAssessment, 'code.coding.0.code', ''),
        method: get(riskAssessment, 'method.text', ''),
        prediction: get(riskAssessment, 'prediction.0.outcome.text', ''),
        mitigation: get(riskAssessment, 'mitigation', '')
      };

      if (id && id !== 'new') {
        await Meteor.callAsync('riskAssessments.update', id, dataToSave);
        console.log('Risk assessment updated:', id);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('riskAssessments.insert', dataToSave);
        console.log('Risk assessment created:', newId);
        navigate('/risk-assessments');
      }
    } catch (error) {
      console.error('Error saving risk assessment:', error);
      alert('Error saving risk assessment: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this risk assessment?')) {
      Meteor.call('riskAssessments.remove', id, function(error) {
        if (error) {
          console.error('Error deleting risk assessment:', error);
          alert('Error deleting risk assessment: ' + error.message);
        } else {
          console.log('Risk assessment deleted:', id);
          navigate('/risk-assessments');
        }
      });
    }
  }

  function handleCancel() {
    if (id && id !== 'new') {
      // Reload from collection
      const existingRiskAssessment = RiskAssessments.findOne({_id: id});
      if (existingRiskAssessment) {
        setRiskAssessment(existingRiskAssessment);
      }
      setIsEditing(false);
    } else {
      navigate('/risk-assessments');
    }
  }

  function handleBack() {
    navigate('/risk-assessments');
  }

  return (
    <Container id="riskAssessmentDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Risk Assessment' : 'New Risk Assessment'}
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
                  value={get(riskAssessment, 'status', 'preliminary')}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                  label="Status"
                >
                  <MenuItem value="registered">Registered</MenuItem>
                  <MenuItem value="preliminary">Preliminary</MenuItem>
                  <MenuItem value="final">Final</MenuItem>
                  <MenuItem value="amended">Amended</MenuItem>
                  <MenuItem value="corrected">Corrected</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="entered-in-error">Entered in Error</MenuItem>
                  <MenuItem value="unknown">Unknown</MenuItem>
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
                value={get(riskAssessment, 'date', '').split('T')[0]}
                onChange={(e) => handleChange('date', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Code (Type of Assessment) */}
            <Grid item xs={12}>
              <TextField
                id="codeInput"
                fullWidth
                label="Assessment Type"
                value={get(riskAssessment, 'code.text', get(riskAssessment, 'code.coding.0.display', ''))}
                onChange={(e) => handleChange('code.text', e.target.value)}
                disabled={!isEditing}
                helperText="Type of risk assessment (e.g., Cardiovascular risk assessment)"
              />
            </Grid>

            {/* Method */}
            <Grid item xs={12}>
              <TextField
                id="methodInput"
                fullWidth
                label="Method"
                value={get(riskAssessment, 'method.text', get(riskAssessment, 'method.coding.0.display', ''))}
                onChange={(e) => handleChange('method.text', e.target.value)}
                disabled={!isEditing}
                helperText="Algorithm or methodology used (e.g., Framingham Risk Score)"
              />
            </Grid>

            {/* Prediction */}
            <Grid item xs={12}>
              <TextField
                id="predictionInput"
                fullWidth
                label="Prediction"
                value={get(riskAssessment, 'prediction.0.outcome.text', '')}
                onChange={(e) => handleChange('prediction.0.outcome.text', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={2}
                helperText="Predicted outcome of the assessment"
              />
            </Grid>

            {/* Mitigation */}
            <Grid item xs={12}>
              <TextField
                id="mitigationInput"
                fullWidth
                label="Mitigation"
                value={get(riskAssessment, 'mitigation', '')}
                onChange={(e) => handleChange('mitigation', e.target.value)}
                disabled={!isEditing}
                multiline
                rows={2}
                helperText="How to reduce the risk"
              />
            </Grid>

            {/* Occurrence DateTime */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="occurrenceDateTimeInput"
                fullWidth
                label="Occurrence Date/Time"
                type="datetime-local"
                value={get(riskAssessment, 'occurrenceDateTime', '').substring(0, 16)}
                onChange={(e) => handleChange('occurrenceDateTime', e.target.value)}
                disabled={!isEditing}
                InputLabelProps={{ shrink: true }}
                helperText="When the assessment was performed"
              />
            </Grid>

            {/* Performer Display */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="performerDisplay"
                fullWidth
                label="Performer"
                value={get(riskAssessment, 'performer.display', '')}
                onChange={(e) => handleChange('performer.display', e.target.value)}
                disabled={!isEditing}
                helperText="Who performed the assessment"
              />
            </Grid>

            {/* Patient / Subject */}
            <Grid item xs={12}>
              <TextField
                id="subjectDisplay"
                fullWidth
                label="Patient"
                value={get(riskAssessment, 'subject.display', '')}
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
                value={get(riskAssessment, 'subject.reference', '')}
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
                id="saveRiskAssessmentButton"
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

export default RiskAssessmentDetail;
