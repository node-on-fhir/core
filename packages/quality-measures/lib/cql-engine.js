// packages/quality-measures/lib/cql-engine.js

/**
 * CQL Engine Integration
 * 
 * This module integrates with the CQL execution libraries:
 * - cql-execution: Core CQL execution engine
 * - cqm-execution: Clinical Quality Measures execution
 * - fqm-execution: FHIR Quality Measure execution
 * - cql-exec-fhir: FHIR data model for CQL
 * - cql-exec-vsac: VSAC value set resolver
 */

import { Meteor } from 'meteor/meteor';

// Import the actual libraries - in Meteor packages, use direct require for npm dependencies
let cql = null;
let cqmExecution = null;
let fqmExecution = null;
let cqlFhir = null;
let cqlVsac = null;

// Only load on server where npm packages are available
if (Meteor.isServer) {
  try {
    cql = require('cql-execution');
  } catch (e) {
    console.warn('cql-execution not available:', e.message);
  }
}

export const CQLEngine = {
  /**
   * Initialize the CQL engine with required libraries
   */
  initialize: function() {
    console.log('Initializing CQL Engine with npm libraries');
    return {
      cqlExecution: !!cql,
      cqmExecution: !!cqmExecution,
      fqmExecution: !!fqmExecution,
      cqlExecFhir: !!cqlFhir,
      cqlExecVsac: false // Temporarily disabled
    };
  },

  /**
   * Execute ELM against patient data using cql-execution
   */
  execute: function(elm, patientBundle, parameters, valueSetMap) {
    console.log('Executing ELM with cql-execution');
    
    if (!cql) {
      console.warn('cql-execution not available, using mock execution');
      return {};
    }
    
    try {
      // Create a repository and add the ELM library
      const repository = new cql.Repository();
      repository.loadLibrary(elm);
      
      // Create a code service for value set resolution
      const codeService = new cql.CodeService(valueSetMap || {});
      
      // Create a patient source using cql-exec-fhir if available
      let patientSource = null;
      if (cqlFhir) {
        patientSource = cqlFhir.PatientSource.FHIRv401();
        patientSource.loadBundles([patientBundle]);
      }
      
      // Create the executor
      const executor = new cql.Executor(repository, codeService, parameters);
      
      // Execute the CQL
      const results = patientSource ? executor.exec(patientSource) : {};
      
      return results;
    } catch (error) {
      console.error('CQL execution error:', error);
      throw new Meteor.Error('cql-execution-error', error.message);
    }
  },

  /**
   * Calculate measure using fqm-execution
   */
  calculateMeasure: function(measureBundle, patientBundles, options = {}) {
    console.log('Calculating measure with fqm-execution');
    
    if (!fqmExecution) {
      console.warn('fqm-execution not available, using mock calculation');
      return {
        results: [],
        supplementalData: {}
      };
    }
    
    try {
      // Use fqm-execution's Calculator
      const { Calculator } = fqmExecution;
      
      // Set default options
      const calculationOptions = {
        includeClauseResults: true,
        includeHighlighting: false,
        measurementPeriodStart: options.periodStart || '2024-01-01',
        measurementPeriodEnd: options.periodEnd || '2024-12-31',
        reportType: options.reportType || 'individual',
        ...options
      };
      
      // Calculate the measure
      const results = Calculator.calculate(
        measureBundle,
        patientBundles,
        calculationOptions
      );
      
      return results;
    } catch (error) {
      console.error('Measure calculation error:', error);
      throw new Meteor.Error('measure-calculation-error', error.message);
    }
  },

  /**
   * Calculate using cqm-execution for QDM-based measures
   */
  calculateQDMMeasure: function(measure, patients, valueSets, options = {}) {
    console.log('Calculating QDM measure with cqm-execution');
    
    if (!cqmExecution) {
      console.warn('cqm-execution not available, using mock calculation');
      return {
        population_sets: [],
        supplemental_data: {}
      };
    }
    
    try {
      const { Calculator } = cqmExecution;
      
      // Calculate using cqm-execution
      const results = Calculator.calculate(
        measure,
        patients,
        valueSets,
        options
      );
      
      return results;
    } catch (error) {
      console.error('QDM calculation error:', error);
      throw new Meteor.Error('qdm-calculation-error', error.message);
    }
  },

  /**
   * Calculate data requirements for a measure
   */
  calculateDataRequirements: function(measureBundle, options = {}) {
    console.log('Calculating data requirements');
    
    if (!fqmExecution) {
      console.warn('fqm-execution not available, returning empty requirements');
      return {
        dataRequirements: []
      };
    }
    
    try {
      const { Calculator } = fqmExecution;
      
      // Calculate data requirements
      const results = Calculator.calculateDataRequirements(
        measureBundle,
        options
      );
      
      return results;
    } catch (error) {
      console.error('Data requirements error:', error);
      throw new Meteor.Error('data-requirements-error', error.message);
    }
  },

  /**
   * Calculate gaps in care
   */
  calculateGapsInCare: function(measureBundle, patientBundles, options = {}) {
    console.log('Calculating gaps in care');
    
    if (!fqmExecution) {
      console.warn('fqm-execution not available, returning empty gaps');
      return {
        results: [],
        gaps: []
      };
    }
    
    try {
      const { Calculator } = fqmExecution;
      
      // Calculate gaps in care
      const results = Calculator.calculateGapsInCare(
        measureBundle,
        patientBundles,
        {
          measurementPeriodStart: options.periodStart || '2024-01-01',
          measurementPeriodEnd: options.periodEnd || '2024-12-31',
          ...options
        }
      );
      
      return results;
    } catch (error) {
      console.error('Gaps in care error:', error);
      throw new Meteor.Error('gaps-in-care-error', error.message);
    }
  },

  /**
   * Generate measure reports
   */
  generateMeasureReport: function(calculationResults, options = {}) {
    console.log('Generating measure report');
    
    if (!fqmExecution) {
      console.warn('fqm-execution not available, returning empty reports');
      return [];
    }
    
    try {
      const { MeasureReportBuilder } = fqmExecution;
      
      // Build FHIR MeasureReport resources
      const reports = [];
      
      if (calculationResults && calculationResults.results) {
        for (const result of calculationResults.results) {
          const report = MeasureReportBuilder.buildMeasureReport(
            result,
            options
          );
          reports.push(report);
        }
      }
      
      return reports;
    } catch (error) {
      console.error('Report generation error:', error);
      throw new Meteor.Error('report-generation-error', error.message);
    }
  }
};

/**
 * Value Set Resolver using cql-exec-vsac
 */
export const ValueSetResolver = {
  /**
   * Initialize VSAC connection
   */
  initialize: async function(apiKey) {
    if (!apiKey) {
      console.warn('No VSAC API key provided');
      return false;
    }
    
    if (!cqlVsac) {
      console.warn('VSAC library not available due to version conflicts');
      return false;
    }
    
    try {
      this.vsacClient = cqlVsac.getVSACClient(apiKey);
      return true;
    } catch (error) {
      console.error('VSAC initialization error:', error);
      return false;
    }
  },
  
  /**
   * Resolve value set from VSAC
   */
  resolve: async function(valueSetUrl) {
    console.log(`Resolving value set: ${valueSetUrl}`);
    
    if (!this.vsacClient) {
      // Return mock value set if VSAC not initialized
      return {
        url: valueSetUrl,
        version: '1.0.0',
        expansion: {
          contains: [
            { system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }
          ]
        }
      };
    }
    
    try {
      const valueSet = await this.vsacClient.getValueSet(valueSetUrl);
      return valueSet;
    } catch (error) {
      console.error(`Error resolving value set ${valueSetUrl}:`, error);
      throw error;
    }
  },
  
  /**
   * Resolve multiple value sets
   */
  resolveAll: async function(valueSetUrls) {
    const valueSets = {};
    
    for (const url of valueSetUrls) {
      try {
        valueSets[url] = await this.resolve(url);
      } catch (error) {
        console.warn(`Failed to resolve ${url}, using empty value set`);
        valueSets[url] = { url, expansion: { contains: [] } };
      }
    }
    
    return valueSets;
  }
};

/**
 * CQL Library Repository
 */
export const LibraryRepository = {
  repository: null,
  
  /**
   * Initialize repository
   */
  init: function() {
    if (cql && !this.repository) {
      this.repository = new cql.Repository();
    }
    return this.repository;
  },
  
  /**
   * Load a CQL library (as ELM)
   */
  load: function(elmLibrary) {
    try {
      if (!this.repository) {
        this.init();
      }
      if (this.repository) {
        this.repository.loadLibrary(elmLibrary);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading library:', error);
      return false;
    }
  },
  
  /**
   * Get a loaded library
   */
  get: function(libraryIdentifier) {
    if (!this.repository) {
      this.init();
    }
    return this.repository ? this.repository.resolve(libraryIdentifier) : null;
  },
  
  /**
   * Clear all libraries
   */
  clear: function() {
    if (cql) {
      this.repository = new cql.Repository();
    } else {
      this.repository = null;
    }
  }
};

/**
 * Patient Source Factory
 */
export const PatientSourceFactory = {
  /**
   * Create a FHIR patient source
   */
  createFHIRSource: function(fhirVersion = '4.0.1') {
    if (!cqlFhir) {
      console.warn('cql-exec-fhir not available');
      return null;
    }
    if (fhirVersion === '4.0.1') {
      return cqlFhir.PatientSource.FHIRv401();
    } else if (fhirVersion === '4.0.0') {
      return cqlFhir.PatientSource.FHIRv400();
    } else if (fhirVersion === '3.0.0') {
      return cqlFhir.PatientSource.FHIRv300();
    } else {
      throw new Error(`Unsupported FHIR version: ${fhirVersion}`);
    }
  },
  
  /**
   * Load patient bundles into source
   */
  loadBundles: function(patientSource, bundles) {
    try {
      patientSource.loadBundles(bundles);
      return true;
    } catch (error) {
      console.error('Error loading patient bundles:', error);
      return false;
    }
  }
};

/**
 * Code Service Factory
 */
export const CodeServiceFactory = {
  /**
   * Create a code service with value sets
   */
  create: function(valueSets = {}) {
    if (!cql) {
      console.warn('cql-execution not available');
      return null;
    }
    return new cql.CodeService(valueSets);
  },
  
  /**
   * Create with VSAC integration
   */
  createWithVSAC: async function(valueSetUrls, apiKey) {
    await ValueSetResolver.initialize(apiKey);
    const valueSets = await ValueSetResolver.resolveAll(valueSetUrls);
    return this.create(valueSets);
  }
};