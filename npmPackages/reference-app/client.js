// npmPackages/reference-app/client.js
//
// Client entry — ONC (g)(10) reference application + certification tracking.
// Migrated from packages/reference-app (Atmosphere) 2026-06-13. The Atmosphere
// client mainModule was index.jsx; this consolidates into a self-contained entry
// that builds routes/sidebar from workflow.json and preserves every named export.
// (Adds the `Meteor` import that index.jsx relied on as an Atmosphere global, and
// declares `SidebarElements` which a settings gate assigns to.)

import React from 'react';
import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import ReferenceAppPage from './client/ReferenceAppPage';
import G10CertificationPage from './client/G10CertificationPage';
import { ReferenceAppFooterButtons } from './client/FooterButtons';
import { ReferenceAppWorkflow } from './client/ReferenceAppWorkflow';
import { ReferenceAppCollections } from './lib/collections';
import { ReferenceAppUtilities } from './lib/utilities';
import workflowConfig from './workflow.json';

const COMPONENTS = { ReferenceAppPage, G10CertificationPage };

let DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[reference-app] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: Comp ? <Comp /> : null, requireAuth: route.requireAuth || false, description: route.description };
});

// Admin-only route (kept as a named export, not in the default routes).
const AdminDynamicRoutes = [{
  name: 'ReferenceAppAdmin',
  path: '/admin/reference-app',
  element: <ReferenceAppPage adminMode={true} />,
  requireAuth: true
}];

let SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

// Declared because a settings gate below assigns to it (index.jsx relied on an
// implicit global here).
let SidebarElements = [];

const AdminSidebarElements = [{
  primaryText: 'Reference Admin', to: '/admin/reference-app', iconName: 'Settings',
  excludeDevice: ['iPhone', 'iPad'], requireAuth: true
}];

// Score Card / G10 Criteria nav — shown on both of the package's pages
const FooterButtons = [{
  pathname: '/reference-app',
  element: <ReferenceAppFooterButtons />
}, {
  pathname: '/g10-certification',
  element: <ReferenceAppFooterButtons />
}];

const FooterElements = [{
  label: 'Reference Action',
  className: 'reference-footer-button',
  style: { color: '#FFF', backgroundColor: '#2196F3' },
  onClick: function() { console.log('Reference footer button clicked'); }
}];

// MainPage `/` override — preserved as a named export only (NOT in routes).
const MainPage = {
  name: 'ReferenceHome',
  path: '/',
  element: <ReferenceAppPage isMainPage={true} />,
  description: 'Reference app as main landing page'
};

const ModuleConfig = {
  name: 'ReferenceApp',
  version: '0.1.0',
  fhirResources: ['Patient', 'Observation', 'Procedure'],
  settings: { enableAdvancedFeatures: false, showInSidebar: true, requireAuthentication: true }
};

const PatientsDirectoryButtons = [{
  id: 'certify-patient-action',
  label: 'Certify',
  color: 'primary',
  onClick: function(patientId, patient) {
    const fhirId = get(patient, 'id', patientId);
    Session.set('selectedPatientId', fhirId);
    Session.set('selectedPatient', patient);
    if (typeof Meteor.navigate === 'function') {
      Meteor.navigate('/g10-certification');
    } else {
      console.error('Meteor.navigate() is not available - NavigationContext may not be mounted');
    }
  }
}];

let WorkflowTabs = [];

// Settings gates (preserved from index.jsx).
if (!get(Meteor, 'settings.public.modules.referenceApp.enabled', true)) {
  DynamicRoutes = [];
  SidebarWorkflows = [];
}
if (!get(Meteor, 'settings.public.modules.referenceApp.showInSidebar', true)) {
  SidebarWorkflows = [];
  SidebarElements = [];
}

export {
  DynamicRoutes,
  SidebarWorkflows,
  SidebarElements,
  AdminDynamicRoutes,
  AdminSidebarElements,
  FooterButtons,
  FooterElements,
  MainPage,
  ModuleConfig,
  PatientsDirectoryButtons,
  WorkflowTabs,
  ReferenceAppPage,
  G10CertificationPage,
  ReferenceAppWorkflow,
  ReferenceAppFooterButtons,
  ReferenceAppCollections,
  ReferenceAppUtilities
};

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};
