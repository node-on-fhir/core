// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/server/routes.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// Simple API endpoint for consent generation
WebApp.connectHandlers.use('/consent-generator/api', async (req, res, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  
  res.setHeader('Content-Type', 'application/json');
  
  // Simple status endpoint
  if (req.method === 'GET') {
    const templates = Meteor.call('consents.listTemplates');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'active',
      message: 'Consent Generator API',
      templates: templates,
      endpoints: {
        'GET /consent-generator/api': 'This help message',
        'POST /consent-generator/api/generate': 'Generate a consent',
        'POST /consent-generator/api/batch': 'Generate multiple consents',
        'POST /consent-generator/api/initialize': 'Initialize default consents'
      }
    }, null, 2));
    return;
  }
  
  // Handle POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        let result;
        
        if (req.url.includes('/generate')) {
          result = await Meteor.call('consents.generate', data);
        } else if (req.url.includes('/batch')) {
          result = await Meteor.call('consents.generateBatch', data);
        } else if (req.url.includes('/initialize')) {
          result = await Meteor.call('consents.initializeDefaults');
        } else {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
          return;
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.statusCode = 400;
        res.end(JSON.stringify({ 
          error: error.message,
          details: error.details 
        }));
      }
    });
    return;
  }
  
  // Not our endpoint, pass to next handler
  next();
});