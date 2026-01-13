// packages/order-catalog/index.jsx

import React from 'react';
import { Button } from '@mui/material';
import OrderCatalogPage from './client/OrderCatalogPage.jsx';

// =============================================================================
// ROUTE DEFINITIONS
// =============================================================================

// Main routes for Order Catalog (CPOE)
let DynamicRoutes = [{
  name: 'OrderCatalog',
  path: '/order-catalog',
  element: <OrderCatalogPage />,
  requireAuth: true,
  description: 'Computerized Provider Order Entry (CPOE)'
}, {
  name: 'CPOEMedications',
  path: '/cpoe/medications',
  element: <OrderCatalogPage defaultType="medication" />,
  requireAuth: true,
  description: 'CPOE - Medications (ONC §170.315(a)(1))'
}, {
  name: 'CPOELaboratory',
  path: '/cpoe/laboratory',
  element: <OrderCatalogPage defaultType="laboratory" />,
  requireAuth: true,
  description: 'CPOE - Laboratory (ONC §170.315(a)(2))'
}, {
  name: 'CPOEDiagnosticImaging',
  path: '/cpoe/diagnostic-imaging',
  element: <OrderCatalogPage defaultType="radiology" />,
  requireAuth: true,
  description: 'CPOE - Diagnostic Imaging (ONC §170.315(a)(3))'
}];

// =============================================================================
// SIDEBAR WORKFLOWS
// =============================================================================

// Main workflow items
let SidebarWorkflows = [];

// Clinician-specific workflows
let ClinicianWorkflows = [{
  primaryText: "Order Catalog",
  to: '/order-catalog',
  iconName: 'orders',
  requireAuth: true
}, {
  primaryText: "CPOE - Medications",
  to: '/cpoe/medications',
  iconName: 'medication',
  requireAuth: true
}, {
  primaryText: "CPOE - Laboratory",
  to: '/cpoe/laboratory',
  iconName: 'laboratory',
  requireAuth: true
}, {
  primaryText: "CPOE - Diagnostic Imaging",
  to: '/cpoe/diagnostic-imaging',
  iconName: 'imaging',
  requireAuth: true
}];

// =============================================================================
// FOOTER BUTTONS
// =============================================================================

// Footer button configuration
let FooterButtons = [{
  pathname: '/order-catalog',
  element: (
    <Button
      id="submitOrdersButton"
      color="primary"
      variant="contained"
      onClick={() => {
        // This will be handled by the OrderCatalogPage component
        console.log('Submit orders clicked');
      }}
    >
      Submit Orders
    </Button>
  )
}];

// =============================================================================
// MODULE CONFIG
// =============================================================================

const ModuleConfig = {
  name: 'OrderCatalog',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: [
    '170.315(a)(1) - CPOE Medications',
    '170.315(a)(2) - CPOE Laboratory',
    '170.315(a)(3) - CPOE Diagnostic Imaging',
    '170.315(a)(4) - Drug-Drug, Drug-Allergy Interaction Checks'
  ],
  fhirResources: [
    'ServiceRequest',
    'MedicationRequest',
    'PlanDefinition',
    'ActivityDefinition',
    'SpecimenDefinition',
    'ImagingStudy'
  ],
  settings: {
    enableDrugInteractionChecks: true,
    requireOrderPriority: true,
    defaultOrderPriority: 'routine',
    enableOrderSets: true
  }
};

// =============================================================================
// SETTINGS INTEGRATION
// =============================================================================

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';

// Check if package is enabled in settings
if (!get(Meteor, 'settings.public.modules.orderCatalog.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
  ClinicianWorkflows = [];
}

// Check sidebar visibility
if (!get(Meteor, 'settings.public.modules.orderCatalog.showInSidebar', true)) {
  SidebarWorkflows = [];
}

if (!get(Meteor, 'settings.public.modules.orderCatalog.showInWorkflows', true)) {
  ClinicianWorkflows = [];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { 
  // Routes
  DynamicRoutes,
  
  // Sidebar items
  SidebarWorkflows,
  ClinicianWorkflows,
  
  // Footer
  FooterButtons,
  
  // Configuration
  ModuleConfig,
  
  // Main component for reuse
  OrderCatalogPage
};