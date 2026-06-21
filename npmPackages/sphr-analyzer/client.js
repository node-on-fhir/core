// npmPackages/sphr-analyzer/client.js
//
// Client entry — Smart Personal Health Record (SPHR) analyzer: PHR file analysis
// (nivo sunburst) + quality checks. Migrated from packages/sphr-analyzer
// (Atmosphere) 2026-06-13. Client-only package. The Atmosphere client mainModule
// was index.jsx; this consolidates into a self-contained entry that builds
// routes/sidebar from workflow.json and preserves the named exports.

import React from 'react';
import FileAnalysisPage from './client/FileAnalysisPage';
import QualityChecksPage from './client/QualityChecksPage';
import workflowConfig from './workflow.json';

const COMPONENTS = { FileAnalysisPage, QualityChecksPage };

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  const Comp = COMPONENTS[route.component];
  if (!Comp) {
    console.warn('[sphr-analyzer] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: Comp ? <Comp /> : null, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, href: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

const SidebarElements = [];

export { DynamicRoutes, SidebarWorkflows, SidebarElements, FileAnalysisPage, QualityChecksPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows
};
