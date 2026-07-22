// imports/api/serverConfiguration/methods.js
//
// rpc-migration exemplar (Loop 1 template for guard-heavy files): every
// method converted inline to Meteor.ServerMethods.define with a canonical
// dotted name, `if (!this.userId) throw` guards deleted in favor of
// requireAuth (the default), check() calls transpiled to params JSON Schemas
// (schemaObject -> auto-registered as '<name>Params'), positional signatures
// mapped via positionalParams so legacy DDP call sites keep working, and
// this.userId -> context.userId. Methods that were guard-less and are
// genuinely public keep requireAuth: false with a comment saying why.

import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';
import { DEMOGRAPHIC_POLICY_DEFAULTS } from '/imports/lib/MedicalPolicies';

// Runtime overrides for demographic-display "medical policies" (sex/gender/
// karyotype visibility + inference). Stored as a single ServerConfiguration doc
// (configType 'medicalPolicies') and published so the client resolves them over
// the settings baseline via MedicalPolicies.getDemographicPolicy(override).
Meteor.ServerMethods.define('serverConfiguration.saveMedicalPolicies', {
  description: 'Save runtime demographic-display policy overrides',
  phi: false,
  schemaObject: { type: 'object' }   // whitelisted field-by-field below
}, async function(params, context){
  const policy = params;

  // Whitelist to the known demographic-display flags; coerce to booleans.
  let data = {};
  Object.keys(DEMOGRAPHIC_POLICY_DEFAULTS).forEach(function(key){
    if(policy[key] !== undefined){
      data[key] = Boolean(policy[key]);
    }
  });

  context.log.info('Saving medical policies', { data: data });

  let existing = await ServerConfiguration.findOneAsync({ configType: 'medicalPolicies' });
  if(existing){
    await ServerConfiguration.updateAsync(
      { _id: existing._id },
      { $set: { data: data, updatedAt: new Date(), updatedBy: context.userId }}
    );
  } else {
    await ServerConfiguration.insertAsync({
      configType: 'medicalPolicies',
      data: data,
      updatedAt: new Date(),
      updatedBy: context.userId
    });
  }

  return { success: true, policy: data };
});

Meteor.ServerMethods.define('serverConfiguration.getMedicalPolicies', {
  description: 'Read the stored demographic-display policy overrides',
  // Public by design (pre-migration behavior): the same doc is published
  // reactively to every client via the medicalPolicies publication.
  requireAuth: false
}, async function(){
  let stored = await ServerConfiguration.findOneAsync({ configType: 'medicalPolicies' });
  return get(stored, 'data', null);
});

Meteor.ServerMethods.define('serverConfiguration.saveX509Keys', {
  description: 'Persist the settings-provided x509 key material to the database'
}, async function(params, context){
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

  context.log.info('Saving x509 keys to database');

  let existing = await ServerConfiguration.findOneAsync({ configType: 'x509' });
  if(existing){
    await ServerConfiguration.updateAsync(
      { _id: existing._id },
      { $set: {
        data: data,
        updatedAt: new Date(),
        updatedBy: context.userId
      }}
    );
    context.log.info('Updated existing record', { _id: existing._id });
  } else {
    let insertResult = await ServerConfiguration.insertAsync({
      configType: 'x509',
      data: data,
      updatedAt: new Date(),
      updatedBy: context.userId
    });
    context.log.info('Inserted new record', { _id: insertResult });
  }

  return { success: true, keysStored: Object.keys(data) };
});

Meteor.ServerMethods.define('serverConfiguration.loadX509Keys', {
  description: 'Hydrate Meteor.settings x509 material from the stored database copy'
  // Pre-migration this method had NO auth guard (latent bug — it mutates
  // in-memory settings). requireAuth now applies (default true).
}, async function(params, context){
  let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
  if(!storedConfig || !storedConfig.data){
    context.log.info('No stored x509 keys found');
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
    context.log.info('Loaded keys from database', { keys: loaded });
  } else {
    context.log.info('Keys already present in settings, skipping DB load');
  }

  return { loaded: loaded.length > 0, keys: loaded };
});

Meteor.ServerMethods.define('serverConfiguration.hasStoredKeys', {
  description: 'Report which x509 key names are stored in the database',
  // Public by design (pre-migration behavior): read-only key-name metadata
  // consumed by the server configuration page before auth state resolves.
  requireAuth: false
}, async function(){
  let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
  if(!storedConfig || !storedConfig.data){
    return { stored: false };
  }

  return {
    stored: true,
    keys: Object.keys(storedConfig.data),
    updatedAt: storedConfig.updatedAt
  };
});

// Reports which x509 material is present in the (already boot-hydrated)
// Meteor.settings. Consumed by ServerConfigurationPage (Keys & Certs) and
// GettingStartedPage (which runs PRE-LOGIN — hence requireAuth: false, the
// pre-migration behavior). Result shape preserved from the original:
// privateKey is a boolean (never leak the private PEM); publicKey/
// publicCertPem return the PEM text (both are public material).
Meteor.ServerMethods.define('serverConfiguration.hasServerKeys', {
  description: 'Report which x509 material is present in the server settings',
  aliases: ['hasServerKeys'],
  requireAuth: false
}, async function(){
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
});

Meteor.ServerMethods.define('serverConfiguration.saveGeneratedX509Keys', {
  description: 'Validate and persist a generated x509 key pair (settings + database)',
  positionalParams: ['publicKeyText', 'privateKeyText'],
  schemaObject: {
    type: 'object',
    properties: { publicKeyText: { type: 'string' }, privateKeyText: { type: 'string' } },
    required: ['publicKeyText', 'privateKeyText']
  }
}, async function(params, context){
  // Parse JSON-stringified PEM if needed
  let publicPem = params.publicKeyText;
  let privatePem = params.privateKeyText;

  try {
    if(publicPem.startsWith('"')){
      publicPem = JSON.parse(publicPem);
    }
  } catch(e){
    context.log.warn('Could not JSON.parse publicKey, using as-is');
  }

  try {
    if(privatePem.startsWith('"')){
      privatePem = JSON.parse(privatePem);
    }
  } catch(e){
    context.log.warn('Could not JSON.parse privateKey, using as-is');
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

  context.log.info('Saved keys to Meteor.settings.private.x509');

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
        updatedBy: context.userId
      }}
    );
    context.log.info('Updated existing DB record', { _id: existing._id });
  } else {
    let insertResult = await ServerConfiguration.insertAsync({
      configType: 'x509',
      data: data,
      updatedAt: new Date(),
      updatedBy: context.userId
    });
    context.log.info('Inserted new DB record', { _id: insertResult });
  }

  return { success: true, keysStored: ['publicKey', 'privateKey'] };
});

Meteor.ServerMethods.define('serverConfiguration.saveGeneratedCert', {
  description: 'Validate and persist a generated x509 certificate (settings + database)',
  positionalParams: ['certPem'],
  schemaObject: {
    type: 'object',
    properties: { certPem: { type: 'string' } },
    required: ['certPem']
  }
}, async function(params, context){
  // Parse JSON-stringified PEM if needed
  let cert = params.certPem;
  try {
    if(cert.startsWith('"')){
      cert = JSON.parse(cert);
    }
  } catch(e){
    context.log.warn('Could not JSON.parse cert, using as-is');
  }

  if(!cert.includes('BEGIN CERTIFICATE')){
    throw new Meteor.Error('invalid-format', 'Certificate does not appear to be in PEM format');
  }

  // Save to in-memory Meteor.settings
  set(Meteor, 'settings.private.x509.publicCertPem', cert);

  context.log.info('Saved cert to Meteor.settings.private.x509');

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
        updatedBy: context.userId
      }}
    );
    context.log.info('Updated existing DB record', { _id: existing._id });
  } else {
    await ServerConfiguration.insertAsync({
      configType: 'x509',
      data: { publicCertPem: cert },
      updatedAt: new Date(),
      updatedBy: context.userId
    });
    context.log.info('Inserted new DB record');
  }

  return { success: true };
});

Meteor.ServerMethods.define('serverConfiguration.fetchRemoteUdapMetadata', {
  description: 'Fetch .well-known/udap metadata from a remote FHIR server',
  positionalParams: ['fhirServerUrl'],
  schemaObject: {
    type: 'object',
    properties: { fhirServerUrl: { type: 'string' } },
    required: ['fhirServerUrl']
  }
}, async function(params, context){
  // Normalize URL: strip trailing slash
  let baseUrl = params.fhirServerUrl.replace(/\/+$/, '');
  let udapUrl = baseUrl + '/.well-known/udap';

  context.log.info('Fetching UDAP metadata', { udapUrl: udapUrl });

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
    context.log.info('Received metadata', { udapUrl: udapUrl });

    return metadata;
  } catch(error){
    if(error.error){
      throw error; // Already a Meteor.Error
    }
    context.log.error('UDAP metadata fetch failed', { message: error.message });
    throw new Meteor.Error('fetch-failed', 'Failed to fetch UDAP metadata: ' + error.message);
  }
});

// Publish only the medicalPolicies config doc (never the x509 doc, which holds
// private keys) so the client can reactively resolve demographic-display overrides.
if(Meteor.isServer){
  Meteor.publish('medicalPolicies', function(){
    return ServerConfiguration.find({ configType: 'medicalPolicies' });
  });
}
