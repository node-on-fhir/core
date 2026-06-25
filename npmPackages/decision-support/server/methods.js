// npmPackages/decision-support/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, set } from 'lodash';

import { DecisionSupportFeedback } from '../lib/collections.js';
import { buildPlanDefinition } from '../lib/DsiModel.js';
import { evaluateInterventions } from '../lib/evaluator.js';
import {
  SOURCE_ATTRIBUTE_KEYS,
  defaultSourceAttributePolicy
} from '../lib/sourceAttributes.js';
import sampleData from '../data/sampleInterventions.json';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function col(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

// Role gate: "limited set of identified users" (§ (ii)(A)/(iii)). If
// settings.private.decisionSupport.allowedUserIds is configured, enforce it;
// otherwise any logged-in user may configure (dev default).
function ensureConfigurator(userId) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in.');
  }
  const allowed = get(Meteor, 'settings.private.decisionSupport.allowedUserIds', []);
  if (Array.isArray(allowed) && allowed.length > 0 && allowed.indexOf(userId) === -1) {
    throw new Meteor.Error('not-authorized', 'You are not an identified decision-support configurator.');
  }
}

function getSourceAttributePolicy() {
  const configured = get(Meteor, 'settings.private.decisionSupport.sourceAttributes', {});
  return Object.assign(defaultSourceAttributePolicy(), configured);
}

function enabledCategories() {
  return get(Meteor, 'settings.private.decisionSupport.enabledCategories', ['imaging', 'laboratory']);
}

// Flexible patient filter (subject.reference OR patient.reference == Patient/<id>).
function patientSelector(patientId) {
  const ref = 'Patient/' + patientId;
  return { $or: [{ 'subject.reference': ref }, { 'patient.reference': ref }] };
}

async function fetchCategory(name, patientId, extra) {
  const collection = col(name);
  if (!collection || !patientId) return [];
  const selector = Object.assign({}, patientSelector(patientId), extra || {});
  try {
    return await collection.find(selector).fetchAsync();
  } catch (error) {
    console.warn('[decisionSupport] fetchCategory failed for', name, get(error, 'message'));
    return [];
  }
}

// Assemble the (iii)(A) data bundle for one patient.
async function buildPatientBundle(patientId) {
  const Patients = col('Patients');
  let demographics = {};
  if (Patients && patientId) {
    demographics = (await Patients.findOneAsync({ _id: patientId })) ||
      (await Patients.findOneAsync({ id: patientId })) || {};
  }
  return {
    demographics: demographics,
    problems: await fetchCategory('Conditions', patientId),
    medications: (await fetchCategory('MedicationRequests', patientId))
      .concat(await fetchCategory('MedicationStatements', patientId)),
    allergies: await fetchCategory('AllergyIntolerances', patientId),
    labs: await fetchCategory('Observations', patientId, { 'category.coding.code': 'laboratory' }),
    vitals: await fetchCategory('Observations', patientId, { 'category.coding.code': 'vital-signs' }),
    devices: await fetchCategory('Devices', patientId),
    procedures: await fetchCategory('Procedures', patientId)
  };
}

// Active DSIs whose used source attributes are all permitted by current policy.
async function activeAllowedInterventions() {
  const PlanDefinitions = col('PlanDefinitions');
  if (!PlanDefinitions) return [];
  const all = await PlanDefinitions.find({
    status: 'active',
    'type.coding.code': 'eca-rule'
  }).fetchAsync();
  const policy = getSourceAttributePolicy();
  return all.filter(function(dsi) {
    const ext = get(dsi, 'extension', []).find(function(e) {
      return get(e, 'url', '').indexOf('dsi-source-attributes') > -1;
    });
    const usesRaw = get((get(ext, 'extension', []).find(function(e) { return get(e, 'url') === 'usesSourceAttributes'; })), 'valueString', '');
    const uses = usesRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
    const disallowed = uses.filter(function(k) { return policy[k] === false; });
    if (disallowed.length) {
      console.log('[decisionSupport] suppressing DSI', get(dsi, '_id'), '— uses disallowed source attribute(s):', disallowed.join(','));
      return false;
    }
    return true;
  });
}

// Core evaluation shared by the method and the hook.
export async function evaluateForContext(serviceRequest, patientId) {
  const bundle = await buildPatientBundle(patientId);
  const interventions = await activeAllowedInterventions();
  return evaluateInterventions(interventions, {
    serviceRequest: serviceRequest,
    bundle: bundle,
    referenceYear: new Date().getFullYear()
  });
}

// Persist a firing as GuidanceResponse + DetectedIssue (the "actively presented" record).
export async function recordFiring(match, serviceRequest, patientId, userId) {
  const GuidanceResponses = col('GuidanceResponses');
  const DetectedIssues = col('DetectedIssues');
  const now = new Date().toISOString();
  const grId = Random.id();
  const diId = Random.id();
  const patientRef = patientId ? { reference: 'Patient/' + patientId } : undefined;

  if (DetectedIssues) {
    await DetectedIssues.insertAsync({
      _id: diId,
      id: diId,
      resourceType: 'DetectedIssue',
      status: 'preliminary',
      severity: 'moderate',
      code: { text: get(match, 'title') },
      patient: patientRef,
      identifiedDateTime: now,
      detail: get(match, 'message'),
      reference: 'PlanDefinition/' + get(match, 'interventionId'),
      implicated: serviceRequest ? [{ reference: 'ServiceRequest/' + get(serviceRequest, '_id', get(serviceRequest, 'id')) }] : undefined,
      author: userId ? { reference: 'Practitioner/' + userId } : undefined
    });
  }
  if (GuidanceResponses) {
    await GuidanceResponses.insertAsync({
      _id: grId,
      id: grId,
      resourceType: 'GuidanceResponse',
      status: 'success',
      moduleCanonical: 'PlanDefinition/' + get(match, 'interventionId'),
      subject: patientRef,
      occurrenceDateTime: now,
      result: { reference: 'DetectedIssue/' + diId },
      reasonCode: [{ text: get(match, 'message') }]
    });
  }
  return { guidanceResponseId: grId, detectedIssueId: diId };
}

// ---------------------------------------------------------------------------
// methods
// ---------------------------------------------------------------------------

Meteor.methods({
  'decisionSupport.getStatus': async function() {
    return { name: 'decision-support', version: '0.1.0', status: 'active', timestamp: new Date().toISOString() };
  },

  // Seed the bundled sample evidence-based DSIs (idempotent).
  'decisionSupport.seedSampleInterventions': async function() {
    ensureConfigurator(this.userId);
    const PlanDefinitions = col('PlanDefinitions');
    if (!PlanDefinitions) throw new Meteor.Error('no-collection', 'PlanDefinitions not registered');
    let inserted = 0;
    const interventions = get(sampleData, 'interventions', []);
    for (let i = 0; i < interventions.length; i++) {
      const input = interventions[i];
      const existing = await PlanDefinitions.findOneAsync({ _id: input.id });
      if (existing) continue;
      await PlanDefinitions.insertAsync(buildPlanDefinition(input));
      inserted++;
    }
    console.log('[decisionSupport.seedSampleInterventions] inserted', inserted);
    return { inserted: inserted };
  },

  // Author / update a DSI (role-gated).
  'decisionSupport.upsertIntervention': async function(input) {
    check(input, Object);
    ensureConfigurator(this.userId);
    const PlanDefinitions = col('PlanDefinitions');
    if (!PlanDefinitions) throw new Meteor.Error('no-collection', 'PlanDefinitions not registered');

    const id = get(input, 'id') || Random.id();
    const planDefinition = buildPlanDefinition(Object.assign({}, input, { id: id }));
    const existing = await PlanDefinitions.findOneAsync({ _id: id });
    if (existing) {
      await PlanDefinitions.updateAsync({ _id: id }, { $set: planDefinition });
    } else {
      await PlanDefinitions.insertAsync(planDefinition);
    }
    return { id: id };
  },

  // Select (activate) / deactivate a DSI — criterion (iii).
  'decisionSupport.setInterventionStatus': async function(interventionId, status) {
    check(interventionId, String);
    check(status, Match.OneOf('active', 'draft', 'retired'));
    ensureConfigurator(this.userId);
    const PlanDefinitions = col('PlanDefinitions');
    await PlanDefinitions.updateAsync({ _id: interventionId }, { $set: { status: status } });
    console.log('[decisionSupport.setInterventionStatus]', interventionId, '->', status);
    return { id: interventionId, status: status };
  },

  // Synchronous pre-submit evaluation for the interruptive alert.
  'decisionSupport.evaluate': async function(context) {
    check(context, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const serviceRequest = get(context, 'serviceRequest', null);
    const patientId = get(context, 'patientId', '');
    const matches = await evaluateForContext(serviceRequest, patientId);
    return { matches: matches, count: matches.length };
  },

  // (ii)(C) feedback loop — capture.
  'decisionSupport.recordFeedback': async function(payload) {
    check(payload, Object);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const doc = {
      _id: Random.id(),
      interventionId: get(payload, 'interventionId', ''),
      interventionTitle: get(payload, 'interventionTitle', ''),
      guidanceResponseId: get(payload, 'guidanceResponseId', ''),
      serviceRequestId: get(payload, 'serviceRequestId', ''),
      patientId: get(payload, 'patientId', ''),
      actionTaken: get(payload, 'actionTaken', ''),       // accepted | overridden | dismissed | modified
      userFeedback: get(payload, 'userFeedback', ''),
      userId: this.userId,
      date: new Date().toISOString(),
      location: get(payload, 'location', get(Meteor, 'settings.public.location.name', ''))
    };
    await DecisionSupportFeedback.insertAsync(doc);
    return { id: doc._id };
  },

  // (ii)(C) feedback loop — computable export (rows + NDJSON).
  'decisionSupport.exportFeedback': async function(filter) {
    check(filter, Match.Maybe(Object));
    ensureConfigurator(this.userId);
    const selector = get(filter, 'patientId') ? { patientId: get(filter, 'patientId') } : {};
    const docs = await DecisionSupportFeedback.find(selector, { sort: { date: -1 } }).fetchAsync();
    const rows = docs.map(function(d) {
      return {
        intervention: d.interventionId,
        interventionTitle: d.interventionTitle,
        actionTaken: d.actionTaken,
        userFeedback: d.userFeedback,
        user: d.userId,
        date: d.date,
        location: d.location
      };
    });
    return { rows: rows, ndjson: rows.map(function(r) { return JSON.stringify(r); }).join('\n') };
  },

  // Source-attribute usage policy — read.
  'decisionSupport.getSourceAttributePolicy': async function() {
    return {
      sourceAttributes: getSourceAttributePolicy(),
      enabledCategories: enabledCategories(),
      keys: SOURCE_ATTRIBUTE_KEYS
    };
  },

  // Source-attribute usage policy — flip one flag (role-gated), persist for restart.
  'decisionSupport.setSourceAttributeUsage': async function(key, allowed) {
    check(key, String);
    check(allowed, Boolean);
    ensureConfigurator(this.userId);
    if (SOURCE_ATTRIBUTE_KEYS.indexOf(key) === -1) {
      throw new Meteor.Error('bad-key', 'Unknown source attribute: ' + key);
    }
    set(Meteor, 'settings.private.decisionSupport.sourceAttributes.' + key, allowed);

    // Persist to the ServerConfiguration collection so it survives restart
    // (mirrors imports/api/serverConfiguration/methods.js).
    const ServerConfiguration = col('ServerConfiguration');
    if (ServerConfiguration) {
      const existing = await ServerConfiguration.findOneAsync({ configType: 'decisionSupport' });
      const data = Object.assign({}, get(existing, 'data', {}), getSourceAttributePolicy());
      if (existing) {
        await ServerConfiguration.updateAsync({ _id: existing._id }, { $set: { data: data, updatedAt: new Date() } });
      } else {
        await ServerConfiguration.insertAsync({ configType: 'decisionSupport', data: data, updatedAt: new Date() });
      }
    }
    console.log('[decisionSupport.setSourceAttributeUsage]', key, '=', allowed);
    return { key: key, allowed: allowed };
  }
});

console.log('[decision-support] Server methods registered');
