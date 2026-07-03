// packages/international-patient-summary/client/InternationalPatientSummaryPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

// Use Meteor.useNavigate pattern - shares Router context with main app
let useNavigate;
Meteor.startup(function(){
  useNavigate = Meteor.useNavigate;
});

// Use Meteor.useLocation pattern - shares Router context with main app
let useLocation;
Meteor.startup(function(){
  useLocation = Meteor.useLocation;
});

// Use Meteor.useTheme pattern for Honeycomb dark mode support
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

// Use Meteor.DynamicFhirViews for resource inspector panel
let DynamicFhirViews;
Meteor.startup(function(){
  DynamicFhirViews = Meteor.DynamicFhirViews;
});

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  ButtonGroup,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
  Alert,
  Dialog,
  Slide,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';

import TabIcon from '@mui/icons-material/Tab';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import CodeIcon from '@mui/icons-material/Code';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import ShareIcon from '@mui/icons-material/Share';

import { get } from 'lodash';

import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';
import 'ace-builds/src-noconflict/theme-tomorrow';
import 'ace-builds/src-noconflict/ext-language_tools';

import IPSProblemsSection from './sections/IPSProblemsSection';
import IPSAllergiesSection from './sections/IPSAllergiesSection';
import IPSMedicationsSection from './sections/IPSMedicationsSection';
import IPSImmunizationsSection from './sections/IPSImmunizationsSection';
import IPSDiagnosticResultsSection from './sections/IPSDiagnosticResultsSection';
import IPSProceduresSection from './sections/IPSProceduresSection';
import IPSMedicalDevicesSection from './sections/IPSMedicalDevicesSection';
import IPSVitalSignsSection from './sections/IPSVitalSignsSection';
import IPSSocialHistorySection from './sections/IPSSocialHistorySection';
import IPSPregnancySection from './sections/IPSPregnancySection';
import IPSAdvanceDirectivesSection from './sections/IPSAdvanceDirectivesSection';
import IPSFunctionalStatusSection from './sections/IPSFunctionalStatusSection';
import IPSPlanOfCareSection from './sections/IPSPlanOfCareSection';
import IPSPastProblemsSection from './sections/IPSPastProblemsSection';
import IPSImagingStudiesSection from './sections/IPSImagingStudiesSection';
import IPSSpecimensSection from './sections/IPSSpecimensSection';
import IPSNutritionIntakesSection from './sections/IPSNutritionIntakesSection';
import IPSMolecularSequencesSection from './sections/IPSMolecularSequencesSection';
import GeneratePatientNarrativeModal from './components/GeneratePatientNarrativeModal';
// collectIPSData was relocated into the shared narrative engine; saveComposition
// still uses it to build the structured Composition sections.
import { collectIPSData } from './lib/narrativeEngine.js';
import IpsContent, { ipsSections } from './IpsContent';

const log = (Meteor.Logger ? Meteor.Logger.for('InternationalPatientSummaryPage') : console);

// Initialize session variables
if(Meteor.isClient){
  Session.setDefault('ipsSelectedSection', 0);
  Session.setDefault('ipsNarrativeText', '');
}

// Slide transition for mobile inspector dialog (defined outside component to prevent remounting)
const SlideTransition = React.forwardRef(function SlideTransition(transitionProps, ref) {
  return <Slide direction="up" ref={ref} {...transitionProps} />;
});

function InternationalPatientSummaryPage(props) {
  log.debug('InternationalPatientSummaryPage.props', { props });

  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const ipsContentRef = useRef(null);

  const searchParams = new URLSearchParams(location.search);
  const expanded = searchParams.get('expanded') === 'true';

  const [tabIndex, setTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState('accordion');
  const [narrativeContent, setNarrativeContent] = useState('');
  const [ipsBundle, setIpsBundle] = useState(null);
  const [narrativeDialogOpen, setNarrativeDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [displayMode, setDisplayMode] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);

  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isPanelOpen = selectedResource !== null;

  // Track session variables
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);

  // Use Honeycomb's theme system for proper dark mode support
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  // Theme-aware colors
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const pageBgColor = isDark ? '#121212' : '#f5f5f5';

  function handleResourceClick(resource) {
    setSelectedResource(resource);
  }

  function handleCloseInspector() {
    setSelectedResource(null);
  }

  function handlePrintIPS() {
    console.log('Printing IPS...');
    window.print();
  }

  function handleShareIPS() {
    console.log('Sharing IPS...');
    // Future: Share IPS via SMART on FHIR or other mechanism
  }

  // Load IPS data based on selected patient
  useEffect(function(){
    if(selectedPatientId){
      log.debug('Loading IPS data for patient:', { selectedPatientId });
      // Future: Load IPS bundle from server or construct from resources
      constructIPSBundle(selectedPatientId);
    }
  }, [selectedPatientId]);

  function constructIPSBundle(patientId){
    // Construct IPS Bundle from available FHIR resources
    // This will aggregate data from various collections
    const bundle = {
      resourceType: 'Bundle',
      type: 'document',
      entry: []
    };

    // Future: Aggregate resources from collections
    setIpsBundle(bundle);
  }

  function handleTabChange(event, newValue) {
    setTabIndex(newValue);
    Session.set('ipsSelectedSection', newValue);
  }

  function handleViewModeChange(event, newMode) {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  }

  function handleNarrativeChange(newValue) {
    setNarrativeContent(newValue);
    Session.set('ipsNarrativeText', newValue);
  }

  function openNarrativeDialog() {
    setNarrativeDialogOpen(true);
  }

  async function saveComposition() {
    console.log('Saving IPS Composition...');
    
    // Save the narrative content to Session for use in A2A Admin
    Session.set('ipsComposition', narrativeContent);
    console.log('IPS narrative saved to Session for A2A integration');
    
    try {
      // Create FHIR Composition resource
      const composition = {
        resourceType: 'Composition',
        status: 'final',
        type: {
          coding: [{
            system: 'http://loinc.org',
            code: '60591-5',
            display: 'Patient summary Document'
          }]
        },
        subject: {
          reference: `Patient/${selectedPatientId}`,
          display: selectedPatient ? `${get(selectedPatient, 'name[0].given[0]', '')} ${get(selectedPatient, 'name[0].family', '')}` : 'Unknown Patient'
        },
        date: new Date().toISOString(),
        author: [{
          display: 'International Patient Summary Generator'
        }],
        title: 'International Patient Summary',
        section: []
      };

      // Add narrative section if we have generated content
      if(narrativeContent && narrativeContent.length > 0) {
        composition.section.push({
          title: 'Narrative Summary',
          text: {
            status: 'generated',
            div: `<div xmlns="http://www.w3.org/1999/xhtml">${narrativeContent.replace(/\n/g, '<br/>')}</div>`
          }
        });
      }

      // Add structured sections with references to resources
      const ipsData = await collectIPSData();
      
      // Problems section
      if(ipsData.sections.problems && ipsData.sections.problems.length > 0) {
        composition.section.push({
          title: 'Problems',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '11450-4',
              display: 'Problem list'
            }]
          },
          entry: ipsData.sections.problems.map(problem => ({
            reference: `Condition/${problem._id}`
          }))
        });
      }

      // Allergies section
      if(ipsData.sections.allergies && ipsData.sections.allergies.length > 0) {
        composition.section.push({
          title: 'Allergies and Intolerances',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '48765-2',
              display: 'Allergies and adverse reactions'
            }]
          },
          entry: ipsData.sections.allergies.map(allergy => ({
            reference: `AllergyIntolerance/${allergy._id}`
          }))
        });
      }

      // Medications section
      if(ipsData.sections.medications && ipsData.sections.medications.length > 0) {
        composition.section.push({
          title: 'Medications',
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '10160-0',
              display: 'History of Medication use'
            }]
          },
          entry: ipsData.sections.medications.map(med => ({
            reference: `MedicationStatement/${med._id}`
          }))
        });
      }

      // Save to Compositions collection
      Meteor.call('compositions.insert', composition, function(error, result) {
        if(error) {
          console.error('Error saving composition:', error);
          setSnackbar({
            open: true,
            message: 'Error saving composition: ' + error.message,
            severity: 'error'
          });
        } else {
          console.log('Composition saved:', result);
          setSnackbar({
            open: true,
            message: 'IPS Composition saved successfully! ID: ' + result,
            severity: 'success'
          });
        }
      });

    } catch(error) {
      console.error('Error creating composition:', error);
      setSnackbar({
        open: true,
        message: 'Error creating composition: ' + error.message,
        severity: 'error'
      });
    }
  }


  function renderSectionContent() {
    switch(tabIndex) {
      case 0: return <IPSProblemsSection onResourceClick={handleResourceClick} />;
      case 1: return <IPSAllergiesSection onResourceClick={handleResourceClick} />;
      case 2: return <IPSMedicationsSection onResourceClick={handleResourceClick} />;
      case 3: return <IPSImmunizationsSection onResourceClick={handleResourceClick} />;
      case 4: return <IPSDiagnosticResultsSection onResourceClick={handleResourceClick} />;
      case 5: return <IPSProceduresSection onResourceClick={handleResourceClick} />;
      case 6: return <IPSMedicalDevicesSection onResourceClick={handleResourceClick} />;
      case 7: return <IPSVitalSignsSection onResourceClick={handleResourceClick} />;
      case 8: return <IPSSocialHistorySection onResourceClick={handleResourceClick} />;
      case 9: return <IPSPregnancySection onResourceClick={handleResourceClick} />;
      case 10: return <IPSAdvanceDirectivesSection onResourceClick={handleResourceClick} />;
      case 11: return <IPSFunctionalStatusSection onResourceClick={handleResourceClick} />;
      case 12: return <IPSPlanOfCareSection onResourceClick={handleResourceClick} />;
      case 13: return <IPSPastProblemsSection onResourceClick={handleResourceClick} />;
      case 14: return <IPSImagingStudiesSection onResourceClick={handleResourceClick} />;
      case 15: return <IPSSpecimensSection onResourceClick={handleResourceClick} />;
      case 16: return <IPSNutritionIntakesSection onResourceClick={handleResourceClick} />;
      case 17: return <IPSMolecularSequencesSection onResourceClick={handleResourceClick} />;
      default: return <Typography>Select a section</Typography>;
    }
  }

  // Render the main content (tabs, accordion, or editor)
  function renderMainContent() {
    switch (viewMode) {
      case 'editor':
        return (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="outlined"
                size="small"
                onClick={openNarrativeDialog}
                sx={{ mr: 1 }}
              >
                Generate Narrative
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={saveComposition}
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate('/compositions')}
              >
                Compositions
              </Button>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <AceEditor
                mode="markdown"
                theme={isDark ? "monokai" : "tomorrow"}
                onChange={handleNarrativeChange}
                value={narrativeContent}
                name="ips-narrative-editor"
                editorProps={{ $blockScrolling: true }}
                width="100%"
                height="100%"
                fontSize={14}
                showPrintMargin={false}
                showGutter={true}
                highlightActiveLine={true}
                wrapEnabled={true}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: false,
                  showLineNumbers: true,
                  tabSize: 2,
                  useWorker: false,
                  wrap: true
                }}
              />
            </Box>
          </Box>
        );
      case 'accordion':
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
              <ButtonGroup size="small" sx={{
                '& .MuiButton-root': {
                  borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined
                }
              }}>
                <Button
                  variant={displayMode === 'all' ? 'contained' : 'outlined'}
                  onClick={function() { setDisplayMode('all'); }}
                  sx={{
                    textTransform: 'none',
                    ...(displayMode === 'all' ? {
                      bgcolor: isDark ? 'rgba(144, 202, 249, 0.2)' : undefined,
                      color: isDark ? '#90caf9' : undefined
                    } : {
                      color: isDark ? 'rgba(255,255,255,0.7)' : undefined
                    })
                  }}
                >
                  All
                </Button>
                <Button
                  variant={displayMode === 'terse' ? 'contained' : 'outlined'}
                  onClick={function() { setDisplayMode('terse'); }}
                  sx={{
                    textTransform: 'none',
                    ...(displayMode === 'terse' ? {
                      bgcolor: isDark ? 'rgba(144, 202, 249, 0.2)' : undefined,
                      color: isDark ? '#90caf9' : undefined
                    } : {
                      color: isDark ? 'rgba(255,255,255,0.7)' : undefined
                    })
                  }}
                >
                  Terse
                </Button>
              </ButtonGroup>
              <ButtonGroup variant="outlined" size="small" sx={{
                '& .MuiButton-root': {
                  color: isDark ? 'rgba(255,255,255,0.7)' : undefined,
                  borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined
                }
              }}>
                <Button onClick={function() { ipsContentRef.current?.expandAll(); }} startIcon={<ExpandMoreIcon />} sx={{ textTransform: 'none' }}>
                  Expand All
                </Button>
                <Button onClick={function() { ipsContentRef.current?.collapseAll(); }} startIcon={<ExpandLessIcon />} sx={{ textTransform: 'none' }}>
                  Collapse All
                </Button>
              </ButtonGroup>
            </Box>
            <IpsContent ref={ipsContentRef} expanded={expanded} displayMode={displayMode} onResourceClick={handleResourceClick} />
          </Box>
        );
      case 'tabbed':
      default:
        return (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
              >
                {ipsSections.map(function(section, index) {
                  return (
                    <Tab
                      key={index}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {section.label}
                          {section.required && <Typography variant="caption" sx={{ ml: 0.5, color: 'error.main' }}>*</Typography>}
                          {section.recommended && <Typography variant="caption" sx={{ ml: 0.5, color: 'warning.main' }}>†</Typography>}
                        </Box>
                      }
                    />
                  );
                })}
              </Tabs>
            </Box>
            <Box sx={{ mt: 3 }}>
              {renderSectionContent()}
            </Box>
          </>
        );
    }
  }

  // Render the resource inspector panel content
  function renderInspectorContent() {
    if (!selectedResource) return null;

    var resourceType = get(selectedResource, 'resourceType', 'Unknown');

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5, flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
        }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: cardTextColor }}>
            {resourceType}
          </Typography>
          <IconButton onClick={handleCloseInspector} size="small" sx={{ color: cardTextColor }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}>
          {DynamicFhirViews
            ? <DynamicFhirViews fhirResource={selectedResource} embedded={true} isDark={isDark} />
            : <pre style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                color: isDark ? 'rgba(255, 255, 255, 0.87)' : 'inherit'
              }}>{JSON.stringify(selectedResource, null, 2)}</pre>
          }
        </Box>
      </Box>
    );
  }

  // Single column responsive layout
  function renderSingleColumnLayout() {
    return (
      <Box sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: pageBgColor,
        pt: 3,
        pb: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{
          maxWidth: isPanelOpen && isDesktop ? 1600 : 1200,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          display: 'flex',
          gap: 3,
          flex: 1,
          minHeight: 0,
          transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Left panel — IPS content */}
          <Box sx={{
            flex: isPanelOpen && isDesktop ? '0 0 50%' : '1 1 100%',
            maxWidth: isPanelOpen && isDesktop ? '50%' : '100%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
          <Card sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
            bgcolor: cardBgColor,
            color: cardTextColor,
            '& .MuiCardHeader-title': { color: cardTextColor },
            '& .MuiCardHeader-subheader': {
              color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
            },
            '& .MuiToggleButtonGroup-root': {
              borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined
            },
            '& .MuiToggleButton-root': {
              color: isDark ? cardTextColor : undefined,
              borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined,
              '&.Mui-selected': {
                bgcolor: isDark ? 'rgba(144, 202, 249, 0.2)' : undefined,
                color: isDark ? '#90caf9' : undefined
              }
            },
            '& .MuiCard-root': {
              bgcolor: isDark ? '#252525' : '#ffffff',
              color: cardTextColor,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
            },
            '& .MuiAvatar-root': {
              bgcolor: isDark ? 'rgba(144, 202, 249, 0.15)' : undefined,
              color: isDark ? '#90caf9' : undefined
            },
            '& .MuiTab-root': { color: cardTextColor },
            '& .MuiTabs-indicator': { backgroundColor: isDark ? '#90caf9' : 'primary.main' },
            '& .MuiPaper-outlined': {
              bgcolor: isDark ? '#1e1e1e' : '#ffffff',
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
            },
            '& .MuiTableCell-root': {
              color: cardTextColor,
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
            },
            '& .MuiTableCell-head': {
              bgcolor: isDark ? '#252525' : '#fafafa',
              color: cardTextColor,
              fontWeight: 'bold'
            },
            '& .MuiAlert-standardInfo': {
              bgcolor: isDark ? 'rgba(33, 150, 243, 0.15)' : undefined,
              color: isDark ? cardTextColor : undefined
            },
            '& .MuiAlert-standardInfo .MuiAlert-icon': {
              color: isDark ? '#90caf9' : undefined
            },
            '& .MuiChip-colorDefault': {
              color: isDark ? cardTextColor : undefined,
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : undefined
            },
            '& .MuiChip-outlined': {
              borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined,
              color: isDark ? cardTextColor : undefined
            }
          }}>
            <CardHeader
              sx={{ flexShrink: 0 }}
              title={viewMode === 'editor' ? "International Patient Summary - Narrative Editor" : "International Patient Summary"}
              subheader={selectedPatient ? `${get(selectedPatient, 'name[0].given[0]')} ${get(selectedPatient, 'name[0].family')}` : 'No patient selected'}
              action={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <ToggleButtonGroup
                    value={viewMode}
                    exclusive
                    onChange={handleViewModeChange}
                    size="small"
                    aria-label="view mode"
                  >
                    <ToggleButton value="accordion" aria-label="accordion view">
                      <ViewDayIcon sx={{ mr: 0.5 }} /> Accordion
                    </ToggleButton>
                    <ToggleButton value="tabbed" aria-label="tabbed view">
                      <TabIcon sx={{ mr: 0.5 }} /> Tabbed
                    </ToggleButton>
                    <ToggleButton value="editor" aria-label="editor view">
                      <CodeIcon sx={{ mr: 0.5 }} /> Editor
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    id="international-patient-summary-print-btn"
                    variant="outlined"
                    size="small"
                    startIcon={<PrintIcon />}
                    onClick={handlePrintIPS}
                    sx={{
                      textTransform: 'none',
                      color: isDark ? 'rgba(255,255,255,0.7)' : undefined,
                      borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined
                    }}
                  >
                    Print
                  </Button>
                  <Button
                    id="international-patient-summary-share-btn"
                    variant="outlined"
                    size="small"
                    startIcon={<ShareIcon />}
                    onClick={handleShareIPS}
                    sx={{
                      textTransform: 'none',
                      color: isDark ? 'rgba(255,255,255,0.7)' : undefined,
                      borderColor: isDark ? 'rgba(255,255,255,0.23)' : undefined
                    }}
                  >
                    Share
                  </Button>
                </Box>
              }
            />
            <CardContent sx={{ flex: 1, minHeight: 0, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {renderMainContent()}
            </CardContent>
          </Card>

          {viewMode !== 'editor' && (
            <Box sx={{ mt: 2, flexShrink: 0 }}>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                * Required sections | † Recommended sections | Others are optional
              </Typography>
            </Box>
          )}
          </Box>

          {/* Right panel — Resource Inspector (desktop only) */}
          {isDesktop && (
            <Box sx={{
              flex: isPanelOpen ? '0 0 50%' : '0 0 0%',
              maxWidth: isPanelOpen ? '50%' : '0%',
              opacity: isPanelOpen ? 1 : 0,
              overflow: isPanelOpen ? 'visible' : 'clip',
              transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1), max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease 0.1s'
            }}>
              {isPanelOpen && (
                <Card sx={{
                  position: 'sticky',
                  top: 'calc(var(--header-height, 128px) + 20px)',
                  height: 'calc(100vh - var(--header-height, 128px) - 40px)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  bgcolor: cardBgColor,
                  color: cardTextColor,
                  border: '1px solid',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                  '& .MuiTableCell-root': {
                    color: cardTextColor,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
                  }
                }}>
                  {renderInspectorContent()}
                </Card>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
  }


  return (
    <Box id="internationalPatientSummaryPage" sx={{ height: '100%' }}>
      {renderSingleColumnLayout()}

      {/* Mobile Dialog — Resource Inspector (below lg breakpoint) */}
      {!isDesktop && (
        <Dialog
          fullScreen
          open={isPanelOpen}
          onClose={handleCloseInspector}
          TransitionComponent={SlideTransition}
          PaperProps={{
            sx: {
              bgcolor: cardBgColor,
              color: cardTextColor
            }
          }}
        >
          {renderInspectorContent()}
        </Dialog>
      )}

      <GeneratePatientNarrativeModal
        open={narrativeDialogOpen}
        onClose={() => setNarrativeDialogOpen(false)}
        onGenerated={setNarrativeContent}
      />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            ...(isDark && {
              bgcolor: snackbar.severity === 'success'
                ? 'rgba(46, 125, 50, 0.15)'
                : snackbar.severity === 'error'
                  ? 'rgba(211, 47, 47, 0.15)'
                  : 'rgba(33, 150, 243, 0.15)',
              color: 'rgba(255, 255, 255, 0.87)',
              '& .MuiAlert-icon': {
                color: snackbar.severity === 'success' ? '#66bb6a'
                  : snackbar.severity === 'error' ? '#f44336'
                  : '#90caf9'
              }
            })
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InternationalPatientSummaryPage;
