// packages/request-for-corrections/client/pages/CorrectionRequestApproval.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

// Use Meteor.useNavigate/useParams pattern per project requirements
let useNavigate, useParams;
Meteor.startup(function() {
  useNavigate = Meteor.useNavigate;
  useParams = Meteor.useParams;
});

// Use Meteor.useTheme for dark mode support
let useAppTheme;
Meteor.startup(function() {
  useAppTheme = Meteor.useTheme;
});

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Container,
  TextField,
  Typography,
  Box,
  Stack,
  Chip,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';

import { 
  Check as ApproveIcon, 
  Close as DenyIcon,
  Info as InfoIcon,
  ArrowBack as BackIcon,
  Assessment as AssessmentIcon,
  Edit as CorrectionIcon,
  Person as PatientIcon,
  Warning as WarningIcon,
  Schedule as ClockIcon,
  AssignmentTurnedIn as AcceptIcon,
  Block as RejectIcon,
  QuestionAnswer as RequestInfoIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import moment from 'moment';

// Import collections
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';
import { BUSINESS_STATUSES } from '../../lib/constants/businessStatuses';

// Define approval statuses
const APPROVAL_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DENIED: 'denied',
  PARTIAL_ACCEPT: 'partial_accept',
  NEEDS_MORE_INFO: 'needs_more_info',
  COMPLETED: 'completed'
};

export default function CorrectionRequestApproval() {
  const navigate = useNavigate();
  const { id } = useParams();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const paperBgColor = isDark ? '#2a2a2a' : '#f5f5f5';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const [approvalStatus, setApprovalStatus] = useState(APPROVAL_STATUS.PENDING);
  const [responseNotes, setResponseNotes] = useState('');
  const [partialAcceptDetails, setPartialAcceptDetails] = useState('');
  const [moreInfoRequest, setMoreInfoRequest] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  
  // Subscribe to task and communications
  const { isLoading, subscriptionReady } = useTracker(() => {
    console.log('[CorrectionRequestApproval] Subscribing to task:', id);
    
    const sub1 = Meteor.subscribe('correctionRequests.task', id);
    const ready = sub1.ready();
    
    console.log('[CorrectionRequestApproval] Subscription ready:', ready);
    
    return {
      isLoading: !ready,
      subscriptionReady: ready
    };
  }, [id]);
  
  // Load task data
  const task = useTracker(() => {
    if (!id) return null;
    
    // Wait for subscription to be ready
    if (!subscriptionReady) {
      console.log('[CorrectionRequestApproval] Waiting for subscription...');
      return null;
    }
    
    // Check CMO configuration
    const cmoId = get(Meteor, 'settings.public.chiefMedicalOfficer.id') ||
                  get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                  get(Meteor, 'settings.public.cmo.id') ||
                  get(Meteor, 'settings.private.cmo.id');
    
    if (!cmoId || cmoId === 'chief-medical-officer') {
      console.warn('[CorrectionRequestApproval] ⚠️ CONFIGURATION REQUIRED: Chief Medical Officer (CMO) not configured!');
      console.warn('[CorrectionRequestApproval] Please set the CMO practitioner ID in Meteor.settings:');
      console.warn('[CorrectionRequestApproval] Example: { "private": { "chiefMedicalOfficer": { "id": "practitioner-id-here" } } }');
      console.warn('[CorrectionRequestApproval] Or: { "private": { "cmo": { "id": "practitioner-id-here" } } }');
    }
    
    // Try main Tasks collection using global Collections
    let foundTask = null;
    
    // Check global Collections object
    if (global.Collections && global.Collections.Tasks) {
      foundTask = global.Collections.Tasks.findOne({ _id: id });
      if (foundTask) {
        console.log('[CorrectionRequestApproval] Found task in global.Collections.Tasks');
        return foundTask;
      }
    }
    
    // Try window.Collections as fallback
    if (!foundTask && window.Collections && window.Collections.Tasks) {
      foundTask = window.Collections.Tasks.findOne({ _id: id });
      if (foundTask) {
        console.log('[CorrectionRequestApproval] Found task in window.Collections.Tasks');
        return foundTask;
      }
    }
    
    // Fallback to CorrectionTasks
    if (!foundTask) {
      foundTask = CorrectionTasks.findOne({ _id: id });
      if (foundTask) {
        console.log('[CorrectionRequestApproval] Found task in CorrectionTasks');
      }
    }
    
    if (!foundTask) {
      console.log('[CorrectionRequestApproval] Task not found. Available collections:', {
        globalCollections: !!global.Collections,
        globalTasks: !!(global.Collections && global.Collections.Tasks),
        windowCollections: !!window.Collections,
        windowTasks: !!(window.Collections && window.Collections.Tasks),
        correctionTasks: !!CorrectionTasks
      });
    }
    
    return foundTask;
  }, [id, subscriptionReady]);
  
  // Load communications
  const communications = useTracker(() => {
    if (!id) return [];
    
    const comms = CorrectionCommunications.find({
      'about.reference': `Task/${id}`
    }, {
      sort: { sent: 1 }
    }).fetch();
    
    console.log('[CorrectionRequestApproval] Found communications:', comms.length);
    return comms;
  }, [id]);
  
  // Load patient data
  const patient = useTracker(() => {
    if (!task) return null;
    
    const patientRef = get(task, 'for.reference', '');
    const patientId = patientRef.replace('Patient/', '');
    
    if (!patientId) return null;
    
    const Patients = get(Meteor, 'Collections.Patients') || get(window, 'Collections.Patients');
    if (!Patients) return null;
    
    // Try _id first (MongoDB primary key), then FHIR id as fallback
    let foundPatient = Patients.findOne({ _id: patientId });
    if (!foundPatient) {
      foundPatient = Patients.findOne({ id: patientId });
    }
    return foundPatient;
  }, [task]);
  
  // Get initial request
  const initialRequest = communications.find(comm => 
    get(comm, 'category[0].coding[0].code') === 'medRecCxReq' &&
    !comm.inResponseTo
  );
  
  // Handle approve
  async function handleApprove() {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create approval communication
      const approvalComm = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxAccept',
            display: 'Acceptance of Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${id}`
        }],
        sent: new Date(),
        sender: task.owner,
        recipient: [task.requester],
        payload: [{
          contentString: `Your correction request has been accepted and will be processed. ${responseNotes}`
        }],
        inResponseTo: initialRequest ? [{ reference: `Communication/${initialRequest._id}` }] : []
      };
      
      const commId = await Meteor.callAsync('correctionCommunications.create', approvalComm);
      
      // Update task status to completed when accepted
      await Meteor.callAsync('correctionTasks.updateStatus', id, {
        status: 'completed',
        businessStatus: BUSINESS_STATUSES.accepted,
        output: [{
          type: { text: 'Approval Communication' },
          valueReference: { reference: `Communication/${commId}` }
        }]
      });
      
      setSuccessMessage('Correction request approved.');
      setApprovalStatus(APPROVAL_STATUS.ACCEPTED);
      
      setTimeout(() => {
        navigate('/correction-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error approving correction request:', error);
      setError(error.message || 'Failed to approve correction request');
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  }
  
  // Handle deny
  async function handleDeny() {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create denial communication
      const denialComm = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxDeny',
            display: 'Denial of Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${id}`
        }],
        sent: new Date(),
        sender: task.owner,
        recipient: [task.requester],
        payload: [{
          contentString: `Your correction request has been reviewed and denied. Reason: ${responseNotes}`
        }],
        inResponseTo: initialRequest ? [{ reference: `Communication/${initialRequest._id}` }] : []
      };
      
      const commId = await Meteor.callAsync('correctionCommunications.create', denialComm);
      
      // Update task status
      await Meteor.callAsync('correctionTasks.updateStatus', id, {
        status: 'rejected',
        businessStatus: BUSINESS_STATUSES.denied,
        output: [{
          type: { text: 'Denial Communication' },
          valueReference: { reference: `Communication/${commId}` }
        }]
      });
      
      setSuccessMessage('Correction request denied.');
      setApprovalStatus(APPROVAL_STATUS.DENIED);
      
      setTimeout(() => {
        navigate('/correction-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error denying correction request:', error);
      setError(error.message || 'Failed to deny correction request');
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  }
  
  // Handle partial accept
  async function handlePartialAccept() {
    if (!partialAcceptDetails) {
      setError('Please specify which parts are accepted');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create partial acceptance communication
      const partialComm = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxPartialAccept',
            display: 'Partial Acceptance of Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${id}`
        }],
        sent: new Date(),
        sender: task.owner,
        recipient: [task.requester],
        payload: [{
          contentString: `Your correction request has been partially accepted. ${partialAcceptDetails}. ${responseNotes}`
        }],
        inResponseTo: initialRequest ? [{ reference: `Communication/${initialRequest._id}` }] : []
      };
      
      const commId = await Meteor.callAsync('correctionCommunications.create', partialComm);
      
      // Update task status
      await Meteor.callAsync('correctionTasks.updateStatus', id, {
        status: 'in-progress',
        businessStatus: BUSINESS_STATUSES['partial-accept'],
        output: [{
          type: { text: 'Partial Acceptance Communication' },
          valueReference: { reference: `Communication/${commId}` }
        }]
      });
      
      setSuccessMessage('Partial acceptance recorded.');
      setApprovalStatus(APPROVAL_STATUS.PARTIAL_ACCEPT);
      
      setTimeout(() => {
        navigate('/correction-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error recording partial acceptance:', error);
      setError(error.message || 'Failed to record partial acceptance');
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  }
  
  // Handle request more info
  async function handleRequestMoreInfo() {
    if (!moreInfoRequest) {
      setError('Please specify what information is needed');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Create information request communication
      const infoComm = {
        resourceType: 'Communication',
        status: 'completed',
        category: [{
          coding: [{
            system: 'http://fhir.org/guides/patient-correction/CodeSystem/PatientCorrectionCommunicationTypes',
            code: 'medRecCxReq',
            display: 'Correction Request'
          }]
        }],
        subject: task.for,
        about: [{
          reference: `Task/${id}`
        }],
        sent: new Date(),
        sender: task.owner,
        recipient: [task.requester],
        payload: [{
          contentString: `Additional information is needed to process your request: ${moreInfoRequest}. ${responseNotes}`
        }],
        inResponseTo: initialRequest ? [{ reference: `Communication/${initialRequest._id}` }] : []
      };
      
      const commId = await Meteor.callAsync('correctionCommunications.create', infoComm);
      
      // Update task status
      await Meteor.callAsync('correctionTasks.updateStatus', id, {
        status: 'on-hold',
        businessStatus: BUSINESS_STATUSES['waiting-for-information'],
        output: [{
          type: { text: 'Information Request Communication' },
          valueReference: { reference: `Communication/${commId}` }
        }]
      });
      
      setSuccessMessage('Information request sent.');
      setApprovalStatus(APPROVAL_STATUS.NEEDS_MORE_INFO);
      
      setTimeout(() => {
        navigate('/correction-requests');
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting more information:', error);
      setError(error.message || 'Failed to request more information');
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  }
  
  // Open dialog for action
  function openActionDialog(action) {
    setDialogAction(action);
    setDialogOpen(true);
  }
  
  // Handle dialog submit
  function handleDialogSubmit() {
    switch(dialogAction) {
      case 'approve':
        handleApprove();
        break;
      case 'deny':
        handleDeny();
        break;
      case 'partial':
        handlePartialAccept();
        break;
      case 'info':
        handleRequestMoreInfo();
        break;
      default:
        setDialogOpen(false);
    }
  }
  
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </CardContent>
        </Card>
      </Container>
    );
  }
  
  if (!task) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/correction-requests')}>
              Back to List
            </Button>
          }
        >
          Correction request not found.
        </Alert>
      </Container>
    );
  }
  
  const requestDate = moment(task.authoredOn).format('MMM D, YYYY h:mm A');
  const patientName = get(patient, 'name[0].text') || 
                      get(task, 'for.display') || 
                      'Unknown Patient';
  const requestType = get(task, 'code.coding[0].display', 'Correction Request');
  const priority = get(task, 'priority', 'routine');
  const currentStatus = CorrectionTasks.getStateDisplay(task);
  const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
  
  // Check if actions are allowed based on current status
  const canTakeAction = task.status === 'ready' || task.status === 'in-progress' || task.status === 'on-hold';
  
  return (
    <Container id="correctionRequestApprovalPage" maxWidth="lg" sx={{ py: 4, bgcolor: pageBgColor, minHeight: '100vh' }}>
      <Card sx={{
          boxShadow: 3,
          bgcolor: cardBgColor,
          color: cardTextColor,
          '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
          '& .MuiTab-root': { color: cardTextColor },
          '& .MuiTabs-indicator': { backgroundColor: isDark ? '#90caf9' : 'primary.main' },
        }}>
        <CardHeader
          title="Correction Request Review"
          subheader={`Requested: ${requestDate}`}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          action={
            <Stack direction="row" spacing={1}>
              <Chip
                label={currentStatus}
                sx={{ bgcolor: isDark ? '#1e1e1e' : '#ffffff', color: 'primary.main' }}
              />
              <Chip 
                label={priority.toUpperCase()} 
                color={priority === 'urgent' ? 'error' : 'default'}
                sx={{ color: 'primary.contrastText' }}
              />
            </Stack>
          }
        />
        
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}
          
          {/* Summary Section */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: paperBgColor, color: cardTextColor }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PatientIcon color="primary" />
                    <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>Patient</Typography>
                  </Box>
                  <Typography variant="h6">{patientName}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CorrectionIcon color="primary" />
                    <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>Request Type</Typography>
                  </Box>
                  <Typography variant="h6">{requestType}</Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ClockIcon color="primary" />
                    <Typography variant="subtitle2" sx={{ color: secondaryTextColor }}>Current Status</Typography>
                  </Box>
                  <Typography variant="h6">{currentStatus}</Typography>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Tabs for different information sections */}
          <Box sx={{ borderBottom: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Request Details" />
              <Tab label="Communication History" />
              <Tab label="Patient Information" />
            </Tabs>
          </Box>
          
          {/* Tab Panels */}
          {tabValue === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Request Information</Typography>
              
              {/* Current Status Alert */}
              <Alert 
                severity={
                  task.status === 'completed' ? 'success' :
                  task.status === 'cancelled' ? 'error' :
                  task.status === 'on-hold' ? 'warning' :
                  'info'
                }
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle2">Current Status</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {currentStatus}
                </Typography>
                <Typography variant="caption" display="block">
                  Task Status: {task.status} | Business Status: {businessStatus}
                </Typography>
              </Alert>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Request ID"
                    secondary={task._id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Priority"
                    secondary={task.priority}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Requested By"
                    secondary={get(task, 'requester.display', get(task, 'requester.reference', 'Unknown'))}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Assigned To"
                    secondary={get(task, 'owner.display', 'Unassigned')}
                  />
                </ListItem>
                {task.description && (
                  <ListItem>
                    <ListItemText 
                      primary="Description"
                      secondary={task.description}
                    />
                  </ListItem>
                )}
              </List>
              
              {initialRequest && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Initial Request</Typography>
                  <Paper sx={{ p: 2, bgcolor: paperBgColor, color: cardTextColor }}>
                    <Typography variant="body1">
                      {CorrectionCommunications.getMessageContent(initialRequest)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: secondaryTextColor, mt: 1, display: 'block' }}>
                      Submitted: {moment(initialRequest.sent).format('MMM D, YYYY h:mm A')}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>
          )}
          
          {tabValue === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Communication History</Typography>
              {communications.length === 0 ? (
                <Typography sx={{ color: secondaryTextColor }}>No communications yet</Typography>
              ) : (
                <Stack spacing={2}>
                  {communications.map((comm, index) => {
                    const isPatientMessage = get(comm, 'sender.reference', '').includes('Patient/');
                    return (
                      <Paper key={comm._id} sx={{ p: 2, color: cardTextColor, bgcolor: isPatientMessage
                        ? (isDark ? '#1a3a5c' : '#e3f2fd')
                        : (isDark ? '#2a2a2a' : '#f5f5f5') }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle2">
                            {isPatientMessage ? 'Patient' : 'Provider'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                            {moment(comm.sent).format('MMM D, YYYY h:mm A')}
                          </Typography>
                        </Box>
                        <Typography variant="body2">
                          {CorrectionCommunications.getMessageContent(comm)}
                        </Typography>
                        {get(comm, 'category[0].coding[0].code') && (
                          <Chip 
                            label={get(comm, 'category[0].coding[0].display', get(comm, 'category[0].coding[0].code'))}
                            size="small"
                            sx={{ mt: 1 }}
                          />
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Box>
          )}
          
          {tabValue === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Patient Information</Typography>
              {patient ? (
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Name"
                      secondary={get(patient, 'name[0].text', 'Unknown')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Birth Date"
                      secondary={patient.birthDate ? moment(patient.birthDate).format('MMM D, YYYY') : 'Unknown'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Gender"
                      secondary={get(patient, 'gender', 'Unknown')}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="MRN"
                      secondary={get(patient, 'identifier[0].value', 'Unknown')}
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography sx={{ color: secondaryTextColor }}>Patient information not available</Typography>
              )}
            </Box>
          )}
        </CardContent>
        
        {canTakeAction && (
          <CardActions sx={{ justifyContent: 'space-between', p: 3, bgcolor: paperBgColor }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/correction-requests')}
            >
              Back to List
            </Button>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => openActionDialog('approve')}
                disabled={isProcessing}
              >
                Accept
              </Button>
              
              <Button
                variant="contained"
                color="warning"
                startIcon={<InfoIcon />}
                onClick={() => openActionDialog('partial')}
                disabled={isProcessing}
              >
                Partial Accept
              </Button>
              
              <Button
                variant="outlined"
                color="info"
                startIcon={<RequestInfoIcon />}
                onClick={() => openActionDialog('info')}
                disabled={isProcessing}
              >
                Request Info
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<DenyIcon />}
                onClick={() => openActionDialog('deny')}
                disabled={isProcessing}
              >
                Deny
              </Button>
            </Stack>
          </CardActions>
        )}
      </Card>
      
      {/* Action Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogAction === 'approve' && 'Accept Correction Request'}
          {dialogAction === 'deny' && 'Deny Correction Request'}
          {dialogAction === 'partial' && 'Partially Accept Request'}
          {dialogAction === 'info' && 'Request More Information'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 2 }}>
            {dialogAction === 'partial' && (
              <TextField
                label="Which parts are accepted?"
                multiline
                rows={3}
                value={partialAcceptDetails}
                onChange={(e) => setPartialAcceptDetails(e.target.value)}
                fullWidth
                required
              />
            )}
            
            {dialogAction === 'info' && (
              <TextField
                label="What information is needed?"
                multiline
                rows={3}
                value={moreInfoRequest}
                onChange={(e) => setMoreInfoRequest(e.target.value)}
                fullWidth
                required
              />
            )}
            
            <TextField
              label={dialogAction === 'deny' ? 'Reason for denial (required)' : 'Additional notes (optional)'}
              multiline
              rows={3}
              value={responseNotes}
              onChange={(e) => setResponseNotes(e.target.value)}
              fullWidth
              required={dialogAction === 'deny'}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={handleDialogSubmit} 
            variant="contained"
            disabled={isProcessing || (dialogAction === 'deny' && !responseNotes)}
          >
            {isProcessing ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}