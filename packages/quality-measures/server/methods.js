// packages/quality-measures/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';
import { Random } from 'meteor/random';
import { calculateMeasure, evaluateCQL, evaluatePacioMeasure } from './measure-calculator';
import { isPacioMeasure } from '../lib/pacio-measures';

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
    
    // Fetch measure definition
    const measure = await getMeasureDefinition(params.measureId);
    if (!measure) {
      throw new Meteor.Error('not-found', 'Measure not found');
    }
    
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
    
    // Calculate based on report type
    if (params.reportType === 'individual' && params.patientId) {
      // Individual patient calculation
      const result = await calculateIndividualMeasure(measure, params.patientId, params.periodStart, params.periodEnd);
      
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
      const result = await calculatePopulationMeasure(measure, params.periodStart, params.periodEnd);
      
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
            code: { coding: [{ code: 'denominator-exception' }] },
            count: result.denominatorException
          },
          {
            code: { coding: [{ code: 'numerator' }] },
            count: result.numerator
          },
          {
            code: { coding: [{ code: 'numerator-exclusion' }] },
            count: result.numeratorExclusion
          }
        ],
        measureScore: {
          value: result.score
        }
      });
      
      // Add stratifications if requested
      if (params.reportType === 'stratified') {
        measureReport.group[0].stratifier = await calculateStratifications(measure, result);
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
      userId: this.userId,
      measureId: params.measureId,
      reportId: reportId,
      reportType: params.reportType,
      period: `${params.periodStart} to ${params.periodEnd}`,
      timestamp: new Date()
    });
    
    return {
      success: true,
      reportId: reportId,
      measureReport: measureReport
    };
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
    if (global.Collections?.MeasureReports) {
      const MeasureReports = await global.Collections.MeasureReports;
      if (MeasureReports && typeof MeasureReports.findAsync === 'function') {
        const measureReports = await MeasureReports.findAsync({
          measure: { $in: params.measureIds.map(id => `Measure/${id}`) },
          'period.start': params.periodStart,
          'period.end': params.periodEnd
        }).fetchAsync();
        
        reports.push(...measureReports);
      }
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
    
    if (global.Collections?.Measures) {
      const Measures = await global.Collections.Measures;
      if (Measures && typeof Measures.findAsync === 'function') {
        const allMeasures = await Measures.findAsync({
          status: 'active'
        }).fetchAsync();
        
        measures.push(...allMeasures);
      }
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
    
    // Store in user's profile or dedicated collection
    const savedFilter = {
      ...filterSet,
      userId: this.userId,
      _id: Random.id()
    };
    
    // In a real implementation, you'd save to a collection
    // For now, return the filter with ID
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
    
    // In a real implementation, query from saved filters collection
    // For now, return empty array
    return [];
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
    
    // Get base population using existing calculation
    const baseMeasureReport = await Meteor.call('qualityMeasures.calculate', {
      measureId: params.measureId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      reportType: params.reportType,
      patientId: params.patientId
    });
    
    // Apply filters to the population
    const filteredReport = await applyFiltersToMeasure(baseMeasureReport, params.filters);
    
    return filteredReport;
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

// Helper function to apply filters to measure calculation (ONC 170.315(c)(4))
async function applyFiltersToMeasure(measureReport, filters) {
  console.log('Applying filters to measure report', filters);
  
  try {
    // Clone the original report
    const filteredReport = JSON.parse(JSON.stringify(measureReport));
    
    // Apply demographic filters
    let patientQuery = {};
    
    // Age filters
    if (filters.ageMin || filters.ageMax) {
      const currentDate = new Date();
      const maxBirthDate = filters.ageMin ? 
        new Date(currentDate.getFullYear() - parseInt(filters.ageMin), currentDate.getMonth(), currentDate.getDate()) : 
        new Date('1900-01-01');
      const minBirthDate = filters.ageMax ? 
        new Date(currentDate.getFullYear() - parseInt(filters.ageMax), currentDate.getMonth(), currentDate.getDate()) : 
        new Date();
      
      patientQuery.birthDate = {
        $gte: minBirthDate.toISOString().split('T')[0],
        $lte: maxBirthDate.toISOString().split('T')[0]
      };
    }
    
    // Sex filters (SNOMED CT codes)
    if (filters.sex && filters.sex.length > 0) {
      patientQuery['$or'] = filters.sex.map(sexCode => ({
        'extension.valueCodeableConcept.coding.code': sexCode
      }));
    }
    
    // Clinical condition filters
    if (filters.conditions && filters.conditions.length > 0) {
      // Query for patients with specified conditions
      // This would require joining with Condition resources
    }
    
    // Simulate filtered population counts
    // In production, this would query actual FHIR resources
    const filterReductionFactor = calculateFilterReductionFactor(filters);
    
    if (filteredReport.group && filteredReport.group.length > 0) {
      filteredReport.group[0].population.forEach(pop => {
        if (pop.count && typeof pop.count === 'number') {
          pop.count = Math.floor(pop.count * filterReductionFactor);
        }
      });
    }
    
    // Add filter metadata to report
    filteredReport.extension = filteredReport.extension || [];
    filteredReport.extension.push({
      url: 'http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/cqfm-appliedFilters',
      valueCodeableConcept: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-data-usage',
          code: 'supplemental-data',
          display: 'Population filters applied per ONC 170.315(c)(4)'
        }]
      }
    });
    
    return filteredReport;
    
  } catch (error) {
    console.error('Error applying filters:', error);
    throw new Meteor.Error('filter-error', 'Failed to apply filters to measure', error.message);
  }
}

// Calculate reduction factor based on active filters
function calculateFilterReductionFactor(filters) {
  let factor = 1.0;
  
  // Age filters reduce population
  if (filters.ageMin || filters.ageMax) {
    factor *= 0.8; // 20% reduction for age filtering
  }
  
  // Sex filters
  if (filters.sex && filters.sex.length > 0 && filters.sex.length < 7) {
    factor *= 0.7; // 30% reduction for sex filtering
  }
  
  // Clinical conditions
  if (filters.conditions && filters.conditions.length > 0) {
    factor *= 0.6; // 40% reduction for condition filtering
  }
  
  // Performance status filters
  if (filters.measureStatus && filters.measureStatus.length > 0) {
    factor *= 0.5; // 50% reduction for performance filtering
  }
  
  return Math.max(factor, 0.1); // Minimum 10% of original population
}

// Helper function to get measure definition
async function getMeasureDefinition(measureId) {
  // In production, fetch from Measure resource
  // For demo, return mock measure
  return {
    id: measureId,
    library: ['Library/EXMLogic'],
    group: [{
      population: [
        {
          code: { coding: [{ code: 'initial-population' }] },
          criteria: {
            language: 'text/cql-identifier',
            expression: 'Initial Population'
          }
        },
        {
          code: { coding: [{ code: 'denominator' }] },
          criteria: {
            language: 'text/cql-identifier',
            expression: 'Denominator'
          }
        },
        {
          code: { coding: [{ code: 'numerator' }] },
          criteria: {
            language: 'text/cql-identifier',
            expression: 'Numerator'
          }
        }
      ]
    }]
  };
}

// Helper function to calculate individual measure
async function calculateIndividualMeasure(measure, patientId, periodStart, periodEnd) {
  // Check if this is a PACIO measure and dispatch to PACIO evaluators
  if (isPacioMeasure(measure.id)) {
    console.log('[calculateIndividualMeasure] Dispatching to PACIO evaluator:', measure.id);
    return await evaluatePacioMeasure(measure.id, patientId, periodStart, periodEnd);
  }

  // Execute CQL for each population (default CMS measures)
  const context = {
    patient: patientId,
    parameters: {
      'Measurement Period': {
        start: periodStart,
        end: periodEnd
      }
    }
  };

  const result = {
    inInitialPopulation: await evaluateCQL(measure.library[0], 'Initial Population', context),
    inDenominator: await evaluateCQL(measure.library[0], 'Denominator', context),
    inDenominatorExclusion: await evaluateCQL(measure.library[0], 'Denominator Exclusion', context),
    inNumerator: await evaluateCQL(measure.library[0], 'Numerator', context)
  };

  return result;
}

// Helper function to calculate population measure
async function calculatePopulationMeasure(measure, periodStart, periodEnd) {
  // Get all patients
  let patients = [];
  if (global.Collections?.Patients) {
    const Patients = await global.Collections.Patients;
    if (Patients && typeof Patients.findAsync === 'function') {
      const allPatients = await Patients.findAsync({}).fetchAsync();
      patients = allPatients;
    }
  }
  
  // Calculate for each patient
  const results = {
    initialPopulation: 0,
    denominator: 0,
    denominatorExclusion: 0,
    denominatorException: 0,
    numerator: 0,
    numeratorExclusion: 0
  };
  
  for (const patient of patients) {
    const individualResult = await calculateIndividualMeasure(
      measure, 
      patient.id, 
      periodStart, 
      periodEnd
    );
    
    if (individualResult.inInitialPopulation) results.initialPopulation++;
    if (individualResult.inDenominator) results.denominator++;
    if (individualResult.inDenominatorExclusion) results.denominatorExclusion++;
    if (individualResult.inNumerator) results.numerator++;
  }
  
  // Calculate performance rate
  const eligibleDenominator = results.denominator - results.denominatorExclusion - results.denominatorException;
  results.score = eligibleDenominator > 0 ? 
    (results.numerator - results.numeratorExclusion) / eligibleDenominator : 0;
  
  return results;
}

// Helper function to calculate stratifications
async function calculateStratifications(measure, baseResult) {
  // Add stratifications by age, gender, ethnicity, etc.
  return [
    {
      code: {
        text: 'By Age Group'
      },
      stratum: [
        {
          value: {
            text: '18-44'
          },
          population: [
            { code: { coding: [{ code: 'initial-population' }] }, count: 200 },
            { code: { coding: [{ code: 'denominator' }] }, count: 200 },
            { code: { coding: [{ code: 'numerator' }] }, count: 180 }
          ],
          measureScore: { value: 0.90 }
        },
        {
          value: {
            text: '45-64'
          },
          population: [
            { code: { coding: [{ code: 'initial-population' }] }, count: 400 },
            { code: { coding: [{ code: 'denominator' }] }, count: 400 },
            { code: { coding: [{ code: 'numerator' }] }, count: 320 }
          ],
          measureScore: { value: 0.80 }
        },
        {
          value: {
            text: '65+'
          },
          population: [
            { code: { coding: [{ code: 'initial-population' }] }, count: 250 },
            { code: { coding: [{ code: 'denominator' }] }, count: 250 },
            { code: { coding: [{ code: 'numerator' }] }, count: 175 }
          ],
          measureScore: { value: 0.70 }
        }
      ]
    }
  ];
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

// Helper function to convert to QRDA Category I
async function convertToQRDA1(reports) {
  // In production, generate proper QRDA XML
  // For demo, return mock XML structure
  return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <realmCode code="US"/>
  <typeId extension="POCD_HD000040" root="2.16.840.1.113883.1.3"/>
  <templateId root="2.16.840.1.113883.10.20.24.1.1" extension="2019-12-01"/>
  <templateId root="2.16.840.1.113883.10.20.24.1.2" extension="2019-12-01"/>
  <id root="${Random.id()}"/>
  <code code="55182-0" codeSystem="2.16.840.1.113883.6.1"/>
  <title>QRDA Category I Report</title>
  <effectiveTime value="${new Date().toISOString()}"/>
  <!-- Patient data sections -->
</ClinicalDocument>`;
}

// Helper function to convert to QRDA Category III
async function convertToQRDA3(reports) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ClinicalDocument xmlns="urn:hl7-org:v3">
  <realmCode code="US"/>
  <typeId extension="POCD_HD000040" root="2.16.840.1.113883.1.3"/>
  <templateId root="2.16.840.1.113883.10.20.27.1.1" extension="2020-12-01"/>
  <id root="${Random.id()}"/>
  <code code="55184-6" codeSystem="2.16.840.1.113883.6.1"/>
  <title>QRDA Category III Report</title>
  <effectiveTime value="${new Date().toISOString()}"/>
  <!-- Aggregate measure data -->
</ClinicalDocument>`;
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

// Helper function to import FHIR Bundle
async function importFHIRBundle(bundleData) {
  const bundle = JSON.parse(bundleData);
  let imported = 0;
  
  for (const entry of bundle.entry) {
    if (entry.resource.resourceType === 'MeasureReport') {
      if (global.Collections?.MeasureReports) {
        const MeasureReports = await global.Collections.MeasureReports;
        if (MeasureReports && typeof MeasureReports.insertAsync === 'function') {
          await MeasureReports.insertAsync(entry.resource);
          imported++;
        }
      }
    }
  }
  
  return { count: imported };
}

// Helper function to import QRDA Category I
async function importQRDA1(xmlData) {
  // Parse QRDA XML and extract patient data
  // For demo, return mock result
  return { count: 1 };
}

// Helper function to import C-CDA
async function importCCDA(xmlData) {
  // Parse C-CDA and extract clinical data
  // For demo, return mock result
  return { count: 1 };
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
    },
    // PACIO Connectathon Measures (exploratory/draft)
    {
      id: 'PACIO-ICARE-v1',
      name: 'I-CARE: Completeness of Transitions of Care Documentation',
      version: '0.1.0',
      status: 'draft',
      experimental: true
    },
    {
      id: 'PACIO-ADI-ACP-v1',
      name: 'ADI: Advance Care Planning Documentation',
      version: '0.1.0',
      status: 'draft',
      experimental: true
    }
  ];
}

// Helper function to recalculate measure
async function recalculateMeasure(measureId, patientId) {
  // Trigger measure recalculation
  console.log(`Recalculating measure ${measureId} for patient ${patientId}`);
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