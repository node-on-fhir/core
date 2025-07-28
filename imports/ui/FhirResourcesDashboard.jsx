// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/FhirResourcesDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import moment from 'moment';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';

// Icons
import RefreshIcon from '@mui/icons-material/Refresh';
import FolderIcon from '@mui/icons-material/Folder';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import LinkIcon from '@mui/icons-material/Link';
import ComputerIcon from '@mui/icons-material/Computer';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import FilterListIcon from '@mui/icons-material/FilterList';
import DatasetIcon from '@mui/icons-material/Dataset';

const ResourceRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 24px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child': {
    borderBottom: 'none',
  }
}));

const ResourceName = styled(Box)({
  flex: '0 0 320px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const ServerCountSection = styled(Box)({
  flex: '0 0 120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingRight: '20px',
});

const LocalCountSection = styled(Box)({
  flex: '0 0 120px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingRight: '20px',
});

const ProgressSection = styled(Box)({
  flex: '1',
  display: 'flex',
  alignItems: 'center',
  paddingRight: '20px',
});

const MetadataSection = styled(Box)({
  flex: '0 0 200px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const ActionSection = styled(Box)({
  flex: '0 0 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export function FhirResourcesDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [resourceStats, setResourceStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(moment());
  const [filterMode, setFilterMode] = useState('withData'); // 'all', 'capability', or 'withData'

  // Track Meteor connection status
  const meteorStatus = useTracker(() => {
    return {
      connected: Meteor.status().connected,
      status: Meteor.status().status,
      retryCount: Meteor.status().retryCount || 0,
      retryTime: Meteor.status().retryTime,
      reason: Meteor.status().reason
    };
  });

  // Get server URL
  const serverUrl = Meteor.absoluteUrl();
  const fhirEndpoint = `${serverUrl}fhir-r4`;

  // Define all FHIR resources
  const fhirResources = [
    { name: 'Activity Definitions', route: '/activity-definitions', settingsKey: 'ActivityDefinitions', collection: 'ActivityDefinitions' },
    { name: 'Allergy Intolerances', route: '/allergy-intolerances', settingsKey: 'AllergyIntolerances', collection: 'AllergyIntolerances' },
    { name: 'Artifact Assessments', route: '/artifact-assessments', settingsKey: 'ArtifactAssessments', collection: 'ArtifactAssessments' },
    { name: 'Bundles', route: '/bundles', settingsKey: 'Bundles', collection: 'Bundles' },
    { name: 'Care Plans', route: '/care-plans', settingsKey: 'CarePlans', collection: 'CarePlans' },
    { name: 'Care Teams', route: '/care-teams', settingsKey: 'CareTeams', collection: 'CareTeams' },
    { name: 'Claims', route: '/claims', settingsKey: 'Claims', collection: 'Claims' },
    { name: 'Code Systems', route: '/code-systems', settingsKey: 'CodeSystems', collection: 'CodeSystems' },
    { name: 'Communications', route: '/communications', settingsKey: 'Communications', collection: 'Communications' },
    { name: 'Compositions', route: '/compositions', settingsKey: 'Compositions', collection: 'Compositions' },
    { name: 'Conditions', route: '/conditions', settingsKey: 'Conditions', collection: 'Conditions' },
    { name: 'Devices', route: '/devices', settingsKey: 'Devices', collection: 'Devices' },
    { name: 'Document References', route: '/document-references', settingsKey: 'DocumentReferences', collection: 'DocumentReferences' },
    { name: 'Encounters', route: '/encounters', settingsKey: 'Encounters', collection: 'Encounters' },
    { name: 'Evidences', route: '/evidences', settingsKey: 'Evidences', collection: 'Evidences' },
    { name: 'Goals', route: '/goals', settingsKey: 'Goals', collection: 'Goals' },
    { name: 'Guidance Responses', route: '/guidance-responses', settingsKey: 'GuidanceResponses', collection: 'GuidanceResponses' },
    { name: 'Immunizations', route: '/immunizations', settingsKey: 'Immunizations', collection: 'Immunizations' },
    { name: 'Libraries', route: '/libraries', settingsKey: 'Libraries', collection: 'Libraries' },
    { name: 'Lists', route: '/lists', settingsKey: 'Lists', collection: 'Lists' },
    { name: 'Locations', route: '/locations', settingsKey: 'Locations', collection: 'Locations' },
    { name: 'Medication Administrations', route: '/medication-administrations', settingsKey: 'MedicationAdministrations', collection: 'MedicationAdministrations' },
    { name: 'Medication Requests', route: '/medication-requests', settingsKey: 'MedicationRequests', collection: 'MedicationRequests' },
    { name: 'Medication Statements', route: '/medication-statements', settingsKey: 'MedicationStatements', collection: 'MedicationStatements' },
    { name: 'Medications', route: '/medications', settingsKey: 'Medications', collection: 'Medications' },
    { name: 'Nutrition Orders', route: '/nutrition-orders', settingsKey: 'NutritionOrders', collection: 'NutritionOrders' },
    { name: 'Observations', route: '/observations', settingsKey: 'Observations', collection: 'Observations' },
    { name: 'Operation Outcomes', route: '/operation-outcomes', settingsKey: 'OperationOutcomes', collection: 'OperationOutcomes' },
    { name: 'Patients', route: '/patients', settingsKey: 'Patients', collection: 'Patients' },
    { name: 'Plan Definitions', route: '/plan-definitions', settingsKey: 'PlanDefinitions', collection: 'PlanDefinitions' },
    { name: 'Practitioners', route: '/practitioners', settingsKey: 'Practitioners', collection: 'Practitioners' },
    { name: 'Procedures', route: '/procedures', settingsKey: 'Procedures', collection: 'Procedures' },
    { name: 'Questionnaire Responses', route: '/questionnaire-responses', settingsKey: 'QuestionnaireResponses', collection: 'QuestionnaireResponses' },
    { name: 'Questionnaires', route: '/questionnaires', settingsKey: 'Questionnaires', collection: 'Questionnaires' },
    { name: 'Research Studies', route: '/research-studies', settingsKey: 'ResearchStudies', collection: 'ResearchStudies' },
    { name: 'Research Subjects', route: '/research-subjects', settingsKey: 'ResearchSubjects', collection: 'ResearchSubjects' },
    { name: 'Service Requests', route: '/service-requests', settingsKey: 'ServiceRequests', collection: 'ServiceRequests' },
    { name: 'Tasks', route: '/tasks', settingsKey: 'Tasks', collection: 'Tasks' },
    { name: 'Value Sets', route: '/value-sets', settingsKey: 'ValueSets', collection: 'ValueSets' }
  ];

  // Get capability statement resource types
  const capabilityResourceTypes = get(Meteor, 'settings.public.capabilityStatement.resourceTypes', []);

  // Check if a resource is enabled
  function isResourceEnabled(settingsKey) {
    const alwaysEnabled = ['Practitioners', 'Lists', 'Communications', 'Tasks', 'Patients'];
    if (alwaysEnabled.includes(settingsKey)) {
      return true;
    }
    return get(Meteor, `settings.public.modules.fhir.${settingsKey}`, false);
  }

  // Check if a resource is in capability statement
  function isInCapabilityStatement(collection) {
    // Convert collection name to resource type (remove plural 's')
    const resourceType = collection.replace(/s$/, '');
    return capabilityResourceTypes.includes(resourceType) || capabilityResourceTypes.includes(collection);
  }

  // Filter resources based on mode
  function getFilteredResources() {
    let filtered = fhirResources.filter(r => isResourceEnabled(r.settingsKey));
    
    if (filterMode === 'capability') {
      filtered = filtered.filter(r => isInCapabilityStatement(r.collection));
    } else if (filterMode === 'withData') {
      filtered = filtered.filter(r => {
        const stats = resourceStats[r.collection] || {};
        return (stats.serverCount > 0) || (stats.clientCount > 0);
      });
    }
    
    return filtered;
  }

  // Check if a collection has active pub/sub
  const hasPubSub = useTracker(() => {
    const subscriptions = {};
    // Check for active subscriptions for each collection
    fhirResources.forEach(resource => {
      const subName = resource.collection.toLowerCase();
      // Check common subscription patterns
      const possibleSubs = [
        subName,
        `${subName}.all`,
        `${subName}.public`,
        resource.collection
      ];
      
      subscriptions[resource.collection] = possibleSubs.some(name => {
        const handle = Meteor.subscribe(name, { limit: 0 });
        const isReady = handle.ready();
        handle.stop();
        return isReady;
      });
    });
    return subscriptions;
  }, []);

  // Fetch resource statistics from the server
  const fetchResourceStats = function() {
    setRefreshing(true);
    
    Meteor.call('fhir.getResourceStatistics', function(error, result) {
      if (error) {
        console.error('Error fetching resource statistics:', error);
        setResourceStats({});
      } else {
        console.log('Received resource statistics:', result);
        setResourceStats(result || {});
      }
      setLastRefresh(moment());
      setRefreshing(false);
      setLoading(false);
    });
  };

  useEffect(function() {
    fetchResourceStats();
    
    const interval = setInterval(fetchResourceStats, 30000);
    
    return function() {
      clearInterval(interval);
    };
  }, []);

  // Calculate summary statistics
  const enabledResources = getFilteredResources();
  const totalServerCount = enabledResources.reduce((sum, resource) => {
    const stats = resourceStats[resource.collection] || {};
    return sum + (stats.serverCount || 0);
  }, 0);
  const totalClientCount = enabledResources.reduce((sum, resource) => {
    const stats = resourceStats[resource.collection] || {};
    return sum + (stats.clientCount || 0);
  }, 0);

  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getProgressBar = function(serverCount, maxCount) {
    if (maxCount === 0 || !serverCount) return null;
    
    const percentage = (serverCount / maxCount) * 100;
    
    return (
      <Box sx={{ flex: 1, height: 16, backgroundColor: theme.palette.action.hover, borderRadius: 1, overflow: 'hidden' }}>
        <Box 
          sx={{ 
            height: '100%', 
            width: `${percentage}%`,
            backgroundColor: theme.palette.primary.main,
            transition: 'width 0.3s ease'
          }} 
        />
      </Box>
    );
  };

  const maxServerCount = Math.max(...enabledResources.map(r => resourceStats[r.collection]?.serverCount || 0));

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: theme.palette.background.default }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4">
            FHIR Resources Dashboard
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <ButtonGroup size="small" variant="outlined">
              <Button
                onClick={() => setFilterMode('all')}
                variant={filterMode === 'all' ? 'contained' : 'outlined'}
                startIcon={<AllInclusiveIcon />}
              >
                All Resources
              </Button>
              <Button
                onClick={() => setFilterMode('capability')}
                variant={filterMode === 'capability' ? 'contained' : 'outlined'}
                startIcon={<FilterListIcon />}
              >
                Capability Statement
              </Button>
              <Button
                onClick={() => setFilterMode('withData')}
                variant={filterMode === 'withData' ? 'contained' : 'outlined'}
                startIcon={<DatasetIcon />}
              >
                Resources With Data
              </Button>
            </ButtonGroup>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={meteorStatus.connected ? <WifiIcon /> : <WifiOffIcon />}
                label={meteorStatus.connected ? 'Connected' : 'Disconnected'}
                color={meteorStatus.connected ? 'success' : 'error'}
                size="small"
              />
              <Tooltip title={`Last refresh: ${lastRefresh.fromNow()}`}>
                <IconButton onClick={fetchResourceStats} disabled={refreshing} size="small">
                  <RefreshIcon className={refreshing ? 'rotating' : ''} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        
        {/* Server Info and Summary Stats */}
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {fhirEndpoint}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StorageIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {enabledResources.length} resources
              {filterMode === 'capability' && ` (${capabilityResourceTypes.length} in capability statement)`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {totalServerCount.toLocaleString()} server docs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ComputerIcon fontSize="small" color="action" />
            <Typography variant="body2" color="textSecondary">
              {totalClientCount.toLocaleString()} local docs
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Paper sx={{ m: 3, borderRadius: 2 }}>
          {/* List Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: '12px 24px', 
            borderBottom: `2px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.default,
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}>
            <ResourceName>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Resource Type
              </Typography>
            </ResourceName>
            <ServerCountSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Server
              </Typography>
            </ServerCountSection>
            <LocalCountSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Local
              </Typography>
            </LocalCountSection>
            <ProgressSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Size
              </Typography>
            </ProgressSection>
            <MetadataSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                Info
              </Typography>
            </MetadataSection>
            <ActionSection />
          </Box>

          {/* Resource List */}
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 2, maxWidth: 200, mx: 'auto' }} />
              <Typography variant="body2" color="textSecondary">Loading resources...</Typography>
            </Box>
          ) : enabledResources.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                No resources found{filterMode === 'capability' ? ' in capability statement' : filterMode === 'withData' ? ' with data' : ''}.
              </Typography>
            </Box>
          ) : (
            enabledResources.map(resource => {
              const stats = resourceStats[resource.collection] || {};
              const serverCount = stats.serverCount || 0;
              const clientCount = stats.clientCount || 0;
              const isDisabled = !serverCount && !clientCount;
              const hasActivePubSub = hasPubSub[resource.collection];
              
              return (
                <ResourceRow
                  key={resource.route}
                  onClick={() => !isDisabled && navigate(resource.route)}
                  sx={{ 
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'default' : 'pointer',
                    '&:hover': isDisabled ? {} : {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <ResourceName>
                    <FolderIcon fontSize="small" sx={{ color: theme.palette.action.active }} />
                    <Typography variant="body1">
                      {resource.name}
                    </Typography>
                    {hasActivePubSub && (
                      <Tooltip title="Active pub/sub subscription">
                        <RssFeedIcon fontSize="small" color="success" />
                      </Tooltip>
                    )}
                  </ResourceName>
                  
                  <ServerCountSection>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatCount(serverCount)}
                    </Typography>
                  </ServerCountSection>
                  
                  <LocalCountSection>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: theme.palette.text.secondary }}>
                      {formatCount(clientCount)}
                    </Typography>
                  </LocalCountSection>
                  
                  <ProgressSection>
                    {getProgressBar(serverCount, maxServerCount)}
                  </ProgressSection>
                  
                  <MetadataSection>
                    {stats.indices && stats.indices.length > 0 && (
                      <Chip 
                        size="small" 
                        label={`${stats.indices.length} indices`} 
                        variant="outlined"
                      />
                    )}
                    {stats.lastModified && (
                      <Typography variant="caption" color="textSecondary">
                        {moment(stats.lastModified).fromNow()}
                      </Typography>
                    )}
                  </MetadataSection>
                  
                  <ActionSection>
                    {!isDisabled && (
                      <NavigateNextIcon fontSize="small" sx={{ color: theme.palette.action.active }} />
                    )}
                  </ActionSection>
                </ResourceRow>
              );
            })
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default FhirResourcesDashboard;