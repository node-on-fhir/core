// packages/drug-interactions/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import DrugInteractionCheckerPage from './client/DrugInteractionCheckerPage';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes for Drug Interaction Checking
let DynamicRoutes = [{
  name: 'DrugInteractionChecker',
  path: '/drug-interactions',
  element: <DrugInteractionCheckerPage />,
  requireAuth: true,
  description: 'Drug-Drug and Drug-Allergy Interaction Checking (ONC §170.315(a)(4))'
}, {
  name: 'DrugDrugInteractions',
  path: '/drug-interactions/drug-drug',
  element: <DrugInteractionCheckerPage defaultMode="drug-drug" />,
  requireAuth: true,
  description: 'Drug-Drug Interaction Checks'
}, {
  name: 'DrugAllergyInteractions',
  path: '/drug-interactions/drug-allergy',
  element: <DrugInteractionCheckerPage defaultMode="drug-allergy" />,
  requireAuth: true,
  description: 'Drug-Allergy Interaction Checks'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Clinician-specific workflows
let ClinicianWorkflows = [{
  primaryText: "Drug Interaction Checker",
  to: '/drug-interactions',
  iconName: 'medication',
  requireAuth: true
}, {
  primaryText: "Drug-Drug Interactions",
  to: '/drug-interactions/drug-drug',
  iconName: 'alert',
  requireAuth: true
}, {
  primaryText: "Drug-Allergy Check",
  to: '/drug-interactions/drug-allergy',
  iconName: 'allergies',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

// Footer button configuration
let FooterButtons = [{
  pathname: '/drug-interactions',
  element: (
    <Button
      id="checkInteractionsButton"
      color="primary"
      variant="contained"
      onClick={() => {
        console.log('Check interactions clicked');
      }}
    >
      Check Interactions
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'DrugInteractions',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks'
  ],
  fhirResources: [
    'MedicationRequest',
    'MedicationStatement',
    'AllergyIntolerance',
    'DetectedIssue'
  ],
  settings: {
    enableRealTimeChecking: true,
    checkOnOrderEntry: true,
    checkOnOrderSign: true,
    severityLevels: ['contraindicated', 'severe', 'moderate', 'minor'],
    defaultSeverityThreshold: 'moderate'
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.drugInteractions.enabled', true)) {
  DynamicRoutes = [];
  ClinicianWorkflows = [];
}

// Check workflow visibility
if (!get(Meteor, 'settings.public.modules.drugInteractions.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  // Routes
  DynamicRoutes,
  
  // Sidebar items
  ClinicianWorkflows,
  
  // Footer
  FooterButtons,
  
  // Configuration
  ModuleConfig,
  
  // Main component for reuse
  DrugInteractionCheckerPage
};