// packages/implantable-devices/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';
import { DEVICE_CATALOG_DATA, findCatalogEntryByDi, findCatalogEntryById, searchCatalog } from '../lib/deviceCatalog.js';
import { parseGs1, formatExpiry } from '../lib/udi.js';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// meta.tag marking a Device as a browseable catalog template (not a real,
// patient-assigned device). assignToPatient clones a tagged record, strips this
// tag, and attaches the selected patient.
const CATALOG_TAG_SYSTEM = 'http://honeycomb.fhir/device-source';
const CATALOG_TAG_CODE = 'catalog';

// Build a FHIR Device resource from a shared-catalog entry. The deterministic
// _id (the catalog id, e.g. 'PM-2077') keeps seeding idempotent and lets the
// client pass selectedDevice.id straight to assignToPatient.
function catalogEntryToDevice(entry, categoryKey, nowIso) {
  return {
    _id: entry.id,
    id: entry.id,
    resourceType: 'Device',
    meta: {
      versionId: '1',
      lastUpdated: nowIso,
      tag: [{
        system: CATALOG_TAG_SYSTEM,
        code: CATALOG_TAG_CODE,
        display: 'Catalog Template'
      }]
    },
    status: get(entry, 'status', 'active'),
    manufacturer: get(entry, 'manufacturer', ''),
    deviceName: [{ name: get(entry, 'name', ''), type: 'user-friendly-name' }],
    modelNumber: get(entry, 'model', ''),
    type: { text: get(entry, 'type', '') },
    // deviceIdentifier is the bare GS1 (01) DI (matching + Known-devices
    // Identifier column); carrierHRF keeps the full human-readable string.
    udiCarrier: [{ deviceIdentifier: get(entry, 'di', get(entry, 'udi', '')), carrierHRF: get(entry, 'udi', '') }],
    // Non-standard display fields carried through so flattenFhirDevice / the
    // catalog UI round-trip cleanly (this is demo/registry data).
    streams: get(entry, 'streams', []),
    class: get(entry, 'class', ''),
    connectivity: get(entry, 'connectivity', ''),
    battery: get(entry, 'battery', 'N/A'),
    features: get(entry, 'features', []),
    image: get(entry, 'image'),
    cybernetic: get(entry, 'cybernetic', false),
    performance: get(entry, 'performance'),
    category: categoryKey
  };
}

// Find a catalog entry by its device id across all categories (shared lib
// helper). Lets assignToPatient/linkDevice build a Device straight from the
// in-memory catalog when the startup seed hasn't populated the DB (e.g. after
// an HMR-only reload).
const findCatalogEntry = findCatalogEntryById;

// rpc-migration: Meteor.methods -> Meteor.ServerMethods.define (npmPackages
// exemplar — GLOBAL Meteor.ServerMethods). Names already dotted-canonical
// (implantableDevices.*), no renames/aliases. register/getPatientDevices/
// assignToPatient/removeDevice/updateStatus had `this.userId` guards ->
// requireAuth (default true) and phi: true (patient-device linkage).
// parseUDI/checkRecalls/getPerformanceMetrics were guard-less and operate on a
// UDI/device id against public FDA registries (GUDID/recalls) with no patient
// data -> requireAuth: false, phi: false.

/**
 * Parse UDI (Unique Device Identifier) according to FDA standards
 */
Meteor.ServerMethods.define('implantableDevices.parseUDI', {
  description: 'Parse a GS1-format UDI string and resolve the device in GUDID',
  // Guard-less pre-migration; parses a supplied UDI + public GUDID lookup, no
  // patient data. Public.
  requireAuth: false,
  phi: false,
  positionalParams: ['udiString'],
  schemaObject: {
    type: 'object',
    properties: { udiString: { type: 'string' } },
    required: ['udiString']
  }
}, async function(params, context){
    const udiString = params.udiString;
    context.log.info('implantableDevices.parseUDI');

    // Parse GS1 format UDI via the shared isomorphic helper
    // Format: (01)GTIN(11)PROD_DATE(17)EXP_DATE(10)LOT(21)SERIAL
    const parsed = parseGs1(udiString);
    const components = {
      gtin: parsed.di,
      deviceId: parsed.di,
      lotNumber: parsed.lotNumber,
      productionDate: parsed.productionDate,
      expirationDate: parsed.expirationDate,
      serialNumber: parsed.serialNumber
    };

    // Look up device in GUDID (mock)
    const deviceInfo = await lookupGUDID(components.deviceId);

    // Match against the local device catalog by DI (add-a-device flow)
    const catalogMatch = findCatalogEntryByDi(components.deviceId);

    return {
      udi: udiString,
      components: components,
      deviceInfo: deviceInfo,
      catalogMatch: catalogMatch,
      parsed: new Date().toISOString()
    };
});

/**
 * Search the device catalog (add-a-device Branch C + API parity with the
 * client-side search — the UI filters the bundled catalog locally)
 */
Meteor.ServerMethods.define('implantableDevices.searchCatalog', {
  description: 'Search the device catalog by name/manufacturer/kind/sku',
  requireAuth: false,
  phi: false,
  positionalParams: ['query'],
  schemaObject: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query']
  }
}, async function(params, context){
    context.log.debug('implantableDevices.searchCatalog', { query: params.query });
    return searchCatalog(params.query);
});

/**
 * Register a new implantable device for a patient
 */
Meteor.ServerMethods.define('implantableDevices.register', {
  description: 'Register a new implantable device for a patient (FHIR Device + DeviceUseStatement)',
  phi: true,
  positionalParams: ['deviceData'],
  schemaObject: {
    type: 'object',
    properties: {
      deviceData: {
        type: 'object',
        properties: {
          patientId: { type: 'string' },
          udi: { type: 'string' },
          deviceName: { type: 'string' },
          manufacturer: { type: 'string' },
          model: { type: 'string' },
          type: { type: 'string' },
          class: { type: 'string', enum: ['I', 'II', 'III'] },
          implantDate: {},
          implantSite: { type: 'string' },
          surgeon: { type: 'string' },
          facility: { type: 'string' }
        },
        required: ['patientId', 'udi', 'deviceName', 'manufacturer', 'model', 'type', 'class', 'implantDate']
      }
    },
    required: ['deviceData']
  }
}, async function(params, context){
    const deviceData = params.deviceData;
    context.log.info('implantableDevices.register');

    // Create FHIR Device resource
    const device = {
      resourceType: 'Device',
      id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device']
      },
      udiCarrier: [{
        deviceIdentifier: deviceData.udi,
        carrierHRF: deviceData.udi // Human Readable Form
      }],
      status: 'active',
      distinctIdentifier: deviceData.udi.split('(21)')[1]?.split('(')[0],
      manufacturer: deviceData.manufacturer,
      deviceName: [{
        name: deviceData.deviceName,
        type: 'user-friendly-name'
      }],
      modelNumber: deviceData.model,
      type: {
        text: deviceData.type
      },
      patient: {
        reference: `Patient/${deviceData.patientId}`
      },
      note: [{
        text: `Implanted on ${deviceData.implantDate.toISOString()}`
      }]
    };
    
    // Store Device resource
    let deviceId;
    if (global.Collections?.Devices) {
      const Devices = await global.Collections.Devices;
      if (Devices && typeof Devices.insertAsync === 'function') {
        deviceId = await Devices.insertAsync(device);
        console.log('Created Device:', deviceId);
      }
    } else {
      deviceId = device.id;
    }
    
    // Create DeviceUseStatement
    const useStatement = {
      resourceType: 'DeviceUseStatement',
      id: Random.id(),
      status: 'active',
      subject: {
        reference: `Patient/${deviceData.patientId}`
      },
      device: {
        reference: `Device/${deviceId}`
      },
      timingPeriod: {
        start: deviceData.implantDate.toISOString()
      },
      recordedOn: new Date().toISOString(),
      source: {
        reference: `Practitioner/${context.userId}`
      },
      bodySite: deviceData.implantSite ? {
        text: deviceData.implantSite
      } : undefined
    };
    
    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.insertAsync === 'function') {
        await DeviceUseStatements.insertAsync(useStatement);
      }
    }
    
    // Create audit event
    await logDeviceRegistration({
      userId: context.userId,
      patientId: deviceData.patientId,
      deviceId: deviceId,
      udi: deviceData.udi,
      timestamp: new Date()
    });

    return {
      success: true,
      deviceId: deviceId,
      message: 'Device registered successfully'
    };
});

// meta.tag systems stamped by the add-a-device flow. The Known-devices table
// on /my-profile renders its Source and Status columns from these.
const ONBOARDING_SOURCE_TAG_SYSTEM = 'http://honeycomb.fhir/device-onboarding-source';
const LIFECYCLE_TAG_SYSTEM = 'http://honeycomb.fhir/device-lifecycle';
const STREAM_EXTENSION_URL = 'http://honeycomb.fhir/StructureDefinition/device-data-stream';
const WRITE_CONSENT_EXTENSION_URL = 'http://honeycomb.fhir/StructureDefinition/device-write-consent';

const SOURCE_DISPLAYS = {
  'udi': 'Scanned UDI',
  'app': 'App export',
  'catalog': 'Catalog',
  'manual': 'Manual entry'
};

/**
 * Link a device to a patient from the guided /add-a-device flow.
 * Consumer-onboarding sibling of `register` (whose ONC (g)(7) semantics stay
 * frozen): builds a CLEAN Device (no catalog display fields), plus a
 * DeviceUseStatement, an optional Consent (continuous-write permission,
 * revocable, provision.data → this Device), and an optional Procedure when an
 * implant date is supplied for an implanted device.
 */
Meteor.ServerMethods.define('implantableDevices.linkDevice', {
  description: 'Link a device to a patient from the guided add-a-device flow (Device + DeviceUseStatement + optional Consent/Procedure)',
  phi: true,
  schemaObject: {
    type: 'object',
    properties: {
      patientId: { type: 'string' },
      patientDisplay: { type: 'string' },
      source: { type: 'string', enum: ['udi', 'app', 'catalog', 'manual'] },
      udi: { type: 'string' },
      parsed: { type: 'object' },
      catalogDeviceId: { type: 'string' },
      service: { type: 'string' },
      deviceName: { type: 'string' },
      manufacturer: { type: 'string' },
      kind: { type: 'string' },
      modelNumber: { type: 'string' },
      serial: { type: 'string' },
      implantDate: { type: 'string' },
      bodySite: { type: 'string' },
      managingClinic: { type: 'string' },
      streams: { type: 'array', items: { type: 'string' } },
      consent: { type: 'boolean' },
      incomplete: { type: 'boolean' },
      awaitingData: { type: 'boolean' }
    },
    required: ['patientId', 'source']
  }
}, async function(params, context){
    const patientId = get(params, 'patientId');
    const patientDisplay = get(params, 'patientDisplay', '');
    const source = get(params, 'source');
    const parsed = get(params, 'parsed', {});
    const incomplete = Boolean(get(params, 'incomplete'));
    const awaitingData = Boolean(get(params, 'awaitingData'));
    context.log.info('implantableDevices.linkDevice', { source, incomplete, awaitingData });

    if (!global.Collections?.Devices) {
      throw new Meteor.Error('unavailable', 'Devices collection is not available');
    }
    const Devices = await global.Collections.Devices;

    const nowIso = new Date().toISOString();
    const deviceId = Random.id();
    const wantsConsent = Boolean(get(params, 'consent'));
    const consentId = wantsConsent ? Random.id() : null;

    // Hydrate defaults from the in-memory catalog when a catalog device was
    // picked or DI-matched. Deliberately NOT cloning the seeded record —
    // catalog templates carry non-FHIR display fields that must not land on a
    // real patient Device (strict-validation hazard).
    let catalogEntry = null;
    const catalogDeviceId = get(params, 'catalogDeviceId');
    if (catalogDeviceId) {
      const found = findCatalogEntry(catalogDeviceId);
      catalogEntry = found ? found.device : null;
    }

    const deviceName = get(params, 'deviceName') || get(catalogEntry, 'name', 'Unknown Device');
    const manufacturer = get(params, 'manufacturer') || get(catalogEntry, 'manufacturer', '');
    const modelNumber = get(params, 'modelNumber') || get(catalogEntry, 'model', '');
    const kind = get(params, 'kind') || get(catalogEntry, 'type', '');
    const serial = get(params, 'serial') || get(parsed, 'serialNumber', '');
    const streams = get(params, 'streams', []);
    const implantDate = get(params, 'implantDate', '');
    const isImplantKind = source === 'udi' || source === 'catalog' || /implant/i.test(kind);

    // -- meta tags ----------------------------------------------------------
    const tags = [{
      system: ONBOARDING_SOURCE_TAG_SYSTEM,
      code: source,
      display: SOURCE_DISPLAYS[source] || source
    }];
    if (incomplete) {
      tags.push({ system: LIFECYCLE_TAG_SYSTEM, code: 'incomplete', display: 'Incomplete' });
    }
    if (awaitingData) {
      tags.push({ system: LIFECYCLE_TAG_SYSTEM, code: 'awaiting-data', display: 'Awaiting data' });
    }

    // -- extensions ---------------------------------------------------------
    const extensions = streams.map(function(stream) {
      return { url: STREAM_EXTENSION_URL, valueString: stream };
    });
    if (consentId) {
      extensions.push({
        url: WRITE_CONSENT_EXTENSION_URL,
        valueReference: { reference: 'Consent/' + consentId }
      });
    }

    // -- Device -------------------------------------------------------------
    const device = {
      resourceType: 'Device',
      _id: deviceId,
      id: deviceId,
      meta: {
        versionId: '1',
        lastUpdated: nowIso,
        tag: tags
      },
      status: incomplete ? 'inactive' : 'active',
      deviceName: [{ name: deviceName, type: 'user-friendly-name' }],
      patient: { reference: 'Patient/' + patientId, display: patientDisplay }
    };

    if (isImplantKind) {
      device.meta.profile = ['http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device'];
    }
    if (manufacturer) { device.manufacturer = manufacturer; }
    if (modelNumber) { device.modelNumber = modelNumber; }
    if (kind) { device.type = { text: kind }; }

    const rawUdi = get(params, 'udi', '') || get(catalogEntry, 'udi', '');
    const di = get(parsed, 'di', '') || get(catalogEntry, 'di', '');
    if (rawUdi || di) {
      device.udiCarrier = [{ deviceIdentifier: di || rawUdi, carrierHRF: rawUdi || di }];
    }
    if (serial) {
      device.serialNumber = serial;
      device.distinctIdentifier = serial;
    }
    const lotNumber = get(parsed, 'lotNumber', '');
    if (lotNumber) { device.lotNumber = lotNumber; }
    const expiry = formatExpiry(get(parsed, 'expirationDate', ''));
    if (expiry) { device.expirationDate = expiry; }

    const managingClinic = get(params, 'managingClinic', '');
    if (managingClinic) { device.owner = { display: managingClinic }; }
    if (extensions.length > 0) { device.extension = extensions; }

    await Devices.insertAsync(device);
    context.log.debug('implantableDevices.linkDevice inserted Device', { deviceId });

    // -- DeviceUseStatement -------------------------------------------------
    const useStatement = {
      resourceType: 'DeviceUseStatement',
      id: Random.id(),
      status: 'active',
      subject: { reference: 'Patient/' + patientId },
      device: { reference: 'Device/' + deviceId },
      timingPeriod: { start: implantDate || nowIso },
      recordedOn: nowIso,
      source: { reference: 'Practitioner/' + context.userId }
    };
    const bodySite = get(params, 'bodySite', '');
    if (bodySite) { useStatement.bodySite = { text: bodySite }; }

    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.insertAsync === 'function') {
        await DeviceUseStatements.insertAsync(useStatement);
      }
    }

    // -- Consent (continuous write permission, revocable) -------------------
    if (consentId && global.Collections?.Consents) {
      const Consents = await global.Collections.Consents;
      if (Consents && typeof Consents.insertAsync === 'function') {
        const consent = {
          resourceType: 'Consent',
          _id: consentId,
          id: consentId,
          meta: { versionId: '1', lastUpdated: nowIso },
          status: 'active',
          scope: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/consentscope',
              code: 'patient-privacy',
              display: 'Privacy Consent'
            }]
          },
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: 'ICOL',
              display: 'information collection'
            }]
          }],
          patient: { reference: 'Patient/' + patientId, display: patientDisplay },
          dateTime: nowIso,
          policyRule: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/consentpolicycodes',
              code: 'OPTIN',
              display: 'opt-in'
            }]
          },
          provision: {
            type: 'permit',
            class: [{ system: 'http://hl7.org/fhir/resource-types', code: 'Observation' }],
            data: [{ meaning: 'related', reference: { reference: 'Device/' + deviceId } }]
          }
        };
        await Consents.insertAsync(consent);
        context.log.debug('implantableDevices.linkDevice inserted Consent', { consentId });
      }
    }

    // -- Procedure (implant record) -----------------------------------------
    if (implantDate && isImplantKind && global.Collections?.Procedures) {
      const Procedures = await global.Collections.Procedures;
      if (Procedures && typeof Procedures.insertAsync === 'function') {
        const procedureId = Random.id();
        await Procedures.insertAsync({
          resourceType: 'Procedure',
          _id: procedureId,
          id: procedureId,
          status: 'completed',
          code: { text: 'Device implantation' },
          subject: { reference: 'Patient/' + patientId, display: patientDisplay },
          performedDateTime: implantDate,
          focalDevice: [{ manipulated: { reference: 'Device/' + deviceId } }]
        });
      }
    }

    // -- Audit --------------------------------------------------------------
    await logDeviceRegistration({
      userId: context.userId,
      patientId: patientId,
      deviceId: deviceId,
      udi: rawUdi || di || 'n/a',
      timestamp: new Date()
    });

    return { success: true, deviceId: deviceId, consentId: consentId };
});

/**
 * Get list of implantable devices for a patient
 */
Meteor.ServerMethods.define('implantableDevices.getPatientDevices', {
  description: 'List a patient\'s implantable devices with their DeviceUseStatements',
  phi: true,
  positionalParams: ['patientId'],
  schemaObject: {
    type: 'object',
    properties: { patientId: { type: 'string' } },
    required: ['patientId']
  }
}, async function(params, context){
    const patientId = params.patientId;
    context.log.debug('implantableDevices.getPatientDevices', { patientId });

    const devices = [];
    
    // Get devices from FHIR Device collection
    if (global.Collections?.Devices) {
      const Devices = await global.Collections.Devices;
      if (Devices && typeof Devices.find === 'function') {
        const patientDevices = await Devices.find({
          'patient.reference': `Patient/${patientId}`
        }).fetchAsync();

        devices.push(...patientDevices);
      }
    }
    
    // Get use statements
    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.find === 'function') {
        const statements = await DeviceUseStatements.find({
          'subject.reference': `Patient/${patientId}`
        }).fetchAsync();
        
        // Merge with device data
        for (let statement of statements) {
          const deviceRef = statement.device?.reference;
          if (deviceRef) {
            const device = devices.find(d => `Device/${d.id}` === deviceRef);
            if (device) {
              device.useStatement = statement;
            }
          }
        }
      }
    }
    
    return devices;
});

/**
 * Assign a catalog device to a patient by cloning the catalog Device record
 * and attaching the patient. The clone is a real (untagged) device that shows
 * up in the patient's Augmentations view via getPatientDevices.
 */
Meteor.ServerMethods.define('implantableDevices.assignToPatient', {
  description: 'Assign a catalog device to a patient by cloning the template Device and linking it',
  phi: true,
  positionalParams: ['catalogDeviceId', 'patientId'],
  schemaObject: {
    type: 'object',
    properties: { catalogDeviceId: { type: 'string' }, patientId: { type: 'string' } },
    required: ['catalogDeviceId', 'patientId']
  }
}, async function(params, context){
    const catalogDeviceId = params.catalogDeviceId;
    const patientId = params.patientId;
    context.log.debug('implantableDevices.assignToPatient', { catalogDeviceId, patientId });

    if (!global.Collections?.Devices) {
      throw new Meteor.Error('unavailable', 'Devices collection is not available');
    }

    const Devices = await global.Collections.Devices;
    const nowIso = new Date().toISOString();

    // Prefer a seeded catalog Device record; fall back to building one from the
    // shared in-memory catalog so assignment works even when the startup seed
    // hasn't run (HMR doesn't re-run Meteor.startup).
    let source = await Devices.findOneAsync({ _id: catalogDeviceId });
    if (!source) {
      const entry = findCatalogEntry(catalogDeviceId);
      if (entry) {
        source = catalogEntryToDevice(entry.device, entry.categoryKey, nowIso);
        log.debug('implantableDevices.assignToPatient No seeded record; built from catalog', { catalogDeviceId });
      }
    }
    if (!source) {
      throw new Meteor.Error('not-found', 'Device not found in catalog: ' + catalogDeviceId);
    }

    // Clone the source Device into a fresh, patient-assigned record.
    const clone = JSON.parse(JSON.stringify(source));
    delete clone._id;
    clone.id = Random.id();
    clone._id = clone.id;
    clone.status = 'active';
    clone.patient = { reference: `Patient/${patientId}` };
    clone.meta = {
      ...(clone.meta || {}),
      versionId: '1',
      lastUpdated: nowIso,
      // Drop the catalog tag — the clone is a real device, not a template.
      tag: get(clone, 'meta.tag', []).filter(function(t) {
        return !(t && t.system === CATALOG_TAG_SYSTEM && t.code === CATALOG_TAG_CODE);
      })
    };

    let deviceId;
    try {
      deviceId = await Devices.insertAsync(clone);
    } catch (error) {
      log.error('implantableDevices.assignToPatient insert error:', error);
      throw new Meteor.Error('assign-failed', error.message);
    }
    log.debug('Assigned device (clone)', { deviceId, patientId });

    // Create the DeviceUseStatement linking the clone to the patient.
    const useStatement = {
      resourceType: 'DeviceUseStatement',
      id: Random.id(),
      status: 'active',
      subject: { reference: `Patient/${patientId}` },
      device: { reference: `Device/${deviceId}` },
      timingPeriod: { start: nowIso },
      recordedOn: nowIso,
      source: { reference: `Practitioner/${context.userId}` }
    };

    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.insertAsync === 'function') {
        await DeviceUseStatements.insertAsync(useStatement);
      }
    }

    // Audit the assignment (reuse the registration audit shape).
    await logDeviceRegistration({
      userId: context.userId,
      patientId: patientId,
      deviceId: deviceId,
      udi: get(clone, 'udiCarrier.0.carrierHRF', ''),
      timestamp: new Date()
    });

    return {
      success: true,
      deviceId: deviceId,
      message: 'Device assigned to patient'
    };
});

/**
 * Remove a patient-assigned (cloned) Device record and any linked
 * DeviceUseStatement. Lookup by MongoDB _id only (never `_id || id`).
 */
Meteor.ServerMethods.define('implantableDevices.removeDevice', {
  description: 'Remove a patient-assigned Device record and its linked DeviceUseStatements',
  phi: true,
  positionalParams: ['deviceId'],
  schemaObject: {
    type: 'object',
    properties: { deviceId: { type: 'string' } },
    required: ['deviceId']
  }
}, async function(params, context){
    const deviceId = params.deviceId;
    context.log.info('implantableDevices.removeDevice', { deviceId });

    if (!global.Collections?.Devices) {
      throw new Meteor.Error('unavailable', 'Devices collection is not available');
    }

    const Devices = await global.Collections.Devices;
    const removed = await Devices.removeAsync({ _id: deviceId });

    // Remove any DeviceUseStatement(s) linking this device to the patient.
    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.removeAsync === 'function') {
        await DeviceUseStatements.removeAsync({ 'device.reference': `Device/${deviceId}` });
      }
    }

    console.log('[implantableDevices.removeDevice] Removed device:', deviceId, 'count:', removed);
    return { success: true, removed: removed };
});

/**
 * Check device recalls
 */
Meteor.ServerMethods.define('implantableDevices.checkRecalls', {
  description: 'Check the FDA recall database for a given device id',
  // Guard-less pre-migration; queries public FDA recall data by device id, no
  // patient linkage. Public.
  requireAuth: false,
  phi: false,
  positionalParams: ['deviceId'],
  schemaObject: {
    type: 'object',
    properties: { deviceId: { type: 'string' } },
    required: ['deviceId']
  }
}, async function(params, context){
    const deviceId = params.deviceId;
    context.log.info('implantableDevices.checkRecalls', { deviceId });

    // In production, this would query FDA recall database
    // For demo, return mock recall data
    const recalls = await checkFDARecalls(deviceId);

    return recalls;
});

/**
 * Update device status (active, inactive, entered-in-error)
 */
Meteor.ServerMethods.define('implantableDevices.updateStatus', {
  description: 'Update a device status (active/inactive/entered-in-error) with an audit trail',
  phi: true,
  positionalParams: ['deviceId', 'newStatus'],
  schemaObject: {
    type: 'object',
    properties: {
      deviceId: { type: 'string' },
      newStatus: { type: 'string', enum: ['active', 'inactive', 'entered-in-error'] }
    },
    required: ['deviceId', 'newStatus']
  }
}, async function(params, context){
    const deviceId = params.deviceId;
    const newStatus = params.newStatus;
    context.log.info('implantableDevices.updateStatus', { deviceId, newStatus });

    if (global.Collections?.Devices) {
      const Devices = await global.Collections.Devices;
      if (Devices && typeof Devices.updateAsync === 'function') {
        await Devices.updateAsync(deviceId, {
          $set: {
            status: newStatus,
            'meta.lastUpdated': new Date().toISOString()
          }
        });
      }
    }
    
    // Log status change
    await logDeviceStatusChange({
      userId: context.userId,
      deviceId: deviceId,
      oldStatus: 'active',
      newStatus: newStatus,
      timestamp: new Date()
    });

    return {
      success: true,
      message: `Device status updated to ${newStatus}`
    };
});

/**
 * Get device performance metrics
 */
Meteor.ServerMethods.define('implantableDevices.getPerformanceMetrics', {
  description: 'Return performance/diagnostic metrics for a device',
  // Guard-less pre-migration; device telemetry keyed by device id, not patient
  // data. Public.
  requireAuth: false,
  phi: false,
  positionalParams: ['deviceId'],
  schemaObject: {
    type: 'object',
    properties: { deviceId: { type: 'string' } },
    required: ['deviceId']
  }
}, async function(params, context){
    const deviceId = params.deviceId;
    context.log.info('implantableDevices.getPerformanceMetrics', { deviceId });

    // Mock performance data for demonstration
    return {
      deviceId: deviceId,
      metrics: {
        batteryLife: {
          current: 85,
          projected: '2.5 years',
          lastChecked: new Date().toISOString()
        },
        connectivity: {
          status: 'connected',
          signalStrength: 'strong',
          lastSync: new Date(Date.now() - 3600000).toISOString()
        },
        performance: {
          score: 4.5,
          events: 0,
          alerts: 0
        },
        diagnostics: {
          selfTestPassed: true,
          lastTestDate: new Date(Date.now() - 86400000).toISOString(),
          nextScheduled: new Date(Date.now() + 86400000 * 30).toISOString()
        }
      }
    };
});

// ---------------------------------------------------------------------------
// Catalog seeding — make the browseable catalog real FHIR Device records tagged
// as templates, so assignToPatient can clone them. Idempotent (keyed by the
// deterministic catalog _id). Load-order-safe: global.Collections may not exist
// yet when this module loads, so we read it inside Meteor.startup and guard.
// ---------------------------------------------------------------------------
Meteor.startup(async function() {
  try {
    if (!global.Collections?.Devices) {
      console.warn('[implantableDevices] Devices collection unavailable — skipping catalog seed');
      return;
    }

    const Devices = await global.Collections.Devices;
    if (!Devices || typeof Devices.findOneAsync !== 'function') {
      console.warn('[implantableDevices] Devices collection not ready — skipping catalog seed');
      return;
    }

    const nowIso = new Date().toISOString();
    let seeded = 0;
    let backfilled = 0;

    for (const categoryKey of Object.keys(DEVICE_CATALOG_DATA)) {
      const entries = get(DEVICE_CATALOG_DATA, [categoryKey, 'devices'], []);
      for (const entry of entries) {
        const existing = await Devices.findOneAsync({ _id: entry.id });
        if (!existing) {
          await Devices.insertAsync(catalogEntryToDevice(entry, categoryKey, nowIso));
          seeded++;
        } else if (get(existing, 'udiCarrier.0.deviceIdentifier') !== entry.di) {
          // Backfill records seeded before the di/streams enrichment: their
          // deviceIdentifier held the full HRF string instead of the bare DI.
          await Devices.updateAsync({ _id: entry.id }, {
            $set: {
              'udiCarrier.0.deviceIdentifier': entry.di,
              'udiCarrier.0.carrierHRF': entry.udi,
              streams: get(entry, 'streams', []),
              'meta.lastUpdated': nowIso
            }
          });
          backfilled++;
        }
      }
    }

    console.log('[implantableDevices] Catalog seed complete — inserted ' + seeded
      + ' new catalog Device(s), backfilled ' + backfilled);
  } catch (error) {
    console.error('[implantableDevices] Catalog seed error:', error);
  }
});

// Helper function to lookup device in GUDID
async function lookupGUDID(deviceId) {
  // In production, this would query FDA GUDID API
  // For demo, return mock device information
  return {
    deviceId: deviceId,
    brandName: 'Advanced Medical Device',
    companyName: 'Medical Corp',
    versionModelNumber: 'v3.0',
    catalogNumber: 'CAT-12345',
    deviceDescription: 'Implantable medical device',
    deviceClass: 'III',
    mriSafety: 'MR Conditional',
    sterilization: {
      method: 'Ethylene Oxide',
      sterile: true,
      sterilizationPriorToUse: false
    },
    storage: {
      storageHandling: 'Store at room temperature',
      highTemp: 40,
      lowTemp: 15
    },
    deviceSizes: [{
      type: 'Device Size',
      value: '25',
      unit: 'mm'
    }],
    gudidIssueDate: '2023-01-15',
    gudidPublishDate: '2023-01-16'
  };
}

// Helper function to check FDA recalls
async function checkFDARecalls(deviceId) {
  // In production, query FDA recall API
  // For demo, return empty array (no recalls)
  return [];
}

// Helper function to log device registration
async function logDeviceRegistration(data) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Implantable Device Registration'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: 'create',
      display: 'Device Registration'
    }],
    action: 'C', // Create
    recorded: data.timestamp.toISOString(),
    outcome: '0', // Success
    agent: [{
      who: {
        reference: `Practitioner/${data.userId}`
      },
      requestor: true
    }],
    source: {
      site: 'Honeycomb Implantable Device Registry',
      type: [{
        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [{
      what: {
        reference: `Device/${data.deviceId}`
      },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '2',
        display: 'System Object'
      },
      detail: [{
        type: 'udi',
        valueString: data.udi
      }]
    }]
  };
  
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
    }
  }
}

// Helper function to log device status changes
async function logDeviceStatusChange(data) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Device Status Change'
    },
    action: 'U', // Update
    recorded: data.timestamp.toISOString(),
    outcome: '0',
    agent: [{
      who: {
        reference: `Practitioner/${data.userId}`
      },
      requestor: true
    }],
    // AuditEvent.source is required (1..1) in FHIR R4/R4B — the AuditEvents
    // collection is strict-validated (ValidatedCollection), so omitting it
    // rejects the insert.
    source: {
      observer: {
        display: 'Honeycomb FHIR Server'
      },
      type: [{
        system: 'http://hl7.org/fhir/security-source-type',
        code: '4',
        display: 'Application Server'
      }]
    },
    entity: [{
      what: {
        reference: `Device/${data.deviceId}`
      },
      detail: [{
        type: 'status-change',
        valueString: `${data.oldStatus} → ${data.newStatus}`
      }]
    }]
  };
  
  if (global.Collections?.AuditEvents) {
    const AuditEvents = await global.Collections.AuditEvents;
    if (AuditEvents && typeof AuditEvents.insertAsync === 'function') {
      await AuditEvents.insertAsync(auditEvent);
    }
  }
}