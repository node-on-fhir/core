// packages/international-patient-summary/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('ips-methods') : console);

// rpc-migration (Loop 1): converted to Meteor.ServerMethods.define (global
// registry). The legacy 'compositions.insert' name COLLIDES with core
// (imports/api/compositions/methods.js), so it is re-registered here as the
// canonical 'ips.saveComposition' and the legacy alias is only offered when the
// core name is free (it never is when core is loaded — aliasIfFree returns []).
// Guards deleted in favor of requireAuth (default true, except the model-config
// lookups which stay public); check() -> schemaObject; this.userId ->
// context.userId. phi:true where patient data flows.

// Offer a legacy alias only when core hasn't already claimed the name (mirrors
// provider-directory/server/methods.js aliasIfFree).
function aliasIfFree(legacyName){
  const handlers = (Meteor.server && Meteor.server.method_handlers) || {};
  if (handlers[legacyName]) {
    console.log('[international-patient-summary] legacy name already defined by core, no alias:', legacyName);
    return [];
  }
  return [legacyName];
}

Meteor.ServerMethods.define('ips.saveComposition', {
  description: 'Save an IPS Composition resource (adds IPS profile/identifier metadata)',
  phi: true,
  aliases: aliasIfFree('compositions.insert'),
  positionalParams: ['composition'],
  schemaObject: {
    type: 'object',
    properties: {
      composition: {
        type: 'object',
        properties: {
          resourceType: { type: 'string' },
          status: { type: 'string' },
          type: { type: 'object' },
          subject: { type: 'object' },
          date: { type: 'string' },
          author: { type: 'array' },
          title: { type: 'string' },
          section: { type: 'array' }
        },
        required: ['resourceType', 'status', 'type', 'subject', 'date', 'author', 'title', 'section']
      }
    },
    required: ['composition']
  }
}, async function(params, context){
  const composition = get(params, 'composition');

  // Validate it's a Composition resource
  if(composition.resourceType !== 'Composition') {
    throw new Meteor.Error('invalid-resource', 'Resource must be a Composition');
  }

  // Add metadata
    composition.meta = {
      versionId: '1',
      lastUpdated: new Date().toISOString(),
      profile: ['http://hl7.org/fhir/uv/ips/StructureDefinition/Composition-uv-ips']
    };

    // Add identifier
    composition.identifier = {
      system: 'urn:oid:2.16.840.1.113883.2.4.6.3',
      value: 'IPS-' + new Date().getTime()
    };

    // Generate FHIR id if not present
    if(!composition.id) {
      composition.id = Random.id();
    }

    try {
      // Get the Compositions collection
      let Compositions;
      if(Package['clinical:hl7-fhir-data-infrastructure']) {
        Compositions = Package['clinical:hl7-fhir-data-infrastructure'].Compositions;
      } else if(Meteor.Collections && Meteor.Collections.Compositions) {
        Compositions = Meteor.Collections.Compositions;
      } else if(global.Collections && global.Collections.Compositions) {
        Compositions = global.Collections.Compositions;
      }

      if(!Compositions) {
        // Create a simple collection if it doesn't exist
        Compositions = new Mongo.Collection('Compositions');
      }

      // Insert the composition using async method
      const compositionId = await Compositions.insertAsync(composition);

      console.log('IPS Composition saved with ID:', compositionId);

      return compositionId;
    } catch(error) {
      console.error('Error saving composition:', error);
      throw new Meteor.Error('save-failed', error.message);
    }
});

Meteor.ServerMethods.define('mcp.generateWithWebLLM', {
  description: 'Signal the client to run IPS narrative generation locally with WebLLM',
  // The prompt is derived from patient clinical data (IPS narrative). Server
  // only echoes it back for the browser to execute; historically guard-less,
  // kept public, but flagged phi since patient content transits the call.
  phi: true,
  requireAuth: false,
  positionalParams: ['params'],
  schemaObject: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['model', 'prompt']
      }
    },
    required: ['params']
  }
}, async function(rpcParams, context){
  const params = get(rpcParams, 'params');
  console.log('Generating IPS narrative with WebLLM:', params.model);

  try {
      // For WebLLM, we need to return a message to the client to handle locally
      // since WebLLM runs in the browser
      return {
        status: 'client-side',
        message: 'WebLLM must be executed on the client side',
        model: params.model,
        prompt: params.prompt
      };
    } catch (error) {
      console.error('Error in mcp.generateWithWebLLM:', error);
      throw new Meteor.Error('generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('mcp.generateWithAPIKey', {
  description: 'Generate an IPS narrative via a BYOK OpenAI/Anthropic API key',
  // Prompt carries patient clinical content; apiKey is a caller-supplied secret.
  phi: true,
  positionalParams: ['params'],
  schemaObject: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          provider: { type: 'string' },
          model: { type: 'string' },
          apiKey: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['provider', 'model', 'apiKey', 'prompt']
      }
    },
    required: ['params']
  }
}, async function(rpcParams, context){
  const params = get(rpcParams, 'params');
  console.log(`Generating IPS narrative with ${params.provider}:`, params.model);

  try {
    let response;
      
      if (params.provider === 'openai') {
        // OpenAI API call
        const endpoint = 'https://api.openai.com/v1/chat/completions';
        
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${params.apiKey}`
          },
          body: JSON.stringify({
            model: params.model,
            messages: [
              {
                role: 'system',
                content: 'You are a clinical assistant helping to generate International Patient Summary narratives. Provide professional, concise clinical summaries.'
              },
              {
                role: 'user',
                content: params.prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        const data = await result.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'OpenAI API error');
        }
        
        response = data.choices[0].message.content;
        
      } else if (params.provider === 'anthropic') {
        // Anthropic Claude API call
        const endpoint = 'https://api.anthropic.com/v1/messages';
        
        const result = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': params.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            // NOTE: `temperature` is intentionally omitted. It is rejected (400)
            // on claude-fable-5 / claude-opus-4-8 / claude-opus-4-7; the model
            // default is fine for narrative text. Sonnet 4.6 / Haiku 4.5 still
            // accept it, but dropping it keeps every offered model working.
            model: params.model,
            messages: [
              {
                role: 'user',
                content: params.prompt
              }
            ],
            max_tokens: 1000
          })
        });

        const data = await result.json();
        
        if (data.error) {
          throw new Error(data.error.message || 'Anthropic API error');
        }
        
        response = data.content[0].text;
      }

      return response;

    } catch (error) {
      console.error(`Error in mcp.generateWithAPIKey (${params.provider}):`, error);
      throw new Meteor.Error('generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('mcp.generateWithOllama', {
  description: 'Generate an IPS narrative via a local/remote Ollama endpoint',
  // Prompt carries patient clinical content.
  phi: true,
  positionalParams: ['params'],
  schemaObject: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          endpoint: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['model', 'endpoint', 'prompt']
      }
    },
    required: ['params']
  }
}, async function(rpcParams, context){
  const params = get(rpcParams, 'params');
  console.log('Generating IPS narrative with Ollama:', params.model);

  try {
    // Ollama API call
    const endpoint = params.endpoint || 'http://localhost:11434';
      
      const result = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: params.model,
          prompt: params.prompt,
          stream: false
        })
      });

      const data = await result.json();
      
      if (data.error) {
        throw new Error(data.error || 'Ollama API error');
      }
      
      return data.response;

    } catch (error) {
      console.error('Error in mcp.generateWithOllama:', error);
      throw new Meteor.Error('generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('mcp.generateWithAzure', {
  description: 'Generate an IPS narrative via an Azure OpenAI deployment',
  // Prompt carries patient clinical content; apiKey is a caller-supplied secret.
  phi: true,
  positionalParams: ['params'],
  schemaObject: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          model: { type: 'string' },
          endpoint: { type: 'string' },
          apiKey: { type: 'string' },
          prompt: { type: 'string' }
        },
        required: ['model', 'endpoint', 'apiKey', 'prompt']
      }
    },
    required: ['params']
  }
}, async function(rpcParams, context){
  const params = get(rpcParams, 'params');
  console.log('Generating IPS narrative with Azure OpenAI:', params.model);

  try {
    // Azure OpenAI API call
      const result = await fetch(`${params.endpoint}/openai/deployments/${params.model}/chat/completions?api-version=2023-05-15`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': params.apiKey
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a clinical assistant helping to generate International Patient Summary narratives.'
            },
            {
              role: 'user',
              content: params.prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      const data = await result.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Azure OpenAI API error');
      }
      
      return data.choices[0].message.content;

    } catch (error) {
      console.error('Error in mcp.generateWithAzure:', error);
      throw new Meteor.Error('generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('ips.fetchLinkedData', {
  description: 'Gather all patient-compartment resources for building an IPS summary',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
  const patientId = get(params, 'patientId');

  const collectionsToSearch = [
      { name: 'Conditions',           path: 'subject.reference' },
      { name: 'AllergyIntolerances',  path: 'patient.reference' },
      { name: 'MedicationStatements', path: 'subject.reference' },
      { name: 'MedicationRequests',   path: 'subject.reference' },
      { name: 'Immunizations',        path: 'patient.reference' },
      { name: 'Observations',         path: 'subject.reference' },
      { name: 'Procedures',           path: 'subject.reference' },
      { name: 'DiagnosticReports',    path: 'subject.reference' },
      { name: 'DeviceUseStatements',  path: 'subject.reference' },
      { name: 'CarePlans',            path: 'subject.reference' },
      { name: 'Goals',                path: 'subject.reference' },
      { name: 'DocumentReferences',   path: 'subject.reference' }
    ];

    const results = {};
    await Promise.all(collectionsToSearch.map(async function({ name, path }) {
      const collection = global.Collections[name];
      if (!collection) return;
      const query = {};
      query[path] = 'Patient/' + patientId;
      results[name] = await collection.find(query, { limit: 100 }).fetchAsync();
    }));

    const Patients = global.Collections.Patients;
    if (Patients) {
      results.Patient = await Patients.findOneAsync({ _id: patientId })
                      || await Patients.findOneAsync({ id: patientId });
    }

    log.debug('Fetched data for patient:', { patientId, summary: Object.keys(results).map(function(k) { return k + ': ' + (Array.isArray(results[k]) ? results[k].length : (results[k] ? 1 : 0)); }).join(', ') });

    return results;
});

Meteor.ServerMethods.define('mcp.getAvailableModels', {
  description: 'Report which IPS narrative-generation model backends are available',
  // Public config lookup (no patient data); historically guard-less.
  requireAuth: false
}, function(params, context){
  // Return available models configuration
  return {
    webllm: {
      available: true,
      models: ['Mistral-7B-Instruct-v0.3', 'Llama-3.2-1B-Instruct', 'Phi-3.5-mini-instruct']
    },
    ollama: {
      available: false, // Will be checked dynamically
      endpoint: 'http://localhost:11434'
    },
    byollmk: {
      openai: get(Meteor, 'settings.public.openai.configured', false),
      anthropic: get(Meteor, 'settings.public.anthropic.configured', false)
    }
  };
});