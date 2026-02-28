// /imports/ui-fhir/measureReports/MeasureReportDetail.jsx

import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import moment from 'moment';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, set, cloneDeep } from 'lodash';
import { Random } from 'meteor/random';

// Direct import to avoid Meteor.startup timing issues
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';

import MeasureReportFormView from './MeasureReportFormView';
import MeasureReportPreview from './MeasureReportPreview';

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


  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [measureReportId, setMeasureReportId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';

  const selectedPatient = Session.get('selectedPatient');
  const patientName = get(selectedPatient, 'name[0].text', '');
  const patientId = get(selectedPatient, 'id');

  const isNewReport = !id || id === 'new';
  const isExistingReport = measureReportId && measureReportId !== 'new';

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

  // Build the header title
  let headerTitle = 'New Measure Report';
  if (isExistingReport) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{measureReportId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions() {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle -- hidden for new reports */}
        {!isNewReport && (
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

        {/* Form toggle -- hidden for new reports (always form) */}
        {!isNewReport && (
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

        {/* Lock / Unlock toggle -- only for existing reports */}
        {!isNewReport && (
          <Button
              id="editButton"
              onClick={function() { setIsEditing(!isEditing); }}
              variant="outlined"
              size="small"
              startIcon={isEditing ? <LockOpenIcon /> : <LockIcon />}
            >
              {isEditing ? 'Editing' : 'Edit'}
            </Button>
        )}

        {/* Delete -- only for existing reports, gated on edit mode */}
        {!isNewReport && (
          <Button
              id="deleteButton"
              onClick={handleDeleteButton}
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
            >
              Delete
            </Button>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView() {
    return (
      <>
        <MeasureReportFormView
          resource={measureReport}
          isEditing={isEditing}
          onChange={handleChange}
          isEmbedded={isEmbedded}
        />

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && !isEmbedded && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button id="cancelButton" onClick={handleCancelButton}>
              Cancel
            </Button>
            <Button
              id="saveMeasureReportButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView() {
    return (
      <MeasureReportPreview
        resource={measureReport}
        resourceId={measureReportId}
      />
    );
  }

  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='measureReportDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={headerTitle}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          action={renderHeaderActions()}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}

          {viewMode === 'form' && renderFormView()}
          {viewMode === 'page' && renderPreviewView()}
        </CardContent>
      </Card>
    </Container>
  );
}

export default MeasureReportDetail;
