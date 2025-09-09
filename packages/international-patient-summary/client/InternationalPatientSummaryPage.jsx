// packages/international-patient-summary/client/InternationalPatientSummaryPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Button,
  IconButton,
  Divider,
  Switch,
  FormControlLabel,
  Paper,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';

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
import GenerateNarrativeDialog from './components/GenerateNarrativeDialog';

// Initialize session variables
if(Meteor.isClient){
  Session.setDefault('ipsSelectedSection', 0);
  Session.setDefault('ipsNarrativeText', '');
}

function InternationalPatientSummaryPage(props) {
  console.log('InternationalPatientSummaryPage.props', props);

  const theme = useTheme();
  const [tabIndex, setTabIndex] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [narrativeContent, setNarrativeContent] = useState('');
  const [ipsBundle, setIpsBundle] = useState(null);
  const [narrativeDialogOpen, setNarrativeDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Track session variables
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const selectedPatient = useTracker(function(){
    return Session.get('selectedPatient');
  }, []);

  const darkMode = useTracker(function(){
    return Session.get('darkMode');
  }, []);

  // Load IPS data based on selected patient
  useEffect(function(){
    if(selectedPatientId){
      console.log('Loading IPS data for patient:', selectedPatientId);
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

  function handleEditorToggle() {
    setShowEditor(!showEditor);
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

  async function generateNarrative(config) {
    console.log('Generating narrative with config:', config);
    
    try {
      // Collect IPS data from all sections
      const ipsDataForPrompt = await collectIPSData();
      
      // Construct the prompt
      const prompt = constructIPSPrompt(ipsDataForPrompt);
      
      // Call the appropriate LLM provider
      let narrative = '';
      
      if(config.provider === 'webllm') {
        // Use WebLLM for local generation
        narrative = await generateWithWebLLM(config, prompt);
      } else if(config.provider === 'byollmk') {
        // Use BYOLLMK with API key
        narrative = await generateWithBYOLLMK(config, prompt);
      } else if(config.provider === 'local-ollama') {
        // Use local Ollama
        narrative = await generateWithOllama(config, prompt);
      } else if(config.provider === 'azure-openai') {
        // Use Azure OpenAI
        narrative = await generateWithAzure(config, prompt);
      }
      
      // Check if the model provided a meaningful response
      if(narrative && narrative.length > 50) {
        setNarrativeContent(narrative);
      } else {
        // Handle cases where model demurs or provides minimal response
        setNarrativeContent(`The model provided a minimal response. This might happen when:
- The model is too small for the task (try a larger model like Mistral 7B)
- The input data is incomplete
- The model needs more specific prompting

Original response: ${narrative}

You may want to try a different model or check your data.`);
      }
      
      // Return success to close dialog properly
      return true;
    } catch(error) {
      console.error('Error generating narrative:', error);
      setNarrativeContent(`Error generating narrative: ${error.message}`);
      // Re-throw to trigger error handling in dialog
      throw error;
    }
  }

  async function collectIPSData() {
    const data = {
      patient: selectedPatient,
      sections: {}
    };
    
    // Collect data from each section's collection
    if(selectedPatientId) {
      // Problems/Conditions
      if(window.Collections?.Conditions) {
        data.sections.problems = await window.Collections.Conditions.find({
          'subject.reference': `Patient/${selectedPatientId}`
        }).fetch();
      }
      
      // Allergies
      if(window.Collections?.AllergyIntolerances) {
        data.sections.allergies = await window.Collections.AllergyIntolerances.find({
          'patient.reference': `Patient/${selectedPatientId}`
        }).fetch();
      }
      
      // Medications
      if(window.Collections?.MedicationStatements) {
        data.sections.medications = await window.Collections.MedicationStatements.find({
          'subject.reference': `Patient/${selectedPatientId}`
        }).fetch();
      }
      
      // Add more sections as needed
    }
    
    return data;
  }

  function constructIPSPrompt(ipsData) {
    const patientName = ipsData.patient ? 
      `${get(ipsData.patient, 'name[0].given[0]', '')} ${get(ipsData.patient, 'name[0].family', '')}` : 
      'Unknown Patient';
    
    let prompt = `Generate a clinical narrative summary for an International Patient Summary (IPS).

Patient: ${patientName}

Based on the following structured data, create a concise, clinically relevant narrative summary:

`;

    // Add problems
    if(ipsData.sections.problems?.length > 0) {
      prompt += `\nActive Problems:\n`;
      ipsData.sections.problems.forEach(problem => {
        prompt += `- ${get(problem, 'code.coding[0].display', get(problem, 'code.text', 'Unknown'))}\n`;
      });
    }

    // Add allergies
    if(ipsData.sections.allergies?.length > 0) {
      prompt += `\nAllergies and Intolerances:\n`;
      ipsData.sections.allergies.forEach(allergy => {
        prompt += `- ${get(allergy, 'code.coding[0].display', get(allergy, 'code.text', 'Unknown'))} (${get(allergy, 'criticality', 'unknown')} criticality)\n`;
      });
    }

    // Add medications
    if(ipsData.sections.medications?.length > 0) {
      prompt += `\nCurrent Medications:\n`;
      ipsData.sections.medications.forEach(med => {
        const medName = get(med, 'medicationCodeableConcept.coding[0].display', 
          get(med, 'medicationCodeableConcept.text', 'Unknown'));
        prompt += `- ${medName}\n`;
      });
    }

    prompt += `\nPlease generate a professional clinical narrative that:
1. Summarizes the patient's current health status
2. Highlights key problems and conditions
3. Notes important allergies and their severity
4. Lists current medications
5. Is suitable for cross-border care scenarios
6. Uses clear, professional medical language

Narrative Summary:`;

    return prompt;
  }

  async function generateWithWebLLM(config, prompt) {
    console.log('Generating with WebLLM...', config.model);
    
    try {
      // WebLLM runs directly in the browser
      // Check if WebLLM is available
      if (!window.webllm) {
        if (config.onProgress) {
          config.onProgress('Loading WebLLM library...', 10);
        }
        
        // Try to load WebLLM dynamically
        const script = document.createElement('script');
        script.type = 'module';
        script.innerHTML = `
          import * as webllm from "https://esm.run/@mlc-ai/web-llm";
          window.webllm = webllm;
        `;
        document.head.appendChild(script);
        
        // Wait a moment for it to load
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      if (window.webllm) {
        // Initialize the engine with progress callback
        const initProgressCallback = (progress) => {
          console.log('WebLLM initialization:', progress);
          
          if (config.onProgress) {
            if (progress.text) {
              // Parse progress text for better user feedback
              if (progress.text.includes('Loading model')) {
                config.onProgress('Loading model weights...', 20);
              } else if (progress.text.includes('Loading tokenizer')) {
                config.onProgress('Loading tokenizer...', 40);
              } else if (progress.text.includes('Compiling')) {
                config.onProgress('Compiling model for GPU...', 60);
              } else if (progress.text.includes('Initializing')) {
                config.onProgress('Initializing inference engine...', 80);
              } else {
                config.onProgress(progress.text, progress.progress || 50);
              }
            }
          }
        };
        
        if (config.onProgress) {
          config.onProgress('Initializing WebLLM engine...', 15);
        }
        
        const engine = await window.webllm.CreateMLCEngine(
          config.model,
          { initProgressCallback }
        );
        
        if (config.onProgress) {
          config.onProgress('Generating narrative summary...', 90);
        }
        
        // Generate the narrative
        const messages = [
          { 
            role: "system", 
            content: "You are a clinical assistant helping to generate International Patient Summary narratives. Provide professional, concise clinical summaries." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ];
        
        const reply = await engine.chat.completions.create({
          messages,
          temperature: 0.7,
          max_tokens: 1000
        });
        
        if (config.onProgress) {
          config.onProgress('Finalizing narrative...', 100);
        }
        
        return reply.choices[0].message.content;
      } else {
        // Fallback message if WebLLM is not available
        return `WebLLM is not available. Please ensure your browser supports WebGPU and try again.
        
For now, here's a template narrative:

INTERNATIONAL PATIENT SUMMARY

This patient summary has been prepared for cross-border care scenarios. The structured data indicates:

${prompt}

[Note: This is a placeholder. WebLLM generation requires WebGPU support in your browser.]`;
      }
    } catch (error) {
      console.error('Error with WebLLM generation:', error);
      throw error;
    }
  }

  async function generateWithBYOLLMK(config, prompt) {
    // This would integrate with user's API key
    console.log('Generating with BYOLLMK...', config.model);
    
    return new Promise((resolve, reject) => {
      Meteor.call('mcp.generateWithAPIKey', {
        provider: config.model.includes('gpt') ? 'openai' : 'anthropic',
        model: config.model,
        apiKey: config.apiKey,
        prompt: prompt
      }, (error, result) => {
        if(error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async function generateWithOllama(config, prompt) {
    // This would integrate with local Ollama
    console.log('Generating with Ollama...', config.model);
    
    return new Promise((resolve, reject) => {
      Meteor.call('mcp.generateWithOllama', {
        model: config.model,
        endpoint: config.endpoint,
        prompt: prompt
      }, (error, result) => {
        if(error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async function generateWithAzure(config, prompt) {
    // This would integrate with Azure OpenAI
    console.log('Generating with Azure OpenAI...', config.model);
    
    return new Promise((resolve, reject) => {
      Meteor.call('mcp.generateWithAzure', {
        model: config.model,
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        prompt: prompt
      }, (error, result) => {
        if(error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  // IPS Sections according to the specification
  const ipsSections = [
    { label: 'Problems', required: true },
    { label: 'Allergies', required: true },
    { label: 'Medications', required: true },
    { label: 'Immunizations', recommended: true },
    { label: 'Diagnostic Results', recommended: true },
    { label: 'Procedures', recommended: true },
    { label: 'Medical Devices', recommended: true },
    { label: 'Vital Signs', optional: true },
    { label: 'Social History', optional: true },
    { label: 'Pregnancy', optional: true },
    { label: 'Advance Directives', optional: true },
    { label: 'Functional Status', optional: true },
    { label: 'Plan of Care', optional: true },
    { label: 'Past Problems', optional: true }
  ];

  function renderSectionContent() {
    switch(tabIndex) {
      case 0: return <IPSProblemsSection />;
      case 1: return <IPSAllergiesSection />;
      case 2: return <IPSMedicationsSection />;
      case 3: return <IPSImmunizationsSection />;
      case 4: return <IPSDiagnosticResultsSection />;
      case 5: return <IPSProceduresSection />;
      case 6: return <IPSMedicalDevicesSection />;
      case 7: return <IPSVitalSignsSection />;
      case 8: return <IPSSocialHistorySection />;
      case 9: return <IPSPregnancySection />;
      case 10: return <IPSAdvanceDirectivesSection />;
      case 11: return <IPSFunctionalStatusSection />;
      case 12: return <IPSPlanOfCareSection />;
      case 13: return <IPSPastProblemsSection />;
      default: return <Typography>Select a section</Typography>;
    }
  }

  // Render the main content (tabs or editor)
  function renderMainContent() {
    if (showEditor) {
      // When editor is shown, replace tabs with editor and buttons
      return (
        <Box>
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
            >
              Save Composition
            </Button>
          </Box>
          <Box sx={{ height: '500px', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <AceEditor
              mode="markdown"
              theme={theme.palette.mode === 'light' ? "tomorrow" : "monokai"}
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
    } else {
      // Default: show tabs and section content
      return (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabIndex} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
            >
              {ipsSections.map((section, index) => (
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
              ))}
            </Tabs>
          </Box>
          <Box sx={{ mt: 3 }}>
            {renderSectionContent()}
          </Box>
        </>
      );
    }
  }

  // Single column responsive layout
  function renderSingleColumnLayout() {
    return (
      <Box sx={{ 
        minHeight: 'calc(100vh - 64px)',
        bgcolor: theme => theme.palette.mode === 'light' 
          ? theme.palette.grey[50]
          : theme.palette.background.default,
        pt: 3,
        pb: 3
      }}>
        <Container maxWidth="lg">
          <Card>
            <CardHeader 
              title={showEditor ? "International Patient Summary - Narrative Editor" : "International Patient Summary"}
              subheader={selectedPatient ? `${get(selectedPatient, 'name[0].given[0]')} ${get(selectedPatient, 'name[0].family')}` : 'No patient selected'}
              action={
                <FormControlLabel
                  control={<Switch checked={showEditor} onChange={handleEditorToggle} />}
                  label="Show Editor"
                />
              }
            />
            <CardContent>
              {renderMainContent()}
            </CardContent>
          </Card>
          
          {!showEditor && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                * Required sections | † Recommended sections | Others are optional
              </Typography>
            </Box>
          )}
        </Container>
      </Box>
    );
  }


  return (
    <Box id="internationalPatientSummaryPage">
      {renderSingleColumnLayout()}
      
      <GenerateNarrativeDialog
        open={narrativeDialogOpen}
        onClose={() => setNarrativeDialogOpen(false)}
        onGenerate={generateNarrative}
        ipsData={ipsBundle}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default InternationalPatientSummaryPage;