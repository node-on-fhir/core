// /packages/vital-signs/server/methods/updateVitalSign.js

import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { check, Match } from 'meteor/check';
import { get, set, cloneDeep } from 'lodash';
import moment from 'moment';

// Collections will be accessed via Meteor.Collections
let Observations, Patients;

Meteor.startup(function() {
  Observations = Meteor.Collections?.Observations;
  Patients = Meteor.Collections?.Patients;
});

if (Meteor.isServer) {
  Meteor.methods({
    async 'VitalSigns.update'(vitalSignId, updateData) {
      console.log('[VitalSigns.update] Method called', vitalSignId, updateData);
      
      // Check user is logged in
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'User must be logged in to update vital signs');
      }
      
      // Validate input
      check(vitalSignId, String);
      check(updateData, {
        code: Match.Optional(Match.OneOf(String, Object)),
        value: Match.Optional(Match.OneOf(Number, String, Object)),
        valueQuantity: Match.Optional(Object),
        component: Match.Optional(Array),
        effectiveDateTime: Match.Optional(Date),
        status: Match.Optional(String),
        performer: Match.Optional(Match.OneOf(String, Array, Object)),
        note: Match.Optional(String),
        interpretation: Match.Optional(Match.OneOf(String, Object)),
        bodySite: Match.Optional(Match.OneOf(String, Object)),
        method: Match.Optional(Match.OneOf(String, Object)),
        device: Match.Optional(Match.OneOf(String, Object))
      });
      
      // Check vital sign exists and is a vital sign observation
      const existingVitalSign = await Observations.findOneAsync({
        _id: vitalSignId,
        'category.coding.code': 'vital-signs'
      });
      
      if (!existingVitalSign) {
        throw new Meteor.Error('not-found', 'Vital sign not found');
      }
      
      // Check permissions - user should be performer or have admin rights
      const isPerformer = get(existingVitalSign, 'performer', []).some(perf => 
        get(perf, 'reference') === `Practitioner/${this.userId}`
      );
      
      if (!isPerformer && !Roles.userIsInRole(this.userId, ['admin', 'practitioner'])) {
        throw new Meteor.Error('not-authorized', 'You can only update your own vital sign measurements');
      }
      
      let cleanUpdateData = cloneDeep(existingVitalSign);
      
      // Update metadata
      cleanUpdateData.meta = cleanUpdateData.meta || {};
      cleanUpdateData.meta.versionId = String(parseInt(get(cleanUpdateData, 'meta.versionId', '0')) + 1);
      cleanUpdateData.meta.lastUpdated = new Date();
      
      // Status update
      if (updateData.status) {
        cleanUpdateData.status = updateData.status;
      }
      
      // Code update - handle string or CodeableConcept
      if (updateData.code !== undefined) {
        if (typeof updateData.code === 'string') {
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
          
          const codeInfo = vitalSignCodes[updateData.code] || { code: updateData.code, display: updateData.code };
          
          cleanUpdateData.code = {
            coding: [{
              system: 'http://loinc.org',
              code: codeInfo.code,
              display: codeInfo.display
            }],
            text: codeInfo.display
          };
        } else if (updateData.code && typeof updateData.code === 'object') {
          cleanUpdateData.code = updateData.code;
        }
      }
      
      // Value update - handle different value types
      if (updateData.valueQuantity !== undefined) {
        cleanUpdateData.valueQuantity = updateData.valueQuantity;
        // Remove other value types
        delete cleanUpdateData.valueString;
        delete cleanUpdateData.valueCodeableConcept;
      } else if (updateData.value !== undefined) {
        // Convert simple value to valueQuantity
        if (typeof updateData.value === 'number') {
          // Determine unit based on code
          let unit = '';
          let system = 'http://unitsofmeasure.org';
          let code = '';
          
          const codeStr = get(cleanUpdateData, 'code.coding[0].code', '');
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
          
          cleanUpdateData.valueQuantity = {
            value: updateData.value,
            unit: unit,
            system: system,
            code: code
          };
          // Remove other value types
          delete cleanUpdateData.valueString;
          delete cleanUpdateData.valueCodeableConcept;
        } else if (typeof updateData.value === 'string') {
          cleanUpdateData.valueString = updateData.value;
          // Remove other value types
          delete cleanUpdateData.valueQuantity;
          delete cleanUpdateData.valueCodeableConcept;
        }
      }
      
      // Component update (for blood pressure panel)
      if (updateData.component !== undefined) {
        cleanUpdateData.component = updateData.component;
      }
      
      // Effective date/time update
      if (updateData.effectiveDateTime !== undefined) {
        cleanUpdateData.effectiveDateTime = moment(updateData.effectiveDateTime).toISOString();
      }
      
      // Performer update
      if (updateData.performer !== undefined) {
        if (typeof updateData.performer === 'string') {
          const user = await Meteor.users.findOneAsync(updateData.performer);
          if (user) {
            cleanUpdateData.performer = [{
              reference: `Practitioner/${updateData.performer}`,
              display: user.username || `${get(user, 'profile.name.given[0]', '')} ${get(user, 'profile.name.family', '')}`.trim()
            }];
          }
        } else if (Array.isArray(updateData.performer)) {
          cleanUpdateData.performer = updateData.performer;
        } else if (typeof updateData.performer === 'object') {
          cleanUpdateData.performer = [updateData.performer];
        }
      }
      
      // Note update - append to existing notes
      if (updateData.note) {
        if (!cleanUpdateData.note) {
          cleanUpdateData.note = [];
        }
        cleanUpdateData.note.push({
          text: updateData.note,
          time: moment().toISOString(),
          authorReference: {
            reference: `Practitioner/${this.userId}`
          }
        });
      }
      
      // Interpretation update
      if (updateData.interpretation !== undefined) {
        if (typeof updateData.interpretation === 'string') {
          cleanUpdateData.interpretation = [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
              code: updateData.interpretation,
              display: updateData.interpretation
            }],
            text: updateData.interpretation
          }];
        } else if (typeof updateData.interpretation === 'object') {
          cleanUpdateData.interpretation = [updateData.interpretation];
        }
      }
      
      // Body site update
      if (updateData.bodySite !== undefined) {
        if (typeof updateData.bodySite === 'string') {
          cleanUpdateData.bodySite = {
            coding: [{
              system: 'http://snomed.info/sct',
              display: updateData.bodySite
            }],
            text: updateData.bodySite
          };
        } else if (typeof updateData.bodySite === 'object') {
          cleanUpdateData.bodySite = updateData.bodySite;
        }
      }
      
      // Method update
      if (updateData.method !== undefined) {
        if (typeof updateData.method === 'string') {
          cleanUpdateData.method = {
            coding: [{
              system: 'http://snomed.info/sct',
              display: updateData.method
            }],
            text: updateData.method
          };
        } else if (typeof updateData.method === 'object') {
          cleanUpdateData.method = updateData.method;
        }
      }
      
      // Device reference update
      if (updateData.device !== undefined) {
        if (typeof updateData.device === 'string') {
          cleanUpdateData.device = {
            reference: updateData.device
          };
        } else if (typeof updateData.device === 'object') {
          cleanUpdateData.device = updateData.device;
        }
      }
      
      console.log('[VitalSigns.update] Update data:', cleanUpdateData);
      
      // Update the vital sign
      try {
        const result = await Observations.updateAsync(
          { _id: vitalSignId },
          { $set: cleanUpdateData }
        );
        console.log('[VitalSigns.update] Vital sign updated:', result);
        return result;
      } catch (error) {
        console.error('[VitalSigns.update] Error updating vital sign:', error);
        throw new Meteor.Error('update-failed', error.message);
      }
    }
  });
}