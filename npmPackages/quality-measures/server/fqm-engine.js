// packages/quality-measures/server/fqm-engine.js
//
// Real CQL-based measure calculation via fqm-execution (projecttacoma).
// Serves non-PACIO measures: a FHIR measure bundle (Measure + Libraries with
// base64 ELM + ValueSets) must first be imported via
// qualityMeasures.importMeasureBundle. PACIO measures use the evaluators in
// server/evaluators/ instead.
//
// fqm-execution is an app-level npm dependency (package.json), loaded lazily
// and server-only so it never enters the client bundle.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { isPacioMeasure } from '../lib/pacio-measures';

const log = (Meteor.Logger ? Meteor.Logger.for('fqm-engine') : console);

let fqmModule = null;
let fqmLoadFailed = false;

function getFqmCalculator() {
  if (fqmModule) {
    return fqmModule;
  }
  if (fqmLoadFailed) {
    return null;
  }
  try {
    // eslint-disable-next-line global-require
    fqmModule = require('fqm-execution');
    console.log('[fqm-engine] fqm-execution loaded');
    return fqmModule;
  } catch (error) {
    fqmLoadFailed = true;
    console.warn('[fqm-engine] fqm-execution not available:', error.message);
    return null;
  }
}

// Resolve the VSAC/UMLS API key. BYOK model — UMLS licenses are individual,
// so the app ships keyless and each deployment supplies its own key.
// Precedence: ServerConfiguration collection (runtime-entered via the
// /server-configuration panel) → Meteor.settings.private.vsac.apiKey → env.
export async function getVsacApiKey() {
  const ServerConfiguration = get(global, 'Collections.ServerConfiguration');
  if (ServerConfiguration) {
    const stored = await ServerConfiguration.findOneAsync({ configType: 'vsac' });
    const storedKey = get(stored, 'data.apiKey', '');
    if (storedKey) {
      return { apiKey: storedKey, source: 'database' };
    }
  }

  const settingsKey = get(Meteor, 'settings.private.vsac.apiKey', '');
  if (settingsKey) {
    return { apiKey: settingsKey, source: 'settings' };
  }

  const envKey = process.env.VSAC_API_KEY || '';
  if (envKey) {
    return { apiKey: envKey, source: 'env' };
  }

  return { apiKey: '', source: null };
}

// Strip Mongo/bookkeeping fields before handing resources to the engine
function toFhirResource(doc) {
  const resource = Object.assign({}, doc);
  delete resource._id;
  delete resource._bundleMeasureId;
  delete resource._document;
  return resource;
}

// Assemble a measure bundle from the Measures/Libraries/ValueSets collections.
// Libraries and ValueSets are tagged with _bundleMeasureId at import time.
export async function assembleMeasureBundle(measureId) {
  const Measures = get(global, 'Collections.Measures');
  if (!Measures) {
    return null;
  }

  const measure = await Measures.findOneAsync({ _id: measureId });
  if (!measure) {
    return null;
  }

  const entries = [{ resource: toFhirResource(measure) }];

  const Libraries = get(global, 'Collections.Libraries');
  if (Libraries) {
    const libraries = await Libraries.find({ _bundleMeasureId: measureId }).fetchAsync();
    libraries.forEach(function(library) {
      entries.push({ resource: toFhirResource(library) });
    });
  }

  const ValueSets = get(global, 'Collections.ValueSets');
  if (ValueSets) {
    const valueSets = await ValueSets.find({ _bundleMeasureId: measureId }).fetchAsync();
    valueSets.forEach(function(valueSet) {
      entries.push({ resource: toFhirResource(valueSet) });
    });
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries
  };
}

// Does the bundle contain at least one Library with ELM JSON content?
export function measureBundleHasElm(bundle) {
  const entries = get(bundle, 'entry', []);
  return entries.some(function(entry) {
    if (get(entry, 'resource.resourceType') !== 'Library') {
      return false;
    }
    const contents = get(entry, 'resource.content', []);
    return contents.some(function(content) {
      return get(content, 'contentType') === 'application/elm+json';
    });
  });
}

// Resolve a UI/placeholder measure id to an imported Measure's _id.
// 1. Exact Measures._id match (an imported bundle keyed by that id)
// 2. CMS-number prefix match: 'CMS122v12' resolves to an imported 'CMS122FHIR'
//    (MADiE exports version their ids differently than the UI placeholders)
// 3. null when nothing is imported for that measure
export async function resolveMeasureId(measureId) {
  const Measures = get(global, 'Collections.Measures');
  if (!Measures || !measureId) {
    return null;
  }

  const exact = await Measures.findOneAsync({ _id: measureId }, { fields: { _id: 1 } });
  if (exact) {
    return get(exact, '_id');
  }

  const cmsMatch = String(measureId).match(/^CMS(\d+)/i);
  if (!cmsMatch) {
    return null;
  }

  const cmsRegex = new RegExp('^CMS' + cmsMatch[1] + '(?![0-9])', 'i');
  const byCmsNumber = await Measures.findOneAsync({
    $or: [
      { _id: cmsRegex },
      { name: cmsRegex },
      { title: cmsRegex }
    ]
  }, { fields: { _id: 1 } });

  if (byCmsNumber) {
    log.debug('fqm-engine resolved measure by CMS number', { measureId, resolvedMeasureId: byCmsNumber._id });
    return get(byCmsNumber, '_id');
  }

  return null;
}

// Data-driven computability: can this measure actually be calculated right now?
// PACIO measures always can (in-code evaluators); everything else needs an
// imported measure bundle with compiled ELM. Reason strings mirror the
// not-computable throws in calculateWithFqm so every surface tells one story.
export async function getMeasureComputability(measureId) {
  if (isPacioMeasure(measureId)) {
    return { measureId: measureId, computable: true, engine: 'pacio-evaluator' };
  }

  const resolved = await resolveMeasureId(measureId);
  if (!resolved) {
    return {
      measureId: measureId,
      computable: false,
      reason: 'No executable measure bundle imported for ' + measureId + '. ' +
        'Import a FHIR measure bundle with compiled ELM (e.g., a MADiE export) via the Import button.'
    };
  }

  const bundle = await assembleMeasureBundle(resolved);
  if (!bundle || get(bundle, 'entry', []).length < 2) {
    return {
      measureId: measureId,
      computable: false,
      resolvedMeasureId: resolved,
      reason: 'Measure ' + measureId + ' has no executable logic (no Library resources). ' +
        'Import a FHIR measure bundle with ELM (e.g., a MADiE export) via the Import button.'
    };
  }

  if (!measureBundleHasElm(bundle)) {
    return {
      measureId: measureId,
      computable: false,
      resolvedMeasureId: resolved,
      reason: 'Measure ' + measureId + ' has CQL but no compiled ELM JSON. ' +
        'Export the measure bundle with ELM included (MADiE exports include it).'
    };
  }

  return {
    measureId: measureId,
    computable: true,
    engine: 'fqm-execution',
    resolvedMeasureId: resolved
  };
}

// Collections gathered into each patient bundle for calculation
const PATIENT_BUNDLE_COLLECTIONS = [
  'Encounters', 'Conditions', 'Observations', 'Procedures',
  'MedicationRequests', 'MedicationStatements', 'MedicationAdministrations',
  'DocumentReferences', 'Compositions', 'AllergyIntolerances',
  'Immunizations', 'ServiceRequests', 'DiagnosticReports', 'Coverages'
];

// Build a collection Bundle with the Patient + their clinical resources
export async function buildPatientBundle(patientId) {
  const Patients = get(global, 'Collections.Patients');
  if (!Patients) {
    throw new Meteor.Error('collection-not-found', 'Patients collection not available');
  }

  const patient = await Patients.findOneAsync({ _id: patientId });
  if (!patient) {
    throw new Meteor.Error('not-found', 'Patient not found: ' + patientId);
  }

  const refs = ['Patient/' + patientId, 'urn:uuid:' + patientId];
  const entries = [{ resource: toFhirResource(patient) }];

  for (const collectionName of PATIENT_BUNDLE_COLLECTIONS) {
    const collection = get(global, 'Collections.' + collectionName);
    if (!collection) {
      continue;
    }
    const docs = await collection.find({
      $or: [
        { 'subject.reference': { $in: refs } },
        { 'patient.reference': { $in: refs } }
      ]
    }).fetchAsync();
    docs.forEach(function(doc) {
      entries.push({ resource: toFhirResource(doc) });
    });
  }

  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: entries
  };
}

// Map a fqm-execution MeasureReport's populations to the internal flags shape
function mapMeasureReportToFlags(report) {
  const populations = get(report, 'group[0].population', []);
  function countOf(code) {
    const population = populations.find(function(pop) {
      return get(pop, 'code.coding[0].code') === code;
    });
    return get(population, 'count', 0);
  }
  return {
    inInitialPopulation: countOf('initial-population') > 0,
    inDenominator: countOf('denominator') > 0,
    inDenominatorExclusion: countOf('denominator-exclusion') > 0,
    inNumerator: countOf('numerator') > 0
  };
}

// Calculate a measure with fqm-execution.
// patientIds: array of _ids, or null for the whole population.
// reportType: 'individual' (one patient) or 'summary'.
// Returns the evaluator-compatible shape (individual) or aggregate counts
// (summary), so callers don't care which engine ran.
export async function calculateWithFqm(measure, patientIds, periodStart, periodEnd, reportType) {
  const measureId = get(measure, 'id', get(measure, '_id'));

  const fqm = getFqmCalculator();
  if (!fqm) {
    throw new Meteor.Error('not-computable',
      'Measure ' + measureId + ' requires CQL execution, but fqm-execution is not installed. ' +
      'Run `meteor npm install` (fqm-execution is declared in package.json).');
  }

  const measureBundle = await assembleMeasureBundle(measureId);
  if (!measureBundle || measureBundle.entry.length < 2) {
    throw new Meteor.Error('not-computable',
      'Measure ' + measureId + ' has no executable logic (no Library resources). ' +
      'Import a FHIR measure bundle with ELM (e.g., a MADiE export) via qualityMeasures.importMeasureBundle.');
  }

  if (!measureBundleHasElm(measureBundle)) {
    throw new Meteor.Error('not-computable',
      'Measure ' + measureId + ' has CQL but no compiled ELM JSON. ' +
      'Export the measure bundle with ELM included (MADiE exports include it).');
  }

  // Resolve the patient list
  let ids = patientIds;
  if (!Array.isArray(ids)) {
    const Patients = get(global, 'Collections.Patients');
    if (!Patients) {
      throw new Meteor.Error('collection-not-found', 'Patients collection not available');
    }
    const allPatients = await Patients.find({}, { fields: { _id: 1 } }).fetchAsync();
    ids = allPatients.map(function(patient) { return patient._id; });
  }

  const patientBundles = [];
  for (const id of ids) {
    patientBundles.push(await buildPatientBundle(id));
  }

  const options = {
    measurementPeriodStart: periodStart,
    measurementPeriodEnd: periodEnd,
    calculateHTML: false,
    calculateSDEs: false,
    reportType: reportType === 'individual' ? 'individual' : 'summary'
  };

  const vsacKey = await getVsacApiKey();
  if (vsacKey.apiKey) {
    options.vsAPIKey = vsacKey.apiKey;
  }

  log.debug('fqm-engine Calculating measure', { measureId, patientCount: patientBundles.length, reportType: options.reportType });

  let calcResult;
  try {
    calcResult = await fqm.Calculator.calculateMeasureReports(measureBundle, patientBundles, options);
  } catch (error) {
    console.error('[fqm-engine] Calculation failed:', error.message);
    throw new Meteor.Error('calculation-failed',
      'fqm-execution failed for measure ' + measureId + ': ' + error.message);
  }

  const results = get(calcResult, 'results');

  if (reportType === 'individual') {
    const report = Array.isArray(results) ? results[0] : results;
    const flags = mapMeasureReportToFlags(report);
    flags.details = { engine: 'fqm-execution', measureReport: report };
    return flags;
  }

  // Summary: aggregate from the engine's summary report
  const summaryReport = Array.isArray(results) ? results[0] : results;
  const populations = get(summaryReport, 'group[0].population', []);
  function countOf(code) {
    const population = populations.find(function(pop) {
      return get(pop, 'code.coding[0].code') === code;
    });
    return get(population, 'count', 0);
  }

  const denominator = countOf('denominator');
  const exclusions = countOf('denominator-exclusion');
  const numerator = countOf('numerator');
  const eligible = denominator - exclusions;

  return {
    initialPopulation: countOf('initial-population'),
    denominator: denominator,
    denominatorExclusion: exclusions,
    numerator: numerator,
    score: get(summaryReport, 'group[0].measureScore.value', eligible > 0 ? numerator / eligible : 0),
    patientResults: []
  };
}
