// packages/request-for-corrections/client/pages/CorrectionRequestDetailPage.jsx

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
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  CircularProgress
} from '@mui/material';

import {
  ArrowBack as BackIcon,
  Send as SendIcon,
  AttachFile as AttachIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
  CheckCircle as AcceptIcon,
  Error as DenyIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import moment from 'moment';

// Import collections
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';
import { CorrectionRequests } from '../../lib/collections/CorrectionRequests';
import { CorrectionWorkflow } from '../../lib/CorrectionWorkflow';

export default function CorrectionRequestDetailPage() {
  const { id: taskId } = useParams();
  const navigate = useNavigate();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const [responseDialog, setResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [responseType, setResponseType] = useState(''); // 'info', 'accept', 'deny', 'cancel'
  const [submitting, setSubmitting] = useState(false);
  
  
  // Subscribe to task and communications
  const { task, communications, loading } = useTracker(() => {
    const sub1 = Meteor.subscribe('correctionRequests.task', taskId);
    
    console.log('[CorrectionRequestDetailPage] Looking for task:', taskId);
    console.log('[CorrectionRequestDetailPage] Subscription status:', {
      sub1Ready: sub1.ready()
    });
    
    // Wait for subscription to be ready
    if (!sub1.ready()) {
      return {
        task: null,
        communications: [],
        loading: true
      };
    }
    
    // Try main Tasks collection first using global Collections
    let taskData = null;
    
    // Check global Collections object
    if (global.Collections && global.Collections.Tasks) {
      taskData = global.Collections.Tasks.findOne({ _id: taskId });
      if (taskData) {
        console.log('[CorrectionRequestDetailPage] Found task in global.Collections.Tasks');
      }
    }
    
    // Try window.Collections as fallback
    if (!taskData && window.Collections && window.Collections.Tasks) {
      taskData = window.Collections.Tasks.findOne({ _id: taskId });
      if (taskData) {
        console.log('[CorrectionRequestDetailPage] Found task in window.Collections.Tasks');
      }
    }
    
    // Fallback to CorrectionTasks
    if (!taskData) {
      taskData = CorrectionTasks.findOne(taskId);
      if (taskData) {
        console.log('[CorrectionRequestDetailPage] Found task in CorrectionTasks collection');
      }
    }
    
    if (!taskData) {
      console.log('[CorrectionRequestDetailPage] Task not found in any collection');
      console.log('[CorrectionRequestDetailPage] Available collections:', {
        globalCollections: !!global.Collections,
        globalTasks: !!(global.Collections && global.Collections.Tasks),
        windowCollections: !!window.Collections,
        windowTasks: !!(window.Collections && window.Collections.Tasks),
        correctionTasks: !!CorrectionTasks
      });
    }
    
    const commsData = CorrectionCommunications.find({
      'about.reference': `Task/${taskId}`
    }, {
      sort: { sent: 1 }
    }).fetch();
    
    return {
      task: taskData,
      communications: commsData,
      loading: false
    };
  }, [taskId]);
  
  // Get current user type (simplified - in real app would check actual user roles)
  const isPatient = true; // For demo purposes
  const currentUserId = Meteor.userId();
  
  // Handle back navigation
  const handleBack = () => {
    navigate('/correction-requests');
  };
  
  // Open response dialog
  const openResponseDialog = (type) => {
    setResponseType(type);
    setResponseText('');
    setResponseDialog(true);
  };
  
  // Submit response
  const handleSubmitResponse = async () => {
    setSubmitting(true);
    try {
      const method = responseType === 'cancel' ? 'correctionRequests.cancel' : 'correctionRequests.respond';

      await Meteor.rpc(method, {
        taskId,
        message: responseText,
        responseType
      });
      
      setResponseDialog(false);
      setResponseText('');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Error submitting response: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Get status color
  const getStatusColor = (task) => {
    const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
    const statusColorMap = {
      'queued': 'default',
      'in-review': 'primary',
      'waiting-for-information': 'warning',
      'accepted': 'success',
      'partial-accept': 'warning',
      'amendment-completed': 'success',
      'denied': 'error',
      'disagreement-logged': 'warning',
      'completed': 'success',
      'requester-cancelled': 'default'
    };
    return statusColorMap[businessStatus] || 'default';
  };
  
  // Get workflow steps
  const getWorkflowSteps = () => {
    if (!task) return [];
    
    const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
    const steps = [
      { label: 'Request Submitted', completed: true },
      { label: 'Under Review', completed: ['in-review', 'waiting-for-information', 'accepted', 'partial-accept', 'denied', 'amendment-completed'].includes(businessStatus) },
      { label: 'Decision Made', completed: ['accepted', 'partial-accept', 'denied', 'amendment-completed'].includes(businessStatus) },
      { label: 'Completed', completed: ['amendment-completed', 'requester-cancelled'].includes(businessStatus) || (businessStatus === 'denied' && !CorrectionTasks.canFileDisagreement(task)) }
    ];
    
    return steps;
  };
  
  // Render communication thread
  const renderCommunicationThread = () => {
    if (communications.length === 0) {
      return <Typography>No communications yet.</Typography>;
    }
    
    return (
      <List>
        {communications.map((comm, index) => {
          const isFromPatient = get(comm, 'sender.reference', '').includes('Patient');
          const messageContent = CorrectionCommunications.getMessageContent(comm);
          const commType = CorrectionCommunications.getCommunicationType(comm);
          
          return (
            <React.Fragment key={comm._id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: isFromPatient ? 'primary.main' : 'secondary.main' }}>
                    {isFromPatient ? <PersonIcon /> : <BusinessIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">
                        {isFromPatient ? 'Patient' : 'Provider'}
                        {commType === 'medRecCxDenialDisagree' && (
                          <Chip label="Disagreement" size="small" color="warning" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: secondaryTextColor }}>
                        {moment(comm.sent).format('MMM DD, YYYY h:mm A')}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                      {messageContent}
                    </Typography>
                  }
                />
              </ListItem>
              {index < communications.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          );
        })}
      </List>
    );
  };
  
  // Render action buttons based on state
  const renderActions = () => {
    if (!task || CorrectionTasks.isComplete(task)) return null;
    
    const businessStatus = CorrectionTasks.getBusinessStatusCode(task);
    const needsPatientAction = CorrectionTasks.needsPatientAction(task);
    const needsProviderAction = CorrectionTasks.needsProviderAction(task);
    
    // Patient actions
    if (isPatient) {
      return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {businessStatus === 'waiting-for-information' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<SendIcon />}
              onClick={() => openResponseDialog('info')}
            >
              Provide Information
            </Button>
          )}
          
          {businessStatus === 'denied' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<WarningIcon />}
              onClick={() => openResponseDialog('disagreement')}
            >
              File Disagreement
            </Button>
          )}
          
          {CorrectionRequests.canCancel({ _id: task._id }) && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => openResponseDialog('cancel')}
            >
              Cancel Request
            </Button>
          )}
        </Box>
      );
    }
    
    // Provider actions (for future implementation)
    return (
      <Box sx={{ display: 'flex', gap: 1 }}>
        {businessStatus === 'queued' && (
          <Button variant="contained" color="primary">
            Start Review
          </Button>
        )}
        
        {businessStatus === 'in-review' && (
          <>
            <Button
              variant="contained"
              color="success"
              startIcon={<AcceptIcon />}
              onClick={() => openResponseDialog('accept')}
            >
              Accept
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<DenyIcon />}
              onClick={() => openResponseDialog('deny')}
            >
              Deny
            </Button>
            <Button
              variant="outlined"
              startIcon={<InfoIcon />}
              onClick={() => openResponseDialog('info-request')}
            >
              Request Info
            </Button>
          </>
        )}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!task) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert 
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={handleBack}>
              Back to List
            </Button>
          }
        >
          Correction request not found.
        </Alert>
      </Box>
    );
  }
  
  const stateDisplay = CorrectionTasks.getStateDisplay(task);
  const progress = CorrectionTasks.getProgressPercentage(task);
  const steps = getWorkflowSteps();
  
  return (
    <Box id="correctionRequestDetailPage" sx={{ p: 2.5, bgcolor: pageBgColor, minHeight: '100vh' }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handleBack} sx={{ mr: 1, color: cardTextColor }}>
              <BackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ color: cardTextColor }}>Correction Request Details</Typography>
          </Box>
        </Grid>
        
        {/* Status Overview */}
        <Grid item xs={12} md={8}>
          <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: secondaryTextColor },
              '& .MuiStepLabel-label': { color: cardTextColor },
              '& .MuiStepLabel-label.Mui-completed': { color: cardTextColor },
            }}>
            <CardHeader
              title="Request Status"
              action={
                <Chip 
                  label={stateDisplay}
                  color={getStatusColor(task)}
                />
              }
            />
            <CardContent>
              {/* Progress Bar */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Progress</Typography>
                  <Typography variant="body2">{progress}%</Typography>
                </Box>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  backgroundColor: 'action.hover',
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{ 
                    width: `${progress}%`, 
                    height: '100%', 
                    backgroundColor: getStatusColor(task) === 'error' ? 'error.main' : 'primary.main',
                    transition: 'width 0.3s'
                  }} />
                </Box>
              </Box>
              
              {/* Workflow Steps */}
              <Stepper orientation="vertical">
                {steps.map((step, index) => (
                  <Step key={index} active={false} completed={step.completed}>
                    <StepLabel>{step.label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {/* Action Buttons */}
              <Box sx={{ mt: 3 }}>
                {renderActions()}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Task Details */}
        <Grid item xs={12} md={4}>
          <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: secondaryTextColor },
            }}>
            <CardHeader title="Request Information" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>Request ID</Typography>
                  <Typography variant="body2">{task._id}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>Submitted</Typography>
                  <Typography variant="body2">
                    {moment(task.authoredOn).format('MMM DD, YYYY h:mm A')}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>Last Updated</Typography>
                  <Typography variant="body2">
                    {moment(get(task, 'meta.lastUpdated')).fromNow()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: secondaryTextColor }}>Type</Typography>
                  <Typography variant="body2">
                    {CorrectionTasks.isCorrectionRequest(task) ? 'Correction Request' : 'Disagreement'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Communication Thread */}
        <Grid item xs={12}>
          <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: secondaryTextColor },
            }}>
            <CardHeader title="Communication History" />
            <CardContent>
              {renderCommunicationThread()}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Response Dialog */}
      <Dialog
        open={responseDialog}
        onClose={() => setResponseDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {responseType === 'info' && 'Provide Additional Information'}
          {responseType === 'disagreement' && 'File Disagreement'}
          {responseType === 'cancel' && 'Cancel Request'}
          {responseType === 'accept' && 'Accept Request'}
          {responseType === 'deny' && 'Deny Request'}
          {responseType === 'info-request' && 'Request Information'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Enter your message..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            sx={{ mt: 2 }}
          />
          
          {responseType === 'cancel' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Cancelling this request will permanently close it. This action cannot be undone.
            </Alert>
          )}
          
          {responseType === 'disagreement' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Filing a disagreement will create a new request to document your objection to the denial.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialog(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitResponse}
            variant="contained"
            disabled={!responseText.trim() || submitting}
            color={responseType === 'deny' || responseType === 'cancel' ? 'error' : 'primary'}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}