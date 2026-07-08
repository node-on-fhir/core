// npmPackages/radiology-workflow/server/publications.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';

// =============================================================================
// RADIOLOGY WORKFLOW PUBLICATIONS
// =============================================================================
// These publications provide DDP access to radiology-related FHIR collections.
// Each requires authentication and the 'healthcare provider' or
// 'healthcare practitioner' role.
// =============================================================================

const defaultLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

/**
 * Check if user has a healthcare role (provider or practitioner)
 * @param {Array} roles - User roles array
 * @returns {boolean}
 */
function hasHealthcareRole(roles) {
  if (!Array.isArray(roles)) {
    return false;
  }
  return roles.includes('healthcare provider') || roles.includes('healthcare practitioner');
}

// -----------------------------------------------------------------------------
// radiology.ImagingStudies
// -----------------------------------------------------------------------------

Meteor.publish('radiology.ImagingStudies', async function(query = {}, options = {}) {
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));

  if (!this.userId) {
    console.log('[radiology.ImagingStudies] No userId, returning ready');
    return this.ready();
  }

  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user || !hasHealthcareRole(get(user, 'roles', []))) {
    console.log('[radiology.ImagingStudies] User lacks healthcare role, returning ready');
    return this.ready();
  }

  const pubOptions = {
    limit: Math.min(get(options, 'limit', defaultLimit), defaultLimit),
    sort: get(options, 'sort', { started: -1 })
  };

  console.log('[radiology.ImagingStudies] Publishing for user:', this.userId);
  return ImagingStudies.find(query, pubOptions);
});

// -----------------------------------------------------------------------------
// radiology.DiagnosticReports
// -----------------------------------------------------------------------------

Meteor.publish('radiology.DiagnosticReports', async function(query = {}, options = {}) {
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));

  if (!this.userId) {
    console.log('[radiology.DiagnosticReports] No userId, returning ready');
    return this.ready();
  }

  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user || !hasHealthcareRole(get(user, 'roles', []))) {
    console.log('[radiology.DiagnosticReports] User lacks healthcare role, returning ready');
    return this.ready();
  }

  const pubOptions = {
    limit: Math.min(get(options, 'limit', defaultLimit), defaultLimit),
    sort: get(options, 'sort', { issued: -1 })
  };

  console.log('[radiology.DiagnosticReports] Publishing for user:', this.userId);
  return DiagnosticReports.find(query, pubOptions);
});

// -----------------------------------------------------------------------------
// radiology.DocumentReferences
// -----------------------------------------------------------------------------

Meteor.publish('radiology.DocumentReferences', async function(query = {}, options = {}) {
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));

  if (!this.userId) {
    console.log('[radiology.DocumentReferences] No userId, returning ready');
    return this.ready();
  }

  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user || !hasHealthcareRole(get(user, 'roles', []))) {
    console.log('[radiology.DocumentReferences] User lacks healthcare role, returning ready');
    return this.ready();
  }

  const pubOptions = {
    limit: Math.min(get(options, 'limit', defaultLimit), defaultLimit),
    sort: get(options, 'sort', { date: -1 })
  };

  console.log('[radiology.DocumentReferences] Publishing for user:', this.userId);
  return DocumentReferences.find(query, pubOptions);
});

// -----------------------------------------------------------------------------
// radiology.ServiceRequests
// -----------------------------------------------------------------------------

Meteor.publish('radiology.ServiceRequests', async function(query = {}, options = {}) {
  check(query, Match.Maybe(Object));
  check(options, Match.Maybe(Object));

  if (!this.userId) {
    console.log('[radiology.ServiceRequests] No userId, returning ready');
    return this.ready();
  }

  const user = await Meteor.users.findOneAsync(this.userId);
  if (!user || !hasHealthcareRole(get(user, 'roles', []))) {
    console.log('[radiology.ServiceRequests] User lacks healthcare role, returning ready');
    return this.ready();
  }

  const pubOptions = {
    limit: Math.min(get(options, 'limit', defaultLimit), defaultLimit),
    sort: get(options, 'sort', { authoredOn: -1 })
  };

  console.log('[radiology.ServiceRequests] Publishing for user:', this.userId);
  return ServiceRequests.find(query, pubOptions);
});

console.log('[radiology-workflow] Publications registered');
