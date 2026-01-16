// packages/healthcare-surveys/tests/unit/schemas/HcsComposition.tests.js

import { Tinytest } from 'meteor/tinytest';
import { HcsComposition, HcsCompositionSchema } from '../../../lib/schemas/HcsComposition';

Tinytest.add('HcsComposition - schema validation - valid composition', function(test) {
  const validComposition = {
    resourceType: 'Composition',
    identifier: [{
      system: 'http://example.org',
      value: '12345'
    }],
    status: 'final',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '75619-7',
        display: 'Health Care Survey Report'
      }]
    },
    subject: {
      reference: 'Patient/123'
    },
    encounter: {
      reference: 'Encounter/456'
    },
    date: new Date().toISOString(),
    author: [{
      reference: 'Practitioner/789'
    }],
    title: 'National Health Care Surveys report',
    section: [
      {
        title: 'Reason for visit',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29299-5'
          }]
        },
        text: {
          div: '<div>Test</div>'
        }
      },
      {
        title: 'Problem List',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '11450-4'
          }]
        },
        text: {
          div: '<div>Test</div>'
        }
      },
      {
        title: 'Allergies',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '48765-2'
          }]
        },
        text: {
          div: '<div>Test</div>'
        }
      }
    ]
  };
  
  const context = HcsCompositionSchema.newContext();
  context.validate(validComposition);
  test.isTrue(context.isValid());
});

Tinytest.add('HcsComposition - schema validation - missing required section', function(test) {
  const invalidComposition = {
    resourceType: 'Composition',
    identifier: [{
      system: 'http://example.org',
      value: '12345'
    }],
    status: 'final',
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '75619-7'
      }]
    },
    subject: {
      reference: 'Patient/123'
    },
    encounter: {
      reference: 'Encounter/456'
    },
    date: new Date().toISOString(),
    title: 'National Health Care Surveys report',
    section: [
      {
        title: 'Reason for visit',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29299-5'
          }]
        },
        text: {
          div: '<div>Test</div>'
        }
      },
      {
        title: 'Problem List',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '11450-4'
          }]
        },
        text: {
          div: '<div>Test</div>'
        }
      }
      // Missing Allergies section
    ]
  };
  
  const context = HcsCompositionSchema.newContext();
  context.validate(invalidComposition);
  test.isFalse(context.isValid());
});

Tinytest.add('HcsComposition - schema validation - invalid status', function(test) {
  const invalidComposition = {
    resourceType: 'Composition',
    status: 'draft', // Should be 'final'
    type: {
      coding: [{
        system: 'http://loinc.org',
        code: '75619-7'
      }]
    },
    subject: {
      reference: 'Patient/123'
    },
    encounter: {
      reference: 'Encounter/456'
    }
  };
  
  const context = HcsCompositionSchema.newContext();
  context.validate(invalidComposition);
  test.isFalse(context.isValid());
});

Tinytest.add('HcsComposition - section codes constants', function(test) {
  test.equal(HCS_COMPOSITION_SECTIONS.REASON_FOR_VISIT.code, '29299-5');
  test.equal(HCS_COMPOSITION_SECTIONS.PROBLEM.code, '11450-4');
  test.equal(HCS_COMPOSITION_SECTIONS.ALLERGIES.code, '48765-2');
  test.equal(HCS_COMPOSITION_SECTIONS.MEDICATIONS.code, '10160-0');
  test.equal(HCS_COMPOSITION_SECTIONS.VITAL_SIGNS.code, '8716-3');
});