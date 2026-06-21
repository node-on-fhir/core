// packages/patient-matching/server/fhir/IdiMatchOperation.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';
import { IdiPatient } from './IdiPatient';
import { auditMatchOperation } from '../security/auditLogging';
import bodyParser from 'body-parser';

// Parse JSON bodies for the match operation
WebApp.connectHandlers.use('/fhir/Patient/$match', bodyParser.json());

// FHIR Patient $match operation implementation
WebApp.connectHandlers.use('/fhir/Patient/$match', async function(req, res, next) {
  console.log('FHIR $match operation called', req.method);
  
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/fhir+json' });
    res.end(JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'processing',
        diagnostics: 'Method not allowed. Use POST for $match operation.'
      }]
    }));
    return;
  }
  
  try {
    // Extract parameters from request
    const parameters = req.body;
    
    if (parameters.resourceType !== 'Parameters') {
      throw new Error('Expected Parameters resource');
    }
    
    // Find the patient parameter
    const patientParam = parameters.parameter?.find(p => p.name === 'resource');
    const patientResource = get(patientParam, 'resource');
    
    if (!patientResource || patientResource.resourceType !== 'Patient') {
      throw new Error('Patient resource parameter required');
    }
    
    // Extract match parameters
    const onlyCertainMatches = parameters.parameter?.find(p => p.name === 'onlyCertainMatches')?.valueBoolean || false;
    const matchCount = parameters.parameter?.find(p => p.name === 'count')?.valueInteger || 10;
    
    // Validate patient for matching
    const validation = IdiPatient.validateForMatching(patientResource);
    if (!validation.valid) {
      throw new Error(`Invalid patient data: ${validation.errors.join(', ')}`);
    }
    
    // Extract matching criteria
    const criteria = IdiPatient.extractMatchingCriteria(patientResource);
    
    console.log('Matching criteria:', criteria);
    
    // Build MongoDB query
    const query = {};
    
    // Name matching
    if (criteria.name?.family) {
      query['name.family'] = new RegExp(criteria.name.family, 'i');
    }
    if (criteria.name?.given?.length > 0) {
      query['name.given'] = new RegExp(criteria.name.given[0], 'i');
    }
    
    // Demographics
    if (criteria.birthDate) {
      query.birthDate = criteria.birthDate;
    }
    if (criteria.gender) {
      query.gender = criteria.gender;
    }
    
    // Get patient collection
    const PatientCollection = Meteor.settings?.private?.fhir?.autoGenerateCollections 
      ? Collections['Patient'] 
      : Patient;
    
    if (!PatientCollection) {
      throw new Error('Patient collection not available');
    }
    
    // Find potential matches
    const potentialMatches = await PatientCollection.find(query, { 
      limit: matchCount * 2 // Get more to filter by score
    }).fetchAsync();
    
    // Score and rank matches
    const scoredMatches = potentialMatches.map(match => ({
      patient: match,
      score: IdiPatient.calculateMatchScore(patientResource, match)
    }));
    
    // Sort by score
    scoredMatches.sort((a, b) => b.score - a.score);
    
    // Filter by certainty if requested
    let finalMatches = scoredMatches;
    if (onlyCertainMatches) {
      finalMatches = scoredMatches.filter(m => m.score >= 80);
    }
    
    // Limit to requested count
    finalMatches = finalMatches.slice(0, matchCount);
    
    // Build response bundle
    const responseBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: finalMatches.length,
      entry: finalMatches.map(match => ({
        fullUrl: `${Meteor.absoluteUrl()}fhir/Patient/${match.patient._id}`,
        resource: match.patient,
        search: {
          extension: [{
            url: 'http://hl7.org/fhir/StructureDefinition/match-grade',
            valueCode: match.score >= 80 ? 'certain' : match.score >= 60 ? 'probable' : 'possible'
          }],
          mode: 'match',
          score: match.score / 100
        }
      }))
    };
    
    // Audit the match operation
    await auditMatchOperation({
      userId: req.userId || 'anonymous',
      operation: 'match',
      patientData: patientResource,
      matchCount: finalMatches.length,
      timestamp: new Date()
    });
    
    // Return response
    res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
    res.end(JSON.stringify(responseBundle));
    
  } catch (error) {
    console.error('$match operation error:', error);
    res.writeHead(400, { 'Content-Type': 'application/fhir+json' });
    res.end(JSON.stringify({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'processing',
        diagnostics: error.message
      }]
    }));
  }
});