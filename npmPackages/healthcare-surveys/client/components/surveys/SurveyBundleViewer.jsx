// packages/healthcare-surveys/client/components/surveys/SurveyBundleViewer.jsx

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { get } from 'lodash';
import moment from 'moment';

export default function SurveyBundleViewer(props) {
  const { bundle, showComposition = true } = props;
  
  if (!bundle || !bundle.entry) {
    return (
      <Typography variant="body1" color="textSecondary">
        No bundle data available
      </Typography>
    );
  }
  
  const getResourceIcon = function(resourceType) {
    const iconMap = {
      'Composition': '📄',
      'Patient': '👤',
      'Encounter': '🏥',
      'Condition': '🩺',
      'MedicationAdministration': '💊',
      'MedicationRequest': '📋',
      'DiagnosticReport': '📊',
      'Observation': '🔬',
      'Procedure': '⚕️',
      'AllergyIntolerance': '⚠️',
      'Immunization': '💉',
      'CarePlan': '📝',
      'CareTeam': '👥',
      'Coverage': '🛡️',
      'Goal': '🎯'
    };
    return iconMap[resourceType] || '📦';
  };
  
  const renderResource = function(entry, index) {
    const resource = get(entry, 'resource', {});
    const resourceType = get(resource, 'resourceType', 'Unknown');
    const resourceId = get(resource, 'id', `resource-${index}`);
    
    // Skip composition if showComposition is false
    if (!showComposition && resourceType === 'Composition') {
      return null;
    }
    
    let summary = '';
    let details = null;
    
    // Create resource-specific summaries
    switch (resourceType) {
      case 'Patient':
        summary = `${get(resource, 'name[0].given[0]', '')} ${get(resource, 'name[0].family', '')}`;
        details = (
          <Box>
            <Typography variant="body2">Birth Date: {get(resource, 'birthDate', 'Unknown')}</Typography>
            <Typography variant="body2">Gender: {get(resource, 'gender', 'Unknown')}</Typography>
          </Box>
        );
        break;
        
      case 'Encounter':
        summary = get(resource, 'type[0].coding[0].display', 'Encounter');
        details = (
          <Box>
            <Typography variant="body2">Status: {get(resource, 'status', 'Unknown')}</Typography>
            <Typography variant="body2">Class: {get(resource, 'class.display', get(resource, 'class.code', 'Unknown'))}</Typography>
            <Typography variant="body2">Period: {moment(get(resource, 'period.start')).format('YYYY-MM-DD')}</Typography>
          </Box>
        );
        break;
        
      case 'Condition':
        summary = get(resource, 'code.coding[0].display', 'Condition');
        details = (
          <Box>
            <Typography variant="body2">Clinical Status: {get(resource, 'clinicalStatus.coding[0].code', 'Unknown')}</Typography>
            <Typography variant="body2">Verification: {get(resource, 'verificationStatus.coding[0].code', 'Unknown')}</Typography>
          </Box>
        );
        break;
        
      case 'MedicationAdministration':
      case 'MedicationRequest':
        summary = get(resource, 'medicationCodeableConcept.coding[0].display', 
                     get(resource, 'medicationReference.display', 'Medication'));
        details = (
          <Box>
            <Typography variant="body2">Status: {get(resource, 'status', 'Unknown')}</Typography>
            {resourceType === 'MedicationAdministration' && (
              <Typography variant="body2">
                Effective: {moment(get(resource, 'effectiveDateTime')).format('YYYY-MM-DD HH:mm')}
              </Typography>
            )}
          </Box>
        );
        break;
        
      default:
        summary = get(resource, 'code.coding[0].display', 
                     get(resource, 'name', 
                     get(resource, 'title', resourceType)));
    }
    
    return (
      <Accordion key={`${resourceType}-${resourceId}-${index}`}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Grid container alignItems="center" spacing={2}>
            <Grid item>
              <Typography variant="h6">{getResourceIcon(resourceType)}</Typography>
            </Grid>
            <Grid item xs>
              <Typography variant="body1">
                <strong>{resourceType}</strong> - {summary}
              </Typography>
            </Grid>
            <Grid item>
              <Chip label={`ID: ${resourceId}`} size="small" variant="outlined" />
            </Grid>
          </Grid>
        </AccordionSummary>
        <AccordionDetails>
          {details}
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="textSecondary">
            Full URL: {get(entry, 'fullUrl', 'Not specified')}
          </Typography>
        </AccordionDetails>
      </Accordion>
    );
  };
  
  // Group entries by resource type
  const groupedEntries = {};
  bundle.entry.forEach((entry, index) => {
    const resourceType = get(entry, 'resource.resourceType', 'Unknown');
    if (!groupedEntries[resourceType]) {
      groupedEntries[resourceType] = [];
    }
    groupedEntries[resourceType].push({ entry, index });
  });
  
  return (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Healthcare Survey Bundle"
          subheader={`Bundle Type: ${get(bundle, 'type', 'unknown')}`}
        />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Total Entries:</strong> {bundle.entry.length}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">
                <strong>Resource Types:</strong> {Object.keys(groupedEntries).length}
              </Typography>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              <strong>Resource Summary:</strong>
            </Typography>
            <List dense>
              {Object.entries(groupedEntries).map(([type, entries]) => (
                <ListItem key={type}>
                  <ListItemText
                    primary={`${getResourceIcon(type)} ${type}`}
                    secondary={`${entries.length} resource(s)`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>
      
      <Typography variant="h6" gutterBottom>
        Bundle Contents
      </Typography>
      
      {bundle.entry.map((entry, index) => renderResource(entry, index))}
    </Box>
  );
}