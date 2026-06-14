// packages/patient-matching/server/rest/idiMatchEndpoint.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';
import bodyParser from 'body-parser';

// Parse JSON bodies
WebApp.connectHandlers.use('/idi/match', bodyParser.json());

// IDI Patient Match REST endpoint
WebApp.connectHandlers.use('/idi/match', async function(req, res, next) {
  console.log('IDI Match endpoint hit', req.method, req.url);

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  try {
    // Extract patient data from request
    const requestBody = req.body;
    const patientData = get(requestBody, 'patient', {});
    
    // Extract demographics
    const firstName = get(patientData, 'name[0].given[0]', '');
    const lastName = get(patientData, 'name[0].family', '');
    const birthDate = get(patientData, 'birthDate', '');
    const gender = get(patientData, 'gender', '');
    
    // Extract identifiers
    const identifiers = get(patientData, 'identifier', []);
    const ssn = identifiers.find(id => get(id, 'system') === 'http://hl7.org/fhir/sid/us-ssn');
    const mrn = identifiers.find(id => get(id, 'system') === 'http://hospital.org/mrn');
    
    console.log('Matching request for:', {
      firstName,
      lastName,
      birthDate,
      gender,
      hasSSN: !!ssn,
      hasMRN: !!mrn
    });

    // Simple matching logic (to be enhanced with actual IDI integration)
    const matchCriteria = {
      'name.given': firstName,
      'name.family': lastName,
      'birthDate': birthDate
    };

    if (gender) {
      matchCriteria.gender = gender;
    }

    // Search for matching patients
    const PatientCollection = Meteor.settings?.private?.fhir?.autoGenerateCollections 
      ? Collections['Patient'] 
      : Patient;

    let matches = [];
    if (PatientCollection) {
      matches = await PatientCollection.find(matchCriteria, { limit: 10 }).fetchAsync();
    }

    // Calculate match confidence scores
    const scoredMatches = matches.map(patient => {
      let score = 0;
      
      // Name matching
      if (get(patient, 'name[0].given[0]') === firstName) score += 30;
      if (get(patient, 'name[0].family') === lastName) score += 30;
      
      // Date matching
      if (patient.birthDate === birthDate) score += 20;
      
      // Gender matching
      if (patient.gender === gender) score += 10;
      
      // Identifier matching
      const patientIdentifiers = get(patient, 'identifier', []);
      if (ssn && patientIdentifiers.some(id => 
        id.system === ssn.system && id.value === ssn.value
      )) {
        score += 40;
      }
      
      return {
        resource: patient,
        score: score
      };
    });

    // Sort by score descending
    scoredMatches.sort((a, b) => b.score - a.score);

    // Format response
    const response = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: scoredMatches.length,
      entry: scoredMatches.map(match => ({
        resource: match.resource,
        search: {
          mode: 'match',
          score: match.score / 100
        }
      }))
    };

    res.writeHead(200, { 'Content-Type': 'application/fhir+json' });
    res.end(JSON.stringify(response));

  } catch (error) {
    console.error('IDI Match error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }));
  }
});