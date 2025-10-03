// packages/reference-app/client/ReferenceAppPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

import { 
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Link
} from '@mui/material';

import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

import { get } from 'lodash';
import { useNavigate } from 'react-router-dom';

// =============================================================================
// ONC HEALTH IT CERTIFICATION CRITERIA
// =============================================================================

// Static tracking of certification implementation status
// Update these values as we implement each package/feature
// hasValidated indicates ONC has validated/tested our implementation
const CERTIFICATION_CRITERIA = [
  {
    id: '170.315(a)(1)',
    criterion: 'Computerized Provider Order Entry (CPOE) - Medications',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'order-catalog',
    link: '/order-catalog',
    guide: 'https://www.healthit.gov/test-method/computerized-provider-order-entry-cpoe-medications'
  },
  {
    id: '170.315(a)(2)', 
    criterion: 'CPOE - Laboratory',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'order-catalog',
    link: '/order-catalog',
    guide: 'https://www.healthit.gov/test-method/computerized-provider-order-entry-cpoe-laboratory'
  },
  {
    id: '170.315(a)(3)',
    criterion: 'CPOE - Diagnostic Imaging',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'order-catalog',
    link: '/order-catalog',
    guide: 'https://www.healthit.gov/test-method/computerized-provider-order-entry-cpoe-diagnostic-imaging'
  },
  {
    id: '170.315(a)(4)',
    criterion: 'Drug-Drug, Drug-Allergy Interaction Checks',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'drug-interactions',
    link: '/drug-interactions/drug-drug',
    guide: 'https://www.healthit.gov/test-method/drug-drug-drug-allergy-interaction-checks'
  },
  {
    id: '170.315(a)(5)',
    criterion: 'Demographics',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'honeycomb',
    guide: 'https://www.healthit.gov/test-method/demographics'
  },
  {
    id: '170.315(a)(9)',
    criterion: 'Clinical Decision Support',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'clinical-decision-support',
    guide: 'https://www.healthit.gov/test-method/clinical-decision-support'
  },
  {
    id: '170.315(a)(14)',
    criterion: 'Implantable Device List',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'implantable-devices',
    guide: 'https://www.healthit.gov/test-method/implantable-device-list'
  },
  {
    id: '170.315(b)(1)',
    criterion: 'Transitions of Care',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'pacio-core',
    guide: 'https://www.healthit.gov/test-method/transitions-care'
  },
  {
    id: '170.315(b)(2)',
    criterion: 'Clinical Information Reconciliation and Incorporation',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'clinical-reconciliation',
    guide: 'https://www.healthit.gov/test-method/clinical-information-reconciliation-and-incorporation'
  },
  {
    id: '170.315(b)(3)',
    criterion: 'Electronic Prescribing',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'e-prescribing',
    guide: 'https://www.healthit.gov/test-method/electronic-prescribing'
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
    guide: 'https://www.healthit.gov/test-method/data-export'
  },
  {
    id: '170.315(b)(7)',
    criterion: 'Security Tags - Summary of Care - Send',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'security-tags',
    guide: 'https://www.healthit.gov/test-method/security-tags-summary-care-send'
  },
  {
    id: '170.315(b)(8)',
    criterion: 'Security Tags - Summary of Care - Receive',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'security-tags',
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
    package: 'honeycomb',
    guide: 'https://www.healthit.gov/test-method/care-plan'
  },
  {
    id: '170.315(b)(10)',
    criterion: 'Electronic Health Information Export',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'data-exporter',
    guide: 'https://www.healthit.gov/test-method/electronic-health-information-export'
  },
  {
    id: '170.315(c)(1)',
    criterion: 'Clinical Quality Measures - Record and Export',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'cqm-reporting',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-cqms-record-and-export'
  },
  {
    id: '170.315(c)(2)',
    criterion: 'Clinical Quality Measures - Import and Calculate',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'cqm-calculation',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-cqms-import-and-calculate'
  },
  {
    id: '170.315(c)(3)',
    criterion: 'Clinical Quality Measures - Report',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'cqm-reporting',
    guide: 'https://www.healthit.gov/test-method/clinical-quality-measures-cqms-report'
  },
  {
    id: '170.315(d)(1)',
    criterion: 'Authentication, Access Control, Authorization',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'accounts-oauth',
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
    guide: 'https://www.healthit.gov/test-method/audit-reports'
  },
  {
    id: '170.315(d)(4)',
    criterion: 'Amendments',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'request-for-corrections',
    guide: 'https://www.healthit.gov/test-method/amendments'
  },
  {
    id: '170.315(d)(5)',
    criterion: 'Automatic Access Time-out',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'accounts-base',
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
    package: 'honeycomb',
    guide: 'https://www.healthit.gov/test-method/encryption-data-rest'
  },
  {
    id: '170.315(d)(7)',
    criterion: 'End-User Device Encryption',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'device-encryption',
    guide: 'https://www.healthit.gov/test-method/end-user-device-encryption'
  },
  {
    id: '170.315(d)(8)',
    criterion: 'Integrity',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'hipaa-compliance',
    guide: 'https://www.healthit.gov/test-method/integrity'
  },
  {
    id: '170.315(d)(9)',
    criterion: 'Trusted Connection',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'webapp',
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
    guide: 'https://www.healthit.gov/test-method/auditing-actions-health-information'
  },
  {
    id: '170.315(d)(12)',
    criterion: 'Encrypt Authentication Credentials',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'accounts-password',
    guide: 'https://www.healthit.gov/test-method/encrypt-authentication-credentials'
  },
  {
    id: '170.315(d)(13)',
    criterion: 'Multi-Factor Authentication',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'multi-factor-auth',
    guide: 'https://www.healthit.gov/test-method/multi-factor-authentication'
  },
  {
    id: '170.315(e)(1)',
    criterion: 'View, Download, and Transmit to 3rd Party',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'patient-portal',
    guide: 'https://www.healthit.gov/test-method/view-download-and-transmit-3rd-party'
  },
  {
    id: '170.315(e)(2)',
    criterion: 'Secure Messaging',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'secure-messaging',
    guide: 'https://www.healthit.gov/test-method/secure-messaging'
  },
  {
    id: '170.315(e)(3)',
    criterion: 'Patient Health Information Capture',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'patient-generated-data',
    guide: 'https://www.healthit.gov/test-method/patient-health-information-capture'
  },
  {
    id: '170.315(f)(1)',
    criterion: 'Transmission to Immunization Registries',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'immunization-registry',
    guide: 'https://www.healthit.gov/test-method/transmission-immunization-registries'
  },
  {
    id: '170.315(f)(2)',
    criterion: 'Transmission to Public Health Agencies - Syndromic Surveillance',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'public-health-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-syndromic-surveillance'
  },
  {
    id: '170.315(f)(3)',
    criterion: 'Transmission to Public Health Agencies - Reportable Laboratory Tests',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'lab-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-reportable-laboratory-tests-and-values-results'
  },
  {
    id: '170.315(f)(5)',
    criterion: 'Transmission to Public Health Agencies - Electronic Case Reporting',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'electronic-case-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-electronic-case-reporting'
  },
  {
    id: '170.315(f)(6)',
    criterion: 'Transmission to Public Health Agencies - Antimicrobial Use',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'antimicrobial-reporting',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-antimicrobial-use-and-resistance-reporting'
  },
  {
    id: '170.315(f)(7)',
    criterion: 'Transmission to Public Health Agencies - Health Care Surveys',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'healthcare-surveys',
    guide: 'https://www.healthit.gov/test-method/transmission-public-health-agencies-health-care-surveys'
  },
  {
    id: '170.315(g)(1)',
    criterion: 'Automated Numerator Recording',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'quality-measures',
    guide: 'https://www.healthit.gov/test-method/automated-numerator-recording'
  },
  {
    id: '170.315(g)(2)',
    criterion: 'Automated Measure Calculation',
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'quality-measures',
    guide: 'https://www.healthit.gov/test-method/automated-measure-calculation'
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
    hasAlgorithms: false,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'quality-management',
    guide: 'https://www.healthit.gov/test-method/quality-management-system'
  },
  {
    id: '170.315(g)(5)',
    criterion: 'Accessibility-Centered Design',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: false,
    hasValidated: false,
    package: 'honeycomb',
    guide: 'https://www.healthit.gov/test-method/accessibility-centered-design'
  },
  {
    id: '170.315(g)(6)',
    criterion: 'Consolidated CDA Creation Performance',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'ccda-export',
    guide: 'https://www.healthit.gov/test-method/consolidated-cda-creation-performance'
  },
  {
    id: '170.315(g)(7)',
    criterion: 'Application Access - Patient Selection',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-patient-selection'
  },
  {
    id: '170.315(g)(8)',
    criterion: 'Application Access - Data Category Request',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-data-category-request'
  },
  {
    id: '170.315(g)(9)',
    criterion: 'Application Access - All Data Request',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'smart-on-fhir',
    guide: 'https://www.healthit.gov/test-method/application-access-all-data-request'
  },
  {
    id: '170.315(g)(10)',
    criterion: 'Standardized API for Patient and Population Services',
    hasAlgorithms: true,
    isImplemented: true,
    isV3: true,
    hasTests: true,
    hasValidated: false,
    package: 'fhir-server',
    guide: 'https://www.healthit.gov/test-method/standardized-api-patient-and-population-services'
  },
  {
    id: '170.315(h)(1)',
    criterion: 'Direct Project',
    hasAlgorithms: true,
    isImplemented: false,
    isV3: false,
    hasTests: false,
    hasValidated: false,
    package: 'direct-messaging',
    guide: 'https://www.healthit.gov/test-method/direct-project'
  }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

function ReferenceAppPage(props) {
  console.log('ReferenceAppPage.render()', props);
  
  // Navigation
  const navigate = useNavigate();
  
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
    
    // Load initial data
    loadData();
    
    // Cleanup on unmount
    return () => {
      console.log('ReferenceAppPage.unmounted');
    };
  }, []);
  
  // =============================================================================
  // HANDLERS
  // =============================================================================
  
  function loadData() {
    setLoading(true);
    
    // Call server method
    Meteor.call('referenceApp.getData', selectedPatientId, (error, result) => {
      setLoading(false);
      
      if (error) {
        console.error('Error loading reference data:', error);
      } else {
        console.log('Loaded reference data:', result);
        setData(result);
      }
    });
  }
  
  // =============================================================================
  // RENDERING
  // =============================================================================
  
  // Determine layout
  let containerStyle = {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 20
  };
  
  // Admin mode adjustments
  if (props.adminMode) {
    containerStyle.backgroundColor = 'rgba(255, 0, 0, 0.05)';
  }
  
  return (
    <Box
      id="referenceAppPage"
      sx={{ 
        bgcolor: theme => theme.palette.mode === 'light' 
          ? theme.palette.grey[50]
          : theme.palette.background.default,
        minHeight: '100vh',
        pb: 4
      }}
    >
      <Container maxWidth="xl" style={containerStyle}>
        
        {/* Main Content */}
        <Box>
          <Card>
            <CardHeader 
              title="ONC Health IT Certification Program Tracker"
              subheader="2015 Edition Cures Update - Implementation Status"
            />
            <CardContent>
              {/* Progress Summary */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Overall Progress
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(CERTIFICATION_CRITERIA.filter(c => c.isImplemented).length / CERTIFICATION_CRITERIA.length) * 100}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {CERTIFICATION_CRITERIA.filter(c => c.isImplemented).length} of {CERTIFICATION_CRITERIA.length} criteria implemented
                  </Typography>
                </Box>
              </Box>

              {/* Certification Criteria Table */}
              <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="120">Criterion</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell width="200">Package</TableCell>
                      <TableCell width="80" align="center">Algorithms</TableCell>
                      <TableCell width="80" align="center">Implemented</TableCell>
                      <TableCell width="60" align="center">v3</TableCell>
                      <TableCell width="60" align="center">Tests</TableCell>
                      <TableCell width="80" align="center">Validated</TableCell>
                      <TableCell width="80" align="center">Guide</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {CERTIFICATION_CRITERIA.map((criterion) => (
                      <TableRow 
                        key={criterion.id}
                        sx={{ 
                          backgroundColor: theme => criterion.isImplemented 
                            ? theme.palette.action.hover 
                            : 'transparent'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {criterion.id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {criterion.criterion}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {criterion.link ? (
                            <Chip 
                              label={criterion.package}
                              size="small"
                              variant="outlined"
                              color={criterion.isImplemented ? "success" : "default"}
                              component="a"
                              href={criterion.link}
                              clickable
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(criterion.link);
                              }}
                            />
                          ) : (
                            <Chip 
                              label={criterion.package}
                              size="small"
                              variant="outlined"
                              color={criterion.isImplemented ? "success" : "default"}
                            />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {criterion.hasAlgorithms ? (
                            <CheckCircleIcon color="primary" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {criterion.isImplemented ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {criterion.isV3 ? (
                            <CheckCircleIcon color="info" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {criterion.hasTests ? (
                            <CheckCircleIcon color="warning" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {criterion.hasValidated ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <RadioButtonUncheckedIcon color="disabled" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton 
                            size="small"
                            component={Link}
                            href={criterion.guide}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Summary Stats */}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Clinical
                    </Typography>
                    <Typography variant="h4">
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(a)') && c.isImplemented).length}/
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(a)')).length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Security
                    </Typography>
                    <Typography variant="h4">
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(d)') && c.isImplemented).length}/
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(d)')).length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      API/FHIR
                    </Typography>
                    <Typography variant="h4">
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(g)') && c.isImplemented).length}/
                      {CERTIFICATION_CRITERIA.filter(c => c.id.includes('(g)')).length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Meteor v3
                    </Typography>
                    <Typography variant="h4">
                      {CERTIFICATION_CRITERIA.filter(c => c.isV3).length}/
                      {CERTIFICATION_CRITERIA.length}
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="outlined" sx={{ flex: 1, minWidth: 200 }}>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      Test Coverage
                    </Typography>
                    <Typography variant="h4">
                      {CERTIFICATION_CRITERIA.filter(c => c.hasTests).length}/
                      {CERTIFICATION_CRITERIA.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
      </Container>
    </Box>
  );
}

export default ReferenceAppPage;