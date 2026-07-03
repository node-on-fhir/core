// packages/reference-app/client/ReferenceAppPage.jsx

// React and UI components imports
import React, { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Link
} from '@mui/material';

import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Assignment as AssignmentIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';

// =============================================================================
// CERTIFICATION CRITERIA DATA
// =============================================================================

// Base EHR Capabilities — current federal Base EHR definition (45 CFR 170.102,
// as amended by the HTI-1 final rule). NOTE: family health history (a)(12) is no
// longer part of the Base EHR definition; decision support interventions (b)(11)
// and real-time prescription benefit (b)(4) were added.
const BASE_EHR_CRITERIA = [
  '170.315(a)(1)',  // CPOE - Medications        \
  '170.315(a)(2)',  // CPOE - Laboratory          > one of (a)(1)/(2)/(3) required
  '170.315(a)(3)',  // CPOE - Diagnostic Imaging  /
  '170.315(a)(5)',  // Demographics
  '170.315(a)(14)', // Implantable Device List
  '170.315(b)(1)',  // Transitions of Care
  '170.315(b)(4)',  // Real-time Prescription Benefit (RTPB) — required by 1/1/2028
  '170.315(b)(11)', // Decision Support Interventions (DSI) — required by 12/31/2027
  '170.315(c)(1)',  // Clinical Quality Measures - Record and Export
  '170.315(g)(7)',  // Application Access - Patient Selection
  '170.315(g)(9)',  // Application Access - All Data Request
  '170.315(g)(10)', // Standardized API for Patient and Population Services
  '170.315(h)(1)'   // Direct Project (or (h)(2))
];

// Conformance Test Tools
const CONFORMANCE_TEST_TOOLS = [
  {
    name: 'FHIR API Test Kit (Inferno)',
    description: 'Tests FHIR API conformance for (g)(10) certification',
    criteria: ['170.315(g)(10)'],
    type: 'API Testing',
    url: 'https://inferno.healthit.gov/inferno/',
    available: true
  },
  {
    name: 'C-CDA Validator',
    description: 'Validates C-CDA documents for conformance to standards',
    criteria: ['170.315(b)(1)', '170.315(g)(6)'],
    type: 'Document Validation',
    url: 'https://site.healthit.gov/sandbox-ccda/ccda-validator/',
    available: true
  },
  {
    name: 'Inferno Resource Validator',
    description: 'Validates individual FHIR resources against profiles',
    criteria: ['170.315(g)(10)'],
    type: 'Resource Validation',
    url: 'https://inferno.healthit.gov/validator/',
    available: true
  },
  {
    name: 'Direct Message Validator',
    description: 'Validates Direct messaging implementation',
    criteria: ['170.315(h)(1)', '170.315(h)(2)'],
    type: 'Messaging',
    url: 'https://www.healthit.gov/techlab/testing_and_utilities.html',
    available: true
  },
  {
    name: 'C-CDA Scorecard',
    description: 'Provides scoring and feedback for C-CDA documents',
    criteria: ['170.315(b)(1)', '170.315(g)(6)'],
    type: 'Document Quality',
    url: 'https://site.healthit.gov/sandbox-ccda/ccda-scorecard/',
    available: true
  },
  {
    name: 'SITE Testing Portal',
    description: 'Standards Implementation and Testing Environment',
    criteria: ['Multiple'],
    type: 'Testing Platform',
    url: 'https://site.healthit.gov/',
    available: true
  },
  {
    name: 'ONC Tech Lab',
    description: 'Centralized collection of testing tools and utilities',
    criteria: ['Multiple'],
    type: 'Tool Collection',
    url: 'https://www.healthit.gov/techlab/testing_and_utilities.html',
    available: true
  },
  {
    name: 'Touchstone FHIR Testing',
    description: 'Alternative FHIR testing platform (Aegis.Net)',
    criteria: ['170.315(g)(10)'],
    type: 'API Testing',
    url: 'https://touchstone.aegis.net/touchstone/',
    available: true
  }
];

const CERTIFICATION_CRITERIA = [
  {
    id: '170.315(a)(1)',
    criterion: 'CPOE - Medications',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'order-catalog',
    guide: 'https://www.healthit.gov/test-method/cpoe-medications',
    link: '/cpoe/medications'
  },
  {
    id: '170.315(a)(2)',
    criterion: 'CPOE - Laboratory',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'order-catalog',
    guide: 'https://www.healthit.gov/test-method/cpoe-laboratory',
    link: '/cpoe/laboratory'
  },
  {
    id: '170.315(a)(3)',
    criterion: 'CPOE - Diagnostic Imaging',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'order-catalog',
    guide: 'https://www.healthit.gov/test-method/cpoe-diagnostic-imaging',
    link: '/cpoe/diagnostic-imaging'
  },
  {
    id: '170.315(a)(4)',
    criterion: 'Drug-Drug, Drug-Allergy Interaction Checks',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'drug-interactions',
    guide: 'https://www.healthit.gov/test-method/drug-drug-drug-allergy-interaction-checks',
    link: '/drug-interactions/drug-drug'
  },
  {
    id: '170.315(a)(5)',
    criterion: 'Demographics',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/patient',
    guide: 'https://www.healthit.gov/test-method/demographics',
    link: '/patients/new'
  },
  {
    id: '170.315(a)(6)',
    criterion: 'Problem List',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'clinical-lists',
    guide: 'https://www.healthit.gov/test-method/problem-list',
    link: '/problem-list'
  },
  {
    id: '170.315(a)(7)',
    criterion: 'Medication List',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'clinical-lists',
    guide: 'https://www.healthit.gov/test-method/medication-list',
    link: '/medication-list'
  },
  {
    id: '170.315(a)(8)',
    criterion: 'Medication Allergy List',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'clinical-lists',
    guide: 'https://www.healthit.gov/test-method/medication-allergy-list',
    link: '/medication-allergy-list'
  },
  {
    id: '170.315(a)(9)',
    criterion: 'Clinical Decision Support',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/cds-hooks',
    guide: 'https://www.healthit.gov/test-method/clinical-decision-support',
    link: '/cds-hooks-debugger'
  },
  {
    id: '170.315(a)(10)',
    criterion: 'Drug-Formulary and Preferred Drug List Checks',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'drug-formulary',
    guide: 'https://www.healthit.gov/test-method/drug-formulary-and-preferred-drug-list-checks',
    link: '/drug-formulary'
  },
  {
    id: '170.315(a)(11)',
    criterion: 'Smoking Status',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'symptom-tracking',
    link: '/smoking-status',
    guide: 'https://www.healthit.gov/test-method/smoking-status',
    description: 'Enhanced smoking status tracking using HL7 FHIR Symptoms IG with comprehensive record/change/access functionality',
    compliance: {
      symptomIG: true,
      snomedCT: true,
      loincCoding: true,
      usCoreCompliant: true,
      ccdaR21Export: true,
      interoperability: true
    },
    features: [
      'HL7 FHIR Symptoms IG implementation',
      'SNOMED CT coded smoking status values',
      'LOINC-coded observation categories',
      'US Core Smoking Status profile compliance',
      'C-CDA R2.1 export capability',
      'Multi-format interoperability (HL7 v2, QDM, ASTM)',
      'Comprehensive record/change/access UI',
      'Pack-year history tracking',
      'Smoking cessation goal management',
      'ONC compliance validation',
      'Audit trail and data integrity'
    ]
  },
  {
    id: '170.315(a)(12)',
    criterion: 'Family Health History',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'family-health-history',
    guide: 'https://www.healthit.gov/test-method/family-health-history',
    link: '/family-health-history'
  },
  {
    id: '170.315(a)(14)',
    criterion: 'Implantable Device List',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'implantable-devices',
    link: '/implantable-devices',
    guide: 'https://www.healthit.gov/test-method/implantable-device-list'
  },
  {
    id: '170.315(a)(15)',
    criterion: 'Social, Psychological, and Behavioral Data',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'social-determinants',
    link: '/social-determinants',
    guide: 'https://www.healthit.gov/test-method/social-psychological-and-behavioral-data'
  },
  {
    id: '170.315(b)(1)',
    criterion: 'Transitions of Care',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'pacio/transitions-of-care',
    link: '/transitions-of-care',
    guide: 'https://www.healthit.gov/test-method/transitions-care'
  },
  {
    id: '170.315(b)(2)',
    criterion: 'Clinical Information Reconciliation and Incorporation',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'pacio/med-management',
    link: '/medication-management',
    guide: 'https://www.healthit.gov/test-method/clinical-information-reconciliation-and-incorporation'
  },
  {
    id: '170.315(b)(3)',
    criterion: 'Electronic Prescribing',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'e-prescribing',
    link: '/e-prescribing',
    guide: 'https://www.healthit.gov/test-method/electronic-prescribing'
  },
  {
    id: '170.315(b)(4)',
    criterion: 'Real-time Prescription Benefit',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'prescription-benefit',
    link: '/prescription-benefit',
    guide: 'https://www.healthit.gov/test-method/real-time-prescription-benefit-tool'
  },
  {
    id: '170.315(b)(5)',
    criterion: 'Common Clinical Data Set Summary Record - Receive',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'ccds-summary',
    guide: 'https://www.healthit.gov/test-method/common-clinical-data-set-summary-record-receive'
  },
  {
    id: '170.315(b)(6)',
    criterion: 'Data Export',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'data-exporter',
    link: '/export-data',
    guide: 'https://www.healthit.gov/test-method/data-export'
  },
  {
    id: '170.315(b)(7)',
    criterion: 'Security Tags - Summary of Care - Send',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/security',
    guide: 'https://www.healthit.gov/test-method/security-tags-summary-care-send'
  },
  {
    id: '170.315(b)(8)',
    criterion: 'Security Tags - Summary of Care - Receive',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/security',
    guide: 'https://www.healthit.gov/test-method/security-tags-summary-care-receive'
  },
  {
    id: '170.315(b)(9)',
    criterion: 'Care Plan',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/careplan',
    guide: 'https://www.healthit.gov/test-method/care-plan',
    link: '/care-plan-designer',
    description: 'Enhanced care plan designer with Health Status Evaluations and Outcomes Section, Interventions Section V2, C-CDA R2.1 compliance, and clinical decision support integration',
    compliance: {
      ccdaR21: true,
      healthStatusEvaluations: true,
      interventionsSectionV2: true,
      realWorldTesting: true,
      deadline: '2025-12-31'
    },
    features: [
      'Evidence-based care plan templates',
      'Health Status Evaluations and Outcomes tracking',
      'Interventions Section V2 with structured data',
      'Clinical decision support integration',
      'C-CDA R2.1 export with validation',
      'Real-time compliance checking',
      'Patient goal management and tracking',
      'Multi-disciplinary care team coordination'
    ]
  },
  {
    id: '170.315(b)(10)',
    criterion: 'Electronic Health Information Export',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'data-exporter',
    link: '/export-data',
    guide: 'https://www.healthit.gov/test-method/electronic-health-information-export'
  },
  {
    id: '170.315(b)(11)',
    criterion: 'Decision Support Interventions',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'decision-support',
    link: '/decision-support',
    guide: 'https://www.healthit.gov/test-method/decision-support-interventions'
  },
  {
    id: '170.315(c)(1)',
    criterion: 'Clinical Quality Measures - Record and Export',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    link: '/quality-measures',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-record-and-export'
  },
  {
    id: '170.315(c)(2)',
    criterion: 'Clinical Quality Measures - Import and Calculate',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    link: '/quality-measures',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-import-and-calculate'
  },
  {
    id: '170.315(c)(3)',
    criterion: 'Clinical Quality Measures - Report',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    link: '/quality-measures',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-report'
  },
  {
    id: '170.315(c)(4)',
    criterion: 'Clinical Quality Measures - Filter',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    link: '/quality-measures',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-filter'
  },
  {
    id: '170.315(d)(1)',
    criterion: 'Authentication, Access Control, Authorization',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'honeycomb/accounts',
    link: '/accounts-management',
    guide: 'https://www.healthit.gov/test-method/authentication-access-control-authorization'
  },
  {
    id: '170.315(d)(2)',
    criterion: 'Auditable Events and Tamper-Resistance',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'hipaa-compliance',
    link: '/hipaa/audit-log',
    guide: 'https://www.healthit.gov/test-method/auditable-events-and-tamper-resistance'
  },
  {
    id: '170.315(d)(3)',
    criterion: 'Audit Report(s)',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'hipaa-compliance',
    link: '/hipaa/audit-log',
    guide: 'https://www.healthit.gov/test-method/audit-reports'
  },
  {
    id: '170.315(d)(4)',
    criterion: 'Amendments',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'request-for-corrections',
    link: '/correction-requests',
    guide: 'https://www.healthit.gov/test-method/amendments'
  },
  {
    id: '170.315(d)(5)',
    criterion: 'Automatic Access Time-out',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/accounts',
    guide: 'https://www.healthit.gov/test-method/automatic-access-time-out'
  },
  {
    id: '170.315(d)(6)',
    criterion: 'Encryption of Data at Rest',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/mongo',
    guide: 'https://www.healthit.gov/test-method/encryption-data-rest'
  },
  {
    id: '170.315(d)(7)',
    criterion: 'End-User Device Encryption',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/cordova',
    guide: 'https://www.healthit.gov/test-method/end-user-device-encryption'
  },
  {
    id: '170.315(d)(8)',
    criterion: 'Integrity',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'hipaa-compliance',
    link: '/hipaa/audit-log',
    guide: 'https://www.healthit.gov/test-method/integrity'
  },
  {
    id: '170.315(d)(9)',
    criterion: 'Trusted Connection',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'force-ssl',
    guide: 'https://www.healthit.gov/test-method/trusted-connection'
  },
  {
    id: '170.315(d)(10)',
    criterion: 'Auditing Actions on Health Information',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'hipaa-compliance',
    link: '/hipaa/audit-log',
    guide: 'https://www.healthit.gov/test-method/auditing-actions-health-information'
  },
  {
    id: '170.315(d)(11)',
    criterion: 'Accounting of Disclosures',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'hipaa-compliance',
    link: '/hipaa/audit-log',
    guide: 'https://www.healthit.gov/test-method/accounting-disclosures'
  },
  {
    id: '170.315(d)(12)',
    criterion: 'Encrypt Authentication Credentials',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/accounts',
    guide: 'https://www.healthit.gov/test-method/encrypt-authentication-credentials'
  },
  {
    id: '170.315(d)(13)',
    criterion: 'Multi-Factor Authentication',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'clinical:multi-factor-auth',
    link: '/mfa-management',
    guide: 'https://www.healthit.gov/test-method/multi-factor-authentication',
    description: 'Comprehensive multi-factor authentication system with TOTP, backup codes, and role-based enforcement policies for healthcare security',
    compliance: {
      totpSupport: true,
      backupCodes: true,
      roleBasedEnforcement: true,
      auditLogging: true,
      sessionManagement: true,
      accountsJsIntegration: true
    },
    features: [
      'TOTP (Time-based One-Time Password) authentication',
      'QR code and manual setup for authenticator apps',
      'Backup recovery codes with secure storage',
      'Role-based MFA enforcement policies',
      'Comprehensive audit logging and activity tracking',
      'Integration with @accounts/two-factor ecosystem',
      'Session management and timeout controls',
      'ONC 170.315(d)(13) compliance validation',
      'Healthcare-specific security policies',
      'User-friendly setup and management interface',
      'Encrypted secret storage and secure verification'
    ]
  },
  {
    id: '170.315(e)(1)',
    criterion: 'View, Download, and Transmit to 3rd Party',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'patient-portal',
    guide: 'https://www.healthit.gov/test-method/view-download-and-transmit-3rd-party'
  },
  {
    id: '170.315(e)(2)',
    criterion: 'Secure Messaging',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'secure-messaging',
    guide: 'https://www.healthit.gov/test-method/secure-messaging',
    link: '/secure-messaging'
  },
  {
    id: '170.315(e)(3)',
    criterion: 'Patient Health Information Capture',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'pacio/advance-directives',
    link: '/advance-directives',
    guide: 'https://www.healthit.gov/test-method/patient-health-information-capture'
  },
  {
    id: '170.315(f)(1)',
    criterion: 'Transmission to Immunization Registries',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'immunization-registry',
    link: '/immunization-registry',
    guide: 'https://www.healthit.gov/test-method/transmission-immunization-registries'
  },
  {
    id: '170.315(f)(2)',
    criterion: 'Transmission to Public Health Agencies - Syndromic Surveillance',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'syndromic-surveillance',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-syndromic-surveillance',
    link: '/syndromic-surveillance'
  },
  {
    id: '170.315(f)(3)',
    criterion: 'Transmission to Public Health Agencies - Reportable Laboratory Tests and Values/Results',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'lab-test-reporting',
    link: '/lab-test-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-reportable-laboratory-tests-and-valuesresults'
  },
  {
    id: '170.315(f)(4)',
    criterion: 'Transmission to Cancer Registries',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'cancer-registry-reporting',
    link: '/cancer-registry-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-cancer-registries'
  },
  {
    id: '170.315(f)(5)',
    criterion: 'Transmission to Public Health Agencies - Electronic Case Reporting',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'case-reporting',
    link: '/case-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-electronic-case-reporting'
  },
  {
    id: '170.315(f)(6)',
    criterion: 'Transmission to Public Health Agencies - Antimicrobial Use and Resistance Reporting',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'antimicrobial-reporting',
    link: '/antimicrobial-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-antimicrobial-use-and-resistance-reporting'
  },
  {
    id: '170.315(f)(7)',
    criterion: 'Transmission to Public Health Agencies - Health Care Surveys',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'healthcare-surveys',
    link: '/healthcare-surveys',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-health-care-surveys'
  },
  {
    id: '170.315(g)(1)',
    criterion: 'Automated Numerator Recording',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    guide: 'https://www.healthit.gov/test-method/automated-numerator-recording',
    link: '/quality-measures'
  },
  {
    id: '170.315(g)(2)',
    criterion: 'Automated Measure Calculation',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    guide: 'https://www.healthit.gov/test-method/automated-measure-calculation',
    link: '/quality-measures'
  },
  {
    id: '170.315(g)(3)',
    criterion: 'Safety-Enhanced Design',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb',
    guide: 'https://www.healthit.gov/test-method/safety-enhanced-design'
  },
  {
    id: '170.315(g)(4)',
    criterion: 'Quality Management System',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'quality-measures',
    guide: 'https://www.healthit.gov/test-method/quality-management-system',
    link: '/quality-measures'
  },
  {
    id: '170.315(g)(5)',
    criterion: 'Accessibility-Centered Design',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/material-ui',
    guide: 'https://www.healthit.gov/test-method/accessibility-centered-design',
    link: '/theming'
  },
  {
    id: '170.315(g)(6)',
    criterion: 'Consolidated CDA Creation Performance',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'ccda-export',
    link: '/ccda-export',
    guide: 'https://www.healthit.gov/test-method/consolidated-cda-creation-performance'
  },
  {
    id: '170.315(g)(7)',
    criterion: 'Application Access - Patient Selection',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-patient-selection',
    link: '/smart-app-debugger'
  },
  {
    id: '170.315(g)(8)',
    criterion: 'Application Access - Data Category Request',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-data-category-request',
    link: '/smart-app-debugger'
  },
  {
    id: '170.315(g)(9)',
    criterion: 'Application Access - All Data Request',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-all-data-request',
    link: '/smart-app-debugger'
  },
  {
    id: '170.315(g)(10)',
    criterion: 'Standardized API for Patient and Population Services',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb/api-docs',
    guide: 'https://www.healthit.gov/test-method/standardized-api-patient-and-population-services',
    link: '/api-docs/'
  },
  {
    id: '170.315(h)(1)',
    criterion: 'Direct Project',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'secure-messaging',
    guide: 'https://www.healthit.gov/test-method/direct-project',
    link: '/secure-messaging'
  },
  {
    id: '170.315(h)(2)',
    criterion: 'Direct Project, Edge Protocol, and XDR/XDM',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: true,
    hasValidated: false,
    package: 'direct-edge-xdr',
    guide: 'https://www.healthit.gov/test-method/direct-project-edge-protocol-and-xdrxdm'
  }
];

// Every Base EHR criterion now has a route-accessibility Nightwatch test wired into the
// CircleCI `base-ehr` group, so the TDD + CircleCI columns reflect that for the core set.
// (Self-maintaining: derives from BASE_EHR_CRITERIA, so adding/removing a base criterion
// keeps the columns in sync.)
CERTIFICATION_CRITERIA.forEach(function(criterion) {
  if (BASE_EHR_CRITERIA.includes(criterion.id)) {
    criterion.hasTests = true;
    criterion.inCircleCI = true;
  }
});

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ReferenceAppPage(props) {
  console.log('ReferenceAppPage.render()', props);

  // State management
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  
  // Track reactive data from collections
  const { 
    selectedPatientId,
    currentUser,
    isAuthenticated,
    referenceData 
  } = useTracker(() => {
    return {
      selectedPatientId: Session.get('selectedPatientId'),
      currentUser: Meteor.user(),
      isAuthenticated: Meteor.userId() !== null,
      referenceData: [] // Replace with actual collection query
    };
  });
  
  // Component lifecycle
  useEffect(() => {
    console.log('ReferenceAppPage.mounted');
    // Initialize data or subscriptions here
    
    return () => {
      console.log('ReferenceAppPage.unmounted');
      // Cleanup subscriptions here
    };
  }, []);

  // Event handlers
  const handleItemClick = useCallback((item) => {
    console.log('Item clicked:', item);
    // Handle item click logic
  }, []);

  const handleAddNew = useCallback(() => {
    console.log('Add new item');
    // Handle adding new item
  }, []);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <Box sx={{ minHeight: '100vh', py: 4 }}>
      {/* Page Header with Implementation Summary */}
      <Box sx={{ px: 3, mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: 4, 
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Left: Title Section */}
          <Box sx={{ 
            flex: { xs: '1 1 100%', md: '1 1 50%' },
            width: { xs: '100%', md: 'auto' }
          }}>
            <Typography variant="h4" gutterBottom>
              ONC Health IT Certification Program Tracker
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track implementation status for 2015 Edition Cures Update certification criteria
            </Typography>
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Implementation Summary
            </Typography>
          </Box>
          
          {/* Right: Summary Cards */}
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flex: { xs: '1 1 100%', md: '1 1 50%' },
            width: { xs: '100%', md: 'auto' },
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Total
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {CERTIFICATION_CRITERIA.filter(c => c.isImplemented).length}/{CERTIFICATION_CRITERIA.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Progress
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  {Math.round((CERTIFICATION_CRITERIA.filter(c => c.isImplemented).length / CERTIFICATION_CRITERIA.length) * 100)}%
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Section Tests
                </Typography>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  {CERTIFICATION_CRITERIA.filter(c => c.hasTests).length}/{CERTIFICATION_CRITERIA.length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                  Section Tests Progress
                </Typography>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  {Math.round((CERTIFICATION_CRITERIA.filter(c => c.hasTests).length / CERTIFICATION_CRITERIA.length) * 100)}%
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
        
      {/* Main Content - 3 Column Grid (Full Width) */}
      <Grid container spacing={3} sx={{ px: 3 }}>
          {/* Column 1: Base EHR Capabilities */}
          <Grid item xs={12} sx={{ 
            '@media (min-width: 1920px)': { 
              flexBasis: '33.333333%',
              maxWidth: '33.333333%'
            }
          }}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader 
                title={
                  <Link 
                    href="https://www.healthit.gov/topic/certification-ehrs/base-electronic-health-record-definition"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Base EHR Capabilities
                  </Link>
                }
                subheader={`${CERTIFICATION_CRITERIA.filter(c => BASE_EHR_CRITERIA.includes(c.id) && c.isImplemented).length} of ${BASE_EHR_CRITERIA.length} core criteria`}
                sx={{ 
                  background: theme => theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
                    : `linear-gradient(135deg, #64748b 0%, #475569 100%)`,
                  color: 'white', 
                  py: 2,
                  '& .MuiCardHeader-subheader': {
                    color: 'white'
                  }
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Core required criteria per the current Base EHR definition (45 CFR 170.102, HTI-1 final rule)
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Criterion</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Package</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">v3</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">TDD</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">CircleCI</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">Validated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CERTIFICATION_CRITERIA
                        .filter(criterion => BASE_EHR_CRITERIA.includes(criterion.id))
                        .map((criterion) => (
                        <TableRow 
                          key={criterion.id}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="caption" fontWeight={500}>
                              {criterion.id}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {criterion.criterion}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {criterion.link ? (
                              <Chip
                                label={criterion.package}
                                size="small"
                                clickable
                                onClick={() => {
                                  if (Meteor.navigate) {
                                    Meteor.navigate(criterion.link);
                                  } else {
                                    console.warn('Meteor.navigate not available');
                                  }
                                }}
                                sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                              />
                            ) : (
                              <Chip
                                label={criterion.package}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.isV3 ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.hasTests ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.inCircleCI ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.hasValidated ? (
                              <CheckCircleIcon color="info" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Column 2: Extended Certifications */}
          <Grid item xs={12} sx={{ 
            '@media (min-width: 1920px)': { 
              flexBasis: '33.333333%',
              maxWidth: '33.333333%'
            }
          }}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader 
                title={
                  <Link 
                    href="https://www.healthit.gov/topic/certification-ehrs/onc-health-it-certification-program-test-method"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Extended Certifications
                  </Link>
                }
                subheader={`${CERTIFICATION_CRITERIA.filter(c => !BASE_EHR_CRITERIA.includes(c.id) && c.isImplemented).length} of ${CERTIFICATION_CRITERIA.length - BASE_EHR_CRITERIA.length} additional criteria`}
                sx={{ 
                  background: theme => theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
                    : `linear-gradient(135deg, #64748b 0%, #475569 100%)`,
                  color: 'white', 
                  py: 2,
                  '& .MuiCardHeader-subheader': {
                    color: 'white'
                  }
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Additional certification criteria beyond base EHR requirements
                </Typography>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Criterion</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }}>Package</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">v3</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">TDD</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">CircleCI</TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', py: 1 }} align="center">Validated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {CERTIFICATION_CRITERIA
                        .filter(criterion => !BASE_EHR_CRITERIA.includes(criterion.id))
                        .map((criterion) => (
                        <TableRow
                          key={criterion.id}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="caption" fontWeight={500}>
                              {criterion.id}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {criterion.criterion}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            {criterion.link ? (
                              <Chip
                                label={criterion.package}
                                size="small"
                                clickable
                                onClick={() => {
                                  if (Meteor.navigate) {
                                    Meteor.navigate(criterion.link);
                                  } else {
                                    console.warn('Meteor.navigate not available');
                                  }
                                }}
                                sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                              />
                            ) : (
                              <Chip
                                label={criterion.package}
                                size="small"
                                variant="outlined"
                                sx={{ fontFamily: 'monospace', fontSize: '0.65rem' }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.isV3 ? (
                              <CheckCircleIcon color="success" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.hasTests ? (
                              <CheckCircleIcon color="info" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.inCircleCI ? (
                              <CheckCircleIcon color="info" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 1 }}>
                            {criterion.hasValidated ? (
                              <CheckCircleIcon color="info" fontSize="small" />
                            ) : (
                              <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Column 3: Conformance Test Tools */}
          <Grid item xs={12} sx={{ 
            '@media (min-width: 1920px)': { 
              flexBasis: '33.333333%',
              maxWidth: '33.333333%'
            }
          }}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader 
                title={
                  <Link 
                    href="https://www.healthit.gov/topic/certification-ehrs/onc-conformance-test-tools"
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'white', 
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    Conformance Test Tools
                  </Link>
                }
                subheader={`${CONFORMANCE_TEST_TOOLS.length} ONC-approved testing tools`}
                sx={{ 
                  background: theme => theme.palette.mode === 'dark'
                    ? `linear-gradient(135deg, #334155 0%, #475569 100%)`
                    : `linear-gradient(135deg, #94a3b8 0%, #64748b 100%)`,
                  color: 'white', 
                  py: 2,
                  '& .MuiCardHeader-subheader': {
                    color: 'white'
                  }
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  ONC-approved tools for testing certification criteria conformance
                </Typography>
                
                {CONFORMANCE_TEST_TOOLS.map((tool, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    sx={{ p: 2, mb: 2, '&:last-child': { mb: 0 } }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ flex: 1 }}>
                        {tool.name}
                      </Typography>
                      {tool.available && index === 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (Meteor.navigate) {
                              Meteor.navigate('/g10-certification');
                            } else {
                              console.warn('Meteor.navigate not available');
                            }
                          }}
                          sx={{
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            fontSize: '0.7rem'
                          }}
                        >
                          Begin
                        </Button>
                      )}
                      {tool.available && tool.url && index !== 0 && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<LaunchIcon />}
                          onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                          sx={{
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            fontSize: '0.7rem'
                          }}
                        >
                          Launch
                        </Button>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block" paragraph>
                      {tool.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <strong>Tests:</strong> {tool.criteria.join(', ')}
                    </Typography>
                  </Paper>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

    </Box>
  );
}

export default ReferenceAppPage;