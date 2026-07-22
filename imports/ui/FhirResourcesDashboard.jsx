// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/FhirResourcesDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
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
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import { DDP } from 'meteor/ddp-client';

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
import ApiIcon from '@mui/icons-material/Api';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import StarIcon from '@mui/icons-material/Star';
import WarningIcon from '@mui/icons-material/Warning';

// Import FHIR collections
import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { ArtifactAssessments } from '/imports/lib/schemas/SimpleSchemas/ArtifactAssessments';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Claims } from '/imports/lib/schemas/SimpleSchemas/Claims';
import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { GuidanceResponses } from '/imports/lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Libraries } from '/imports/lib/schemas/SimpleSchemas/Libraries';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { OperationOutcomes } from '/imports/lib/schemas/SimpleSchemas/OperationOutcomes';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

const log = (Meteor.Logger ? Meteor.Logger.for('FhirResourcesDashboard') : console);

// Map collection names to actual collection objects
const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
  'ArtifactAssessments': ArtifactAssessments,
  'Bundles': Bundles,
  'CarePlans': CarePlans,
  'CareTeams': CareTeams,
  'Claims': Claims,
  'CodeSystems': CodeSystems,
  'Communications': Communications,
  'Compositions': Compositions,
  'Conditions': Conditions,
  'Consents': Consents,
  'Devices': Devices,
  'DiagnosticReports': DiagnosticReports,
  'DocumentReferences': DocumentReferences,
  'Encounters': Encounters,
  'Evidences': Evidences,
  'Goals': Goals,
  'GuidanceResponses': GuidanceResponses,
  'Immunizations': Immunizations,
  'Libraries': Libraries,
  'Lists': Lists,
  'Locations': Locations,
  'MedicationAdministrations': MedicationAdministrations,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'Medications': Medications,
  'NutritionOrders': NutritionOrders,
  'Observations': Observations,
  'OperationOutcomes': OperationOutcomes,
  'Organizations': Organizations,
  'Patients': Patients,
  'PlanDefinitions': PlanDefinitions,
  'Practitioners': Practitioners,
  'Procedures': Procedures,
  'QuestionnaireResponses': QuestionnaireResponses,
  'Questionnaires': Questionnaires,
  'ResearchStudies': ResearchStudies,
  'ResearchSubjects': ResearchSubjects,
  'ServiceRequests': ServiceRequests,
  'Tasks': Tasks,
  'ValueSets': ValueSets
};

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

const StarSection = styled(Box)({
  flex: '0 0 40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const ResourceName = styled(Box)({
  flex: '0 0 280px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const ServerCountSection = styled(Box)({
  flex: '0 0 100px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  paddingRight: '20px',
});

const DDPSection = styled(Box)({
  flex: '0 0 80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const LocalCountSection = styled(Box)({
  flex: '0 0 100px',
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
  flex: '0 0 150px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const RestApiSection = styled(Box)({
  flex: '0 0 80px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  const [metadataResources, setMetadataResources] = useState([]);

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

  // Track system configuration for diagnostics
  const systemConfig = useTracker(() => {
    return {
      autopublishEnabled: get(Meteor, 'settings.private.fhir.autopublishSubscriptions', false),
      environment: get(Meteor, 'settings.public.environment', 'development'),
      fhirPath: get(Meteor, 'settings.private.fhir.fhirPath', 'baseR4')
    };
  });

  // Track active DDP subscriptions using Meteor.connection._subscriptions
  const activeSubscriptions = useTracker(() => {
    const subs = {};
    const selectedPatientId = Session.get('selectedPatientId');
    
    // Force reactivity on connection status and selected patient
    const connectionStatus = Meteor.status();
    
    if (Meteor.connection && Meteor.connection._subscriptions) {
      // Log subscription details for debugging
      const totalSubs = Object.keys(Meteor.connection._subscriptions).length;
      log.debug('Tracking active subscriptions', { totalSubs, selectedPatientId });
      
      // Debug: Log all subscription names when patient is selected
      if (selectedPatientId) {
        const subDetails = Object.values(Meteor.connection._subscriptions)
          .filter(s => s && s.name)
          .map(s => ({
            name: s.name,
            params: s.params,
            ready: s.ready
          }));
        log.debug('Active subscriptions with patient:', { selectedPatientId });
        console.log('Subscription details:', subDetails);
      }
      
      Object.values(Meteor.connection._subscriptions).forEach(sub => {
        if (sub && sub.name) {
          // Group subscriptions by resource name (flexible pattern matching)
          let resourceName = null;
          
          // Look for common FHIR resource names anywhere in the subscription name
          // This matches patterns like: pacio.Conditions, autopublish.Conditions, conditions.byPatient, etc.
          const resourcePatterns = [
            'AllergyIntolerances?',
            'Appointments?',
            'CarePlans?',
            'CareTeams?',
            'Communications?',
            'Compositions?',
            'Conditions?',
            'Consents?',
            'DocumentReferences?',
            'Encounters?',
            'Goals?',
            'Immunizations?',
            'Lists?',
            'Locations?',
            'MedicationAdministrations?',
            'MedicationRequests?',
            'MedicationStatements?',
            'Medications?',
            'NutritionOrders?',
            'Observations?',
            'Organizations?',
            'Patients?',
            'PlanDefinitions?',
            'Practitioners?',
            'Procedures?',
            'QuestionnaireResponses?',
            'Questionnaires?',
            'ServiceRequests?',
            'Tasks?',
            'ValueSets?'
          ];
          
          // Check each pattern
          for (const pattern of resourcePatterns) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(sub.name)) {
              // Extract base resource name and ensure plural
              resourceName = pattern.replace('?', '');
              if (!resourceName.endsWith('s')) {
                resourceName += 's';
              }
              break;
            }
          }
          
          // Fallback: try to extract from common patterns if not found above
          if (!resourceName) {
            // Try pattern like "prefix.ResourceName" or "resourceName.suffix"
            const match = sub.name.match(/\.([A-Z][a-z]+(?:[A-Z][a-z]+)*)|^([A-Z][a-z]+(?:[A-Z][a-z]+)*)|^([a-z]+)[\.\-]/);
            if (match) {
              const captured = match[1] || match[2] || match[3];
              if (captured) {
                resourceName = captured.charAt(0).toUpperCase() + captured.slice(1);
                if (!resourceName.endsWith('s')) {
                  resourceName += 's';
                }
              }
            }
          }
          
          if (resourceName) {
            // Debug: Log resource mapping
            if (selectedPatientId && !subs[resourceName]) {
              console.log(`Mapping subscription "${sub.name}" to resource "${resourceName}"`);
            }
            
            if (!subs[resourceName]) {
              subs[resourceName] = [];
            }
            // Check if subscription is patient-specific
            let hasPatientParam = false;
            if (selectedPatientId && sub.params) {
              hasPatientParam = sub.params.some(p => {
                // Direct patient ID as string
                if (typeof p === 'string' && p === selectedPatientId) return true;
                
                // Object with patient-related fields
                if (typeof p === 'object' && p) {
                  // Check various patient-related field names
                  if (p.patientId === selectedPatientId) return true;
                  if (p._id === selectedPatientId) return true;
                  if (p.subject === `Patient/${selectedPatientId}`) return true;
                  if (p['subject.reference'] === `Patient/${selectedPatientId}`) return true;
                  
                  // Check if query has patient reference
                  if (p.query && typeof p.query === 'object') {
                    if (p.query.patientId === selectedPatientId) return true;
                    if (p.query.subject === `Patient/${selectedPatientId}`) return true;
                    if (p.query['subject.reference'] === `Patient/${selectedPatientId}`) return true;
                  }
                }
                return false;
              });
              
              // Also check if subscription name suggests it's patient-specific
              if (!hasPatientParam && sub.name.includes('byPatient')) {
                hasPatientParam = true;
              }
            }
            
            subs[resourceName].push({
              name: sub.name,
              ready: sub.ready,
              params: sub.params,
              hasPatientParam: hasPatientParam,
              isAutopublish: sub.name.startsWith('autopublish.')
            });
          }
        }
      });
    }
    return subs;
  });

  // Get server URL
  const serverUrl = Meteor.absoluteUrl();
  const fhirEndpoint = `${serverUrl}baseR4`;

  // Define all FHIR resources
  const fhirResources = [
    { name: 'Activity Definitions', route: '/activity-definitions', settingsKey: 'ActivityDefinitions', collection: 'ActivityDefinitions' },
    { name: 'Allergy Intolerances', route: '/allergy-intolerances', settingsKey: 'AllergyIntolerances', collection: 'AllergyIntolerances' },
    { name: 'Appointments', route: '/appointments', settingsKey: 'Appointments', collection: 'Appointments' },
    { name: 'Artifact Assessments', route: '/artifact-assessments', settingsKey: 'ArtifactAssessments', collection: 'ArtifactAssessments' },
    { name: 'Bundles', route: '/bundles', settingsKey: 'Bundles', collection: 'Bundles' },
    { name: 'Care Plans', route: '/careplans', settingsKey: 'CarePlans', collection: 'CarePlans' },
    { name: 'Care Teams', route: '/care-teams', settingsKey: 'CareTeams', collection: 'CareTeams' },
    { name: 'Claims', route: '/claims', settingsKey: 'Claims', collection: 'Claims' },
    { name: 'Code Systems', route: '/code-systems', settingsKey: 'CodeSystems', collection: 'CodeSystems' },
    { name: 'Communications', route: '/communications', settingsKey: 'Communications', collection: 'Communications' },
    { name: 'Compositions', route: '/compositions', settingsKey: 'Compositions', collection: 'Compositions' },
    { name: 'Conditions', route: '/conditions', settingsKey: 'Conditions', collection: 'Conditions' },
    { name: 'Consents', route: '/consents', settingsKey: 'Consents', collection: 'Consents' },
    { name: 'Devices', route: '/devices', settingsKey: 'Devices', collection: 'Devices' },
    { name: 'Diagnostic Reports', route: '/diagnostic-reports', settingsKey: 'DiagnosticReports', collection: 'DiagnosticReports' },
    { name: 'Document References', route: '/document-references', settingsKey: 'DocumentReferences', collection: 'DocumentReferences' },
    { name: 'Encounters', route: '/encounters', settingsKey: 'Encounters', collection: 'Encounters' },
    { name: 'Evidences', route: '/evidences', settingsKey: 'Evidences', collection: 'Evidences' },
    { name: 'Goals', route: '/goals', settingsKey: 'Goals', collection: 'Goals' },
    { name: 'Guidance Responses', route: '/guidance-responses', settingsKey: 'GuidanceResponses', collection: 'GuidanceResponses' },
    { name: 'Imaging Studies', route: '/imaging-studies', settingsKey: 'ImagingStudies', collection: 'ImagingStudies' },
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
    { name: 'Schedules', route: '/schedules', settingsKey: 'Schedules', collection: 'Schedules' },
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
        const localCount = localCounts ? (localCounts[r.collection] || 0) : 0;
        return (stats.serverCount > 0) || (localCount > 0);
      });
    }
    
    return filtered;
  }

  // Check if REST endpoint is enabled (from metadata)
  function hasRestEndpoint(collection) {
    // Check if resource is in metadata
    const resourceType = collection.replace(/s$/, ''); // Remove plural
    return metadataResources.includes(resourceType) || metadataResources.includes(collection);
  }

  // Check if DDP publication is enabled (from server stats)
  function hasDDPPublication(collection) {
    const stats = resourceStats[collection];
    return stats && stats.ddpPublications && stats.ddpPublications.length > 0;
  }

  // Get subscription status for a resource
  function getSubscriptionStatus(collection) {
    const resourceSubs = activeSubscriptions[collection] || [];
    const hasPatientSpecific = resourceSubs.some(s => s.hasPatientParam);
    
    return {
      active: resourceSubs.length > 0,
      count: resourceSubs.length,
      ready: resourceSubs.every(s => s.ready),
      hasPatientSpecific: hasPatientSpecific,
      subscriptions: resourceSubs
    };
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

  // Track local document counts for each collection
  const localCounts = useTracker(() => {
    const counts = {};
    fhirResources.forEach(resource => {
      const collection = collectionsMap[resource.collection];
      if (collection && collection.find) {
        try {
          // Use Meteor v3 count() method
          const count = collection.find().count();
          counts[resource.collection] = count;
          if (count > 0) {
            console.log(`${resource.collection} local count: ${count}`);
          }
        } catch (error) {
          console.warn(`Error counting ${resource.collection}:`, error);
          counts[resource.collection] = 0;
        }
      } else {
        counts[resource.collection] = 0;
      }
    });
    return counts;
  }, []);

  // Fetch metadata to get REST endpoint info
  const fetchMetadata = async function() {
    try {
      const response = await fetch(`${fhirEndpoint}/metadata`, {
        headers: {
          'Accept': 'application/fhir+json'
        }
      });
      
      if (response.ok) {
        const metadata = await response.json();
        if (metadata && metadata.rest && metadata.rest[0] && metadata.rest[0].resource) {
          const resources = metadata.rest[0].resource.map(r => r.type);
          console.log('Metadata resources:', resources);
          setMetadataResources(resources);
        }
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  // Fetch resource statistics from the server
  const fetchResourceStats = async function() {
    setRefreshing(true);

    try {
      const result = await Meteor.rpc('fhir.getResourceStatistics', {});
      console.log('Received resource statistics:', result);
      setResourceStats(result || {});
    } catch (error) {
      console.error('Error fetching resource statistics:', error);
      setResourceStats({});
    }
    setLastRefresh(moment());
    setRefreshing(false);
    setLoading(false);
  };

  useEffect(function() {
    fetchResourceStats();
    fetchMetadata();
    
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
    return sum + (localCounts[resource.collection] || 0);
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
                <IconButton onClick={fetchResourceStats} disabled={refreshing} size="small" aria-label="Refresh">
                  <RefreshIcon className={refreshing ? 'rotating' : ''} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
        
        {/* Autopublish Alert */}
        {systemConfig.autopublishEnabled && (
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
            <AlertTitle>Autopublish Enabled</AlertTitle>
            Autopublish subscriptions are enabled. This may impact performance in production.
            <Chip label="Development Mode" size="small" sx={{ ml: 2 }} />
          </Alert>
        )}
        
        {/* Server Info and Summary Stats */}
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', mb: 2 }}>
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
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', p: 1, bgcolor: theme.palette.action.hover, borderRadius: 1 }}>
          <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 600 }}>Legend:</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <StarIcon fontSize="small" sx={{ color: 'gold' }} />
            <Typography variant="caption" color="textSecondary">In Metadata</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ApiIcon fontSize="small" color="primary" />
            <Typography variant="caption" color="textSecondary">REST API</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CloudSyncIcon fontSize="small" color="secondary" />
            <Typography variant="caption" color="textSecondary">DDP Pub</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WifiIcon fontSize="small" color="success" />
            <Typography variant="caption" color="textSecondary">Active Sub</Typography>
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
      <Box sx={{ flex: 1, overflow: 'auto', pb: '80px' }}>
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
            <StarSection />
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
            <DDPSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                DDP
              </Typography>
            </DDPSection>
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
                Indices
              </Typography>
            </MetadataSection>
            <RestApiSection>
              <Typography variant="body2" color="textSecondary" fontWeight={600}>
                REST
              </Typography>
            </RestApiSection>
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
              const clientCount = localCounts[resource.collection] || 0; // Use local count from tracker
              const isDisabled = !serverCount && !clientCount;
              const hasActivePubSub = hasPubSub[resource.collection];
              const inCapabilityStatement = isInCapabilityStatement(resource.collection);
              const hasRest = hasRestEndpoint(resource.collection);
              const hasDDP = hasDDPPublication(resource.collection);
              const subStatus = getSubscriptionStatus(resource.collection);
              
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
                  <StarSection>
                    {inCapabilityStatement && (
                      <Tooltip title="In CapabilityStatement/metadata">
                        <StarIcon fontSize="small" sx={{ color: 'gold' }} />
                      </Tooltip>
                    )}
                  </StarSection>
                  
                  <ResourceName>
                    <FolderIcon fontSize="small" sx={{ color: theme.palette.action.active }} />
                    <Typography variant="body1">
                      {resource.name}
                    </Typography>
                  </ResourceName>
                  
                  <ServerCountSection>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {formatCount(serverCount)}
                    </Typography>
                  </ServerCountSection>
                  
                  <DDPSection>
                    {subStatus.active ? (
                      <Tooltip title={
                        <div>
                          <div>{`${subStatus.count} active subscription(s)`}</div>
                          {subStatus.subscriptions && subStatus.subscriptions.map((sub, idx) => (
                            <div key={idx} style={{ fontSize: '0.85em', marginTop: '2px' }}>
                              • {sub.name} 
                              {sub.isAutopublish && ' (autopub)'}
                              {sub.hasPatientParam && ' (patient)'}
                            </div>
                          ))}
                        </div>
                      }>
                        <Chip 
                          icon={<WifiIcon />} 
                          label={subStatus.count} 
                          size="small" 
                          color={subStatus.ready ? "success" : "warning"}
                          variant={subStatus.hasPatientSpecific ? "filled" : "outlined"}
                          sx={{ height: 20 }}
                        />
                      </Tooltip>
                    ) : hasDDP ? (
                      <Tooltip title={`DDP Publications available: ${stats.ddpPublications ? stats.ddpPublications.join(', ') : 'unknown'}`}>
                        <CloudSyncIcon fontSize="small" color="action" />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textSecondary">—</Typography>
                    )}
                  </DDPSection>
                  
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
                      <Tooltip title={`Indices: ${stats.indices.map(idx => idx.name).join(', ')}`}>
                        <Chip 
                          size="small" 
                          label={stats.indices.map(idx => {
                            // Extract field names from index
                            if (idx.fields && idx.fields.length > 0) {
                              return idx.fields.join(', ');
                            }
                            // Fallback to index name if no fields
                            return idx.name;
                          }).join(' | ')} 
                          variant="outlined"
                          sx={{ 
                            maxWidth: '140px',
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }
                          }}
                        />
                      </Tooltip>
                    )}
                  </MetadataSection>
                  
                  <RestApiSection>
                    {hasRest ? (
                      <Tooltip title="REST API Endpoint Enabled">
                        <ApiIcon fontSize="small" color="primary" />
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="textSecondary">—</Typography>
                    )}
                  </RestApiSection>
                  
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