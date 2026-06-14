// /packages/synthea/index.jsx
import React from 'react';

import SyntheaConfigurationPage from './client/SyntheaConfigurationPage';

var DynamicRoutes = [{
  'name': 'SyntheaConfiguration',
  'path': '/synthea-configuration',
  'element': <SyntheaConfigurationPage />
}];

let SidebarWorkflows = [{ 
  'primaryText': 'Synthea Configuration',
  'to': '/synthea-configuration',
  'href': '/synthea-configuration'
}];

var SidebarElements = [];

let FooterButtons = [];

export { 
  FooterButtons, 
  SidebarWorkflows, 
  SidebarElements, 
  DynamicRoutes
};