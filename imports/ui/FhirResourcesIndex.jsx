// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/FhirResourcesIndex.jsx

import React from 'react';
import { useNavigate } from "react-router-dom";
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import { useTheme } from '@mui/material/styles';

export function FhirResourcesIndex() {
  const navigate = useNavigate();
  const theme = useTheme();

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

  return (
    <div style={{ padding: '20px', height: '100vh', overflow: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        FHIR Resources Index
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Browse and manage available FHIR resources in the system
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
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={resource.route}>
                    <Card 
                      variant="outlined"
                      style={{ 
                        opacity: isEnabled ? 1 : 0.5,
                        cursor: isEnabled ? 'pointer' : 'not-allowed'
                      }}
                    >
                      <CardActionArea 
                        onClick={() => isEnabled && handleResourceClick(resource.route)}
                        disabled={!isEnabled}
                      >
                        <CardContent>
                          <Typography variant="body1">
                            {resource.name}
                          </Typography>
                          {!isEnabled && (
                            <Typography variant="caption" color="textSecondary">
                              Not enabled
                            </Typography>
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
    </div>
  );
}

export default FhirResourcesIndex;