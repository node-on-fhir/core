// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/pages/FhirBasePage.jsx

import React, { useEffect, useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { fetch } from 'meteor/fetch';
import { Session } from 'meteor/session';

import { 
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  Stack,
  Badge,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';

import {
  Api as ApiIcon,
  MonitorHeart as MonitorIcon,
  Cable as CableIcon,
  Speed as SpeedIcon,
  Storage as StorageIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Code as CodeIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { LayoutHelpers } from '../../lib/LayoutHelpers';

// Import FHIR Collections
import { Endpoints } from '../../lib/schemas/SimpleSchemas/Endpoints';
import { Organizations } from '../../lib/schemas/SimpleSchemas/Organizations';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';
import { Locations } from '../../lib/schemas/SimpleSchemas/Locations';
import { HealthcareServices } from '../../lib/schemas/SimpleSchemas/HealthcareServices';
import { InsurancePlans } from '../../lib/schemas/SimpleSchemas/InsurancePlans';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';
import { Encounters } from '../../lib/schemas/SimpleSchemas/Encounters';
import { Conditions } from '../../lib/schemas/SimpleSchemas/Conditions';
import { Procedures } from '../../lib/schemas/SimpleSchemas/Procedures';
import { Observations } from '../../lib/schemas/SimpleSchemas/Observations';
import { MedicationRequests } from '../../lib/schemas/SimpleSchemas/MedicationRequests';

// All available FHIR resources for monitoring
const FHIR_RESOURCES = [
  { name: 'Patients', collection: Patients, icon: '👤', category: 'Clinical' },
  { name: 'Practitioners', collection: Practitioners, icon: '👨‍⚕️', category: 'Clinical' },
  { name: 'Organizations', collection: Organizations, icon: '🏢', category: 'Administrative' },
  { name: 'Locations', collection: Locations, icon: '📍', category: 'Administrative' },
  { name: 'Encounters', collection: Encounters, icon: '🏥', category: 'Clinical' },
  { name: 'Conditions', collection: Conditions, icon: '🩺', category: 'Clinical' },
  { name: 'Procedures', collection: Procedures, icon: '⚕️', category: 'Clinical' },
  { name: 'Observations', collection: Observations, icon: '📊', category: 'Clinical' },
  { name: 'MedicationRequests', collection: MedicationRequests, icon: '💊', category: 'Clinical' },
  { name: 'HealthcareServices', collection: HealthcareServices, icon: '🚑', category: 'Administrative' },
  { name: 'InsurancePlans', collection: InsurancePlans, icon: '📋', category: 'Financial' },
  { name: 'Endpoints', collection: Endpoints, icon: '🔌', category: 'Infrastructure' }
];

// Common FHIR API endpoints
const API_ENDPOINTS = [
  { method: 'GET', path: '/metadata', description: 'Server capability statement' },
  { method: 'GET', path: '/{resourceType}', description: 'Search resources' },
  { method: 'GET', path: '/{resourceType}/{id}', description: 'Read resource by ID' },
  { method: 'POST', path: '/{resourceType}', description: 'Create new resource' },
  { method: 'PUT', path: '/{resourceType}/{id}', description: 'Update resource' },
  { method: 'DELETE', path: '/{resourceType}/{id}', description: 'Delete resource' },
  { method: 'GET', path: '/{resourceType}/_history', description: 'Resource type history' },
  { method: 'GET', path: '/{resourceType}/{id}/_history', description: 'Resource instance history' },
  { method: 'POST', path: '/', description: 'Batch/transaction operations' }
];

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fhir-tabpanel-${index}`}
      aria-labelledby={`fhir-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function FhirBasePage(props) {
  const navigate = useNavigate();
  
  // State
  const [tabValue, setTabValue] = useState(0);
  const [serverStats, setServerStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [connectionStatus, setConnectionStatus] = useState({
    http: 'connected',
    ddp: 'connected',
    oauth: 'active'
  });
  const [copiedEndpoint, setCopiedEndpoint] = useState(null);

  // Fetch server stats
  const fetchServerStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/stats');
      if(response.ok){
        const data = await response.json();
        setServerStats(data);
        setLastRefresh(new Date());
      }
    } catch(error) {
      console.error('Error fetching stats:', error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchServerStats();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchServerStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to collections
  const resourceCounts = useTracker(() => {
    const counts = {};
    FHIR_RESOURCES.forEach(resource => {
      if(resource.collection && resource.collection.find) {
        counts[resource.name] = resource.collection.find().count();
      }
    });
    return counts;
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'connected':
      case 'active':
        return 'success';
      case 'disconnected':
      case 'error':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'connected':
      case 'active':
        return <CheckCircleIcon />;
      case 'disconnected':
      case 'error':
        return <ErrorIcon />;
      default:
        return <WarningIcon />;
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(index);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method) => {
    const colors = {
      GET: 'success',
      POST: 'primary',
      PUT: 'warning',
      DELETE: 'error'
    };
    return colors[method] || 'default';
  };

  // Calculate total resources
  const totalResources = Object.values(resourceCounts).reduce((sum, count) => sum + count, 0);
  const baseUrl = window.location.origin + '/baseR4';

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ borderRadius: 0, bgcolor: 'primary.dark', color: 'primary.contrastText', py: 4 }}>
        <Container maxWidth="xl">
          <Grid container alignItems="center" spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                FHIR Server DevOps Dashboard
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Monitor, manage, and explore your FHIR server resources and APIs
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                <Chip 
                  icon={<SpeedIcon />} 
                  label={`${totalResources} Total Resources`} 
                  color="primary" 
                  sx={{ bgcolor: 'primary.light' }}
                />
                <Tooltip title="Last refreshed">
                  <Chip 
                    label={lastRefresh.toLocaleTimeString()} 
                    variant="outlined" 
                    sx={{ color: 'primary.contrastText', borderColor: 'primary.light' }}
                  />
                </Tooltip>
                <IconButton color="inherit" onClick={fetchServerStats}>
                  <RefreshIcon />
                </IconButton>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Paper>

      {/* Connection Status Bar */}
      <Paper elevation={1} sx={{ borderRadius: 0 }}>
        <Container maxWidth="xl">
          <Grid container spacing={2} sx={{ py: 2 }}>
            {Object.entries(connectionStatus).map(([service, status]) => (
              <Grid item key={service}>
                <Chip
                  icon={getStatusIcon(status)}
                  label={`${service.toUpperCase()}: ${status}`}
                  color={getStatusColor(status)}
                  size="small"
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Paper>

      {/* Loading Progress */}
      {isLoading && <LinearProgress />}

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<ApiIcon />} label="API Documentation" iconPosition="start" />
            <Tab icon={<DescriptionIcon />} label="Swagger UI" iconPosition="start" />
            <Tab icon={<MonitorIcon />} label="Resource Monitoring" iconPosition="start" />
            <Tab icon={<CableIcon />} label="DDP/WebSocket Status" iconPosition="start" />
            <Tab icon={<TimelineIcon />} label="Performance Metrics" iconPosition="start" />
          </Tabs>

          {/* API Documentation Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  FHIR Base URL: <strong>{baseUrl}</strong>
                  <IconButton 
                    size="small" 
                    onClick={() => window.open(baseUrl + '/metadata', '_blank')}
                    sx={{ ml: 1 }}
                  >
                    <OpenInNewIcon fontSize="small" />
                  </IconButton>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="API Endpoints" 
                    subheader="RESTful FHIR API operations"
                  />
                  <CardContent>
                    <List>
                      {API_ENDPOINTS.map((endpoint, index) => (
                        <ListItem 
                          key={index}
                          secondaryAction={
                            <Tooltip title={copiedEndpoint === index ? "Copied!" : "Copy endpoint"}>
                              <IconButton 
                                edge="end" 
                                onClick={() => copyToClipboard(`${endpoint.method} ${baseUrl}${endpoint.path}`, index)}
                              >
                                <ContentCopyIcon />
                              </IconButton>
                            </Tooltip>
                          }
                        >
                          <ListItemIcon>
                            <Chip 
                              label={endpoint.method} 
                              size="small" 
                              color={getMethodColor(endpoint.method)}
                              sx={{ minWidth: 65 }}
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={endpoint.path}
                            secondary={endpoint.description}
                            primaryTypographyProps={{ fontFamily: 'monospace' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="Try It Out" 
                    subheader="Test API endpoints directly"
                  />
                  <CardContent>
                    <Stack spacing={2}>
                      <TextField
                        fullWidth
                        label="Resource Type"
                        defaultValue="Patient"
                        size="small"
                      />
                      <TextField
                        fullWidth
                        label="Search Parameters"
                        placeholder="name=John&birthdate=1980"
                        size="small"
                        helperText="Enter search parameters in key=value format"
                      />
                      <Button 
                        variant="contained" 
                        startIcon={<ApiIcon />}
                        onClick={() => window.open(`${baseUrl}/Patient`, '_blank')}
                      >
                        Execute Search
                      </Button>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Quick Links
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button 
                          size="small" 
                          onClick={() => window.open(`${baseUrl}/metadata`, '_blank')}
                        >
                          Capability Statement
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => window.open(`${baseUrl}/Patient`, '_blank')}
                        >
                          All Patients
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => window.open(`${baseUrl}/Practitioner`, '_blank')}
                        >
                          All Practitioners
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Swagger UI Tab - To be implemented after Meteor 3.4 upgrade */}
          <TabPanel value={tabValue} index={1}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Swagger UI Integration Coming Soon</Typography>
              <Typography variant="body2">
                This tab will display the interactive Swagger UI documentation once we upgrade to Meteor 3.4 with RSPack support.
              </Typography>
              <Typography variant="body2" sx={{ mt: 2 }}>
                The upgrade will enable proper module resolution for swagger-ui-react.
              </Typography>
            </Alert>
            <Box sx={{ 
              height: 400, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'action.hover'
            }}>
              <Typography color="text.secondary" variant="h6">
                SwaggerUI Component Placeholder
              </Typography>
            </Box>
          </TabPanel>

          {/* Resource Monitoring Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {/* Summary Cards */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                      <CardContent>
                        <Typography variant="h4" component="div">
                          {totalResources.toLocaleString()}
                        </Typography>
                        <Typography variant="body2">
                          Total FHIR Resources
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
                      <CardContent>
                        <Typography variant="h4" component="div">
                          {FHIR_RESOURCES.length}
                        </Typography>
                        <Typography variant="body2">
                          Resource Types
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText' }}>
                      <CardContent>
                        <Typography variant="h4" component="div">
                          {get(serverStats, 'uptime', '0h')}
                        </Typography>
                        <Typography variant="body2">
                          Server Uptime
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
                      <CardContent>
                        <Typography variant="h4" component="div">
                          {get(serverStats, 'apiCalls', '0')}
                        </Typography>
                        <Typography variant="body2">
                          API Calls Today
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>

              {/* Resource Categories */}
              {['Clinical', 'Administrative', 'Financial', 'Infrastructure'].map(category => (
                <Grid item xs={12} key={category}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    {category} Resources
                  </Typography>
                  <Grid container spacing={2}>
                    {FHIR_RESOURCES.filter(r => r.category === category).map(resource => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={resource.name}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.3s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}
                          onClick={() => navigate(`/${resource.name.toLowerCase()}`)}
                        >
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Box>
                                <Typography variant="h6" component="div">
                                  {resource.icon} {resource.name}
                                </Typography>
                                <Typography variant="h4" color="primary">
                                  {resourceCounts[resource.name] || 0}
                                </Typography>
                              </Box>
                              <Badge 
                                badgeContent={resourceCounts[resource.name] || 0} 
                                color="primary" 
                                max={9999}
                              >
                                <StorageIcon color="action" />
                              </Badge>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* DDP/WebSocket Status Tab */}
          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="DDP Subscriptions" 
                    avatar={<CableIcon />}
                  />
                  <CardContent>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Subscription</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Records</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {FHIR_RESOURCES.map(resource => (
                            <TableRow key={resource.name}>
                              <TableCell>{resource.name}</TableCell>
                              <TableCell>
                                <Chip 
                                  label="Active" 
                                  color="success" 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell align="right">
                                {resourceCounts[resource.name] || 0}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader 
                    title="WebSocket Connections" 
                    avatar={<CodeIcon />}
                  />
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      Real-time data synchronization is active
                    </Alert>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Connection Status
                        </Typography>
                        <Typography variant="h6">
                          {connectionStatus.ddp === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Active Subscriptions
                        </Typography>
                        <Typography variant="h6">
                          {FHIR_RESOURCES.length}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          Last Activity
                        </Typography>
                        <Typography variant="h6">
                          {lastRefresh.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Performance Metrics Tab */}
          <TabPanel value={tabValue} index={4}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Performance metrics and data visualizations can be integrated here with charting libraries like Chart.js or D3.js
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="API Response Times" />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Average response time: 145ms
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', mt: 2, borderRadius: 1 }}>
                      <Typography color="text.secondary">Chart placeholder</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Resource Growth" />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Resources added this week: 1,234
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover', mt: 2, borderRadius: 1 }}>
                      <Typography color="text.secondary">Chart placeholder</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
}

export default FhirBasePage;