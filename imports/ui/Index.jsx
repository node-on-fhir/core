// imports/ui/Index.jsx

import React, { useState, useEffect } from 'react';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { useNavigate, useSearchParams } from "react-router-dom";
import { get } from 'lodash';

import {
  Avatar,
  CardContent,
  Card,
  CardHeader,
  Chip,
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

// Core section icons
import Home from '@mui/icons-material/Home';
import Toc from '@mui/icons-material/Toc';
import FolderOpen from '@mui/icons-material/FolderOpen';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import BugReport from '@mui/icons-material/BugReport';
import Hub from '@mui/icons-material/Hub';
import Extension from '@mui/icons-material/Extension';
import Settings from '@mui/icons-material/Settings';
import HowToReg from '@mui/icons-material/HowToReg';
import VpnKey from '@mui/icons-material/VpnKey';
import Person from '@mui/icons-material/Person';
import People from '@mui/icons-material/People';
import Palette from '@mui/icons-material/Palette';
import Widgets from '@mui/icons-material/Widgets';

// FHIR section icons
import WarningAmber from '@mui/icons-material/WarningAmber';
import Assessment from '@mui/icons-material/Assessment';
import DirectionsRun from '@mui/icons-material/DirectionsRun';
import Work from '@mui/icons-material/Work';
import Assignment from '@mui/icons-material/Assignment';
import Groups from '@mui/icons-material/Groups';
import DataObject from '@mui/icons-material/DataObject';
import Article from '@mui/icons-material/Article';
import Email from '@mui/icons-material/Email';
import MonitorHeart from '@mui/icons-material/MonitorHeart';
import AccountBalanceWallet from '@mui/icons-material/AccountBalanceWallet';
import DevicesIcon from '@mui/icons-material/Devices';
import Summarize from '@mui/icons-material/Summarize';
import Description from '@mui/icons-material/Description';
import TransferWithinAStation from '@mui/icons-material/TransferWithinAStation';
import Science from '@mui/icons-material/Science';
import ReceiptLong from '@mui/icons-material/ReceiptLong';
import TrackChanges from '@mui/icons-material/TrackChanges';
import QuestionAnswer from '@mui/icons-material/QuestionAnswer';
import Vaccines from '@mui/icons-material/Vaccines';
import LocalLibrary from '@mui/icons-material/LocalLibrary';
import FactCheck from '@mui/icons-material/FactCheck';
import Medication from '@mui/icons-material/Medication';
import Restaurant from '@mui/icons-material/Restaurant';
import Thermostat from '@mui/icons-material/Thermostat';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import AccountTree from '@mui/icons-material/AccountTree';
import Healing from '@mui/icons-material/Healing';
import Quiz from '@mui/icons-material/Quiz';
import Biotech from '@mui/icons-material/Biotech';
import MedicalServices from '@mui/icons-material/MedicalServices';
import TaskIcon from '@mui/icons-material/Task';
import Dataset from '@mui/icons-material/Dataset';

// Icon maps keyed by URL path
const coreIconMap = {
  '/': Home,
  '/index': Toc,
  '/static-files': FolderOpen,
  '/smart-launcher': RocketLaunch,
  '/smart-launcher-debugger': BugReport,
  '/smart-sample-app': Hub,
  '/smart-app-debugger': BugReport,
  '/cds-hooks-debugger': Extension,
  '/server-configuration': Settings,
  '/udap-registration': HowToReg,
  '/oauth-clients': VpnKey,
  '/patient-chart': Person,
  '/patient-directory': People,
  '/theming': Palette
};

const fhirIconMap = {
  '/allergy-intolerances': WarningAmber,
  '/artifact-assessments': Assessment,
  '/activity-definitions': DirectionsRun,
  '/bundles': Work,
  '/care-plans': Assignment,
  '/care-teams': Groups,
  '/code-systems': DataObject,
  '/compositions': Article,
  '/communications': Email,
  '/conditions': MonitorHeart,
  '/claims': AccountBalanceWallet,
  '/devices': DevicesIcon,
  '/diagnostic-reports': Summarize,
  '/document-references': Description,
  '/encounters': TransferWithinAStation,
  '/evidences': Science,
  '/explanation-of-benefits': ReceiptLong,
  '/goals': TrackChanges,
  '/guidance-responses': QuestionAnswer,
  '/immunizations': Vaccines,
  '/libraries': LocalLibrary,
  '/measures': FactCheck,
  '/measure-reports': Assessment,
  '/medications': Medication,
  '/medication-statements': Medication,
  '/nutrition-orders': Restaurant,
  '/observations': Thermostat,
  '/operation-outcomes': ErrorOutline,
  '/plan-definitions': AccountTree,
  '/procedures': Healing,
  '/questionnaires': Quiz,
  '/questionnaire-responses': QuestionAnswer,
  '/research-studies': Biotech,
  '/research-subjects': Groups,
  '/service-requests': MedicalServices,
  '/tasks': TaskIcon,
  '/value-sets': Dataset
};

// Section accent colors -- rgba for light/dark mode compatibility
const sectionAccents = {
  core:    { bg: 'rgba(66,133,244,0.12)',  border: 'rgba(66,133,244,0.6)',  icon: 'rgb(66,133,244)' },
  fhir:    { bg: 'rgba(108,183,110,0.12)', border: 'rgba(108,183,110,0.6)', icon: 'rgb(108,183,110)' },
  dynamic: { bg: 'rgba(255,167,38,0.12)',  border: 'rgba(255,167,38,0.6)',  icon: 'rgb(255,167,38)' }
};

// Create client-only Minimongo collections for filtering
const CoreLinksCollection = new Mongo.Collection('CoreLinks', { connection: null });
const FhirLinksCollection = new Mongo.Collection('FhirLinks', { connection: null });
const DynamicLinksCollection = new Mongo.Collection('DynamicLinks', { connection: null });

export const Index = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const layoutParam = searchParams.get('layout');
  const [viewMode, setViewMode] = useState(layoutParam === 'tiles' ? 'tiles' : layoutParam === 'links' ? 'text' : 'text');

  const handleViewModeChange = (e, newMode) => {
    if (newMode) {
      setViewMode(newMode);
      setSearchParams({ layout: newMode === 'tiles' ? 'tiles' : 'links' });
    }
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCoreLinks, setFilteredCoreLinks] = useState([]);
  const [filteredFhirLinks, setFilteredFhirLinks] = useState([]);
  const [filteredDynamicLinks, setFilteredDynamicLinks] = useState([]);

  // Initialize core links
  let coreLinks = [
    {
      _id: Random.id(),
      url: "/",
      title: "Root"
    }, {
      _id: Random.id(),
      url: "/index",
      title: "Site Index"
    }, {
      _id: Random.id(),
      url: "/static-files",
      title: "Static File Loader"
    }, {
      _id: Random.id(),
      url: "/smart-launcher",
      title: "SMART Launcher"
    }, {
      _id: Random.id(),
      url: "/smart-launcher-debugger",
      title: "SMART Launcher Debugger"
    }, {
      _id: Random.id(),
      url: "/smart-sample-app",
      title: "TEFCA Network"
    }, {
      _id: Random.id(),
      url: "/smart-app-debugger",
      title: "SMART App Debugger"
    }, {
      _id: Random.id(),
      url: "/cds-hooks-debugger",
      title: "CDS Hooks Debugger"
    }, {
      _id: Random.id(),
      url: "/server-configuration",
      title: "Server Configuration"
    }, {
      _id: Random.id(),
      url: "/udap-registration",
      title: "UDAP Registration"
    }, {
      _id: Random.id(),
      url: "/oauth-clients",
      title: "OAuth Clients"
    }, {
      _id: Random.id(),
      url: "/patient-chart",
      title: "Patient Chart"
    }
  ];

  // Add conditional core links
  if(get(Meteor, 'settings.public.modules.PatientsDirectory')){
    coreLinks.push({
      _id: Random.id(),
      url: "/patient-directory",
      title: "Patients Directory"
    })
  }
  if(get(Meteor, 'settings.public.modules.Theming')){
    coreLinks.push({
      _id: Random.id(),
      url: "/theming",
      title: "Theming"
    })
  }

  // Initialize FHIR microservice links
  let fhirMicroserviceLinks = [];

  if(get(Meteor, 'settings.public.modules.fhir.AllergyIntolerances')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/allergy-intolerances",
      title: "Allergies"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ArtifactAssessments')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/artifact-assessments",
      title: "Artifact Assessments"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ActivityDefinitions')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/activity-definitions",
      title: "Activity Definitions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Bundles')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/bundles",
      title: "Bundles"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CarePlans')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/care-plans",
      title: "Care Plans"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CareTeams')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/care-teams",
      title: "Care Teams"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.CodeSystems')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/code-systems",
      title: "Code Systems"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Compositions')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/compositions",
      title: "Compositions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Communications')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/communications",
      title: "Communications"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Conditions')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/conditions",
      title: "Conditions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Claims')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/claims",
      title: "Claims"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Devices')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/devices",
      title: "Devices"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.DiagnosticReports')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/diagnostic-reports",
      title: "Diagnostic Reports"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.DocumentReferences')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/document-references",
      title: "Document References"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Encounters')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/encounters",
      title: "Encounters"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Evidences')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/evidences",
      title: "Evidences"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ExplanationOfBenefits')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/explanation-of-benefits",
      title: "Explanation Of Benefits"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Goals')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/goals",
      title: "Goals"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.GuidanceResponses')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/guidance-responses",
      title: "Guidance Responses"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Immunizations')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/immunizations",
      title: "Immunizations"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Libraries')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/libraries",
      title: "Libraries"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Measures')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/measures",
      title: "Measures"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.MeasureReports')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/measure-reports",
      title: "Measure Reports"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Medications')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/medications",
      title: "Medications"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.MedicationStatements')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/medication-statements",
      title: "MedicationStatements"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.NutritionOrders')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/nutrition-orders",
      title: "Nutrition Orders"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Observations')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/observations",
      title: "Observations"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.OperationOutcomes')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/operation-outcomes",
      title: "OperationOutcomes"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.PlanDefinitions')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/plan-definitions",
      title: "Plan Definitions"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Procedures')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/procedures",
      title: "Procedures"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Questionnaires')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/questionnaires",
      title: "Questionnaires"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.QuestionnaireResponses')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/questionnaire-responses",
      title: "Questionnaire Responses"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ResearchStudies')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/research-studies",
      title: "Research Studies"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ResearchSubjects')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/research-subjects",
      title: "Research Subjects"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ServiceRequests')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/service-requests",
      title: "Service Requests"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.Tasks')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/tasks",
      title: "Tasks"
    })
  }
  if(get(Meteor, 'settings.public.modules.fhir.ValueSets')){
    fhirMicroserviceLinks.push({
      _id: Random.id(),
      url: "/value-sets",
      title: "Value Sets"
    })
  }

  // Initialize dynamic routes
  let dynamicRoutes = [];
  Object.keys(Package).forEach(function(packageName){
    if(Package[packageName].DynamicRoutes){
      Package[packageName].DynamicRoutes.forEach(function(route){
        // Add description to the route object if available
        dynamicRoutes.push({
          _id: Random.id(),
          name: route.name,
          path: route.path,
          description: route.description || '',
          url: route.path,
          title: route.name
        });
      });
    }
  });

  // Initialize collections on mount
  useEffect(() => {
    // Clear and populate CoreLinksCollection
    CoreLinksCollection.remove({});
    coreLinks.forEach(link => {
      CoreLinksCollection.insert(link);
    });

    // Clear and populate FhirLinksCollection
    FhirLinksCollection.remove({});
    fhirMicroserviceLinks.forEach(link => {
      FhirLinksCollection.insert(link);
    });

    // Clear and populate DynamicLinksCollection
    DynamicLinksCollection.remove({});
    dynamicRoutes.forEach(link => {
      DynamicLinksCollection.insert(link);
    });

    // Initial fetch without filter
    setFilteredCoreLinks(CoreLinksCollection.find({}).fetch());
    setFilteredFhirLinks(FhirLinksCollection.find({}).fetch());
    setFilteredDynamicLinks(DynamicLinksCollection.find({}).fetch());
  }, []); // Empty dependency array means this runs once on mount

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // No search query, show all items
      setFilteredCoreLinks(CoreLinksCollection.find({}).fetch());
      setFilteredFhirLinks(FhirLinksCollection.find({}).fetch());
      setFilteredDynamicLinks(DynamicLinksCollection.find({}).fetch());
    } else {
      // Apply regex filter
      const regexQuery = {
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { url: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } }
        ]
      };

      setFilteredCoreLinks(CoreLinksCollection.find(regexQuery).fetch());
      setFilteredFhirLinks(FhirLinksCollection.find(regexQuery).fetch());
      setFilteredDynamicLinks(DynamicLinksCollection.find(regexQuery).fetch());
    }
  }, [searchQuery]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Shared section header for both views
  const renderSectionHeader = (title, accent) => {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: '2px', bgcolor: accent.border, borderRadius: 1 }} />
      </Box>
    );
  };

  // Shared tile card renderer
  const renderTileCard = (link, iconMap, accent, navPath, subtitle) => {
    const IconComponent = iconMap[link.url] || Widgets;
    const routePath = navPath || link.url;

    return (
      <Card
        key={link._id}
        onClick={() => navigate(routePath)}
        sx={{
          cursor: 'pointer',
          mb: 1.5,
          borderRadius: 2,
          borderLeft: '4px solid',
          borderLeftColor: accent.border,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 4,
            backgroundColor: 'action.hover',
            transform: 'translateX(2px)'
          }
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: accent.bg, width: 40, height: 40 }}>
              <IconComponent sx={{ color: accent.icon, fontSize: 22 }} />
            </Avatar>
          }
          title={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {link.title || link.name}
            </Typography>
          }
          subheader={subtitle || null}
          action={
            <Chip
              label={routePath}
              size="small"
              variant="outlined"
              sx={{ mt: 1, mr: 1, fontFamily: 'monospace', fontSize: '0.7rem' }}
            />
          }
        />
      </Card>
    );
  };

  // Render functions for different sections
  const renderCoreElements = () => {
    if (filteredCoreLinks.length === 0) return null;

    if (viewMode === 'tiles') {
      return (
        <div>
          {renderSectionHeader('Index', sectionAccents.core)}
          {filteredCoreLinks.map(link => renderTileCard(link, coreIconMap, sectionAccents.core))}
        </div>
      );
    }

    return (
      <div>
        {renderSectionHeader('Index', sectionAccents.core)}
        <ul>
          {filteredCoreLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.url)} style={{cursor: 'pointer', color: theme.palette.mode === 'dark' ? theme.palette.primary.light : 'inherit'}}>
              <a style={{color: 'inherit'}}>{link.title}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderFhirElements = () => {
    if (filteredFhirLinks.length === 0) return null;

    if (viewMode === 'tiles') {
      return (
        <div>
          {renderSectionHeader('FHIR Modules', sectionAccents.fhir)}
          {filteredFhirLinks.map(link => renderTileCard(link, fhirIconMap, sectionAccents.fhir))}
        </div>
      );
    }

    return (
      <div>
        {renderSectionHeader('FHIR Modules', sectionAccents.fhir)}
        <ul>
          {filteredFhirLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.url)} style={{cursor: 'pointer', color: theme.palette.mode === 'dark' ? theme.palette.primary.light : 'inherit'}}>
              <a style={{color: 'inherit'}}>{link.title}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDynamicElements = () => {
    if (filteredDynamicLinks.length === 0) return null;

    if (viewMode === 'tiles') {
      return (
        <div>
          {renderSectionHeader('Dynamic Modules', sectionAccents.dynamic)}
          {filteredDynamicLinks.map(link => renderTileCard(
            link,
            {},
            sectionAccents.dynamic,
            link.path,
            link.description || null
          ))}
        </div>
      );
    }

    return (
      <div>
        {renderSectionHeader('Dynamic Modules', sectionAccents.dynamic)}
        <ul>
          {filteredDynamicLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.path)} style={{cursor: 'pointer', color: theme.palette.mode === 'dark' ? theme.palette.primary.light : 'inherit'}}>
              <a style={{color: 'inherit'}}>{link.name}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Calculate total results
  const totalResults = filteredCoreLinks.length + filteredFhirLinks.length + filteredDynamicLinks.length;

  return (
    <div style={{
      height: window.innerHeight,
      overflow: 'scroll',
      paddingBottom: '100px',
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.grey[50]
    }}>
      <CardContent>
        {/* Search Bar Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Site Index & Help
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
            >
              <ToggleButton value="text"><ViewListIcon /></ToggleButton>
              <ToggleButton value="tiles"><ViewModuleIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Search for pages, modules, and features across the application
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for pages, FHIR resources, or features..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          {searchQuery && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{searchQuery}"
            </Typography>
          )}
        </Box>

        {/* Results Grid */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={fhirMicroserviceLinks.length > 0 ? 4 : 6} lg={fhirMicroserviceLinks.length > 0 ? 4 : 6} xl={fhirMicroserviceLinks.length > 0 ? 4 : 6}>
            {renderCoreElements()}
          </Grid>
          {fhirMicroserviceLinks.length > 0 && (
            <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
              {renderFhirElements()}
            </Grid>
          )}
          <Grid item xs={12} sm={12} md={fhirMicroserviceLinks.length > 0 ? 4 : 6} lg={fhirMicroserviceLinks.length > 0 ? 4 : 6} xl={fhirMicroserviceLinks.length > 0 ? 4 : 6}>
            {renderDynamicElements()}
          </Grid>
        </Grid>

        {/* No results message */}
        {searchQuery && totalResults === 0 && (
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No results found for "{searchQuery}"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Try searching for different keywords or check the spelling
            </Typography>
          </Box>
        )}
      </CardContent>
    </div>
  );
};
