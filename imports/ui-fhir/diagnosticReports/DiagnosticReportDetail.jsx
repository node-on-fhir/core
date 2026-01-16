// /imports/ui-fhir/diagnosticReports/DiagnosticReportDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
  Stack
} from '@mui/material';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to diagnostic reports
  const isSubscriptionReady = useTracker(function(){
    let autoPublishEnabled = get(Meteor, 'settings.public.defaults.autopublish', false);
    let handle;
    if(autoPublishEnabled){
      handle = Meteor.subscribe('autopublish.DiagnosticReports', {}, { limit: 1000 });
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

  return (
    <Container id='diagnosticReportDetailPage' maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader 
          title={diagnosticReportId && diagnosticReportId !== 'new' ? 'Edit Diagnostic Report' : 'New Diagnostic Report'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
        />
        <CardContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              Error: {error}
            </Typography>
          )}
          
          {/* System ID Barcode */}
          {(diagnosticReportId && diagnosticReportId !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{diagnosticReportId}</span>
            </Box>
          )}
          
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
        </CardContent>
        
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing && diagnosticReportId && diagnosticReportId !== 'new' ? (
            // Read-only mode buttons
            <>
              <Button 
                onClick={() => navigate('/diagnostic-reports')}
              >
                Back
              </Button>
              <Button 
                color="error"
                onClick={handleDeleteButton}
              >
                Delete
              </Button>
              <Button 
                onClick={() => setIsEditing(true)}
                variant="contained"
                color="primary"
              >
                Edit
              </Button>
            </>
          ) : (
            // Edit mode buttons
            <>
              <Button 
                id='cancelButton'
                onClick={handleCancelButton}
              >
                Cancel
              </Button>
              <Button 
                id='saveDiagnosticReportButton'
                onClick={handleSaveButton}
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default DiagnosticReportDetail;