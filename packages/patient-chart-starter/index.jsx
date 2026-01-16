import React from 'react';

import PatientChart from './client/PatientChart';

import { 
  PatientChartButtons
} from './client/FooterButtons';

let FooterButtons = [{
  pathname: '/patient-chart-starter',
  element: <PatientChartButtons />
}];

var DynamicRoutes = [{
  'name': 'Patient Chart',
  'path': '/patient-chart-starter',
  'element': <PatientChart />
}];

var SidebarElements = [];

let SidebarWorkflows = [];



const MainPage = {
  'name': 'Patient Chart',
  'path': '/',
  'element': <PatientChart />
};

export { 
  MainPage, 
  FooterButtons, 
  SidebarWorkflows, 
  SidebarElements, 
  DynamicRoutes
};
