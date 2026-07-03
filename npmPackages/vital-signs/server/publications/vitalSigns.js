// /packages/vital-signs/server/publications/vitalSigns.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('vitalSigns') : console);

// Collections will be accessed via Meteor.Collections
let Observations;

Meteor.startup(function() {
  Observations = Meteor.Collections?.Observations;
});

if (Meteor.isServer) {
  // Publish vital signs for a specific patient
  Meteor.publish('VitalSigns.byPatient', function(patientId, options = {}) {
    check(patientId, String);
    check(options, {
      limit: Match.Optional(Number),
      sort: Match.Optional(Object),
      dateFrom: Match.Optional(Date),
      dateTo: Match.Optional(Date),
      codes: Match.Optional(Array),
      includeDeleted: Match.Optional(Boolean)
    });
    
    // Check user is logged in
    if (!this.userId) {
      console.log('[VitalSigns.byPatient] Unauthorized access attempt'); // phi-audit: ok
      return this.ready();
    }
    
    // Build query
    const query = {
      'category.coding.code': 'vital-signs'
    };
    
    // Add patient filter
    query.$or = [
      { 'subject.reference': `Patient/${patientId}` },
      { 'subject.reference': patientId },
      { 'patient.reference': `Patient/${patientId}` },
      { 'patient.reference': patientId }
    ];
    
    // Filter out deleted unless specifically requested
    if (!options.includeDeleted) {
      query.status = { $ne: 'entered-in-error' };
      query._deletedAt = { $exists: false };
    }
    
    // Date range filter
    if (options.dateFrom || options.dateTo) {
      query.effectiveDateTime = {};
      if (options.dateFrom) {
        query.effectiveDateTime.$gte = options.dateFrom.toISOString();
      }
      if (options.dateTo) {
        query.effectiveDateTime.$lte = options.dateTo.toISOString();
      }
    }
    
    // Filter by specific vital sign codes
    if (options.codes && options.codes.length > 0) {
      query['code.coding.code'] = { $in: options.codes };
    }
    
    // Set default options
    const pubOptions = {
      limit: options.limit || 100,
      sort: options.sort || { effectiveDateTime: -1 }
    };
    
    log.debug('[VitalSigns.byPatient] Publishing vital signs for patient:', { patientId, query, pubOptions });
    
    return Observations.find(query, pubOptions);
  });
  
  // Publish recent vital signs across all patients (for dashboard/overview)
  Meteor.publish('VitalSigns.recent', function(options = {}) {
    check(options, {
      limit: Match.Optional(Number),
      patientIds: Match.Optional(Array),
      performerId: Match.Optional(String),
      codes: Match.Optional(Array)
    });
    
    // Check user is logged in
    if (!this.userId) {
      console.log('[VitalSigns.recent] Unauthorized access attempt');
      return this.ready();
    }
    
    // Build query
    const query = {
      'category.coding.code': 'vital-signs',
      status: { $ne: 'entered-in-error' },
      _deletedAt: { $exists: false }
    };
    
    // Filter by specific patients if provided
    if (options.patientIds && options.patientIds.length > 0) {
      const patientReferences = [];
      options.patientIds.forEach(id => {
        patientReferences.push(`Patient/${id}`);
        patientReferences.push(id);
      });
      
      query.$or = [
        { 'subject.reference': { $in: patientReferences } },
        { 'patient.reference': { $in: patientReferences } }
      ];
    }
    
    // Filter by performer
    if (options.performerId) {
      query['performer.reference'] = {
        $in: [`Practitioner/${options.performerId}`, options.performerId]
      };
    }
    
    // Filter by specific vital sign codes
    if (options.codes && options.codes.length > 0) {
      query['code.coding.code'] = { $in: options.codes };
    }
    
    // Set default options
    const pubOptions = {
      limit: options.limit || 50,
      sort: { effectiveDateTime: -1 }
    };
    
    console.log('[VitalSigns.recent] Publishing recent vital signs, Query:', query, 'Options:', pubOptions);
    
    return Observations.find(query, pubOptions);
  });
  
  // Publish a single vital sign by ID
  Meteor.publish('VitalSigns.single', function(vitalSignId) {
    check(vitalSignId, String);
    
    // Check user is logged in
    if (!this.userId) {
      console.log('[VitalSigns.single] Unauthorized access attempt');
      return this.ready();
    }
    
    console.log('[VitalSigns.single] Publishing vital sign:', vitalSignId);
    
    return Observations.find({
      _id: vitalSignId,
      'category.coding.code': 'vital-signs'
    });
  });
  
  // Publish vital signs panel (grouped vital signs taken at same time)
  Meteor.publish('VitalSigns.panel', function(patientId, options = {}) {
    check(patientId, String);
    check(options, {
      limit: Match.Optional(Number),
      dateFrom: Match.Optional(Date),
      dateTo: Match.Optional(Date)
    });
    
    // Check user is logged in
    if (!this.userId) {
      console.log('[VitalSigns.panel] Unauthorized access attempt');
      return this.ready();
    }
    
    // Build query for panel observations
    const query = {
      'category.coding.code': 'vital-signs',
      'code.coding.code': '85353-1', // LOINC code for vital signs panel
      status: { $ne: 'entered-in-error' },
      _deletedAt: { $exists: false }
    };
    
    // Add patient filter
    query.$or = [
      { 'subject.reference': `Patient/${patientId}` },
      { 'subject.reference': patientId },
      { 'patient.reference': `Patient/${patientId}` },
      { 'patient.reference': patientId }
    ];
    
    // Date range filter
    if (options.dateFrom || options.dateTo) {
      query.effectiveDateTime = {};
      if (options.dateFrom) {
        query.effectiveDateTime.$gte = options.dateFrom.toISOString();
      }
      if (options.dateTo) {
        query.effectiveDateTime.$lte = options.dateTo.toISOString();
      }
    }
    
    const pubOptions = {
      limit: options.limit || 20,
      sort: { effectiveDateTime: -1 }
    };
    
    log.debug('[VitalSigns.panel] Publishing vital sign panels for patient:', { patientId });
    
    return Observations.find(query, pubOptions);
  });
  
  // Publish latest vital signs for each type for a patient
  Meteor.publish('VitalSigns.latest', function(patientId, options = {}) {
    check(patientId, String);
    check(options, {
      codes: Match.Optional(Array),
      dateFrom: Match.Optional(Date),
      dateTo: Match.Optional(Date)
    });
    
    if (!this.userId) {
      console.log('[VitalSigns.latest] Unauthorized access attempt');
      return this.ready();
    }
    
    // Build base query
    const query = {
      'category.coding.code': 'vital-signs',
      status: { $ne: 'entered-in-error' },
      _deletedAt: { $exists: false }
    };
    
    // Add patient filter
    query.$or = [
      { 'subject.reference': `Patient/${patientId}` },
      { 'subject.reference': patientId },
      { 'patient.reference': `Patient/${patientId}` },
      { 'patient.reference': patientId }
    ];
    
    // Date range filter
    if (options.dateFrom || options.dateTo) {
      query.effectiveDateTime = {};
      if (options.dateFrom) {
        query.effectiveDateTime.$gte = options.dateFrom.toISOString();
      }
      if (options.dateTo) {
        query.effectiveDateTime.$lte = options.dateTo.toISOString();
      }
    }
    
    // Get specific vital sign codes or use defaults
    const codes = options.codes || [
      '8867-4', // Heart rate
      '9279-1', // Respiratory rate
      '8310-5', // Body temperature
      '2708-6', // Oxygen saturation
      '29463-7', // Body weight
      '8302-2', // Body height
      '39156-5', // BMI
      '8480-6', // Systolic blood pressure
      '8462-4'  // Diastolic blood pressure
    ];
    
    // For each code, we want only the latest observation
    // MongoDB doesn't support this directly, so we'll use an aggregation-like approach
    // by getting recent observations for all codes and letting the client filter
    query['code.coding.code'] = { $in: codes };
    
    const pubOptions = {
      sort: { 'code.coding.code': 1, effectiveDateTime: -1 },
      limit: codes.length * 5 // Get up to 5 recent per type, client will filter to latest
    };
    
    log.debug('[VitalSigns.latest] Publishing latest vital signs for patient:', { patientId });
    
    return Observations.find(query, pubOptions);
  });
}