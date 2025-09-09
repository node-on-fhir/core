// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/index.jsx

// Client entry point
export { ConsentGeneratorPage } from './client/ConsentGeneratorPage.jsx';

// Dynamic route for Honeycomb
export const DynamicRoutes = [{
  name: 'ConsentGenerator',
  path: '/consent-generator',
  element: React.createElement(ConsentGeneratorPage),
  requireAuth: false  // Allow access in development
}];

// Add to sidebar for easy access
export const SidebarWorkflows = [{
  primaryText: "Consent Generator",
  to: '/consent-generator',
  iconName: 'shield'
}];