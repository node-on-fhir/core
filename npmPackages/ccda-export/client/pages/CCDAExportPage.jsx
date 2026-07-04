// packages/clinical-documents/client/pages/CCDAExportPage.jsx

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent,
  CardHeader,
  Grid,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Paper,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  LinearProgress,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';
import {
  Download as DownloadIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Description as DocumentIcon,
  ExpandMore as ExpandMoreIcon,
  Preview as PreviewIcon,
  Code as CodeIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  CloudDownload as ExportIcon,
  Assignment as TaskIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';

// Document types with their LOINC codes
const DOCUMENT_TYPES = [
  { code: '34133-9', display: 'Summary of Episode Note (CCD)', abbreviation: 'CCD', sections: 14 },
  { code: '57133-1', display: 'Referral Note', abbreviation: 'RN', sections: 10 },
  { code: '18842-5', display: 'Discharge Summary', abbreviation: 'DS', sections: 12 },
  { code: '11488-4', display: 'Consultation Note', abbreviation: 'CN', sections: 11 },
  { code: '34117-2', display: 'History and Physical', abbreviation: 'H&P', sections: 13 },
  { code: '11504-8', display: 'Operative Note', abbreviation: 'OP', sections: 8 },
  { code: '11506-3', display: 'Progress Note', abbreviation: 'PN', sections: 7 },
  { code: '28570-0', display: 'Procedure Note', abbreviation: 'Proc', sections: 9 },
  { code: '18761-7', display: 'Transfer Summary', abbreviation: 'TS', sections: 11 },
  { code: '52521-2', display: 'Care Plan', abbreviation: 'CP', sections: 6 }
];

// Required sections for ONC certification
const REQUIRED_SECTIONS = {
  'CCD': ['Allergies', 'Medications', 'Problems', 'Procedures', 'Results', 'Encounters', 'Immunizations', 'Vital Signs', 'Social History', 'Plan of Care'],
  'RN': ['Allergies', 'Medications', 'Problems', 'Reason for Referral', 'Procedures', 'Results'],
  'DS': ['Allergies', 'Discharge Medications', 'Hospital Course', 'Discharge Diagnosis', 'Discharge Instructions', 'Follow-up']
};

export default function CCDAExportPage(props) {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [documentType, setDocumentType] = useState('34133-9'); // Default to CCD
  const [exportFormat, setExportFormat] = useState('xml');
  const [includeNarrative, setIncludeNarrative] = useState(true);
  const [validateDocument, setValidateDocument] = useState(true);
  const [selectedSections, setSelectedSections] = useState({});
  const [exportStatus, setExportStatus] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [previewContent, setPreviewContent] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  
  // Sample patient data for demonstration
  const samplePatients = [
    { id: '1', name: 'John Doe', mrn: '12345', dob: '1970-01-15', gender: 'Male' },
    { id: '2', name: 'Jane Smith', mrn: '67890', dob: '1985-06-20', gender: 'Female' },
    { id: '3', name: 'Robert Johnson', mrn: '11223', dob: '1955-11-30', gender: 'Male' }
  ];

  // Initialize selected sections based on document type
  useEffect(() => {
    const docType = DOCUMENT_TYPES.find(d => d.code === documentType);
    if (docType && REQUIRED_SECTIONS[docType.abbreviation]) {
      const sections = {};
      REQUIRED_SECTIONS[docType.abbreviation].forEach(section => {
        sections[section] = true;
      });
      setSelectedSections(sections);
    }
  }, [documentType]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setExportStatus(null);
    setValidationResults(null);
  };

  const handleGenerateDocument = async () => {
    if (!selectedPatient) {
      setExportStatus({ type: 'error', message: 'Please select a patient' });
      return;
    }

    setExportStatus({ type: 'info', message: 'Generating C-CDA document...' });
    setExportProgress(0);

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setExportProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      // Call server method to generate CCDA
      Meteor.call('clinicalDocuments.generateCCDA', {
        patientId: selectedPatient.id,
        documentType: documentType,
        format: exportFormat,
        includeNarrative: includeNarrative,
        validateDocument: validateDocument,
        sections: selectedSections
      }, (error, result) => {
        clearInterval(progressInterval);
        setExportProgress(100);

        if (error) {
          console.error('Error generating CCDA:', error);
          setExportStatus({ 
            type: 'error', 
            message: 'Failed to generate document: ' + error.message 
          });
        } else {
          console.log('CCDA generated:', result);
          setExportStatus({ 
            type: 'success', 
            message: 'Document generated successfully!' 
          });
          setPreviewContent(result.content);
          setValidationResults(result.validation);
          
          // Trigger download if requested
          if (result.downloadUrl) {
            downloadDocument(result.downloadUrl, result.filename);
          }
        }
      });
    } catch (error) {
      clearInterval(progressInterval);
      setExportProgress(0);
      setExportStatus({ 
        type: 'error', 
        message: 'An unexpected error occurred' 
      });
    }
  };

  const downloadDocument = (content, filename) => {
    const blob = new Blob([content], { 
      type: exportFormat === 'xml' ? 'application/xml' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `CCDA_${selectedPatient.mrn}_${new Date().toISOString()}.${exportFormat}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Receive an inbound C-CDA (ONC §170.315(b)(1) receive/validate/display):
  // read the uploaded XML and hand it to the server for parse/validate/store.
  const handleReceiveFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = () => {
      const xml = String(reader.result || '');
      Meteor.call('clinicalDocuments.receiveCCDA', xml, (error, result) => {
        if (error) {
          setExportStatus({ type: 'error', message: 'Receive failed: ' + (error.reason || error.message) });
        } else {
          setExportStatus({
            type: 'success',
            message: `Received C-CDA (${get(result, 'sections.length', 0)} sections) — view it in Clinical Documents.`
          });
        }
      });
    };
    reader.readAsText(file);
    event.target.value = ''; // allow re-selecting the same file
  };

  const getSectionCount = () => {
    return Object.values(selectedSections).filter(v => v).length;
  };

  const getDocumentTypeInfo = () => {
    return DOCUMENT_TYPES.find(d => d.code === documentType);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: theme => theme.palette.mode === 'light' 
        ? theme.palette.grey[50] 
        : theme.palette.background.default,
      p: 3
    }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        C-CDA Document Export - ONC §170.315(b)(1)
      </Typography>

      <Grid container spacing={3}>
        {/* Left Panel - Configuration */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Patient Selection */}
            <Card>
              <CardHeader 
                title="Patient Selection"
                avatar={<PersonIcon />}
              />
              <CardContent>
                <List dense>
                  {samplePatients.map((patient) => (
                    <ListItem
                      key={patient.id}
                      button
                      selected={selectedPatient?.id === patient.id}
                      onClick={() => handlePatientSelect(patient)}
                    >
                      <ListItemIcon>
                        <PersonIcon color={selectedPatient?.id === patient.id ? "primary" : "inherit"} />
                      </ListItemIcon>
                      <ListItemText
                        primary={patient.name}
                        secondary={`MRN: ${patient.mrn} | DOB: ${patient.dob}`}
                      />
                      {selectedPatient?.id === patient.id && (
                        <ListItemSecondaryAction>
                          <CheckIcon color="primary" />
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>

            {/* Document Configuration */}
            <Card>
              <CardHeader 
                title="Document Configuration"
                avatar={<SettingsIcon />}
              />
              <CardContent>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Document Type</InputLabel>
                    <Select
                      value={documentType}
                      label="Document Type"
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <MenuItem key={type.code} value={type.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <Chip label={type.abbreviation} size="small" color="primary" />
                            <Typography variant="body2">{type.display}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {type.sections} sections
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl>
                    <Typography variant="body2" gutterBottom>Export Format</Typography>
                    <RadioGroup
                      row
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                    >
                      <FormControlLabel value="xml" control={<Radio size="small" />} label="XML (C-CDA)" />
                      <FormControlLabel value="json" control={<Radio size="small" />} label="JSON (FHIR)" />
                    </RadioGroup>
                  </FormControl>

                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={includeNarrative} 
                        onChange={(e) => setIncludeNarrative(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Include Narrative Sections"
                  />

                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={validateDocument} 
                        onChange={(e) => setValidateDocument(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Validate Against Schematron"
                  />
                </Stack>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<ExportIcon />}
                    onClick={handleGenerateDocument}
                    disabled={!selectedPatient || exportProgress > 0 && exportProgress < 100}
                  >
                    Generate C-CDA
                  </Button>

                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    component="label"
                    data-testid="receive-ccda-button"
                  >
                    Receive C-CDA
                    <input
                      type="file"
                      accept=".xml,application/xml,text/xml"
                      hidden
                      onChange={handleReceiveFile}
                    />
                  </Button>

                  {exportProgress > 0 && exportProgress < 100 && (
                    <LinearProgress variant="determinate" value={exportProgress} />
                  )}

                  {exportStatus && (
                    <Alert 
                      severity={exportStatus.type}
                      onClose={() => setExportStatus(null)}
                    >
                      {exportStatus.message}
                    </Alert>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Center Panel - Section Selection */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader 
              title="Document Sections"
              subheader={`${getSectionCount()} sections selected`}
              avatar={<DocumentIcon />}
            />
            <CardContent>
              <Stack spacing={1}>
                {getDocumentTypeInfo() && REQUIRED_SECTIONS[getDocumentTypeInfo().abbreviation]?.map(section => (
                  <Paper key={section} variant="outlined" sx={{ p: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSections[section] || false}
                          onChange={(e) => setSelectedSections({
                            ...selectedSections,
                            [section]: e.target.checked
                          })}
                          size="small"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{section}</Typography>
                          <Chip label="Required" size="small" color="warning" variant="outlined" />
                        </Box>
                      }
                    />
                  </Paper>
                ))}
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  * All required sections must be included for ONC certification compliance
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Panel - Preview & Validation */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Validation Results */}
            {validationResults && (
              <Card>
                <CardHeader 
                  title="Validation Results"
                  avatar={
                    validationResults.isValid ? 
                      <CheckIcon color="success" /> : 
                      <WarningIcon color="warning" />
                  }
                />
                <CardContent>
                  <Stack spacing={1}>
                    {validationResults.errors?.map((error, index) => (
                      <Alert key={index} severity="error" variant="outlined">
                        <AlertTitle>{error.type}</AlertTitle>
                        {error.message}
                      </Alert>
                    ))}
                    {validationResults.warnings?.map((warning, index) => (
                      <Alert key={index} severity="warning" variant="outlined">
                        {warning}
                      </Alert>
                    ))}
                    {validationResults.isValid && (
                      <Alert severity="success">
                        Document passes all validation checks!
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Document Statistics */}
            {previewContent && (
              <Card>
                <CardHeader title="Document Statistics" />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell>Document Type</TableCell>
                          <TableCell align="right">
                            <Chip label={getDocumentTypeInfo()?.abbreviation} size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Format</TableCell>
                          <TableCell align="right">{exportFormat.toUpperCase()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Size</TableCell>
                          <TableCell align="right">
                            {(new Blob([previewContent]).size / 1024).toFixed(2)} KB
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Sections</TableCell>
                          <TableCell align="right">{getSectionCount()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Generated</TableCell>
                          <TableCell align="right">
                            {new Date().toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}

            {/* ONC Compliance */}
            <Card>
              <CardHeader title="ONC Compliance" />
              <CardContent>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">§170.315(b)(1) - Transitions of Care</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">C-CDA R2.1 Compliant</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Vocabulary Standards (LOINC, SNOMED, RxNorm)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" fontSize="small" />
                    <Typography variant="body2">Schematron Validation</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Preview Dialog would go here */}
    </Box>
  );
}