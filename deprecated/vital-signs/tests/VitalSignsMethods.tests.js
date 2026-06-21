// packages/vital-signs/tests/VitalSignsMethods.tests.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { expect } from 'chai';
import sinon from 'sinon';
import { Random } from 'meteor/random';
import { get } from 'lodash';

// Import collections
// Mock collections for testing
const Observations = new Mongo.Collection(null);
const Patients = new Mongo.Collection(null);

// Mock user data
const mockUserId = Random.id();
const mockUser = {
  _id: mockUserId,
  username: 'testuser',
  profile: {
    name: {
      given: ['Test'],
      family: 'User'
    }
  }
};

const mockPatient = {
  _id: 'patient-123',
  id: 'patient-123',
  resourceType: 'Patient',
  name: [{
    given: ['John'],
    family: 'Doe'
  }]
};

describe('VitalSignsMethods', function() {
  let sandbox;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(function() {
    sandbox.restore();
  });
  
  describe('VitalSigns.create', function() {
    it('should create a new vital sign observation', async function() {
      if (Meteor.isServer) {
        // Stub the userId
        const methodInvocation = { userId: mockUserId };
        
        // Stub database operations
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').resolves('new-observation-id');
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'heart-rate',
          value: 72,
          effectiveDateTime: new Date('2024-01-15T10:30:00Z'),
          note: 'Resting heart rate'
        };
        
        // Call the method
        const result = await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
        
        // Verify the result
        expect(result).to.equal('new-observation-id');
        
        // Verify database calls
        expect(Patients.findOneAsync.calledOnce).to.be.true;
        expect(Observations.insertAsync.calledOnce).to.be.true;
        
        // Verify the observation structure
        const insertedObservation = Observations.insertAsync.firstCall.args[0];
        
        expect(insertedObservation).to.have.property('resourceType', 'Observation');
        expect(insertedObservation).to.have.property('status', 'final');
        expect(insertedObservation).to.have.property('id');
        expect(insertedObservation).to.have.property('_id');
        
        // Check category
        expect(insertedObservation.category).to.be.an('array');
        expect(get(insertedObservation, 'category[0].coding[0].code')).to.equal('vital-signs');
        
        // Check code
        expect(insertedObservation.code).to.be.an('object');
        expect(get(insertedObservation, 'code.coding[0].system')).to.equal('http://loinc.org');
        expect(get(insertedObservation, 'code.coding[0].code')).to.equal('8867-4'); // Heart rate LOINC code
        
        // Check subject
        expect(insertedObservation.subject).to.be.an('object');
        expect(insertedObservation.subject.reference).to.equal('Patient/patient-123');
        expect(insertedObservation.subject.display).to.equal('John Doe');
        
        // Check value
        expect(insertedObservation.valueQuantity).to.be.an('object');
        expect(insertedObservation.valueQuantity.value).to.equal(72);
        expect(insertedObservation.valueQuantity.unit).to.equal('beats/minute');
        
        // Check performer
        expect(insertedObservation.performer).to.be.an('array');
        expect(get(insertedObservation, 'performer[0].reference')).to.equal(`Practitioner/${mockUserId}`);
        
        // Check note
        expect(insertedObservation.note).to.be.an('array');
        expect(get(insertedObservation, 'note[0].text')).to.equal('Resting heart rate');
      }
    });
    
    it('should handle blood pressure with components', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').resolves('bp-observation-id');
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'blood-pressure',
          component: [{
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }]
            },
            valueQuantity: {
              value: 120,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }, {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }]
            },
            valueQuantity: {
              value: 80,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }]
        };
        
        const result = await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
        
        expect(result).to.equal('bp-observation-id');
        
        const insertedObservation = Observations.insertAsync.firstCall.args[0];
        
        // Check blood pressure specific fields
        expect(get(insertedObservation, 'code.coding[0].code')).to.equal('85354-9'); // BP panel LOINC
        expect(insertedObservation.component).to.be.an('array');
        expect(insertedObservation.component).to.have.length(2);
        
        // Verify systolic component
        const systolicComponent = insertedObservation.component[0];
        expect(get(systolicComponent, 'code.coding[0].code')).to.equal('8480-6');
        expect(get(systolicComponent, 'valueQuantity.value')).to.equal(120);
        
        // Verify diastolic component
        const diastolicComponent = insertedObservation.component[1];
        expect(get(diastolicComponent, 'code.coding[0].code')).to.equal('8462-4');
        expect(get(diastolicComponent, 'valueQuantity.value')).to.equal(80);
      }
    });
    
    it('should require user authentication', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: null }; // No user logged in
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'heart-rate',
          value: 72
        };
        
        try {
          await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.error).to.equal('not-authorized');
          expect(error.message).to.include('User must be logged in');
        }
      }
    });
    
    it('should validate patient exists', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(null); // Patient not found
        
        const vitalSignData = {
          patientId: 'non-existent-patient',
          code: 'heart-rate',
          value: 72
        };
        
        try {
          await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.error).to.equal('not-found');
          expect(error.message).to.include('Patient not found');
        }
      }
    });
    
    it('should handle different vital sign types', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        const insertStub = sandbox.stub(Observations, 'insertAsync');
        
        const vitalSignTypes = [
          { code: 'body-temperature', value: 37.5, expectedLoinc: '8310-5', expectedUnit: '°C' },
          { code: 'respiratory-rate', value: 16, expectedLoinc: '9279-1', expectedUnit: 'breaths/minute' },
          { code: 'oxygen-saturation', value: 98, expectedLoinc: '2708-6', expectedUnit: '%' },
          { code: 'body-weight', value: 70, expectedLoinc: '29463-7', expectedUnit: 'kg' },
          { code: 'body-height', value: 175, expectedLoinc: '8302-2', expectedUnit: 'cm' },
          { code: 'bmi', value: 22.9, expectedLoinc: '39156-5', expectedUnit: 'kg/m2' }
        ];
        
        for (const vitalType of vitalSignTypes) {
          insertStub.resolves(`${vitalType.code}-id`);
          
          const vitalSignData = {
            patientId: 'patient-123',
            code: vitalType.code,
            value: vitalType.value
          };
          
          await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
          
          const insertedObservation = insertStub.lastCall.args[0];
          
          expect(get(insertedObservation, 'code.coding[0].code')).to.equal(vitalType.expectedLoinc);
          expect(get(insertedObservation, 'valueQuantity.value')).to.equal(vitalType.value);
          expect(get(insertedObservation, 'valueQuantity.unit')).to.equal(vitalType.expectedUnit);
        }
      }
    });
    
    it('should handle custom CodeableConcept for code', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').resolves('custom-code-id');
        
        const customCode = {
          coding: [{
            system: 'http://example.org/custom-codes',
            code: 'custom-vital-001',
            display: 'Custom Vital Sign'
          }],
          text: 'Custom Vital Sign Measurement'
        };
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: customCode,
          valueQuantity: {
            value: 42,
            unit: 'custom-unit'
          }
        };
        
        await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
        
        const insertedObservation = Observations.insertAsync.firstCall.args[0];
        
        expect(insertedObservation.code).to.deep.equal(customCode);
      }
    });
    
    it('should handle optional fields', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').resolves('full-observation-id');
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'heart-rate',
          value: 72,
          interpretation: 'Normal',
          bodySite: 'Radial artery',
          method: 'Manual palpation',
          device: 'Device/pulse-oximeter-123'
        };
        
        await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
        
        const insertedObservation = Observations.insertAsync.firstCall.args[0];
        
        // Check interpretation
        expect(insertedObservation.interpretation).to.be.an('array');
        expect(get(insertedObservation, 'interpretation[0].text')).to.equal('Normal');
        
        // Check body site
        expect(insertedObservation.bodySite).to.be.an('object');
        expect(get(insertedObservation, 'bodySite.text')).to.equal('Radial artery');
        
        // Check method
        expect(insertedObservation.method).to.be.an('object');
        expect(get(insertedObservation, 'method.text')).to.equal('Manual palpation');
        
        // Check device
        expect(insertedObservation.device).to.be.an('object');
        expect(get(insertedObservation, 'device.reference')).to.equal('Device/pulse-oximeter-123');
      }
    });
    
    it('should use MongoDB ObjectID when environment variable is set', async function() {
      if (Meteor.isServer) {
        // Set environment variable
        process.env.USE_MONGO_OBJECTID = 'true';
        
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').resolves('mongo-id');
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'heart-rate',
          value: 72
        };
        
        await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
        
        const insertedObservation = Observations.insertAsync.firstCall.args[0];
        
        // Should have a hex string _id
        expect(insertedObservation._id).to.be.a('string');
        expect(insertedObservation._id).to.match(/^[0-9a-f]{24}$/i); // MongoDB ObjectID format
        
        // Clean up
        delete process.env.USE_MONGO_OBJECTID;
      }
    });
  });
  
  describe('VitalSigns.update', function() {
    it('should update an existing vital sign', async function() {
      if (Meteor.isServer && Meteor.methods['VitalSigns.update']) {
        const methodInvocation = { userId: mockUserId };
        
        const existingObservation = {
          _id: 'obs-123',
          id: 'obs-123',
          resourceType: 'Observation',
          status: 'final',
          code: { coding: [{ code: '8867-4' }] },
          valueQuantity: { value: 72 }
        };
        
        sandbox.stub(Observations, 'findOneAsync').resolves(existingObservation);
        sandbox.stub(Observations, 'updateAsync').resolves(1);
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        
        const updateData = {
          observationId: 'obs-123',
          value: 75,
          note: 'Updated reading'
        };
        
        await Meteor.call.call(methodInvocation, 'VitalSigns.update', updateData);
        
        expect(Observations.updateAsync.calledOnce).to.be.true;
        
        const updateDoc = Observations.updateAsync.firstCall.args[1];
        expect(get(updateDoc, '$set.valueQuantity.value')).to.equal(75);
      }
    });
  });
  
  describe('VitalSigns.delete', function() {
    it('should delete a vital sign', async function() {
      if (Meteor.isServer && Meteor.methods['VitalSigns.delete']) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Observations, 'removeAsync').resolves(1);
        
        await Meteor.call.call(methodInvocation, 'VitalSigns.delete', 'obs-123');
        
        expect(Observations.removeAsync.calledOnce).to.be.true;
        expect(Observations.removeAsync.firstCall.args[0]).to.deep.equal({
          $or: [{ _id: 'obs-123' }, { id: 'obs-123' }]
        });
      }
    });
    
    it('should require authentication for delete', async function() {
      if (Meteor.isServer && Meteor.methods['VitalSigns.delete']) {
        const methodInvocation = { userId: null };
        
        try {
          await Meteor.call.call(methodInvocation, 'VitalSigns.delete', 'obs-123');
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.error).to.equal('not-authorized');
        }
      }
    });
  });
  
  describe('Error Handling', function() {
    it('should handle database errors gracefully', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        sandbox.stub(Meteor.users, 'findOneAsync').resolves(mockUser);
        sandbox.stub(Patients, 'findOneAsync').resolves(mockPatient);
        sandbox.stub(Observations, 'insertAsync').rejects(new Error('Database connection error'));
        
        const vitalSignData = {
          patientId: 'patient-123',
          code: 'heart-rate',
          value: 72
        };
        
        try {
          await Meteor.call.call(methodInvocation, 'VitalSigns.create', vitalSignData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.error).to.equal('insert-failed');
          expect(error.message).to.include('Database connection error');
        }
      }
    });
    
    it('should validate input data types', async function() {
      if (Meteor.isServer) {
        const methodInvocation = { userId: mockUserId };
        
        const invalidData = {
          patientId: 123, // Should be string
          code: null, // Should be string or object
          value: 'not-a-number' // Should be number
        };
        
        try {
          await Meteor.call.call(methodInvocation, 'VitalSigns.create', invalidData);
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.error).to.exist;
          // Check validation error
        }
      }
    });
  });
});