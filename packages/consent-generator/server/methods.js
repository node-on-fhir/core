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
  
  // If not found, try creating them
  if (!Consents) {
    Consents = new Mongo.Collection('Consents');
  }
  if (!ConsentAcls) {
    ConsentAcls = new Mongo.Collection('ConsentAcls');
  }
  
  console.log('Consent Generator: Collections initialized', {
    Consents: !!Consents,
    ConsentAcls: !!ConsentAcls
  });
});

Meteor.methods({
  'consents.generate': async function(options) {
    check(options, {
      template: String,
      patientId: Match.Optional(String),
      patientName: Match.Optional(String),
      practitionerId: Match.Optional(String),
      practitionerName: Match.Optional(String),
      organizationId: Match.Optional(String),
      organizationName: Match.Optional(String),
      id: Match.Optional(String)
    });

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
  },

  'consents.generateBatch': async function(options) {
    check(options, {
      template: String,
      count: Number,
      baseOptions: Match.Optional(Object)
    });

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
  },

  'consents.update': async function(consentId, updates) {
    check(consentId, String);
    check(updates, Object);

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
  },

  'consents.remove': async function(consentId) {
    check(consentId, String);

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
  },

  'consents.clearAll': async function() {
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
  },

  'consents.list': async function() {
    try {
      const consents = await Consents.find({}, { limit: 100 }).fetchAsync();
      return consents;
    } catch (error) {
      console.error('Error listing consents:', error);
      throw new Meteor.Error('list-failed', error.message);
    }
  },

  'consents.listTemplates': function() {
    return Object.keys(ConsentTemplates).map(key => ({
      id: key,
      name: ConsentTemplates[key].name,
      description: ConsentTemplates[key].description
    }));
  },

  'consents.initializeDefaults': async function() {
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
  }
});