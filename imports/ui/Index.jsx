// imports/ui/Index.jsx

import React, { useState, useEffect } from 'react';
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { useNavigate } from "react-router-dom";
import { get } from 'lodash';

import { 
  CardContent,
  Grid,
  TextField,
  Typography,
  Box,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

// Create client-only Minimongo collections for filtering
const CoreLinksCollection = new Mongo.Collection('CoreLinks', { connection: null });
const FhirLinksCollection = new Mongo.Collection('FhirLinks', { connection: null });
const DynamicLinksCollection = new Mongo.Collection('DynamicLinks', { connection: null });

export const Index = () => {
  const navigate = useNavigate();
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

  // Render functions for different sections
  const renderCoreElements = () => {
    if (filteredCoreLinks.length === 0) return null;
    
    return (
      <div>
        <hr style={{marginBottom: '0px'}}/>
        <h3 style={{marginTop: '0px', paddingTop: '0px'}}>Index</h3>
        <ul>
          {filteredCoreLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.url)} style={{cursor: 'pointer'}}>
              <a>{link.title}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderFhirElements = () => {
    if (filteredFhirLinks.length === 0) return null;
    
    return (
      <div>
        <hr style={{marginBottom: '0px'}}/>
        <h3 style={{marginTop: '0px', paddingTop: '0px'}}>FHIR Modules</h3>
        <ul>
          {filteredFhirLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.url)} style={{cursor: 'pointer'}}>
              <a>{link.title}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderDynamicElements = () => {
    if (filteredDynamicLinks.length === 0) return null;
    
    return (
      <div>
        <hr style={{marginBottom: '0px'}}/>
        <h3 style={{marginTop: '0px', paddingTop: '0px'}}>Dynamic Modules</h3>
        <ul>
          {filteredDynamicLinks.map(link => (
            <li key={link._id} onClick={() => navigate(link.path)} style={{cursor: 'pointer'}}>
              <a>{link.name}</a>
              {link.description && (
                <span style={{color: '#666', fontSize: '0.9em', marginLeft: '10px'}}>
                  - {link.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Calculate total results
  const totalResults = filteredCoreLinks.length + filteredFhirLinks.length + filteredDynamicLinks.length;

  return (
    <div style={{height: window.innerHeight, overflow: 'scroll', paddingBottom: '100px'}}>
      <CardContent>
        {/* Search Bar Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Site Index & Help
          </Typography>
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
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            {renderCoreElements()}
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
            {renderFhirElements()}
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
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