// /imports/ui-fhir/diagnosticReports/DiagnosticReportDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  IconButton,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';

import DiagnosticReportFormView from './DiagnosticReportFormView';
import DiagnosticReportPreview from './DiagnosticReportPreview';

Session.setDefault('diagnosticReportFormData', {
  resourceType: 'DiagnosticReport',
  status: 'final',
  code: {
    text: ''
  },
  subject: {
    reference: '',
    display: ''
  },
  effectiveDateTime: moment().format('YYYY-MM-DD'),
  conclusion: ''
});

function DiagnosticReportDetail(props){
  // Embedded mode support (for HoneycombFhirResource dispatcher)
  var isEmbedded = props.embedded || false;
  var _params = isEmbedded ? {} : useParams();
  var id = _params.id || null;
  var _rawNavigate = useNavigate();
  var navigate = isEmbedded ? function() {} : _rawNavigate;

  const [diagnosticReportId, setDiagnosticReportId] = useState(false);

  // Initialise from fhirResource prop when in embedded mode
  var hasReceivedProps = React.useRef(false);
  useEffect(function() {
    if (isEmbedded && props.fhirResource) {
      hasReceivedProps.current = true;
      setDiagnosticReportId(function(prev) {
        if (JSON.stringify(props.fhirResource) !== JSON.stringify(prev)) {
          return props.fhirResource;
        }
        return prev;
      });
    }
  }, [props.fhirResource]);

  const [diagnosticReport, setDiagnosticReport] = useState({
    resourceType: 'DiagnosticReport',
    status: 'final',
    code: {
      text: ''
    },
    subject: {
      reference: '',
      display: ''
    },
    effectiveDateTime: moment().format('YYYY-MM-DD'),
    conclusion: ''
  });
  const [form, setForm] = useState({
    code: '',
    status: 'final',
    effectiveDateTime: moment().format('YYYY-MM-DD'),
    subject: '',
    conclusion: '',
    category: ''
  });
  const [isEditing, setIsEditing] = useState(isEmbedded);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewReport = !id || id === 'new';
  const isExistingReport = diagnosticReportId && diagnosticReportId !== 'new';

  // Subscribe to diagnostic reports
  const isSubscriptionReady = useTracker(function(){
    if (isEmbedded) return true; // Skip subscription in embedded mode
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('autopublish.DiagnosticReports', {}, { limit: 1000 });
    } else {
      handle = Meteor.subscribe('autopublish.DiagnosticReports', {}, { limit: 1000 });
    }
    return handle.ready();
  }, []);

  useEffect(() => {
    if(id && id !== 'new'){
      setDiagnosticReportId(id);
      setIsEditing(false); // Start in read mode for existing reports

      let selectedDiagnosticReport = DiagnosticReports.findOne({_id: id}) || DiagnosticReports.findOne({id: id});
      if(selectedDiagnosticReport){
        setDiagnosticReport(selectedDiagnosticReport);

        // Get subject display - try multiple paths
        let subjectDisplay = '';
        if (get(selectedDiagnosticReport, 'subject.display')) {
          subjectDisplay = get(selectedDiagnosticReport, 'subject.display');
        } else if (get(selectedDiagnosticReport, 'patient.display')) {
          subjectDisplay = get(selectedDiagnosticReport, 'patient.display');
        } else if (get(selectedDiagnosticReport, 'subject.reference')) {
          // If no display, show the reference
          subjectDisplay = get(selectedDiagnosticReport, 'subject.reference').replace('Patient/', 'Patient ');
        }

        // Extract LOINC code from CodeableConcept
        let codeValue = '';
        if (get(selectedDiagnosticReport, 'code.coding[0].code')) {
          codeValue = get(selectedDiagnosticReport, 'code.coding[0].code');
        } else if (get(selectedDiagnosticReport, 'code.text')) {
          codeValue = get(selectedDiagnosticReport, 'code.text');
        }

        setForm({
          code: codeValue,
          status: get(selectedDiagnosticReport, 'status', 'final'),
          effectiveDateTime: moment(get(selectedDiagnosticReport, 'effectiveDateTime')).format('YYYY-MM-DD'),
          subject: subjectDisplay,
          conclusion: get(selectedDiagnosticReport, 'conclusion', ''),
          category: get(selectedDiagnosticReport, 'category[0].text', '')
        });
      }
    } else if (!id || id === 'new') {
      // Creating new report
      setIsEditing(true); // Enable editing for new reports
      const selectedPatient = Session.get('selectedPatient');
      const selectedPatientId = Session.get('selectedPatientId');

      let patientReference = '';
      let patientDisplay = '';

      if (selectedPatient) {
        // Use the patient's FHIR id for the reference
        patientReference = 'Patient/' + get(selectedPatient, 'id', selectedPatientId);

        // Get display name
        if (get(selectedPatient, 'name[0].text')) {
          patientDisplay = get(selectedPatient, 'name[0].text');
        } else if (get(selectedPatient, 'name[0]')) {
          const given = get(selectedPatient, 'name[0].given', []).join(' ');
          const family = get(selectedPatient, 'name[0].family', '');
          patientDisplay = `${given} ${family}`.trim();
        }
      }

      let newReport = {
        resourceType: 'DiagnosticReport',
        status: 'final',
        code: {
          text: ''
        },
        subject: {
          reference: patientReference,
          display: patientDisplay
        },
        effectiveDateTime: moment().format('YYYY-MM-DD'),
        conclusion: ''
      };

      setDiagnosticReport(newReport);
      setForm({
        code: '',
        status: 'final',
        effectiveDateTime: moment().format('YYYY-MM-DD'),
        subject: patientDisplay,
        conclusion: '',
        category: ''
      });
    }
  }, [id]);

  function handleChange(name, value){
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);
  
    // Notify parent of changes in embedded mode
    if (props.onResourceChange) {
      props.onResourceChange(newForm);
    }
  }

  async function handleSaveButton(){
    setLoading(true);
    try {
      let dataToSave = {
        status: form.status,
        effectiveDateTime: moment(form.effectiveDateTime).toISOString(),
        code: form.code,
        conclusion: form.conclusion,
        category: form.category,
        subject: diagnosticReport.subject
      };

      console.log('Saving diagnostic report:', dataToSave);

      if(diagnosticReportId && diagnosticReportId !== 'new'){
        await Meteor.callAsync('updateDiagnosticReport', diagnosticReportId, dataToSave);
        console.log('DiagnosticReport updated successfully');
        setIsEditing(false);
      } else {
        const reportId = await Meteor.callAsync('createDiagnosticReport', dataToSave);
        console.log('DiagnosticReport created successfully:', reportId);
        navigate('/diagnostic-reports');
      }
    } catch(error) {
      console.error('Error saving diagnostic report:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCancelButton(){
    if (diagnosticReportId && diagnosticReportId !== 'new') {
      // Cancel editing and reload original data
      setIsEditing(false);
      setError(null);
      // Reload the report to discard changes
      const selectedDiagnosticReport = DiagnosticReports.findOne({_id: diagnosticReportId});
      if(selectedDiagnosticReport){
        // Re-extract the form data
        let subjectDisplay = get(selectedDiagnosticReport, 'subject.display', '');
        let codeValue = get(selectedDiagnosticReport, 'code.coding[0].code', '') ||
                        get(selectedDiagnosticReport, 'code.text', '');

        setForm({
          code: codeValue,
          status: get(selectedDiagnosticReport, 'status', 'final'),
          effectiveDateTime: moment(get(selectedDiagnosticReport, 'effectiveDateTime')).format('YYYY-MM-DD'),
          subject: subjectDisplay,
          conclusion: get(selectedDiagnosticReport, 'conclusion', ''),
          category: get(selectedDiagnosticReport, 'category[0].text', '')
        });
      }
    } else {
      navigate('/diagnostic-reports');
    }
  }

  async function handleDeleteButton(){
    if(!diagnosticReportId || diagnosticReportId === 'new') return;

    if (window.confirm('Are you sure you want to delete this diagnostic report?')) {
      setLoading(true);
      try {
        await Meteor.callAsync('removeDiagnosticReport', diagnosticReportId);
        console.log('DiagnosticReport deleted successfully');
        navigate('/diagnostic-reports');
      } catch(error) {
        console.error('Error deleting diagnostic report:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
  }

  // Build the header title
  let headerTitle = 'New Diagnostic Report';
  if (isExistingReport) {
    headerTitle = <span className="barcode helveticas" style={{ fontSize: '1.5rem' }}>{diagnosticReportId}</span>;
  }

  // Build the header action buttons
  function renderHeaderActions(){
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {/* Preview toggle — hidden for new reports */}
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

        {/* Form toggle — hidden for new reports (always form) */}
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

        {/* Lock / Unlock toggle — only for existing reports */}
        {!isNewReport && (
          <Tooltip title={isEditing ? 'Lock (read-only)' : 'Unlock (edit)'}>
            <IconButton
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <LockOpenIcon /> : <LockIcon />}
            </IconButton>
          </Tooltip>
        )}

        {/* Delete — only for existing reports, gated on edit mode */}
        {!isNewReport && (
          <Tooltip title="Delete">
            <IconButton
              onClick={handleDeleteButton}
              disabled={!isEditing}
              sx={{ color: isEditing ? 'error.main' : 'text.disabled' }}
            >
              <DeleteIcon />
              <Typography sx={{
                position: 'absolute',
                width: '1px',
                height: '1px',
                padding: 0,
                margin: '-1px',
                overflow: 'hidden',
                clip: 'rect(0, 0, 0, 0)',
                whiteSpace: 'nowrap',
                borderWidth: 0
              }}>Delete</Typography>
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }

  // Render the form view
  function renderFormView(){
    return (
      <>
        <DiagnosticReportFormView
          resource={diagnosticReport}
          form={form}
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
              id="saveDiagnosticReportButton"
              onClick={handleSaveButton}
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        )}
      </>
    );
  }

  // Render the preview view
  function renderPreviewView(){
    return (
      <DiagnosticReportPreview
        resource={diagnosticReport}
        form={form}
        resourceId={diagnosticReportId}
      />
    );
  }

  
  // In embedded mode, render form content without Container/Card wrapper
  if (isEmbedded) {
    return renderFormView();
  }

  return (
    <Container id='diagnosticReportDetailPage' maxWidth="md" sx={{ py: 4 }}>
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

export default DiagnosticReportDetail;
