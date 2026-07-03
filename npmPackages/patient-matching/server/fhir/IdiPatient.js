// packages/patient-matching/server/fhir/IdiPatient.js

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

// FHIR Patient resource enhancements for IDI matching
export const IdiPatient = {
  
  // Enhance patient resource with IDI-specific identifiers
  addIdiIdentifier: function(patient, idiId, idiSystem = 'https://idi.gov/patient-id') {
    if (!patient.identifier) {
      patient.identifier = [];
    }
    
    // Check if IDI identifier already exists
    const existingIndex = patient.identifier.findIndex(id => 
      get(id, 'system') === idiSystem
    );
    
    const idiIdentifier = {
      use: 'official',
      system: idiSystem,
      value: idiId,
      assigner: {
        display: 'Individual Digital Identity Service'
      }
    };
    
    if (existingIndex >= 0) {
      patient.identifier[existingIndex] = idiIdentifier;
    } else {
      patient.identifier.push(idiIdentifier);
    }
    
    return patient;
  },
  
  // Extract matching criteria from patient
  extractMatchingCriteria: function(patient) {
    const criteria = {};
    
    // Name criteria
    const givenNames = get(patient, 'name[0].given', []);
    const familyName = get(patient, 'name[0].family', '');
    
    if (givenNames.length > 0) {
      set(criteria, 'name.given', givenNames);
    }
    if (familyName) {
      set(criteria, 'name.family', familyName);
    }
    
    // Demographics
    const birthDate = get(patient, 'birthDate');
    const gender = get(patient, 'gender');
    
    if (birthDate) {
      criteria.birthDate = birthDate;
    }
    if (gender) {
      criteria.gender = gender;
    }
    
    // Identifiers
    const identifiers = get(patient, 'identifier', []);
    criteria.identifiers = identifiers.map(id => ({
      system: get(id, 'system'),
      value: get(id, 'value')
    }));
    
    // Address
    const address = get(patient, 'address[0]');
    if (address) {
      criteria.address = {
        line: get(address, 'line', []),
        city: get(address, 'city'),
        state: get(address, 'state'),
        postalCode: get(address, 'postalCode'),
        country: get(address, 'country')
      };
    }
    
    // Contact info
    const telecom = get(patient, 'telecom', []);
    criteria.telecom = telecom.map(t => ({
      system: get(t, 'system'),
      value: get(t, 'value'),
      use: get(t, 'use')
    }));
    
    return criteria;
  },
  
  // Calculate demographic match score
  calculateMatchScore: function(patient1, patient2) {
    let score = 0;
    const maxScore = 100;
    
    // Name matching (40 points max)
    const given1 = get(patient1, 'name[0].given[0]', '').toLowerCase();
    const given2 = get(patient2, 'name[0].given[0]', '').toLowerCase();
    const family1 = get(patient1, 'name[0].family', '').toLowerCase();
    const family2 = get(patient2, 'name[0].family', '').toLowerCase();
    
    if (given1 && given1 === given2) {
      score += 20;
    } else if (given1 && given2 && given1.startsWith(given2) || given2.startsWith(given1)) {
      score += 10;
    }
    
    if (family1 && family1 === family2) {
      score += 20;
    } else if (family1 && family2 && this.soundsLike(family1, family2)) {
      score += 10;
    }
    
    // Birth date matching (20 points)
    if (patient1.birthDate && patient1.birthDate === patient2.birthDate) {
      score += 20;
    }
    
    // Gender matching (10 points)
    if (patient1.gender && patient1.gender === patient2.gender) {
      score += 10;
    }
    
    // Identifier matching (30 points max)
    const identifiers1 = get(patient1, 'identifier', []);
    const identifiers2 = get(patient2, 'identifier', []);
    
    for (const id1 of identifiers1) {
      for (const id2 of identifiers2) {
        if (id1.system === id2.system && id1.value === id2.value) {
          // SSN match is highest confidence
          if (id1.system === 'http://hl7.org/fhir/sid/us-ssn') {
            score += 30;
          } else {
            score += 15;
          }
          break;
        }
      }
    }
    
    return Math.min(score, maxScore);
  },
  
  // Simple phonetic matching
  soundsLike: function(str1, str2) {
    // Very basic soundex-like comparison
    const normalize = (str) => str.toLowerCase()
      .replace(/[aeiou]/g, '')
      .replace(/(.)\1+/g, '$1');
    
    return normalize(str1) === normalize(str2);
  },
  
  // Validate patient for IDI matching
  validateForMatching: function(patient) {
    const errors = [];
    
    // Check required fields
    if (!get(patient, 'name[0].family')) {
      errors.push('Missing family name');
    }
    
    if (!get(patient, 'name[0].given[0]')) {
      errors.push('Missing given name');
    }
    
    if (!patient.birthDate) {
      errors.push('Missing birth date');
    }
    
    // Check for at least one identifier
    const identifiers = get(patient, 'identifier', []);
    if (identifiers.length === 0) {
      errors.push('At least one identifier required');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
};