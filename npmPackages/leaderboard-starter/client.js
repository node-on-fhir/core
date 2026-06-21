// npmPackages/leaderboard-starter/client.js
//
// Client entry — leaderboard starter (SMART on FHIR demo). Migrated from
// packages/leaderboard-starter (Atmosphere mitre:leaderboard-starter) 2026-06-13.

import React from 'react';
import LeaderboardPage from './client/LeaderboardPage.jsx';
import { LeaderboardPageButtons } from './client/FooterButtons.jsx';
import workflowConfig from './workflow.json';

const DynamicRoutes = workflowConfig.routes.map(function(route) {
  let element = null;
  if (route.component === 'LeaderboardPage') {
    element = <LeaderboardPage />;
  } else {
    console.warn('[leaderboard-starter] Unknown component in workflow.json: ' + route.component);
  }
  return { name: route.name, path: route.path, element: element, requireAuth: route.requireAuth || false };
});

const SidebarWorkflows = workflowConfig.sidebarItems.map(function(item) {
  return { primaryText: item.primaryText, to: item.to, iconName: item.iconName, requireAuth: item.requireAuth || false };
});

const FooterButtons = [{
  pathname: '/leaderboard',
  element: <LeaderboardPageButtons />
}];

// MainPage override (path '/') preserved as a named export. NOT added to the
// default-export routes, so loading this starter via EXTRA_WORKFLOWS doesn't
// hijack the app homepage; hosts that want the override can read MainPage.
const MainPage = { name: 'Leaderboard', path: '/', element: <LeaderboardPage /> };

export { DynamicRoutes, SidebarWorkflows, FooterButtons, MainPage };

export default {
  name: workflowConfig.name,
  routes: DynamicRoutes,
  sidebarItems: SidebarWorkflows,
  footerButtons: FooterButtons
};
