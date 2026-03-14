// packages/international-patient-summary/index.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';

import InternationalPatientSummaryPage from './client/InternationalPatientSummaryPage';
import IpsContent from './client/IpsContent';
import { IPSFooterButtons } from './client/FooterButtons';

Meteor.startup(function(){
  Meteor.IpsContent = IpsContent;
});

let FooterButtons = [{
  pathname: '/international-patient-summary',
  element: <IPSFooterButtons />
}];

var DynamicRoutes = [{
  'name': 'International Patient Summary',
  'path': '/international-patient-summary',
  'element': <InternationalPatientSummaryPage />,
  'requireAuth': true
}];

var SidebarWorkflows = [{
  primaryText: "International Summary",
  to: '/international-patient-summary',
  iconName: 'map'
}];

var SidebarElements = [];

export {
  FooterButtons,
  SidebarWorkflows,
  SidebarElements,
  DynamicRoutes,
  IpsContent
};