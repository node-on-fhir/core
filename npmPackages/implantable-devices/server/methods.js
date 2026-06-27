// packages/implantable-devices/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';
import { DEVICE_CATALOG_DATA } from '../lib/deviceCatalog.js';

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
    udiCarrier: [{ deviceIdentifier: get(entry, 'udi', ''), carrierHRF: get(entry, 'udi', '') }],
    // Non-standard display fields carried through so flattenFhirDevice / the
    // catalog UI round-trip cleanly (this is demo/registry data).
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

// Find a catalog entry by its device id across all categories. Lets
// assignToPatient build a Device straight from the in-memory catalog when the
// startup seed hasn't populated the DB (e.g. after an HMR-only reload).
function findCatalogEntry(deviceId) {
  for (const categoryKey of Object.keys(DEVICE_CATALOG_DATA)) {
    const entries = get(DEVICE_CATALOG_DATA, [categoryKey, 'devices'], []);
    const device = entries.find(function(d) { return d.id === deviceId; });
    if (device) {
      return { device: device, categoryKey: categoryKey };
    }
  }
  return null;
}

Meteor.methods({
  /**
   * Parse UDI (Unique Device Identifier) according to FDA standards
   */
  'implantableDevices.parseUDI': async function(udiString) {
    console.log('ImplantableDevices.parseUDI', udiString);
    
    check(udiString, String);
    
    // Parse GS1 format UDI
    // Format: (01)GTIN(11)PROD_DATE(17)EXP_DATE(10)LOT(21)SERIAL
    const udiRegex = /\((\d+)\)([^()]+)/g;
    const components = {};
    let match;
    
    while ((match = udiRegex.exec(udiString)) !== null) {
      const ai = match[1]; // Application Identifier
      const value = match[2];
      
      switch(ai) {
        case '01':
          components.gtin = value; // Global Trade Item Number
          components.deviceId = value;
          break;
        case '10':
          components.lotNumber = value;
          break;
        case '11':
          components.productionDate = value;
          break;
        case '17':
          components.expirationDate = value;
          break;
        case '21':
          components.serialNumber = value;
          break;
      }
    }
    
    // Look up device in GUDID (mock)
    const deviceInfo = await lookupGUDID(components.deviceId);
    
    return {
      udi: udiString,
      components: components,
      deviceInfo: deviceInfo,
      parsed: new Date().toISOString()
    };
  },

  /**
   * Register a new implantable device for a patient
   */
  'implantableDevices.register': async function(deviceData) {
    console.log('ImplantableDevices.register', deviceData);
    
    check(deviceData, {
      patientId: String,
      udi: String,
      deviceName: String,
      manufacturer: String,
      model: String,
      type: String,
      class: Match.OneOf('I', 'II', 'III'),
      implantDate: Date,
      implantSite: Match.Optional(String),
      surgeon: Match.Optional(String),
      facility: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to register devices');
    }
    
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
        reference: `Practitioner/${this.userId}`
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
      userId: this.userId,
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
  },

  /**
   * Get list of implantable devices for a patient
   */
  'implantableDevices.getPatientDevices': async function(patientId) {
    console.log('ImplantableDevices.getPatientDevices', patientId);
    
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
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
  },

  /**
   * Assign a catalog device to a patient by cloning the catalog Device record
   * and attaching the patient. The clone is a real (untagged) device that shows
   * up in the patient's Augmentations view via getPatientDevices.
   */
  'implantableDevices.assignToPatient': async function(catalogDeviceId, patientId) {
    console.log('ImplantableDevices.assignToPatient', catalogDeviceId, patientId);

    check(catalogDeviceId, String);
    check(patientId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to assign devices');
    }

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
        console.log('[implantableDevices.assignToPatient] No seeded record; built from catalog:', catalogDeviceId);
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
      console.error('[implantableDevices.assignToPatient] insert error:', error);
      throw new Meteor.Error('assign-failed', error.message);
    }
    console.log('Assigned device (clone):', deviceId, 'to Patient/' + patientId);

    // Create the DeviceUseStatement linking the clone to the patient.
    const useStatement = {
      resourceType: 'DeviceUseStatement',
      id: Random.id(),
      status: 'active',
      subject: { reference: `Patient/${patientId}` },
      device: { reference: `Device/${deviceId}` },
      timingPeriod: { start: nowIso },
      recordedOn: nowIso,
      source: { reference: `Practitioner/${this.userId}` }
    };

    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.insertAsync === 'function') {
        await DeviceUseStatements.insertAsync(useStatement);
      }
    }

    // Audit the assignment (reuse the registration audit shape).
    await logDeviceRegistration({
      userId: this.userId,
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
  },

  /**
   * Remove a patient-assigned (cloned) Device record and any linked
   * DeviceUseStatement. Lookup by MongoDB _id only (never `_id || id`).
   */
  'implantableDevices.removeDevice': async function(deviceId) {
    console.log('ImplantableDevices.removeDevice', deviceId);

    check(deviceId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to remove devices');
    }

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
  },

  /**
   * Check device recalls
   */
  'implantableDevices.checkRecalls': async function(deviceId) {
    console.log('ImplantableDevices.checkRecalls', deviceId);
    
    check(deviceId, String);
    
    // In production, this would query FDA recall database
    // For demo, return mock recall data
    const recalls = await checkFDARecalls(deviceId);
    
    return recalls;
  },

  /**
   * Update device status (active, inactive, entered-in-error)
   */
  'implantableDevices.updateStatus': async function(deviceId, newStatus) {
    console.log('ImplantableDevices.updateStatus', deviceId, newStatus);
    
    check(deviceId, String);
    check(newStatus, Match.OneOf('active', 'inactive', 'entered-in-error'));
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
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
      userId: this.userId,
      deviceId: deviceId,
      oldStatus: 'active',
      newStatus: newStatus,
      timestamp: new Date()
    });
    
    return {
      success: true,
      message: `Device status updated to ${newStatus}`
    };
  },

  /**
   * Get device performance metrics
   */
  'implantableDevices.getPerformanceMetrics': async function(deviceId) {
    console.log('ImplantableDevices.getPerformanceMetrics', deviceId);
    
    check(deviceId, String);
    
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
  }
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

    for (const categoryKey of Object.keys(DEVICE_CATALOG_DATA)) {
      const entries = get(DEVICE_CATALOG_DATA, [categoryKey, 'devices'], []);
      for (const entry of entries) {
        const existing = await Devices.findOneAsync({ _id: entry.id });
        if (!existing) {
          await Devices.insertAsync(catalogEntryToDevice(entry, categoryKey, nowIso));
          seeded++;
        }
      }
    }

    console.log('[implantableDevices] Catalog seed complete — inserted ' + seeded + ' new catalog Device(s)');
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