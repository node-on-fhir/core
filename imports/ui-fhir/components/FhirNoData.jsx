// imports/ui-fhir/components/FhirNoData.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';


// Pluralization lookup for multi-word resource types
const PLURAL_MAP = {
  'ImagingStudy': 'Imaging Studies',
  'ServiceRequest': 'Service Requests',
  'DocumentReference': 'Document References',
  'DiagnosticReport': 'Diagnostic Reports',
  'AllergyIntolerance': 'Allergy Intolerances',
  'MedicationAdministration': 'Medication Administrations',
  'MedicationRequest': 'Medication Requests',
  'CareTeam': 'Care Teams',
  'CarePlan': 'Care Plans',
  'NutritionOrder': 'Nutrition Orders',
  'NutritionProduct': 'Nutrition Products',
  'ExplanationOfBenefit': 'Explanations of Benefit'
};

function pluralize(resourceType) {
  if (PLURAL_MAP[resourceType]) {
    return PLURAL_MAP[resourceType];
  }
  // Simple pluralization: add 's'
  return resourceType + 's';
}


export function FhirNoData(props) {
  const {
    resourceType,
    searchFilter,
    onAdd,
    onClearSearch,
    addButtonLabel
  } = props;

  const pluralName = pluralize(resourceType);
  const hasSearch = searchFilter && searchFilter.trim().length > 0;

  // Determine title
  let title;
  if (hasSearch) {
    title = 'No ' + pluralName + ' Found';
  } else {
    title = get(Meteor, 'settings.public.defaults.noData.defaultTitle', 'No Data Available');
  }

  // Determine message
  let message;
  if (hasSearch) {
    message = 'No ' + pluralName.toLowerCase() + ' match your search criteria "' + searchFilter.trim() + '". Try adjusting your search terms.';
  } else {
    message = get(Meteor, 'settings.public.defaults.noData.defaultMessage', 'No records were found in the client data cursor. To debug, check the data cursor in the client console, then check subscriptions and publications, and relevant search queries. If the data is not loaded in, use a tool like Mongo Compass to load the records directly into the Mongo database, or use the FHIR API interfaces.');
  }

  // Determine button label
  let buttonLabel;
  if (addButtonLabel) {
    buttonLabel = addButtonLabel;
  } else if (hasSearch) {
    buttonLabel = 'Clear Search & Add ' + resourceType;
  } else {
    buttonLabel = 'Add Your First ' + resourceType;
  }

  // Button click handler
  function handleButtonClick() {
    if (hasSearch && onClearSearch) {
      onClearSearch();
    } else if (onAdd) {
      onAdd();
    }
  }

  return (
    <Box
      id="noDataCard"
      className="no-data-card"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card
        sx={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper'
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                color: 'text.primary',
                mb: 2
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {message}
            </Typography>
          </Box>
          {onAdd && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleButtonClick}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                py: 1,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2
                }
              }}
            >
              {buttonLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default FhirNoData;
