// packages/international-patient-summary/client/InternationalPatientSummaryPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
    // Extract comprehensive patient demographics
    const patient = ipsData.patient || {};
    const patientName = patient ? 
      `${get(patient, 'name[0].given[0]', '')} ${get(patient, 'name[0].family', '')}` : 
      'Unknown Patient';
    
    const birthDate = get(patient, 'birthDate', 'Unknown');
    const gender = get(patient, 'gender', 'Unknown');
    const identifiers = get(patient, 'identifier', []);
    const mrn = identifiers.find(id => id.type?.coding?.[0]?.code === 'MR')?.value || 'Not specified';
    const address = get(patient, 'address[0]', {});
    const city = get(address, 'city', '');
    const state = get(address, 'state', '');
    const country = get(address, 'country', '');
    const location = [city, state, country].filter(Boolean).join(', ') || 'Not specified';
    
    // Calculate age if birthDate is available
    let age = 'Unknown';
    if (birthDate && birthDate !== 'Unknown') {
      const birthYear = new Date(birthDate).getFullYear();
      const currentYear = new Date().getFullYear();
      age = currentYear - birthYear;
    }
    
    let prompt = `You are a clinical documentation specialist creating an International Patient Summary (IPS) narrative.

PATIENT DEMOGRAPHICS:
- Name: ${patientName}
- Date of Birth: ${birthDate} (Age: ${age})
- Gender: ${gender}
- Medical Record Number: ${mrn}
- Location: ${location}

CLINICAL DATA:
`;

    // Add problems
    if(ipsData.sections.problems?.length > 0) {
      prompt += `\nActive Problems and Conditions:\n`;
      ipsData.sections.problems.forEach(problem => {
        const condition = get(problem, 'code.coding[0].display', get(problem, 'code.text', 'Unknown'));
        const onset = get(problem, 'onsetDateTime', '');
        const status = get(problem, 'clinicalStatus.coding[0].code', 'active');
        prompt += `- ${condition}`;
        if (onset) prompt += ` (onset: ${onset})`;
        if (status !== 'active') prompt += ` [${status}]`;
        prompt += `\n`;
      });
    }

    // Add allergies
    if(ipsData.sections.allergies?.length > 0) {
      prompt += `\nAllergies and Intolerances:\n`;
      ipsData.sections.allergies.forEach(allergy => {
        const allergen = get(allergy, 'code.coding[0].display', get(allergy, 'code.text', 'Unknown'));
        const criticality = get(allergy, 'criticality', 'unknown');
        const reaction = get(allergy, 'reaction[0].manifestation[0].coding[0].display', '');
        prompt += `- ${allergen} (${criticality} criticality)`;
        if (reaction) prompt += ` - Reaction: ${reaction}`;
        prompt += `\n`;
      });
    }

    // Add medications
    if(ipsData.sections.medications?.length > 0) {
      prompt += `\nCurrent Medications:\n`;
      ipsData.sections.medications.forEach(med => {
        const medName = get(med, 'medicationCodeableConcept.coding[0].display', 
          get(med, 'medicationCodeableConcept.text', 'Unknown'));
        const dosage = get(med, 'dosage[0].text', '');
        const route = get(med, 'dosage[0].route.coding[0].display', '');
        prompt += `- ${medName}`;
        if (dosage) prompt += ` - ${dosage}`;
        if (route) prompt += ` (${route})`;
        prompt += `\n`;
      });
    }

    // Add immunizations if present
    if(ipsData.sections.immunizations?.length > 0) {
      prompt += `\nImmunizations:\n`;
      ipsData.sections.immunizations.forEach(imm => {
        const vaccine = get(imm, 'vaccineCode.coding[0].display', 'Unknown vaccine');
        const date = get(imm, 'occurrenceDateTime', '');
        prompt += `- ${vaccine}`;
        if (date) prompt += ` (${date})`;
        prompt += `\n`;
      });
    }

    // Add vital signs if present
    if(ipsData.sections.vitalSigns?.length > 0) {
      prompt += `\nRecent Vital Signs:\n`;
      ipsData.sections.vitalSigns.slice(0, 5).forEach(vital => {
        const type = get(vital, 'code.coding[0].display', 'Unknown');
        const value = get(vital, 'valueQuantity.value', '');
        const unit = get(vital, 'valueQuantity.unit', '');
        const date = get(vital, 'effectiveDateTime', '');
        prompt += `- ${type}: ${value} ${unit}`;
        if (date) prompt += ` (${date})`;
        prompt += `\n`;
      });
    }

    prompt += `
INSTRUCTIONS:
Generate a comprehensive clinical narrative that:
1. BEGINS with patient demographics (name, age, gender, location)
2. Summarizes the patient's current health status in narrative form
3. Integrates problems, medications, and allergies into a coherent clinical picture
4. Highlights critical safety information (allergies, contraindications)
5. Provides a chronological overview when relevant
6. Uses professional medical terminology appropriate for healthcare providers
7. Is suitable for international care coordination and cross-border scenarios
8. Maintains a clear, structured format with appropriate paragraphs

Format the narrative as prose paragraphs, not lists. Begin with: "This International Patient Summary presents..."

CLINICAL NARRATIVE:`;

    return prompt;
  }

  async function generateWithWebLLM(config, prompt) {
    console.log('Generating with WebLLM...', config.model);
    
    try {
      // Detect if we're on iPad/iOS
      const isIPad = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                     (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      // Determine if this is a large model (>2GB)
      const isLargeModel = config.model.includes('Mistral-7B') || 
                          config.model.includes('7B') ||
                          config.model.includes('Phi-3.5');
      
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
        
        // Use conservative settings for iPad to prevent memory issues
        // For large models on iPad, use even more conservative settings
        let engineConfig;
        if (isIPad) {
          if (isLargeModel) {
            // Ultra-conservative for large models on iPad
            engineConfig = {
              initProgressCallback,
              logLevel: 'INFO',
              // Minimal context window for large models
              contextWindowSize: 512,
              // Additional memory-saving options if available
              maxBatchSize: 1,
              maxGenLen: 256
            };
            console.log('Using ultra-conservative settings for large model on iPad');
          } else {
            // Standard conservative for smaller models on iPad
            engineConfig = {
              initProgressCallback,
              logLevel: 'INFO',
              contextWindowSize: 1024,
              maxBatchSize: 1
            };
          }
        } else {
          // Desktop can handle more
          engineConfig = {
            initProgressCallback
          };
        }
        
        // Clear any existing engines to free memory before creating new one
        if (isIPad && window.webllm.engine) {
          try {
            console.log('Clearing existing WebLLM engine to free memory');
            await window.webllm.engine.unload();
            delete window.webllm.engine;
            // Give browser time to garbage collect
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch(e) {
            console.log('Could not clear existing engine:', e);
          }
        }
        
        let engine;
        try {
          engine = await window.webllm.CreateMLCEngine(
            config.model,
            engineConfig
          );
          
          // Store engine reference for cleanup
          window.webllm.engine = engine;
        } catch (engineError) {
          console.error('Failed to create WebLLM engine:', engineError);
          
          // If we're on iPad with a large model, suggest alternatives
          if (isIPad && isLargeModel) {
            throw new Error(`Mistral 7B requires too much memory for iPad. Please try:
• Llama 3.2 1B (works well, 650MB)
• Llama 3.2 3B (1.8GB) 
• Close other apps to free memory
• Use BYOLLMK with cloud API instead`);
          }
          
          // Re-throw for other cases
          throw engineError;
        }
        
        if (config.onProgress) {
          config.onProgress('Generating narrative summary...', 90);
        }
        
        // Adjust prompts based on model size and platform
        let systemPrompt;
        let finalPrompt = prompt;
        let maxTokens;
        
        if (isIPad && isLargeModel) {
          // Minimal prompt for large models on iPad
          systemPrompt = "Summarize this patient data concisely.";
          
          // Aggressively truncate prompt - just keep essentials
          if (prompt.length > 1500) {
            const lines = prompt.split('\n');
            const patientInfo = lines.slice(0, 5).join('\n');
            const keyData = lines.slice(5, 20).join('\n');
            finalPrompt = `${patientInfo}\n\n${keyData}\n\nProvide a brief clinical summary.`;
            console.log('Aggressively truncated prompt for large model from', prompt.length, 'to', finalPrompt.length);
          }
          maxTokens = 256;
        } else if (isIPad) {
          // Standard iPad optimization for smaller models
          systemPrompt = "Generate a concise clinical summary for this International Patient Summary.";
          
          if (prompt.length > 2500) {
            const lines = prompt.split('\n');
            const patientSection = lines.slice(0, 8).join('\n');
            const clinicalSection = lines.slice(8, 30).join('\n');
            const instructionSection = lines.slice(-8).join('\n');
            finalPrompt = patientSection + '\n\n' + clinicalSection + '\n\n' + instructionSection;
            console.log('Truncated prompt for iPad from', prompt.length, 'to', finalPrompt.length);
          }
          maxTokens = 400;
        } else {
          // Desktop - full capability
          systemPrompt = "You are a clinical assistant helping to generate International Patient Summary narratives. Provide professional, concise clinical summaries.";
          maxTokens = 1000;
        }
        
        // Generate the narrative
        const messages = [
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: finalPrompt
          }
        ];
        
        const reply = await engine.chat.completions.create({
          messages,
          temperature: 0.7,
          max_tokens: maxTokens
        });
        
        if (config.onProgress) {
          config.onProgress('Finalizing narrative...', 100);
        }
        
        // Clean up engine to free memory on iPad
        if (isIPad && engine.unload) {
          setTimeout(() => {
            try {
              engine.unload();
              console.log('WebLLM engine unloaded to free memory');
            } catch(e) {
              console.log('Could not unload engine:', e);
            }
          }, 1000);
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
      
      // If we get a memory-related error on iPad, provide a helpful message
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
        if (error.message && (error.message.includes('memory') || error.message.includes('quota'))) {
          throw new Error('Memory limit exceeded on iPad. Try using a smaller model or closing other apps.');
        }
      }
      
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