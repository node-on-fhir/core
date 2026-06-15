// packages/vital-signs/lib/index.js
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// Use existing Observations collection for vital signs
let VitalSigns;

Meteor.startup(function() {
  // Access the Observations collection from the main app
  VitalSigns = Meteor.Collections?.Observations;
  
  if (!VitalSigns) {
    console.warn('VitalSigns: Observations collection not found, binding by name');
    // _suppressSameNameError binds to the host app's existing 'Observations'
    // collection instead of throwing "already a collection named Observations"
    // when Meteor.Collections isn't populated yet under NPM/Rspack load order.
    VitalSigns = new Mongo.Collection('Observations', { _suppressSameNameError: true });
  }
});

export { VitalSigns };

// Schemas
import { VitalSignsPanelSchema } from './schemas/VitalSignsPanel';
import { BloodPressurePanelSchema } from './schemas/BloodPressurePanel';
import { BodyWeightSchema } from './schemas/BodyWeight';
import { BodyTemperatureSchema } from './schemas/BodyTemperature';
import { HeartRateSchema } from './schemas/HeartRate';
import { RespiratoryRateSchema } from './schemas/RespiratoryRate';
import { OxygenSaturationSchema } from './schemas/OxygenSaturation';
import { BodyMassIndexSchema } from './schemas/BodyMassIndex';
import { HeightSchema } from './schemas/Height';
import { BodyLengthSchema } from './schemas/BodyLength';
import { HeadCircumferenceSchema } from './schemas/HeadCircumference';

export const VitalSignsSchemas = {
  VitalSignsPanel: VitalSignsPanelSchema,
  BloodPressurePanel: BloodPressurePanelSchema,
  BodyWeight: BodyWeightSchema,
  BodyTemperature: BodyTemperatureSchema,
  HeartRate: HeartRateSchema,
  RespiratoryRate: RespiratoryRateSchema,
  OxygenSaturation: OxygenSaturationSchema,
  BodyMassIndex: BodyMassIndexSchema,
  Height: HeightSchema,
  BodyLength: BodyLengthSchema,
  HeadCircumference: HeadCircumferenceSchema
};

// Value Sets
import * as Units from './valueSets/units';
import * as Devices from './valueSets/devices';
import * as Qualifiers from './valueSets/qualifiers';

export const VitalSignsValueSets = {
  Units,
  Devices,
  Qualifiers
};

// Extensions
import * as Extensions from './extensions';
export { Extensions as VitalSignsExtensions };

// Utilities
import * as Utilities from './utilities/VitalSignsFactory';
export { Utilities as VitalSignsUtilities };

// Package info
export const VitalSignsPackage = {
  name: 'clinical:vital-signs',
  version: '0.1.0',
  summary: 'HL7 FHIR Vital Signs Implementation Guide for Meteor/Honeycomb',
  canonicalUrl: 'http://hl7.org/fhir/us/vitals',
  igVersion: '2.0.0'
};

if (Meteor.isServer) {
  console.log('VitalSigns package loaded on server');
}

if (Meteor.isClient) {
  console.log('VitalSigns package loaded on client');
}