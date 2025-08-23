// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/api/communications/methods.tests.js

import { Meteor } from 'meteor/meteor';
import { assert } from 'chai';
import { Communications } from '../../lib/schemas/SimpleSchemas/Communications';
import { 
  insertCommunication, 
  updateCommunication, 
  removeCommunicationById,
  getCommunication,
  searchCommunications
} from './methods';

if (Meteor.isServer) {
  describe('Communications Methods', function() {
    beforeEach(function() {
      Communications.remove({});
    });

    describe('insertCommunication', function() {
      it('should insert a communication with minimal fields', function() {
        const communicationData = {
          status: 'completed',
          payload: [{
            contentString: 'Test message'
          }]
        };

        const communicationId = insertCommunication.run.call({}, communicationData);
        
        assert.isString(communicationId);
        
        const communication = Communications.findOne(communicationId);
        assert.equal(communication.status, 'completed');
        assert.equal(communication.resourceType, 'Communication');
        assert.equal(communication.payload[0].contentString, 'Test message');
      });

      it('should insert a communication with full fields', function() {
        const communicationData = {
          status: 'completed',
          subject: {
            reference: 'Patient/123',
            display: 'John Doe'
          },
          sender: {
            reference: 'Practitioner/456',
            display: 'Dr. Smith'
          },
          recipient: [{
            reference: 'Patient/123',
            display: 'John Doe'
          }],
          sent: new Date().toISOString(),
          payload: [{
            contentString: 'Hello, this is a test message'
          }],
          category: [{
            coding: [{
              system: 'http://acme.org/messagetypes',
              code: 'notification'
            }]
          }],
          medium: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationMode',
              code: 'ELECTRONIC'
            }]
          }]
        };

        const communicationId = insertCommunication.run.call({}, communicationData);
        
        const communication = Communications.findOne(communicationId);
        assert.equal(communication.subject.reference, 'Patient/123');
        assert.equal(communication.sender.reference, 'Practitioner/456');
        assert.equal(communication.recipient[0].reference, 'Patient/123');
        assert.exists(communication.sent);
      });
    });

    describe('updateCommunication', function() {
      it('should update a communication', function() {
        const communicationData = {
          status: 'preparation',
          payload: [{
            contentString: 'Original message'
          }]
        };

        const communicationId = insertCommunication.run.call({}, communicationData);
        
        const updateData = {
          status: 'completed',
          payload: [{
            contentString: 'Updated message'
          }]
        };

        updateCommunication.run.call({}, { _id: communicationId, update: updateData });
        
        const updatedCommunication = Communications.findOne(communicationId);
        assert.equal(updatedCommunication.status, 'completed');
        assert.equal(updatedCommunication.payload[0].contentString, 'Updated message');
      });

      it('should throw error if communication not found', function() {
        assert.throws(function() {
          updateCommunication.run.call({}, { _id: 'nonexistent', update: {} });
        }, /Communication not found/);
      });
    });

    describe('removeCommunicationById', function() {
      it('should remove a communication', function() {
        const communicationData = {
          status: 'completed',
          payload: [{
            contentString: 'Test message'
          }]
        };

        const communicationId = insertCommunication.run.call({}, communicationData);
        
        removeCommunicationById.run.call({}, { _id: communicationId });
        
        const communication = Communications.findOne(communicationId);
        assert.isUndefined(communication);
      });
    });

    describe('getCommunication', function() {
      it('should get a communication by id', function() {
        const communicationData = {
          status: 'completed',
          payload: [{
            contentString: 'Test message'
          }]
        };

        const communicationId = insertCommunication.run.call({}, communicationData);
        
        const communication = getCommunication.run.call({}, { _id: communicationId });
        
        assert.equal(communication._id, communicationId);
        assert.equal(communication.status, 'completed');
      });

      it('should throw error if communication not found', function() {
        assert.throws(function() {
          getCommunication.run.call({}, { _id: 'nonexistent' });
        }, /Communication not found/);
      });
    });

    describe('searchCommunications', function() {
      it('should search communications with query', function() {
        // Insert test data
        insertCommunication.run.call({}, {
          status: 'completed',
          payload: [{ contentString: 'Message 1' }]
        });
        
        insertCommunication.run.call({}, {
          status: 'preparation',
          payload: [{ contentString: 'Message 2' }]
        });
        
        const results = searchCommunications.run.call({}, {
          query: { status: 'completed' }
        });
        
        assert.equal(results.length, 1);
        assert.equal(results[0].status, 'completed');
      });

      it('should limit results', function() {
        // Insert multiple communications
        for (let i = 0; i < 5; i++) {
          insertCommunication.run.call({}, {
            status: 'completed',
            payload: [{ contentString: `Message ${i}` }]
          });
        }
        
        const results = searchCommunications.run.call({}, {
          options: { limit: 3 }
        });
        
        assert.equal(results.length, 3);
      });
    });
  });
}