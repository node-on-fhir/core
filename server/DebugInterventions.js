// /Volumes/SonicMagic/Code/honeycomb-public-release/server/DebugInterventions.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ServiceRequests } from '../imports/lib/schemas/SimpleSchemas/ServiceRequests';

if (Meteor.isServer) {
  Meteor.methods({
    async 'debug.showAllServiceRequests'() {
      console.log('=== DEBUG: All ServiceRequests ===');
      
      const allRequests = await ServiceRequests.find({}).fetchAsync();
      console.log(`Total ServiceRequests: ${allRequests.length}`);
      
      // Separate by type
      const approvalRequests = [];
      const interventionRequests = [];
      const otherRequests = [];
      
      allRequests.forEach(req => {
        const category = req.category?.[0]?.coding?.[0]?.code;
        
        console.log('\nServiceRequest:', {
          _id: req._id,
          id: req.id,
          status: req.status,
          category: category || 'NO CATEGORY',
          code: req.code?.text,
          authoredOn: req.authoredOn,
          performer: req.performer?.[0]?.reference,
          requester: req.requester?.reference
        });
        
        if (category === 'intervention-approval') {
          approvalRequests.push(req);
        } else if (!category) {
          interventionRequests.push(req);
        } else {
          otherRequests.push(req);
        }
      });
      
      console.log('\n=== SUMMARY ===');
      console.log(`Approval requests: ${approvalRequests.length}`);
      console.log(`Intervention requests (no category): ${interventionRequests.length}`);
      console.log(`Other requests: ${otherRequests.length}`);
      
      // Test the active interventions query
      console.log('\n=== Testing Active Interventions Query ===');
      const activeQuery = {
        status: { $in: ['active', 'on-hold'] },
        $and: [
          {
            $or: [
              { 'category.0.coding.0.code': { $ne: 'intervention-approval' } },
              { 'category': { $exists: false } }
            ]
          }
        ]
      };
      
      const activeInterventions = await ServiceRequests.find(activeQuery).fetchAsync();
      console.log(`Query found ${activeInterventions.length} active interventions`);
      
      activeInterventions.forEach(intervention => {
        console.log('Active intervention:', {
          _id: intervention._id,
          status: intervention.status,
          code: intervention.code?.text,
          category: intervention.category?.[0]?.coding?.[0]?.code || 'NO CATEGORY'
        });
      });
      
      return {
        total: allRequests.length,
        approvals: approvalRequests.length,
        interventions: interventionRequests.length,
        activeInterventions: activeInterventions.length
      };
    },
    
    async 'debug.createTestIntervention'() {
      console.log('=== Creating Test Intervention ===');
      
      const testIntervention = {
        id: Random.id(),
        resourceType: 'ServiceRequest',
        status: 'active',
        intent: 'order',
        priority: 'routine',
        code: {
          coding: [{
            system: 'http://honeycomb.ai/intervention-protocols',
            code: 'test-protocol',
            display: 'Test Intervention Protocol'
          }],
          text: 'Test Intervention Protocol'
        },
        subject: {
          reference: 'Patient/test-patient',
          display: 'Test Patient'
        },
        authoredOn: new Date().toISOString(),
        requester: {
          reference: `Practitioner/${this.userId || 'test-user'}`,
          display: 'Test User'
        },
        extension: [{
          url: 'http://honeycomb.ai/fhir/StructureDefinition/protocol-id',
          valueString: 'test-protocol'
        }],
        meta: {
          lastUpdated: new Date(),
          versionId: '1'
        }
      };
      
      // Note: NO category field - this is important for active interventions
      console.log('Test intervention has category?', !!testIntervention.category);
      
      const insertedId = await ServiceRequests.insertAsync(testIntervention);
      console.log('Inserted test intervention with _id:', insertedId);
      
      // Verify it was inserted
      const inserted = await ServiceRequests.findOneAsync(insertedId);
      console.log('Verified insertion:', {
        _id: inserted._id,
        id: inserted.id,
        status: inserted.status,
        category: inserted.category
      });
      
      // Check if it appears in active interventions query
      const activeQuery = {
        status: { $in: ['active', 'on-hold'] },
        $and: [
          {
            $or: [
              { 'category.0.coding.0.code': { $ne: 'intervention-approval' } },
              { 'category': { $exists: false } }
            ]
          }
        ]
      };
      
      const found = await ServiceRequests.find(activeQuery).fetchAsync();
      const foundTest = found.find(sr => sr._id === insertedId);
      
      console.log('Test intervention found in active query?', !!foundTest);
      
      return {
        insertedId,
        foundInActiveQuery: !!foundTest
      };
    },
    
    async 'debug.checkInterventionById'(interventionId) {
      console.log('=== Checking Intervention by ID ===');
      console.log('Looking for ID:', interventionId);
      
      // Try multiple ways to find it
      let intervention = await ServiceRequests.findOneAsync({ _id: interventionId });
      if (!intervention) {
        intervention = await ServiceRequests.findOneAsync({ id: interventionId });
      }
      
      if (intervention) {
        console.log('Found intervention:', {
          _id: intervention._id,
          id: intervention.id,
          status: intervention.status,
          category: intervention.category,
          code: intervention.code?.text,
          resourceType: intervention.resourceType
        });
        
        // Check if it matches active intervention criteria
        const hasNoCategory = !intervention.category;
        const isNotApproval = intervention.category?.[0]?.coding?.[0]?.code !== 'intervention-approval';
        const isActive = ['active', 'on-hold'].includes(intervention.status);
        const isServiceRequest = intervention.resourceType === 'ServiceRequest';
        
        console.log('Criteria check:', {
          hasNoCategory,
          isNotApproval,
          isActive,
          isServiceRequest,
          shouldAppearInActive: isServiceRequest && isActive && (hasNoCategory || isNotApproval)
        });
      } else {
        console.log('Intervention not found!');
        
        // Show what IDs exist
        const allIds = await ServiceRequests.find({}, { fields: { _id: 1, id: 1 } }).fetchAsync();
        console.log('All ServiceRequest IDs:', allIds.map(sr => ({ _id: sr._id, id: sr.id })));
      }
      
      return intervention;
    }
  });
}