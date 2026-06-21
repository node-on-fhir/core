// packages/healthcare-surveys/server/fhir/transforms/compositionTransforms.js

import { get } from 'lodash';
import moment from 'moment';
import { HCS_SECTION_CODES } from '../../../lib/constants/sectionCodes';

// Transform internal composition data to FHIR format
export const transformToFhirComposition = function(internalData) {
  if (!internalData) return null;
  
  const composition = {
    resourceType: 'Composition',
    id: get(internalData, '_id'),
    status: get(internalData, 'status', 'final'),
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '75619-7',
        display: 'Health Care Survey Report'
      }]
    },
    subject: {
      reference: get(internalData, 'patientReference'),
      display: get(internalData, 'patientDisplay')
    },
    encounter: {
      reference: get(internalData, 'encounterReference'),
      display: get(internalData, 'encounterDisplay')
    },
    date: moment(get(internalData, 'createdAt', new Date())).toISOString(),
    author: [{
      reference: get(internalData, 'authorReference'),
      display: get(internalData, 'authorDisplay')
    }],
    title: 'National Health Care Surveys report',
    section: []
  };
  
  // Add sections
  const sections = get(internalData, 'sections', []);
  sections.forEach(section => {
    const fhirSection = transformSection(section);
    if (fhirSection) {
      composition.section.push(fhirSection);
    }
  });
  
  return composition;
};

// Transform a single section
const transformSection = function(section) {
  if (!section) return null;
  
  const sectionCode = get(section, 'code');
  const sectionDef = HCS_SECTION_CODES[sectionCode];
  
  if (!sectionDef) {
    console.warn(`Unknown section code: ${sectionCode}`);
    return null;
  }
  
  return {
    title: sectionDef.display,
    code: {
      coding: [{
        system: sectionDef.system,
        code: sectionDef.code,
        display: sectionDef.display
      }]
    },
    text: {
      status: 'generated',
      div: get(section, 'narrative', `<div>${sectionDef.display}</div>`)
    },
    entry: transformSectionEntries(section.entries, sectionCode)
  };
};

// Transform section entries based on section type
const transformSectionEntries = function(entries, sectionCode) {
  if (!entries || !Array.isArray(entries)) return [];
  
  return entries.map(entry => {
    const reference = get(entry, 'reference');
    const display = get(entry, 'display');
    
    return {
      reference: reference,
      display: display || reference
    };
  });
};

// Transform FHIR composition to internal format
export const transformFromFhirComposition = function(fhirComposition) {
  if (!fhirComposition) return null;
  
  const internalData = {
    status: get(fhirComposition, 'status'),
    patientReference: get(fhirComposition, 'subject.reference'),
    patientDisplay: get(fhirComposition, 'subject.display'),
    encounterReference: get(fhirComposition, 'encounter.reference'),
    encounterDisplay: get(fhirComposition, 'encounter.display'),
    authorReference: get(fhirComposition, 'author[0].reference'),
    authorDisplay: get(fhirComposition, 'author[0].display'),
    createdAt: moment(get(fhirComposition, 'date')).toDate(),
    sections: []
  };
  
  // Transform sections
  const fhirSections = get(fhirComposition, 'section', []);
  fhirSections.forEach(fhirSection => {
    const section = transformFromFhirSection(fhirSection);
    if (section) {
      internalData.sections.push(section);
    }
  });
  
  return internalData;
};

// Transform FHIR section to internal format
const transformFromFhirSection = function(fhirSection) {
  if (!fhirSection) return null;
  
  const code = get(fhirSection, 'code.coding[0].code');
  const narrative = get(fhirSection, 'text.div', '');
  const entries = get(fhirSection, 'entry', []);
  
  // Find matching section definition
  let sectionKey = null;
  Object.keys(HCS_SECTION_CODES).forEach(key => {
    if (HCS_SECTION_CODES[key].code === code) {
      sectionKey = key;
    }
  });
  
  if (!sectionKey) {
    console.warn(`Unknown LOINC code in section: ${code}`);
    return null;
  }
  
  return {
    code: sectionKey,
    narrative: narrative,
    entries: entries.map(entry => ({
      reference: get(entry, 'reference'),
      display: get(entry, 'display')
    }))
  };
};

// Validate composition structure
export const validateComposition = function(composition) {
  const errors = [];
  
  if (!composition) {
    errors.push('Composition is null or undefined');
    return errors;
  }
  
  // Check required fields
  if (!get(composition, 'status')) {
    errors.push('status is required');
  }
  
  if (!get(composition, 'subject.reference')) {
    errors.push('subject reference is required');
  }
  
  if (!get(composition, 'encounter.reference')) {
    errors.push('encounter reference is required');
  }
  
  // Check required sections
  const sections = get(composition, 'section', []);
  const sectionCodes = sections.map(s => get(s, 'code.coding[0].code'));
  
  const requiredSectionCodes = [
    HCS_SECTION_CODES.REASON_FOR_VISIT.code,
    HCS_SECTION_CODES.PROBLEM.code,
    HCS_SECTION_CODES.ALLERGIES.code
  ];
  
  requiredSectionCodes.forEach(reqCode => {
    if (!sectionCodes.includes(reqCode)) {
      errors.push(`Required section missing: ${reqCode}`);
    }
  });
  
  // Validate each section
  sections.forEach((section, index) => {
    if (!get(section, 'code.coding[0].code')) {
      errors.push(`Section ${index} missing code`);
    }
    if (!get(section, 'text.div')) {
      errors.push(`Section ${index} missing narrative text`);
    }
  });
  
  return errors;
};

// Generate section narrative from entries
export const generateSectionNarrative = function(section) {
  const entries = get(section, 'entry', []);
  const title = get(section, 'title', 'Section');
  
  if (entries.length === 0) {
    return `<div><p>No entries recorded for ${title}</p></div>`;
  }
  
  let html = '<div><ul>';
  entries.forEach(entry => {
    const display = get(entry, 'display', get(entry, 'reference', 'Unknown'));
    html += `<li>${display}</li>`;
  });
  html += '</ul></div>';
  
  return html;
};