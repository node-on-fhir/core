// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/FhirResourcesIndex.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { DDP } from 'meteor/ddp-client';

import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import { useTheme } from '@mui/material/styles';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import LinearProgress from '@mui/material/LinearProgress';

// Icons for status indicators
import ApiIcon from '@mui/icons-material/Api';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import StarIcon from '@mui/icons-material/Star';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

export function FhirResourcesIndex() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [loadingStats, setLoadingStats] = useState({});
  const [subscriptionStats, setSubscriptionStats] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  
  // Track system configuration
  const systemConfig = useTracker(() => {
    return {
      autopublishEnabled: get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false),
      fhirAutoSubscribe: get(Meteor, 'settings.public.fhirAutoSubscribe', false),
      environment: get(Meteor, 'settings.public.environment', 'development'),
      fhirPath: get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4'),
      ddpConnected: Meteor.status().connected,
      ddpStatus: Meteor.status().status,
      userId: Meteor.userId(),
      userLoggedIn: !!Meteor.userId()
    };
  }, []);

  // Track active subscriptions
  const activeSubscriptions = useTracker(() => {
    const subs = [];
    if (typeof DDP !== 'undefined' && DDP._allSubscriptionsReady) {
      Object.keys(DDP._allSubscriptionsReady()).forEach(id => {
        const sub = Meteor.connection._subscriptions[id];
        if (sub && sub.name) {
          subs.push({
            id: id,
            name: sub.name,
            params: sub.params,
            ready: sub.ready
          });
        }
      });
    }
    return subs;
  }, []);
  
  // Performance monitoring
  useEffect(() => {
    const startTime = performance.now();
    console.log('FhirResourcesIndex mounted at:', new Date().toISOString());
    
    // Monitor page load performance
    const checkPerformance = () => {
      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({
        ...prev,
        pageLoadTime: Math.round(loadTime),
        timestamp: new Date().toISOString()
      }));
      
      // Check MongoDB collections
      const collections = {};
      Object.keys(window).forEach(key => {
        if (key.endsWith('s') && window[key] && window[key]._collection) {
          try {
            collections[key] = window[key].find().count();
          } catch(e) {
            collections[key] = 'N/A';
          }
        }
      });
      setPerformanceMetrics(prev => ({
        ...prev,
        collections: collections
      }));
    };
    
    // Check after initial render
    setTimeout(checkPerformance, 100);
    
    return () => {
      console.log('FhirResourcesIndex unmounted at:', new Date().toISOString());
    };
  }, []);

  // Define all FHIR resources with their routes and display names
  const fhirResources = [
    { name: 'Activity Definitions', route: '/activity-definitions', settingsKey: 'ActivityDefinitions' },
    { name: 'Allergy Intolerances', route: '/allergy-intolerances', settingsKey: 'AllergyIntolerances' },
    { name: 'Artifact Assessments', route: '/artifact-assessments', settingsKey: 'ArtifactAssessments' },
    { name: 'Bundles', route: '/bundles', settingsKey: 'Bundles' },
    { name: 'Care Plans', route: '/care-plans', settingsKey: 'CarePlans' },
    { name: 'Care Teams', route: '/care-teams', settingsKey: 'CareTeams' },
    { name: 'Claims', route: '/claims', settingsKey: 'Claims' },
    { name: 'Code Systems', route: '/code-systems', settingsKey: 'CodeSystems' },
    { name: 'Communications', route: '/communications', settingsKey: 'Communications' },
    { name: 'Compositions', route: '/compositions', settingsKey: 'Compositions' },
    { name: 'Conditions', route: '/conditions', settingsKey: 'Conditions' },
    { name: 'Devices', route: '/devices', settingsKey: 'Devices' },
    { name: 'Document References', route: '/document-references', settingsKey: 'DocumentReferences' },
    { name: 'Encounters', route: '/encounters', settingsKey: 'Encounters' },
    { name: 'Evidences', route: '/evidences', settingsKey: 'Evidences' },
    { name: 'Goals', route: '/goals', settingsKey: 'Goals' },
    { name: 'Guidance Responses', route: '/guidance-responses', settingsKey: 'GuidanceResponses' },
    { name: 'Immunizations', route: '/immunizations', settingsKey: 'Immunizations' },
    { name: 'Libraries', route: '/libraries', settingsKey: 'Libraries' },
    { name: 'Lists', route: '/lists', settingsKey: 'Lists' },
    { name: 'Locations', route: '/locations', settingsKey: 'Locations' },
    { name: 'Medication Administrations', route: '/medication-administrations', settingsKey: 'MedicationAdministrations' },
    { name: 'Medication Requests', route: '/medication-requests', settingsKey: 'MedicationRequests' },
    { name: 'Medication Statements', route: '/medication-statements', settingsKey: 'MedicationStatements' },
    { name: 'Medications', route: '/medications', settingsKey: 'Medications' },
    { name: 'Nutrition Orders', route: '/nutrition-orders', settingsKey: 'NutritionOrders' },
    { name: 'Observations', route: '/observations', settingsKey: 'Observations' },
    { name: 'Operation Outcomes', route: '/operation-outcomes', settingsKey: 'OperationOutcomes' },
    { name: 'Patients', route: '/patients', settingsKey: 'Patients' },
    { name: 'Plan Definitions', route: '/plan-definitions', settingsKey: 'PlanDefinitions' },
    { name: 'Practitioners', route: '/practitioners', settingsKey: 'Practitioners' },
    { name: 'Procedures', route: '/procedures', settingsKey: 'Procedures' },
    { name: 'Questionnaire Responses', route: '/questionnaire-responses', settingsKey: 'QuestionnaireResponses' },
    { name: 'Questionnaires', route: '/questionnaires', settingsKey: 'Questionnaires' },
    { name: 'Research Studies', route: '/research-studies', settingsKey: 'ResearchStudies' },
    { name: 'Research Subjects', route: '/research-subjects', settingsKey: 'ResearchSubjects' },
    { name: 'Risk Assessments', route: '/risk-assessments', settingsKey: 'RiskAssessments' },
    { name: 'Service Requests', route: '/service-requests', settingsKey: 'ServiceRequests' },
    { name: 'Tasks', route: '/tasks', settingsKey: 'Tasks' },
    { name: 'Value Sets', route: '/value-sets', settingsKey: 'ValueSets' }
  ];

  // Group resources alphabetically
  const groupedResources = fhirResources.reduce((acc, resource) => {
    const firstLetter = resource.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(resource);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedResources).sort();

  function handleResourceClick(route) {
    navigate(route);
  }

  // Check if a resource is enabled based on settings
  function isResourceEnabled(settingsKey) {
    // Always show these core resources
    const alwaysEnabled = ['Practitioners', 'Lists', 'Communications', 'Tasks'];
    if (alwaysEnabled.includes(settingsKey)) {
      return true;
    }
    
    // Check settings for other resources
    return get(Meteor, `settings.public.modules.fhir.${settingsKey}`, false);
  }

  // Check if resource is in CapabilityStatement
  function isInCapabilityStatement(resourceName) {
    const capabilityResources = get(Meteor, 'settings.public.capabilityStatement.resourceTypes', []);
    // Remove plural 's' and spaces for comparison
    const normalizedName = resourceName.replace(/s$/, '').replace(/\s+/g, '');
    return capabilityResources.some(r => 
      r.toLowerCase().replace(/s$/, '') === normalizedName.toLowerCase()
    );
  }

  // Check if REST endpoint is enabled
  function hasRestEndpoint(settingsKey) {
    const resourceKey = settingsKey.replace(/s$/, ''); // Remove plural
    const restConfig = get(Meteor, `settings.private.fhir.rest.${resourceKey}`, {});
    return restConfig.interactions && restConfig.interactions.length > 0;
  }

  // Check if DDP publication is enabled
  function hasDDPPublication(settingsKey) {
    const resourceKey = settingsKey.replace(/s$/, ''); // Remove plural
    const restConfig = get(Meteor, `settings.private.fhir.rest.${resourceKey}`, {});
    return restConfig.publication === true;
  }

  // Check collection status
  function getCollectionStatus(settingsKey) {
    try {
      if (window[settingsKey] && window[settingsKey]._collection) {
        const count = window[settingsKey].find().count();
        return { exists: true, count: count };
      }
    } catch(e) {
      console.log(`Error checking collection ${settingsKey}:`, e);
    }
    return { exists: false, count: 0 };
  }

  // Get subscription status for a resource
  function getSubscriptionStatus(settingsKey) {
    const resourceSubs = activeSubscriptions.filter(sub => 
      sub.name.toLowerCase().includes(settingsKey.toLowerCase())
    );
    return {
      active: resourceSubs.length > 0,
      count: resourceSubs.length,
      ready: resourceSubs.every(s => s.ready)
    };
  }

  // Refresh page data
  function handleRefresh() {
    window.location.reload();
  }

  return (
    <Box sx={{
      padding: 3,
      height: '100vh',
      overflow: 'auto'
    }}>
      {/* Header with title and refresh */}
      <Card sx={{ mb: 3, boxShadow: 0, bgcolor: 'transparent' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              FHIR Resources Dashboard
            </Typography>
            <Typography variant="body1" color="textSecondary">
              System diagnostics and resource management
            </Typography>
          </Box>
          <Tooltip title="Refresh dashboard">
            <IconButton 
              onClick={handleRefresh} 
              size="large"
              sx={{ 
                bgcolor: theme => theme.palette.background.paper,
                boxShadow: 1,
                '&:hover': {
                  boxShadow: 2
                }
              }}
              aria-label="Refresh dashboard"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Card>

      {/* System Status Alerts */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {systemConfig.autopublishEnabled && (
          <Alert severity="warning" icon={<WarningIcon />}>
            <AlertTitle>Autopublish Enabled</AlertTitle>
            Autopublish subscriptions are enabled. This may impact performance in production.
            <Chip label="Development Mode" size="small" sx={{ ml: 2 }} />
          </Alert>
        )}
        
        {!systemConfig.ddpConnected && (
          <Alert severity="error" icon={<WifiOffIcon />}>
            <AlertTitle>DDP Disconnected</AlertTitle>
            Connection to server lost. Status: {systemConfig.ddpStatus}
          </Alert>
        )}
        
        {systemConfig.environment === 'production' && (
          <Alert severity="info">
            <AlertTitle>Production Environment</AlertTitle>
            Running in production mode. Some development features are disabled.
          </Alert>
        )}
        
        {performanceMetrics.pageLoadTime > 5000 && (
          <Alert severity="warning">
            <AlertTitle>Slow Page Load Detected</AlertTitle>
            Page took {(performanceMetrics.pageLoadTime / 1000).toFixed(2)} seconds to load.
            {activeSubscriptions.length > 10 && ` (${activeSubscriptions.length} active subscriptions)`}
          </Alert>
        )}
      </Stack>

      {/* Connection Status Bar */}
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>System Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                {systemConfig.ddpConnected ? <WifiIcon color="success" /> : <WifiOffIcon color="error" />}
                <Box>
                  <Typography variant="caption" color="textSecondary">DDP Connection</Typography>
                  <Typography variant="body2">{systemConfig.ddpStatus}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CloudSyncIcon color={activeSubscriptions.length > 0 ? "primary" : "disabled"} />
                <Box>
                  <Typography variant="caption" color="textSecondary">Active Subscriptions</Typography>
                  <Typography variant="body2">{activeSubscriptions.length}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ApiIcon color={systemConfig.fhirPath ? "primary" : "disabled"} />
                <Box>
                  <Typography variant="caption" color="textSecondary">FHIR Endpoint</Typography>
                  <Typography variant="body2">/{systemConfig.fhirPath || 'Not configured'}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stack direction="row" spacing={1} alignItems="center">
                <StorageIcon color="primary" />
                <Box>
                  <Typography variant="caption" color="textSecondary">Environment</Typography>
                  <Typography variant="body2">{systemConfig.environment}</Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
        FHIR Resources
      </Typography>

      <Grid container spacing={3}>
        {sortedLetters.map(letter => (
          <Grid item xs={12} key={letter}>
            <Typography variant="h6" gutterBottom style={{ marginTop: '20px' }}>
              {letter}
            </Typography>
            <Grid container spacing={2}>
              {groupedResources[letter].map(resource => {
                const isEnabled = isResourceEnabled(resource.settingsKey);
                const inCapabilityStatement = isInCapabilityStatement(resource.name);
                const hasRest = hasRestEndpoint(resource.settingsKey);
                const hasDDP = hasDDPPublication(resource.settingsKey);
                const collectionStatus = getCollectionStatus(resource.settingsKey);
                const subStatus = getSubscriptionStatus(resource.settingsKey);
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={resource.route}>
                    <Card 
                      sx={{ 
                        opacity: isEnabled ? 1 : 0.6,
                        cursor: isEnabled ? 'pointer' : 'not-allowed',
                        position: 'relative',
                        boxShadow: isEnabled ? 1 : 0,
                        transition: 'all 0.3s ease',
                        bgcolor: theme => theme.palette.background.paper,
                        '&:hover': isEnabled ? {
                          boxShadow: 4,
                          transform: 'translateY(-2px)'
                        } : {}
                      }}
                    >
                      <CardActionArea 
                        onClick={() => isEnabled && handleResourceClick(resource.route)}
                        disabled={!isEnabled}
                      >
                        <CardContent>
                          {/* Resource name with capability star */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body1">
                              {resource.name}
                            </Typography>
                            {inCapabilityStatement && (
                              <Tooltip title="In CapabilityStatement">
                                <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
                              </Tooltip>
                            )}
                          </Box>
                          
                          {/* Status indicators */}
                          <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                            {hasRest && (
                              <Tooltip title="REST API Enabled">
                                <Chip 
                                  icon={<ApiIcon />} 
                                  label="REST" 
                                  size="small" 
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Tooltip>
                            )}
                            {hasDDP && (
                              <Tooltip title="DDP Publication Enabled">
                                <Chip 
                                  icon={<CloudSyncIcon />} 
                                  label="DDP" 
                                  size="small" 
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Tooltip>
                            )}
                            {subStatus.active && (
                              <Tooltip title={`${subStatus.count} active subscription(s)`}>
                                <Chip 
                                  icon={<WifiIcon />} 
                                  label={subStatus.count} 
                                  size="small" 
                                  color={subStatus.ready ? "success" : "warning"}
                                  variant="filled"
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Tooltip>
                            )}
                          </Stack>
                          
                          {/* Collection status */}
                          {collectionStatus.exists ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="caption" color="textSecondary">
                                {collectionStatus.count} records
                              </Typography>
                              <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
                            </Box>
                          ) : (
                            !isEnabled && (
                              <Typography variant="caption" color="textSecondary">
                                Not enabled
                              </Typography>
                            )
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        ))}
      </Grid>

      {/* DDP Subscriptions Card */}
      <Card sx={{ mt: 4, mb: 2, boxShadow: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active DDP Subscriptions
            <Chip label={activeSubscriptions.length} size="small" sx={{ ml: 2 }} />
          </Typography>
          
          {activeSubscriptions.length > 0 ? (
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Grid container spacing={1}>
                {activeSubscriptions.map((sub, index) => (
                  <Grid item xs={12} sm={6} md={4} key={sub.id}>
                    <Card variant="outlined" sx={{ p: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" noWrap>
                            {sub.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {sub.params && sub.params.length > 0 ? 
                              `Params: ${JSON.stringify(sub.params).slice(0, 50)}...` : 
                              'No parameters'}
                          </Typography>
                        </Box>
                        {sub.ready ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CircularProgress size={16} />
                        )}
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No active subscriptions
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics Card */}
      {performanceMetrics.pageLoadTime && (
        <Card sx={{ mb: 2, boxShadow: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Page Load Time</Typography>
                <Typography variant="body1">
                  {(performanceMetrics.pageLoadTime / 1000).toFixed(2)}s
                </Typography>
                {performanceMetrics.pageLoadTime > 3000 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, (performanceMetrics.pageLoadTime / 10000) * 100)}
                    color={performanceMetrics.pageLoadTime > 5000 ? "error" : "warning"}
                  />
                )}
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Collections Loaded</Typography>
                <Typography variant="body1">
                  {Object.keys(performanceMetrics.collections || {}).length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="textSecondary">Last Updated</Typography>
                <Typography variant="body1">
                  {performanceMetrics.timestamp ? 
                    new Date(performanceMetrics.timestamp).toLocaleTimeString() : 
                    'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <Card sx={{ mb: 2, boxShadow: 1 }}>
        <CardContent>
          <Typography variant="subtitle2" gutterBottom>Legend</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Stack direction="row" spacing={0.5} alignItems="center">
              <StarIcon sx={{ fontSize: 16, color: 'gold' }} />
              <Typography variant="caption">In CapabilityStatement</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <ApiIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">REST API Enabled</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CloudSyncIcon sx={{ fontSize: 16 }} />
              <Typography variant="caption">DDP Publication</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <WifiIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption">Active Subscription</Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main' }} />
              <Typography variant="caption">Collection Available</Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default FhirResourcesIndex;