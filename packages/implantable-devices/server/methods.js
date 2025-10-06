// packages/implantable-devices/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get, has } from 'lodash';
import { Random } from 'meteor/random';

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
      if (Devices && typeof Devices.findAsync === 'function') {
        const patientDevices = await Devices.findAsync({
          'patient.reference': `Patient/${patientId}`
        }).fetchAsync();
        
        devices.push(...patientDevices);
      }
    }
    
    // Get use statements
    if (global.Collections?.DeviceUseStatements) {
      const DeviceUseStatements = await global.Collections.DeviceUseStatements;
      if (DeviceUseStatements && typeof DeviceUseStatements.findAsync === 'function') {
        const statements = await DeviceUseStatements.findAsync({
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