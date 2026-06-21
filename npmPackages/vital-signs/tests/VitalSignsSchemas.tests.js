// packages/vital-signs/tests/VitalSignsSchemas.tests.js

import { expect } from 'chai';
import { VitalSignsSchemas } from '../lib/index';
import { get } from 'lodash';

describe('VitalSignsSchemas', function() {
  
  describe('Schema Exports', function() {
    it('should export all vital signs schemas', function() {
      expect(VitalSignsSchemas).to.be.an('object');
      expect(VitalSignsSchemas.VitalSignsPanel).to.exist;
      expect(VitalSignsSchemas.BloodPressurePanel).to.exist;
      expect(VitalSignsSchemas.BodyWeight).to.exist;
      expect(VitalSignsSchemas.BodyTemperature).to.exist;
      expect(VitalSignsSchemas.HeartRate).to.exist;
      expect(VitalSignsSchemas.RespiratoryRate).to.exist;
      expect(VitalSignsSchemas.OxygenSaturation).to.exist;
      expect(VitalSignsSchemas.BodyMassIndex).to.exist;
      expect(VitalSignsSchemas.Height).to.exist;
      expect(VitalSignsSchemas.BodyLength).to.exist;
      expect(VitalSignsSchemas.HeadCircumference).to.exist;
    });
    
    it('should have valid SimpleSchema instances', function() {
      Object.keys(VitalSignsSchemas).forEach(function(schemaName) {
        const schema = VitalSignsSchemas[schemaName];
        expect(schema).to.have.property('_schema');
        expect(schema).to.have.property('validate');
        expect(schema.validate).to.be.a('function');
      });
    });
  });
  
  describe('VitalSignsPanel Schema', function() {
    const schema = VitalSignsSchemas.VitalSignsPanel;
    
    it('should validate a minimal vital signs panel', function() {
      const minimalPanel = {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1'
          }]
        },
        subject: {
          reference: 'Patient/123'
        }
      };
      
      const validationContext = schema.newContext();
      const isValid = validationContext.validate(minimalPanel);
      
      expect(isValid).to.be.true;
      expect(validationContext.validationErrors()).to.have.length(0);
    });
    
    it('should require resourceType to be Observation', function() {
      const invalidPanel = {
        resourceType: 'Patient',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1'
          }]
        },
        subject: {
          reference: 'Patient/123'
        }
      };
      
      const validationContext = schema.newContext();
      const isValid = validationContext.validate(invalidPanel);
      
      expect(isValid).to.be.false;
    });
    
    it('should require a subject reference', function() {
      const panelWithoutSubject = {
        resourceType: 'Observation',
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1'
          }]
        }
      };
      
      const validationContext = schema.newContext();
      const isValid = validationContext.validate(panelWithoutSubject);
      
      expect(isValid).to.be.false;
      expect(validationContext.keyIsInvalid('subject')).to.be.true;
    });
    
    it('should validate status enum values', function() {
      const validStatuses = ['registered', 'preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered-in-error', 'unknown'];
      
      validStatuses.forEach(function(status) {
        const panel = {
          resourceType: 'Observation',
          status: status,
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs'
            }]
          }],
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '85353-1'
            }]
          },
          subject: {
            reference: 'Patient/123'
          }
        };
        
        const validationContext = schema.newContext();
        const isValid = validationContext.validate(panel);
        expect(isValid).to.be.true;
      });
      
      // Test invalid status
      const invalidPanel = {
        resourceType: 'Observation',
        status: 'invalid-status',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1'
          }]
        },
        subject: {
          reference: 'Patient/123'
        }
      };
      
      const validationContext = schema.newContext();
      const isValid = validationContext.validate(invalidPanel);
      expect(isValid).to.be.false;
      expect(validationContext.keyIsInvalid('status')).to.be.true;
    });
    
    it('should accept optional fields', function() {
      const fullPanel = {
        resourceType: 'Observation',
        id: 'vital-sign-123',
        meta: {
          versionId: '1',
          lastUpdated: new Date()
        },
        identifier: [{
          system: 'http://example.org/fhir/ids',
          value: 'VS-123'
        }],
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }],
          text: 'Vital Signs'
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85353-1',
            display: 'Vital signs panel'
          }],
          text: 'Vital signs panel'
        },
        subject: {
          reference: 'Patient/123',
          display: 'John Doe'
        },
        encounter: {
          reference: 'Encounter/456'
        },
        effectiveDateTime: new Date(),
        issued: new Date(),
        performer: [{
          reference: 'Practitioner/789',
          display: 'Dr. Smith'
        }],
        hasMember: [{
          reference: 'Observation/hr-123'
        }, {
          reference: 'Observation/bp-123'
        }],
        component: [{
          code: {
            coding: [{
              system: 'http://loinc.org',
              code: '8867-4',
              display: 'Heart rate'
            }]
          },
          valueQuantity: {
            value: 70,
            unit: 'beats/minute',
            system: 'http://unitsofmeasure.org',
            code: '/min'
          }
        }],
        note: [{
          text: 'Patient was anxious during measurement'
        }]
      };
      
      const validationContext = schema.newContext();
      const isValid = validationContext.validate(fullPanel);
      
      expect(isValid).to.be.true;
      expect(validationContext.validationErrors()).to.have.length(0);
    });
  });
  
  describe('Schema Default Values', function() {
    it('should provide default resourceType for VitalSignsPanel', function() {
      const schema = VitalSignsSchemas.VitalSignsPanel;
      const defaultValue = get(schema, '_schema.resourceType.defaultValue');
      
      expect(defaultValue).to.equal('Observation');
    });
    
    it('should provide default status of final', function() {
      const schema = VitalSignsSchemas.VitalSignsPanel;
      const defaultValue = get(schema, '_schema.status.defaultValue');
      
      expect(defaultValue).to.equal('final');
    });
    
    it('should provide default effectiveDateTime', function() {
      const schema = VitalSignsSchemas.VitalSignsPanel;
      const defaultValue = get(schema, '_schema.effectiveDateTime.defaultValue');
      
      expect(defaultValue).to.exist;
      expect(defaultValue).to.be.a('Date');
    });
    
    it('should provide default code for vital signs panel', function() {
      const schema = VitalSignsSchemas.VitalSignsPanel;
      const defaultValue = get(schema, '_schema.code.defaultValue');
      
      expect(defaultValue).to.deep.equal({
        coding: [{
          system: 'http://loinc.org',
          code: '85353-1',
          display: 'Vital signs, weight, height, head circumference, oxygen saturation and BMI panel'
        }],
        text: 'Vital signs panel'
      });
    });
  });
  
  describe('Schema Types', function() {
    it('should define correct field types', function() {
      const schema = VitalSignsSchemas.VitalSignsPanel;
      
      // String fields
      expect(get(schema, '_schema.resourceType.type.name')).to.equal('String');
      expect(get(schema, '_schema.id.type.name')).to.equal('String');
      expect(get(schema, '_schema.status.type.name')).to.equal('String');
      
      // Date fields
      expect(get(schema, '_schema.effectiveDateTime.type.name')).to.equal('Date');
      expect(get(schema, '_schema.issued.type.name')).to.equal('Date');
      
      // Array fields
      expect(get(schema, '_schema.category.type')).to.be.an('array');
      expect(get(schema, '_schema.identifier.type')).to.be.an('array');
      expect(get(schema, '_schema.performer.type')).to.be.an('array');
      expect(get(schema, '_schema.hasMember.type')).to.be.an('array');
      expect(get(schema, '_schema.component.type')).to.be.an('array');
      expect(get(schema, '_schema.note.type')).to.be.an('array');
      
      // Object fields (blackbox)
      expect(get(schema, '_schema.meta.blackbox')).to.be.true;
      expect(get(schema, '_schema.code.blackbox')).to.be.true;
      expect(get(schema, '_schema.subject.blackbox')).to.be.true;
      expect(get(schema, '_schema.encounter.blackbox')).to.be.true;
    });
  });
});