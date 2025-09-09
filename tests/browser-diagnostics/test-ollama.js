// /Volumes/SonicMagic/Code/honeycomb-public-release/test-ollama.js

/**
 * Test script for Ollama integration with Honeycomb
 * 
 * Usage:
 * 1. Make sure Ollama is installed and running (ollama serve)
 * 2. Pull a model if you haven't already (ollama pull llama2)
 * 3. Start Honeycomb with: meteor run --settings configs/settings.honeycomb.localhost.json
 * 4. In browser console or via the UI, test the Ollama methods
 */

// Test from browser console:
console.log(`
=== OLLAMA INTEGRATION TEST INSTRUCTIONS ===

1. First, check if Ollama is connected:
   Meteor.call('ollama.checkConnection', (err, result) => {
     console.log('Connection status:', err || result);
   });

2. List available models:
   Meteor.call('ollama.listModels', (err, result) => {
     console.log('Available models:', err || result);
   });

3. Get recommended models:
   Meteor.call('ollama.getRecommendedModels', (err, result) => {
     console.log('Recommended models:', err || result);
   });

4. Pull a model (e.g., llama2):
   Meteor.call('ollama.pullModel', 'llama2', (err, result) => {
     console.log('Pull result:', err || result);
   });

5. Test generation with a medical prompt:
   Meteor.call('ollama.generate', {
     model: 'llama2',
     prompt: 'What are the symptoms of hypertension?',
     temperature: 0.7,
     max_tokens: 500
   }, (err, result) => {
     console.log('Generation result:', err || result);
   });

6. Test chat with conversation history:
   Meteor.call('ollama.chat', {
     model: 'llama2',
     messages: [
       { role: 'system', content: 'You are a helpful medical assistant.' },
       { role: 'user', content: 'What is diabetes?' },
       { role: 'assistant', content: 'Diabetes is a chronic condition...' },
       { role: 'user', content: 'What are the main types?' }
     ],
     temperature: 0.7,
     max_tokens: 500
   }, (err, result) => {
     console.log('Chat result:', err || result);
   });

7. Navigate to the Ollama config page:
   window.location.href = '/ollama-config';

=== TESTING VIA UI ===

1. Navigate to http://localhost:3000/ollama-config
2. Check the connection status (should show green if Ollama is running)
3. View installed models
4. Pull a new model using the UI
5. Test the model with a medical prompt

=== COMMON ISSUES ===

- "Connection refused": Make sure Ollama is running (ollama serve)
- "Model not found": Pull the model first (ollama pull llama2)
- "Timeout": Large models may take time to load initially
- CORS issues: The integration uses server-side calls to avoid CORS

=== INTEGRATING WITH MCP CHAT ===

To use Ollama with the MCP chat interface:

1. Configure LLM mode to 'local' in settings
2. Select an Ollama model as the local model
3. The chat interface will automatically use Ollama for responses

Example configuration in settings:
{
  "private": {
    "llmConfig": {
      "llmMode": "local",
      "selectedLocalModel": "ollama:llama2",
      "systemPrompt": "You are a medical assistant specializing in FHIR data.",
      "temperature": 0.7,
      "maxTokens": 2048
    }
  }
}
`);

// Export test functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testOllamaConnection: async function() {
      return new Promise((resolve, reject) => {
        Meteor.call('ollama.checkConnection', (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    },
    
    testOllamaGeneration: async function(prompt) {
      return new Promise((resolve, reject) => {
        Meteor.call('ollama.generate', {
          model: 'llama2',
          prompt: prompt,
          temperature: 0.7,
          max_tokens: 500
        }, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    }
  };
}