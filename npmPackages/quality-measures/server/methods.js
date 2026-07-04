// packages/quality-measures/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import { evaluatePacioMeasure } from './measure-calculator';
import { isPacioMeasure, getPacioMeasure } from '../lib/pacio-measures';
import { QualityMeasureFilterSets } from '../lib/collections';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

// Shared calculation body used by qualityMeasures.calculate and
// qualityMeasures.calculateWithFilters (no server-side Meteor.call).
// options.patientIds (optional) restricts the population loop (filtering).
export async function runCalculation(params, userId, options = {}) {
  // Fetch measure definition
  const measure = await getMeasureDefinition(params.measureId);
  if (!measure) {
    throw new Meteor.Error('not-found', 'Measure not found: ' + params.measureId);
  }

  const engine = isPacioMeasure(params.measureId) ? 'pacio-evaluator' : 'fqm-execution';

  // Create MeasureReport resource
  const measureReport = {
    resourceType: 'MeasureReport',
    id: Random.id(),
    meta: {
      versionId: '1',
      lastUpdated: new Date().toISOString()
    },
    status: 'complete',
    type: params.reportType,
    measure: `Measure/${params.measureId}`,
    date: new Date().toISOString(),
    reporter: {
      reference: `Organization/${Meteor.settings?.organizationId || 'org-1'}`
    },
    period: {
      start: params.periodStart,
      end: params.periodEnd
    },
    group: []
  };

  let evaluationResult = null;
  let patientResults = null;

  // Calculate based on report type
  if (params.reportType === 'individual' && params.patientId) {
    // Individual patient calculation
    const result = await calculateIndividualMeasure(measure, params.patientId, params.periodStart, params.periodEnd);
    evaluationResult = result;

    measureReport.subject = {
      reference: `Patient/${params.patientId}`
    };

    measureReport.group.push({
      population: [
        {
          code: { coding: [{ code: 'initial-population' }] },
          count: result.inInitialPopulation ? 1 : 0
        },
        {
          code: { coding: [{ code: 'denominator' }] },
          count: result.inDenominator ? 1 : 0
        },
        {
          code: { coding: [{ code: 'denominator-exclusion' }] },
          count: result.inDenominatorExclusion ? 1 : 0
        },
        {
          code: { coding: [{ code: 'numerator' }] },
          count: result.inNumerator ? 1 : 0
        }
      ]
    });
  } else {
    // Population summary calculation
    const result = await calculatePopulationMeasure(measure, params.periodStart, params.periodEnd, options.patientIds);
    patientResults = result.patientResults;

    measureReport.group.push({
      population: [
        {
          code: { coding: [{ code: 'initial-population' }] },
          count: result.initialPopulation
        },
        {
          code: { coding: [{ code: 'denominator' }] },
          count: result.denominator
        },
        {
          code: { coding: [{ code: 'denominator-exclusion' }] },
          count: result.denominatorExclusion
        },
        {
          code: { coding: [{ code: 'numerator' }] },
          count: result.numerator
        }
      ],
      measureScore: {
        value: result.score
      }
    });

    // Add stratifications if requested
    if (params.reportType === 'stratified') {
      measureReport.group[0].stratifier = calculateStratifications(result.patientResults);
    }
  }

  // Store MeasureReport
  let reportId;
  if (global.Collections?.MeasureReports) {
    const MeasureReports = await global.Collections.MeasureReports;
    if (MeasureReports && typeof MeasureReports.insertAsync === 'function') {
      reportId = await MeasureReports.insertAsync(measureReport);
    }
  } else {
    reportId = measureReport.id;
  }

  // Create audit event
  await logMeasureCalculation({
    userId: userId,
    measureId: params.measureId,
    reportId: reportId,
    reportType: params.reportType,
    period: `${params.periodStart} to ${params.periodEnd}`,
    timestamp: new Date()
  });

  const response = {
    success: true,
    reportId: reportId,
    measureReport: measureReport,
    engine: engine
  };
  if (evaluationResult) {
    response.evaluationResult = evaluationResult;
  }
  if (patientResults) {
    response.patientResults = patientResults;
  }
  return response;
}

Meteor.methods({
  /**
   * Calculate quality measure for a patient or population
   */
  'qualityMeasures.calculate': async function(params) {
    console.log('QualityMeasures.calculate', params.measureId, params.reportType);

    check(params, {
      measureId: String,
      periodStart: String,
      periodEnd: String,
      reportType: Match.OneOf('individual', 'summary', 'stratified'),
      patientId: Match.Optional(String)
    });

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to calculate measures');
    }

    return await runCalculation(params, this.userId);
  },

  /**
   * Export measure reports in various formats
   */
  'qualityMeasures.export': async function(params) {
    console.log('QualityMeasures.export', params.format);
    
    check(params, {
      measureIds: [String],
      format: Match.OneOf('fhir', 'qrda1', 'qrda3', 'csv', 'json'),
      periodStart: String,
      periodEnd: String
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    const reports = [];
    
    // Fetch MeasureReports
    const MeasureReports = get(global, 'Collections.MeasureReports');
    if (MeasureReports && typeof MeasureReports.find === 'function') {
      const measureReports = await MeasureReports.find({
        measure: { $in: params.measureIds.map(id => `Measure/${id}`) },
        'period.start': params.periodStart,
        'period.end': params.periodEnd
      }).fetchAsync();

      reports.push(...measureReports);
    }
    
    // Convert to requested format
    let exportData;
    switch(params.format) {
      case 'fhir':
        exportData = createFHIRBundle(reports);
        break;
      case 'qrda1':
        exportData = await convertToQRDA1(reports);
        break;
      case 'qrda3':
        exportData = await convertToQRDA3(reports);
        break;
      case 'csv':
        exportData = convertToCSV(reports);
        break;
      case 'json':
        exportData = JSON.stringify(reports, null, 2);
        break;
    }
    
    return {
      success: true,
      format: params.format,
      data: exportData,
      recordCount: reports.length
    };
  },

  /**
   * Import QRDA or FHIR data
   */
  'qualityMeasures.import': async function(importData) {
    console.log('QualityMeasures.import');
    
    check(importData, {
      format: Match.OneOf('fhir', 'qrda1', 'c-cda'),
      data: String
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    let importedData;
    switch(importData.format) {
      case 'fhir':
        importedData = await importFHIRBundle(importData.data);
        break;
      case 'qrda1':
        importedData = await importQRDA1(importData.data);
        break;
      case 'c-cda':
        importedData = await importCCDA(importData.data);
        break;
    }
    
    return {
      success: true,
      imported: importedData.count,
      message: `Imported ${importedData.count} records`
    };
  },

  /**
   * Get available measures
   */
  'qualityMeasures.getMeasures': async function() {
    console.log('QualityMeasures.getMeasures');
    
    const measures = [];

    const Measures = get(global, 'Collections.Measures');
    if (Measures && typeof Measures.find === 'function') {
      // Include draft measures — the seeded PACIO Connectathon measures are draft
      const allMeasures = await Measures.find({
        status: { $in: ['active', 'draft'] }
      }).fetchAsync();

      measures.push(...allMeasures);
    }

    // If no measures in database, return default CMS measures
    if (measures.length === 0) {
      return getDefaultCMSMeasures();
    }

    return measures;
  },

  /**
   * Record automated numerator
   */
  'qualityMeasures.recordNumerator': async function(params) {
    console.log('QualityMeasures.recordNumerator', params);
    
    check(params, {
      measureId: String,
      patientId: String,
      value: Boolean,
      reason: Match.Optional(String),
      encounter: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in');
    }
    
    // Create observation for numerator recording
    const observation = {
      resourceType: 'Observation',
      id: Random.id(),
      meta: {
        profile: ['http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/measure-observation']
      },
      status: 'final',
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-population',
          code: 'numerator',
          display: 'Numerator'
        }]
      },
      subject: {
        reference: `Patient/${params.patientId}`
      },
      encounter: params.encounter ? {
        reference: `Encounter/${params.encounter}`
      } : undefined,
      effectiveDateTime: new Date().toISOString(),
      valueBoolean: params.value,
      note: params.reason ? [{
        text: params.reason
      }] : undefined,
      performer: [{
        reference: `Practitioner/${this.userId}`
      }]
    };
    
    // Store observation
    if (global.Collections?.Observations) {
      const Observations = await global.Collections.Observations;
      if (Observations && typeof Observations.insertAsync === 'function') {
        await Observations.insertAsync(observation);
      }
    }
    
    // Trigger recalculation for affected measures
    await recalculateMeasure(params.measureId, params.patientId);
    
    return {
      success: true,
      observationId: observation.id,
      message: 'Numerator recorded successfully'
    };
  },

  /**
   * Save a filter set for reuse (ONC 170.315(c)(4) compliance)
   */
  'qualityMeasures.saveFilterSet': async function(filterSet) {
    console.log('QualityMeasures.saveFilterSet', filterSet.name);
    
    check(filterSet, {
      name: String,
      filters: Object,
      createdAt: Date
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to save filters');
    }

    const savedFilter = {
      ...filterSet,
      userId: this.userId,
      _id: Random.id()
    };

    await QualityMeasureFilterSets.insertAsync(savedFilter);
    console.log('[qualityMeasures.saveFilterSet] Saved filter set', savedFilter._id);
    return savedFilter;
  },

  /**
   * Get saved filter sets for current user
   */
  'qualityMeasures.getSavedFilters': async function() {
    console.log('QualityMeasures.getSavedFilters for user', this.userId);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to get saved filters');
    }

    return await QualityMeasureFilterSets.find(
      { userId: this.userId },
      { sort: { createdAt: -1 } }
    ).fetchAsync();
  },

  /**
   * Apply filters to measure calculation (ONC 170.315(c)(4))
   */
  'qualityMeasures.calculateWithFilters': async function(params) {
    console.log('QualityMeasures.calculateWithFilters', params.measureId);
    
    check(params, {
      measureId: String,
      periodStart: String,
      periodEnd: String,
      reportType: Match.OneOf('individual', 'summary', 'stratified'),
      filters: Object,
      patientId: Match.Optional(String)
    });
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to calculate measures');
    }
    
    // Build a real patient _id filter from the demographic criteria, then
    // recalculate the measure over the filtered population
    const patientIds = await selectPatientIdsForFilters(params.filters);

    const result = await runCalculation({
      measureId: params.measureId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      reportType: params.reportType,
      patientId: params.patientId
    }, this.userId, { patientIds: patientIds });

    // Annotate the report with the applied-filters extension
    const measureReport = result.measureReport;
    measureReport.extension = measureReport.extension || [];
    measureReport.extension.push({
      url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-appliedFilters',
      valueCodeableConcept: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-data-usage',
          code: 'supplemental-data',
          display: 'Population filters applied per ONC 170.315(c)(4)'
        }]
      }
    });

    return result;
  },

  /**
   * Get quality management system information (ONC 170.315(c)(4))
   */
  'qualityMeasures.getQualityManagementSystem': async function() {
    console.log('QualityMeasures.getQualityManagementSystem');
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'Must be logged in to access QMS');
    }
    
    // Check if user has appropriate role
    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!currentUser?.roles?.includes('admin') && !currentUser?.roles?.includes('clinician')) {
      throw new Meteor.Error('forbidden', 'Must be admin or clinician to access QMS');
    }
    
    return {
      qmsId: 'QMS-001',
      name: 'Honeycomb Quality Management System',
      version: '2024.1',
      certificationDate: '2024-01-01',
      standards: {
        snomed: {
          version: 'US Edition March 2022',
          required: true,
          compliantUntil: '2025-12-31'
        },
        accessibility: {
          standard: 'WCAG 2.1 AA',
          implemented: true
        }
      },
      monitoredMetrics: [
        'measure-calculation-time',
        'data-quality-score',
        'user-accessibility-compliance',
        'system-uptime'
      ]
    };
  }
});

// Select patient _ids matching demographic filters (ONC 170.315(c)(4)).
// Returns an array of _ids, or null when no filters restrict the population.
// Condition-based filters are not yet supported (logged and ignored).
async function selectPatientIdsForFilters(filters) {
  const patientQuery = {};

  // Age filters (birthDate range)
  if (filters.ageMin || filters.ageMax) {
    const currentDate = new Date();
    const maxBirthDate = filters.ageMin ?
      new Date(currentDate.getFullYear() - parseInt(filters.ageMin), currentDate.getMonth(), currentDate.getDate()) :
      null;
    const minBirthDate = filters.ageMax ?
      new Date(currentDate.getFullYear() - parseInt(filters.ageMax) - 1, currentDate.getMonth(), currentDate.getDate()) :
      null;

    patientQuery.birthDate = {};
    if (minBirthDate) {
      patientQuery.birthDate.$gte = minBirthDate.toISOString().split('T')[0];
    }
    if (maxBirthDate) {
      patientQuery.birthDate.$lte = maxBirthDate.toISOString().split('T')[0];
    }
  }

  // Sex filters: match administrative gender or birth-sex extension codes
  if (filters.sex && filters.sex.length > 0) {
    patientQuery.$or = [
      { gender: { $in: filters.sex.map(function(code) { return String(code).toLowerCase(); }) } },
      { 'extension.valueCodeableConcept.coding.code': { $in: filters.sex } },
      { 'extension.valueCode': { $in: filters.sex } }
    ];
  }

  if (filters.conditions && filters.conditions.length > 0) {
    log.warn('selectPatientIdsForFilters Condition-based filters not yet supported', { conditions: filters.conditions });
  }

  if (Object.keys(patientQuery).length === 0) {
    return null; // no demographic restriction
  }

  const Patients = get(global, 'Collections.Patients');
  if (!Patients) {
    console.warn('[selectPatientIdsForFilters] Patients collection not available'); // phi-audit: ok
    return null;
  }

  const matches = await Patients.find(patientQuery, { fields: { _id: 1 } }).fetchAsync();
  console.log('[selectPatientIdsForFilters] Filters matched', matches.length, 'patients'); // phi-audit: ok
  return matches.map(function(patient) { return patient._id; });
}

// Helper function to get measure definition.
// 1. Measures collection (seeded PACIO measures + imported measure bundles)
// 2. In-code PACIO definitions (fallback if seeding hasn't run)
// 3. null — caller throws not-found; counts are never fabricated.
async function getMeasureDefinition(measureId) {
  const Measures = get(global, 'Collections.Measures');
  if (Measures && typeof Measures.findOneAsync === 'function') {
    const stored = await Measures.findOneAsync({ _id: measureId });
    if (stored) {
      return stored;
    }
  }

  const pacioMeasure = getPacioMeasure(measureId);
  if (pacioMeasure) {
    return pacioMeasure;
  }

  console.warn('[getMeasureDefinition] Measure not found:', measureId);
  return null;
}

// Helper function to calculate individual measure
async function calculateIndividualMeasure(measure, patientId, periodStart, periodEnd) {
  // PACIO measures dispatch to the evaluators (the exploratory PACIO->FHIR
  // measure-logic mapping the Connectathon track is testing)
  if (isPacioMeasure(measure.id)) {
    console.log('[calculateIndividualMeasure] Dispatching to PACIO evaluator:', measure.id);
    return await evaluatePacioMeasure(measure.id, patientId, periodStart, periodEnd, measure);
  }

  // Non-PACIO measures require executable measure logic (CQL/ELM bundle).
  // Routed through fqm-execution when a measure bundle has been imported.
  const { calculateWithFqm } = require('./fqm-engine');
  return await calculateWithFqm(measure, [patientId], periodStart, periodEnd, 'individual');
}

// Helper function to calculate population measure.
// patientIdFilter (optional array of _ids) restricts the population (used by
// calculateWithFilters).
async function calculatePopulationMeasure(measure, periodStart, periodEnd, patientIdFilter) {
  if (!isPacioMeasure(measure.id)) {
    // Single engine invocation for the whole population
    const { calculateWithFqm } = require('./fqm-engine');
    return await calculateWithFqm(measure, patientIdFilter || null, periodStart, periodEnd, 'summary');
  }

  // Evaluator-backed measures: per-patient loop
  let patients = [];
  const Patients = get(global, 'Collections.Patients');
  if (Patients && typeof Patients.find === 'function') {
    const query = Array.isArray(patientIdFilter) ? { _id: { $in: patientIdFilter } } : {};
    patients = await Patients.find(query).fetchAsync();
  } else {
    console.warn('[calculatePopulationMeasure] Patients collection not available'); // phi-audit: ok
  }

  const results = {
    initialPopulation: 0,
    denominator: 0,
    denominatorExclusion: 0,
    numerator: 0,
    patientResults: []
  };

  for (const patient of patients) {
    // MongoDB _id is the source of truth (loaders set _id = id)
    const individualResult = await calculateIndividualMeasure(
      measure,
      patient._id,
      periodStart,
      periodEnd
    );

    if (individualResult.inInitialPopulation) results.initialPopulation++;
    if (individualResult.inDenominator) results.denominator++;
    if (individualResult.inDenominatorExclusion) results.denominatorExclusion++;
    if (individualResult.inNumerator) results.numerator++;

    results.patientResults.push({
      patientId: patient._id,
      birthDate: get(patient, 'birthDate'),
      inInitialPopulation: individualResult.inInitialPopulation,
      inDenominator: individualResult.inDenominator,
      inDenominatorExclusion: individualResult.inDenominatorExclusion,
      inNumerator: individualResult.inNumerator
    });
  }

  // Calculate performance rate
  const eligibleDenominator = results.denominator - results.denominatorExclusion;
  results.score = eligibleDenominator > 0 ?
    results.numerator / eligibleDenominator : 0;

  return results;
}

// Real age-band stratification computed from per-patient results
function calculateStratifications(patientResults) {
  const bands = [
    { label: '18-44', min: 18, max: 44 },
    { label: '45-64', min: 45, max: 64 },
    { label: '65+', min: 65, max: 200 }
  ];
  const now = new Date();

  function ageOf(birthDate) {
    if (!birthDate) return null;
    const dob = new Date(birthDate);
    let age = now.getFullYear() - dob.getFullYear();
    const monthDelta = now.getMonth() - dob.getMonth();
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  const strata = bands.map(function(band) {
    const inBand = (patientResults || []).filter(function(pr) {
      const age = ageOf(pr.birthDate);
      return age !== null && age >= band.min && age <= band.max;
    });
    const initialPopulation = inBand.filter(function(pr) { return pr.inInitialPopulation; }).length;
    const denominator = inBand.filter(function(pr) { return pr.inDenominator; }).length;
    const exclusions = inBand.filter(function(pr) { return pr.inDenominatorExclusion; }).length;
    const numerator = inBand.filter(function(pr) { return pr.inNumerator; }).length;
    const eligible = denominator - exclusions;

    return {
      value: { text: band.label },
      population: [
        { code: { coding: [{ code: 'initial-population' }] }, count: initialPopulation },
        { code: { coding: [{ code: 'denominator' }] }, count: denominator },
        { code: { coding: [{ code: 'denominator-exclusion' }] }, count: exclusions },
        { code: { coding: [{ code: 'numerator' }] }, count: numerator }
      ],
      measureScore: { value: eligible > 0 ? numerator / eligible : 0 }
    };
  });

  return [{
    code: { text: 'By Age Group' },
    stratum: strata
  }];
}

// Helper function to create FHIR Bundle
function createFHIRBundle(reports) {
  return {
    resourceType: 'Bundle',
    type: 'collection',
    entry: reports.map(report => ({
      resource: report
    }))
  };
}

// ---------------------------------------------------------------------------
// QRDA Category I export (ONC §170.315(c)(1) / §170.205(h)(2)).
// QRDA Cat I is a patient-level CDA document (same <ClinicalDocument> envelope
// as C-CDA, with QRDA templateIds + a Measure Section, Reporting Parameters
// Section, and Patient Data Section). One document per (individual) MeasureReport.
//
// Scope: real, standards-shaped QRDA I from real patient demographics +
// population results. Full per-measure QDM data-criteria coverage (Cypress-
// validated) is the remaining external certification work.
// ---------------------------------------------------------------------------

function qrdaCol(name) {
  return get(Meteor, 'Collections.' + name) || get(global, 'Collections.' + name);
}

function qrdaTime(value) {
  if (!value) { return new Date().toISOString().replace(/[:-]/g, '').split('.')[0]; }
  return String(value).replace(/[-:TZ]/g, '').split('.')[0];
}

function xmlEscape(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function populationCount(report, code) {
  const group = (report.group || [])[0] || { population: [] };
  const pop = (group.population || []).find(function(p) {
    return get(p, 'code.coding[0].code') === code;
  });
  return pop ? (pop.count || 0) : 0;
}

// Build the Measure Section + population observations for one QRDA I doc.
function qrdaMeasureSection(report) {
  const measureId = String(report.measure || '').replace('Measure/', '');
  const pops = ['initial-population', 'denominator', 'denominator-exclusion', 'numerator'];
  const entries = pops.map(function(code) {
    return `
        <entry>
          <observation classCode="OBS" moodCode="EVN">
            <templateId root="2.16.840.1.113883.10.20.24.3.98"/>
            <code code="ASSERTION" codeSystem="2.16.840.1.113883.5.4"/>
            <value xsi:type="CD" code="${xmlEscape(code)}" codeSystem="2.16.840.1.113883.5.4"/>
            <reference typeCode="REFR">
              <externalObservation classCode="OBS" moodCode="EVN">
                <id root="${xmlEscape(measureId)}"/>
              </externalObservation>
            </reference>
          </observation>
        </entry>`;
  }).join('');
  return `
  <!-- Measure Section -->
  <component>
    <section>
      <templateId root="2.16.840.1.113883.10.20.24.2.2"/>
      <code code="55186-1" codeSystem="2.16.840.1.113883.6.1" displayName="Measure Section"/>
      <title>Measure Section</title>
      <text>Measure: ${xmlEscape(measureId)}</text>
      <entry>
        <organizer classCode="CLUSTER" moodCode="EVN">
          <templateId root="2.16.840.1.113883.10.20.24.3.98"/>
          <id root="${xmlEscape(measureId)}"/>
          <statusCode code="completed"/>
          <reference typeCode="REFR">
            <externalDocument classCode="DOC" moodCode="EVN">
              <id root="${xmlEscape(measureId)}"/>
            </externalDocument>
          </reference>
        </organizer>
      </entry>${entries}
    </section>
  </component>`;
}

async function buildQrdaCategoryIDocument(report) {
  const patientFhirId = String(get(report, 'subject.reference', '')).replace('Patient/', '');
  const Patients = qrdaCol('Patients');
  let patient = null;
  if (Patients && patientFhirId) {
    patient = (await Patients.findOneAsync({ _id: patientFhirId })) ||
      (await Patients.findOneAsync({ id: patientFhirId })) || null;
  }
  const genderMap = { male: 'M', female: 'F', other: 'UN', unknown: 'UNK' };
  const given = get(patient, 'name[0].given[0]', '');
  const family = get(patient, 'name[0].family', get(patient, 'name[0].text', ''));
  const gender = genderMap[get(patient, 'gender', '')] || 'UNK';
  const birthTime = qrdaTime(get(patient, 'birthDate', '')).substring(0, 8);
  const now = qrdaTime();
  const periodStart = qrdaTime(get(report, 'period.start', ''));
  const periodEnd = qrdaTime(get(report, 'period.end', ''));

  return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <!-- QRDA Category I R1 (§170.205(h)(2)) -->
  <realmCode code="US"/>
  <typeId root="2.16.840.1.113883.1.3" extension="POCD_HD000040"/>
  <templateId root="2.16.840.1.113883.10.20.24.1.1"/>
  <templateId root="2.16.840.1.113883.10.20.24.1.2" extension="2017-08-01"/>
  <id root="${Random.id()}"/>
  <code code="55182-0" codeSystem="2.16.840.1.113883.6.1" displayName="Quality measure report"/>
  <title>QRDA Category I Report</title>
  <effectiveTime value="${now}"/>
  <confidentialityCode code="N" codeSystem="2.16.840.1.113883.5.25"/>
  <languageCode code="en-US"/>

  <recordTarget>
    <patientRole>
      <id root="2.16.840.1.113883.3.1" extension="${xmlEscape(patientFhirId)}"/>
      <patient>
        <name>
          <given>${xmlEscape(given)}</given>
          <family>${xmlEscape(family)}</family>
        </name>
        <administrativeGenderCode code="${gender}" codeSystem="2.16.840.1.113883.5.1"/>
        <birthTime value="${birthTime}"/>
      </patient>
    </patientRole>
  </recordTarget>

  <author>
    <time value="${now}"/>
    <assignedAuthor>
      <id root="2.16.840.1.113883.3.1"/>
      <assignedAuthoringDevice>
        <softwareName>Care Commons EHR - Quality Measures</softwareName>
      </assignedAuthoringDevice>
    </assignedAuthor>
  </author>

  <custodian>
    <assignedCustodian>
      <representedCustodianOrganization>
        <id root="2.16.840.1.113883.3.1"/>
        <name>Honeycomb Health System</name>
      </representedCustodianOrganization>
    </assignedCustodian>
  </custodian>

  <component>
    <structuredBody>
      <!-- Reporting Parameters Section -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.17.2.1"/>
          <code code="55187-9" codeSystem="2.16.840.1.113883.6.1" displayName="Reporting Parameters"/>
          <title>Reporting Parameters</title>
          <text>Reporting period: ${xmlEscape(get(report, 'period.start', ''))} - ${xmlEscape(get(report, 'period.end', ''))}</text>
          <entry typeCode="DRIV">
            <act classCode="ACT" moodCode="EVN">
              <templateId root="2.16.840.1.113883.10.20.17.3.8"/>
              <id root="${Random.id()}"/>
              <code code="252116004" codeSystem="2.16.840.1.113883.6.96" displayName="Observation Parameters"/>
              <effectiveTime>
                <low value="${periodStart}"/>
                <high value="${periodEnd}"/>
              </effectiveTime>
            </act>
          </entry>
        </section>
      </component>
${qrdaMeasureSection(report)}
      <!-- Patient Data Section (QDM) -->
      <component>
        <section>
          <templateId root="2.16.840.1.113883.10.20.24.2.1"/>
          <code code="55188-7" codeSystem="2.16.840.1.113883.6.1" displayName="Patient Data"/>
          <title>Patient Data</title>
          <text>
            <table>
              <thead><tr><th>Population</th><th>In Population</th></tr></thead>
              <tbody>
                <tr><td>Initial Population</td><td>${populationCount(report, 'initial-population')}</td></tr>
                <tr><td>Denominator</td><td>${populationCount(report, 'denominator')}</td></tr>
                <tr><td>Denominator Exclusion</td><td>${populationCount(report, 'denominator-exclusion')}</td></tr>
                <tr><td>Numerator</td><td>${populationCount(report, 'numerator')}</td></tr>
              </tbody>
            </table>
          </text>
        </section>
      </component>
    </structuredBody>
  </component>
</ClinicalDocument>`;
}

// QRDA Category I — one patient-level document per individual MeasureReport.
async function convertToQRDA1(reports) {
  const list = Array.isArray(reports) ? reports : [];
  if (list.length === 0) {
    // Still emit a well-formed (empty) QRDA I so the export is a valid document.
    return await buildQrdaCategoryIDocument({ measure: '', period: {}, subject: {}, group: [] });
  }
  const docs = [];
  for (let i = 0; i < list.length; i++) {
    docs.push(await buildQrdaCategoryIDocument(list[i]));
  }
  // One document per patient/report; concatenate when several (batch submission).
  return docs.length === 1 ? docs[0] : docs.join('\n');
}

// QRDA Category III (aggregate, for §170.315(c)(3)) remains a follow-on.
async function convertToQRDA3(reports) {
  throw new Meteor.Error('not-implemented',
    'QRDA Category III export is not implemented (follow-on). QRDA Category I (format "qrda1") is available.');
}

// Helper function to convert to CSV
function convertToCSV(reports) {
  const headers = ['Measure', 'Period', 'Initial Population', 'Denominator', 'Numerator', 'Score'];
  const rows = reports.map(report => {
    const group = report.group[0];
    return [
      report.measure,
      `${report.period.start} - ${report.period.end}`,
      group.population.find(p => p.code.coding[0].code === 'initial-population')?.count || 0,
      group.population.find(p => p.code.coding[0].code === 'denominator')?.count || 0,
      group.population.find(p => p.code.coding[0].code === 'numerator')?.count || 0,
      group.measureScore?.value || 0
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

// Import a FHIR Bundle: upsert EVERY resource type into its collection
// (pluralized resourceType -> global.Collections), so imported connectathon
// bundles hydrate the Patients/Encounters/Compositions/DocumentReferences
// that the measure evaluators query.
const PLURAL_OVERRIDES = {
  Library: 'Libraries',
  Binary: 'Binaries'
};

async function importFHIRBundle(bundleData) {
  const bundle = JSON.parse(bundleData);
  let imported = 0;
  const skippedTypes = {};
  const errors = [];

  for (const entry of get(bundle, 'entry', [])) {
    const resource = get(entry, 'resource');
    if (!resource || !resource.resourceType) {
      continue;
    }

    const collectionName = PLURAL_OVERRIDES[resource.resourceType] || (resource.resourceType + 's');
    const collection = get(global, 'Collections.' + collectionName);

    if (!collection || typeof collection.updateAsync !== 'function') {
      skippedTypes[resource.resourceType] = (skippedTypes[resource.resourceType] || 0) + 1;
      continue;
    }

    const doc = Object.assign({}, resource);
    doc._id = resource.id || Random.id();

    try {
      await collection.updateAsync(
        { _id: doc._id },
        { $set: doc },
        { upsert: true }
      );
      imported++;
    } catch (error) {
      errors.push(resource.resourceType + '/' + doc._id + ': ' + error.message);
    }
  }

  if (Object.keys(skippedTypes).length > 0) {
    console.warn('[importFHIRBundle] Skipped resource types with no registered collection:', JSON.stringify(skippedTypes));
  }
  if (errors.length > 0) {
    console.error('[importFHIRBundle]', errors.length, 'errors:', errors.slice(0, 5));
  }

  return { count: imported, skippedTypes: skippedTypes, errors: errors };
}

// QRDA/C-CDA import are not implemented — honest errors beat fake counts.
async function importQRDA1(xmlData) {
  throw new Meteor.Error('not-implemented',
    'QRDA Category I import is not implemented. The PACIO track is FHIR-native; use format "fhir".');
}

async function importCCDA(xmlData) {
  throw new Meteor.Error('not-implemented',
    'C-CDA import is not implemented. The PACIO track is FHIR-native; use format "fhir".');
}

// Helper function to get default CMS measures
function getDefaultCMSMeasures() {
  return [
    {
      id: 'CMS2v13',
      name: 'Preventive Care and Screening: Screening for Depression',
      version: '13.0.0',
      status: 'active'
    },
    {
      id: 'CMS122v12',
      name: 'Diabetes: Hemoglobin A1c Poor Control',
      version: '12.0.0',
      status: 'active'
    },
    {
      id: 'CMS146v11',
      name: 'Appropriate Testing for Pharyngitis',
      version: '11.0.0',
      status: 'active'
    },
    {
      id: 'CMS165v12',
      name: 'Controlling High Blood Pressure',
      version: '12.0.0',
      status: 'active'
    }
    // PACIO Connectathon measures are seeded into the Measures collection at
    // startup (server/startup.js) and surfaced via the collection query above.
  ];
}

// Helper function to recalculate measure
async function recalculateMeasure(measureId, patientId) {
  // Trigger measure recalculation
  log.debug('Recalculating measure for patient', { measureId, patientId });
  // Implementation would recalculate and update stored results
}

// Helper function to log measure calculation
async function logMeasureCalculation(data) {
  const auditEvent = {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'Quality Measure Calculation'
    },
    subtype: [{
      system: 'http://hl7.org/fhir/restful-interaction',
      code: 'create',
      display: 'Measure Calculation'
    }],
    action: 'C',
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
        reference: `Measure/${data.measureId}`
      },
      type: {
        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
        code: '2',
        display: 'System Object'
      },
      detail: [{
        type: 'period',
        valueString: data.period
      }, {
        type: 'reportType',
        valueString: data.reportType
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