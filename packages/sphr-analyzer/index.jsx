import React from 'react';

import FileAnalysisPage from './client/FileAnalysisPage';
import QualityChecksPage from './client/QualityChecksPage';


let DynamicRoutes = [{
  'name': 'FileAnalysisPage',
  'path': '/file-analysis',
  'element': <FileAnalysisPage />
}, {
  'name': 'QualityChecksPage',
  'path': '/quality-checks',
  'element': <QualityChecksPage />
}];



let SidebarElements = [];

let SidebarWorkflows = [{
  'primaryText': 'PHR Quality Checks',
  'to': '/quality-checks',
  'href': '/quality-checks'
}, {
  'primaryText': 'PHR File Analysis',
  'to': '/file-analysis',
  'href': '/file-analysis'
}];



export { SidebarWorkflows, SidebarElements, DynamicRoutes};
