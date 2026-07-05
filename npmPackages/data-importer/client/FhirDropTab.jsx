// packages/data-importer/client/FhirDropTab.jsx
//
// FHIR Drop tab — paste raw FHIR JSON or NDJSON, validate, preview, and import.
// Two-column layout: Left = AceEditor, Right = Validation / Preview toggle + patient matching.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
  Alert,
  AlertTitle,
  Divider
} from '@mui/material';
import {
  PlayArrow as ValidateIcon,
  Clear as ClearIcon,
  Preview as PreviewIcon,
  Checklist as ValidationIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

const log = (Meteor.Logger ? Meteor.Logger.for('FhirDropTab') : console);

import { useImportStore } from './ImportStoreContext.jsx';
import AppleHealthPatientPanel from './AppleHealthPatientPanel.jsx';
import ImportDialog from './ImportDialog.jsx';
import { validateFhirPayload } from '../lib/FhirValidator.js';

function FhirDropTab() {
  var storeCtx = useImportStore();
  var dispatch = storeCtx.dispatch;

  // Local state
  var [editorContent, setEditorContent] = useState('');
  var [parsedResources, setParsedResources] = useState([]);
  var [validationIssues, setValidationIssues] = useState([]);
  var [parseError, setParseError] = useState(null);
  var [detectedFormat, setDetectedFormat] = useState(null);
  var [rightPanelMode, setRightPanelMode] = useState('validation');
  var [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);
  var [importDialogOpen, setImportDialogOpen] = useState(false);

  // Navigation for post-import redirect
  var useNavigate = Meteor.useNavigate;
  var navigate = useNavigate ? useNavigate() : function() {};

  // Detect dark mode from app theme
  var isDark = false;
  var useAppTheme = null;
  if (typeof Meteor !== 'undefined' && Meteor.useTheme) {
    useAppTheme = Meteor.useTheme;
  }
  if (useAppTheme) {
    var appTheme = useAppTheme();
    isDark = appTheme.theme === 'dark';
  }

  var cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  var cardTextColor = isDark ? 'rgba(255,255,255,0.87)' : 'rgba(0,0,0,0.87)';
  var dividerColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  var textSecondary = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';

  // Track resolved patient from Session (set by AppleHealthPatientPanel)
  var resolvedPatient = useTracker(function() {
    return Session.get('selectedPatient');
  }, []);

  var DynamicFhirViews = Meteor.DynamicFhirViews;

  // =========================================================================
  // Patient reference override
  // =========================================================================

  function applyPatientReferenceOverride(resource, patient) {
    if (!resource || !patient) return resource;
    if (get(resource, 'resourceType') === 'Patient') return resource;

    var overridden = JSON.parse(JSON.stringify(resource));
    var patientId = get(patient, 'id') || get(patient, '_id');

    // Build display name
    var given = get(patient, 'name.0.given.0', '');
    var family = get(patient, 'name.0.family', '');
    var text = get(patient, 'name.0.text', '');
    var patientDisplay = text || ((given + ' ' + family).trim()) || ('Patient/' + patientId);

    var patientRef = {
      reference: 'Patient/' + patientId,
      display: patientDisplay
    };

    // Override subject reference if it exists
    if (overridden.subject) {
      overridden.subject = patientRef;
    }

    // Override patient reference if it exists
    if (overridden.patient) {
      overridden.patient = patientRef;
    }

    return overridden;
  }

  // =========================================================================
  // Handlers
  // =========================================================================

  function handleValidate() {
    if (!editorContent.trim()) return;

    var result = validateFhirPayload(editorContent);

    setParsedResources(result.resources);
    setValidationIssues(result.issues);
    setParseError(result.parseError);
    setDetectedFormat(result.format);
    setSelectedPreviewIndex(0);

    if (result.resources.length > 0) {
      // Push to shared context so ImportDialog can see them
      Session.set('importBuffer', result.resources);
      Session.set('fileExtension', result.format === 'ndjson' ? 'ndjson' : 'json');
      dispatch({ type: 'SET_RESOURCE_LIST', payload: { resources: result.resources, source: result.format || 'json' } });
    }

    // Auto-switch to validation panel if there are issues or errors
    if (result.parseError || result.issues.length > 0) {
      setRightPanelMode('validation');
    } else {
      setRightPanelMode('preview');
    }
  }

  function handleClear() {
    setEditorContent('');
    setParsedResources([]);
    setValidationIssues([]);
    setParseError(null);
    setDetectedFormat(null);
    setSelectedPreviewIndex(0);
  }

  function handleRightPanelModeChange(e, newMode) {
    if (newMode !== null) {
      setRightPanelMode(newMode);
    }
  }

  function handlePreviewIndexChange(e) {
    setSelectedPreviewIndex(Number(e.target.value));
  }

  function handleOpenImportDialog() {
    // Ensure importBuffer is set, applying patient override if selected
    if (parsedResources.length > 0) {
      var resourcesToImport = parsedResources;
      var patient = Session.get('selectedPatient');
      if (patient) {
        resourcesToImport = parsedResources.map(function(r) {
          return applyPatientReferenceOverride(r, patient);
        });
        log.debug('FhirDropTab Applied patient reference override for ' + resourcesToImport.length + ' resources');
      }
      Session.set('importBuffer', resourcesToImport);
      Session.set('fileExtension', detectedFormat === 'ndjson' ? 'ndjson' : 'json');
    }
    setImportDialogOpen(true);
  }

  // Watch for the footer "Load Data" button signal (each tab hosts its own
  // consumer because inactive tabs are unmounted).
  useEffect(function() {
    var interval = setInterval(function() {
      if (Session.get('importDialogRequested')) {
        Session.set('importDialogRequested', false);
        handleOpenImportDialog();
      }
    }, 200);
    return function() { clearInterval(interval); };
  });

  function handleImportDialogClose(wasCompleted) {
    setImportDialogOpen(false);
    if (wasCompleted) {
      navigate('/');
    }
  }

  // =========================================================================
  // Computed values
  // =========================================================================

  var errorCount = validationIssues.filter(function(i) { return i.severity === 'error'; }).length;
  var warningCount = validationIssues.filter(function(i) { return i.severity === 'warning'; }).length;
  var infoCount = validationIssues.filter(function(i) { return i.severity === 'info'; }).length;

  var statusText = '';
  if (parseError) {
    statusText = parseError;
  } else if (parsedResources.length > 0) {
    statusText = parsedResources.length + ' resource' + (parsedResources.length !== 1 ? 's' : '');
    if (detectedFormat) {
      statusText += ' (' + detectedFormat + ')';
    }
  }

  var selectedResource = null;
  if (selectedPreviewIndex >= 0 && selectedPreviewIndex < parsedResources.length) {
    selectedResource = parsedResources[selectedPreviewIndex];
  }

  // Apply patient override for preview display
  var previewResource = selectedResource;
  if (selectedResource && resolvedPatient) {
    previewResource = applyPatientReferenceOverride(selectedResource, resolvedPatient);
  }

  // =========================================================================
  // Severity icon helper
  // =========================================================================

  function severityIcon(severity) {
    if (severity === 'error') {
      return <ErrorIcon sx={{ fontSize: 16, color: '#f44336', mr: 0.5 }} />;
    }
    if (severity === 'warning') {
      return <WarningIcon sx={{ fontSize: 16, color: '#ff9800', mr: 0.5 }} />;
    }
    return <InfoIcon sx={{ fontSize: 16, color: isDark ? '#90caf9' : '#1976d2', mr: 0.5 }} />;
  }

  // =========================================================================
  // Render
  // =========================================================================

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gap: 2,
      p: 2,
      flex: 1,
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Left Column: Editor */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: dividerColor },
        '& .MuiInputBase-root': { color: cardTextColor },
        '& .MuiInputLabel-root': { color: cardTextColor },
        '& .MuiSelect-icon': { color: cardTextColor },
        '& .MuiButton-root': { color: cardTextColor },
        '& .MuiAlert-root': { color: cardTextColor }
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">FHIR Drop</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={handleClear}
                  disabled={!editorContent}
                  sx={{
                    color: cardTextColor,
                    borderColor: dividerColor,
                    '&:hover': { borderColor: cardTextColor }
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<ValidateIcon />}
                  onClick={handleValidate}
                  disabled={!editorContent.trim()}
                >
                  Validate
                </Button>
              </Box>
            </Box>
          }
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem', width: '100%' }
          }}
        />
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', p: 0 }}>
          {/* AceEditor */}
          <Box sx={{ flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
            <AceEditor
              mode="json"
              theme={isDark ? 'monokai' : 'github'}
              value={editorContent}
              onChange={setEditorContent}
              name="fhir-drop-editor"
              editorProps={{ $blockScrolling: true }}
              width="100%"
              height="100%"
              fontSize={12}
              showPrintMargin={false}
              showGutter={true}
              highlightActiveLine={true}
              wrapEnabled={true}
              placeholder="Paste FHIR JSON or NDJSON here..."
              setOptions={{
                enableBasicAutocompletion: false,
                enableLiveAutocompletion: false,
                showLineNumbers: true,
                tabSize: 2,
                useWorker: false
              }}
              style={{ flex: 1, minHeight: 200 }}
            />
          </Box>

          {/* Status bar */}
          {statusText && (
            <Box sx={{
              px: 2, py: 0.75,
              borderTop: '1px solid',
              borderColor: dividerColor,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexShrink: 0
            }}>
              {parseError ? (
                <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />
              ) : null}
              <Typography variant="caption" sx={{
                color: parseError ? '#f44336' : textSecondary,
                fontFamily: 'monospace'
              }}>
                {statusText}
              </Typography>
            </Box>
          )}

        </CardContent>
      </Card>

      {/* Right Column: Preview / Validation */}
      <Card sx={{
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        bgcolor: cardBgColor, color: cardTextColor,
        '& .MuiCardHeader-title': { color: cardTextColor },
        '& .MuiToggleButton-root': { color: cardTextColor, borderColor: dividerColor }
      }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <ToggleButtonGroup
                value={rightPanelMode}
                exclusive
                onChange={handleRightPanelModeChange}
                size="small"
              >
                <ToggleButton value="validation">
                  <ValidationIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Validation
                  {(errorCount + warningCount) > 0 && (
                    <Chip
                      size="small"
                      label={errorCount + warningCount}
                      color={errorCount > 0 ? 'error' : 'warning'}
                      sx={{ ml: 0.5, height: 18, fontSize: '0.7rem' }}
                    />
                  )}
                </ToggleButton>
                <ToggleButton value="preview">
                  <PreviewIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  Preview
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Resource selector (preview mode, multiple resources) */}
              {rightPanelMode === 'preview' && parsedResources.length > 1 && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel id="resource-selector-label" sx={{ color: cardTextColor }}>Resource</InputLabel>
                  <Select
                    labelId="resource-selector-label"
                    value={selectedPreviewIndex}
                    onChange={handlePreviewIndexChange}
                    label="Resource"
                    sx={{ fontSize: '0.8125rem' }}
                  >
                    {parsedResources.map(function(res, idx) {
                      var label = (res.resourceType || 'Unknown') + (res.id ? ' / ' + res.id : '');
                      return (
                        <MenuItem key={idx} value={idx}>
                          {idx + 1}. {label}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              )}
            </Box>
          }
          sx={{
            borderBottom: 1,
            borderColor: dividerColor,
            flexShrink: 0,
            '& .MuiCardHeader-title': { fontSize: '1.1rem', width: '100%' }
          }}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
          {rightPanelMode === 'preview' ? (
            // Preview panel (shows patient override if a patient is selected)
            previewResource && DynamicFhirViews ? (
              <DynamicFhirViews
                fhirResource={previewResource}
                embedded={true}
                isDark={isDark}
              />
            ) : previewResource ? (
              // Fallback: raw JSON preview for unregistered types
              <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <AceEditor
                  mode="json"
                  theme={isDark ? 'monokai' : 'github'}
                  value={JSON.stringify(previewResource, null, 2)}
                  readOnly={true}
                  name="fhir-drop-preview"
                  editorProps={{ $blockScrolling: true }}
                  width="100%"
                  height="100%"
                  fontSize={12}
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={false}
                  wrapEnabled={true}
                  setOptions={{
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false
                  }}
                  style={{ flex: 1, minHeight: 200 }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  Paste FHIR JSON in the editor and click Validate to preview resources here.
                </Typography>
              </Box>
            )
          ) : (
            // Validation panel
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Parse error */}
              {parseError && (
                <Alert
                  severity="error"
                  sx={{
                    bgcolor: isDark ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.1)',
                    color: cardTextColor,
                    '& .MuiAlert-icon': { color: isDark ? '#f44336' : '#d32f2f' },
                    '& .MuiAlertTitle-root': { color: cardTextColor }
                  }}
                >
                  <AlertTitle>Parse Error</AlertTitle>
                  {parseError}
                </Alert>
              )}

              {/* Summary chips */}
              {!parseError && (validationIssues.length > 0 || parsedResources.length > 0) && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {parsedResources.length > 0 && (
                    <Chip
                      size="small"
                      label={parsedResources.length + ' resource' + (parsedResources.length !== 1 ? 's' : '') + ' parsed'}
                      color="success"
                      variant="outlined"
                    />
                  )}
                  {errorCount > 0 && (
                    <Chip
                      size="small"
                      label={errorCount + ' error' + (errorCount !== 1 ? 's' : '')}
                      color="error"
                      variant="outlined"
                    />
                  )}
                  {warningCount > 0 && (
                    <Chip
                      size="small"
                      label={warningCount + ' warning' + (warningCount !== 1 ? 's' : '')}
                      color="warning"
                      variant="outlined"
                    />
                  )}
                  {infoCount > 0 && (
                    <Chip
                      size="small"
                      label={infoCount + ' info'}
                      variant="outlined"
                      sx={{ borderColor: isDark ? '#90caf9' : '#1976d2', color: isDark ? '#90caf9' : '#1976d2' }}
                    />
                  )}
                </Box>
              )}

              {/* No validation run yet */}
              {!parseError && validationIssues.length === 0 && parsedResources.length === 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: textSecondary }}>
                    Click Validate to check the FHIR payload.
                  </Typography>
                </Box>
              )}

              {/* All clear */}
              {!parseError && parsedResources.length > 0 && validationIssues.length === 0 && (
                <Alert
                  severity="success"
                  sx={{
                    bgcolor: isDark ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.1)',
                    color: cardTextColor,
                    '& .MuiAlert-icon': { color: isDark ? '#66bb6a' : '#2e7d32' }
                  }}
                >
                  All resources validated successfully.
                </Alert>
              )}

              {/* Issue list */}
              {validationIssues.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {validationIssues.map(function(issue, idx) {
                    return (
                      <Box key={idx} sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        p: 1,
                        borderRadius: 1,
                        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        border: '1px solid',
                        borderColor: dividerColor
                      }}>
                        {severityIcon(issue.severity)}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" sx={{
                            color: textSecondary,
                            fontFamily: 'monospace',
                            display: 'block'
                          }}>
                            {issue.resourceIndex >= 0 ? 'Resource #' + (issue.resourceIndex + 1) : ''}
                            {issue.field ? (issue.resourceIndex >= 0 ? ' — ' : '') + issue.field : ''}
                          </Typography>
                          <Typography variant="body2" sx={{ color: cardTextColor }}>
                            {issue.message}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Patient Matching (inside validation panel) */}
              {parsedResources.length > 0 && (
                <>
                  <Divider />
                  <Box sx={{ maxHeight: 280, overflow: 'auto' }}>
                    <AppleHealthPatientPanel
                      isDark={isDark}
                      onImport={handleOpenImportDialog}
                      importDisabled={parsedResources.length === 0}
                      selectedCount={parsedResources.length}
                      confirmTitle="Override Patient Reference"
                      clearLabel="Cancel Override"
                      infoText="Patient and subject references in imported resources will be overridden with this patient."
                      selectPrompt="Select a patient to override subject and patient references in imported resources."
                    />
                  </Box>
                </>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        importMode="standard"
      />
    </Box>
  );
}

export { FhirDropTab };
export default FhirDropTab;
