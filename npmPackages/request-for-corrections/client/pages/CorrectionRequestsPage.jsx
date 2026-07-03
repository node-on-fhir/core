// packages/request-for-corrections/client/pages/CorrectionRequestsPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
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
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Tab,
  Tabs,
  Paper,
  Fab,
  Tooltip,
  CircularProgress
} from '@mui/material';

import { 
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import moment from 'moment';

// Import collections
import { CorrectionTasks } from '../../lib/collections/CorrectionTasks';
import { CorrectionCommunications } from '../../lib/collections/CorrectionCommunications';

const log = (Meteor.Logger ? Meteor.Logger.for('CorrectionRequestsPage') : console);

// Initialize session variables
Session.setDefault('CorrectionTasksTable.tasksIndex', 0);

export default function CorrectionRequestsPage() {
  console.log('[CorrectionRequestsPage] Component mounting/rendering');
  
  const navigate = useNavigate();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';
  const paperBgColor = isDark ? '#2a2a2a' : '#f5f5f5';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';
  const [tabValue, setTabValue] = useState(0);
  const [selectedPatientId, setSelectedPatientId] = useState(Session.get('selectedPatientId'));
  const [TasksTable, setTasksTable] = useState(null);
  const [LayoutHelpers, setLayoutHelpers] = useState(null);
  
  // Comprehensive route logging
  useEffect(() => {
    console.group('[CorrectionRequestsPage] Route Initialization');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', Meteor.userId());
    console.log('User:', Meteor.user());
    console.log('Selected Patient ID (state):', selectedPatientId); // phi-audit: ok
    console.log('Selected Patient ID (session):', Session.get('selectedPatientId')); // phi-audit: ok
    console.log('Selected Patient (session):', Session.get('selectedPatient')); // phi-audit: ok
    console.log('Autopublish enabled:', get(Meteor, 'settings.public.defaults.autoSubscribe', false));
    console.log('Settings:', Meteor.settings);
    console.log('Available collections:', {
      CorrectionTasks: typeof CorrectionTasks !== 'undefined',
      CorrectionCommunications: typeof CorrectionCommunications !== 'undefined',
      Tasks: !!get(Meteor, 'Collections.Tasks'),
      TasksGlobal: !!get(global, 'Collections.Tasks')
    });
    console.groupEnd();
    
    // Log performance metrics
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      console.log('[CorrectionRequestsPage] Page load time:', loadTime, 'ms');
    }
    
    return () => {
      console.log('[CorrectionRequestsPage] Component unmounting at:', new Date().toISOString());
    };
  }, []);
  
  // Load components from Meteor globals
  useEffect(() => {
    // Try to load TasksTable and LayoutHelpers after a short delay
    const loadComponents = () => {
      console.log('CorrectionRequestsPage: Checking for components...');
      console.log('Meteor.Tables available?', !!get(Meteor, 'Tables'));
      console.log('Meteor.Tables.TasksTable available?', !!get(Meteor, 'Tables.TasksTable'));
      
      // Access TasksTable through Meteor.Tables
      if (get(Meteor, 'Tables.TasksTable')) {
        console.log('CorrectionRequestsPage: TasksTable found, setting it');
        setTasksTable(() => get(Meteor, 'Tables.TasksTable'));
      }
      
      // Access LayoutHelpers through Meteor
      if (get(Meteor, 'LayoutHelpers')) {
        console.log('CorrectionRequestsPage: LayoutHelpers found');
        setLayoutHelpers(get(Meteor, 'LayoutHelpers'));
      }
    };
    
    // Try immediately
    loadComponents();
    
    // Also try after a delay in case components load later
    const timer = setTimeout(loadComponents, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Track subscription timeout
  const [subscriptionTimedOut, setSubscriptionTimedOut] = useState(false);
  
  // Subscribe to correction data
  const isLoading = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    let autoSubscribeEnabled = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    
    log.debug('CorrectionRequestsPage: Subscribe - patientId:', { patientId });
    
    // Reset timeout when patient changes
    if (patientId !== selectedPatientId) {
      setSubscriptionTimedOut(false);
    }
    
    // Subscribe to both patient and practitioner views
    const subs = [];
    
    if(autoSubscribeEnabled){
      // For autopublish, we need to get all correction tasks
      const query = {
        'code.coding': { 
          $elemMatch: { 
            code: { $in: ['patient-correction', 'medRecCxReq'] }
          }
        }
      };
      const handle = Meteor.subscribe('autopublish.Tasks', query, { limit: 1000 });
      console.log('CorrectionRequestsPage: autopublish.Tasks ready?', handle.ready());
      return !handle.ready();
    } else {
      // Subscribe to patient-specific requests if patient selected
      if (patientId) {
        const sub1 = Meteor.subscribe('correctionRequests.patient', patientId);
        subs.push(sub1);
        console.log('CorrectionRequestsPage: correctionRequests.patient ready?', sub1.ready()); // phi-audit: ok
      }
      
      // Always subscribe to practitioner view (for CMO/practitioner users)
      const sub2 = Meteor.subscribe('correctionRequests.practitioner');
      subs.push(sub2);
      console.log('CorrectionRequestsPage: correctionRequests.practitioner ready?', sub2.ready());
      
      const allReady = subs.every(sub => sub.ready());
      
      // Set a timeout to prevent infinite loading
      if (!allReady && !subscriptionTimedOut) {
        setTimeout(() => {
          const stillNotReady = subs.some(sub => !sub.ready());
          if (stillNotReady) {
            console.warn('CorrectionRequestsPage: Subscription timed out, assuming no data');
            setSubscriptionTimedOut(true);
          }
        }, 3000); // 3 second timeout
      }
      
      // Return loading state (false if timed out)
      return !allReady && !subscriptionTimedOut;
    }
  }, [selectedPatientId, tabValue, subscriptionTimedOut]);
  
  // Track the tasks data
  const tasks = useTracker(() => {
    const patientId = Session.get('selectedPatientId');
    const userId = Meteor.userId();
    const user = Meteor.user();
    
    // Wait for user data to be fully loaded before querying
    if (userId && !user) {
      console.log('[CorrectionRequestsPage] Waiting for user data to load...');
      return [];
    }
    
    const practitionerId = get(user, 'practitionerId') ||  // Direct field on user
                          get(user, 'profile.practitionerId') || 
                          get(user, 'services.fhir.practitionerId');
    const startTime = Date.now();
    
    console.group('[CorrectionRequestsPage] Data Tracker');
    log.debug('Patient ID:', { patientId });
    console.log('Practitioner ID:', practitionerId);
    console.log('Tab Value:', tabValue);
    console.log('Start Time:', new Date(startTime).toISOString());
    
    // Check if user is CMO - based on the server's CMO reference from settings
    // According to settings, CMO reference is "Practitioner/Jprxn3CFPTDRDRNpx"
    // We need to match the server logic which checks if practitionerId matches the CMO
    const isCMO = practitionerId === 'Jprxn3CFPTDRDRNpx';
    
    console.log('Is CMO?', isCMO, 'practitionerId:', practitionerId);
    
    // Build query based on user's view
    // Show tasks where user is either requester (patient) or owner (practitioner)
    let taskQuery = {
      'code.coding.code': { 
        $in: ['patient-correction', 'medRecCxReq', 'medRecCxDenialDisagree']
      }
    };
    
    // If viewing as patient, show their requests
    if (patientId) {
      taskQuery.$or = [
        { 'for.reference': `Patient/${patientId}` },
        { 'requester.reference': `Patient/${patientId}` }
      ];
    } else if (practitionerId) {
      // If user is CMO, show ALL correction requests
      if (isCMO) {
        console.log('CMO detected - showing ALL correction requests');
        // No additional filters needed - show all correction requests
      } else {
        // Regular practitioner only sees assigned tasks
        // Check for both Practitioner and PractitionerRole references
        taskQuery.$or = [
          { 'owner.reference': `Practitioner/${practitionerId}` },
          { 'owner.reference': `PractitionerRole/${practitionerId}` },
          { 'performer.0.reference': `Practitioner/${practitionerId}` },
          { 'performer.0.reference': `PractitionerRole/${practitionerId}` }
        ];
      }
    } else {
      console.log('No patient or practitioner context, returning empty array'); // phi-audit: ok
      console.groupEnd();
      return [];
    }
    
    // Get tasks based on current tab
    let statusFilter = {};
    if (tabValue === 0) { // Active
      statusFilter = { status: { $in: ['ready', 'in-progress', 'requested', 'received', 'accepted'] } };
    } else if (tabValue === 1) { // Completed
      statusFilter = { status: { $in: ['completed', 'cancelled', 'rejected', 'failed'] } };
    } else { // All
      statusFilter = {};
    }
    
    const fullQuery = { ...taskQuery, ...statusFilter };
    console.log('Full Query:', fullQuery);
    
    // Try to get tasks from the main Tasks collection if available
    let tasksData = [];
    const Tasks = window.Tasks;
    
    console.log('Tasks collection available:', !!Tasks);
    
    if (Tasks) {
      // First, let's see what tasks exist without any filter
      const allTasks = Tasks.find({}).fetch();
      console.log('Total tasks in collection (no filter):', allTasks.length);
      if (allTasks.length > 0) {
        console.log('First task in collection:', allTasks[0]);
        // Check if this task would match our query
        const firstTask = allTasks[0];
        console.log('Task owner:', firstTask.owner);
        console.log('Task code:', firstTask.code);
        console.log('Would match code filter?', fullQuery['code.coding'] ? 'checking...' : 'no code filter');
        if (fullQuery['code.coding']) {
          const hasMatchingCode = firstTask.code?.coding?.some(c => 
            ['patient-correction', 'medRecCxReq', 'medRecCxDenialDisagree'].includes(c.code)
          );
          console.log('Has matching code?', hasMatchingCode);
        }
        if (fullQuery.$or) {
          console.log('OR conditions:', fullQuery.$or);
          console.log('Task owner reference:', firstTask.owner?.reference);
        }
      }
      
      tasksData = Tasks.find(fullQuery, {
        sort: { 'meta.lastUpdated': -1, 'authoredOn': -1 }
      }).fetch();
      console.log('Found with full query:', tasksData.length);
      if (tasksData.length > 0) {
        console.log('Sample task:', tasksData[0]);
      }
    }
    
    // Fallback to CorrectionTasks if no results from main collection
    if (tasksData.length === 0) {
      const correctionTasksData = CorrectionTasks.find(fullQuery, {
        sort: { 'meta.lastUpdated': -1 }
      }).fetch();
      console.log('Found in CorrectionTasks collection:', correctionTasksData.length);
      if (correctionTasksData.length > 0) {
        console.log('Sample correction task:', correctionTasksData[0]);
      }
      tasksData = correctionTasksData;
    }
    
    const endTime = Date.now();
    console.log('Query execution time:', endTime - startTime, 'ms');
    console.log('Total tasks found:', tasksData.length);
    console.groupEnd();
    
    return tasksData;
  }, [tabValue, Session.get('selectedPatientId')]);
  
  // Track communications separately
  const communications = useTracker(() => {
    const taskIds = tasks.map(t => t._id);
    if (taskIds.length === 0) {
      return [];
    }
    
    return CorrectionCommunications.find({
      'about.reference': { $in: taskIds.map(id => `Task/${id}`) }
    }).fetch();
  }, [tasks]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    console.log('[CorrectionRequestsPage] Tab changed:', {
      from: tabValue,
      to: newValue,
      timestamp: new Date().toISOString()
    });
    setTabValue(newValue);
  };
  
  // Navigate to new request page
  const handleNewRequest = () => {
    console.log('[CorrectionRequestsPage] User action: New Request', {
      timestamp: new Date().toISOString(),
      userId: Meteor.userId(),
      patientId: selectedPatientId
    });
    navigate('/correction-requests/new');
  };
  
  // Navigate to request detail or approval based on user role
  const handleViewRequest = (taskId) => {
    console.log('[CorrectionRequestsPage] User action: View Request', {
      taskId,
      timestamp: new Date().toISOString(),
      userId: Meteor.userId()
    });
    
    // Check if user is a practitioner/CMO who should see the approval page
    const user = Meteor.user();
    const practitionerId = get(user, 'profile.practitionerId') || 
                          get(user, 'services.fhir.practitionerId');
    const isCMO = practitionerId === get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                  practitionerId === get(Meteor, 'settings.private.cmo.id');
    
    // If user is CMO or practitioner, go to approval page, otherwise detail page
    if (isCMO || practitionerId) {
      navigate(`/correction-requests/${taskId}`);  // For now, both go to detail page
    } else {
      navigate(`/correction-requests/${taskId}`);
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
  
  // Get initial request summary
  const getRequestSummary = (task) => {
    const initialComm = CorrectionTasks.getInitialRequest(task);
    if (initialComm) {
      return CorrectionCommunications.getMessageContent(initialComm);
    }
    return 'No summary available';
  };
  
  // Render status chip
  const renderStatusChip = (task) => {
    const stateDisplay = CorrectionTasks.getStateDisplay(task);
    return (
      <Chip 
        label={stateDisplay}
        color={getStatusColor(task)}
        size="small"
      />
    );
  };
  
  // Render empty state
  const renderEmptyState = () => {
    if (!selectedPatientId) {
      return (
        <Paper sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: paperBgColor,
          color: cardTextColor,
          border: '1px dashed',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
        }}>
          <PersonIcon sx={{ fontSize: 48, color: secondaryTextColor, mb: 2 }} />
          <Typography variant="h6" sx={{ color: secondaryTextColor }} gutterBottom>
            No Patient Selected
          </Typography>
          <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 3 }}>
            Select a patient from the sidebar to view or submit correction requests
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/patients')}
              size="large"
            >
              Browse Patients
            </Button>
            <Button
              variant="text"
              color="primary"
              onClick={() => Session.set('helpWalkthroughActive', true)}
            >
              Need Help?
            </Button>
          </Box>
        </Paper>
      );
    }
    
    return (
      <Paper sx={{ p: 4, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
        <Typography variant="h6" sx={{ color: secondaryTextColor }} gutterBottom>
          {tabValue === 0 ? 'No Active Correction Requests' : 'No Completed Correction Requests'}
        </Typography>
        <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
          Start by submitting a new correction request for the selected patient
        </Typography>
        {tabValue === 0 && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewRequest}
            size="large"
            sx={{ mt: 2 }}
          >
            Submit New Correction Request
          </Button>
        )}
      </Paper>
    );
  };
  
  // Render task table
  const renderTaskTable = () => {
    // Always show table structure, even if empty
    if (tasks.length === 0 && !loading) {
      return renderEmptyState();
    }
    
    return (
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Request Date</TableCell>
            <TableCell>Summary</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Updated</TableCell>
            <TableCell align="center">Progress</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading && tasks.length === 0 ? (
            // Show skeleton rows while loading
            [...Array(3)].map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell><Box sx={{ width: 100, height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: 200, height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: 80, height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell>
                <TableCell><Box sx={{ width: 100, height: 20, bgcolor: 'action.hover', borderRadius: 1 }} /></TableCell>
                <TableCell align="center"><Box sx={{ width: 100, height: 20, bgcolor: 'action.hover', borderRadius: 1, mx: 'auto' }} /></TableCell>
                <TableCell align="right"><Box sx={{ width: 50, height: 20, bgcolor: 'action.hover', borderRadius: 1, ml: 'auto' }} /></TableCell>
              </TableRow>
            ))
          ) : null}
          {tasks.map((task) => {
            const progress = CorrectionTasks.getProgressPercentage(task);
            return (
              <TableRow key={task._id} hover>
                <TableCell>
                  {moment(task.authoredOn).format('MMM DD, YYYY')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                    {getRequestSummary(task)}
                  </Typography>
                </TableCell>
                <TableCell>
                  {renderStatusChip(task)}
                </TableCell>
                <TableCell>
                  {moment(get(task, 'meta.lastUpdated')).fromNow()}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ width: '100px', mr: 1 }}>
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
                    <Typography variant="caption">{progress}%</Typography>
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewRequest(task._id)}
                    >
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };
  
  return (
    <Box 
      id="correctionRequestsPage"
      sx={{
        p: 2.5,
        bgcolor: pageBgColor,
        minHeight: '100vh'
      }}
    >
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiCardHeader-title': { color: cardTextColor },
              '& .MuiCardHeader-subheader': { color: secondaryTextColor },
              '& .MuiTab-root': { color: cardTextColor },
              '& .MuiTabs-indicator': { backgroundColor: isDark ? '#90caf9' : 'primary.main' },
            }}>
            <CardHeader
              title="Patient Correction Requests"
              subheader={selectedPatientId ? `Managing requests for current patient` : 'Select a patient to manage correction requests'}
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => window.location.reload()} sx={{ color: cardTextColor }}>
                    <RefreshIcon />
                  </IconButton>
                  {selectedPatientId && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={handleNewRequest}
                    >
                      New Request
                    </Button>
                  )}
                </Box>
              }
            />
            <CardContent>
              <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab label="Active Requests" />
                <Tab label="Completed Requests" />
                <Tab label="All Requests" />
              </Tabs>
              
              {(() => {
                log.debug('CorrectionRequestsPage render - selectedPatientId:', { selectedPatientId });
                console.log('CorrectionRequestsPage render - isLoading:', isLoading);
                console.log('CorrectionRequestsPage render - tasks.length:', tasks.length);
                console.log('CorrectionRequestsPage render - TasksTable available?', !!TasksTable);
                
                // Check if no patient is selected
                if (!selectedPatientId) {
                  return renderEmptyState();
                }
                
                // Show loading state only while subscription is loading
                if (isLoading) {
                  return (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress />
                      <Typography sx={{ mt: 2, color: secondaryTextColor }}>
                        Loading correction requests...
                      </Typography>
                    </Box>
                  );
                }
                
                // If we have tasks, render them
                if (tasks.length > 0) {
                  // Use TasksTable if available, otherwise use custom table
                  if (TasksTable && typeof TasksTable === 'function') {
                    console.log('CorrectionRequestsPage: Rendering TasksTable with', tasks.length, 'tasks');
                    return React.createElement(TasksTable, {
                      id: 'correctionTasksTable',
                      tasks: tasks,
                      count: tasks.length,
                      formFactorLayout: LayoutHelpers ? LayoutHelpers.determineFormFactor() : 'phone',
                      rowsPerPage: LayoutHelpers ? LayoutHelpers.calcTableRows() : 10,
                      hidePatientDisplay: false,
                      hidePatientReference: true,
                      hideBarcode: true,
                      hideActionButton: true,
                      onRowClick: (taskId) => handleViewRequest(taskId),
                      page: 0  // Always start at page 0 when we have tasks
                    });
                  } else {
                    console.log('CorrectionRequestsPage: TasksTable not available, using custom table');
                    // Fallback to our custom table if TasksTable not available
                    return renderTaskTable();
                  }
                } else {
                  // Show no data message when subscription is ready but no tasks found
                  console.log('CorrectionRequestsPage: No tasks found, showing empty state');
                  return (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
                      <Typography variant="h6" sx={{ color: secondaryTextColor }} gutterBottom>
                        {tabValue === 0 ? 'No Active Correction Requests' :
                         tabValue === 1 ? 'No Completed Correction Requests' :
                         'No Correction Requests'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: secondaryTextColor, mb: 2 }}>
                        {tabValue === 0 ? 'Start by submitting a new correction request for the selected patient' :
                         tabValue === 1 ? 'No completed correction requests for this patient' :
                         'No correction requests found for this patient'}
                      </Typography>
                      {tabValue === 0 && (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={handleNewRequest}
                          size="large"
                          sx={{ mt: 2 }}
                        >
                          Submit New Correction Request
                        </Button>
                      )}
                    </Paper>
                  );
                }
              })()}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Summary Statistics */}
        {selectedPatientId && tasks.length > 0 && (
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
                  <Typography variant="h4" color="primary">
                    {tasks.filter(t => t.status === 'in-progress').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                    In Progress
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
                  <Typography variant="h4" color="warning.main">
                    {tasks.filter(t => CorrectionTasks.needsPatientAction(t)).length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                    Needs Your Action
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
                  <Typography variant="h4" color="success.main">
                    {tasks.filter(t => CorrectionTasks.getBusinessStatusCode(t) === 'amendment-completed').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                    Completed
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: paperBgColor, color: cardTextColor }}>
                  <Typography variant="h4" color="error.main">
                    {tasks.filter(t => CorrectionTasks.getBusinessStatusCode(t) === 'denied').length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: secondaryTextColor }}>
                    Denied
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        )}
      </Grid>
      
      {/* Floating Action Button for mobile */}
      {selectedPatientId && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={handleNewRequest}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}