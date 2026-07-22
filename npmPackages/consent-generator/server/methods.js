// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/consent-generator/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get } from 'lodash';

import { ConsentTemplates, consentToAcl } from '../lib/ConsentTemplates';

// Get the collections
let Consents;
let ConsentAcls;

Meteor.startup(() => {
  // Try to get the collections from the global scope
  if (typeof global !== 'undefined') {
    Consents = global.Consents || global.Collections?.Consents;
    ConsentAcls = global.ConsentAcls || global.Collections?.ConsentAcls;
  }
  
  // If not found, get a handle to them. _suppressSameNameError lets us bind to a
  // collection the host app already registered (the main app owns 'Consents') —
  // under NPM/Rspack load order global.Collections may not be populated yet when
  // this startup runs, so without this the bare `new Mongo.Collection('Consents')`
  // throws "already a collection named Consents".
  if (!Consents) {
    Consents = new Mongo.Collection('Consents', { _suppressSameNameError: true });
  }
  if (!ConsentAcls) {
    ConsentAcls = new Mongo.Collection('ConsentAcls', { _suppressSameNameError: true });
  }
  
  console.log('Consent Generator: Collections initialized', {
    Consents: !!Consents,
    ConsentAcls: !!ConsentAcls
  });
});

// ServerMethods registry (rpc migration). These consent-generator method NAMES
// are retained verbatim — imports/api/consents was renamed to
// consents.updateById/removeById specifically to cede consents.update/remove to
// THIS package, so keeping them avoids re-introducing the collision. None had an
// auth guard historically; requireAuth now applies (default true) — they
// create/modify/remove consent records and are reached from the signed-in
// /consent-generator page. This is a behavior change (previously callable
// pre-auth) — noted for the commit. phi:true where a patient consent record
// flows. Uses the global Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('consents.generate', {
  description: 'Generate a FHIR Consent (and its ACL) from a named consent template',
  phi: true,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      template: { type: 'string' },
      patientId: { type: 'string' },
      patientName: { type: 'string' },
      practitionerId: { type: 'string' },
      practitionerName: { type: 'string' },
      organizationId: { type: 'string' },
      organizationName: { type: 'string' },
      id: { type: 'string' }
    },
    required: ['template']
  }
}, async function(params, context){
    const options = params;
    console.log('Generating consent with template:', options.template);

    const template = ConsentTemplates[options.template];
    if (!template) {
      throw new Meteor.Error('invalid-template', `Template ${options.template} not found`);
    }

    try {
      // Generate the consent
      const consent = template.generateConsent(options);
      
      // Insert into Consents collection
      const insertResult = await Consents.insertAsync(consent);
      console.log('Consent inserted:', insertResult);
      
      // Also create ACL record if applicable
      const acl = consentToAcl(consent);
      if (acl && ConsentAcls) {
        const aclResult = await ConsentAcls.insertAsync(acl);
        console.log('ACL record created:', aclResult);
      }
      
      return {
        consentId: insertResult,
        consent: consent,
        acl: acl
      };
    } catch (error) {
      console.error('Error generating consent:', error);
      throw new Meteor.Error('generation-failed', error.message);
    }
});

Meteor.ServerMethods.define('consents.generateBatch', {
  description: 'Generate up to 100 Consent records from a template in a single batch',
  phi: true,
  positionalParams: ['options'],
  schemaObject: {
    type: 'object',
    properties: {
      template: { type: 'string' },
      count: { type: 'number' },
      baseOptions: { type: 'object' }
    },
    required: ['template', 'count']
  }
}, async function(params, context){
    const options = params;
    if (options.count > 100) {
      throw new Meteor.Error('too-many', 'Cannot generate more than 100 consents at once');
    }

    const results = [];
    for (let i = 0; i < options.count; i++) {
      const singleOptions = Object.assign({}, options.baseOptions || {}, {
        template: options.template,
        id: Random.id()
      });
      
      try {
        const result = await Meteor.call('consents.generate', singleOptions);
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate consent ${i + 1}:`, error);
      }
    }

    return {
      generated: results.length,
      results: results
    };
});

Meteor.ServerMethods.define('consents.update', {
  description: 'Update a Consent by FHIR id (bumps meta.versionId) and re-derive its ACL',
  phi: true,
  positionalParams: ['consentId', 'updates'],
  schemaObject: {
    type: 'object',
    properties: { consentId: { type: 'string' }, updates: { type: 'object' } },
    required: ['consentId', 'updates']
  }
}, async function(params, context){
    const consentId = get(params, 'consentId');
    const updates = get(params, 'updates');
    try {
      // Update the consent
      updates.meta = updates.meta || {};
      updates.meta.lastUpdated = new Date().toISOString();
      updates.meta.versionId = String(parseInt(get(updates, 'meta.versionId', '1')) + 1);
      
      const result = await Consents.updateAsync(
        { id: consentId },
        { $set: updates }
      );
      
      // Update ACL if it exists
      const consent = await Consents.findOneAsync({ id: consentId });
      if (consent && ConsentAcls) {
        const acl = consentToAcl(consent);
        if (acl) {
          await ConsentAcls.upsertAsync(
            { id: consentId },
            { $set: acl }
          );
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error updating consent:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
});

Meteor.ServerMethods.define('consents.remove', {
  description: 'Remove a Consent by FHIR id and its associated ACL record',
  phi: true,
  positionalParams: ['consentId'],
  schemaObject: {
    type: 'object',
    properties: { consentId: { type: 'string' } },
    required: ['consentId']
  }
}, async function(params, context){
    const consentId = get(params, 'consentId');
    try {
      // Remove consent
      const consentResult = await Consents.removeAsync({ id: consentId });
      
      // Remove associated ACL
      let aclResult = 0;
      if (ConsentAcls) {
        aclResult = await ConsentAcls.removeAsync({ id: consentId });
      }
      
      return {
        consentsRemoved: consentResult,
        aclsRemoved: aclResult
      };
    } catch (error) {
      console.error('Error removing consent:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
});

Meteor.ServerMethods.define('consents.clearAll', {
  description: 'Remove all Consent and ACL records (development-only guard)',
  phi: true
}, async function(params, context){
    // Safety check - only allow in development
    if (process.env.NODE_ENV === 'production') {
      throw new Meteor.Error('not-allowed', 'Cannot clear consents in production');
    }

    console.warn('CLEARING ALL CONSENTS - Development only!');

    try {
      const consentCount = await Consents.removeAsync({});
      let aclCount = 0;
      
      if (ConsentAcls) {
        aclCount = await ConsentAcls.removeAsync({});
      }
      
      return {
        consentsRemoved: consentCount,
        aclsRemoved: aclCount
      };
    } catch (error) {
      console.error('Error clearing consents:', error);
      throw new Meteor.Error('clear-failed', error.message);
    }
});

Meteor.ServerMethods.define('consents.list', {
  description: 'List up to 100 stored Consent records',
  phi: true
}, async function(params, context){
    try {
      const consents = await Consents.find({}, { limit: 100 }).fetchAsync();
      return consents;
    } catch (error) {
      console.error('Error listing consents:', error);
      throw new Meteor.Error('list-failed', error.message);
    }
});

Meteor.ServerMethods.define('consents.listTemplates', {
  description: 'List the available consent template ids, names and descriptions',
  // Public by design: returns only static template metadata (no patient data),
  // used to populate the template picker before auth state resolves.
  requireAuth: false
}, async function(params, context){
    return Object.keys(ConsentTemplates).map(key => ({
      id: key,
      name: ConsentTemplates[key].name,
      description: ConsentTemplates[key].description
    }));
});

Meteor.ServerMethods.define('consents.initializeDefaults', {
  description: 'Generate the default system-access and citizen-access Consent records',
  phi: true
}, async function(params, context){
    console.log('Initializing default consent records...');
    
    const defaultConsents = [
      { template: 'system-access' },
      { template: 'citizen-access' }
    ];
    
    const results = [];
    for (const consent of defaultConsents) {
      try {
        const result = await Meteor.call('consents.generate', consent);
        results.push(result);
      } catch (error) {
        console.error('Failed to create default consent:', error);
      }
    }
    
    return {
      message: 'Default consents initialized',
      created: results.length,
      results: results
    };
});