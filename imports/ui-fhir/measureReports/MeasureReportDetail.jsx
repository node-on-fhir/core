// /imports/ui-fhir/measureReports/MeasureReportDetail.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
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
  InputAdornment,
  IconButton,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Divider
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';

// Direct import to avoid Meteor.startup timing issues
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

function MeasureReportDetail(props) {
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;

  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;
  const location = useLocation();
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;

  const [measureReport, setMeasureReport] = useState({
    resourceType: 'MeasureReport',
    identifier: [{
      value: ''
    }],
    status: 'complete',
    type: 'individual',
    subject: {
      reference: '',
      display: ''
    },
    date: new Date(),
    reporter: {
      reference: '',
      display: ''
    },
    period: {
      start: '',
      end: ''
    },
    measure: '',
    improvementNotation: {
      text: ''
    },
    group: [{
      id: '',
      code: {
        text: ''
      },
      population: [{
        id: '',
        code: {
          text: ''
        },
        count: 0
      }],
      measureScore: {
        value: 0
      },
      stratifier: [{
        id: '',
        code: [{
          text: ''
        }],
        stratum: [{
          id: '',
          value: {
            text: ''
          }
        }]
      }]
    }]
  });

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setMeasureReport(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);


  const [isEditing, setIsEditing] = useState(true);
  const [measureReportId, setMeasureReportId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedPatient = Session.get('selectedPatient');
  const patientName = get(selectedPatient, 'name[0].text', '');
  const patientId = get(selectedPatient, 'id');

  // Subscribe to measure reports
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.MeasureReports', Session.get('selectedPatientId'), {});
    } else {
      handle = Meteor.subscribe('measurereports.all');
    }
    return handle.ready();
  }, []);

  // Load existing measure report
  useEffect(() => {
    if (id && id !== 'new') {
      const existingReport = MeasureReports.findOne({_id: id}) || MeasureReports.findOne({id: id});
      if (existingReport) {
        setMeasureReport(existingReport);
        setMeasureReportId(id);
        setIsEditing(false);
      }
    } else if (id === 'new') {
      setIsEditing(true);
      setMeasureReportId('new');

      // Pre-populate patient if one is selected
      if (selectedPatient) {
        handleChange('subject.display', patientName);
        handleChange('subject.reference', `Patient/${patientId}`);
      }
    }
  }, [id]);

  function handleChange(path, value) {
    const updatedReport = cloneDeep(measureReport);
    set(updatedReport, path, value);
    setMeasureReport(updatedReport);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(updatedReport);
    }
  }

  function handleSearchUser() {
    if (!isEditing) return;
    navigate('/patients?sidebarAction=selectPatient');
  }

  async function handleSaveButton() {
    setIsLoading(true);
    try {
      let measureReportData = {
        resourceType: get(measureReport, 'resourceType', 'MeasureReport'),
        identifier: get(measureReport, 'identifier[0].value', ''),
        status: get(measureReport, 'status', 'complete'),
        type: get(measureReport, 'type', 'individual'),
        measure: get(measureReport, 'measure', ''),
        subjectDisplay: get(measureReport, 'subject.display', ''),
        subjectReference: get(measureReport, 'subject.reference', ''),
        date: get(measureReport, 'date', new Date()),
        reporterDisplay: get(measureReport, 'reporter.display', ''),
        reporterReference: get(measureReport, 'reporter.reference', ''),
        periodStart: get(measureReport, 'period.start', ''),
        periodEnd: get(measureReport, 'period.end', ''),
        improvementNotation: get(measureReport, 'improvementNotation.text', ''),
        groupCode: get(measureReport, 'group[0].code.text', ''),
        groupDescription: get(measureReport, 'group[0].code.text', ''),
        populationCode: get(measureReport, 'group[0].population[0].code.text', ''),
        populationCount: get(measureReport, 'group[0].population[0].count', 0),
        measureScoreValue: get(measureReport, 'group[0].measureScore.value', 0),
        stratifierCode: get(measureReport, 'group[0].stratifier[0].code[0].text', ''),
        stratifierValue: get(measureReport, 'group[0].stratifier[0].stratum[0].value.text', '')
      };

      if(measureReportId && measureReportId !== 'new'){
        await Meteor.callAsync('updateMeasureReport', measureReportId, measureReportData);
        setIsEditing(false);
      } else {
        const newId = await Meteor.callAsync('createMeasureReport', measureReportData);
        navigate('/measure-reports');
      }
    } catch(error) {
      console.error('Error saving measure report:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDeleteButton() {
    if (window.confirm('Are you sure you want to delete this measure report?')) {
      Meteor.call('removeMeasureReport', measureReportId, function(error) {
        if (error) {
          console.error('Error deleting measure report:', error);
        } else {
          navigate('/measure-reports');
        }
      });
    }
  }

  function handleCancelButton() {
    if (measureReportId && measureReportId !== 'new') {
      setIsEditing(false);
      // Reload original data
      const existingReport = MeasureReports.findOne({_id: measureReportId});
      if (existingReport) {
        setMeasureReport(existingReport);
      }
    } else {
      navigate('/measure-reports');
    }
  }

  function handleEditButton() {
    setIsEditing(true);
  }

  function handleBackButton() {
    navigate('/measure-reports');
  }

  if (isEmbedded) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            id="identifierInput"
            fullWidth
            label="Identifier"
            value={get(measureReport, 'identifier[0].value', '')}
            onChange={(e) => handleChange('identifier[0].value', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-label">Status</InputLabel>
            <Select
              labelId="status-label"
              id="statusSelect"
              value={get(measureReport, 'status', 'complete')}
              label="Status"
              onChange={(e) => handleChange('status', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="complete">Complete</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="error">Error</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              labelId="type-label"
              id="typeSelect"
              value={get(measureReport, 'type', 'individual')}
              label="Type"
              onChange={(e) => handleChange('type', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="individual">Individual</MenuItem>
              <MenuItem value="subject-list">Subject List</MenuItem>
              <MenuItem value="summary">Summary</MenuItem>
              <MenuItem value="data-exchange">Data Exchange</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="subjectInput"
            fullWidth
            label="Subject"
            value={get(measureReport, 'subject.display', '')}
            onChange={(e) => handleChange('subject.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="measureReferenceInput"
            fullWidth
            label="Measure Reference"
            value={get(measureReport, 'measure', '')}
            onChange={(e) => handleChange('measure', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="dateInput"
            fullWidth
            label="Date"
            type="date"
            value={get(measureReport, 'date') && moment(get(measureReport, 'date')).isValid() ? moment(get(measureReport, 'date')).format('YYYY-MM-DD') : ''}
            onChange={(e) => handleChange('date', new Date(e.target.value))}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="periodStartInput"
            fullWidth
            label="Period Start"
            type="date"
            value={get(measureReport, 'period.start') && moment(get(measureReport, 'period.start')).isValid() ? moment(get(measureReport, 'period.start')).format('YYYY-MM-DD') : ''}
            onChange={(e) => handleChange('period.start', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="periodEndInput"
            fullWidth
            label="Period End"
            type="date"
            value={get(measureReport, 'period.end') && moment(get(measureReport, 'period.end')).isValid() ? moment(get(measureReport, 'period.end')).format('YYYY-MM-DD') : ''}
            onChange={(e) => handleChange('period.end', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="reporterInput"
            fullWidth
            label="Reporter"
            value={get(measureReport, 'reporter.display', '')}
            onChange={(e) => handleChange('reporter.display', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="improvement-notation-label">Improvement Notation</InputLabel>
            <Select
              labelId="improvement-notation-label"
              id="improvementNotationSelect"
              value={get(measureReport, 'improvementNotation.text', '')}
              label="Improvement Notation"
              onChange={(e) => handleChange('improvementNotation.text', e.target.value)}
              disabled={!isEditing}
            >
              <MenuItem value="">None</MenuItem>
              <MenuItem value="increase">Increase</MenuItem>
              <MenuItem value="decrease">Decrease</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Group Information</Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="groupCodeInput"
            fullWidth
            label="Group Code"
            value={get(measureReport, 'group[0].code.text', '')}
            onChange={(e) => handleChange('group[0].code.text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="groupDescriptionTextarea"
            fullWidth
            label="Group Description"
            value={get(measureReport, 'group[0].code.text', '')}
            onChange={(e) => handleChange('group[0].code.text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
            multiline
            rows={2}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="populationCodeInput"
            fullWidth
            label="Population Code"
            value={get(measureReport, 'group[0].population[0].code.text', '')}
            onChange={(e) => handleChange('group[0].population[0].code.text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="populationCountInput"
            fullWidth
            label="Population Count"
            type="number"
            value={get(measureReport, 'group[0].population[0].count', 0)}
            onChange={(e) => handleChange('group[0].population[0].count', parseInt(e.target.value))}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            id="measureScoreValueInput"
            fullWidth
            label="Measure Score"
            type="number"
            inputProps={{ step: 0.01 }}
            value={get(measureReport, 'group[0].measureScore.value', 0)}
            onChange={(e) => handleChange('group[0].measureScore.value', parseFloat(e.target.value))}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="stratifierCodeInput"
            fullWidth
            label="Stratifier Code"
            value={get(measureReport, 'group[0].stratifier[0].code[0].text', '')}
            onChange={(e) => handleChange('group[0].stratifier[0].code[0].text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            id="stratifierValueInput"
            fullWidth
            label="Stratifier Value"
            value={get(measureReport, 'group[0].stratifier[0].stratum[0].value.text', '')}
            onChange={(e) => handleChange('group[0].stratifier[0].stratum[0].value.text', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            id="measureUrlInput"
            fullWidth
            label="Measure URL"
            value={get(measureReport, 'measure', '')}
            onChange={(e) => handleChange('measure', e.target.value)}
            disabled={!isEditing}
            margin="normal"
          />
        </Grid>
      </Grid>
    );
  }

  return (
    <Container id='measureReportDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={id && id !== 'new' ? 'Edit Measure Report' : 'New Measure Report'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                id="identifierInput"
                fullWidth
                label="Identifier"
                value={get(measureReport, 'identifier[0].value', '')}
                onChange={(e) => handleChange('identifier[0].value', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="statusSelect"
                  value={get(measureReport, 'status', 'complete')}
                  label="Status"
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="complete">Complete</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="type-label">Type</InputLabel>
                <Select
                  labelId="type-label"
                  id="typeSelect"
                  value={get(measureReport, 'type', 'individual')}
                  label="Type"
                  onChange={(e) => handleChange('type', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="individual">Individual</MenuItem>
                  <MenuItem value="subject-list">Subject List</MenuItem>
                  <MenuItem value="summary">Summary</MenuItem>
                  <MenuItem value="data-exchange">Data Exchange</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="subjectInput"
                fullWidth
                label="Subject"
                value={get(measureReport, 'subject.display', '')}
                onChange={(e) => handleChange('subject.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
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

            <Grid item xs={12} md={6}>
              <TextField
                id="measureReferenceInput"
                fullWidth
                label="Measure Reference"
                value={get(measureReport, 'measure', '')}
                onChange={(e) => handleChange('measure', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="dateInput"
                fullWidth
                label="Date"
                type="date"
                value={get(measureReport, 'date') && moment(get(measureReport, 'date')).isValid() ? moment(get(measureReport, 'date')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('date', new Date(e.target.value))}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="periodStartInput"
                fullWidth
                label="Period Start"
                type="date"
                value={get(measureReport, 'period.start') && moment(get(measureReport, 'period.start')).isValid() ? moment(get(measureReport, 'period.start')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('period.start', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="periodEndInput"
                fullWidth
                label="Period End"
                type="date"
                value={get(measureReport, 'period.end') && moment(get(measureReport, 'period.end')).isValid() ? moment(get(measureReport, 'period.end')).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleChange('period.end', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="reporterInput"
                fullWidth
                label="Reporter"
                value={get(measureReport, 'reporter.display', '')}
                onChange={(e) => handleChange('reporter.display', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="improvement-notation-label">Improvement Notation</InputLabel>
                <Select
                  labelId="improvement-notation-label"
                  id="improvementNotationSelect"
                  value={get(measureReport, 'improvementNotation.text', '')}
                  label="Improvement Notation"
                  onChange={(e) => handleChange('improvementNotation.text', e.target.value)}
                  disabled={!isEditing}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="increase">Increase</MenuItem>
                  <MenuItem value="decrease">Decrease</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Group Information</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="groupCodeInput"
                fullWidth
                label="Group Code"
                value={get(measureReport, 'group[0].code.text', '')}
                onChange={(e) => handleChange('group[0].code.text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="groupDescriptionTextarea"
                fullWidth
                label="Group Description"
                value={get(measureReport, 'group[0].code.text', '')}
                onChange={(e) => handleChange('group[0].code.text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="populationCodeInput"
                fullWidth
                label="Population Code"
                value={get(measureReport, 'group[0].population[0].code.text', '')}
                onChange={(e) => handleChange('group[0].population[0].code.text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="populationCountInput"
                fullWidth
                label="Population Count"
                type="number"
                value={get(measureReport, 'group[0].population[0].count', 0)}
                onChange={(e) => handleChange('group[0].population[0].count', parseInt(e.target.value))}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                id="measureScoreValueInput"
                fullWidth
                label="Measure Score"
                type="number"
                inputProps={{ step: 0.01 }}
                value={get(measureReport, 'group[0].measureScore.value', 0)}
                onChange={(e) => handleChange('group[0].measureScore.value', parseFloat(e.target.value))}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="stratifierCodeInput"
                fullWidth
                label="Stratifier Code"
                value={get(measureReport, 'group[0].stratifier[0].code[0].text', '')}
                onChange={(e) => handleChange('group[0].stratifier[0].code[0].text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                id="stratifierValueInput"
                fullWidth
                label="Stratifier Value"
                value={get(measureReport, 'group[0].stratifier[0].stratum[0].value.text', '')}
                onChange={(e) => handleChange('group[0].stratifier[0].stratum[0].value.text', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                id="measureUrlInput"
                fullWidth
                label="Measure URL"
                value={get(measureReport, 'measure', '')}
                onChange={(e) => handleChange('measure', e.target.value)}
                disabled={!isEditing}
                margin="normal"
              />
            </Grid>
          </Grid>
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && id && id !== 'new' ? (
            <>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBackButton}
              >
                Back
              </Button>
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteButton}
              >
                Delete
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditButton}
              >
                Edit
              </Button>
            </>
          ) : (
            <>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelButton}
              >
                Cancel
              </Button>
              <Button
                id="saveMeasureReportButton"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveButton}
                disabled={isLoading}
              >
                {id && id !== 'new' ? 'Update' : 'Save'} Measure Report
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default MeasureReportDetail;