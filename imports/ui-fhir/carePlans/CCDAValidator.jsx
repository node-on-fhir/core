// imports/ui-fhir/carePlans/CCDAValidator.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Button,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextareaAutosize,
  Paper,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Verified as ValidIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Description as DocumentIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Assessment as ComplianceIcon
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

// C-CDA R2.1 Validator for ONC 170.315(b)(9) compliance
export default function CCDAValidator({ 
  carePlanData, 
  patientData,
  onValidationComplete,
  onExportCCDA,
  readOnly = false 
}) {
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ccdaDocument, setCcdaDocument] = useState(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedError, setSelectedError] = useState(null);

  // C-CDA R2.1 validation rules per ONC requirements
  const requiredSections = {
    'healthStatusEvaluations': {
      name: 'Health Status Evaluations and Outcomes',
      templateId: '2.16.840.1.113883.10.20.22.2.61',
      required: true,
      description: 'Assessment of patient health status including outcomes and progress towards goals'
    },
    'interventions': {
      name: 'Interventions Section V2',
      templateId: '2.16.840.1.113883.10.20.21.2.3',
      required: true,
      description: 'Structured interventions including medications, procedures, and other treatments'
    },
    'goals': {
      name: 'Goals Section',
      templateId: '2.16.840.1.113883.10.20.22.2.60',
      required: true,
      description: 'Patient care goals and progress tracking'
    },
    'carePlan': {
      name: 'Care Plan Document',
      templateId: '2.16.840.1.113883.10.20.22.1.15',
      required: true,
      description: 'Care Plan Document template compliance'
    },
    'problemList': {
      name: 'Problem List',
      templateId: '2.16.840.1.113883.10.20.22.2.5.1',
      required: false,
      description: 'Patient problems and conditions'
    },
    'medications': {
      name: 'Medications Section',
      templateId: '2.16.840.1.113883.10.20.22.2.1.1',
      required: false,
      description: 'Current and historical medications'
    }
  };

  // Validation severity levels
  const severityLevels = {
    error: {
      icon: <ErrorIcon />,
      color: 'error',
      label: 'Error',
      description: 'Must be fixed for compliance'
    },
    warning: {
      icon: <WarningIcon />,
      color: 'warning', 
      label: 'Warning',
      description: 'Should be addressed'
    },
    info: {
      icon: <InfoIcon />,
      color: 'info',
      label: 'Information',
      description: 'Best practice recommendation'
    }
  };

  // Validate C-CDA compliance
  async function validateCCDA() {
    setLoading(true);
    try {
      // Generate C-CDA document from care plan data
      const ccdaXml = await generateCCDADocument();
      setCcdaDocument(ccdaXml);
      
      // Validate against C-CDA R2.1 schema and ONC requirements
      const results = await Meteor.callAsync('validateCCDACompliance', {
        ccdaXml,
        carePlanData,
        patientData,
        validationLevel: 'ONC_2015'
      });
      
      setValidationResults(results);
      onValidationComplete?.(results);
    } catch (error) {
      console.error('Error validating C-CDA:', error);
      setValidationResults({
        valid: false,
        errors: [{
          severity: 'error',
          message: 'Validation failed: ' + error.message,
          location: 'System'
        }]
      });
    } finally {
      setLoading(false);
    }
  }

  // Generate C-CDA document from care plan
  async function generateCCDADocument() {
    const ccdaData = {
      documentHeader: {
        id: get(carePlanData, 'id'),
        title: 'Care Plan Document',
        effectiveTime: moment().format('YYYYMMDDHHMMSS'),
        confidentialityCode: 'N',
        languageCode: 'en-US',
        setId: get(carePlanData, 'id'),
        versionNumber: '1'
      },
      patient: {
        id: get(patientData, 'id'),
        name: get(patientData, 'name[0]'),
        birthTime: get(patientData, 'birthDate'),
        administrativeGender: get(patientData, 'gender'),
        address: get(patientData, 'address[0]'),
        telecom: get(patientData, 'telecom')
      },
      sections: {
        healthStatusEvaluations: extractHealthStatusEvaluations(),
        interventions: extractInterventions(),
        goals: extractGoals(),
        problemList: extractProblemList(),
        medications: extractMedications()
      }
    };

    return await Meteor.callAsync('generateCCDAXML', ccdaData);
  }

  // Extract health status evaluations for C-CDA
  function extractHealthStatusEvaluations() {
    // This would extract observations, assessments, and outcomes
    // from the care plan activities and goals
    return get(carePlanData, 'activity', [])
      .filter(activity => activity.detail?.category?.coding?.[0]?.code === 'assessment')
      .map(activity => ({
        id: activity.id,
        code: activity.detail.code,
        value: activity.detail.outcomeValue,
        effectiveTime: activity.detail.scheduledPeriod?.start,
        interpretation: activity.detail.interpretation,
        referenceRange: activity.detail.referenceRange
      }));
  }

  // Extract interventions for C-CDA V2
  function extractInterventions() {
    return get(carePlanData, 'activity', [])
      .map(activity => ({
        id: activity.id,
        code: activity.detail?.code,
        status: activity.detail?.status,
        effectiveTime: activity.detail?.scheduledPeriod,
        performer: activity.detail?.performer,
        reason: activity.reason,
        outcome: activity.outcomeReference
      }));
  }

  // Extract goals
  function extractGoals() {
    return get(carePlanData, 'goal', [])
      .map(goal => ({
        id: goal.id,
        description: goal.description,
        category: goal.category,
        priority: goal.priority,
        start: goal.startDate,
        target: goal.target,
        status: goal.lifecycleStatus,
        achievementStatus: goal.achievementStatus
      }));
  }

  // Extract problem list
  function extractProblemList() {
    return get(carePlanData, 'addresses', [])
      .map(condition => ({
        id: condition.reference,
        code: condition.code,
        status: condition.clinicalStatus,
        onsetDate: condition.onsetDateTime,
        severity: condition.severity
      }));
  }

  // Extract medications
  function extractMedications() {
    return get(carePlanData, 'activity', [])
      .filter(activity => activity.detail?.productCodeableConcept)
      .map(activity => ({
        id: activity.id,
        medication: activity.detail.productCodeableConcept,
        dosage: activity.detail.dailyAmount,
        route: activity.detail.route,
        frequency: activity.detail.scheduledTiming,
        status: activity.detail.status
      }));
  }

  // Export validated C-CDA document
  async function handleExportCCDA() {
    if (!ccdaDocument) {
      await validateCCDA();
    }
    
    if (ccdaDocument) {
      // Create download
      const blob = new Blob([ccdaDocument], { type: 'text/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `care-plan-ccda-${moment().format('YYYY-MM-DD')}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onExportCCDA?.(ccdaDocument);
    }
  }

  // Get validation summary
  const validationSummary = validationResults ? {
    errors: validationResults.issues?.filter(i => i.severity === 'error').length || 0,
    warnings: validationResults.issues?.filter(i => i.severity === 'warning').length || 0,
    info: validationResults.issues?.filter(i => i.severity === 'info').length || 0,
    sectionsValid: validationResults.sectionsValid || 0,
    totalSections: Object.keys(requiredSections).length,
    overallValid: validationResults.valid
  } : null;

  // Render validation issue
  function renderValidationIssue(issue, index) {
    const severity = severityLevels[issue.severity] || severityLevels.info;
    
    return (
      <TableRow key={index}>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Box color={`${severity.color}.main`}>
              {severity.icon}
            </Box>
            <Chip
              label={severity.label}
              color={severity.color}
              size="small"
              variant="outlined"
            />
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2">
            {issue.message}
          </Typography>
          {issue.location && (
            <Typography variant="caption" color="text.secondary">
              Location: {issue.location}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {issue.section || 'Document'}
          </Typography>
        </TableCell>
        <TableCell>
          {issue.suggestion && (
            <Tooltip title={issue.suggestion}>
              <IconButton size="small" aria-label="Info">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
    );
  }

  // Render section compliance
  function renderSectionCompliance() {
    if (!validationResults) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Section Compliance Status
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(requiredSections).map(([key, section]) => {
            const sectionResult = validationResults.sections?.[key];
            const isValid = sectionResult?.valid !== false;
            const isRequired = section.required;
            
            return (
              <Grid item xs={12} md={6} key={key}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    border: 1,
                    borderColor: isValid ? 'success.main' : isRequired ? 'error.main' : 'warning.main'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Typography variant="subtitle2">
                      {section.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {isValid ? (
                        <PassIcon color="success" fontSize="small" />
                      ) : (
                        <FailIcon color={isRequired ? "error" : "warning"} fontSize="small" />
                      )}
                      <Chip
                        label={isRequired ? 'Required' : 'Optional'}
                        size="small"
                        color={isRequired ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Template ID: {section.templateId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {section.description}
                  </Typography>
                  
                  {sectionResult && sectionResult.issues && sectionResult.issues.length > 0 && (
                    <Box mt={1}>
                      <Typography variant="caption" color="error.main">
                        {sectionResult.issues.length} issue(s) found
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <ComplianceIcon color="primary" />
            <Typography variant="h6">C-CDA R2.1 Compliance Validation</Typography>
            {validationSummary && (
              <Chip
                label={validationSummary.overallValid ? 'Compliant' : 'Non-Compliant'}
                color={validationSummary.overallValid ? 'success' : 'error'}
                icon={validationSummary.overallValid ? <ValidIcon /> : <ErrorIcon />}
              />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={validateCCDA}
              disabled={loading}
            >
              Validate
            </Button>
            {ccdaDocument && (
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportCCDA}
                disabled={loading}
              >
                Export C-CDA
              </Button>
            )}
          </Box>
        </Box>

        {/* ONC Compliance Information */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>ONC 170.315(b)(9) C-CDA R2.1 Requirement:</strong> Care plans must be exportable 
            in C-CDA R2.1 format with Health Status Evaluations and Outcomes Section and 
            Interventions Section V2. Compliance deadline: December 31, 2025.
          </Typography>
        </Alert>

        {loading && (
          <Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              Validating C-CDA compliance...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {validationSummary && (
          <Box>
            {/* Validation Summary Dashboard */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Typography variant="h4" color="success.main">
                    {validationSummary.sectionsValid}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Valid Sections
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                  <Typography variant="h4" color="error.main">
                    {validationSummary.errors}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Errors
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Typography variant="h4" color="warning.main">
                    {validationSummary.warnings}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Warnings
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={2}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <Typography variant="h4" color="info.main">
                    {validationSummary.info}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Info
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  bgcolor: validationSummary.overallValid ? 'success.50' : 'error.50' 
                }}>
                  <Typography variant="h5" color={validationSummary.overallValid ? 'success.main' : 'error.main'}>
                    {validationSummary.overallValid ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Overall Status
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Section Compliance */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  Section Compliance ({validationSummary.sectionsValid}/{validationSummary.totalSections})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {renderSectionCompliance()}
              </AccordionDetails>
            </Accordion>

            {/* Validation Issues */}
            {validationResults.issues && validationResults.issues.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Validation Issues ({validationResults.issues.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Severity</TableCell>
                        <TableCell>Issue</TableCell>
                        <TableCell>Section</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResults.issues.map(renderValidationIssue)}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {!validationResults && !loading && (
          <Box textAlign="center" py={4}>
            <DocumentIcon color="disabled" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              C-CDA Validation Not Run
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Click "Validate" to check C-CDA R2.1 compliance and generate exportable document.
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon />}
              onClick={validateCCDA}
            >
              Run Validation
            </Button>
          </Box>
        )}

        {/* Quick Compliance Checklist */}
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            ONC 170.315(b)(9) Checklist
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <DocumentIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Care Plan Document Template"
                secondary="Uses C-CDA Care Plan Document template (2.16.840.1.113883.10.20.22.1.15)"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ComplianceIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Health Status Evaluations and Outcomes Section"
                secondary="Includes structured health evaluations and outcome tracking"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CodeIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Interventions Section V2"
                secondary="Uses updated Interventions Section template with enhanced data structure"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <ValidIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Structured Data Elements"
                secondary="All required data elements use appropriate vocabulary standards"
              />
            </ListItem>
          </List>
        </Box>
      </CardContent>
    </Card>
  );
}