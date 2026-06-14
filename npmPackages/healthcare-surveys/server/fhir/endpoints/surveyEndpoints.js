// packages/healthcare-surveys/server/fhir/endpoints/surveyEndpoints.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

// Import collections
import { HcsComposition } from '../../../lib/schemas/HcsComposition';
import { HealthcareSurveysContentBundle } from '../../../lib/schemas/HealthcareSurveysContentBundle';
import { HealthcareSurveysReportingBundle } from '../../../lib/schemas/HealthcareSurveysReportingBundle';

// Base path for healthcare surveys endpoints
const BASE_PATH = '/fhir/healthcare-surveys';

// Helper function to send FHIR response
const sendFhirResponse = function(res, data, statusCode = 200) {
  res.setHeader('Content-Type', 'application/fhir+json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(data));
};

// Helper function to send error response
const sendErrorResponse = function(res, message, statusCode = 400) {
  const operationOutcome = {
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'error',
      code: 'processing',
      diagnostics: message
    }]
  };
  sendFhirResponse(res, operationOutcome, statusCode);
};

// GET /fhir/healthcare-surveys/Composition
WebApp.connectHandlers.use(`${BASE_PATH}/Composition`, async function(req, res, next) {
  if (req.method !== 'GET') {
    return next();
  }
  
  try {
    const query = req.query || {};
    const selector = {};
    
    // Parse query parameters
    if (query.patient) {
      selector['subject.reference'] = `Patient/${query.patient}`;
    }
    
    if (query.encounter) {
      selector['encounter.reference'] = `Encounter/${query.encounter}`;
    }
    
    if (query.date) {
      // Support date searching with prefixes (eq, ne, lt, gt, le, ge)
      const dateParam = query.date;
      if (dateParam.startsWith('eq')) {
        const date = dateParam.substring(2);
        selector.date = date;
      } else if (dateParam.startsWith('gt')) {
        const date = dateParam.substring(2);
        selector.date = { $gt: date };
      } else if (dateParam.startsWith('lt')) {
        const date = dateParam.substring(2);
        selector.date = { $lt: date };
      }
    }
    
    if (query.status) {
      selector.status = query.status;
    }
    
    // Pagination
    const count = parseInt(query._count) || 20;
    const offset = parseInt(query._offset) || 0;
    
    const compositions = await HcsComposition.findAsync(selector, {
      limit: count,
      skip: offset,
      sort: { date: -1 }
    }).fetch();
    
    const total = await HcsComposition.countAsync(selector);
    
    // Create bundle response
    const bundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: total,
      entry: compositions.map(comp => ({
        fullUrl: `${Meteor.absoluteUrl()}fhir/healthcare-surveys/Composition/${comp._id}`,
        resource: comp
      }))
    };
    
    // Add paging links
    bundle.link = [{
      relation: 'self',
      url: `${BASE_PATH}/Composition?${new URLSearchParams(query).toString()}`
    }];
    
    if (offset + count < total) {
      bundle.link.push({
        relation: 'next',
        url: `${BASE_PATH}/Composition?_count=${count}&_offset=${offset + count}`
      });
    }
    
    if (offset > 0) {
      bundle.link.push({
        relation: 'previous',
        url: `${BASE_PATH}/Composition?_count=${count}&_offset=${Math.max(0, offset - count)}`
      });
    }
    
    sendFhirResponse(res, bundle);
  } catch (error) {
    console.error('Error in Composition search:', error);
    sendErrorResponse(res, 'Internal server error', 500);
  }
});

// GET /fhir/healthcare-surveys/Composition/:id
WebApp.connectHandlers.use(`${BASE_PATH}/Composition/:id`, async function(req, res, next) {
  if (req.method !== 'GET') {
    return next();
  }
  
  try {
    const compositionId = req.params.id;
    const composition = await HcsComposition.findOneAsync(compositionId);
    
    if (!composition) {
      sendErrorResponse(res, 'Composition not found', 404);
      return;
    }
    
    sendFhirResponse(res, composition);
  } catch (error) {
    console.error('Error fetching Composition:', error);
    sendErrorResponse(res, 'Internal server error', 500);
  }
});

// POST /fhir/healthcare-surveys/Bundle
WebApp.connectHandlers.use(`${BASE_PATH}/Bundle`, async function(req, res, next) {
  if (req.method !== 'POST') {
    return next();
  }
  
  try {
    const bodyData = [];
    req.on('data', chunk => bodyData.push(chunk));
    req.on('end', async () => {
      try {
        const bundle = JSON.parse(Buffer.concat(bodyData).toString());
        
        // Validate bundle type
        if (bundle.resourceType !== 'Bundle') {
          sendErrorResponse(res, 'Resource must be a Bundle');
          return;
        }
        
        if (bundle.type === 'message') {
          // Handle reporting bundle
          const bundleId = await HealthcareSurveysReportingBundle.insertAsync(bundle);
          
          // Process the bundle (simplified)
          console.log('Received healthcare survey reporting bundle:', bundleId);
          
          // Return accepted response
          res.statusCode = 202;
          res.setHeader('Location', `${BASE_PATH}/Bundle/${bundleId}`);
          res.end();
        } else if (bundle.type === 'collection') {
          // Handle content bundle
          const bundleId = await HealthcareSurveysContentBundle.insertAsync(bundle);
          
          res.statusCode = 201;
          res.setHeader('Location', `${BASE_PATH}/Bundle/${bundleId}`);
          res.end();
        } else {
          sendErrorResponse(res, 'Unsupported bundle type');
        }
      } catch (parseError) {
        console.error('Error parsing bundle:', parseError);
        sendErrorResponse(res, 'Invalid JSON');
      }
    });
  } catch (error) {
    console.error('Error processing Bundle:', error);
    sendErrorResponse(res, 'Internal server error', 500);
  }
});

// GET /fhir/healthcare-surveys/$report-status
WebApp.connectHandlers.use(`${BASE_PATH}/$report-status`, async function(req, res, next) {
  if (req.method !== 'GET') {
    return next();
  }
  
  try {
    const query = req.query || {};
    const result = {
      resourceType: 'Parameters',
      parameter: []
    };
    
    // Get counts
    const compositionCount = await HcsComposition.countAsync();
    const contentBundleCount = await HealthcareSurveysContentBundle.countAsync();
    const reportingBundleCount = await HealthcareSurveysReportingBundle.countAsync();
    
    result.parameter.push({
      name: 'compositionCount',
      valueInteger: compositionCount
    });
    
    result.parameter.push({
      name: 'contentBundleCount',
      valueInteger: contentBundleCount
    });
    
    result.parameter.push({
      name: 'reportingBundleCount',
      valueInteger: reportingBundleCount
    });
    
    result.parameter.push({
      name: 'lastChecked',
      valueDateTime: new Date().toISOString()
    });
    
    sendFhirResponse(res, result);
  } catch (error) {
    console.error('Error getting report status:', error);
    sendErrorResponse(res, 'Internal server error', 500);
  }
});

// Initialize endpoints
Meteor.startup(function() {
  console.log('Healthcare Surveys FHIR endpoints initialized at:', BASE_PATH);
});