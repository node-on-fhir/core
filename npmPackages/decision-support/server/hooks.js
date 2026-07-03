// npmPackages/decision-support/server/hooks.js
//
// DSI integration seam (§ 170.315(b)(11)). Registered via the workflow
// hooksEntry (init*Hooks contract — see imports/workflows/server-loader.js).
//
//  - ServiceRequests.after.insert : when an order in an enabled category is
//    placed, evaluate active DSIs and persist firings (GuidanceResponse +
//    DetectedIssue). Mirrors extensions/radiology-workflow/server/hooks.js.
//  - Conditions / AllergyIntolerances / MedicationRequests after.insert : when
//    the record is incorporated from a transition-of-care / referral summary,
//    re-evaluate trigger-less DSIs — § (ii)(B).

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { evaluateForContext, recordFiring } from './methods.js';

const log = (Meteor.Logger ? Meteor.Logger.for('hooks') : console);

function col(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

function enabledCategories() {
  return get(Meteor, 'settings.private.decisionSupport.enabledCategories', ['imaging', 'laboratory']);
}

function orderCategories(doc) {
  const out = [];
  get(doc, 'category', []).forEach(function(cat) {
    get(cat, 'coding', []).forEach(function(c) {
      if (get(c, 'display')) out.push(String(get(c, 'display')).toLowerCase());
      if (get(c, 'code')) out.push(String(get(c, 'code')).toLowerCase());
    });
  });
  return out;
}

function patientIdFromRef(doc) {
  const ref = get(doc, 'subject.reference', get(doc, 'patient.reference', ''));
  return ref ? String(ref).replace('Patient/', '') : '';
}

// Is this resource incorporated from a ToC / referral summary?
function isFromTransitionOfCare(doc) {
  const source = String(get(doc, 'meta.source', '')).toLowerCase();
  if (source.indexOf('transition') > -1 || source.indexOf('referral') > -1 || source.indexOf('ccda') > -1) {
    return true;
  }
  return get(doc, 'meta.tag', []).some(function(t) {
    const code = String(get(t, 'code', '')).toLowerCase();
    return code.indexOf('transition-of-care') > -1 || code.indexOf('referral') > -1;
  });
}

async function fireFor(serviceRequest, patientId, userId) {
  if (!patientId) return;
  try {
    const matches = await evaluateForContext(serviceRequest, patientId);
    for (let i = 0; i < matches.length; i++) {
      await recordFiring(matches[i], serviceRequest, patientId, userId);
    }
    if (matches.length) {
      log.debug('decision-support fired ' + matches.length + ' intervention(s) for patient ' + patientId);
    }
  } catch (error) {
    console.error('[decision-support] evaluation error:', get(error, 'message', error));
  }
}

export function initDecisionSupportHooks() {
  const ServiceRequests = col('ServiceRequests');
  if (ServiceRequests && ServiceRequests.after) {
    ServiceRequests.after.insert(function(userId, doc) {
      const cats = orderCategories(doc);
      const allowed = enabledCategories().map(function(c) { return String(c).toLowerCase(); });
      const optedIn = cats.some(function(c) { return allowed.indexOf(c) > -1; });
      if (!optedIn) return; // catalog/category did not opt into DSI
      Meteor.defer(function() { fireFor(doc, patientIdFromRef(doc), userId); });
    });
    console.log('[decision-support] ServiceRequest hook initialized');
  } else {
    console.warn('[decision-support] ServiceRequests collection/hooks unavailable');
  }

  // ToC-incorporation trigger — § (ii)(B).
  ['Conditions', 'AllergyIntolerances', 'MedicationRequests'].forEach(function(name) {
    const collection = col(name);
    if (collection && collection.after) {
      collection.after.insert(function(userId, doc) {
        if (!isFromTransitionOfCare(doc)) return;
        Meteor.defer(function() { fireFor(null, patientIdFromRef(doc), userId); });
      });
    }
  });

  console.log('[decision-support] Hooks initialized');
}
