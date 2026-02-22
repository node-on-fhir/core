// /imports/ui-fhir/diagnosticReports/DiagnosticReportDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  IconButton,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Typography,
  Box,
  Stack
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import EditNoteIcon from '@mui/icons-material/EditNote';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import DeleteIcon from '@mui/icons-material/Delete';

import { get, has, set } from 'lodash';
import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { FhirUtilities } from '/imports/lib/FhirUtilities';
import { lookupReferenceName } from '/imports/lib/FhirDehydrator';

const statusOptions = [
  { value: 'registered', label: 'Registered' },
  { value: 'partial', label: 'Partial' },
  { value: 'preliminary', label: 'Preliminary' },
  { value: 'final', label: 'Final' },
  { value: 'amended', label: 'Amended' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'appended', label: 'Appended' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'entered-in-error', label: 'Entered in Error' },
  { value: 'unknown', label: 'Unknown' }
];

const statusColorMap = {
  'registered': 'default',
  'partial': 'warning',
  'preliminary': 'warning',
  'final': 'success',
  'amended': 'info',
  'corrected': 'info',
  'appended': 'info',
  'cancelled': 'error',
  'entered-in-error': 'error',
  'unknown': 'default'
};

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
  const { id } = useParams();
  const navigate = useNavigate();

  const [diagnosticReportId, setDiagnosticReportId] = useState(false);
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
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const viewMode = searchParams.get('view') || 'form';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isNewReport = !id || id === 'new';
  const isExistingReport = diagnosticReportId && diagnosticReportId !== 'new';

  // Subscribe to diagnostic reports
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribeEnabled){
      handle = Meteor.subscribe('selectedPatient.DiagnosticReports', Session.get('selectedPatientId'), { limit: 1000 });
    } else {
      handle = Meteor.subscribe('diagnosticreports.all');
    }
    return handle.ready();
  }, []);

  useEffect(() => {
    if(id && id !== 'new' && isSubscriptionReady){
      setDiagnosticReportId(id);
      setIsEditing(false); // Start in read mode for existing reports

      let selectedDiagnosticReport = DiagnosticReports.findOne({_id: id});
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
  }, [id, isSubscriptionReady]);

  function handleChange(name, value){
    const newForm = Object.assign({}, form);
    newForm[name] = value;
    setForm(newForm);
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
        <Stack spacing={3}>
          <TextField
            id='subjectInput'
            fullWidth
            label='Patient'
            value={form.subject}
            disabled
            helperText={get(diagnosticReport, 'subject.reference', '') || 'Patient reference will be assigned'}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              id='codeInput'
              fullWidth
              label='LOINC Code'
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              helperText="Enter LOINC code (e.g., 24323-8)"
              disabled={!isEditing}
            />

            <TextField
              id='categoryInput'
              fullWidth
              label='Category'
              value={form.category}
              onChange={(e) => handleChange('category', e.target.value)}
              helperText="e.g., LAB, RAD, SP, CP"
              disabled={!isEditing}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <FormControl fullWidth disabled={!isEditing}>
              <InputLabel>Status</InputLabel>
              <Select
                id='statusSelect'
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              id='effectiveDateTimeInput'
              fullWidth
              type='date'
              label='Effective Date'
              value={form.effectiveDateTime}
              onChange={(e) => handleChange('effectiveDateTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              disabled={!isEditing}
            />
          </Stack>

          <TextField
            id='conclusionInput'
            fullWidth
            multiline
            rows={4}
            label='Conclusion'
            value={form.conclusion}
            onChange={(e) => handleChange('conclusion', e.target.value)}
            helperText="Summary and interpretation of the diagnostic report"
            disabled={!isEditing}
          />
        </Stack>

        {/* In-form Save/Cancel bar when editing */}
        {isEditing && (
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
    // Derive display values from current form state (live preview of edits)
    const statusLabel = get(statusOptions.find(function(opt){ return opt.value === form.status; }), 'label', form.status);
    const statusColor = get(statusColorMap, form.status, 'default');
    const formattedDate = form.effectiveDateTime ? moment(form.effectiveDateTime).format('MMMM D, YYYY') : '';
    const subjectReference = get(diagnosticReport, 'subject.reference', '');

    // Build subtitle from category and code
    let subtitleParts = [];
    if (form.category) {
      subtitleParts.push(form.category);
    }
    if (form.code) {
      subtitleParts.push('LOINC ' + form.code);
    }
    const subtitle = subtitleParts.join(' \u2014 ');

    return (
      <Box sx={{ maxWidth: '8.5in', mx: 'auto', py: 2 }}>
        {subtitle && (
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            {subtitle}
          </Typography>
        )}

        <Divider />

        {/* Two-column metadata */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 2.5 }}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Patient
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {form.subject || 'Unspecified'}
            </Typography>
            {subjectReference && (
              <Typography variant="caption" color="text.secondary">
                {subjectReference}
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="overline" color="text.secondary">
              Report Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {formattedDate || 'No date'}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Status */}
        <Box sx={{ py: 2 }}>
          <Chip label={statusLabel} color={statusColor} size="small" />
        </Box>

        <Divider />

        {/* Conclusion */}
        <Box sx={{ py: 3 }}>
          <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Conclusion
          </Typography>
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              minHeight: '200px'
            }}
          >
            {form.conclusion || 'No conclusion provided.'}
          </Typography>
        </Box>

        <Divider />

        {/* Footer with report ID */}
        {isExistingReport && (
          <Box sx={{ pt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Report ID: {diagnosticReportId}
            </Typography>
          </Box>
        )}
      </Box>
    );
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
