// npmPackages/international-patient-summary/client/lib/narrativeEngine.js
//
// IPS narrative generation engine. Extracted verbatim from
// InternationalPatientSummaryPage.jsx (2026-06-30) so the generation flow can run
// from anywhere — it now backs the self-contained GeneratePatientNarrativeModal,
// which both the IPS page and the Chronicle workstation render.
//
// Coupling that was component-scoped in the original is resolved here against
// Session/globals: collectIPSData() reads selectedPatient(Id) from Session, and
// generateNarrative() RETURNS the narrative string (the component used to call
// setNarrativeContent) so the caller owns the editor/Session writes.
//
// constructIPSPrompt + generateWithWebLLM/BYOLLMK/Ollama/Azure below are the
// original functions, unchanged. The WebLLM path still lazy-loads @mlc-ai/web-llm
// by injecting a <script type=module> that string-imports from esm.run — not a
// bundler import, so Rspack does not process or need that dependency.

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get } from 'lodash';

export async function generateNarrative(config) {
  console.log('[narrativeEngine] generateNarrative with config:', config);

  // Collect IPS data and build the prompt.
  const ipsDataForPrompt = await collectIPSData();
  const prompt = constructIPSPrompt(ipsDataForPrompt);

  // Dispatch to the selected provider.
  let narrative = '';
  if (config.provider === 'webllm') {
    narrative = await generateWithWebLLM(config, prompt);
  } else if (config.provider === 'byollmk') {
    narrative = await generateWithBYOLLMK(config, prompt);
  } else if (config.provider === 'local-ollama') {
    narrative = await generateWithOllama(config, prompt);
  } else if (config.provider === 'azure-openai') {
    narrative = await generateWithAzure(config, prompt);
  }

  // Return the narrative (or a guidance message for a minimal response). Errors
  // from the provider helpers propagate to the caller's catch.
  if (narrative && narrative.length > 50) {
    return narrative;
  }

  return 'The model provided a minimal response. This might happen when:\n'
    + '- The model is too small for the task (try a larger model like Mistral 7B)\n'
    + '- The input data is incomplete\n'
    + '- The model needs more specific prompting\n\n'
    + 'Original response: ' + narrative + '\n\n'
    + 'You may want to try a different model or check your data.';
}

export async function collectIPSData() {
  const selectedPatient = Session.get('selectedPatient');
  const selectedPatientId = Session.get('selectedPatientId');

  const data = {
    patient: selectedPatient,
    sections: {}
  };

  // Collect data from each section's collection.
  if (selectedPatientId) {
    if (window.Collections?.Conditions) {
      data.sections.problems = window.Collections.Conditions.find({}).fetch();
    }
    if (window.Collections?.AllergyIntolerances) {
      data.sections.allergies = window.Collections.AllergyIntolerances.find({}).fetch();
    }
    if (window.Collections?.MedicationStatements) {
      data.sections.medications = window.Collections.MedicationStatements.find({}).fetch();
    }
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

          // Handle Cache API network errors (stale/corrupt cache entries)
          if (engineError.message && engineError.message.includes('Cache')) {
            console.warn('[WebLLM] Cache error detected, clearing stale caches and retrying...');

            if (config.onProgress) {
              config.onProgress('Cache error — clearing stale data and retrying...', 30);
            }

            // Clear all WebLLM/MLC caches
            try {
              const cacheNames = await caches.keys();
              for (const name of cacheNames) {
                if (name.includes('webllm') || name.includes('mlc') || name.includes('wasm')) {
                  await caches.delete(name);
                  console.log('[WebLLM] Deleted cache:', name);
                }
              }
            } catch (cacheErr) {
              console.warn('[WebLLM] Could not clear caches:', cacheErr);
            }

            // Retry engine creation once
            try {
              engine = await window.webllm.CreateMLCEngine(config.model, engineConfig);
              window.webllm.engine = engine;
            } catch (retryError) {
              console.error('[WebLLM] Retry also failed:', retryError);
              throw new Error(
                'Could not download model weights. This usually means:\n' +
                '• Your network connection is interrupted or unstable\n' +
                '• The model hosting service (HuggingFace) may be temporarily unavailable\n' +
                '• A browser extension or firewall is blocking the download\n\n' +
                'Try refreshing the page, checking your connection, or using a different provider (Ollama, BYOLLMK).'
              );
            }
          } else if (isIPad && isLargeModel) {
            // If we're on iPad with a large model, suggest alternatives
            throw new Error(`Mistral 7B requires too much memory for iPad. Please try:
• Llama 3.2 1B (works well, 650MB)
• Llama 3.2 3B (1.8GB)
• Close other apps to free memory
• Use BYOLLMK with cloud API instead`);
          } else {
            // Re-throw for other cases
            throw engineError;
          }
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

      // Cache API errors that weren't caught by the inner block
      if (error.message && error.message.includes('Cache')) {
        throw new Error(
          'Model download failed due to a network or caching error. ' +
          'Please check your internet connection and try again. ' +
          'If the problem persists, try a different provider like Ollama or BYOLLMK.'
        );
      }

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
    
    return Meteor.rpc('mcp.generateWithAPIKey', {
      params: {
        provider: config.model.includes('gpt') ? 'openai' : 'anthropic',
        model: config.model,
        apiKey: config.apiKey,
        prompt: prompt
      }
    });
  }

  async function generateWithOllama(config, prompt) {
    // This would integrate with local Ollama
    console.log('Generating with Ollama...', config.model);
    
    return Meteor.rpc('mcp.generateWithOllama', {
      params: {
        model: config.model,
        endpoint: config.endpoint,
        prompt: prompt
      }
    });
  }

  async function generateWithAzure(config, prompt) {
    // This would integrate with Azure OpenAI
    console.log('Generating with Azure OpenAI...', config.model);
    
    return Meteor.rpc('mcp.generateWithAzure', {
      params: {
        model: config.model,
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        prompt: prompt
      }
    });
  }
