// /packages/vital-signs/server/methods/createVitalSign.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { get, set, has, cloneDeep } from 'lodash';
import moment from 'moment';

// Collections will be accessed via Meteor.Collections
let Observations, Patients;

Meteor.startup(function() {
  Observations = Meteor.Collections?.Observations;
  Patients = Meteor.Collections?.Patients;
});

if (Meteor.isServer) {
  Meteor.methods({
    async 'VitalSigns.create'(vitalSignData) {
      console.log('[VitalSigns.create] Method called', vitalSignData);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to create vital signs');
      }
      
      // Validate input
      check(vitalSignData, {
        patientId: String,
        code: Match.OneOf(String, Object),
        value: Match.Optional(Match.OneOf(Number, String, Object)),
        valueQuantity: Match.Optional(Object),
        component: Match.Optional(Array),
        effectiveDateTime: Match.Optional(Date),
        performer: Match.Optional(Match.OneOf(String, Array, Object)),
        note: Match.Optional(String),
        interpretation: Match.Optional(Match.OneOf(String, Object)),
        bodySite: Match.Optional(Match.OneOf(String, Object)),
        method: Match.Optional(Match.OneOf(String, Object)),
        device: Match.Optional(Match.OneOf(String, Object))
      });
      
      let cleanVitalSign = {};
      
      if (vitalSignData) {
        cleanVitalSign = cloneDeep(vitalSignData);
      }
      
      // Set resourceType
      cleanVitalSign.resourceType = 'Observation';
      
      // Generate ID if not provided
      if (!cleanVitalSign.id) {
        cleanVitalSign.id = Random.id();
      }
      
      // Set _id based on environment variable for consistent sorting
      if (process.env.USE_MONGO_OBJECTID) {
        const objectId = new Mongo.ObjectID();
        cleanVitalSign._id = objectId.toHexString();
        console.log('[VitalSigns.create] Using MongoDB ObjectID (as hex string):', cleanVitalSign._id);
      } else {
        cleanVitalSign._id = cleanVitalSign.id;
        console.log('[VitalSigns.create] Using Meteor string ID:', cleanVitalSign._id);
      }
      
      // Set metadata
      cleanVitalSign.meta = {
        versionId: '1',
        lastUpdated: new Date(),
        profile: ['http://hl7.org/fhir/StructureDefinition/vitalsigns']
      };
      
      // Status - required
      cleanVitalSign.status = 'final';
      
      // Category - required for vital signs
      cleanVitalSign.category = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'vital-signs',
          display: 'Vital Signs'
        }],
        text: 'Vital Signs'
      }];
      
      // Code - handle string or CodeableConcept
      if (typeof vitalSignData.code === 'string') {
        // Map common vital sign codes
        const vitalSignCodes = {
          'blood-pressure': { code: '85354-9', display: 'Blood pressure panel with all children optional' },
          'heart-rate': { code: '8867-4', display: 'Heart rate' },
          'respiratory-rate': { code: '9279-1', display: 'Respiratory rate' },
          'body-temperature': { code: '8310-5', display: 'Body temperature' },
          'oxygen-saturation': { code: '2708-6', display: 'Oxygen saturation in Arterial blood' },
          'body-weight': { code: '29463-7', display: 'Body weight' },
          'body-height': { code: '8302-2', display: 'Body height' },
          'bmi': { code: '39156-5', display: 'Body mass index (BMI) [Ratio]' }
        };
        
        const codeInfo = vitalSignCodes[vitalSignData.code] || { code: vitalSignData.code, display: vitalSignData.code };
        
        cleanVitalSign.code = {
          coding: [{
            system: 'http://loinc.org',
            code: codeInfo.code,
            display: codeInfo.display
          }],
          text: codeInfo.display
        };
      } else if (vitalSignData.code && typeof vitalSignData.code === 'object') {
        cleanVitalSign.code = vitalSignData.code;
      }
      
      // Subject (patient) reference
      if (vitalSignData.patientId) {
        const patient = await Patients.findOneAsync({
          $or: [
            { _id: vitalSignData.patientId },
            { id: vitalSignData.patientId }
          ]
        });
        
        if (patient) {
          cleanVitalSign.subject = {
            reference: `Patient/${patient.id || patient._id}`,
            display: FhirUtilities.pluckName(patient)
          };
        } else {
          throw new Meteor.Error('not-found', 'Patient not found');
        }
      }
      
      // Effective date/time
      if (vitalSignData.effectiveDateTime) {
        cleanVitalSign.effectiveDateTime = moment(vitalSignData.effectiveDateTime).toISOString();
      } else {
        cleanVitalSign.effectiveDateTime = moment().toISOString();
      }
      
      // Issued date/time
      cleanVitalSign.issued = moment().toISOString();
      
      // Value - handle different value types
      if (vitalSignData.valueQuantity) {
        cleanVitalSign.valueQuantity = vitalSignData.valueQuantity;
      } else if (vitalSignData.value !== undefined) {
        // Convert simple value to valueQuantity
        if (typeof vitalSignData.value === 'number') {
          // Determine unit based on code
          let unit = '';
          let system = 'http://unitsofmeasure.org';
          let code = '';
          
          const codeStr = get(cleanVitalSign, 'code.coding[0].code', '');
          switch(codeStr) {
            case '8867-4': // Heart rate
              unit = 'beats/minute';
              code = '/min';
              break;
            case '9279-1': // Respiratory rate
              unit = 'breaths/minute';
              code = '/min';
              break;
            case '8310-5': // Body temperature
              unit = '°C';
              code = 'Cel';
              break;
            case '2708-6': // Oxygen saturation
              unit = '%';
              code = '%';
              break;
            case '29463-7': // Body weight
              unit = 'kg';
              code = 'kg';
              break;
            case '8302-2': // Body height
              unit = 'cm';
              code = 'cm';
              break;
            case '39156-5': // BMI
              unit = 'kg/m2';
              code = 'kg/m2';
              break;
          }
          
          cleanVitalSign.valueQuantity = {
            value: vitalSignData.value,
            unit: unit,
            system: system,
            code: code
          };
        } else if (typeof vitalSignData.value === 'string') {
          cleanVitalSign.valueString = vitalSignData.value;
        }
      }
      
      // Component (for blood pressure panel)
      if (vitalSignData.component && Array.isArray(vitalSignData.component)) {
        cleanVitalSign.component = vitalSignData.component;
      }
      
      // Performer
      if (vitalSignData.performer) {
        if (typeof vitalSignData.performer === 'string') {
          const user = await Meteor.users.findOneAsync(vitalSignData.performer);
          if (user) {
            cleanVitalSign.performer = [{
              reference: `Practitioner/${vitalSignData.performer}`,
              display: user.username || `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim()
            }];
          }
        } else if (Array.isArray(vitalSignData.performer)) {
          cleanVitalSign.performer = vitalSignData.performer;
        } else if (typeof vitalSignData.performer === 'object') {
          cleanVitalSign.performer = [vitalSignData.performer];
        }
      } else {
        // Set performer from current user
        const user = await Meteor.users.findOneAsync(this.userId);
        if (user) {
          cleanVitalSign.performer = [{
            reference: `Practitioner/${this.userId}`,
            display: user.username || `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim()
          }];
        }
      }
      
      // Note
      if (vitalSignData.note) {
        cleanVitalSign.note = [{
          text: vitalSignData.note,
          time: moment().toISOString(),
          authorReference: {
            reference: `Practitioner/${this.userId}`
          }
        }];
      }
      
      // Interpretation
      if (vitalSignData.interpretation) {
        if (typeof vitalSignData.interpretation === 'string') {
          cleanVitalSign.interpretation = [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: vitalSignData.interpretation,
              display: vitalSignData.interpretation
            }],
            text: vitalSignData.interpretation
          }];
        } else if (typeof vitalSignData.interpretation === 'object') {
          cleanVitalSign.interpretation = [vitalSignData.interpretation];
        }
      }
      
      // Body site
      if (vitalSignData.bodySite) {
        if (typeof vitalSignData.bodySite === 'string') {
          cleanVitalSign.bodySite = {
            coding: [{
              system: 'http://snomed.info/sct',
              display: vitalSignData.bodySite
            }],
            text: vitalSignData.bodySite
          };
        } else if (typeof vitalSignData.bodySite === 'object') {
          cleanVitalSign.bodySite = vitalSignData.bodySite;
        }
      }
      
      // Method
      if (vitalSignData.method) {
        if (typeof vitalSignData.method === 'string') {
          cleanVitalSign.method = {
            coding: [{
              system: 'http://snomed.info/sct',
              display: vitalSignData.method
            }],
            text: vitalSignData.method
          };
        } else if (typeof vitalSignData.method === 'object') {
          cleanVitalSign.method = vitalSignData.method;
        }
      }
      
      // Device reference
      if (vitalSignData.device) {
        if (typeof vitalSignData.device === 'string') {
          cleanVitalSign.device = {
            reference: vitalSignData.device
          };
        } else if (typeof vitalSignData.device === 'object') {
          cleanVitalSign.device = vitalSignData.device;
        }
      }
      
      console.log('[VitalSigns.create] Clean vital sign ready for insert:', cleanVitalSign);
      
      // Insert the vital sign
      try {
        const vitalSignId = await Observations.insertAsync(cleanVitalSign);
        console.log('[VitalSigns.create] Vital sign created with ID:', vitalSignId);
        return vitalSignId;
      } catch (error) {
        console.error('[VitalSigns.create] Error creating vital sign:', error);
        throw new Meteor.Error('insert-failed', error.message);
      }
    }
  });
}