// npmPackages/e-prescribing/client.js
//
// Client entry — ONC 170.315(b)(3) electronic prescribing (NCPDP SCRIPT).
// Migrated from packages/e-prescribing (Atmosphere clinical:e-prescribing)
// 2026-06-13. Settings-gated (ePrescribing.enabled / .showInWorkflows).

import React from 'react';
import { Button } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import EPrescribingPage from './client/EPrescribingPage.jsx';
import workflowConfig from './workflow.json';

const isEnabled = get(Meteor, 'settings.public.modules.ePrescribing.enabled', true);
const showInWorkflows = get(Meteor, 'settings.public.modules.ePrescribing.showInWorkflows', true);

const DynamicRoutes = isEnabled ? workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'EPrescribingPage') {
    element = <EPrescribingPage />;
  } else {
    console.warn('[e-prescribing] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
}) : [];

const SidebarWorkflows = (isEnabled && showInWorkflows) ? workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
}) : [];

const FooterButtons = isEnabled ? [{
  pathname: '/e-prescribing',
  element: (
    <Button id="newPrescriptionButton" color="primary" variant="contained"
      onClick={function() { console.log('New prescription clicked'); }}>
      New Prescription
    </Button>
  )
}] : [];

const ModuleConfig = {
  name: 'EPrescribing',
  version: '0.1.0',
  oncCertified: true,
  certificationCriteria: ['170.315(b)(3) - Electronic Prescribing'],
  ncpdpScriptMessages: ['NewRx', 'RxChangeRequest', 'RxChangeResponse', 'CancelRx', 'CancelRxResponse', 'RxFill', 'RxFillStatus', 'RxRenewalRequest', 'RxRenewalResponse'],
  fhirResources: ['MedicationRequest', 'Medication', 'Patient', 'Practitioner', 'Organization', 'Pharmacy']
};

export { DynamicRoutes, SidebarWorkflows, FooterButtons, ModuleConfig, EPrescribingPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};
