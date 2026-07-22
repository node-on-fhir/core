// packages/request-for-corrections/client/pages/NewCorrectionRequestPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Use Meteor.useNavigate pattern per project requirements
let useNavigate;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
});

// Use Meteor.useTheme for dark mode support
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

import {
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  Alert,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  InputLabel,
  FormControlLabel,
  Checkbox,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';

import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  AttachFile as AttachFileIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Preview as PreviewIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';

import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('NewCorrectionRequestPage') : console);

export default function NewCorrectionRequestPage() {
  const navigate = useNavigate();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const paperBgColor = isDark ? '#2a2a2a' : '#f5f5f5';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const selectedPatientId = Session.get('selectedPatientId');
  
  // Route logging
  useEffect(() => {
    console.group('[NewCorrectionRequestPage] Route Initialization');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', Meteor.userId());
    log.debug('Selected Patient ID:', { selectedPatientId });
    log.phi('Selected Patient:', Session.get('selectedPatient'), { action: 'read' });
    console.log('Settings:', Meteor.settings);
    console.groupEnd();
    
    return () => {
      console.log('[NewCorrectionRequestPage] Component unmounting at:', new Date().toISOString());
    };
  }, []);
  
  // Form state
  const [requestType, setRequestType] = useState('correction');
  const [issueDescription, setIssueDescription] = useState('');
  const [correctionDetails, setCorrectionDetails] = useState('');
  const [contactPreference, setContactPreference] = useState('secure-message');
  const [urgency, setUrgency] = useState('routine');
  const [acknowledgment, setAcknowledgment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [endpointUrl, setEndpointUrl] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({});
  
  // Initialize endpoint URL from settings
  useEffect(() => {
    // Check for FHIR endpoint in settings
    const fhirBase = get(Meteor, 'settings.public.interfaces.fhir.endpoint', null) ||
                    get(Meteor, 'settings.public.fhir.baseUrl', null) ||
                    (Meteor.absoluteUrl().includes('localhost') ? 'http://localhost:3000/baseR4' : Meteor.absoluteUrl() + 'fhir/R4');
    
    setEndpointUrl(fhirBase + '/$correction-request');
  }, []);
  
  // Handle back navigation
  const handleBack = () => {
    console.log('[NewCorrectionRequestPage] User action: Back navigation', {
      timestamp: new Date().toISOString()
    });
    navigate('/correction-requests');
  };
  
  // Validate form
  const validateForm = () => {
    console.log('[NewCorrectionRequestPage] Validating form', {
      hasPatient: !!selectedPatientId,
      hasIssueDescription: !!issueDescription.trim(),
      hasCorrectionDetails: !!correctionDetails.trim(),
      hasAcknowledgment: acknowledgment
    });
    const newErrors = {};
    
    if (!selectedPatientId) {
      newErrors.patient = 'Please select a patient';
    }
    
    if (!issueDescription.trim()) {
      newErrors.issueDescription = 'Please describe the issue with your record';
    }
    
    if (!correctionDetails.trim()) {
      newErrors.correctionDetails = 'Please provide the correct information';
    }
    
    if (!acknowledgment) {
      newErrors.acknowledgment = 'Please acknowledge the terms';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle preview
  const handlePreview = () => {
    console.log('[NewCorrectionRequestPage] User action: Preview', {
      timestamp: new Date().toISOString(),
      requestType,
      urgency,
      contactPreference
    });
    if (!validateForm()) return;
    setPreviewOpen(true);
  };
  
  // Submit request
  const handleSubmit = async () => {
    console.log('[NewCorrectionRequestPage] User action: Submit', {
      timestamp: new Date().toISOString(),
      patientId: selectedPatientId,
      requestType,
      urgency,
      endpoint: endpointUrl
    });
    setSubmitError(null);
    
    setSubmitting(true);
    try {
      // Get patient display name
      const selectedPatient = Session.get('selectedPatient');
      const patientDisplay = get(selectedPatient, 'name[0].text') || 
                            get(selectedPatient, 'name[0].family') + ', ' + get(selectedPatient, 'name[0].given[0]') ||
                            'Patient';
      
      // Create the communication payload
      const communicationData = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxReq',
            display: 'Correction Request'
          }]
        }],
        subject: {
          reference: `Patient/${selectedPatientId}`,
          display: patientDisplay
        },
        sent: new Date(),
        sender: {
          reference: `Patient/${selectedPatientId}`,
          display: patientDisplay
        },
        payload: [{
          contentString: `Issue Description:\n${issueDescription}\n\nRequested Correction:\n${correctionDetails}\n\nUrgency: ${urgency}\nContact Preference: ${contactPreference}`
        }],
        priority: urgency === 'urgent' ? 'urgent' : 'routine',
        meta: {
          lastUpdated: new Date()
        }
      };
      
      // Call server method to create the request
      console.log('[NewCorrectionRequestPage] Calling server method with data:', {
        patientId: selectedPatientId,
        requestType,
        endpoint: endpointUrl
      });
      
      const result = await Meteor.rpc('correctionRequests.create', {
        patientId: selectedPatientId,
        communicationData,
        requestType,
        endpoint: endpointUrl
      });
      
      console.log('[NewCorrectionRequestPage] Submission successful:', {
        taskId: result.taskId,
        communicationId: result.communicationId,
        timestamp: new Date().toISOString()
      });
      
      // Close modal and navigate back to the list
      setPreviewOpen(false);
      navigate('/correction-requests');
      
    } catch (error) {
      console.error('[NewCorrectionRequestPage] Submission failed:', {
        error: error.message,
        details: error.details,
        timestamp: new Date().toISOString()
      });
      setSubmitError(error.message || 'Failed to submit correction request');
      setSubmitting(false);
    }
  };
  
  // Handle attachment (placeholder)
  const handleAttachment = () => {
    alert('File attachment functionality would be implemented here');
  };
  
  if (!selectedPatientId) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          Please select a patient from the patient sidebar before submitting a correction request.
        </Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>Back to List</Button>
      </Box>
    );
  }
  
  return (
    <Box id="newCorrectionRequestPage" sx={{ p: 2.5, bgcolor: pageBgColor, minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1, color: cardTextColor }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ color: cardTextColor }}>Submit Correction Request</Typography>
          </Box>
        </Grid>
        
        {/* Instructions */}
        <Grid item xs={12}>
          <Alert severity="info" icon={<InfoIcon />}>
            Use this form to request corrections to your medical record. Please be as specific as possible about what needs to be corrected and provide the accurate information.
          </Alert>
        </Grid>
        
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: secondaryTextColor },
            }}>
            <CardHeader title="Correction Request Details" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Request Type */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Request Type</InputLabel>
                  <Select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    label="Request Type"
                  >
                    <MenuItem value="correction">Correction - Fix inaccurate information</MenuItem>
                    <MenuItem value="amendment">Amendment - Add missing information</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Issue Description */}
                <TextField
                  label="Describe the Issue"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  error={!!errors.issueDescription}
                  helperText={errors.issueDescription || "What information in your record is incorrect or missing?"}
                  required
                />
                
                {/* Correction Details */}
                <TextField
                  label="Provide Correct Information"
                  multiline
                  rows={4}
                  fullWidth
                  variant="outlined"
                  value={correctionDetails}
                  onChange={(e) => setCorrectionDetails(e.target.value)}
                  error={!!errors.correctionDetails}
                  helperText={errors.correctionDetails || "What should the information be changed to?"}
                  required
                />
                
                {/* Urgency */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                    label="Urgency"
                  >
                    <MenuItem value="routine">Routine - Standard processing time</MenuItem>
                    <MenuItem value="urgent">Urgent - Expedited review needed</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Contact Preference */}
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Preferred Contact Method</InputLabel>
                  <Select
                    value={contactPreference}
                    onChange={(e) => setContactPreference(e.target.value)}
                    label="Preferred Contact Method"
                  >
                    <MenuItem value="secure-message">Secure Message (Through this portal)</MenuItem>
                    <MenuItem value="phone">Phone Call</MenuItem>
                    <MenuItem value="mail">Postal Mail</MenuItem>
                  </Select>
                </FormControl>
                
                {/* Attachments */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Supporting Documents (Optional)
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AttachFileIcon />}
                    onClick={handleAttachment}
                  >
                    Attach File
                  </Button>
                  {attachments.length > 0 && (
                    <List dense sx={{ mt: 1 }}>
                      {attachments.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemText primary={file.name} secondary={file.size} />
                          <IconButton edge="end" size="small">
                            <DeleteIcon />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                
                {/* Acknowledgment */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acknowledgment}
                      onChange={(e) => setAcknowledgment(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="I understand that my request will be reviewed and I may be contacted for additional information. Not all requests may be approved."
                  sx={{ 
                    border: errors.acknowledgment ? '1px solid' : 'none',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    p: errors.acknowledgment ? 1 : 0
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Sidebar Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: paperBgColor, color: cardTextColor }}>
            <Typography variant="h6" gutterBottom>
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              What Happens Next?
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Request Review"
                  secondary="Your request will be reviewed by our medical records team"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Communication"
                  secondary="We may contact you for additional information"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Decision"
                  secondary="You'll be notified of the decision within 60 days"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Implementation"
                  secondary="Approved corrections will be applied to your record"
                />
              </ListItem>
            </List>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body2" sx={{ color: secondaryTextColor }}>
              <strong>Note:</strong> You have the right to request corrections to your medical record under HIPAA regulations.
              However, not all requests may be approved if the information is deemed accurate and complete.
            </Typography>
          </Paper>
        </Grid>
        
        {/* Action Buttons */}
        <Grid item xs={12}>
          {errors.patient && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.patient}
            </Alert>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PreviewIcon />}
              onClick={handlePreview}
              disabled={submitting || !selectedPatientId}
            >
              Preview Request
            </Button>
          </Box>
        </Grid>
      </Grid>
      
      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={() => !submitting && setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Preview Correction Request
            <IconButton 
              onClick={() => setPreviewOpen(false)}
              disabled={submitting}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {/* Endpoint URL - Editable */}
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ flexShrink: 0 }}>
                <strong>Endpoint:</strong>
              </Typography>
              {customEndpoint ? (
                <TextField
                  size="small"
                  fullWidth
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  variant="outlined"
                />
              ) : (
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {endpointUrl}
                </Typography>
              )}
              <IconButton 
                size="small" 
                onClick={() => setCustomEndpoint(!customEndpoint)}
                title={customEndpoint ? "Use default" : "Edit endpoint"}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Alert>
          
          {/* Request Summary */}
          <Typography variant="h6" gutterBottom>Request Details</Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell><strong>Patient ID</strong></TableCell>
                <TableCell>{selectedPatientId}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Request Type</strong></TableCell>
                <TableCell>
                  <Chip 
                    label={requestType === 'correction' ? 'Correction' : 'Amendment'} 
                    size="small" 
                    color="primary" 
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Urgency</strong></TableCell>
                <TableCell>
                  <Chip 
                    label={urgency === 'urgent' ? 'Urgent' : 'Routine'} 
                    size="small" 
                    color={urgency === 'urgent' ? 'error' : 'default'}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell><strong>Contact Method</strong></TableCell>
                <TableCell>{contactPreference}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          
          <Divider sx={{ my: 2 }} />
          
          {/* Issue Description */}
          <Typography variant="h6" gutterBottom>Issue Description</Typography>
          <Paper sx={{ p: 2, bgcolor: paperBgColor, color: cardTextColor, mb: 2 }}>
            <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
              {issueDescription}
            </Typography>
          </Paper>

          {/* Correction Details */}
          <Typography variant="h6" gutterBottom>Requested Correction</Typography>
          <Paper sx={{ p: 2, bgcolor: paperBgColor, color: cardTextColor, mb: 2 }}>
            <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
              {correctionDetails}
            </Typography>
          </Paper>
          
          {/* Error Alert */}
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {submitError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setPreviewOpen(false)}
            disabled={submitting}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}