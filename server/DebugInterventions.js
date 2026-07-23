// server/DebugInterventions.js
// NOTE: currently NOT imported by server/main.js (commented out) — dead code
// kept for debugging. Converted to the ServerMethods registry so it is safe
// to re-enable.

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ServiceRequests } from '../imports/lib/schemas/SimpleSchemas/ServiceRequests';

// Imported directly (not via the Meteor.ServerMethods global) because, when
// enabled, this module loads from server/main.js BEFORE server/rpc/rpcSetup.js.
import ServerMethods from '/imports/lib/ServerMethods.js';

// requireAuth note: these debug methods historically had NO auth guards.
// They read (and create) ServiceRequest records, so requireAuth now applies
// (the default) — behavior change from the pre-migration guard-less state.

if (Meteor.isServer) {
  ServerMethods.define('debug.showAllServiceRequests', {
    description: 'Dump every ServiceRequest and test the active-interventions query (debug)',
    phi: true    // patient ServiceRequest content
  }, async function(params, context) {
    context.log.info('=== DEBUG: All ServiceRequests ===');

    const allRequests = await ServiceRequests.find({}).fetchAsync();
    context.log.info(`Total ServiceRequests: ${allRequests.length}`);

    // Separate by type
    const approvalRequests = [];
    const interventionRequests = [];
    const otherRequests = [];

    allRequests.forEach(req => {
      const category = req.category?.[0]?.coding?.[0]?.code;

      context.log.debug('ServiceRequest', { data: {
        _id: req._id,
        id: req.id,
        status: req.status,
        category: category || 'NO CATEGORY',
        code: req.code?.text,
        authoredOn: req.authoredOn,
        performer: req.performer?.[0]?.reference,
        requester: req.requester?.reference
      }});

      if (category === 'intervention-approval') {
        approvalRequests.push(req);
      } else if (!category) {
        interventionRequests.push(req);
      } else {
        otherRequests.push(req);
      }
    });

    context.log.info('=== SUMMARY ===', { data: {
      approvals: approvalRequests.length,
      interventions: interventionRequests.length,
      other: otherRequests.length
    }});

    // Test the active interventions query
    context.log.info('=== Testing Active Interventions Query ===');
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
    context.log.info(`Query found ${activeInterventions.length} active interventions`);

    activeInterventions.forEach(intervention => {
      context.log.debug('Active intervention', { data: {
        _id: intervention._id,
        status: intervention.status,
        code: intervention.code?.text,
        category: intervention.category?.[0]?.coding?.[0]?.code || 'NO CATEGORY'
      }});
    });

    return {
      total: allRequests.length,
      approvals: approvalRequests.length,
      interventions: interventionRequests.length,
      activeInterventions: activeInterventions.length
    };
  });

  ServerMethods.define('debug.createTestIntervention', {
    description: 'Insert a synthetic test ServiceRequest and verify the active-interventions query finds it (debug)',
    phi: false   // synthetic fixture for Patient/test-patient only
  }, async function(params, context) {
    context.log.info('=== Creating Test Intervention ===');

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
        reference: `Practitioner/${context.userId || 'test-user'}`,
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
    context.log.info('Test intervention has category?', { data: { hasCategory: !!testIntervention.category } });

    const insertedId = await ServiceRequests.insertAsync(testIntervention);
    context.log.info('Inserted test intervention', { data: { _id: insertedId } });

    // Verify it was inserted
    const inserted = await ServiceRequests.findOneAsync(insertedId);
    context.log.info('Verified insertion', { data: {
      _id: inserted._id,
      id: inserted.id,
      status: inserted.status,
      category: inserted.category
    }});

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

    context.log.info('Test intervention found in active query?', { data: { found: !!foundTest } });

    return {
      insertedId,
      foundInActiveQuery: !!foundTest
    };
  });

  ServerMethods.define('debug.checkInterventionById', {
    description: 'Look up a ServiceRequest by _id or FHIR id and report why it does or does not match the active-interventions query (debug)',
    phi: true,   // patient ServiceRequest content
    positionalParams: ['interventionId'],
    schemaObject: {
      type: 'object',
      properties: { interventionId: { type: 'string' } },
      required: ['interventionId']
    }
  }, async function(params, context) {
    const interventionId = params.interventionId;

    context.log.info('=== Checking Intervention by ID ===', { data: { interventionId: interventionId } });

    // Try multiple ways to find it
    let intervention = await ServiceRequests.findOneAsync({ _id: interventionId });
    if (!intervention) {
      intervention = await ServiceRequests.findOneAsync({ id: interventionId });
    }

    if (intervention) {
      context.log.info('Found intervention', { data: {
        _id: intervention._id,
        id: intervention.id,
        status: intervention.status,
        category: intervention.category,
        code: intervention.code?.text,
        resourceType: intervention.resourceType
      }});

      // Check if it matches active intervention criteria
      const hasNoCategory = !intervention.category;
      const isNotApproval = intervention.category?.[0]?.coding?.[0]?.code !== 'intervention-approval';
      const isActive = ['active', 'on-hold'].includes(intervention.status);
      const isServiceRequest = intervention.resourceType === 'ServiceRequest';

      context.log.info('Criteria check', { data: {
        hasNoCategory,
        isNotApproval,
        isActive,
        isServiceRequest,
        shouldAppearInActive: isServiceRequest && isActive && (hasNoCategory || isNotApproval)
      }});
    } else {
      context.log.info('Intervention not found!');

      // Show what IDs exist
      const allIds = await ServiceRequests.find({}, { fields: { _id: 1, id: 1 } }).fetchAsync();
      context.log.debug('All ServiceRequest IDs', { data: allIds.map(sr => ({ _id: sr._id, id: sr.id })) });
    }

    return intervention;
  });
}
