// imports/api/serverConfiguration/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';
import { DEMOGRAPHIC_POLICY_DEFAULTS } from '/imports/lib/MedicalPolicies';

Meteor.methods({
  // Runtime overrides for demographic-display "medical policies" (sex/gender/
  // karyotype visibility + inference). Stored as a single ServerConfiguration doc
  // (configType 'medicalPolicies') and published so the client resolves them over
  // the settings baseline via MedicalPolicies.getDemographicPolicy(override).
  'serverConfiguration.saveMedicalPolicies': async function(policy){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in to save medical policies');
    }
    check(policy, Object);

    // Whitelist to the known demographic-display flags; coerce to booleans.
    let data = {};
    Object.keys(DEMOGRAPHIC_POLICY_DEFAULTS).forEach(function(key){
      if(policy[key] !== undefined){
        data[key] = Boolean(policy[key]);
      }
    });

    console.log('[serverConfiguration.saveMedicalPolicies] Saving:', data);

    let existing = await ServerConfiguration.findOneAsync({ configType: 'medicalPolicies' });
    if(existing){
      await ServerConfiguration.updateAsync(
        { _id: existing._id },
        { $set: { data: data, updatedAt: new Date(), updatedBy: this.userId }}
      );
    } else {
      await ServerConfiguration.insertAsync({
        configType: 'medicalPolicies',
        data: data,
        updatedAt: new Date(),
        updatedBy: this.userId
      });
    }

    return { success: true, policy: data };
  },

  'serverConfiguration.getMedicalPolicies': async function(){
    let stored = await ServerConfiguration.findOneAsync({ configType: 'medicalPolicies' });
    return get(stored, 'data', null);
  },

  'serverConfiguration.saveX509Keys': async function(){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in to save keys');
    }

    let x509 = get(Meteor, 'settings.private.x509');
    if(!x509){
      throw new Meteor.Error('no-keys', 'No x509 keys found in Meteor.settings.private.x509');
    }

    let data = {};
    if(get(x509, 'privateKey')){
      data.privateKey = x509.privateKey;
    }
    if(get(x509, 'publicKey')){
      data.publicKey = x509.publicKey;
    }
    if(get(x509, 'publicCertPem')){
      data.publicCertPem = x509.publicCertPem;
    }

    if(Object.keys(data).length === 0){
      throw new Meteor.Error('no-keys', 'No x509 keys found to save');
    }

    console.log('[serverConfiguration.saveX509Keys] Saving x509 keys to database');

    let existing = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(existing){
      await ServerConfiguration.updateAsync(
        { _id: existing._id },
        { $set: {
          data: data,
          updatedAt: new Date(),
          updatedBy: this.userId
        }}
      );
      console.log('[serverConfiguration.saveX509Keys] Updated existing record:', existing._id);
    } else {
      let insertResult = await ServerConfiguration.insertAsync({
        configType: 'x509',
        data: data,
        updatedAt: new Date(),
        updatedBy: this.userId
      });
      console.log('[serverConfiguration.saveX509Keys] Inserted new record:', insertResult);
    }

    return { success: true, keysStored: Object.keys(data) };
  },

  'serverConfiguration.loadX509Keys': async function(){
    let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(!storedConfig || !storedConfig.data){
      console.log('[serverConfiguration.loadX509Keys] No stored x509 keys found');
      return { loaded: false };
    }

    let loaded = [];

    if(get(storedConfig, 'data.privateKey') && !get(Meteor, 'settings.private.x509.privateKey')){
      set(Meteor, 'settings.private.x509.privateKey', storedConfig.data.privateKey);
      loaded.push('privateKey');
    }
    if(get(storedConfig, 'data.publicKey') && !get(Meteor, 'settings.private.x509.publicKey')){
      set(Meteor, 'settings.private.x509.publicKey', storedConfig.data.publicKey);
      loaded.push('publicKey');
    }
    if(get(storedConfig, 'data.publicCertPem') && !get(Meteor, 'settings.private.x509.publicCertPem')){
      set(Meteor, 'settings.private.x509.publicCertPem', storedConfig.data.publicCertPem);
      loaded.push('publicCertPem');
    }

    if(loaded.length > 0){
      console.log('[serverConfiguration.loadX509Keys] Loaded keys from database:', loaded.join(', '));
    } else {
      console.log('[serverConfiguration.loadX509Keys] Keys already present in settings, skipping DB load');
    }

    return { loaded: loaded.length > 0, keys: loaded };
  },

  'serverConfiguration.hasStoredKeys': async function(){
    let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(!storedConfig || !storedConfig.data){
      return { stored: false };
    }

    return {
      stored: true,
      keys: Object.keys(storedConfig.data),
      updatedAt: storedConfig.updatedAt
    };
  },

  // Reports which x509 material is present in the (already boot-hydrated)
  // Meteor.settings. Consumed by ServerConfigurationPage (Keys & Certs) and
  // GettingStartedPage. Lives in core — it used to be defined only in
  // @node-on-fhir/provider-directory, which left the Keys & Certs panel
  // permanently disabled ("Generate Cert") whenever that optional package
  // wasn't loaded. Result shape preserved from the original: privateKey is a
  // boolean (never leak the private PEM); publicKey/publicCertPem return the
  // PEM text (both are public material the page displays).
  'hasServerKeys': async function(){
    let result = {
      x509: {
        privateKey: false,
        publicKey: false,
        publicCert: false,
        publicCertPem: false
      }
    };

    if(get(Meteor, 'settings.private.x509.privateKey')){
      result.x509.privateKey = true;
    }
    if(get(Meteor, 'settings.private.x509.publicKey')){
      result.x509.publicKey = get(Meteor, 'settings.private.x509.publicKey');
    }
    if(get(Meteor, 'settings.private.x509.publicCertPem')){
      result.x509.publicCertPem = get(Meteor, 'settings.private.x509.publicCertPem');
    }

    return result;
  },

  'serverConfiguration.saveGeneratedX509Keys': async function(publicKeyText, privateKeyText){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in to save keys');
    }

    check(publicKeyText, String);
    check(privateKeyText, String);

    // Parse JSON-stringified PEM if needed
    let publicPem = publicKeyText;
    let privatePem = privateKeyText;

    try {
      if(publicPem.startsWith('"')){
        publicPem = JSON.parse(publicPem);
      }
    } catch(e){
      console.warn('[serverConfiguration.saveGeneratedX509Keys] Could not JSON.parse publicKey, using as-is');
    }

    try {
      if(privatePem.startsWith('"')){
        privatePem = JSON.parse(privatePem);
      }
    } catch(e){
      console.warn('[serverConfiguration.saveGeneratedX509Keys] Could not JSON.parse privateKey, using as-is');
    }

    // Validate PEM format
    if(!publicPem.includes('BEGIN PUBLIC KEY') && !publicPem.includes('BEGIN RSA PUBLIC KEY')){
      throw new Meteor.Error('invalid-format', 'Public key does not appear to be in PEM format');
    }
    if(!privatePem.includes('BEGIN RSA PRIVATE KEY') && !privatePem.includes('BEGIN PRIVATE KEY')){
      throw new Meteor.Error('invalid-format', 'Private key does not appear to be in PEM format');
    }

    // Save to in-memory Meteor.settings so generateCertificate can read them
    set(Meteor, 'settings.private.x509.publicKey', publicPem);
    set(Meteor, 'settings.private.x509.privateKey', privatePem);

    console.log('[serverConfiguration.saveGeneratedX509Keys] Saved keys to Meteor.settings.private.x509');

    // Also persist to database
    let data = {
      publicKey: publicPem,
      privateKey: privatePem
    };

    let existing = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(existing){
      // Preserve existing cert if any
      if(get(existing, 'data.publicCertPem')){
        data.publicCertPem = existing.data.publicCertPem;
      }
      await ServerConfiguration.updateAsync(
        { _id: existing._id },
        { $set: {
          data: data,
          updatedAt: new Date(),
          updatedBy: this.userId
        }}
      );
      console.log('[serverConfiguration.saveGeneratedX509Keys] Updated existing DB record:', existing._id);
    } else {
      let insertResult = await ServerConfiguration.insertAsync({
        configType: 'x509',
        data: data,
        updatedAt: new Date(),
        updatedBy: this.userId
      });
      console.log('[serverConfiguration.saveGeneratedX509Keys] Inserted new DB record:', insertResult);
    }

    return { success: true, keysStored: ['publicKey', 'privateKey'] };
  },

  'serverConfiguration.saveGeneratedCert': async function(certPem){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in to save certificate');
    }

    check(certPem, String);

    // Parse JSON-stringified PEM if needed
    let cert = certPem;
    try {
      if(cert.startsWith('"')){
        cert = JSON.parse(cert);
      }
    } catch(e){
      console.warn('[serverConfiguration.saveGeneratedCert] Could not JSON.parse cert, using as-is');
    }

    if(!cert.includes('BEGIN CERTIFICATE')){
      throw new Meteor.Error('invalid-format', 'Certificate does not appear to be in PEM format');
    }

    // Save to in-memory Meteor.settings
    set(Meteor, 'settings.private.x509.publicCertPem', cert);

    console.log('[serverConfiguration.saveGeneratedCert] Saved cert to Meteor.settings.private.x509');

    // Also persist to database
    let existing = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(existing){
      let data = get(existing, 'data', {});
      data.publicCertPem = cert;
      await ServerConfiguration.updateAsync(
        { _id: existing._id },
        { $set: {
          data: data,
          updatedAt: new Date(),
          updatedBy: this.userId
        }}
      );
      console.log('[serverConfiguration.saveGeneratedCert] Updated existing DB record:', existing._id);
    } else {
      await ServerConfiguration.insertAsync({
        configType: 'x509',
        data: { publicCertPem: cert },
        updatedAt: new Date(),
        updatedBy: this.userId
      });
      console.log('[serverConfiguration.saveGeneratedCert] Inserted new DB record');
    }

    return { success: true };
  },

  'serverConfiguration.fetchRemoteUdapMetadata': async function(fhirServerUrl){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }

    check(fhirServerUrl, String);

    // Normalize URL: strip trailing slash
    let baseUrl = fhirServerUrl.replace(/\/+$/, '');
    let udapUrl = baseUrl + '/.well-known/udap';

    console.log('[serverConfiguration.fetchRemoteUdapMetadata] Fetching:', udapUrl);

    try {
      const { fetch } = require('meteor/fetch');
      let response = await fetch(udapUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if(!response.ok){
        throw new Meteor.Error('fetch-failed', 'HTTP ' + response.status + ': ' + response.statusText);
      }

      let metadata = await response.json();
      console.log('[serverConfiguration.fetchRemoteUdapMetadata] Received metadata from:', udapUrl);

      return metadata;
    } catch(error){
      if(error.error){
        throw error; // Already a Meteor.Error
      }
      console.error('[serverConfiguration.fetchRemoteUdapMetadata] Error:', error.message);
      throw new Meteor.Error('fetch-failed', 'Failed to fetch UDAP metadata: ' + error.message);
    }
  }
});

// Publish only the medicalPolicies config doc (never the x509 doc, which holds
// private keys) so the client can reactively resolve demographic-display overrides.
if(Meteor.isServer){
  Meteor.publish('medicalPolicies', function(){
    return ServerConfiguration.find({ configType: 'medicalPolicies' });
  });
}
